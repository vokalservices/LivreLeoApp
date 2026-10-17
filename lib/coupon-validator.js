import prisma from './prisma';

/**
 * Validates a coupon code and returns the validation result.
 * @param {string} code - The coupon code to validate.
 * @param {number} [basePrice] - Optional base price to calculate final price.
 * @returns {Promise<{valid: boolean, error?: string, coupon?: any, discount?: number, finalPrice?: number}>}
 */
export async function validateCoupon(code, basePrice = 0) {
  if (!code) {
    return { valid: false, error: 'Code promo manquant.' };
  }

  const normalizedCode = code.toUpperCase().trim();

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon || !coupon.active) {
      return { valid: false, error: 'Code promo invalide ou inactif.' };
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { valid: false, error: 'Ce code promo a expiré.' };
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, error: 'Ce code promo a atteint sa limite d\'utilisation.' };
    }

    let discount = 0;
    if (coupon.type === 'percent') {
      discount = basePrice * (coupon.value / 100);
    } else if (coupon.type === 'fixed') {
      discount = Math.min(coupon.value, basePrice);
    }
    const finalPrice = Math.max(0, basePrice - discount);

    return {
      valid: true,
      coupon,
      discount: parseFloat(discount.toFixed(2)),
      finalPrice: parseFloat(finalPrice.toFixed(2)),
    };
  } catch (err) {
    console.error('[validateCoupon] Database error:', err);
    return { valid: false, error: 'Erreur lors de la validation du coupon.' };
  }
}
