import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Book from '../components/Book';
import Layout from '../components/Layout';
import { useLang } from '../lib/LangContext';
import { t, eur } from '../lib/translations';

// ── Constantes de prix (EUR) ────────────────────────────────────────────────
const UNIT_PRICE   = 4.99;
const PACK_PRICE   = 16.49;   // FR ou EN seul
const COMBO_PRICE  = 30.99;   // FR + EN
const NORMAL_PACK  = +(UNIT_PRICE * 6).toFixed(2);       // 29.94
const NORMAL_COMBO = +(UNIT_PRICE * 12).toFixed(2);      // 59.88
const TOTAL_BOOKS  = 6;
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET_CODE || 'KIRO2026';

// ── Hook reveal au scroll ───────────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function BookCard({ book, delay }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal reveal-delay-${delay + 1}`}>
      <Book
        id={book.id}
        title={book.title}
        description={book.description}
        price={book.price}
        imageUrl={book.imageUrl}
        author={book.author}
        ageGroup={book.ageGroup}
        metadata={book.metadata}
      />
    </div>
  );
}

// ── Grille de prix ──────────────────────────────────────────────────────────
function PricingGrid({ lang }) {
  const tr = t[lang];
  return (
    <div className="w-full max-w-3xl mx-auto mt-8 mb-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        {/* Unitaire */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-4 text-center flex flex-col gap-1 shadow-sm">
          <div className="text-[10px] text-purple-200 font-bold uppercase tracking-wider">{tr.price_unit_label}</div>
          <div className="text-xl font-extrabold text-white">{eur(UNIT_PRICE)}</div>
          <div className="text-[10px] text-purple-300">1 {lang === 'fr' ? 'livre' : 'book'}</div>
        </div>

        {/* Pack FR */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-4 text-center flex flex-col gap-1 shadow-sm">
          <div className="text-[10px] text-purple-200 font-bold uppercase tracking-wider">{tr.price_fr_label}</div>
          <div className="text-xl font-extrabold text-white">{eur(PACK_PRICE)}</div>
          <div className="text-[10px] text-purple-300 line-through">{eur(NORMAL_PACK)}</div>
          <div className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 rounded-full py-0.5 px-2 inline-block mx-auto border border-emerald-400/30">−45 %</div>
        </div>

        {/* Pack EN */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-4 text-center flex flex-col gap-1 shadow-sm">
          <div className="text-[10px] text-purple-200 font-bold uppercase tracking-wider">{tr.price_en_label}</div>
          <div className="text-xl font-extrabold text-white">{eur(PACK_PRICE)}</div>
          <div className="text-[10px] text-purple-300 line-through">{eur(NORMAL_PACK)}</div>
          <div className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 rounded-full py-0.5 px-2 inline-block mx-auto border border-emerald-400/30">−45 %</div>
        </div>

        {/* Combo FR+EN */}
        <div className="bg-gradient-to-b from-amber-400/25 to-amber-500/15 backdrop-blur-md border border-amber-300/40 rounded-2xl px-4 py-4 text-center flex flex-col gap-1 relative overflow-hidden shadow-md">
          <div className="absolute top-1.5 right-2 text-[8px] font-black text-amber-950 bg-amber-300 px-1.5 py-0.5 rounded-full">−48 %</div>
          <div className="text-[10px] text-amber-200 font-bold uppercase tracking-wider">{tr.price_combo_label}</div>
          <div className="text-xl font-extrabold text-amber-300">{eur(COMBO_PRICE)}</div>
          <div className="text-[10px] text-amber-200/70 line-through">{eur(NORMAL_COMBO)}</div>
          <div className="text-[10px] text-amber-200/90">{tr.price_combo_sub}</div>
        </div>

      </div>
    </div>
  );
}

// ── Composant section Pack ──────────────────────────────────────────────────
function PackSection({ lang, price, normalPrice, href, badge, title, desc, features, cta, unitInfo }) {
  const savings = normalPrice - price;
  const isCombo = price === COMBO_PRICE;
  return (
    <div className={`relative rounded-3xl p-8 md:p-10 overflow-hidden shadow-xl border transition-all duration-300 hover:shadow-2xl
      ${isCombo
        ? 'bg-gradient-to-b from-[#FAF5FF] via-white to-[#F8F2FF] border-[#C8B3E4]'
        : 'bg-white border-[#E0D4EE]'}`}>
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#7C5CAA]/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-[#E8A838]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        {/* Icône livres */}
        <div className="shrink-0 flex items-end gap-1.5">
          {[...Array(isCombo ? 6 : 6)].map((_, i) => (
            <div key={i}
              style={{ height: `${48 + i * 8}px`, width: '10px', borderRadius: '3px', opacity: 0.75 + i * 0.04 }}
              className={`shadow-sm ${isCombo ? 'bg-gradient-to-b from-[#A78BFA] to-[#7C5CAA]' : 'bg-gradient-to-b from-[#E8A838] to-[#D97706]'}`}
            />
          ))}
          <div className="ml-3 w-20 h-28 bg-[#F5EEFF] rounded-2xl flex items-center justify-center border border-[#E0D4EE] shadow-md">
            <span className="text-[#2D2444] font-black text-3xl">{isCombo ? '12' : '6'}</span>
          </div>
        </div>

        {/* Texte */}
        <div className="flex-1 text-center md:text-left">
          <div className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-3
            ${isCombo ? 'bg-[#7C5CAA]/10 border border-[#7C5CAA]/25 text-[#7C5CAA]' : 'bg-[#E8A838]/15 border border-[#E8A838]/30 text-[#B45309]'}`}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {badge}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#2D2444] mb-2 leading-tight">{title}</h2>
          <p className="text-[#6B5E80] text-sm leading-relaxed mb-5">{desc}</p>

          <div className="flex flex-wrap gap-2 mb-6 justify-center md:justify-start">
            {features.map(f => (
              <span key={f} className="text-[11px] font-semibold text-[#5A4878] bg-[#F8F5FA] border border-[#E0D4EE] px-3 py-1 rounded-lg">
                ✓ {f}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <div>
              <div className="flex items-baseline gap-3">
                <span className={`text-3xl font-black ${isCombo ? 'text-[#7C5CAA]' : 'text-[#2D2444]'}`}>{eur(price)}</span>
                <span className="text-[#8B7EA0] line-through text-lg font-semibold">{eur(normalPrice)}</span>
              </div>
              <div className="text-xs text-[#8B7EA0] mt-0.5">{unitInfo(Math.round(price / (isCombo ? 12 : 6)), savings)}</div>
            </div>
            <a href={href}
              className="font-black px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-sm whitespace-nowrap flex items-center gap-2 bg-gradient-to-r from-[#7C5CAA] to-[#9B7CC8] text-white hover:from-[#6D4E9B] hover:to-[#8C6DBA] shadow-[#7C5CAA]/25">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cta}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { lang } = useLang();
  const tr = t[lang];

  const [books, setBooks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [keyBuffer, setKeyBuffer]   = useState('');
  const [adminVisible, setAdminVisible] = useState(false);

  // Recharge les livres à chaque changement de langue
  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/products?lang=${lang}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setBooks(data))
      .catch(() => setError(tr.cat_error1))
      .finally(() => setLoading(false));
  }, [lang]);

  // Touche secrète admin
  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.toUpperCase();
    if (key.length !== 1) return;
    setKeyBuffer(prev => {
      const next = (prev + key).slice(-ADMIN_SECRET.length);
      if (next === ADMIN_SECRET) {
        setAdminVisible(true);
        setTimeout(() => setAdminVisible(false), 10000);
        return '';
      }
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Layout
      title="Fusée Carton — Les Aventures de Léo l'inventeur"
      description="Collection illustrée en aquarelle pour les enfants de 4 à 8 ans. 6 tomes, 6 narrations audio. Disponibles en PDF & EPUB."
      ogImage="/og-default.png"
    >
      <div className="min-h-screen bg-[#FAF7F5] pb-24">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-b from-[#2D2444] via-[#382C54] to-[#251D38] text-white overflow-hidden mb-16 py-20 px-8 border-b border-[#E0D4EE]/20 shadow-lg">
          {/* Orbes décoratifs apaisants */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#7C5CAA]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#9B7CC8]/20 rounded-full blur-3xl pointer-events-none -mb-20" />

          {/* ── Couverture tome 1 — fondue directement dans le hero ── */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/leo-et-le-voleur-d-ombres/cover.png"
            alt=""
            aria-hidden="true"
            className="hidden lg:block"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '320px',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center',
              pointerEvents: 'none',
              userSelect: 'none',
              animation: 'leoFadeIn 1.4s ease-out forwards, heroFloatLeft 14s ease-in-out 1.4s infinite',
              opacity: 0,
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 15%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.85) 55%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 15%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.9) 70%, transparent 100%)',
              maskComposite: 'intersect',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 15%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.85) 55%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 15%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.9) 70%, transparent 100%)',
              WebkitMaskComposite: 'source-in',
            }}
          />

          {/* ── Couverture tome 5 — fondue directement dans le hero ── */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/leo-et-le-voleur-de-reves/cover.png"
            alt=""
            aria-hidden="true"
            className="hidden lg:block"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '320px',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center',
              pointerEvents: 'none',
              userSelect: 'none',
              animation: 'leoFadeIn 1.4s ease-out forwards, heroFloatRight 16s ease-in-out 1.4s infinite',
              opacity: 0,
              maskImage: 'linear-gradient(to left, transparent 0%, rgba(0,0,0,0.5) 15%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.85) 55%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 15%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.9) 70%, transparent 100%)',
              maskComposite: 'intersect',
              WebkitMaskImage: 'linear-gradient(to left, transparent 0%, rgba(0,0,0,0.5) 15%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.85) 55%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 15%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.9) 70%, transparent 100%)',
              WebkitMaskComposite: 'source-in',
            }}
          />

          {/* Contenu texte centré */}
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <span className="inline-block bg-white/10 backdrop-blur-md text-purple-200 text-xs font-bold tracking-wider uppercase px-4 py-1.5 rounded-full mb-6 border border-white/15">
              {tr.hero_badge}
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
              {tr.hero_title1} <br className="hidden md:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-200">
                {tr.hero_title2}
              </span>
            </h1>
            <p className="text-base md:text-lg text-purple-100/90 max-w-2xl mx-auto font-normal leading-relaxed mb-8">
              {tr.hero_subtitle}
            </p>

            {/* ── Grille de prix ── */}
            <PricingGrid lang={lang} />

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center mt-8">
              <a href="#pack"
                className="bg-gradient-to-r from-[#E8A838] to-[#F59E0B] hover:from-[#DF9D2F] hover:to-[#E69302] text-[#2D2444] font-black px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-amber-950/30 active:scale-95 flex items-center gap-2 justify-center text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3h14l-1.5 9H6.5L5 3zm0 0L3 1M19 3l2-2M9 21a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
                {tr.hero_cta_pack}
              </a>
              <a href="#catalogue"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-8 py-3.5 rounded-2xl transition-all active:scale-95 flex items-center gap-2 justify-center text-sm">
                {tr.hero_cta_cat}
              </a>
            </div>
          </div>
        </div>

        {/* ── PACKS ────────────────────────────────────────────────────────── */}
        <div id="pack" className="max-w-4xl mx-auto px-6 mb-12 flex flex-col gap-8">

          {/* Pack langue active (FR ou EN selon visiteur) */}
          <PackSection
            lang={lang}
            price={PACK_PRICE}
            normalPrice={NORMAL_PACK}
            href="/pack"
            badge={tr.pack_badge}
            title={tr.pack_title}
            desc={tr.pack_desc}
            features={tr.pack_features}
            cta={tr.pack_cta}
            unitInfo={tr.pack_unit_info}
          />

          {/* Pack Combo FR + EN */}
          <PackSection
            lang={lang}
            price={COMBO_PRICE}
            normalPrice={NORMAL_COMBO}
            href="/pack?combo=1"
            badge={tr.combo_badge}
            title={tr.combo_title}
            desc={tr.combo_desc}
            features={tr.combo_features}
            cta={tr.combo_cta}
            unitInfo={tr.combo_unit_info}
          />
        </div>

        {/* ── CATALOGUE ────────────────────────────────────────────────────── */}
        <div id="catalogue" className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-[#2D2444] tracking-tight">{tr.cat_title}</h2>
              <p className="text-[#6B5E80] mt-1.5">{tr.cat_subtitle(UNIT_PRICE)}</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm text-[#7C5CAA] font-bold bg-[#F5EEFF] border border-[#E0D4EE] px-4 py-1.5 rounded-full">
              <span>6 {lang === 'fr' ? 'Livres' : 'Books'}</span>
              <span>·</span>
              <span>{tr.cat_meta}</span>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7C5CAA] mb-4" />
              <p className="text-[#6B5E80] font-medium">{tr.cat_loading}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 max-w-lg mx-auto text-center">
              <p className="font-semibold mb-1">{tr.cat_error1}</p>
            </div>
          )}

          {!loading && !error && books.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book, i) => (
                <BookCard key={book.id} book={book} delay={i % 3} />
              ))}
            </div>
          )}

          {/* Rappel pack en bas */}
          {!loading && !error && books.length > 0 && (
            <div className="mt-14 text-center bg-gradient-to-r from-[#F5EEFF] to-[#FAF7F5] border border-[#E0D4EE] rounded-3xl p-8 shadow-sm">
              <p className="text-[#2D2444] font-extrabold text-lg mb-1">{tr.cat_reminder}</p>
              <p className="text-[#6B5E80] text-sm mb-5">{tr.cat_reminder2(NORMAL_PACK - PACK_PRICE)}</p>
              <a href="#pack"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#7C5CAA] to-[#9B7CC8] hover:from-[#6D4E9B] hover:to-[#8C6DBA] text-white font-black px-7 py-3 rounded-2xl text-sm transition active:scale-95 shadow-md shadow-[#7C5CAA]/25">
                {tr.cat_cta}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Bouton admin discret */}
      {adminVisible && (
        <div className="fixed bottom-6 right-6 z-50">
          <button onClick={() => router.push('/admin/login')}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 transition active:scale-95">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Administration
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-1">
            {lang === 'fr' ? 'Disparaît dans 10s' : 'Disappears in 10s'}
          </p>
        </div>
      )}
    </Layout>
  );
}
