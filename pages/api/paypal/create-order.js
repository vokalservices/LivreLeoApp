/**
 * pages/api/paypal/create-order.js
 * Crée une commande PayPal via l'API REST v2 (sans SDK tiers)
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

  const { book, isCombo, isPack } = req.body;
  if (book?.price === undefined || book?.price === null || !book?.title) {
    return res.status(400).json({ error: 'Missing book info' });
  }
  // Prix 0 → pas de passage par PayPal, le client doit appeler checkout_free
  if (Number(book.price) <= 0) {
    return res.status(400).json({ error: 'Prix invalide pour PayPal. Utilisez le flux gratuit.' });
  }

  // Prix déjà en EUR
  const amountEur = Number(book.price).toFixed(2);

  const origin = req.headers.origin || `http://${req.headers.host}`;

  // PayPal ajoute automatiquement ?token=XXX&PayerID=XXX à l'URL de retour
  const returnUrl = isCombo
    ? `${origin}/success?productId=combo&amount=${book.price}&provider=paypal`
    : `${origin}/success?productId=${book.id}&amount=${book.price}&provider=paypal`;

  const cancelUrl = isCombo
    ? `${origin}/pack?combo=1`
    : isPack
      ? `${origin}/pack`
      : `${origin}/books/${book.id}`;

  try {
    const accessToken = await getAccessToken();

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
        'PayPal-Request-Id': `fusee-carton-${Date.now()}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'EUR',
            value: amountEur,
          },
          description: book.title,
          custom_id: String(book.id || 'pack'),
        }],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name:          'Fusée Carton',
              landing_page:        'NO_PREFERENCE',
              user_action:         'PAY_NOW',
              return_url:          returnUrl,
              cancel_url:          cancelUrl,
              shipping_preference: 'NO_SHIPPING',
            },
          },
        },
      }),
    });

    if (!orderRes.ok) {
      const errBody = await orderRes.text();
      console.error('[PayPal] create-order error:', errBody);
      // Renvoyer le détail de l'erreur PayPal au client pour faciliter le debug
      let detail = 'PayPal order creation failed';
      try {
        const parsed = JSON.parse(errBody);
        detail = parsed.message || parsed.error_description || detail;
      } catch {}
      return res.status(500).json({ error: detail, raw: errBody });
    }

    const order      = await orderRes.json();
    const approveUrl = order.links?.find(l => l.rel === 'payer-action')?.href
                    || order.links?.find(l => l.rel === 'approve')?.href;

    res.status(200).json({ orderId: order.id, approveUrl });
  } catch (err) {
    console.error('[PayPal] create-order exception:', err.message);
    res.status(500).json({ error: err.message || 'PayPal order creation failed' });
  }
}
