const fs = require('fs');
const p = 'lib/productsData.js';
let content = fs.readFileSync(p, 'utf8');
content = content.replaceAll('"price": 1.99,', '"price": 1300,');
fs.writeFileSync(p, content, 'utf8');
console.log('Done replacing prices in productsData.js');
