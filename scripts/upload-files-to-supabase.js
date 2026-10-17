/**
 * scripts/upload-files-to-supabase.js
 * Upload PDF et EPUB vers Supabase Storage bucket "books" via fetch REST
 */

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient }  = require('@prisma/client');
const fs   = require('fs');
const path = require('path');

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET               = 'books';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Définissez SUPABASE_URL et SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const prisma   = new PrismaClient();

const FOLDER_TO_SLUG = {
  'Leo_et_le_Voleur_d_Ombres':    'leo-et-le-voleur-d-ombres',
  'Leo_et_le_Voleur_d_Etoiles':   'leo-et-le-voleur-d-etoiles',
  'Leo_et_le_Voleur_de_Couleurs': 'leo-et-le-voleur-de-couleurs',
  'Leo_et_le_Voleur_de_Nuages':   'leo-et-le-voleur-de-nuages',
  'Leo_et_le_Voleur_de_Reves':    'leo-et-le-voleur-de-reves',
  'Leo_et_le_Voleur_de_Temps':    'leo-et-le-voleur-de-temps',
};

async function uploadFile(localPath, storagePath) {
  const ext      = path.extname(localPath).toLowerCase();
  const mimeType = ext === '.pdf' ? 'application/pdf' : 'application/epub+zip';
  const sizeMB   = (fs.statSync(localPath).size / 1024 / 1024).toFixed(1);

  // Vérifier si déjà uploadé
  const folder   = storagePath.split('/').slice(0, -1).join('/');
  const fileName = path.basename(storagePath);
  const { data: existing } = await supabase.storage.from(BUCKET).list(folder);
  if (existing?.find(f => f.name === fileName)) {
    const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
    console.log(`  ⏭  Déjà uploadé (${sizeMB} MB) : ${storagePath}`);
    return url;
  }

  console.log(`  ⬆  Upload ${sizeMB} MB : ${storagePath}`);

  // Upload via fetch REST avec stream
  const fileStream = fs.createReadStream(localPath);
  const fileSize   = fs.statSync(localPath).size;

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type':  mimeType,
        'Content-Length': String(fileSize),
        'x-upsert': 'true',
      },
      body: fs.readFileSync(localPath), // buffer direct
      duplex: 'half',
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Upload failed: ${err}`);
  }

  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
  console.log(`  ✅ OK : ${storagePath}`);
  return url;
}

async function main() {
  console.log('🚀 Upload PDF/EPUB vers Supabase Storage…\n');

  const products = await prisma.product.findMany({ where: { lang: 'fr' } });

  for (const [folder, slug] of Object.entries(FOLDER_TO_SLUG)) {
    const projectDir = path.join(process.cwd(), 'projects', folder);
    if (!fs.existsSync(projectDir)) { console.warn(`⚠  Dossier introuvable : ${folder}`); continue; }

    const product = products.find(p => p.imageUrl?.includes(slug));
    if (!product) { console.warn(`⚠  Produit introuvable : ${slug}`); continue; }

    console.log(`\n📚 ${product.title}`);
    const meta = JSON.parse(product.metadata || '{}');
    let changed = false;

    // PDF
    const pdfPath = path.join(projectDir, 'output', 'print', 'interior.pdf');
    if (fs.existsSync(pdfPath)) {
      meta.pdfUrl = await uploadFile(pdfPath, `fr/${slug}/interior.pdf`);
      changed = true;
    }

    // EPUB
    const ebookDir = path.join(projectDir, 'output', 'ebook');
    if (fs.existsSync(ebookDir)) {
      const epubs = fs.readdirSync(ebookDir).filter(f => f.endsWith('.epub') && !f.includes('ReadAloud'));
      const epubFile = epubs.find(f => /[éèêëàâîïôùûü]/i.test(f)) || epubs[0];
      if (epubFile) {
        meta.epubUrl = await uploadFile(path.join(ebookDir, epubFile), `fr/${slug}/${slug}.epub`);
        changed = true;
      }
    }

    if (changed) {
      await prisma.product.update({ where: { id: product.id }, data: { metadata: JSON.stringify(meta) } });
      console.log(`  💾 Base mise à jour`);
    }
  }

  console.log('\n🎉 Terminé !');
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
