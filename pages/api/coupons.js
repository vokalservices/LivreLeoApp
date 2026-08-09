import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';
import { validateCoupon } from '../../lib/coupon-validator';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'change_this_secret';

function authenticate(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  try {
    if (!token) throw new Error('No token');
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    res.status(401).json({ error: 'Non autorisé' });
    return false;
  }
}

export default async function handler(req, res) {

  // ── GET public : valider un code coupon ──────────────────────────────────
  if (req.method === 'GET' && req.query.validate) {
    const { code, price } = req.query;
    if (!code) return res.status(400).json({ error: 'code requis' });

    const result = await validateCoupon(code, parseFloat(price) || 0);
    if (!result.valid) {
      return res.status(result.error === 'Code promo invalide ou inactif.' ? 404 : 400).json({
        valid: false,
        error: result.error
      });
    }

    return res.json({
      valid: true,
      code: result.coupon.code,
      type: result.coupon.type,
      value: result.coupon.value,
      description: result.coupon.description,
      discount: result.discount,
      finalPrice: result.finalPrice,
    });
  }

  // ── GET admin : liste tous les coupons ───────────────────────────────────
  if (req.method === 'GET') {
    if (!authenticate(req, res)) return;
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(coupons);
  }

  // ── POST admin : créer un coupon ─────────────────────────────────────────
  if (req.method === 'POST') {
    if (!authenticate(req, res)) return;
    const { code, type, value, description, active, usageLimit, expiresAt } = req.body;
    if (!code || !type || value === undefined) {
      return res.status(400).json({ error: 'code, type et value sont requis.' });
    }
    if (!['percent', 'fixed'].includes(type)) {
      return res.status(400).json({ error: 'type doit être "percent" ou "fixed".' });
    }
    try {
      const coupon = await prisma.coupon.create({
        data: {
          code: code.toUpperCase().trim(),
          type,
          value: parseFloat(value),
          description: description || null,
          active: active !== false,
          usageLimit: usageLimit ? parseInt(usageLimit) : null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });
      return res.status(201).json(coupon);
    } catch (err) {
      if (err.code === 'P2002') return res.status(409).json({ error: 'Ce code existe déjà.' });
      return res.status(500).json({ error: err.message });
    }
  }

  // ── PATCH admin : modifier un coupon ─────────────────────────────────────
  if (req.method === 'PATCH') {
    if (!authenticate(req, res)) return;
    const { id, ...data } = req.body;
    if (!id) return res.status(400).json({ error: 'id requis.' });
    try {
      const updated = await prisma.coupon.update({
        where: { id: Number(id) },
        data: {
          ...(data.code !== undefined && { code: data.code.toUpperCase().trim() }),
          ...(data.type !== undefined && { type: data.type }),
          ...(data.value !== undefined && { value: parseFloat(data.value) }),
          ...(data.description !== undefined && { description: data.description || null }),
          ...(data.active !== undefined && { active: Boolean(data.active) }),
          ...(data.usageLimit !== undefined && { usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null }),
          ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }),
        },
      });
      return res.json(updated);
    } catch (err) {
      if (err.code === 'P2002') return res.status(409).json({ error: 'Ce code existe déjà.' });
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE admin : supprimer un coupon ────────────────────────────────────
  if (req.method === 'DELETE') {
    if (!authenticate(req, res)) return;
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id requis.' });
    try {
      await prisma.coupon.delete({ where: { id: Number(id) } });
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}
