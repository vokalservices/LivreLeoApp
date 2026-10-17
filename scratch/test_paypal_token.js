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

async function test() {
  try {
    const PAYPAL_API = 'https://api-m.paypal.com';
    const credentials = Buffer.from(env.PAYPAL_CLIENT_ID + ':' + env.PAYPAL_CLIENT_SECRET).toString('base64');
    const authRes = await fetch(PAYPAL_API + '/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + credentials,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    const authData = await authRes.json();
    console.log('OAuth token ok:', !!authData.access_token);
    
    // Try client token for CardFields / ACDC
    const tokenRes = await fetch(PAYPAL_API + '/v1/identity/generate-token', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + authData.access_token,
        'Accept-Language': 'en_US',
        'Content-Type': 'application/json'
      }
    });
    const tokenData = await tokenRes.json();
    console.log('generate-token status:', tokenRes.status, 'has client_token:', !!tokenData.client_token);
    if (!tokenRes.ok) console.log('generate-token response:', JSON.stringify(tokenData));
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
