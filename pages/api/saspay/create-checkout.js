/**
 * pages/api/saspay/create-checkout.js
 * POST /api/saspay/create-checkout
 *
 * Crée une session de checkout hébergée SasPay (POST /checkout-sessions/).
 * Réécriture 2026-10 — strictement conforme aux guidelines SasPay
 * (SaasPay/SKILL.md + AGENTS.md + docs.saspay.me/api-reference/openapi.json) :
 *
 *  - Le montant est recalculé CÔTÉ SERVEUR (lib/pricing.js) : catalogue + base
 *    de données + validateCoupon(). Le prix envoyé par le client est ignoré.
 *  - Montant en CHAÎNE DÉCIMALE ("6500.00"), jamais de flottant.
 *  - fee_charge_mode = DEDUCTED : le client paie EXACTEMENT le prix affiché
 *    (les frais sont déduits du net reversé au marchand) — plus d'écart
 *    « 6 500 affichés / 6 728 débités ».
 *  - La session est PERSISTÉE en base (SasPayCheckout) dès la création, avec
 *    un orderRef interne qui relie return_url, page /success et webhook.
 *  - Pas d'Idempotency-Key sur /checkout-sessions/ (non requise par la spec ;
 *    elle n'est obligatoire que sur softpay/payouts/wallet-transfers/retry).
 *  - Erreurs classées par code HTTP (400/401/403/404/409/410/422/429).
 *  - Clé API lue depuis l'environnement uniquement (jamais de log de clé).
 */

import crypto from 'crypto';
import prisma from '../../../lib/prisma';
import { validateCoupon } from '../../../lib/coupon-validator';
import { resolveProduct, toAmountString } from '../../../lib/pricing';

const SASPAY_BASE_URL = 'https://api.saspay.me/api/v1';

/** Minimum encaissable par SasPay en XOF (erreur 400 « Le montant minimum est de 200 XOF »). */
const SASPAY_MIN_AMOUNT_XOF = 200;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Libellés d'erreur par code HTTP (checklist guidelines #2). */
const HTTP_ERROR_LABELS = {
  400: 'Requête invalide',
  401: 'Clé API SasPay absente/invalide/expirée — ne pas réessayer',
  403: 'Compte SasPay suspendu ou ressource inaccessible',
  404: 'Ressource introuvable',
  409: 'Conflit — ne pas réexécuter sans vérifier',
  410: 'Session ou lien expiré',
  422: 'Paiement impossible en l’état',
  429: 'Trop de requêtes vers SasPay — réessayez dans une minute',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const apiKey = (process.env.SASPAY_API_KEY || '').trim();
  if (!apiKey) {
    console.error('[SasPay] SASPAY_API_KEY manquante dans l’environnement.');
    return res.status(500).json({
      error: 'Paiement indisponible : clé API SasPay non configurée (SASPAY_API_KEY).',
    });
  }

  const {
    productId,
    isPack,
    isCombo,
    coupon,
    customerEmail,
    customerName,
    customerPhone,
    country,
  } = req.body || {};

  // ── 1. E-mail client (requis par la spec SasPay) ────────────────────────
  const email = String(customerEmail || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Adresse e-mail cliente invalide ou manquante.' });
  }
  const name = String(customerName || '').trim() || 'Parent Lecteur';

  // ── 2. Prix de BASE recalculé côté serveur (jamais confiance au client) ──
  let product;
  try {
    product = await resolveProduct({ productId, isPack, isCombo });
  } catch (err) {
    console.error('[SasPay] resolveProduct:', err.message);
    return res.status(500).json({ error: 'Erreur interne de résolution du produit.' });
  }

  // ── 3. Coupon REVALIDÉ côté serveur sur la vraie base ────────────────────
  const cleanCoupon = String(coupon || '').trim().toUpperCase();
  let finalPrice = product.basePrice;
  if (cleanCoupon) {
    const validation = await validateCoupon(cleanCoupon, product.basePrice);
    if (!validation.valid) {
      return res.status(422).json({ error: validation.error || 'Code promo invalide.' });
    }
    finalPrice = Math.round(validation.finalPrice);
    if (finalPrice <= 0) {
      // Coupon 100 % : hors périmètre SasPay → basculer sur le flux gratuit.
      return res.status(409).json({
        error: 'COUPON_100',
        message: 'Ce code rend la commande gratuite : utilisez l’obtention gratuite.',
      });
    }
    if (finalPrice < SASPAY_MIN_AMOUNT_XOF) {
      // Contrainte réelle de l'API (testée le 2026-10-18) :
      // 400 {"amount":["Le montant minimum est de 200 XOF."]}
      return res.status(422).json({
        error: `Après réduction, le montant (${finalPrice} FCFA) passe sous le minimum encaissable par SasPay (${SASPAY_MIN_AMOUNT_XOF} FCFA). Utilisez ce code sur un produit moins cher ou sans réduction.`,
      });
    }
  }

  let amountStr;
  try {
    amountStr = toAmountString(finalPrice); // chaîne décimale exigée par SasPay
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  // ── 4. Téléphone / pays (optionnels, formatage propre) ──────────────────
  let phone = String(customerPhone || '').trim().replace(/[\s\-.()]/g, '');
  if (phone && !phone.startsWith('+')) phone = `+${phone}`;
  if (phone && phone.length < 8) phone = '';
  const cleanCountry = String(country || '').trim().toUpperCase().slice(0, 2);

  // ── 5. return_url : URL publique exacte, avec orderRef interne ──────────
  //     (APP_URL en priorité ; sinon NEXT_PUBLIC_BASE_URL ; sinon l'origine de
  //     la requête — jamais un domaine hérité.)
  const origin = (
    process.env.APP_URL
    || process.env.NEXT_PUBLIC_BASE_URL
    || `https://${req.headers.host}`
  ).replace(/\/+$/, '');
  const orderRef = crypto.randomUUID();
  const returnUrl = `${origin}/success?provider=saspay&orderRef=${orderRef}`;

  // ── 6. Payload conforme OpenAPI /checkout-sessions/ ──────────────────────
  //     country volontairement NON envoyé : le checkout hébergé propose alors
  //     tous les réseaux disponibles (fix du 1ca0e7a).
  const payload = {
    amount: amountStr,
    currency: 'XOF',
    description: product.title,
    customer_email: email,
    customer_name: name,
    return_url: returnUrl,
    fee_charge_mode: 'DEDUCTED', // frais déduits du net marchand : débité == affiché
    metadata: {
      orderRef,
      productId: product.resolvedId,
      basePrice: product.basePrice,
      finalPrice,
      coupon: cleanCoupon,
      email,
      phone,
      country: cleanCountry,
      source: 'leo_ngsafrique_saspay_v2',
    },
  };
  if (phone) payload.customer_phone = phone;

  // ── 7. Appel SasPay + gestion d'erreurs par code HTTP ────────────────────
  let raw = null;
  let response;
  try {
    response = await fetch(`${SASPAY_BASE_URL}/checkout-sessions/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    raw = await response.json().catch(() => null);
  } catch (err) {
    console.error('[SasPay] Exception réseau create-checkout:', err.message);
    return res.status(502).json({ error: 'Connexion à SasPay impossible. Réessayez dans un instant.' });
  }

  if (!response.ok) {
    // Enveloppes d'erreur SasPay : métier {"success":false,"error":{...}}
    // ou validation {"champ":["message"]}. On ne loggue JAMAIS la clé.
    const detail =
      raw?.error?.message
      || (raw && typeof raw === 'object' ? JSON.stringify(raw).slice(0, 400) : '')
      || 'Erreur SasPay';
    console.error('[SasPay] create-checkout HTTP', response.status, detail);
    const label = HTTP_ERROR_LABELS[response.status] || 'Erreur SasPay';
    const status = response.status >= 500 ? 502 : response.status;
    return res.status(status).json({ error: `${label} (${response.status}) : ${detail}` });
  }

  // Réponse réussie enveloppée : {"success":true,"data":{...},"code":200}
  const session = raw?.data || raw || {};
  const sessionId = session.id;
  const checkoutUrl = session.checkout_url || session.url;
  if (!sessionId || !checkoutUrl) {
    console.error('[SasPay] Réponse sans id/checkout_url. Clés reçues :', Object.keys(session));
    return res.status(502).json({ error: 'Réponse SasPay incomplète (checkout_url manquant).' });
  }

  // ── 8. Persistance de la session dès la création (guideline SKILL.md) ────
  try {
    await prisma.sasPayCheckout.create({
      data: {
        id: String(sessionId),
        orderRef,
        slug: session.slug ? String(session.slug) : null,
        productId: product.resolvedId,
        basePrice: product.basePrice,
        finalPrice,
        coupon: cleanCoupon || null,
        email,
        phone: phone || null,
        country: cleanCountry || null,
      },
    });
  } catch (err) {
    // Non bloquant pour l'encaissement, mais la réconciliation webhook
    // reposera alors uniquement sur metadata.orderRef.
    console.error('[SasPay] Persistance SasPayCheckout échouée:', err.message);
  }

  // Cookie de secours (le return_url porte déjà orderRef).
  res.setHeader(
    'Set-Cookie',
    `saspay_order_ref=${orderRef}; Path=/; Max-Age=7200; SameSite=Lax; Secure`
  );

  return res.status(200).json({
    success: true,
    sessionId,
    orderRef,
    slug: session.slug || null,
    checkoutUrl,
    amount: amountStr,          // montant SERVEUR — le front affiche celui-ci
    productId: product.resolvedId,
    feeChargeMode: 'DEDUCTED',
  });
}
