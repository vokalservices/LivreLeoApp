// pages/_document.js — Head global, meta SEO, Open Graph
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* Police Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

        {/* Meta SEO globaux */}
        <meta name="author" content="Théo Arven" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#3730a3" />

        {/* Open Graph global */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Fusée Carton" />
        <meta property="og:image" content="/og-default.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@fuseecarton" />
        <meta name="twitter:image" content="/og-default.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
