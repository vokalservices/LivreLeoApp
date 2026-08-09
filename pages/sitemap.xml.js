// Sitemap dynamique — généré à partir des produits en base
import prisma from '../lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://fuseecarton.com';

function generateSitemap(products) {
  const staticPages = ['', '/pack'];
  const productPages = products.map(p => `/books/${p.id}`);
  const allPages = [...staticPages, ...productPages];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(path => `  <url>
    <loc>${BASE_URL}${path}</loc>
    <changefreq>${path === '' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${path === '' ? '1.0' : path === '/pack' ? '0.9' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;
}

export default function Sitemap() { return null; }

export async function getServerSideProps({ res }) {
  const products = await prisma.product.findMany({ select: { id: true } });
  const sitemap = generateSitemap(products);

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(sitemap);
  res.end();

  return { props: {} };
}
