import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'change_this_secret';

// Middleware: check for admin JWT token
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
  if (req.method === 'GET') {
    // ?lang=fr|en — filtre par langue. Sans paramètre : renvoie tout.
    const { lang } = req.query;
    const where = lang && (lang === 'fr' || lang === 'en') ? { lang } : {};

    let products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Trier par volume si la métadonnée est présente
    products = products.sort((a, b) => {
      try {
        const va = JSON.parse(a.metadata || '{}')?.series?.volume || 0;
        const vb = JSON.parse(b.metadata || '{}')?.series?.volume || 0;
        return va - vb;
      } catch { return 0; }
    });

    return res.json(products);
  }

  if (!authenticate(req, res)) return;

  if (req.method === 'POST') {
    const { title, description, price, imageUrl, author, ageGroup } = req.body;
    if (!title || !description || !price || !imageUrl) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const newProduct = await prisma.product.create({
      data: {
        title,
        description,
        price: Number(price),
        imageUrl,
        author: author || 'Théo Arven',
        ageGroup: ageGroup || '4-8',
      },
    });
    res.status(201).json(newProduct);

  } else if (req.method === 'PUT') {
    const { id, title, description, price, imageUrl, author, ageGroup } = req.body;
    if (!id || !title || !description || !price || !imageUrl) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        price: Number(price),
        imageUrl,
        author: author || 'Théo Arven',
        ageGroup: ageGroup || '4-8',
      },
    });
    res.json(updated);

  } else if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Missing id' });
    }
    await prisma.product.delete({ where: { id: Number(id) } });
    res.status(204).end();

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
