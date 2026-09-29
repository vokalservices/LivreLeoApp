import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Book from '../components/Book';
import Layout from '../components/Layout';
import { useLang } from '../lib/LangContext';
import { t, eur } from '../lib/translations';

// ── Constantes de prix (EUR) ────────────────────────────────────────────────
const UNIT_PRICE   = 4.99;
const PACK_PRICE   = 14.99;   // FR ou EN seul
const COMBO_PRICE  = 22.99;   // FR + EN
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
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-4 text-center flex flex-col gap-1">
          <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">{tr.price_unit_label}</div>
          <div className="text-xl font-extrabold text-white">{eur(UNIT_PRICE)}</div>
          <div className="text-[10px] text-indigo-400">1 {lang === 'fr' ? 'livre' : 'book'}</div>
        </div>

        {/* Pack FR */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-4 text-center flex flex-col gap-1">
          <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">{tr.price_fr_label}</div>
          <div className="text-xl font-extrabold text-white">{eur(PACK_PRICE)}</div>
          <div className="text-[10px] text-indigo-300 line-through">{eur(NORMAL_PACK)}</div>
          <div className="text-[10px] text-emerald-400 font-bold">−50 %</div>
        </div>

        {/* Pack EN */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-4 text-center flex flex-col gap-1">
          <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">{tr.price_en_label}</div>
          <div className="text-xl font-extrabold text-white">{eur(PACK_PRICE)}</div>
          <div className="text-[10px] text-indigo-300 line-through">{eur(NORMAL_PACK)}</div>
          <div className="text-[10px] text-emerald-400 font-bold">−50 %</div>
        </div>

        {/* Combo FR+EN */}
        <div className="bg-yellow-400/20 backdrop-blur border border-yellow-300/40 rounded-2xl px-4 py-4 text-center flex flex-col gap-1 relative overflow-hidden">
          <div className="absolute top-1.5 right-2 text-[8px] font-black text-yellow-300 bg-yellow-500/30 px-1.5 py-0.5 rounded-full">−48 %</div>
          <div className="text-[10px] text-yellow-200 font-bold uppercase tracking-wider">{tr.price_combo_label}</div>
          <div className="text-xl font-extrabold text-yellow-300">{eur(COMBO_PRICE)}</div>
          <div className="text-[10px] text-yellow-400/70 line-through">{eur(NORMAL_COMBO)}</div>
          <div className="text-[10px] text-yellow-200/80">{tr.price_combo_sub}</div>
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
    <div className={`relative rounded-3xl p-8 md:p-10 overflow-hidden shadow-2xl
      ${isCombo
        ? 'bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-900'
        : 'bg-gradient-to-br from-indigo-600 to-indigo-800'}`}>
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        {/* Icône livres */}
        <div className="shrink-0 flex items-end gap-1">
          {[...Array(isCombo ? 6 : 6)].map((_, i) => (
            <div key={i}
              style={{ height: `${48 + i * 8}px`, width: '10px', borderRadius: '2px', opacity: 0.7 + i * 0.05 }}
              className={`shadow-md ${isCombo ? 'bg-gradient-to-b from-violet-300 to-violet-500' : 'bg-gradient-to-b from-yellow-300 to-yellow-500'}`}
            />
          ))}
          <div className={`ml-3 w-20 h-28 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center border border-white/30 shadow-xl`}>
            <span className="text-white font-black text-3xl">{isCombo ? '12' : '6'}</span>
          </div>
        </div>

        {/* Texte */}
        <div className="flex-1 text-center md:text-left">
          <div className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3
            ${isCombo ? 'bg-violet-400/20 border border-violet-300/40 text-violet-200' : 'bg-yellow-400/20 border border-yellow-300/40 text-yellow-200'}`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {badge}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2 leading-tight">{title}</h2>
          <p className="text-indigo-200 text-sm leading-relaxed mb-5">{desc}</p>

          <div className="flex flex-wrap gap-2 mb-6 justify-center md:justify-start">
            {features.map(f => (
              <span key={f} className="text-[11px] font-semibold text-indigo-100 bg-white/10 border border-white/20 px-2.5 py-1 rounded-lg">
                ✓ {f}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <div>
              <div className="flex items-baseline gap-3">
                <span className={`text-3xl font-black ${isCombo ? 'text-violet-300' : 'text-yellow-300'}`}>{eur(price)}</span>
                <span className="text-indigo-300 line-through text-lg font-semibold">{eur(normalPrice)}</span>
              </div>
              <div className="text-xs text-indigo-300 mt-0.5">{unitInfo(Math.round(price / (isCombo ? 12 : 6)), savings)}</div>
            </div>
            <a href={href}
              className={`font-extrabold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-sm whitespace-nowrap flex items-center gap-2
                ${isCombo
                  ? 'bg-violet-400 hover:bg-violet-300 text-slate-900'
                  : 'bg-yellow-400 hover:bg-yellow-500 text-indigo-900'}`}>
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
      <div className="min-h-screen bg-gray-50/50 pb-24">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-900 text-white overflow-hidden mb-16 py-20 px-8">
          {/* Orbes décoratifs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none -mb-20" />

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
            <span className="inline-block bg-white/10 backdrop-blur-md text-indigo-200 text-sm font-bold tracking-wider uppercase px-4 py-1.5 rounded-full mb-6 border border-white/10">
              {tr.hero_badge}
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
              {tr.hero_title1} <br className="hidden md:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-200 to-orange-200">
                {tr.hero_title2}
              </span>
            </h1>
            <p className="text-lg text-indigo-200 max-w-2xl mx-auto font-light leading-relaxed mb-8">
              {tr.hero_subtitle}
            </p>

            {/* ── Grille de prix ── */}
            <PricingGrid lang={lang} />

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <a href="#pack"
                className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2 justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3h14l-1.5 9H6.5L5 3zm0 0L3 1M19 3l2-2M9 21a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
                {tr.hero_cta_pack}
              </a>
              <a href="#catalogue"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-8 py-3.5 rounded-xl transition-all active:scale-95 flex items-center gap-2 justify-center">
                {tr.hero_cta_cat}
              </a>
            </div>
          </div>
        </div>

        {/* ── PACKS ────────────────────────────────────────────────────────── */}
        <div id="pack" className="max-w-4xl mx-auto px-6 mb-10 flex flex-col gap-8">

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
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{tr.cat_title}</h2>
              <p className="text-gray-500 mt-1.5">{tr.cat_subtitle(UNIT_PRICE)}</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm text-gray-500 font-medium">
              <span>6 {lang === 'fr' ? 'Livres' : 'Books'}</span>
              <span>·</span>
              <span>{tr.cat_meta}</span>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4" />
              <p className="text-gray-500 font-medium">{tr.cat_loading}</p>
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
            <div className="mt-12 text-center bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
              <p className="text-indigo-800 font-semibold mb-1">{tr.cat_reminder}</p>
              <p className="text-indigo-600 text-sm mb-4">{tr.cat_reminder2(NORMAL_PACK - PACK_PRICE)}</p>
              <a href="#pack"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition active:scale-95">
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
