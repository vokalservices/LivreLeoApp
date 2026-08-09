import nodemailer from 'nodemailer';
import prisma from './prisma';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
const SUPABASE_STORAGE = 'https://olexgwicxunynysiwugp.supabase.co/storage/v1/object/public/books';

// ─── Transporteur SMTP ────────────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ─── Liens de téléchargement pour un tome individuel ─────────────────────────
function buildDownloadLinks(productId, email) {
  const enc = encodeURIComponent(email);
  return {
    pdf:   `${BASE_URL}/api/download?productId=${productId}&format=pdf&email=${enc}`,
    epub:  `${BASE_URL}/api/download?productId=${productId}&format=epub&email=${enc}`,
    audio: `${BASE_URL}/api/download?productId=${productId}&format=audio&email=${enc}`,
  };
}

// ─── Bouton HTML ──────────────────────────────────────────────────────────────
function btn(href, icon, label, bg) {
  return `<a href="${href}" style="display:inline-block;background:${bg};color:#fff;text-align:center;padding:13px 20px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;margin:4px;">${icon} ${label}</a>`;
}

// ─── Template tome individuel ─────────────────────────────────────────────────
function buildSingleBookHtml({ customerName, product, meta, links, amount, orderId }) {
  const priceLabel = amount === 0 ? 'Gratuit' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  const volume     = meta.series?.volume;
  const hasAudio   = (meta.pages || []).some(p => p.audio);
  const coverUrl   = product.imageUrl?.startsWith('http') ? product.imageUrl : `${BASE_URL}${product.imageUrl}`;

  return emailWrapper(`📚 Votre commande — ${product.title}`, `
    <p style="font-size:20px;font-weight:700;color:#1e1b4b;margin-bottom:8px;">Merci pour votre commande, ${customerName} ! 🚀</p>
    <p style="font-size:15px;color:#4b5563;line-height:1.6;margin-bottom:28px;">
      Votre achat a bien été confirmé. Retrouvez ci-dessous vos liens de téléchargement.
    </p>

    <!-- Carte livre -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
      <tr>
        <td width="90" style="padding:20px 0 20px 20px;vertical-align:middle;">
          <img src="${coverUrl}" alt="${product.title}" width="70" style="border-radius:6px;box-shadow:4px 6px 14px rgba(0,0,0,0.15);" />
        </td>
        <td style="padding:20px;vertical-align:middle;">
          <p style="font-size:11px;font-weight:700;color:#6366f1;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">${volume ? `Tome ${volume} · ` : ''}Les Aventures de Léo</p>
          <p style="font-size:17px;font-weight:800;color:#1e1b4b;margin-bottom:6px;">${product.title}</p>
          <p style="font-size:13px;color:#6b7280;">Commande <strong>#${orderId}</strong> · ${priceLabel}</p>
        </td>
      </tr>
    </table>

    <p style="font-size:14px;font-weight:600;color:#374151;margin-bottom:12px;">📥 Téléchargez votre livre :</p>
    <div style="text-align:center;margin-bottom:28px;">
      ${btn(links.pdf,  '📄', 'Télécharger PDF',  '#4f46e5')}
      ${btn(links.epub, '📱', 'Télécharger EPUB', '#0f172a')}
      ${hasAudio ? btn(links.audio, '🎙️', 'Télécharger Audio', '#d97706') : ''}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-left:4px solid #6366f1;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <tr><td style="padding:14px 16px;">
        <p style="font-size:13px;color:#3730a3;line-height:1.6;">
          💡 <strong>PDF</strong> : idéal pour lire sur ordinateur ou imprimer.<br/>
          <strong>EPUB</strong> : s'ouvre avec Kindle, Apple Books ou tout lecteur d'e-books.<br/>
          ${hasAudio ? '<strong>Audio</strong> : narration MP3 page par page, dans un ZIP.' : ''}
        </p>
      </td></tr>
    </table>
  `);
}

// ─── Template pack / combo ────────────────────────────────────────────────────
function buildPackHtml({ customerName, isCombo, amount, orderId }) {
  const priceLabel = amount === 0 ? 'Gratuit' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  const packLabel  = isCombo ? 'Pack Combo FR + EN — 12 Livres' : 'Pack Intégral — 6 Livres';
  const packKey    = isCombo ? 'pack-combo' : 'pack-fr';

  const pdfLinks = isCombo
    ? [
        { label: 'PDF Partie 1/3', url: `${SUPABASE_STORAGE}/packs/${packKey}-pdf-part1.zip` },
        { label: 'PDF Partie 2/3', url: `${SUPABASE_STORAGE}/packs/${packKey}-pdf-part2.zip` },
        { label: 'PDF Partie 3/3', url: `${SUPABASE_STORAGE}/packs/${packKey}-pdf-part3.zip` },
      ]
    : [
        { label: 'PDF Partie 1/2', url: `${SUPABASE_STORAGE}/packs/${packKey}-pdf-part1.zip` },
        { label: 'PDF Partie 2/2', url: `${SUPABASE_STORAGE}/packs/${packKey}-pdf-part2.zip` },
      ];

  const epubLinks = isCombo
    ? [
        { label: 'EPUB Partie 1/2', url: `${SUPABASE_STORAGE}/packs/${packKey}-epub-part1.zip` },
        { label: 'EPUB Partie 2/2', url: `${SUPABASE_STORAGE}/packs/${packKey}-epub-part2.zip` },
      ]
    : [{ label: 'EPUB (6 livres)', url: `${SUPABASE_STORAGE}/packs/${packKey}-epub.zip` }];

  const audioLink = { label: 'Audio', url: `${SUPABASE_STORAGE}/packs/${packKey}-audio.zip` };

  const renderLinks = (links, bg) =>
    links.map(l => btn(l.url, '⬇️', l.label, bg)).join('');

  return emailWrapper(`📚 Votre Pack — ${packLabel}`, `
    <p style="font-size:20px;font-weight:700;color:#1e1b4b;margin-bottom:8px;">Merci pour votre commande, ${customerName} ! 🚀</p>
    <p style="font-size:15px;color:#4b5563;line-height:1.6;margin-bottom:28px;">
      Votre <strong>${packLabel}</strong> est disponible immédiatement. Téléchargez chaque format ci-dessous.
    </p>

    <!-- Récap commande -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <p style="font-size:17px;font-weight:800;color:#1e1b4b;margin-bottom:6px;">${packLabel}</p>
        <p style="font-size:13px;color:#6b7280;">Commande <strong>#${orderId}</strong> · ${priceLabel}</p>
      </td></tr>
    </table>

    <p style="font-size:14px;font-weight:600;color:#374151;margin-bottom:10px;">📄 PDF (par parties) :</p>
    <div style="margin-bottom:20px;">${renderLinks(pdfLinks, '#4f46e5')}</div>

    <p style="font-size:14px;font-weight:600;color:#374151;margin-bottom:10px;">📱 EPUB :</p>
    <div style="margin-bottom:20px;">${renderLinks(epubLinks, '#0f172a')}</div>

    <p style="font-size:14px;font-weight:600;color:#374151;margin-bottom:10px;">🎙️ Audio :</p>
    <div style="margin-bottom:28px;">${btn(audioLink.url, '🎙️', audioLink.label, '#d97706')}</div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-left:4px solid #6366f1;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <tr><td style="padding:14px 16px;">
        <p style="font-size:13px;color:#3730a3;line-height:1.6;">
          💡 Les PDF sont divisés en plusieurs parties pour faciliter le téléchargement.<br/>
          Décompressez chaque fichier ZIP pour accéder à vos livres.
        </p>
      </td></tr>
    </table>
  `);
}

// ─── Enveloppe HTML commune ───────────────────────────────────────────────────
function emailWrapper(subject, bodyContent) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><title>${subject}</title></head>
<body style="background:#f0f4f8;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a202c;padding:40px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr><td style="background:linear-gradient(135deg,#3730a3 0%,#1e1b4b 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <span style="font-size:24px;font-weight:900;color:white;">🚀 Fusée Carton</span>
          <p style="color:#a5b4fc;font-size:13px;margin-top:4px;">L'univers de Léo l'inventeur</p>
        </td></tr>

        <!-- BODY -->
        <tr><td style="background:#ffffff;padding:40px 40px 32px;">
          ${bodyContent}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
          <p style="font-size:13px;color:#6b7280;line-height:1.7;">
            Un problème ? Répondez à cet email ou écrivez à
            <a href="mailto:${process.env.SMTP_FROM}" style="color:#6366f1;font-weight:600;">${process.env.SMTP_FROM}</a>.
          </p>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#1e1b4b;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
          <p style="font-size:12px;color:#6366f1;font-weight:600;margin-bottom:4px;">Fusée Carton — Les Aventures de Léo l'inventeur</p>
          <p style="font-size:11px;color:#4338ca;">© ${new Date().getFullYear()} Fusée Carton. Tous droits réservés.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Fonction principale ──────────────────────────────────────────────────────
export async function sendOrderConfirmation({ productId, email, amount, orderId }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[mailer] Variables SMTP non configurées — email non envoyé.');
    return;
  }

  const customerName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  try {
    const transporter = createTransporter();
    const isPackOrCombo = productId === 'pack' || productId === 'combo';

    if (isPackOrCombo) {
      const isCombo = productId === 'combo';
      const html = buildPackHtml({ customerName, isCombo, amount: Number(amount) || 0, orderId });
      const subject = isCombo ? '📚 Votre Pack Combo FR+EN — 12 Livres' : '📚 Votre Pack Intégral — 6 Livres';

      await transporter.sendMail({
        from: `"Fusée Carton" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to:   email,
        subject,
        html,
        text: `Merci pour votre achat du ${isCombo ? 'Pack Combo' : 'Pack Intégral'} !\n\nRetrouvez vos fichiers sur : ${BASE_URL}/success?productId=${productId}&amount=${amount}\n\nFusée Carton`,
      });
      console.log(`[mailer] Email pack envoyé à ${email}`);
      return;
    }

    // Tome individuel
    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product) { console.warn(`[mailer] Produit ${productId} introuvable`); return; }

    const meta  = JSON.parse(product.metadata || '{}');
    const links = buildDownloadLinks(productId, email);

    const html = buildSingleBookHtml({
      customerName,
      product,
      meta,
      links,
      amount:  Number(amount) || 0,
      orderId: orderId || productId,
    });

    await transporter.sendMail({
      from: `"Fusée Carton" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to:   email,
      subject: `📚 Votre commande — ${product.title}`,
      html,
      text: `Merci pour votre achat de "${product.title}" !\n\nPDF : ${links.pdf}\nEPUB : ${links.epub}\nAudio : ${links.audio}\n\nFusée Carton`,
    });
    console.log(`[mailer] Email envoyé à ${email} pour ${product.title}`);

  } catch (err) {
    console.error('[mailer] Erreur envoi email :', err.message);
  }
}
