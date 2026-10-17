import jwt from 'jsonwebtoken';
import { getLocalProducts } from '../../lib/productsData';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'change_this_secret';

// Tentative d'import dynamique de Prisma — silencieux en cas d'échec
async function getPrismaClient() {
  try {
    const mod = await import('../../lib/prisma');
    return mod.default;
  } catch {
    return null;
  }
}

async function getDbProducts(where) {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return null;
    const dbPromise = prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB Timeout (1000ms)')), 1000)
    );
    return await Promise.race([dbPromise, timeoutPromise]);
  } catch (err) {
    console.warn('[products] DB non disponible (' + err.message + '), fallback catalogue local.');
    return null;
  }
}

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
    try {
      // ?lang=fr|en — filtre par langue. Sans paramètre : renvoie tout.
      const { lang } = req.query;
      const where = lang && (lang === 'fr' || lang === 'en') ? { lang } : {};

      let products = await getDbProducts(where);

      // Fallback catalogue local si DB vide, erreur ou inaccessible
      if (!products || products.length === 0) {
        console.log('[products] Utilisation du catalogue local statique (lang: ' + (lang || 'all') + ').');
        products = getLocalProducts(lang);
      }

      // Trier par volume si la métadonnée est présente
      products = products.sort((a, b) => {
        try {
          const metaA = typeof a.metadata === 'string' ? JSON.parse(a.metadata || '{}') : (a.metadata || {});
          const metaB = typeof b.metadata === 'string' ? JSON.parse(b.metadata || '{}') : (b.metadata || {});
          const va = metaA?.series?.volume || 0;
          const vb = metaB?.series?.volume || 0;
          return va - vb;
        } catch { return 0; }
      });

      return res.status(200).json(products);
    } catch (globalErr) {
      console.error('[products] Erreur critique handler GET:', globalErr);
      const fallback = getLocalProducts(req.query?.lang);
      return res.status(200).json(fallback);
    }
  }

  if (!authenticate(req, res)) return;

  // Pour les méthodes d'écriture (POST/PUT/DELETE), on a besoin de Prisma
  let prisma = null;
  try {
    prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: 'Database unavailable' });
  } catch (err) {
    return res.status(503).json({ error: 'Database unavailable' });
  }

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
