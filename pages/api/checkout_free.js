import prisma from '../../lib/prisma';
import { validateCoupon } from '../../lib/coupon-validator';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { coupon, bookId, email, productId, amount } = req.body;

  if (!coupon) {
    return res.status(400).json({ error: 'Code promo manquant.' });
  }

  // 1. Server-side coupon validation
  const validation = await validateCoupon(coupon);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // 2. Determine the product reference ID
  const isPackOrCombo = productId === 'pack' || productId === 'combo';
  const refId = isPackOrCombo ? productId : bookId;

  try {
    // 3. For individual books, verify the book exists
    if (!isPackOrCombo) {
      const book = await prisma.product.findUnique({ where: { id: Number(bookId) } });
      if (!book) return res.status(404).json({ error: 'Livre introuvable.' });
    }

    const enc = encodeURIComponent(email);
    const successUrl = `/success?productId=${refId}&amount=0&email=${enc}`;
    return res.status(200).json({ url: successUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}
