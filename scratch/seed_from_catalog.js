const { PrismaClient } = require('@prisma/client');
const { LOCAL_PRODUCTS } = require('../lib/productsData');

const prisma = new PrismaClient();

async function main() {
  console.log(`Starting seed of ${LOCAL_PRODUCTS.length} books into Supabase...`);
  
  for (const prod of LOCAL_PRODUCTS) {
    const metaStr = typeof prod.metadata === 'string' ? prod.metadata : JSON.stringify(prod.metadata);
    await prisma.product.upsert({
      where: { id: prod.id },
      update: {
        title: prod.title,
        description: prod.description,
        price: prod.price,
        imageUrl: prod.imageUrl,
        author: prod.author,
        ageGroup: prod.ageGroup,
        lang: prod.lang,
        metadata: metaStr,
      },
      create: {
        id: prod.id,
        title: prod.title,
        description: prod.description,
        price: prod.price,
        imageUrl: prod.imageUrl,
        author: prod.author,
        ageGroup: prod.ageGroup,
        lang: prod.lang,
        metadata: metaStr,
      }
    });
    console.log(`[OK] Book ${prod.id}: ${prod.title} (${prod.lang})`);
  }
  
  const count = await prisma.product.count();
  console.log(`\n🎉 Seed finished! Total books in database: ${count}`);
}

main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
