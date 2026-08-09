/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Les illustrations sont dans public/ — pas de domaine externe requis
    // On active juste les formats modernes
    formats: ['image/webp', 'image/avif'],
  },
};

module.exports = nextConfig;
