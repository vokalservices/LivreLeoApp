const fs = require('fs');
const content = fs.readFileSync('.env.local', 'utf8');
content.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[k] = v;
  }
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products in DB:`);
  for (const p of products) {
    console.log(`ID: ${p.id}, Title: "${p.title}", Current Price: ${p.price}`);
  }

  console.log('\nUpdating all product prices to 1300 FCFA...');
  const res = await prisma.product.updateMany({
    data: {
      price: 1300
    }
  });
  console.log(`Updated ${res.count} products to price 1300.`);

  const verify = await prisma.product.findMany({ select: { id: true, title: true, price: true } });
  console.log('Verification:', verify);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
