/**
 * pages/api/saspay/create-checkout.js
 * Crée une session de checkout hébergée SasPay pour le paiement Mobile Money & Carte en Afrique francophone.
 * Spécification OpenAPI SasPay : POST https://api.saspay.me/api/v1/checkout-sessions/
 *
 * IMPORTANT: On utilise exclusivement le checkout hébergé SasPay (et non softpay direct)
 * pour que le client puisse choisir n'importe quel mode de paiement disponible
 * (Wave, Orange Money, MTN MoMo, Moov, Carte bancaire, Djamo, etc.)
 * sans qu'un réseau indisponible bloque tout le flux.
 */

const SASPAY_BASE_URL = 'https://api.saspay.me/api/v1';
import crypto from 'crypto';

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

  const {
    book,
    isPack,
    isCombo,
    customerEmail,
    customerName,
    customerPhone,
    country,
  } = req.body || {};

  // Stratégie 100% Afrique Francophone : Prix fixés en FCFA (XOF)
  let amountStr = '1300.00';
  let title = 'Livre — Les Aventures de Léo';
  let productId = 'single';

  if (isCombo) {
    amountStr = '9900.00';
    title = 'Pack Combo 12 Livres (FR + EN) — Les Aventures de Léo';
    productId = 'combo';
  } else if (isPack) {
    amountStr = '6500.00';
    title = 'Pack Intégral 6 Tomes — Les Aventures de Léo';
    productId = 'pack';
  } else if (book) {
    productId = String(book.id || 'single');
    title = book.title || 'Livre — Les Aventures de Léo';
    const numPrice = Number(book.price);
    if (numPrice && numPrice > 0) {
      amountStr = Math.round(numPrice >= 500 ? numPrice : 1300).toFixed(2);
    } else {
      amountStr = '1300.00';
    }
  }

  // Déterminer l'URL d'origine pour la redirection de succès
  const origin = req.headers.origin
    || (process.env.NEXT_PUBLIC_BASE_URL ? process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '') : null)
    || `https://${req.headers.host}`;

  const cleanEmail = (customerEmail && customerEmail.includes('@')) ? customerEmail.trim() : 'client@ngsafrique.com';
  const cleanName = (customerName && customerName.trim().length > 0) ? customerName.trim() : 'Parent Lecteur';

  // Formatage propre du téléphone si fourni : enlever espaces, tirets, etc.
  let cleanPhone = (customerPhone || '').toString().trim().replace(/[\s\-\.\(\)]/g, '');
  if (cleanPhone && !cleanPhone.startsWith('+')) {
    cleanPhone = `+${cleanPhone}`;
  }

  const cleanCountry = (country || '').toString().trim().toUpperCase().slice(0, 2);

  const returnUrl = `${origin}/success?productId=${productId}&amount=${amountStr}&currency=XOF&provider=saspay`;

  // Préparation du payload selon la spécification OpenAPI SasPay /checkout-sessions/
  // On N'ENVOIE PAS le champ "country" pour laisser SasPay proposer TOUS les réseaux
  // disponibles au client sur sa page de checkout. Si on fixe country à "NE" et qu'Airtel Niger
  // est en panne, le client ne peut plus payer du tout.
  const payload = {
    amount: amountStr,
    currency: 'XOF',
    description: title,
    customer_email: cleanEmail,
    customer_name: cleanName,
    return_url: returnUrl,
    metadata: {
      productId,
      isPack: !!isPack,
      isCombo: !!isCombo,
      currency: 'XOF',
      email: cleanEmail,
      phone: cleanPhone || '',
      country: cleanCountry || '',
      source: 'saspay_afrique_francophone',
    },
  };

  // Ajouter le téléphone s'il est valide (permet au checkout de pré-remplir)
  if (cleanPhone && cleanPhone.length >= 8) {
    payload.customer_phone = cleanPhone;
  }

  // NE PAS forcer le country dans le payload principal pour éviter de bloquer
  // le paiement si un réseau de ce pays est indisponible.
  // Le checkout hébergé SasPay détermine automatiquement les réseaux disponibles.

  try {
    const response = await fetch(`${SASPAY_BASE_URL}/checkout-sessions/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
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
