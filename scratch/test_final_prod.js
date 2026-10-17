const fs = require('fs');

async function test() {
  const line = fs.readFileSync('.env.local', 'utf8').split('\n').find(l => l.startsWith('SASPAY_API_KEY='));
  const key = line.split('=')[1].trim().replace(/^["']|["']$/g, '');

  const res = await fetch('https://leo.ngsafrique.com/api/saspay/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      book: { id: 1, title: 'Tome 1 - Test Production', price: 1300 },
      isPack: false,
      isCombo: false,
      customerEmail: 'final-test@ngsafrique.com',
      customerName: 'Test Parent',
      customerPhone: '+22789990984',
      country: 'NE'
    })
  });

  const d = await res.json();
  console.log('HTTP Status:', res.status);
  console.log('Checkout response:', JSON.stringify(d, null, 2));

  if (d.sessionId) {
    const sRes = await fetch('https://api.saspay.me/api/v1/checkout-sessions/' + d.sessionId + '/', {
      headers: { 'Authorization': 'Bearer ' + key }
    });
    const sData = await sRes.json();
    console.log('\n--- SasPay Session Details ---');
    console.log('Session ID:', sData?.data?.id);
    console.log('Country:', sData?.data?.country);
    console.log('Amount:', sData?.data?.amount, sData?.data?.currency);
    console.log('Return URL:', sData?.data?.return_url);
    console.log('Checkout URL:', sData?.data?.checkout_url);
    console.log('Status:', sData?.data?.status);
  }
}

test().catch(console.error);
