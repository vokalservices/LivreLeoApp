/**
 * scripts/fix-page-urls.js
 * Corrige les URLs de pages dans la base (metadata.pages) :
 *   - "illustrations/illustrations/" → "illustrations/"
 *   - "audio/audio/"                → "audio/"
 * Ces doublons de préfixe rendaient les URLs cassées (400) et
 * bloquaient la lecture audio automatisée.
 *
 * Usage : node scripts/fix-page-urls.js [--apply]
 * Sans --apply : mode dry-run (affiche les corrections sans écrire).
 */
const fs = require('fs');

const env = {};
fs.readFileSync('.env.local', 'utf-8').split(/\r?\n/).forEach(line => {
  const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (m) env[m[1]] = m[2];
});
Object.assign(process.env, env);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');

function fixUrl(url) {
  if (!url) return url;
  let out = url;
  out = out.replace(/\/illustrations\/illustrations\//g, '/illustrations/');
  out = out.replace(/\/audio\/audio\//g, '/audio/');
  return out;
}

async function main() {
  const products = await prisma.product.findMany({ orderBy: { id: 'asc' } });
  let totalFixes = 0;

  for (const p of products) {
    const meta = JSON.parse(p.metadata || '{}');
    const pages = meta.pages || [];
    let fixes = 0;

    for (const pg of pages) {
      const oldImg = pg.image, oldAud = pg.audio;
      if (oldImg) pg.image = fixUrl(oldImg);
      if (oldAud) pg.audio = fixUrl(oldAud);
      if (pg.image !== oldImg) fixes++;
      if (pg.audio !== oldAud) fixes++;
    }

    if (fixes > 0) {
      console.log(`ID ${p.id} ${p.lang.padEnd(2)} | ${p.title.padEnd(35)} | ${fixes} corrections`);
      if (APPLY) {
        await prisma.product.update({
          where: { id: p.id },
          data: { metadata: JSON.stringify(meta) },
        });
      }
      totalFixes += fixes;
    }
  }

  console.log(`\n${APPLY ? '✅ APPLIQUÉ' : '🔍 DRY-RUN'} — ${totalFixes} corrections au total`);
  if (!APPLY) console.log('Lancez avec --apply pour écrire en base.');
  await prisma.$disconnect();
}

main().catch(e => { console.error('ERR', e.message); process.exit(1); });
