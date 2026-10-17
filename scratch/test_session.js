const fs = require('fs');
const content = fs.readFileSync('.env.local', 'utf8');
const env = {};
content.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[k] = v;
  }
});

async function run() {
  const res = await fetch('https://api.saspay.me/api/v1/checkout-sessions/', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + env.SASPAY_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: '1300.00',
      currency: 'XOF',
      description: 'Test session',
      customer_email: 'frankdhos24@gmail.com',
      customer_name: 'Frank Dhos',
      customer_phone: '+22789990984',
      country: 'NE',
      return_url: 'https://leo.ngsafrique.com/success'
    })
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Data:', JSON.stringify(data, null, 2));
}
run();
