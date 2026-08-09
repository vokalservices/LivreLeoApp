import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';
import { sendOrderConfirmation } from '../../lib/mailer';

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
  if (req.method === 'GET') {
    if (!authenticate(req, res)) return;

    try {
      const allOrders = await prisma.order.findMany({
        include: { product: true },
        orderBy: { createdAt: 'asc' },
      });

      // ── KPIs de base ─────────────────────────────────────────────────────
      const totalSales   = allOrders.length;
      const totalRevenue = allOrders.reduce((s, o) => s + o.amount, 0);
      const avgOrder     = totalSales > 0 ? totalRevenue / totalSales : 0;

      // ── Ventes par livre ──────────────────────────────────────────────────
      const byProduct = {};
      for (const o of allOrders) {
        if (!o.product) continue;
        const key = o.productId;
        if (!byProduct[key]) byProduct[key] = { product: o.product, count: 0, revenue: 0 };
        byProduct[key].count++;
        byProduct[key].revenue += o.amount;
      }
      const bestsellers = Object.values(byProduct).sort((a, b) => b.count - a.count);

      // ── Ventes par langue (FR / EN) ───────────────────────────────────────
      const byLang = { fr: { count: 0, revenue: 0 }, en: { count: 0, revenue: 0 }, other: { count: 0, revenue: 0 } };
      for (const o of allOrders) {
        const lang = o.product?.lang || 'other';
        const key  = lang === 'fr' ? 'fr' : lang === 'en' ? 'en' : 'other';
        byLang[key].count++;
        byLang[key].revenue += o.amount;
      }

      // ── Évolution mensuelle (12 derniers mois) ────────────────────────────
      const now       = new Date();
      const monthly   = {};
      for (let i = 11; i >= 0; i--) {
        const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthly[key] = { label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), count: 0, revenue: 0 };
      }
      for (const o of allOrders) {
        const d   = new Date(o.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthly[key]) { monthly[key].count++; monthly[key].revenue += o.amount; }
      }
      const monthlyTrend = Object.values(monthly);

      // ── Évolution journalière (30 derniers jours) ─────────────────────────
      const daily = {};
      for (let i = 29; i >= 0; i--) {
        const d   = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
        const key = d.toISOString().slice(0, 10);
        daily[key] = { label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), count: 0, revenue: 0 };
      }
      for (const o of allOrders) {
        const key = new Date(o.createdAt).toISOString().slice(0, 10);
        if (daily[key]) { daily[key].count++; daily[key].revenue += o.amount; }
      }
      const dailyTrend = Object.values(daily);

      // ── Géographie ────────────────────────────────────────────────────────
      const geoMap = {};
      for (const o of allOrders) {
        if (!o.country) continue;
        const key = o.countryCode || o.country;
        if (!geoMap[key]) geoMap[key] = { country: o.country, countryCode: o.countryCode, count: 0, revenue: 0, cities: {} };
        geoMap[key].count++;
        geoMap[key].revenue += o.amount;
        if (o.city) {
          geoMap[key].cities[o.city] = (geoMap[key].cities[o.city] || 0) + 1;
        }
      }
      const geoStats = Object.values(geoMap)
        .sort((a, b) => b.count - a.count)
        .map(g => ({
          ...g,
          cities: Object.entries(g.cities)
            .map(([city, count]) => ({ city, count }))
            .sort((a, b) => b.count - a.count),
        }));

      // ── Heure d'achat (distribution horaire) ─────────────────────────────
      const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
      for (const o of allOrders) {
        const h = new Date(o.createdAt).getHours();
        hourly[h].count++;
      }

      // ── Commandes récentes (10 dernières) + toutes pour filtre client ────────
      const recentOrders = [...allOrders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

      // allOrders trié desc — envoyé au client pour le filtre par période
      const allOrdersSorted = [...allOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json({
        totalSales,
        totalRevenue,
        avgOrder,
        bestsellers,
        byLang,
        monthlyTrend,
        dailyTrend,
        geoStats,
        hourly,
        recentOrders,
        allOrders: allOrdersSorted,
      });
    } catch (error) {
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }

  } else if (req.method === 'POST') {
    const { productId, amount, email } = req.body;
    if (!productId || amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Missing fields productId or amount' });
    }

    let city = null, country = null, countryCode = null;
    try {
      const forwarded = req.headers['x-forwarded-for'];
      const rawIp = (forwarded ? forwarded.split(',')[0] : req.socket?.remoteAddress) || '';
      const ip = rawIp.replace('::ffff:', '').trim();
      const isLocal = ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.');
      if (!isLocal && ip) {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,countryCode,status`, {
          signal: AbortSignal.timeout(3000),
        });
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (geo.status === 'success') {
            city        = geo.city        || null;
            country     = geo.country     || null;
            countryCode = geo.countryCode || null;
          }
        }
      }
    } catch (geoErr) {
      console.warn('Geo lookup failed:', geoErr.message);
    }

    try {
      const order = await prisma.order.create({
        data: {
          productId:   Number(productId) || 1,
          amount:      Number(amount),
          email:       email || 'inconnu@example.com',
          city,
          country,
          countryCode,
        },
      });

      const customerEmail = email || 'inconnu@example.com';
      if (customerEmail !== 'inconnu@example.com') {
        // Déterminer le productId pour le mailer (string pour packs, number pour tomes)
        const mailProductId = (productId === 'pack' || productId === 'combo') ? productId : Number(productId);
        sendOrderConfirmation({
          productId: mailProductId,
          email:     customerEmail,
          amount:    Number(amount),
          orderId:   order.id,
        }).catch(err => console.error('[orders] Email error:', err.message));
      }

      res.status(201).json(order);
    } catch (error) {
      console.error('Order creation error:', error);
      res.status(500).json({ error: error.message || 'Server error creating order' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

