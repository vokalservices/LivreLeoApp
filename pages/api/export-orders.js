// Export CSV de toutes les commandes — réservé admin
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

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  if (!authenticate(req, res)) return;

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    });

    const headers = ['ID', 'Livre', 'Email', 'Montant (EUR)', 'Pays', 'Ville', 'Date'];
    const rows = orders.map(o => [
      o.id,
      o.product?.title || '',
      o.email || '',
      o.amount,
      o.country || '',
      o.city || '',
      new Date(o.createdAt).toLocaleString('fr-FR'),
    ].map(escapeCSV).join(','));

    const csv = [headers.join(','), ...rows].join('\r\n');
    const filename = `commandes_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send('﻿' + csv); // BOM UTF-8 pour Excel
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
