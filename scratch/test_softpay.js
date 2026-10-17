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

async function testSoftpay() {
  const payload = {
    amount: "1300.00",
    currency: "XOF",
    country: "NE",
    network: "airtel_ne",
    description: "Test softpay Niger",
    customer: {
      email: "frankdhos24@gmail.com",
      first_name: "Frank",
      last_name: "Dhos",
      phone: "+22789990984"
    }
  };

  try {
    const res = await fetch('https://api.saspay.me/api/v1/payments/softpay/', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.SASPAY_API_KEY,
        'Content-Type': 'application/json',
        'Idempotency-Key': 'test-softpay-' + Date.now()
      },
      body: JSON.stringify(payload)
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}
testSoftpay();
