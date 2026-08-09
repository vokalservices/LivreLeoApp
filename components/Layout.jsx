import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useLang } from '../lib/LangContext';
import { t } from '../lib/translations';

export default function Layout({ children, title, description, ogImage }) {
  const { lang, setLang } = useLang();
  const tr = t[lang];

  const pageTitle = title || "Fusée Carton — Les Aventures de Léo l'inventeur";
  const pageDesc  = description || "Collection illustrée en aquarelle pour les enfants de 4 à 8 ans. 6 tomes, audio narré, PDF & EPUB.";
  const pageOg    = ogImage || '/og-default.png';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description"          content={pageDesc} />
        <meta property="og:title"         content={pageTitle} />
        <meta property="og:description"   content={pageDesc} />
        <meta property="og:image"         content={pageOg} />
        <meta name="twitter:title"        content={pageTitle} />
        <meta name="twitter:description"  content={pageDesc} />
        <meta name="twitter:image"        content={pageOg} />
        <meta httpEquiv="content-language" content={lang} />
      </Head>

      {/* ── Header ── */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-200">
              L
            </div>
            <span className="font-extrabold text-lg text-slate-800 tracking-tight">Fusée Carton</span>
          </Link>

          <nav className="flex items-center space-x-4">
            <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition">
              {tr.nav_shop}
            </Link>

            {/* ── Toggle FR ↔ EN ── */}
            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition active:scale-95 select-none"
              aria-label="Switch language"
            >
              <span className="text-base leading-none">{lang === 'fr' ? '🇬🇧' : '🇫🇷'}</span>
              <span>{tr.lang_switch}</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ── Contenu ── */}
      <main className="flex-grow">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-16 pb-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10">

          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="flex items-center space-x-2.5 text-white">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">L</div>
              <span className="font-extrabold text-lg tracking-tight">Fusée Carton</span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400 font-light">{tr.footer_desc}</p>
          </div>

          <div className="md:col-span-3 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-widest text-slate-100">{tr.footer_shop}</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li><Link href="/"           className="hover:text-white transition">{tr.footer_all}</Link></li>
              <li><Link href="/#catalogue" className="hover:text-white transition">{tr.footer_tomes}</Link></li>
              <li>
                <Link href="/pack" className="hover:text-yellow-300 text-yellow-400/80 transition font-semibold flex items-center gap-1.5">
                  {tr.footer_pack}
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-widest text-slate-100">{tr.footer_pay}</h4>
            <p className="text-xs leading-normal font-light">{tr.footer_pay_desc}</p>
            <div className="flex space-x-3 text-slate-200">
              <div className="border border-slate-800 bg-slate-800/40 rounded px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase">PayPal</div>
              <div className="border border-slate-800 bg-slate-800/40 rounded px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase">Carte bancaire</div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 border-t border-slate-800 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 font-medium">
          <p>{tr.footer_copy(new Date().getFullYear())}</p>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <span>{tr.footer_illu}</span>
            <span>•</span>
            <span>{tr.footer_ebook}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
