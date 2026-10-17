/**
 * scripts/check-page-urls.js
 * Analyse les URLs de pages dans la base (metadata.pages) et compte les
 * URLs corrompues (double préfixe audio/audio/, illustrations/illustrations/).
 * Mode dry-run : ne modifie RIEN.
 */
const fs = require('fs');

// Charger .env.local
const env = {};
fs.readFileSync('.env.local', 'utf-8').split(/\r?\n/).forEach(line => {
  const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (m) env[m[1]] = m[2];
});
Object.assign(process.env, env);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ orderBy: { id: 'asc' } });
  let totalBadAudio = 0, totalBadImage = 0;

  for (const p of products) {
    const meta = JSON.parse(p.metadata || '{}');
    const pages = meta.pages || [];
    let badImage = 0, badAudio = 0;

    for (const pg of pages) {
      if (pg.image && pg.image.includes('/illustrations/illustrations/')) badImage++;
      if (pg.audio && pg.audio.includes('/audio/audio/')) badAudio++;
    }
    totalBadAudio += badAudio; totalBadImage += badImage;
    console.log(`ID ${p.id} ${p.lang.padEnd(2)} | ${p.title.padEnd(35)} | mauvaises images: ${badImage} | mauvais audios: ${badAudio}`);
  }
  console.log(`\nTOTAL : ${totalBadImage} mauvaises URLs image, ${totalBadAudio} mauvaises URLs audio`);
  await prisma.$disconnect();
}

main().catch(e => { console.error('ERR', e.message); process.exit(1); });
