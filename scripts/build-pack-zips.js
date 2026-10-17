/**
 * scripts/build-pack-zips.js
 * Génère 6 archives ZIP précalculées dans public/downloads/
 * Usage : node scripts/build-pack-zips.js
 */

const fs     = require('fs');
const path   = require('path');
const AdmZip = require('adm-zip');

const ROOT    = process.cwd();
const OUT_DIR = path.join(ROOT, 'public', 'downloads');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const FR_DIR = path.join(ROOT, 'projects');
const EN_DIR = path.join(ROOT, 'Projet_EN', 'projects');

function collectFiles(projectsDir, format) {
  const results = [];
  const folders = fs.readdirSync(projectsDir).filter(f =>
    fs.statSync(path.join(projectsDir, f)).isDirectory()
  );
  for (const folder of folders) {
    if (format === 'epub') {
      const ebookDir = path.join(projectsDir, folder, 'output', 'ebook');
      if (!fs.existsSync(ebookDir)) continue;
      const epubs = fs.readdirSync(ebookDir)
        .filter(f => f.endsWith('.epub') && !f.includes('ReadAloud'))
        .sort((a, b) => {
          // Préférer le fichier avec accents (version finale)
          const aHas = /[éèêëàâîïôùûü]/i.test(a) ? 1 : 0;
          const bHas = /[éèêëàâîïôùûü]/i.test(b) ? 1 : 0;
          return bHas - aHas;
        });
      if (!epubs.length) continue;
      const abs   = path.join(ebookDir, epubs[0]);
      const clean = epubs[0].normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
      results.push({ abs, name: clean });
    } else {
      const printDir = path.join(projectsDir, folder, 'output', 'print');
      if (!fs.existsSync(printDir)) continue;
      const pdfs     = fs.readdirSync(printDir).filter(f => f.endsWith('.pdf'));
      const interior = pdfs.find(f => f.toLowerCase() === 'interior.pdf') || pdfs[0];
      if (!interior) continue;
      const abs   = path.join(printDir, interior);
      const clean = folder.replace(/_/g, '-').toLowerCase() + '.pdf';
      results.push({ abs, name: clean });
    }
  }
  return results;
}

function createZip(files, outPath, label) {
  const zip = new AdmZip();
  let added = 0;
  for (const { abs, name } of files) {
    if (fs.existsSync(abs)) {
      zip.addLocalFile(abs, '', name);
      added++;
    } else {
      console.warn(`  ⚠ Manquant : ${abs}`);
    }
  }
  zip.writeZip(outPath);
  const mb = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
  console.log(`  ✅ ${label} → ${path.basename(outPath)} (${added} fichiers, ${mb} MB)`);
}

function main() {
  console.log('📦 Génération des ZIPs de packs...\n');

  for (const format of ['epub', 'pdf']) {
    const frFiles    = collectFiles(FR_DIR, format);
    const enFiles    = collectFiles(EN_DIR, format);
    const comboFiles = [...frFiles, ...enFiles];

    console.log(`── ${format.toUpperCase()} — FR:${frFiles.length} EN:${enFiles.length} Combo:${comboFiles.length}`);
    createZip(frFiles,    path.join(OUT_DIR, `pack-fr-${format}.zip`),    `Pack FR     (${format})`);
    createZip(enFiles,    path.join(OUT_DIR, `pack-en-${format}.zip`),    `Pack EN     (${format})`);
    createZip(comboFiles, path.join(OUT_DIR, `pack-combo-${format}.zip`), `Combo FR+EN (${format})`);
    console.log('');
  }

  console.log('🎉 ZIPs prêts dans public/downloads/');
}

main();
