// Webhook Stripe — confirmation de paiement côté serveur
// À enregistrer dans le dashboard Stripe : https://dashboard.stripe.com/webhooks
// Event à écouter : checkout.session.completed
// URL : https://votre-domaine.com/api/webhooks/stripe

import Stripe from 'stripe';
import prisma from '../../../lib/prisma';
import { sendOrderConfirmation } from '../../../lib/mailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Désactiver le bodyParser pour lire le raw body (requis par Stripe)
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature invalide:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const productId = session.metadata?.product_id;
    const amount = session.amount_total ? session.amount_total / 100 : 0;
    const email = session.customer_details?.email || session.customer_email || 'stripe@example.com';

    if (productId) {
      try {
        // Vérifier si la commande existe déjà (éviter les doublons)
        const existing = await prisma.order.findFirst({
          where: {
            productId: Number(productId),
            email,
            amount,
          },
        });

        if (!existing) {
          const order = await prisma.order.create({
            data: {
              productId: Number(productId),
              amount,
              email,
            },
          });
          console.log(`Commande Stripe enregistrée : produit ${productId}, ${amount}€, ${email}`);

          // Email de confirmation avec liens de téléchargement
          sendOrderConfirmation({
            productId: Number(productId),
            email,
            amount,
            orderId: order.id,
          }).catch(err => console.error('[stripe-webhook] Email error:', err.message));
        }
      } catch (err) {
        console.error('Erreur enregistrement commande Stripe:', err.message);
      }
    }
  }

  res.status(200).json({ received: true });
}
