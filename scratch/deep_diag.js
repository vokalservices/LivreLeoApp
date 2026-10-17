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
  // Check webhooks
  const whRes = await fetch('https://api.saspay.me/api/v1/merchant-webhooks/', {
    headers: { 'Authorization': 'Bearer ' + env.SASPAY_API_KEY }
  });
  console.log('Webhooks HTTP:', whRes.status);
  const whData = await whRes.json();
  console.log('Webhooks:', JSON.stringify(whData, null, 2));

  // Check webhook subscriptions
  const subRes = await fetch('https://api.saspay.me/api/v1/merchant-webhook-subscriptions/', {
    headers: { 'Authorization': 'Bearer ' + env.SASPAY_API_KEY }
  });
  console.log('\nSubscriptions HTTP:', subRes.status);
  const subData = await subRes.json();
  console.log('Subscriptions:', JSON.stringify(subData, null, 2));

  // Now verify the last payment that was FAILED from user's attempts
  // Check all the recent softpay payments
  const paymentIds = [
    'd23993ba-cf53-479e-a08e-3a60cc88fbe4', // just now
    'b7526bb4-d18b-44ad-9084-addd847651af', // earlier test
    '6074c1b8-7ee6-48fb-b4e7-5c89c0f32060', // original
  ];
  for (const pid of paymentIds) {
    const vRes = await fetch(`https://api.saspay.me/api/v1/payments/${pid}/verify/`, {
      headers: { 'Authorization': 'Bearer ' + env.SASPAY_API_KEY }
    });
    const vData = await vRes.json();
    console.log(`\nPayment ${pid}: status=${vData?.data?.status}, network=${vData?.data?.network_code}, msisdn=${vData?.data?.operation_msisdn}`);
  }

  // Test the live API endpoint on the deployed site
  console.log('\n=== Testing live site API ===');
  const liveRes = await fetch('https://leo.ngsafrique.com/api/saspay/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      book: { id: 1, title: 'Tome 1 - Leo', price: 1300 },
      isPack: false,
      isCombo: false,
      customerEmail: 'frankdhos24@gmail.com',
      customerName: 'Frank Dhos',
      customerPhone: '+22789990984',
      country: 'NE',
    })
  });
  console.log('Live API status:', liveRes.status);
  const liveData = await liveRes.json();
  console.log('Live API response:', JSON.stringify(liveData, null, 2));
}
run().catch(e => console.error('Error:', e));
