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

async function check() {
  const res = await fetch('https://api.saspay.me/api/v1/payments/b7526bb4-d18b-44ad-9084-addd847651af/verify/', {
    headers: { 'Authorization': 'Bearer ' + env.SASPAY_API_KEY }
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Verify:', JSON.stringify(data, null, 2));
}
check();
