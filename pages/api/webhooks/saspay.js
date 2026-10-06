/**
 * pages/api/webhooks/saspay.js
 * Webhook SasPay — confirmation des paiements côté serveur
 * Reçoit les événements SasPay (ex: transaction.success, webhook.test)
 */

import crypto from 'crypto';
import prisma from '../../../lib/prisma';
import { sendOrderConfirmation } from '../../../lib/mailer';

// Désactiver le bodyParser pour avoir le raw body nécessaire à la vérification de la signature HMAC
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const eventName = req.headers['x-webhook-event'];

  // 1. Rejeter si X-Webhook-Timestamp s'écarte de plus de 300 secondes de l'horloge
  if (timestamp) {
    const nowSec = Math.floor(Date.now() / 1000);
    const tsSec = parseInt(timestamp, 10);
    if (isNaN(tsSec) || Math.abs(nowSec - tsSec) > 300) {
      console.warn('[SasPay Webhook] Horodatage expiré ou invalide:', timestamp);
      return res.status(400).json({ error: 'Timestamp expired or invalid' });
    }
  }

  // 2. Vérification de la signature HMAC si le secret est configuré
  const webhookSecret = process.env.SASPAY_WEBHOOK_SECRET;
  if (webhookSecret && signature && timestamp) {
    try {
      const signedPayload = Buffer.concat([
        Buffer.from(`${timestamp}.`, 'utf8'),
        rawBody,
      ]);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret.trim())
        .update(signedPayload)
        .digest('hex');

      const sigBuffer = Buffer.from(signature.toLowerCase(), 'hex');
      const expectedBuffer = Buffer.from(expectedSignature.toLowerCase(), 'hex');

      if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        console.error('[SasPay Webhook] Signature invalide');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    } catch (err) {
      console.error('[SasPay Webhook] Erreur vérification signature:', err.message);
      return res.status(400).json({ error: 'Signature verification error' });
    }
  }

  let payload = {};
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const event = eventName || payload.event;
  console.log(`[SasPay Webhook] Événement reçu : ${event}`);

  // Test de webhook depuis le dashboard SasPay
  if (event === 'webhook.test') {
    return res.status(200).json({ received: true, test: true });
  }

  // Paiement réussi
  if (event === 'transaction.success') {
    const data = payload.data || {};
    const amount = parseFloat(data.net_amount || data.amount || data.debited_amount || 0);
    const email = data.customer?.email || data.customer_email || 'client_saspay@example.com';
    const metadata = data.metadata || {};
    const rawProductId = metadata.productId || (amount >= 30 ? 'combo' : (amount >= 15 ? 'pack' : 1));

    try {
      // Idempotence : vérifier si la commande existe déjà
      const isSpecial = rawProductId === 'pack' || rawProductId === 'combo';
      const dbProductId = isSpecial ? 1 : Number(rawProductId);

      const existing = await prisma.order.findFirst({
        where: {
          productId: dbProductId,
          email,
          amount,
        },
      });

      if (!existing) {
        const order = await prisma.order.create({
          data: {
            productId: dbProductId,
            amount,
            email,
            country: data.country || 'FR',
          },
        });

        console.log(`[SasPay Webhook] Commande créée : #${order.id} pour ${email} (${amount}€)`);

        // Envoi du mail de confirmation avec les fichiers
        sendOrderConfirmation({
          productId: rawProductId,
          email,
          amount,
          orderId: order.id,
        }).catch(err => console.error('[SasPay Webhook] Erreur envoi email:', err.message));
      } else {
        console.log(`[SasPay Webhook] Commande déjà enregistrée pour ${email}`);
      }
    } catch (err) {
      console.error('[SasPay Webhook] Erreur traitement commande:', err);
    }
  }

  return res.status(200).json({ received: true });
}
