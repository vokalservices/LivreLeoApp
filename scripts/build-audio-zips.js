/**
 * scripts/build-audio-zips.js
 * Génère un ZIP audio par tome (FR + EN) + les packs dans public/downloads/
 * Usage : node scripts/build-audio-zips.js
 */

const fs      = require('fs');
const path    = require('path');
const AdmZip  = require('adm-zip');

const ROOT     = process.cwd();
const OUT_DIR  = path.join(ROOT, 'public', 'downloads');
const AUDIO_FR = path.join(ROOT, 'public', 'audio');
const AUDIO_EN = path.join(ROOT, 'public', 'audio', 'en');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function collectAudioFiles(audioDir, slugPrefix) {
  const results = [];
  if (!fs.existsSync(audioDir)) return results;

  const slugs = fs.readdirSync(audioDir).filter(f => {
    const full = path.join(audioDir, f);
    return fs.statSync(full).isDirectory() && f !== 'en';
  });

  for (const slug of slugs) {
    const slugDir = path.join(audioDir, slug);
    const mp3s    = fs.readdirSync(slugDir).filter(f => f.endsWith('.mp3')).sort();
    if (!mp3s.length) continue;
    results.push({ slug: slugPrefix ? `${slugPrefix}/${slug}` : slug, dir: slugDir, mp3s });
  }
  return results;
}

function createZip(entries, outPath, label) {
  const zip   = new AdmZip();
  let   added = 0;
  for (const { dir, mp3s, folder } of entries) {
    for (const mp3 of mp3s) {
      const abs = path.join(dir, mp3);
      if (fs.existsSync(abs)) {
        zip.addLocalFile(abs, folder || '', mp3);
        added++;
      }
    }
  }
  zip.writeZip(outPath);
  const mb = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
  console.log(`  ✅ ${label} → ${path.basename(outPath)} (${added} fichiers, ${mb} MB)`);
}

function main() {
  console.log('🎙️  Génération des ZIPs audio...\n');

  // ── ZIPs par tome FR ──────────────────────────────────────────────────────
  const frSlugs = collectAudioFiles(AUDIO_FR, '');
  console.log(`── FR : ${frSlugs.length} tomes`);
  for (const { slug, dir, mp3s } of frSlugs) {
    const outPath = path.join(OUT_DIR, `audio-fr-${slug}.zip`);
    createZip([{ dir, mp3s, folder: '' }], outPath, `Audio FR  ${slug}`);
  }

  // ── ZIPs par tome EN ──────────────────────────────────────────────────────
  const enSlugs = collectAudioFiles(AUDIO_EN, '');
  console.log(`\n── EN : ${enSlugs.length} tomes`);
  for (const { slug, dir, mp3s } of enSlugs) {
    const outPath = path.join(OUT_DIR, `audio-en-${slug}.zip`);
    createZip([{ dir, mp3s, folder: '' }], outPath, `Audio EN  ${slug}`);
  }

  // ── Pack FR audio (tous les tomes FR) ────────────────────────────────────
  console.log('\n── Packs');
  const frEntries = frSlugs.map(({ slug, dir, mp3s }) => ({ dir, mp3s, folder: slug }));
  createZip(frEntries, path.join(OUT_DIR, 'pack-fr-audio.zip'), 'Pack FR   (audio)');

  // ── Pack EN audio ────────────────────────────────────────────────────────
  const enEntries = enSlugs.map(({ slug, dir, mp3s }) => ({ dir, mp3s, folder: slug }));
  createZip(enEntries, path.join(OUT_DIR, 'pack-en-audio.zip'), 'Pack EN   (audio)');

  // ── Combo FR+EN audio ────────────────────────────────────────────────────
  createZip([...frEntries, ...enEntries], path.join(OUT_DIR, 'pack-combo-audio.zip'), 'Combo FR+EN (audio)');

  console.log('\n🎉 ZIPs audio prêts dans public/downloads/');
}

main();
