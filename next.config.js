/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  async rewrites() {
    const supabaseUrl = (process.env.SUPABASE_URL || 'https://wreswtwnlrwcbmzyioky.supabase.co').replace(/\/$/, '');
    return [
      {
        source: '/illustrations/:path*',
        destination: `${supabaseUrl}/storage/v1/object/public/illustrations/:path*`,
      },
      {
        source: '/audio/:path*',
        destination: `${supabaseUrl}/storage/v1/object/public/audio/:path*`,
      },
      {
        source: '/downloads/:path*',
        destination: `${supabaseUrl}/storage/v1/object/public/books/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
