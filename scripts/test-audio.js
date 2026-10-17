const { PrismaClient } = require('@prisma/client');
const fs   = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function test() {
  const productId = 2;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) { console.log('PRODUIT INTROUVABLE'); return; }
  console.log('Produit:', product.title, '| prix:', product.price);

  const order = await prisma.order.findFirst({ where: { productId } });
  const isAllowed = !!order || product.price === 0;
  console.log('Commande:', !!order, '| Accès autorisé:', isAllowed);

  const meta  = JSON.parse(product.metadata || '{}');
  const pages = meta.pages || [];
  const withAudio = pages.filter(p => p.audio);
  console.log('Pages totales:', pages.length, '| Avec audio:', withAudio.length);

  if (withAudio.length > 0) {
    console.log('Exemple URL audio:', withAudio[0].audio);
    const rel = withAudio[0].audio.replace(/^\//, '');
    const abs = path.join(process.cwd(), 'public', rel);
    console.log('Chemin absolu:', abs);
    console.log('Fichier existe:', fs.existsSync(abs));
  }

  const mp3Files = withAudio.map(p => {
    const rel = p.audio.replace(/^\//, '');
    const abs = path.join(process.cwd(), 'public', rel);
    return { abs, exists: fs.existsSync(abs) };
  });
  console.log('MP3 trouvés:', mp3Files.filter(f => f.exists).length, '/', mp3Files.length);
}

test()
  .catch(e => console.error('ERREUR:', e.message))
  .finally(() => prisma.$disconnect());
