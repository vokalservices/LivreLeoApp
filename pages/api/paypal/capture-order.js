/**
 * pages/api/paypal/capture-order.js
 * Capture le paiement PayPal via l'API REST v2 (sans SDK tiers)
 */

const PAYPAL_API = (process.env.PAYPAL_ENV === 'production' || process.env.PAYPAL_ENV === 'live')
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const clientId     = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const credentials  = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Missing PayPal token' });

  try {
    const accessToken = await getAccessToken();

    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!captureRes.ok) {
      const errBody = await captureRes.text();
      console.error('[PayPal] capture error:', errBody);
      return res.status(402).json({ error: 'PayPal capture failed' });
    }

    const capture   = await captureRes.json();
    const status    = capture.status;

    if (status === 'COMPLETED') {
      const unit      = capture.purchase_units?.[0];
      const productId = unit?.custom_id || null;
      const amountEur = parseFloat(unit?.payments?.captures?.[0]?.amount?.value || '0');
      // Récupérer l'email du payeur depuis la réponse PayPal
      const payerEmail = capture.payer?.email_address || null;

      res.status(200).json({
        success:    true,
        productId,
        amountEur,
        payerEmail,
        captureId:  unit?.payments?.captures?.[0]?.id,
      });
    } else {
      res.status(402).json({ error: `Payment not completed: ${status}` });
    }
  } catch (err) {
    console.error('[PayPal] capture exception:', err.message);
    res.status(500).json({ error: 'PayPal capture failed' });
  }
}
