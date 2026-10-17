const fs = require('fs');
const path = require('path');

const files = [
  'components/SasPayButton.jsx',
  'components/PayPalButton.jsx',
  'components/Book.jsx',
  'components/Layout.jsx',
  'lib/translations.js',
  'lib/productsData.js',
  'pages/index.js',
  'pages/pack.js',
  'pages/books/[id].js',
  'pages/facebook-ads.js',
  'pages/success.js',
  'pages/api/saspay/create-checkout.js',
  'pages/api/saspay/verify-session.js',
  'pages/api/webhooks/saspay.js',
  'pages/admin/coupons.js',
  'pages/admin/dashboard.js',
  'pages/admin/index.js',
  'pages/admin/stats.js'
];

for (const f of files) {
  const src = path.resolve(__dirname, '..', f);
  const dest = path.resolve(__dirname, '..', 'push_temp', f);
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${f} -> push_temp/${f}`);
}
console.log('All files synchronized successfully.');
