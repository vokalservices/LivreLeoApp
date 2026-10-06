/**
 * pages/api/saspay/create-checkout.js
 * Crée une session de checkout hébergée SasPay pour le paiement par Carte Bancaire.
 * Spécification OpenAPI SasPay : POST https://api.saspay.me/api/v1/checkout-sessions/
 */

const SASPAY_BASE_URL = 'https://api.saspay.me/api/v1';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const apiKey = process.env.SASPAY_API_KEY;
  if (!apiKey) {
    console.error('[SasPay] Clé API SASPAY_API_KEY manquante dans les variables d\'environnement.');
    return res.status(500).json({
      error: 'Clé API SasPay non configurée. Veuillez renseigner SASPAY_API_KEY dans votre fichier .env.local ou les paramètres Vercel.',
    });
  }

  const { book, isPack, isCombo, customerEmail, customerName } = req.body || {};

  // Validation stricte des prix officiels harmonisés
  let price = 4.99;
  let title = 'Livre — Les Aventures de Léo';
  let productId = 'single';

  if (isCombo) {
    price = 30.99;
    title = 'Pack Combo 12 Livres (FR + EN) — Les Aventures de Léo';
    productId = 'combo';
  } else if (isPack) {
    price = 16.49;
    title = 'Pack Intégral 6 Tomes — Les Aventures de Léo';
    productId = 'pack';
  } else if (book) {
    price = Number(book.price) || 4.99;
    title = book.title || 'Livre — Les Aventures de Léo';
    productId = String(book.id || 'single');
  }

  if (price <= 0) {
    return res.status(400).json({ error: 'Montant invalide pour SasPay.' });
  }

  // Règle SasPay : montants strictement sous forme de chaîne décimale (ex: "16.49")
  const amountStr = price.toFixed(2);

  // Déterminer l'URL d'origine pour la redirection
  const origin = req.headers.origin
    || (process.env.NEXT_PUBLIC_BASE_URL ? process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '') : null)
    || `http://${req.headers.host}`;

  const returnUrl = `${origin}/success?productId=${productId}&amount=${amountStr}&provider=saspay`;

  // Préparation du payload selon la spécification OpenAPI /checkout-sessions/
  const payload = {
    amount: amountStr,
    currency: 'EUR',
    description: title,
    country: 'FR',
    customer_email: (customerEmail && customerEmail.includes('@')) ? customerEmail.trim() : 'client@livre-leo.com',
    customer_name: (customerName && customerName.trim().length > 0) ? customerName.trim() : 'Parent Lecteur',
    return_url: returnUrl,
    metadata: {
      productId,
      isPack: !!isPack,
      isCombo: !!isCombo,
      source: 'carte_bancaire_web',
    },
  };

  try {
    const response = await fetch(`${SASPAY_BASE_URL}/checkout-sessions/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const raw = await response.json().catch(() => null);

    if (!response.ok) {
      console.error('[SasPay] Erreur création checkout session:', response.status, raw);
      const errorMessage = raw?.error?.message
        || raw?.message
        || (raw && typeof raw === 'object' ? JSON.stringify(raw) : 'Erreur de paiement SasPay');
      return res.status(response.status).json({
        error: `Erreur SasPay (${response.status}) : ${errorMessage}`,
        details: raw,
      });
    }

    // SasPay enveloppe ses réponses réussies dans { success: true, data: { ... } }
    const session = raw?.data || raw || {};
    const checkoutUrl = session?.checkout_url || raw?.checkout_url || session?.url || raw?.url;
    const sessionId = session?.id || raw?.id;
    const slug = session?.slug || raw?.slug;

    if (!checkoutUrl) {
      console.error('[SasPay] checkout_url manquant dans la réponse:', raw);
      return res.status(502).json({
        error: 'URL de paiement non reçue de SasPay.',
        details: raw,
      });
    }

    // Définir un cookie de session pour identifier la session lors du retour sur /success
    if (sessionId) {
      res.setHeader('Set-Cookie', `saspay_last_session=${sessionId}; Path=/; Max-Age=7200; SameSite=Lax`);
    }

    return res.status(200).json({
      success: true,
      sessionId,
      checkoutUrl,
      slug,
    });
  } catch (error) {
    console.error('[SasPay] Exception create-checkout:', error);
    return res.status(500).json({ error: error.message || 'Erreur interne de connexion à SasPay.' });
  }
}
