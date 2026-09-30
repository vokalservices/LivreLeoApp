import prisma from '../../lib/prisma';
import { getLocalProducts } from '../../lib/productsData';

const SUPABASE_STORAGE_BOOKS = process.env.SUPABASE_URL 
  ? `${process.env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/books` 
  : 'https://wreswtwnlrwcbmzyioky.supabase.co/storage/v1/object/public/books';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productId, format, email } = req.query;

  if (!productId || !format) {
    return res.status(400).json({ error: 'Paramètres manquants : productId et format requis.' });
  }

  try {
    const isPackOrCombo = productId === 'pack' || productId === 'combo';
    const { part } = req.query;

    // ── Pack / Combo : redirection vers ZIP Supabase Storage ─────────────────────────────
    if (isPackOrCombo) {
      const isCombo = productId === 'combo';
      let zipUrl = null;

      if (isCombo) {
        if (format === 'pdf') {
          if (part === '1') zipUrl = `${SUPABASE_STORAGE_BOOKS}/packs/pack-combo-pdf-part1.zip`;
          if (part === '2') zipUrl = `${SUPABASE_STORAGE_BOOKS}/packs/pack-combo-pdf-part2.zip`;
          if (part === '3') zipUrl = `${SUPABASE_STORAGE_BOOKS}/packs/pack-combo-pdf-part3.zip`;
          if (!part) zipUrl = `${SUPABASE_STORAGE_BOOKS}/packs/pack-combo-pdf-part1.zip`;
        }
        if (format === 'epub') {
          if (part === '1') zipUrl = `${SUPABASE_STORAGE_BOOKS}/packs/pack-combo-epub-part1.zip`;
          if (part === '2') zipUrl = `${SUPABASE_STORAGE_BOOKS}/packs/pack-combo-epub-part2.zip`;
          if (!part) zipUrl = `${SUPABASE_STORAGE_BOOKS}/packs/pack-combo-epub-part1.zip`;
        }
        if (format === 'audio') zipUrl = `${SUPABASE_STORAGE_BOOKS}/packs/pack-combo-audio.zip`;
      } else {
        if (format === 'pdf') {
          if (part === '1') zipUrl = `${SUPABASE_STORAGE_BOOKS}/packs/pack-fr-pdf-part1.zip`;
          if (part === '2') zipUrl = `${SUPABASE_STORAGE_BOOKS}/packs/pack-fr-pdf-part2.zip`;
          if (!part) zipUrl = `${SUPABASE_STORAGE_BOOKS}/packs/pack-fr-pdf-part1.zip`;
        }
        if (format === 'epub') zipUrl = `${SUPABASE_STORAGE_BOOKS}/packs/pack-combo-epub-part1.zip`;
        if (format === 'audio') zipUrl = `${SUPABASE_STORAGE_BOOKS}/packs/pack-fr-audio.zip`;
      }

      if (!zipUrl) return res.status(400).json({ error: `Format ${format} non supporté.` });
      return res.redirect(302, zipUrl);
    }

    // ── Tome individuel ───────────────────────────────────────────────────────
    const bookId = Number(productId);
    if (isNaN(bookId)) return res.status(400).json({ error: 'Identifiant invalide.' });

    let product = null;
    try {
      product = await prisma.product.findUnique({ where: { id: bookId } });
    } catch (e) {
      // Fallback
    }

    if (!product) {
      const allLocal = getLocalProducts();
      product = allLocal.find(p => p.id === bookId);
    }

    if (!product) return res.status(404).json({ error: 'Livre introuvable.' });

    // Vérifier commande ou prix gratuit
    let order = null;
    try {
      order = await prisma.order.findFirst({
        where: { productId: bookId, email: email || undefined },
      });
    } catch (e) {
      // Ignorer si pas de DB
    }

    const meta = JSON.parse(product.metadata || '{}');

    // ── Audio : ZIP Supabase ──────────────────────────────────────────────────
    if (format === 'audio') {
      const imageUrl = product.imageUrl || '';
      const isEn = product.lang === 'en';
      const slugMatch = imageUrl.match(/\/illustrations\/(?:en\/)?([^/]+)\/cover/);
      const slug = slugMatch ? slugMatch[1] : null;

      if (!slug) return res.status(404).json({ error: 'Audio introuvable.' });

      const prefix = isEn ? 'en' : 'fr';
      const zipUrl = `${SUPABASE_STORAGE_BOOKS}/audio/audio-${prefix}-${slug}.zip`;
      return res.redirect(302, zipUrl);
    }

    // ── PDF / EPUB : URL Supabase stockée en base ─────────────────────────────
    let fileUrl = null;
    if (format === 'pdf')  fileUrl = meta.pdfUrl  || null;
    if (format === 'epub') fileUrl = meta.epubUrl || null;

    // Fallback : construire l'URL depuis le slug si pas encore en base
    if (!fileUrl) {
      const isEn = product.lang === 'en';
      const imageUrl = product.imageUrl || '';
      const slugMatch = imageUrl.match(/\/illustrations\/(?:en\/)?([^/]+)\/cover/);
      const slug = slugMatch ? slugMatch[1] : null;

      if (!slug) return res.status(404).json({ error: `Fichier ${format} introuvable.` });

      const langFolder = isEn ? 'en' : 'fr';
      if (format === 'pdf')  fileUrl = `${SUPABASE_STORAGE_BOOKS}/${langFolder}/${slug}/${slug}.pdf`;
      if (format === 'epub') fileUrl = `${SUPABASE_STORAGE_BOOKS}/${langFolder}/${slug}/${slug}.epub`;
    }

    if (!fileUrl) return res.status(404).json({ error: `Format ${format} non disponible.` });

    return res.redirect(302, fileUrl);

  } catch (err) {
    console.error('Erreur téléchargement :', err);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}
