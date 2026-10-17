import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'change_this_secret';

function authenticate(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  try {
    if (!token) throw new Error('No token');
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
}

export default async function handler(req, res) {
  if (!authenticate(req, res)) return;

  const { page = 1, limit = 10, email = '' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  try {
    const where = email ? { email: { contains: email } } : {};
    const fetchPromise = Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { product: true },
      }),
      prisma.order.count({ where }),
    ]);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB Timeout')), 1200)
    );
    const [orders, totalCount] = await Promise.race([fetchPromise, timeoutPromise]);
    res.json({ orders, totalCount, dbConnected: true });
  } catch (error) {
    console.warn('[orders_paginated] DB non disponible (' + error.message + '), fallback liste vide.');
    res.json({ orders: [], totalCount: 0, dbConnected: false });
  }
}
