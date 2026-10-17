const fs = require('fs');

async function inspectCheckPhoneValidity() {
  const url = 'https://process.fedapay.com/bundle.a9695.esm.js';
  const res = await fetch(url);
  const text = await res.text();

  const pos = text.indexOf('checkPhoneValidity()');
  console.log('checkPhoneValidity definition:', text.slice(pos - 300, pos + 1000));
}
inspectCheckPhoneValidity();
