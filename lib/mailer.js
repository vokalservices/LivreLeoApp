import nodemailer from 'nodemailer';
import prisma from './prisma';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
const FROM_NAME = 'Fusée Carton';
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER;

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
    // Améliore la délivrabilité en gardant la connexion ouverte
    pool: true,
    maxConnections: 1,
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

// ─── Bouton HTML sobre (moins de CSS = moins de spam) ────────────────────────
function btn(href, label) {
  return `<a href="${href}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;margin:4px 2px;">${label}</a>`;
}

// ─── Version texte enrichie (ratio texte/HTML critique anti-spam) ─────────────
function buildPlainText({ customerName, title, orderId, amount, links, isPackOrCombo, isCombo, pdfLinks, epubLinks, audioLink }) {
  const priceLabel = Number(amount) === 0 ? 'Gratuit' : `${Number(amount).toFixed(2)} EUR`;
  const lines = [
    `Bonjour ${customerName},`,
    ``,
    `Votre commande a bien été confirmée. Merci pour votre achat !`,
    ``,
    `Commande #${orderId} — ${title} — ${priceLabel}`,
    ``,
    `=== TÉLÉCHARGEMENTS ===`,
    ``,
  ];

  if (isPackOrCombo) {
    (pdfLinks  || []).forEach(l => lines.push(`${l.label} : ${l.url}`));
    lines.push('');
    (epubLinks || []).forEach(l => lines.push(`${l.label} : ${l.url}`));
    lines.push('');
    if (audioLink) lines.push(`${audioLink.label} : ${audioLink.url}`);
  } else {
    if (links?.pdf)   lines.push(`PDF  : ${links.pdf}`);
    if (links?.epub)  lines.push(`EPUB : ${links.epub}`);
    if (links?.audio) lines.push(`Audio : ${links.audio}`);
  }

  lines.push('');
  lines.push('Les liens sont valables dès maintenant et accessibles depuis votre email.');
  lines.push('');
  lines.push('Un problème ? Répondez directement à cet email.');
  lines.push('');
  lines.push(`${FROM_NAME} — Les Aventures de Léo l'inventeur`);
  lines.push(BASE_URL);
  lines.push('');
  lines.push('Cet email a été envoyé suite à votre achat sur notre boutique.');
  lines.push(`Pour ne plus recevoir nos emails : ${BASE_URL}/unsubscribe`);

  return lines.join('\n');
}

// ─── Template HTML sobre ──────────────────────────────────────────────────────
// Règles anti-spam appliquées :
// - Pas de dégradé CSS (signale souvent le spam)
// - Couleurs sobres, structure simple
// - Ratio texte/image équilibré
// - Lien de désinscription obligatoire
// - Pas d'emojis dans le sujet
// - Pas de mots suspects (GRATUIT, CLIQUEZ ICI, etc.)
function emailWrapper(bodyContent, unsubscribeUrl) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmation de commande — Fusée Carton</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">

        <!-- EN-TÊTE -->
        <tr>
          <td style="background-color:#1e1b4b;padding:28px 40px;text-align:center;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">Fusée Carton</p>
            <p style="margin:6px 0 0;font-size:12px;color:#a5b4fc;">Les Aventures de Léo l'inventeur</p>
          </td>
        </tr>

        <!-- CORPS -->
        <tr>
          <td style="padding:36px 40px;">
            ${bodyContent}

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e4e4e7;margin-top:28px;">
              <tr><td style="padding-top:20px;">
                <p style="margin:0;font-size:13px;color:#71717a;line-height:1.6;">
                  Des questions ? Répondez directement à cet email, nous vous répondons sous 24h.
                </p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- PIED DE PAGE -->
        <tr>
          <td style="background-color:#f4f4f5;padding:20px 40px;text-align:center;border-top:1px solid #e4e4e7;">
            <p style="margin:0 0 6px;font-size:12px;color:#a1a1aa;">
              Fusée Carton — Les Aventures de Léo l'inventeur
            </p>
            <p style="margin:0;font-size:11px;color:#a1a1aa;">
              Vous recevez cet email car vous avez effectué un achat sur notre boutique.<br/>
              <a href="${unsubscribeUrl}" style="color:#6366f1;text-decoration:underline;">Se désinscrire</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Template tome individuel ─────────────────────────────────────────────────
function buildSingleBookHtml({ customerName, product, meta, links, amount, orderId }) {
  const priceLabel = Number(amount) === 0 ? 'Gratuit' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  const volume     = meta.series?.volume;
  const hasAudio   = (meta.pages || []).some(p => p.audio);
  const coverUrl   = product.imageUrl?.startsWith('http') ? product.imageUrl : `${BASE_URL}${product.imageUrl}`;

  const body = `
    <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#1e1b4b;">Bonjour ${customerName},</p>
    <p style="margin:0 0 24px;font-size:14px;color:#52525b;line-height:1.6;">
      Votre commande est confirmée. Retrouvez vos liens de téléchargement ci-dessous.
    </p>

    <!-- Récapitulatif commande -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:24px;">
      <tr>
        <td width="80" style="padding:16px 0 16px 16px;vertical-align:top;">
          <img src="${coverUrl}" alt="${product.title}" width="60" height="84" style="border-radius:4px;display:block;" />
        </td>
        <td style="padding:16px;vertical-align:top;">
          <p style="margin:0 0 2px;font-size:11px;color:#6366f1;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${volume ? `Tome ${volume} · ` : ''}Les Aventures de Léo</p>
          <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1e1b4b;">${product.title}</p>
          <p style="margin:0;font-size:12px;color:#71717a;">Commande #${orderId} &nbsp;·&nbsp; ${priceLabel}</p>
        </td>
      </tr>
    </table>

    <!-- Liens de téléchargement -->
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;">Télécharger votre livre :</p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:2px 4px 2px 0;">${btn(links.pdf, 'Télécharger PDF')}</td>
        <td style="padding:2px 4px;">${btn(links.epub, 'Télécharger EPUB')}</td>
        ${hasAudio ? `<td style="padding:2px 0 2px 4px;">${btn(links.audio, 'Télécharger Audio')}</td>` : ''}
      </tr>
    </table>

    <!-- Info formats -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eff6ff;border-left:3px solid #6366f1;margin-bottom:8px;">
      <tr><td style="padding:12px 16px;">
        <p style="margin:0;font-size:12px;color:#3730a3;line-height:1.7;">
          <strong>PDF</strong> : idéal pour lire sur ordinateur ou imprimer.<br/>
          <strong>EPUB</strong> : compatible Kindle, Apple Books et toutes les liseuses.${hasAudio ? '<br/><strong>Audio</strong> : fichiers MP3 compressés dans un ZIP.' : ''}
        </p>
      </td></tr>
    </table>`;

  return emailWrapper(body, `${BASE_URL}/unsubscribe?email=${encodeURIComponent(FROM_EMAIL)}`);
}

// ─── Template pack / combo ────────────────────────────────────────────────────
function buildPackHtml({ customerName, isCombo, amount, orderId, email }) {
  const priceLabel = Number(amount) === 0 ? 'Gratuit' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  const packLabel  = isCombo ? 'Pack Combo FR + EN — 12 Livres' : 'Pack Intégral — 6 Livres';
  const packKey    = isCombo ? 'combo' : 'pack';
  const enc        = encodeURIComponent(email);

  const pdfLinks = isCombo
    ? [
        { label: 'PDF Partie 1/3', url: `${BASE_URL}/api/download?productId=${packKey}&format=pdf&email=${enc}&part=1` },
        { label: 'PDF Partie 2/3', url: `${BASE_URL}/api/download?productId=${packKey}&format=pdf&email=${enc}&part=2` },
        { label: 'PDF Partie 3/3', url: `${BASE_URL}/api/download?productId=${packKey}&format=pdf&email=${enc}&part=3` },
      ]
    : [
        { label: 'PDF Partie 1/2', url: `${BASE_URL}/api/download?productId=${packKey}&format=pdf&email=${enc}&part=1` },
        { label: 'PDF Partie 2/2', url: `${BASE_URL}/api/download?productId=${packKey}&format=pdf&email=${enc}&part=2` },
      ];

  const epubLinks = isCombo
    ? [
        { label: 'EPUB Partie 1/2', url: `${BASE_URL}/api/download?productId=${packKey}&format=epub&email=${enc}&part=1` },
        { label: 'EPUB Partie 2/2', url: `${BASE_URL}/api/download?productId=${packKey}&format=epub&email=${enc}&part=2` },
      ]
    : [{ label: 'EPUB (6 livres)', url: `${BASE_URL}/api/download?productId=${packKey}&format=epub&email=${enc}` }];

  const audioLink = { label: 'Audio complet', url: `${BASE_URL}/api/download?productId=${packKey}&format=audio&email=${enc}` };

  const renderBtns = (links) => links.map(l => btn(l.url, l.label)).join(' ');

  const body = `
    <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#1e1b4b;">Bonjour ${customerName},</p>
    <p style="margin:0 0 24px;font-size:14px;color:#52525b;line-height:1.6;">
      Votre commande est confirmée. Tous vos fichiers sont disponibles ci-dessous.
    </p>

    <!-- Récapitulatif -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:24px;">
      <tr><td style="padding:16px;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1e1b4b;">${packLabel}</p>
        <p style="margin:0;font-size:12px;color:#71717a;">Commande #${orderId} &nbsp;·&nbsp; ${priceLabel}</p>
      </td></tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#374151;">PDF (plusieurs parties) :</p>
    <p style="margin:0 0 16px;">${renderBtns(pdfLinks)}</p>

    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#374151;">EPUB :</p>
    <p style="margin:0 0 16px;">${renderBtns(epubLinks)}</p>

    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#374151;">Audio :</p>
    <p style="margin:0 0 24px;">${btn(audioLink.url, audioLink.label)}</p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eff6ff;border-left:3px solid #6366f1;margin-bottom:8px;">
      <tr><td style="padding:12px 16px;">
        <p style="margin:0;font-size:12px;color:#3730a3;line-height:1.7;">
          Les PDF sont divisés en plusieurs parties pour faciliter le téléchargement.<br/>
          Décompressez chaque fichier ZIP pour accéder à vos livres.
        </p>
      </td></tr>
    </table>`;

  return emailWrapper(body, `${BASE_URL}/unsubscribe?email=${encodeURIComponent(email)}`);
}

// ─── En-têtes email anti-spam ─────────────────────────────────────────────────
function buildHeaders(email, messageId) {
  return {
    'X-Mailer': 'Fusée Carton Mailer 1.0',
    'X-Priority': '3',                          // Priorité normale (1=haute → suspect)
    'Precedence': 'bulk',                        // Indique email transactionnel
    'List-Unsubscribe': `<${BASE_URL}/unsubscribe?email=${encodeURIComponent(email)}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    'Message-ID': `<${messageId}@fusee-carton.com>`,
  };
}

// ─── Fonction principale ──────────────────────────────────────────────────────
export async function sendOrderConfirmation({ productId, email, amount, orderId }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[mailer] Variables SMTP non configurées — email non envoyé.');
    return;
  }

  const customerName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const messageId    = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    const transporter    = createTransporter();
    const isPackOrCombo  = productId === 'pack' || productId === 'combo';
    const headers        = buildHeaders(email, messageId);

    if (isPackOrCombo) {
      const isCombo   = productId === 'combo';
      const packLabel = isCombo ? 'Pack Combo FR+EN — 12 Livres' : 'Pack Intégral — 6 Livres';
      const html      = buildPackHtml({ customerName, isCombo, amount: Number(amount) || 0, orderId, email });

      // Version texte enrichie (essentielle contre le spam)
      const enc = encodeURIComponent(email);
      const pdfLinks  = isCombo
        ? [
            { label: 'PDF Partie 1/3', url: `${BASE_URL}/api/download?productId=${productId}&format=pdf&email=${enc}&part=1` },
            { label: 'PDF Partie 2/3', url: `${BASE_URL}/api/download?productId=${productId}&format=pdf&email=${enc}&part=2` },
            { label: 'PDF Partie 3/3', url: `${BASE_URL}/api/download?productId=${productId}&format=pdf&email=${enc}&part=3` },
          ]
        : [
            { label: 'PDF Partie 1/2', url: `${BASE_URL}/api/download?productId=${productId}&format=pdf&email=${enc}&part=1` },
            { label: 'PDF Partie 2/2', url: `${BASE_URL}/api/download?productId=${productId}&format=pdf&email=${enc}&part=2` },
          ];
      const epubLinks = isCombo
        ? [
            { label: 'EPUB Partie 1/2', url: `${BASE_URL}/api/download?productId=${productId}&format=epub&email=${enc}&part=1` },
            { label: 'EPUB Partie 2/2', url: `${BASE_URL}/api/download?productId=${productId}&format=epub&email=${enc}&part=2` },
          ]
        : [{ label: 'EPUB (6 livres)', url: `${BASE_URL}/api/download?productId=${productId}&format=epub&email=${enc}` }];
      const audioLink = { label: 'Audio complet', url: `${BASE_URL}/api/download?productId=${productId}&format=audio&email=${enc}` };

      const text = buildPlainText({ customerName, title: packLabel, orderId, amount, isPackOrCombo: true, isCombo, pdfLinks, epubLinks, audioLink });

      // Sujet sans emojis ni mots suspects
      const subject = `Votre commande ${packLabel} — Fusée Carton`;

      await transporter.sendMail({
        from:       `"${FROM_NAME}" <${FROM_EMAIL}>`,
        replyTo:    FROM_EMAIL,
        to:         email,
        subject,
        html,
        text,
        headers,
      });
      console.log(`[mailer] Email pack envoyé à ${email}`);
      return;
    }

    // ── Tome individuel ───────────────────────────────────────────────────────
    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product) { console.warn(`[mailer] Produit ${productId} introuvable`); return; }

    const meta    = JSON.parse(product.metadata || '{}');
    const links   = buildDownloadLinks(productId, email);
    const hasAudio = (meta.pages || []).some(p => p.audio);

    const html = buildSingleBookHtml({
      customerName, product, meta, links,
      amount:  Number(amount) || 0,
      orderId: orderId || productId,
    });

    const text = buildPlainText({
      customerName,
      title:   product.title,
      orderId: orderId || productId,
      amount,
      links:   hasAudio ? links : { pdf: links.pdf, epub: links.epub },
    });

    // Sujet : sans emojis, sans majuscules agressives
    const subject = `Votre commande "${product.title}" — Fusée Carton`;

    await transporter.sendMail({
      from:    `"${FROM_NAME}" <${FROM_EMAIL}>`,
      replyTo: FROM_EMAIL,
      to:      email,
      subject,
      html,
      text,
      headers,
    });
    console.log(`[mailer] Email envoyé à ${email} pour ${product.title}`);

  } catch (err) {
    console.error('[mailer] Erreur envoi email :', err.message);
  }
}
