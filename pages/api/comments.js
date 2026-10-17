import jwt from 'jsonwebtoken';

// Import dynamique de Prisma — silencieux en cas d'échec
async function getPrismaClient() {
  try {
    const mod = await import('../../lib/prisma');
    return mod.default;
  } catch {
    return null;
  }
}

async function withTimeout(fn, ms = 2000) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`DB Timeout (${ms}ms)`)), ms)
  );
  return Promise.race([fn(), timeoutPromise]);
}

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
  // POST public : soumettre un commentaire (statut pending par défaut)
  if (req.method === 'POST') {
    const { productId, author, email, body, rating } = req.body;
    if (!productId || !author || !body) {
      return res.status(400).json({ error: 'Champs requis : productId, author, body.' });
    }
    const ratingNum = Math.min(5, Math.max(1, Number(rating) || 5));
    try {
      const prisma = await getPrismaClient();
      if (!prisma) return res.status(503).json({ error: 'Base de données non disponible.' });
      const comment = await prisma.comment.create({
        data: {
          productId: Number(productId),
          author: author.trim(),
          email: email?.trim() || null,
          body: body.trim(),
          rating: ratingNum,
          status: 'pending',
        },
      });
      return res.status(201).json({ ok: true, id: comment.id });
    } catch (err) {
      console.error('Comment create error:', err);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  // GET public : commentaires approuvés d'un livre
  if (req.method === 'GET') {
    const { productId, admin } = req.query;

    // Mode admin : tous les commentaires, toutes statuts
    if (admin === '1') {
      if (!authenticate(req, res)) return;
      try {
        const fetchPromise = prisma.comment.findMany({
          orderBy: { createdAt: 'desc' },
          include: { product: { select: { id: true, title: true } } },
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('DB Timeout')), 1200)
        );
        const comments = await Promise.race([fetchPromise, timeoutPromise]);
        return res.json(comments);
      } catch (err) {
        console.warn('[comments] DB non disponible (' + err.message + '), fallback liste vide.');
        return res.json([]);
      }
    }

    // Mode public : uniquement les approuvés pour un livre
    if (!productId) {
      return res.status(400).json({ error: 'productId requis.' });
    }
    try {
      const fetchPromise = prisma.comment.findMany({
        where: { productId: Number(productId), status: 'approved' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, author: true, body: true, rating: true, createdAt: true },
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB Timeout')), 1200)
      );
      const comments = await Promise.race([fetchPromise, timeoutPromise]);
      return res.json(comments);
    } catch (err) {
      console.warn('[comments] DB non disponible (' + err.message + '), fallback liste vide.');
      return res.json([]);
    }
  }

  // PATCH admin : changer le statut d'un commentaire
  if (req.method === 'PATCH') {
    if (!authenticate(req, res)) return;
    const { id, status } = req.body;
    if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'id et status valide requis.' });
    }
    try {
      const prisma = await getPrismaClient();
      if (!prisma) return res.status(503).json({ error: 'Base de données non disponible.' });
      const updated = await prisma.comment.update({
        where: { id: Number(id) },
        data: { status },
      });
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE admin : supprimer un commentaire
  if (req.method === 'DELETE') {
    if (!authenticate(req, res)) return;
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id requis.' });
    try {
      const prisma = await getPrismaClient();
      if (!prisma) return res.status(503).json({ error: 'Base de données non disponible.' });
      await prisma.comment.delete({ where: { id: Number(id) } });
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}
