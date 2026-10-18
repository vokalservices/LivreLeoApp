/**
 * pages/api/saspay/verify-session.js
 * GET /api/saspay/verify-session?orderRef=...  (ou ?sessionId=...)
 *
 * Vérifie le statut RÉEL d'un paiement SasPay côté serveur.
 * Règle absolue des guidelines : « Le statut réel vient de
 * GET /payments/{payment_id}/verify/ (ou d'un webhook vérifié), et seul
 * SUCCESS autorise la livraison. » Un retour de redirection ne prouve rien.
 *
 * Résolution de la session, dans l'ordre :
 *   1. orderRef (query)  → table SasPayCheckout (fiable multi-appareils)
 *   2. sessionId (query) → table SasPayCheckout puis appel direct
 *   3. cookie saspay_order_ref / saspay_last_session (secours)
 *
 * paid = true UNIQUEMENT si /payments/{transaction_id}/verify/ renvoie
 * status === 'SUCCESS'. Le statut 'PAID' de la session sans transaction
 * vérifiable reste PENDING (on continue d'attendre le webhook).
 */

import prisma from '../../../lib/prisma';

const SASPAY_BASE_URL = 'https://api.saspay.me/api/v1';

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  const m = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const apiKey = (process.env.SASPAY_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(500).json({ paid: false, error: 'SASPAY_API_KEY non configurée.' });
  }

  // ── Résolution orderRef / sessionId ─────────────────────────────────────
  const orderRef =
    req.query.orderRef || readCookie(req, 'saspay_order_ref') || null;
  const sessionId =
    req.query.sessionId || req.query.session_id || readCookie(req, 'saspay_last_session') || null;

  let row = null;
  try {
    if (orderRef) {
      row = await prisma.sasPayCheckout.findUnique({ where: { orderRef: String(orderRef) } });
    }
    if (!row && sessionId) {
      row = await prisma.sasPayCheckout.findUnique({ where: { id: String(sessionId) } });
    }
  } catch (err) {
    console.warn('[SasPay] verify-session: lecture DB impossible:', err.message);
  }

  const effectiveSessionId = row?.id || (sessionId ? String(sessionId) : null);
  if (!effectiveSessionId) {
    return res.status(400).json({
      paid: false,
      status: 'UNKNOWN',
      error: 'Identifiant de session SasPay manquant (orderRef ou sessionId).',
    });
  }

  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

  try {
    // ── 1. Statut de la session de checkout ───────────────────────────────
    const statusRes = await fetch(
      `${SASPAY_BASE_URL}/checkout-sessions/${encodeURIComponent(effectiveSessionId)}/status/`,
      { method: 'GET', headers }
    );

    if (statusRes.status === 401) {
      console.error('[SasPay] verify-session: 401 — clé invalide, ne pas réessayer.');
      return res.status(502).json({ paid: false, status: 'ERROR', error: 'Clé API SasPay invalide.' });
    }
    if (statusRes.status === 429) {
      return res.status(429).json({ paid: false, status: 'PENDING', error: 'Rate-limit SasPay, réessayez dans quelques secondes.' });
    }
    if (!statusRes.ok) {
      const body = await statusRes.text().catch(() => '');
      console.error('[SasPay] verify-session HTTP', statusRes.status, body.slice(0, 200));
      return res.status(502).json({ paid: false, status: 'UNKNOWN', error: `Statut session illisible (${statusRes.status}).` });
    }

    const statusRaw = await statusRes.json();
    const session = statusRaw?.data || statusRaw || {};
    let transactionId = session.transaction_id || null;

    let paid = false;
    let transactionStatus = session.transaction_status || null;
    let netAmount = null;
    let chargedAmount = null;

    // ── 2. SEULE source de vérité : GET /payments/{id}/verify/ → SUCCESS ──
    if (transactionId) {
      const verifyRes = await fetch(
        `${SASPAY_BASE_URL}/payments/${encodeURIComponent(transactionId)}/verify/`,
        { method: 'GET', headers }
      );
      if (verifyRes.ok) {
        const verifyRaw = await verifyRes.json();
        const payment = verifyRaw?.data || verifyRaw || {};
        transactionStatus = payment.status || transactionStatus;
        if (payment.status === 'SUCCESS') {
          paid = true;
          netAmount = payment.amounts?.net ?? payment.net_amount ?? null;
          chargedAmount = payment.amounts?.charged ?? payment.debited_amount ?? null;
        }
      } else {
        console.warn('[SasPay] verify paiement HTTP', verifyRes.status, '— on reste prudent (non payé).');
      }
    }

    // ── 2b. Secours conforme : « Le statut réel vient de verify/ OU d'un
    // webhook vérifié ». Si notre webhook SIGNÉ a déjà confirmé cette session
    // (row.status === 'PAID'), il fait autorité même si l'API verify tarde.
    if (!paid && row?.status === 'PAID' && row.transactionId) {
      paid = true;
      transactionId = transactionId || row.transactionId;
      transactionStatus = transactionStatus || 'SUCCESS';
      netAmount = netAmount ?? row.netAmount ?? null;
      chargedAmount = chargedAmount ?? row.chargedAmount ?? null;
    }

    // ── 3. Mise à jour de la ligne SasPayCheckout (best effort) ───────────
    if (row) {
      const newStatus = paid ? 'PAID' : /FAILED|CANCELLED/.test(String(transactionStatus || session.status || '')) ? 'FAILED' : row.status;
      try {
        await prisma.sasPayCheckout.update({
          where: { orderRef: row.orderRef },
          data: {
            status: newStatus,
            transactionId: transactionId || row.transactionId,
            netAmount: netAmount != null ? Number(netAmount) : row.netAmount,
            chargedAmount: chargedAmount != null ? Number(chargedAmount) : row.chargedAmount,
          },
        });
      } catch (err) {
        console.warn('[SasPay] verify-session: maj DB échouée:', err.message);
      }
    }

    return res.status(200).json({
      success: true,
      paid,
      status: session.status || null,            // statut session (PENDING/PAID/...)
      transactionStatus,                          // statut paiement (PENDING/SUCCESS/FAILED)
      transactionId,
      orderRef: row?.orderRef || null,
      sessionId: effectiveSessionId,
      productId: row?.productId || null,
      amount: row ? Number(row.finalPrice).toFixed(2) : null, // montant SERVEUR attendu
      email: row?.email || null,
      netAmount: netAmount != null ? Number(netAmount) : null,
      chargedAmount: chargedAmount != null ? Number(chargedAmount) : null,
      currency: 'XOF',
    });
  } catch (error) {
    console.error('[SasPay] Exception verify-session:', error.message);
    return res.status(502).json({ paid: false, status: 'ERROR', error: 'Erreur de vérification SasPay.' });
  }
}
