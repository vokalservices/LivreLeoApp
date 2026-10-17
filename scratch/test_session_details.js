const fs = require('fs');
const line = fs.readFileSync('.env.local', 'utf8').split('\n').find(l => l.startsWith('SASPAY_API_KEY='));
const key = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
fetch('https://api.saspay.me/api/v1/checkout-sessions/e46875f8-f1ff-49cf-810e-43cab654d2c4/', {
  headers: { 'Authorization': 'Bearer ' + key }
}).then(r => r.json()).then(d => {
  console.log('Session data:');
  console.log('country:', JSON.stringify(d?.data?.country));
  console.log('amount:', d?.data?.amount, d?.data?.currency);
  console.log('return_url:', d?.data?.return_url);
  console.log('status:', d?.data?.status);
});
