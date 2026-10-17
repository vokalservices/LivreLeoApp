/**
 * scripts/seed-books-en.js — Seed EN (mise à jour complète avec audios)
 */
const { PrismaClient } = require('@prisma/client');
const fs   = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function resolveVolume(title) {
  const t = title.toLowerCase();
  if (t.includes('shadow'))  return 1;
  if (t.includes('star'))    return 2;
  if (t.includes('color'))   return 3;
  if (t.includes('cloud'))   return 4;
  if (t.includes('dream'))   return 5;
  if (t.includes('time'))    return 6;
  return 1;
}

function folderToSlug(folder) {
  return folder.toLowerCase().replace(/_/g, '-');
}

async function main() {
  console.log('🚀 Seed EN — démarrage…');

  const projectsDir = path.join(process.cwd(), 'Projet_EN', 'projects');
  if (!fs.existsSync(projectsDir)) { console.error('❌ Dossier Projet_EN/projects/ introuvable'); process.exit(1); }

  const publicIlluDir  = path.join(process.cwd(), 'public', 'illustrations', 'en');
  const publicAudioDir = path.join(process.cwd(), 'public', 'audio', 'en');
  if (!fs.existsSync(publicIlluDir))  fs.mkdirSync(publicIlluDir,  { recursive: true });
  if (!fs.existsSync(publicAudioDir)) fs.mkdirSync(publicAudioDir, { recursive: true });

  const folders = fs.readdirSync(projectsDir).filter(f =>
    fs.statSync(path.join(projectsDir, f)).isDirectory()
  );

  for (const folder of folders) {
    const bookJsonPath = path.join(projectsDir, folder, 'book.json');
    if (!fs.existsSync(bookJsonPath)) { console.warn(`  ⚠ Pas de book.json dans ${folder}`); continue; }

    const bookData = JSON.parse(fs.readFileSync(bookJsonPath, 'utf-8'));
    const meta     = bookData.meta || bookData;

    const title       = meta.title       || folder;
    const author      = meta.author      || 'Theo Arven';
    const description = meta.description || '';
    const ageGroup    = meta.age_group   || '4-8';
    const volume      = resolveVolume(title);
    const price       = 4.99; // EUR

    const slug      = folderToSlug(folder);
    const destIllu  = path.join(publicIlluDir, slug);
    const destAudio = path.join(publicAudioDir, slug);
    if (!fs.existsSync(destIllu))  fs.mkdirSync(destIllu,  { recursive: true });
    if (!fs.existsSync(destAudio)) fs.mkdirSync(destAudio, { recursive: true });

    // Copie illustrations
    const localIlluDir = path.join(projectsDir, folder, 'illustrations');
    if (fs.existsSync(localIlluDir)) {
      for (const f of fs.readdirSync(localIlluDir)) {
        fs.copyFileSync(path.join(localIlluDir, f), path.join(destIllu, f));
      }
      console.log(`  📷 Illustrations → public/illustrations/en/${slug}/`);
    }

    // Copie audio — output/audio/ pour EN
    const audioSources = [
      path.join(projectsDir, folder, 'output', 'audio'),
      path.join(projectsDir, folder, 'audio'),
    ];
    let audioDir = null;
    for (const src of audioSources) {
      if (fs.existsSync(src) && fs.readdirSync(src).some(f => f.endsWith('.mp3'))) {
        audioDir = src; break;
      }
    }
    if (audioDir) {
      for (const f of fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'))) {
        fs.copyFileSync(path.join(audioDir, f), path.join(destAudio, f));
      }
      console.log(`  🎙 Audio → public/audio/en/${slug}/`);
    }

    // EPUB
    const ebookDir = path.join(projectsDir, folder, 'output', 'ebook');
    let epubFile = null;
    if (fs.existsSync(ebookDir)) {
      const epubs = fs.readdirSync(ebookDir).filter(f => f.endsWith('.epub') && !f.includes('ReadAloud'));
      epubFile = epubs[0] || null;
    }

    // PDF
    const printDir = path.join(projectsDir, folder, 'output', 'print');
    let pdfFile = null;
    if (fs.existsSync(printDir)) {
      const pdfs = fs.readdirSync(printDir).filter(f => f.endsWith('.pdf'));
      pdfFile = pdfs.find(f => f.toLowerCase() === 'interior.pdf') || pdfs[0] || null;
    }

    const epubPath = epubFile ? path.relative(process.cwd(), path.join(ebookDir, epubFile)).replace(/\\/g, '/') : null;
    const pdfPath  = pdfFile  ? path.relative(process.cwd(), path.join(printDir, pdfFile)).replace(/\\/g, '/') : null;

    const imageUrl = `/illustrations/en/${slug}/cover.png`;

    const richPages = (bookData.pages || []).map(page => {
      const num = String(page.page_number).padStart(3, '0');
      const audioFile = `page_${num}.mp3`;
      const audioExists = audioDir && fs.existsSync(path.join(audioDir, audioFile));
      return {
        ...page,
        image: `/illustrations/en/${slug}/${page.illustration_file || path.basename(page.image || '') || 'cover.png'}`,
        audio: audioExists ? `/audio/en/${slug}/${audioFile}` : null,
      };
    });

    const metadata = JSON.stringify({
      publisher: meta.publisher || 'KDP Publishing',
      keywords:  meta.keywords  || [],
      series:    { name: "Leo's Adventures", volume, total_volumes: 6 },
      style:     meta.style     || {},
      pages:     richPages,
      epubPath,
      pdfPath,
    });

    const existing = await prisma.product.findFirst({ where: { title, lang: 'en' } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: { description, price, imageUrl, author, ageGroup, metadata, lang: 'en' } });
      console.log(`  ✏  Mis à jour  : [T${volume}] ${title}`);
    } else {
      await prisma.product.create({ data: { title, description, price, imageUrl, author, ageGroup, metadata, lang: 'en' } });
      console.log(`  ✅ Créé        : [T${volume}] ${title}`);
    }
  }

  // Patch lang FR pour les anciens enregistrements sans lang
  await prisma.product.updateMany({ where: { lang: { not: 'en' } }, data: { lang: 'fr' } });

  console.log('\n🎉 Seed EN terminé !');
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
