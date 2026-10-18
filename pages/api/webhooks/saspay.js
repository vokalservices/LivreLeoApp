/**
 * pages/api/webhooks/saspay.js
 * Webhook SasPay — réécriture 2026-10 conforme SaasPay/SKILL.md §6 :
 *
 *  1. Rejeter si X-Webhook-Timestamp s'écarte de > 300 s de l'horloge.
 *  2. Recalculer HMAC SHA-256 (hex MINUSCULES) sur « {timestamp}.{corps BRUT} »
 *     avec SASPAY_WEBHOOK_SECRET, comparaison en temps constant.
 *     → Si le secret est configuré, les headers de signature sont OBLIGATOIRES
 *       (sinon n'importe qui peut forger une livraison gratuite).
 *  3. Événements du catalogue (rien d'inventé) : transaction.created /
 *     transaction.success / transaction.failed / transaction.cancelled /
 *     webhook.test — les autres sont journalisés puis acceptés (2xx).
 *  4. Idempotence : un événement peut être livré plusieurs fois ; la livraison
 *     « une seule fois » est garantie par l'unicité CÔTÉ BASE
 *     (Order.saspayRef @unique = transaction_id SasPay).
 *  5. Le payload de transaction.* ne contient PAS d'e-mail client « natif » :
 *     l'identité vient de data.metadata (orderRef/email/productId que NOUS
 *     avons envoyés à la création de session) et de la table SasPayCheckout.
 *  6. Vercel gèle la fonction après la réponse : le traitement (commande +
 *     e-mail) est ATTENDU avant de répondre 2xx.
 */

import crypto from 'crypto';
import prisma from '../../../lib/prisma';
import { sendOrderConfirmation } from '../../../lib/mailer';

export const config = {
  api: {
    bodyParser: false, // corps BRUT requis pour la signature
  },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function timingSafeHexEqual(a, b) {
  const bufA = Buffer.from(String(a).toLowerCase(), 'hex');
  const bufB = Buffer.from(String(b).toLowerCase(), 'hex');
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const headerEvent = req.headers['x-webhook-event'];
  const webhookSecret = (process.env.SASPAY_WEBHOOK_SECRET || '').trim();

  // ── 1. Âge du timestamp (AVANT la signature, ordre imposé par la doc) ───
  if (!timestamp) {
    if (webhookSecret) {
      console.error('[SasPay Webhook] Rejeté : X-Webhook-Timestamp absent.');
      return res.status(401).json({ error: 'Missing webhook timestamp header' });
    }
  } else {
    const tsSec = parseInt(timestamp, 10);
    const nowSec = Math.floor(Date.now() / 1000);
    if (Number.isNaN(tsSec) || Math.abs(nowSec - tsSec) > 300) {
      console.warn('[SasPay Webhook] Horodatage invalide/expiré.');
      return res.status(400).json({ error: 'Timestamp expired or invalid' });
    }
  }

  // ── 2. Signature HMAC sur le corps brut — obligatoire si secret configuré ─
  if (webhookSecret) {
    if (!signature) {
      console.error('[SasPay Webhook] Rejeté : X-Webhook-Signature absent.');
      return res.status(401).json({ error: 'Missing webhook signature headers' });
    }
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(Buffer.concat([Buffer.from(`${timestamp}.`, 'utf8'), rawBody]))
      .digest('hex');
    if (!timingSafeHexEqual(signature, expected)) {
      console.error('[SasPay Webhook] Signature invalide.');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
  } else {
    // Sans secret on ne peut RIEN vérifier : on refuse plutôt que d'accepter
    // des commandes forgées (fail-closed). Configurer SASPAY_WEBHOOK_SECRET.
    console.error('[SasPay Webhook] SASPAY_WEBHOOK_SECRET absent — webhook refusé (fail-closed).');
    return res.status(503).json({ error: 'Webhook secret not configured' });
  }

  // ── 3. Corps JSON ────────────────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const event = headerEvent || payload.event;
  const data = payload.data || {};
  console.log(`[SasPay Webhook] Événement : ${event} (tx ${String(data.id || '').slice(0, 8)})`);

  // ── Test dashboard ───────────────────────────────────────────────────────
  if (event === 'webhook.test') {
    return res.status(200).json({ received: true, test: true });
  }

  // ── transaction.created : rattacher la transaction à la session ─────────
  if (event === 'transaction.created') {
    await linkTransaction(data).catch((e) => console.warn('[SasPay Webhook] link created:', e.message));
    return res.status(200).json({ received: true });
  }

  // ── transaction.failed / transaction.cancelled : statut terminal négatif ─
  //    (CANCELLED n'est pas documenté comme atteignable aujourd'hui ; on le
  //    traite comme terminal non réussi, sans le supposer.)
  if (event === 'transaction.failed' || event === 'transaction.cancelled') {
    await linkTransaction(data, 'FAILED').catch((e) => console.warn('[SasPay Webhook] link failed:', e.message));
    return res.status(200).json({ received: true });
  }

  // ── transaction.success : LIVRER, une seule fois (unicité côté base) ────
  if (event === 'transaction.success') {
    const transactionId = String(data.id || data.transaction_id || '');
    if (!transactionId) {
      console.error('[SasPay Webhook] transaction.success sans id — ignoré.');
      return res.status(200).json({ received: true });
    }

    const metadata = data.metadata || {};
    const orderRef = metadata.orderRef ? String(metadata.orderRef) : null;
    const amounts = data.amounts || {};

    // Identité : metadata (envoyée par nous) puis ligne SasPayCheckout.
    let checkout = null;
    try {
      if (orderRef) {
        checkout = await prisma.sasPayCheckout.findUnique({ where: { orderRef } });
      }
      if (!checkout && data.checkout_session) {
        checkout = await prisma.sasPayCheckout.findUnique({ where: { id: String(data.checkout_session) } });
      }
    } catch (err) {
      console.warn('[SasPay Webhook] lecture SasPayCheckout:', err.message);
    }

    const email = String(metadata.email || checkout?.email || '').toLowerCase() || null;
    const productIdStr = String(metadata.productId || checkout?.productId || 'pack');
    const isSpecial = productIdStr === 'pack' || productIdStr === 'combo';
    const dbProductId = isSpecial ? 1 : (Number(productIdStr) > 0 ? Number(productIdStr) : 1);
    const amount = Number(
      amounts.requested ?? metadata.finalPrice ?? checkout?.finalPrice ?? data.amount ?? 0
    );

    // Cohérence des montants (comptabilité : charged/net, jamais amount seul).
    const netAmount = amounts.net != null ? Number(amounts.net) : (data.net_amount != null ? Number(data.net_amount) : null);
    const chargedAmount = amounts.charged != null ? Number(amounts.charged) : (data.debited_amount != null ? Number(data.debited_amount) : null);
    if (amount > 0 && chargedAmount != null && Math.abs(chargedAmount - amount) > 1) {
      console.warn(`[SasPay Webhook] Écart montant : attendu ${amount}, débité ${chargedAmount} (tx ${transactionId}).`);
    }

    try {
      // Idempotence DB : une seule commande par transaction SasPay.
      const existing = await prisma.order.findUnique({ where: { saspayRef: transactionId } });
      if (existing) {
        console.log(`[SasPay Webhook] Commande #${existing.id} déjà livrée pour tx ${transactionId.slice(0, 8)} — événement dupliqué ignoré.`);
      } else {
        const order = await prisma.order.create({
          data: {
            productId: dbProductId,
            amount,
            email: email || 'client_saspay@inconnu.local',
            country: data.country_code || checkout?.country || null,
            countryCode: data.country_code || null,
            saspayRef: transactionId,
          },
        });
        console.log(`[SasPay Webhook] Commande #${order.id} créée (tx ${transactionId.slice(0, 8)}, ${amount} FCFA, ${email || 'sans e-mail'}).`);

        // E-mail de livraison — ATTENDU avant la réponse (gel Vercel).
        if (email) {
          try {
            await sendOrderConfirmation({
              productId: isSpecial ? productIdStr : dbProductId,
              email,
              amount,
              orderId: order.id,
            });
          } catch (err) {
            console.error('[SasPay Webhook] Erreur envoi e-mail:', err.message);
          }
        } else {
          console.error('[SasPay Webhook] E-mail client introuvable (metadata absente) — livraison par e-mail impossible pour tx', transactionId);
        }
      }

      // Statut session → PAID + champs comptables.
      if (checkout) {
        await prisma.sasPayCheckout.update({
          where: { orderRef: checkout.orderRef },
          data: { status: 'PAID', transactionId, netAmount, chargedAmount },
        }).catch(() => {});
      }
    } catch (err) {
      if (err.code === 'P2002') {
        console.log('[SasPay Webhook] Commande déjà présente (contrainte unique) — livraison unique respectée.');
      } else {
        console.error('[SasPay Webhook] Erreur traitement commande:', err);
        // 500 → SasPay réessaiera ; l'idempotence DB protège du doublon.
        return res.status(500).json({ error: 'Order processing error' });
      }
    }

    return res.status(200).json({ received: true });
  }

  // ── Événements inconnus (settlement.*, wallet_transfer.*) : 2xx + log ───
  console.log(`[SasPay Webhook] Événement non traité (accepté) : ${event}`);
  return res.status(200).json({ received: true });
}

/** Rattache transactionId/statut à la ligne SasPayCheckout correspondante. */
async function linkTransaction(data, statusOverride = null) {
  const transactionId = String(data.id || '');
  if (!transactionId) return;
  const orderRef = data.metadata?.orderRef ? String(data.metadata.orderRef) : null;
  const sessionId = data.checkout_session ? String(data.checkout_session) : null;
  let checkout = null;
  if (orderRef) checkout = await prisma.sasPayCheckout.findUnique({ where: { orderRef } });
  if (!checkout && sessionId) checkout = await prisma.sasPayCheckout.findUnique({ where: { id: sessionId } });
  if (!checkout) return;
  await prisma.sasPayCheckout.update({
    where: { orderRef: checkout.orderRef },
    data: {
      transactionId,
      status: statusOverride || (data.status === 'SUCCESS' ? 'PAID' : data.status === 'FAILED' ? 'FAILED' : checkout.status),
    },
  });
}
