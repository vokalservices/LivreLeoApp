// Intégration Moneroo — Mobile Money Afrique (XOF, Niger, etc.)
// Docs : https://docs.moneroo.io

import prisma from '../../lib/prisma';
import { sendOrderConfirmation } from '../../lib/mailer';

const MONEROO_SECRET_KEY = process.env.MONEROO_SECRET_KEY;
const MONEROO_API_BASE = 'https://api.moneroo.io/v1';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return initializePayment(req, res);
  }
  if (req.method === 'GET') {
    return verifyPayment(req, res);
  }
  return res.status(405).json({ error: 'Méthode non autorisée.' });
}

// ─── Initialisation du paiement ────────────────────────────────────────────
async function initializePayment(req, res) {
  const { email, firstName, lastName, amount, currency, book } = req.body;

  if (!email || !amount || !book || !currency) {
    return res.status(400).json({ error: 'Champs requis manquants : email, amount, currency, book.' });
  }

  if (!MONEROO_SECRET_KEY) {
    return res.status(500).json({ error: 'Clé Moneroo non configurée sur le serveur.' });
  }

  const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '') || `http://${req.headers.host}`;
  const returnUrl = `${origin}/success?productId=${book.id}&amount=${amount}&email=${encodeURIComponent(email)}&provider=moneroo`;

  const body = {
    amount: Math.round(parseFloat(amount)), // XOF = entier sans subunités
    currency: currency.toUpperCase(),
    description: `Achat e-book : ${book.title}`,
    return_url: returnUrl,
    customer: {
      email,
      first_name: firstName || email.split('@')[0],
      last_name: lastName || 'Client',
    },
    // Moneroo metadata : tableau de valeurs scalaires uniquement
    metadata: [
      String(book.id),
      book.title,
    ],
  };

  try {
    const response = await fetch(`${MONEROO_API_BASE}/payments/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MONEROO_SECRET_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Moneroo init error:', data);
      return res.status(response.status).json({
        error: data.message || 'Échec de l\'initialisation du paiement Moneroo.',
      });
    }

    // Retourner l'URL de checkout Moneroo
    return res.status(200).json({
      checkout_url: data.data?.checkout_url,
      payment_id: data.data?.id,
    });
  } catch (err) {
    console.error('Moneroo fetch error:', err.message);
    return res.status(500).json({ error: 'Erreur de connexion au service Moneroo.' });
  }
}

// ─── Vérification du paiement (côté serveur) ───────────────────────────────
async function verifyPayment(req, res) {
  const { paymentId } = req.query;

  if (!paymentId) {
    return res.status(400).json({ error: 'paymentId requis.' });
  }

  if (!MONEROO_SECRET_KEY) {
    return res.status(500).json({ error: 'Clé Moneroo non configurée.' });
  }

  try {
    const response = await fetch(`${MONEROO_API_BASE}/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${MONEROO_SECRET_KEY}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Vérification échouée.' });
    }

    const payment = data.data;

    // Si paiement réussi, enregistrer la commande et envoyer l'email
    if (payment.status === 'success' && req.query.productId && req.query.email) {
      try {
        const productId = Number(req.query.productId);
        const email = req.query.email;
        const amount = payment.amount;

        // Éviter les doublons
        const existing = await prisma.order.findFirst({
          where: { productId, email },
        });

        let orderId;
        if (!existing) {
          const order = await prisma.order.create({
            data: { productId, amount, email },
          });
          orderId = order.id;

          // Email de confirmation avec liens de téléchargement
          sendOrderConfirmation({ productId, email, amount, orderId }).catch(
            err => console.error('[moneroo] Email error:', err.message)
          );
        } else {
          orderId = existing.id;
        }
      } catch (dbErr) {
        console.error('[moneroo] DB/email error:', dbErr.message);
      }
    }

    return res.status(200).json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
    });
  } catch (err) {
    console.error('Moneroo verify error:', err.message);
    return res.status(500).json({ error: 'Erreur de vérification Moneroo.' });
  }
}
