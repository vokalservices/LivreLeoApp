async function searchBundle() {
  const url = 'https://process.fedapay.com/bundle.a9695.esm.js';
  const res = await fetch(url);
  const text = await res.text();
  console.log('Bundle length:', text.length);

  // Search for airtel, phone, msisdn, country_code, or similar
  const idx = text.indexOf('airtel');
  console.log('Index of airtel:', idx);
  if (idx !== -1) {
    console.log('Snippet around airtel:', text.slice(Math.max(0, idx - 200), idx + 300));
  }

  // Search for "Transaction échouée" or "Une erreur s'est produite"
  const errIdx = text.indexOf('Une erreur');
  console.log('Index of error:', errIdx);
  if (errIdx !== -1) {
    console.log('Snippet around error:', text.slice(Math.max(0, errIdx - 200), errIdx + 300));
  }
}
searchBundle();
