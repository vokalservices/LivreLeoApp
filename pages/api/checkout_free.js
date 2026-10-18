/**
 * pages/api/checkout_free.js
 * POST /api/checkout_free — commande 100 % gratuite via coupon.
 *
 * Réécriture 2026-10 (audit) :
 *  - Le prix de base est résolu CÔTÉ SERVEUR (lib/pricing.js), jamais depuis
 *    le montant envoyé par le client.
 *  - La gratuité n'est accordée QUE si validateCoupon(code, base) renvoie
 *    finalPrice === 0 (coupon 100 % ou fixe ≥ base). Avant, N'IMPORTE QUEL
 *    coupon actif (même −10 %) ouvrait le flux gratuit.
 *  - usageCount est décrémenté de façon atomique (limite d'usage respectée).
 *  - La commande est créée ICI (avec e-mail de livraison attendu), la page
 *    /success ne fait plus qu'afficher les accès.
 */

import crypto from 'crypto';
import prisma from '../../lib/prisma';
import { validateCoupon } from '../../lib/coupon-validator';
import { resolveProduct } from '../../lib/pricing';
import { sendOrderConfirmation } from '../../lib/mailer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { coupon, bookId, email, productId } = req.body || {};

  if (!coupon) {
    return res.status(400).json({ error: 'Code promo manquant.' });
  }
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(cleanEmail)) {
    return res.status(400).json({ error: 'Adresse e-mail invalide.' });
  }

  // 1. Base serveur : productId prioritaire, sinon bookId (tome).
  const product = await resolveProduct({ productId: productId ?? bookId });

  // 2. Validation du coupon sur la vraie base.
  const validation = await validateCoupon(String(coupon).trim().toUpperCase(), product.basePrice);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  if (Math.round(validation.finalPrice) !== 0) {
    return res.status(422).json({
      error: 'Ce code ne rend pas la commande gratuite. Finalisez l’achat avec le bouton de paiement.',
      finalPrice: Math.round(validation.finalPrice),
    });
  }

  try {
    // 3. Décrément atomique du compteur d'usage (avec garde anti-dépassement).
    const couponRow = await prisma.coupon.updateMany({
      where: {
        code: validation.coupon.code,
        OR: [{ usageLimit: null }, { usageCount: { lt: validation.coupon.usageLimit ?? 0 } }],
      },
      data: { usageCount: { increment: 1 } },
    });
    if (couponRow.count === 0) {
      return res.status(409).json({ error: 'Ce code promo a atteint sa limite d’utilisation.' });
    }

    // 4. Commande gratuite tracée (saspayRef unique « free-… »).
    const orderRef = `free-${crypto.randomUUID()}`;
    const order = await prisma.order.create({
      data: {
        productId: product.dbProductId,
        amount: 0,
        email: cleanEmail,
        saspayRef: orderRef,
      },
    });

    // 5. Livraison par e-mail (attendue avant réponse).
    try {
      await sendOrderConfirmation({
        productId: product.resolvedId === 'single' ? product.dbProductId : product.resolvedId,
        email: cleanEmail,
        amount: 0,
        orderId: order.id,
      });
    } catch (err) {
      console.error('[checkout_free] Erreur e-mail:', err.message);
    }

    const enc = encodeURIComponent(cleanEmail);
    return res.status(200).json({
      url: `/success?provider=free&orderRef=${orderRef}&productId=${product.resolvedId}&amount=0&email=${enc}`,
    });
  } catch (err) {
    console.error('[checkout_free]', err);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}
