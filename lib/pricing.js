/**
 * lib/pricing.js — Source de vérité des prix (100 % FCFA / XOF).
 *
 * RÈGLE D'OR (audit SasPay 2026-10) : le prix final est TOUJOURS recalculé
 * côté serveur (catalogue + base de données + validateCoupon). Le client
 * n'est jamais une autorité sur le montant. Aucun flottant envoyé à SasPay :
 * uniquement des chaînes décimales ("6500.00").
 */

import prisma from './prisma';

/** Tarifs catalogue en FCFA (alignés sur lib/productsData.js et la base). */
export const CATALOG_XOF = {
  single: 1300, // un tome
  pack: 6500,   // Pack Intégral 6 tomes FR
  combo: 9900,  // Pack Combo 12 livres FR + EN
};

/**
 * Résout le produit et son prix de BASE côté serveur.
 * @param {{productId?: string|number, isPack?: boolean, isCombo?: boolean}} input
 * @returns {Promise<{resolvedId: string, title: string, basePrice: number, dbProductId: number}>}
 */
export async function resolveProduct(input = {}) {
  const { productId, isPack, isCombo } = input;

  if (isCombo || String(productId) === 'combo') {
    return {
      resolvedId: 'combo',
      title: 'Pack Combo 12 Livres (FR + EN) — Les Aventures de Léo',
      basePrice: CATALOG_XOF.combo,
      dbProductId: 1, // les packs n'ont pas de ligne Product ; rattachés au tome 1
    };
  }
  if (isPack || String(productId) === 'pack') {
    return {
      resolvedId: 'pack',
      title: 'Pack Intégral 6 Tomes — Les Aventures de Léo',
      basePrice: CATALOG_XOF.pack,
      dbProductId: 1,
    };
  }

  const numId = Number(productId);
  let product = null;
  if (Number.isInteger(numId) && numId > 0) {
    try {
      product = await prisma.product.findUnique({ where: { id: numId } });
    } catch (err) {
      console.warn('[pricing] lecture produit impossible:', err.message);
    }
  }

  // Garde anti-résidus EUR : tout prix < 500 en base est un vestige de la
  // migration (ex. 1.99 €) → on retombe sur le tarif catalogue FCFA.
  const basePrice =
    product && Number(product.price) >= 500
      ? Math.round(Number(product.price))
      : CATALOG_XOF.single;

  return {
    resolvedId: product ? String(product.id) : 'single',
    title: product?.title || 'Livre — Les Aventures de Léo',
    basePrice,
    dbProductId: product ? product.id : 1,
  };
}

/**
 * Formate un montant FCFA en chaîne décimale conforme SasPay ("6500.00").
 * Arrondi entier FCFA (la devise n'utilise pas de centimes en pratique).
 * @param {number|string} xof
 * @returns {string}
 */
export function toAmountString(xof) {
  const n = Math.round(Number(xof));
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Montant FCFA invalide : ${xof}`);
  }
  return n.toFixed(2);
}
