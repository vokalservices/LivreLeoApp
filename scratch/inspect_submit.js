const fs = require('fs');

async function inspectSubmit() {
  const url = 'https://process.fedapay.com/bundle.a9695.esm.js';
  const res = await fetch(url);
  const text = await res.text();

  // Find where API call or submit is made
  // Look for POST, /transactions/, /pay, or similar
  const matches = [...text.matchAll(/\/api\/v1\/[a-zA-Z0-9_\-\/]+/g)];
  console.log('API routes in FedaPay bundle:', [...new Set(matches.map(m => m[0]))]);

  // Search for the click handler of the pay button
  const payBtnIdx = text.indexOf('payer');
  console.log('Indices of payer:', payBtnIdx);
}
inspectSubmit();
