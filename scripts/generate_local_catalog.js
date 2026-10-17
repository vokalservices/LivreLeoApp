const fs = require('fs');
const path = require('path');

function resolveVolume(title) {
  const t = title.toLowerCase();
  if (t.includes('ombres') || t.includes('shadow')) return 1;
  if (t.includes('étoiles') || t.includes('etoiles') || t.includes('star')) return 2;
  if (t.includes('couleurs') || t.includes('color')) return 3;
  if (t.includes('nuages') || t.includes('cloud')) return 4;
  if (t.includes('rêves') || t.includes('reves') || t.includes('dream')) return 5;
  if (t.includes('temps') || t.includes('time')) return 6;
  return 1;
}

function folderToSlug(folder) {
  return folder.toLowerCase().replace(/_/g, '-');
}

const products = [];

// 1. Livres en Français
const frDir = path.join(process.cwd(), 'projects');
if (fs.existsSync(frDir)) {
  const frFolders = fs.readdirSync(frDir).filter(f => fs.statSync(path.join(frDir, f)).isDirectory());
  for (const folder of frFolders) {
    const jsonPath = path.join(frDir, folder, 'book.json');
    if (!fs.existsSync(jsonPath)) continue;
    const b = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const meta = b.meta || b;
    const title = meta.title || folder;
    const volume = resolveVolume(title);
    const slug = folderToSlug(folder);
    
    const pages = (b.pages || []).map(p => {
      const num = String(p.page_number).padStart(3, '0');
      const audioFile = `page_${num}.mp3`;
      const audioPath = path.join(process.cwd(), 'public', 'audio', slug, audioFile);
      return {
        page_number: p.page_number,
        title: p.title || `Page ${p.page_number}`,
        text: p.text || '',
        illustration_prompt: p.illustration_prompt || '',
        illustration_file: p.illustration_file || 'cover.png',
        image: `/illustrations/${slug}/${p.illustration_file || path.basename(p.image || '') || 'cover.png'}`,
        audio: fs.existsSync(audioPath) ? `/audio/${slug}/${audioFile}` : null
      };
    });
    
    products.push({
      id: volume,
      title,
      description: meta.description || '',
      price: 4.99,
      imageUrl: `/illustrations/${slug}/cover.png`,
      author: meta.author || 'Théo Arven',
      ageGroup: meta.age_group || '4-8 ans',
      lang: 'fr',
      metadata: JSON.stringify({
        publisher: meta.publisher || 'Éditions KDP',
        keywords: meta.keywords || [],
        series: { name: 'Les Aventures de Léo', volume, total_volumes: 6 },
        style: meta.style || {},
        pages,
        epubPath: `output/ebook/${folder}.epub`,
        pdfPath: `output/print/interior.pdf`,
        pdfUrl: `https://wreswtwnlrwcbmzyioky.supabase.co/storage/v1/object/public/books/fr/${slug}/${slug}.pdf`,
        epubUrl: `https://wreswtwnlrwcbmzyioky.supabase.co/storage/v1/object/public/books/fr/${slug}/${slug}.epub`
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}

// 2. Livres en Anglais
const enDir = path.join(process.cwd(), 'Projet_EN', 'projects');
if (fs.existsSync(enDir)) {
  const enFolders = fs.readdirSync(enDir).filter(f => fs.statSync(path.join(enDir, f)).isDirectory());
  for (const folder of enFolders) {
    const jsonPath = path.join(enDir, folder, 'book.json');
    if (!fs.existsSync(jsonPath)) continue;
    const b = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const meta = b.meta || b;
    const title = meta.title || folder;
    const volume = resolveVolume(title);
    const slug = folderToSlug(folder);
    
    const pages = (b.pages || []).map(p => {
      const num = String(p.page_number).padStart(3, '0');
      const audioFile = `page_${num}.mp3`;
      const audioPath = path.join(process.cwd(), 'public', 'audio', 'en', slug, audioFile);
      return {
        page_number: p.page_number,
        title: p.title || `Page ${p.page_number}`,
        text: p.text || '',
        illustration_prompt: p.illustration_prompt || '',
        illustration_file: p.illustration_file || 'cover.png',
        image: `/illustrations/en/${slug}/${p.illustration_file || path.basename(p.image || '') || 'cover.png'}`,
        audio: fs.existsSync(audioPath) ? `/audio/en/${slug}/${audioFile}` : null
      };
    });
    
    products.push({
      id: 10 + volume,
      title,
      description: meta.description || '',
      price: 4.99,
      imageUrl: `/illustrations/en/${slug}/cover.png`,
      author: meta.author || 'Theo Arven',
      ageGroup: meta.age_group || '4-8 years',
      lang: 'en',
      metadata: JSON.stringify({
        publisher: meta.publisher || 'KDP Publishing',
        keywords: meta.keywords || [],
        series: { name: 'Leo Adventures', volume, total_volumes: 6 },
        style: meta.style || {},
        pages,
        epubPath: `Projet_EN/output/ebook/${folder}.epub`,
        pdfPath: `Projet_EN/output/print/interior.pdf`,
        pdfUrl: `https://wreswtwnlrwcbmzyioky.supabase.co/storage/v1/object/public/books/en/${slug}/${slug}.pdf`,
        epubUrl: `https://wreswtwnlrwcbmzyioky.supabase.co/storage/v1/object/public/books/en/${slug}/${slug}.epub`
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}

// Trier par volume
products.sort((a, b) => {
  const va = JSON.parse(a.metadata || '{}')?.series?.volume || 0;
  const vb = JSON.parse(b.metadata || '{}')?.series?.volume || 0;
  return va - vb;
});

const outPath = path.join(process.cwd(), 'lib', 'productsData.js');
const fileContent = `// lib/productsData.js — Fallback catalogue local ultra-rapide et résilient
export const LOCAL_PRODUCTS = ${JSON.stringify(products, null, 2)};

export function getLocalProducts(lang) {
  if (lang === 'fr') return LOCAL_PRODUCTS.filter(p => p.lang === 'fr');
  if (lang === 'en') return LOCAL_PRODUCTS.filter(p => p.lang === 'en');
  return LOCAL_PRODUCTS;
}

export default LOCAL_PRODUCTS;
`;

fs.writeFileSync(outPath, fileContent, 'utf-8');
console.log(`✅ Fichier lib/productsData.js généré avec ${products.length} produits (6 FR + 6 EN).`);
