const http = require('http');
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

async function getClientToken() {
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
  const tokenRes = await fetch(PAYPAL_API + '/v1/identity/generate-token', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + authData.access_token,
      'Accept-Language': 'fr_FR',
      'Content-Type': 'application/json'
    }
  });
  const tokenData = await tokenRes.json();
  return tokenData.client_token;
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/token') {
    const token = await getClientToken();
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ clientToken: token, clientId: env.PAYPAL_CLIENT_ID }));
    return;
  }
  
  if (req.url === '/' || req.url === '/index.html') {
    const token = await getClientToken();
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test PayPal Card Fields</title>
  <script src="https://www.paypal.com/sdk/js?client-id=${env.PAYPAL_CLIENT_ID}&currency=EUR&components=buttons,card-fields" data-client-token="${token}"></script>
</head>
<body style="font-family:sans-serif;padding:40px;">
  <h2>Test CardFields Eligibility</h2>
  <div id="status">Loading...</div>
  <div id="card-container" style="max-width:400px;margin-top:20px;">
    <div id="card-number" style="height:40px;border:1px solid #ccc;margin-bottom:10px;padding:5px;"></div>
    <div style="display:flex;gap:10px;">
      <div id="card-expiry" style="flex:1;height:40px;border:1px solid #ccc;padding:5px;"></div>
      <div id="card-cvv" style="flex:1;height:40px;border:1px solid #ccc;padding:5px;"></div>
    </div>
  </div>
  <script>
    window.addEventListener('load', () => {
      try {
        if (!window.paypal) {
          document.getElementById('status').innerText = 'PayPal SDK not loaded';
          return;
        }
        if (!paypal.CardFields) {
          document.getElementById('status').innerText = 'paypal.CardFields is undefined';
          return;
        }
        const cardFields = paypal.CardFields({
          createOrder: () => {},
          onApprove: () => {},
          onError: (e) => console.error(e)
        });
        const isEligible = cardFields.isEligible();
        document.getElementById('status').innerText = 'CardFields isEligible: ' + isEligible;
        if (isEligible) {
          cardFields.NumberField().render('#card-number');
          cardFields.ExpiryField().render('#card-expiry');
          cardFields.CVVField().render('#card-cvv');
        }
      } catch (err) {
        document.getElementById('status').innerText = 'Error: ' + err.message;
      }
    });
  </script>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(4567, () => {
  console.log('Server running on http://localhost:4567');
});
