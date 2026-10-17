const fs = require('fs');
const content = fs.readFileSync('pages/facebook-ads.js', 'utf8');
const regex = /["'](\/(?:ads|audio|illustrations|books)[^"']+)["']/g;
const paths = new Set();
let match;
while ((match = regex.exec(content)) !== null) {
  paths.add(match[1]);
}
console.log('Total asset paths found:', paths.size);
for (const p of paths) {
  const inRoot = fs.existsSync('public' + p);
  const inPush = fs.existsSync('push_temp/public' + p);
  console.log(p, '=> in root:', inRoot, '| in push_temp:', inPush);
}
