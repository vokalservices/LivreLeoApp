/**
 * scripts/rename-supabase-pdfs.js
 * Renomme les fichiers 'interior.pdf' en 'titre-du-livre.pdf' sur Supabase et met à jour la base
 */

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient }  = require('@prisma/client');

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET               = 'books';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Définissez SUPABASE_URL et SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const prisma   = new PrismaClient();

async function main() {
  console.log('🚀 Renommage des interior.pdf en nom-du-livre.pdf…\n');

  const products = await prisma.product.findMany();

  for (const product of products) {
    const isEn = product.lang === 'en';
    const imageUrl = product.imageUrl || '';
    const slugMatch = imageUrl.match(/\/illustrations\/(?:en\/)?([^/]+)\/cover/);
    const slug = slugMatch ? slugMatch[1] : null;
    
    if (!slug) continue;
    
    console.log(`\n📚 ${product.title}`);
    const meta = JSON.parse(product.metadata || '{}');
    const langFolder = isEn ? 'en' : 'fr';
    
    const oldPath = `${langFolder}/${slug}/interior.pdf`;
    const newPath = `${langFolder}/${slug}/${slug}.pdf`;
    
    // Vérifier si le nouveau fichier existe déjà
    const folder = `${langFolder}/${slug}`;
    const { data: existingBase } = await supabase.storage.from(BUCKET).list(folder);
    
    if (existingBase?.find(f => f.name === `${slug}.pdf`)) {
      console.log(`  ⏭  Déjà renommé sur Supabase : ${newPath}`);
      meta.pdfUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${newPath}`;
      await prisma.product.update({ where: { id: product.id }, data: { metadata: JSON.stringify(meta) } });
      continue;
    }
    
    // Copier interior.pdf vers slug.pdf puis supprimer interior.pdf
    if (existingBase?.find(f => f.name === 'interior.pdf')) {
      const { data, error } = await supabase.storage.from(BUCKET).copy(oldPath, newPath);
      
      if (error) {
        console.error(`  ❌  Erreur lors de la copie :`, error);
      } else {
        console.log(`  ✅ Copié interior.pdf -> ${slug}.pdf`);
        await supabase.storage.from(BUCKET).remove([oldPath]);
        console.log(`  🗑️ Supprimé interior.pdf`);
        
        // Mettre à jour la base
        meta.pdfUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${newPath}`;
        await prisma.product.update({ where: { id: product.id }, data: { metadata: JSON.stringify(meta) } });
        console.log(`  💾 Base de données mise à jour`);
      }
    } else {
      console.log(`  ⚠️ interior.pdf introuvable, et ${slug}.pdf n'existe pas non plus.`);
    }
  }

  console.log('\n🎉 Terminé !');
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
