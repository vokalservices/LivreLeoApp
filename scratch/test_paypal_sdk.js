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

const server = http.createServer((req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test PayPal Smart Button Card</title>
  <script src="https://www.paypal.com/sdk/js?client-id=${env.PAYPAL_CLIENT_ID}&currency=EUR"></script>
</head>
<body style="font-family:sans-serif;padding:40px;">
  <h2>Test PayPal Smart Button (fundingSource: CARD)</h2>
  <div id="paypal-button-container" style="max-width:350px;"></div>
  <script>
    paypal.Buttons({
      fundingSource: paypal.FUNDING.CARD,
      style: {
        color: 'black',
        shape: 'rect',
        label: 'pay'
      },
      createOrder: function(data, actions) {
        return actions.order.create({
          purchase_units: [{
            amount: { value: '16.49', currency_code: 'EUR' }
          }],
          application_context: {
            shipping_preference: 'NO_SHIPPING'
          }
        });
      },
      onApprove: function(data, actions) {
        alert('Approved: ' + data.orderID);
      }
    }).render('#paypal-button-container');
  </script>
</body>
</html>`;
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(4568, () => {
  console.log('Server running on http://localhost:4568');
});
