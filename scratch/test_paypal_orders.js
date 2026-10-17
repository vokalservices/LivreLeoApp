const fs = require('fs');

const content = fs.readFileSync('.env.local', 'utf8');
const env = {};
content.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
});

async function testOrders() {
  const PAYPAL_API = 'https://api-m.paypal.com';
  const credentials = Buffer.from(env.PAYPAL_CLIENT_ID + ':' + env.PAYPAL_CLIENT_SECRET).toString('base64');
  const authRes = await fetch(PAYPAL_API + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + credentials,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const authData = await authRes.json();
  const token = authData.access_token;

  // Test with landing_page = BILLING
  const resBilling = await fetch(PAYPAL_API + '/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'EUR', value: '16.49' },
        description: 'Test Pack 6 Tomes'
      }],
      application_context: {
        brand_name: 'Fusée Carton',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
        return_url: 'https://livre-leo.vercel.app/success',
        cancel_url: 'https://livre-leo.vercel.app/'
      }
    })
  });
  const dataBilling = await resBilling.json();
  console.log('BILLING status:', resBilling.status);
  const approveBilling = dataBilling.links?.find(l => l.rel === 'approve' || l.rel === 'payer-action')?.href;
  console.log('BILLING approve url:', approveBilling);

  // Test with landing_page = GUEST_CHECKOUT
  const resGuest = await fetch(PAYPAL_API + '/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'EUR', value: '16.49' },
        description: 'Test Pack 6 Tomes'
      }],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'Fusée Carton',
            landing_page: 'GUEST_CHECKOUT',
            user_action: 'PAY_NOW',
            shipping_preference: 'NO_SHIPPING',
            return_url: 'https://livre-leo.vercel.app/success',
            cancel_url: 'https://livre-leo.vercel.app/'
          }
        }
      }
    })
  });
  const dataGuest = await resGuest.json();
  console.log('GUEST_CHECKOUT status:', resGuest.status);
  const approveGuest = dataGuest.links?.find(l => l.rel === 'approve' || l.rel === 'payer-action')?.href;
  console.log('GUEST_CHECKOUT approve url:', approveGuest);
}

testOrders();
