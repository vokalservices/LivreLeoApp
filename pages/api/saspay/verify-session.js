/**
 * pages/api/saspay/verify-session.js
 * Vérifie le statut réel d'une session de checkout SasPay côté serveur
 * Route : GET /api/saspay/verify-session?sessionId=...
 * Spécification OpenAPI : GET https://api.saspay.me/api/v1/checkout-sessions/{id}/status/
 */

const SASPAY_BASE_URL = 'https://api.saspay.me/api/v1';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const apiKey = process.env.SASPAY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'SASPAY_API_KEY non configurée.' });
  }

  // Récupérer le sessionId depuis query ou cookie
  let sessionId = req.query.sessionId || req.query.session_id || req.query.id;
  if (!sessionId && req.headers.cookie) {
    const match = req.headers.cookie.match(/saspay_last_session=([^;]+)/);
    if (match) sessionId = match[1];
  }

  if (!sessionId) {
    return res.status(400).json({ error: 'Identifiant de session SasPay manquant.' });
  }

  try {
    const response = await fetch(`${SASPAY_BASE_URL}/checkout-sessions/${encodeURIComponent(sessionId)}/status/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[SasPay] Erreur vérification session:', response.status, errText);
      return res.status(response.status).json({
        paid: false,
        error: `Impossible de vérifier la session SasPay (${response.status})`,
      });
    }

    const raw = await response.json();
    const session = raw?.data || raw || {};
    // Exemples de statut retournés : status: "PAID", transaction_status: "SUCCESS"
    const isPaid = session.status === 'PAID' || session.transaction_status === 'SUCCESS';

    return res.status(200).json({
      success: true,
      paid: isPaid,
      status: session.status,
      transactionId: session.transaction_id || null,
      transactionStatus: session.transaction_status || null,
      transactionReference: session.transaction_reference || null,
    });
  } catch (error) {
    console.error('[SasPay] Exception verify-session:', error);
    return res.status(500).json({ paid: false, error: error.message || 'Erreur lors de la vérification' });
  }
}
