import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { book, email } = req.body;

  if (!book || !book.title || !book.price) {
    return res.status(400).json({ error: 'Book info invalid or missing' });
  }

  try {
    const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '') || `http://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: book.title,
              description: `Les Aventures de Léo — e-book`,
            },
            unit_amount: Math.round(parseFloat(book.price) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        product_id: String(book.id),
        product_title: book.title,
      },
      success_url: `${origin}/success?productId=${book.id}&amount=${book.price}&provider=stripe`,
      cancel_url: `${origin}/books/${book.id}`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe session error:', err);
    res.status(500).json({ error: 'Stripe session creation failed' });
  }
}
