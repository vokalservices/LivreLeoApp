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
  const res = await fetch('https://api.saspay.me/api/v1/pricing/my-rates/', {
    headers: { 'Authorization': 'Bearer ' + env.SASPAY_API_KEY }
  });
  const data = await res.json();
  const rates = data.data || [];
  const matches = rates.filter(r => r.country_code === 'NE' || r.network_name?.toLowerCase().includes('airtel') || r.country_name?.toLowerCase().includes('niger'));
  console.log('Matches:', JSON.stringify(matches, null, 2));

  // Also print all unique countries supported:
  const countries = [...new Set(rates.map(r => `${r.country_code} - ${r.country_name} (${r.currency})`))];
  console.log('All supported countries:', countries);
}
check();
