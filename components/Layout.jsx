import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useLang } from '../lib/LangContext';
import { t } from '../lib/translations';

import LeoRocketSurprise from './LeoRocketSurprise';

export default function Layout({ children, title, description, ogImage }) {
  const { lang, setLang } = useLang();
  const tr = t[lang];

  const pageTitle = title || "Fusée Carton — Les Aventures de Léo l'inventeur";
  const pageDesc  = description || "Collection illustrée en aquarelle pour les enfants de 4 à 8 ans. 6 tomes, audio narré, PDF & EPUB.";
  const pageOg    = ogImage || '/og-default.png';

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col justify-between" style={{ fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif" }}>
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* ── Header ── */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-[#E8DDF0] z-50 shadow-[0_2px_12px_rgba(124,92,170,0.04)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2.5 group"
            onClick={() => { try { window.dispatchEvent(new Event('leo:logo-click')); } catch {} }}
            title="Psst... clique 5 fois vite !"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C5CAA] to-[#9B7CC8] flex items-center justify-center font-black text-white shadow-md shadow-[#7C5CAA]/25 group-hover:scale-105 transition-transform">
              L
            </div>
            <span className="font-extrabold text-lg text-[#2D2444] tracking-tight group-hover:text-[#7C5CAA] transition-colors">Fusée Carton</span>
          </Link>

          <nav className="flex items-center space-x-4">
            <Link href="/" className="text-sm font-semibold text-[#5A4878] hover:text-[#7C5CAA] transition">
              {tr.nav_shop}
            </Link>

            <Link href="/pack" className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#F5EEFF] text-[#7C5CAA] border border-[#E0D4EE] hover:bg-[#EDE3FA] transition flex items-center gap-1">
              <span>🎁</span>
              <span>Packs (-45%)</span>
            </Link>

            {/* ── Toggle FR ↔ EN ── */}
            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-[#E0D4EE] text-[#7C5CAA] bg-white/80 hover:bg-[#F5EEFF] transition active:scale-95 select-none"
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
      <footer className="bg-[#F5EEFF] text-[#5A4878] border-t border-[#E0D4EE] pt-16 pb-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10">

          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="flex items-center space-x-2.5 text-[#2D2444]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C5CAA] to-[#9B7CC8] flex items-center justify-center font-black text-white shadow-md shadow-[#7C5CAA]/20">L</div>
              <span className="font-extrabold text-lg tracking-tight text-[#2D2444]">Fusée Carton</span>
            </Link>
            <p className="text-sm leading-relaxed text-[#6B5E80] font-normal">{tr.footer_desc}</p>
          </div>

          <div className="md:col-span-3 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-widest text-[#2D2444]">{tr.footer_shop}</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li><Link href="/"           className="text-[#6B5E80] hover:text-[#7C5CAA] transition">{tr.footer_all}</Link></li>
              <li><Link href="/#catalogue" className="text-[#6B5E80] hover:text-[#7C5CAA] transition">{tr.footer_tomes}</Link></li>
              <li>
                <Link href="/pack" className="text-[#7C5CAA] font-bold hover:underline transition flex items-center gap-1.5">
                  {tr.footer_pack}
                </Link>
              </li>
              <li>
                <Link href="/facebook-ads" className="text-[#8B7EA0] text-xs hover:text-[#7C5CAA] transition flex items-center gap-1">
                  ✨ Offre Spéciale Soir
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-widest text-[#2D2444]">{tr.footer_pay}</h4>
            <p className="text-xs leading-normal text-[#6B5E80]">{tr.footer_pay_desc}</p>
            <div className="flex space-x-2.5 text-[#5A4878]">
              <div className="border border-[#E0D4EE] bg-white rounded-lg px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-[#003087] shadow-sm">PayPal</div>
              <div className="border border-[#E0D4EE] bg-white rounded-lg px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-[#2D2444] shadow-sm">Carte bancaire</div>
              <div className="border border-[#E0D4EE] bg-white rounded-lg px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-[#60C090] shadow-sm">SSL 256-bit</div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 border-t border-[#E0D4EE] mt-12 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-[#8B7EA0] font-medium">
          <p>{tr.footer_copy(new Date().getFullYear())}</p>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <span>{tr.footer_illu}</span>
            <span>•</span>
            <span>{tr.footer_ebook}</span>
            <span>•</span>
            <Link href="/admin/login" className="hover:text-[#7C5CAA]">Admin</Link>
          </div>
        </div>
      </footer>
      <LeoRocketSurprise />
    </div>
  );
}
