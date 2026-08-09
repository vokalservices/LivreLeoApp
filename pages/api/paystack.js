import crypto from 'crypto';
import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, amount, book } = req.body;

  if (!email || !amount || !book) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // Initialize transaction with Paystack
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: email,
        amount: Math.round(amount * 100), // amount in kobo
        currency: 'NGN',
        metadata: {
          custom_fields: [
            {
              display_name: book.title,
              variable_name: 'book',
              value: book.title
            },
          ]
        },
        callback_url: `${req.headers.origin}/success?productId=${book.id}&amount=${amount}&email=${email}`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json({ authorization_url: response.data.data.authorization_url });
  } catch (error) {
    console.error('Paystack init error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Paystack transaction initialization failed' });
  }
}
