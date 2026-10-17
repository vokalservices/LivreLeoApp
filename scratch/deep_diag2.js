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

// Check webhook logs to see if any events were ever delivered
async function run() {
  console.log('=== 1. Webhook Logs ===');
  const wlRes = await fetch('https://api.saspay.me/api/v1/webhook-logs/', {
    headers: { 'Authorization': 'Bearer ' + env.SASPAY_API_KEY }
  });
  console.log('Webhook logs HTTP:', wlRes.status);
  if (wlRes.ok) {
    const wlData = await wlRes.json();
    console.log('Webhook logs:', JSON.stringify(wlData, null, 2).slice(0, 3000));
  } else {
    console.log('Webhook logs body:', await wlRes.text().catch(() => 'n/a'));
  }

  console.log('\n=== 2. Test with a different phone format ===');
  // Try softpay with phone WITHOUT the + prefix
  const test1 = await fetch('https://api.saspay.me/api/v1/payments/softpay/', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + env.SASPAY_API_KEY,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'format-test-a-' + Date.now()
    },
    body: JSON.stringify({
      amount: '200.00',
      currency: 'XOF',
      country: 'NE',
      network: 'airtel_ne',
      description: 'Test format phone',
      customer: {
        email: 'frankdhos24@gmail.com',
        first_name: 'Frank',
        last_name: 'Dhos',
        phone: '22789990984'  // no + prefix
      }
    })
  });
  console.log('Test no-plus phone:', test1.status, await test1.json().then(d => JSON.stringify(d, null, 2)).catch(e => e.message));

  console.log('\n=== 3. Test with Côte d\'Ivoire (Wave) to verify flow ===');
  const test2 = await fetch('https://api.saspay.me/api/v1/checkout-sessions/', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + env.SASPAY_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: '200.00',
      currency: 'XOF',
      description: 'Test CI checkout',
      customer_email: 'frankdhos24@gmail.com',
      customer_name: 'Frank Dhos',
      country: 'CI',
      return_url: 'https://leo.ngsafrique.com/success?productId=single&amount=200&currency=XOF&provider=saspay'
    })
  });
  console.log('CI checkout:', test2.status);
  const ciData = await test2.json();
  console.log('CI response:', JSON.stringify(ciData, null, 2));

  console.log('\n=== 4. Check Airtel Niger network status ===');
  // Try to verify an old Airtel NE payment to see final status
  const oldPayments = [
    'd23993ba-cf53-479e-a08e-3a60cc88fbe4',
    'b7526bb4-d18b-44ad-9084-addd847651af',
    '6074c1b8-7ee6-48fb-b4e7-5c89c0f32060'
  ];
  for (const pid of oldPayments) {
    const vr = await fetch(`https://api.saspay.me/api/v1/payments/${pid}/verify/`, {
      headers: { 'Authorization': 'Bearer ' + env.SASPAY_API_KEY }
    });
    const vd = await vr.json();
    console.log(`  ${pid}: status=${vd?.data?.status} updated=${vd?.data?.updated_at}`);
  }
}
run().catch(e => console.error('Error:', e));
