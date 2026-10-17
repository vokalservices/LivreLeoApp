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
  const r1 = await fetch('https://api.saspay.me/api/v1/pricing/my-rates/', {
    headers: { 'Authorization': 'Bearer ' + env.SASPAY_API_KEY }
  });
  const d1 = await r1.json();
  const ne = d1.data.filter(x => x.country_code === 'NE' || x.country === 'NE');
  console.log('NE:', JSON.stringify(ne, null, 2));
  const ci = d1.data.filter(x => x.country_code === 'CI' || x.country === 'CI');
  console.log('CI:', JSON.stringify(ci, null, 2));
}
run();
