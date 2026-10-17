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

async function testSasPay() {
  const payload = {
    amount: '6500.00',
    currency: 'XOF',
    description: 'Test Pack 6 Tomes XOF',
    customer_email: 'client@ngsafrique.com',
    customer_name: 'Parent Lecteur',
    country: 'NE',
    customer_phone: '+22789990984',
    return_url: 'https://leo.ngsafrique.com/success?productId=pack&amount=6500.00&provider=saspay'
  };
  try {
    const res = await fetch('https://api.saspay.me/api/v1/checkout-sessions/', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.SASPAY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    console.log('SasPay status:', res.status);
    const data = await res.json();
    console.log('SasPay response:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}
testSasPay();
