const fs = require('fs');

let code = fs.readFileSync('pages/facebook-ads.js', 'utf8');

// Replace problematic FAQ strings
code = code.replace(
  `a: 'Sur 100% de vos appareils. Vous pouvez écouter les fichiers MP3 sur smartphone (iPhone, Android), tablette, ordinateur ou les diffuser sur enceinte connectée. Les fichiers EPUB s\'ouvrent sur l\\\'application Livres d\\\'Apple, Kindle, Kobo ou toute liseuse.',`,
  `a: "Sur 100% de vos appareils. Vous pouvez écouter les fichiers MP3 sur smartphone (iPhone, Android), tablette, ordinateur ou les diffuser sur enceinte connectée. Les fichiers EPUB s'ouvrent sur l'application Livres d'Apple, Kindle, Kobo ou toute liseuse.",`
);

code = code.replace(
  `a: 'C\\\'est très simple : testez les histoires avec votre enfant ce soir. Si pour une raison quelconque vous n\\\'êtes pas totalement satisfait, envoyez-nous un simple e-mail et nous vous remboursons intégralement.',`,
  `a: "C'est très simple : testez les histoires avec votre enfant ce soir. Si pour une raison quelconque vous n'êtes pas totalement satisfait, envoyez-nous un simple e-mail et nous vous remboursons intégralement.",`
);

// Also check any other:
// "Parfait pour initier à l'anglais dès 4 ans"
code = code.replace(
  `'Parfait pour initier à l\\'anglais dès 4 ans',`,
  `"Parfait pour initier à l'anglais dès 4 ans",`
);

fs.writeFileSync('pages/facebook-ads.js', code, 'utf8');
fs.writeFileSync('push_temp/pages/facebook-ads.js', code, 'utf8');
console.log('Fixed quotes in both files.');
