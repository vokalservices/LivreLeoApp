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

async function fullTest() {
  console.log('=== STEP 1: Create checkout session ===');
  const sessionRes = await fetch('https://api.saspay.me/api/v1/checkout-sessions/', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + env.SASPAY_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: '1300.00',
      currency: 'XOF',
      description: 'Test complet - Livre Leo Tome 1',
      customer_email: 'frankdhos24@gmail.com',
      customer_name: 'Frank Dhos',
      customer_phone: '+22789990984',
      country: 'NE',
      return_url: 'https://leo.ngsafrique.com/success?productId=single&amount=1300.00&currency=XOF&provider=saspay'
    })
  });
  console.log('Session HTTP status:', sessionRes.status);
  const sessionData = await sessionRes.json();
  console.log('Session response:', JSON.stringify(sessionData, null, 2));

  if (!sessionData?.data?.id) {
    console.error('FAILED: No session ID returned');
    return;
  }

  const sessionId = sessionData.data.id;
  const checkoutUrl = sessionData.data.checkout_url;
  console.log('\nSession ID:', sessionId);
  console.log('Checkout URL:', checkoutUrl);

  console.log('\n=== STEP 2: Check session status ===');
  const statusRes = await fetch(`https://api.saspay.me/api/v1/checkout-sessions/${sessionId}/status/`, {
    headers: { 'Authorization': 'Bearer ' + env.SASPAY_API_KEY }
  });
  console.log('Status HTTP:', statusRes.status);
  const statusData = await statusRes.json();
  console.log('Status response:', JSON.stringify(statusData, null, 2));

  console.log('\n=== STEP 3: Try softpay direct push ===');
  const softpayRes = await fetch('https://api.saspay.me/api/v1/payments/softpay/', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + env.SASPAY_API_KEY,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'diag-test-' + Date.now()
    },
    body: JSON.stringify({
      amount: '1300.00',
      currency: 'XOF',
      country: 'NE',
      network: 'airtel_ne',
      description: 'Test direct push Niger',
      customer: {
        email: 'frankdhos24@gmail.com',
        first_name: 'Frank',
        last_name: 'Dhos',
        phone: '+22789990984'
      }
    })
  });
  console.log('Softpay HTTP status:', softpayRes.status);
  const softpayData = await softpayRes.json();
  console.log('Softpay response:', JSON.stringify(softpayData, null, 2));

  if (softpayData?.data?.id) {
    console.log('\n=== STEP 4: Verify softpay payment ===');
    // Wait a few seconds
    await new Promise(r => setTimeout(r, 5000));
    const verifyRes = await fetch(`https://api.saspay.me/api/v1/payments/${softpayData.data.id}/verify/`, {
      headers: { 'Authorization': 'Bearer ' + env.SASPAY_API_KEY }
    });
    const verifyData = await verifyRes.json();
    console.log('Verify response:', JSON.stringify(verifyData, null, 2));
  }

  console.log('\n=== STEP 5: Check all recent payments ===');
  const paymentsRes = await fetch('https://api.saspay.me/api/v1/payments/?limit=5&ordering=-created_at', {
    headers: { 'Authorization': 'Bearer ' + env.SASPAY_API_KEY }
  });
  console.log('Payments HTTP:', paymentsRes.status);
  const paymentsData = await paymentsRes.json();
  if (paymentsData?.data?.results) {
    paymentsData.data.results.forEach(p => {
      console.log(`  Payment ${p.id}: status=${p.status}, amount=${p.requested_amount} ${p.currency}, network=${p.network_code}, created=${p.created_at}`);
    });
  } else {
    console.log('Payments raw:', JSON.stringify(paymentsData, null, 2).slice(0, 2000));
  }

  console.log('\n=== STEP 6: Check webhook config ===');
  const whRes = await fetch('https://api.saspay.me/api/v1/merchant-webhooks/', {
    headers: { 'Authorization': 'Bearer ' + env.SASPAY_API_KEY }
  });
  console.log('Webhooks HTTP:', whRes.status);
  const whData = await whRes.json();
  console.log('Webhooks:', JSON.stringify(whData, null, 2));
}

fullTest().catch(e => console.error('Fatal:', e));
