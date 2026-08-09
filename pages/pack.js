import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useLang } from '../lib/LangContext';
import { t, eur } from '../lib/translations';
import PayPalButton from '../components/PayPalButton';

const UNIT_PRICE   = 4.99;
const PACK_PRICE   = 14.99;
const COMBO_PRICE  = 22.99;
const NORMAL_PACK  = +(4.99 * 6).toFixed(2);   // 29.94
const NORMAL_COMBO = +(4.99 * 12).toFixed(2);  // 59.88

const BOOKS_FR = [
  { tome: 1, title: "Le Voleur d'Ombres",  desc: "Léo perd son ombre et s'envole dans sa Fusée-Carton pour la récupérer." },
  { tome: 2, title: "Le Voleur d'Étoiles", desc: "Les étoiles de la Galaxie des Douceurs disparaissent une à une." },
  { tome: 3, title: "Le Voleur de Couleurs",desc: "Le monde perd ses couleurs — Léo et le Yéti bleu partent à la rescousse." },
  { tome: 4, title: "Le Voleur de Nuages", desc: "Le ciel est vide : tous les nuages ont été capturés !" },
  { tome: 5, title: "Le Voleur de Rêves",  desc: "Les rêves des enfants sont volés — toute l'équipe est réunie." },
  { tome: 6, title: "Le Voleur de Temps",  desc: "Édition Collector — Tic-Tac le hibou fige le Temps. Jeux et diplôme inclus !" },
];

const BOOKS_EN = [
  { tome: 1, title: "The Shadow Thief",  desc: "Leo loses his shadow and blasts off in his Cardboard Rocket to get it back." },
  { tome: 2, title: "The Star Thief",    desc: "The stars of the Candy Galaxy vanish one by one." },
  { tome: 3, title: "The Color Thief",   desc: "The world is losing its colors — Leo and the Blue Yeti race to the rescue." },
  { tome: 4, title: "The Cloud Thief",   desc: "The sky is empty: every cloud has been captured!" },
  { tome: 5, title: "The Dream Thief",   desc: "Children's dreams are stolen — the whole crew reunites." },
  { tome: 6, title: "The Time Thief",    desc: "Collector Edition — Tic-Tac the owl freezes Time. Games & diploma included!" },
];

export default function Pack() {
  const router = useRouter();
  const { lang } = useLang();
  const tr = t[lang];
  const isCombo = router.query.combo === '1';

  const basePrice   = isCombo ? COMBO_PRICE : PACK_PRICE;
  const normalPrice = isCombo ? NORMAL_COMBO : NORMAL_PACK;
  const bookCount   = isCombo ? 12 : 6;
  const savings     = normalPrice - basePrice;
  const pct         = Math.round((savings / normalPrice) * 100);

  // ── Code promo ────────────────────────────────────────────────────────────
  const [couponCode, setCouponCode]       = useState('');
  const [couponError, setCouponError]     = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [freeLoading, setFreeLoading]     = useState(false);
  const [freeEmail, setFreeEmail]         = useState('');
  const [freeEmailError, setFreeEmailError] = useState('');

  const price      = Math.max(0, basePrice - discountAmount);
  const isFree     = price === 0;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const res  = await fetch(`/api/coupons?validate=1&code=${encodeURIComponent(code)}&price=${basePrice}`);
      const data = await res.json();
      if (data.valid) {
        setDiscountAmount(data.discount);
        setCouponSuccess(`✓ -${data.value}${data.type === 'percent' ? '%' : '€'} appliqué${data.description ? ` · ${data.description}` : ''}`);
      } else {
        setDiscountAmount(0);
        setCouponError(data.error || 'Code promo invalide.');
      }
    } catch {
      setCouponError('Erreur de connexion.');
    } finally {
      setCouponLoading(false);
    }
  };

  const processFreeCheckout = async () => {
    if (!freeEmail || !freeEmail.includes('@')) {
      setFreeEmailError('Veuillez entrer une adresse email valide pour recevoir vos fichiers.');
      return;
    }
    setFreeEmailError('');
    setFreeLoading(true);
    try {
      const res  = await fetch('/api/checkout_free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon: couponCode.trim().toUpperCase(),
          bookId: 1,
          email: freeEmail.trim(),
          productId: isCombo ? 'combo' : 'pack',
          amount: 0,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Erreur lors du traitement gratuit.');
      }
    } catch {
      alert('Erreur de connexion.');
    } finally {
      setFreeLoading(false);
    }
  };

  const packTitle = isCombo
    ? (lang === 'fr' ? 'Pack Combo FR + EN — 12 Livres' : 'Combo Pack FR + EN — 12 Books')
    : (lang === 'fr' ? 'Pack Intégral — Les 6 Aventures de Léo' : "Complete Pack — Leo's 6 Adventures");

  const books = isCombo
    ? [...BOOKS_FR.map(b => ({ ...b, lang: 'FR' })), ...BOOKS_EN.map(b => ({ ...b, lang: 'EN' }))]
    : (lang === 'fr' ? BOOKS_FR : BOOKS_EN);

  const accentColor = isCombo ? 'violet' : 'yellow';

  const priceColor = isCombo ? 'text-violet-300' : 'text-yellow-300';
  const heroBg     = isCombo
    ? 'bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-900'
    : 'bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-900';

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-24">

        {/* ── Hero ── */}
        <div className={`relative ${heroBg} text-white overflow-hidden py-16 px-6 mb-12`}>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto relative z-10 text-center">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-5
              ${isCombo
                ? 'bg-violet-400/20 border border-violet-300/40 text-violet-200'
                : 'bg-yellow-400/20 border border-yellow-300/40 text-yellow-200'}`}>
              ✦ {lang === 'fr'
                ? (isCombo ? 'Offre Bilingue · Économisez 48 %' : 'Offre Exclusive · Économisez 50 %')
                : (isCombo ? 'Bilingual Offer · Save 48 %'       : 'Exclusive Offer · Save 50 %')}
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
              {isCombo
                ? (lang === 'fr' ? <>Pack Combo<br /><span className={`text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-indigo-200`}>FR + EN — 12 Livres</span></> : <>Combo Pack<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-indigo-200">FR + EN — 12 Books</span></>)
                : (lang === 'fr' ? <>Pack Intégral<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-200">Les 6 Aventures de Léo</span></> : <>Complete Pack<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-200">{"Leo's 6 Adventures"}</span></>)
              }
            </h1>

            <p className="text-indigo-200 text-lg max-w-2xl mx-auto mb-8">
              {isCombo
                ? (lang === 'fr'
                    ? "L'intégrale en français ET en anglais — 12 e-books illustrés, formats EPUB & PDF, idéal pour les familles bilingues."
                    : 'The complete series in French AND English — 12 illustrated e-books, EPUB & PDF formats, perfect for bilingual families.')
                : (lang === 'fr'
                    ? 'Toute la collection en une seule commande — 6 e-books illustrés en aquarelle, 6 narrations audio, formats EPUB & PDF inclus.'
                    : 'The full collection in one order — 6 watercolour illustrated e-books, 6 audio narrations, EPUB & PDF formats included.')
              }
            </p>

            {/* Prix */}
            <div className="inline-flex flex-col items-center bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-8 py-5 mb-6">
              <div className="text-sm text-indigo-300 font-bold mb-1">
                {lang === 'fr' ? 'Prix du pack complet' : 'Full pack price'}
              </div>
              <div className="flex items-baseline gap-4">
                {discountAmount > 0 && (
                  <span className="text-indigo-300 line-through text-xl font-semibold">{eur(basePrice)}</span>
                )}
                <span className={`text-4xl font-black ${isFree ? 'text-green-300' : priceColor}`}>
                  {isFree ? (lang === 'fr' ? 'Gratuit' : 'Free') : eur(price)}
                </span>
                <div className="text-right">
                  <div className="text-indigo-300 line-through text-lg font-semibold">{eur(normalPrice)}</div>
                  <div className={`text-xs font-black ${priceColor}`}>−{pct} %</div>
                </div>
              </div>
              {!isFree && (
                <div className="text-xs text-indigo-400 mt-1">
                  {lang === 'fr'
                    ? `Soit ${eur(Math.round(price / bookCount))} / livre · Économie de ${eur(savings)}`
                    : `${eur(Math.round(price / bookCount))} / book · Save ${eur(savings)}`}
                </div>
              )}
            </div>

            {/* Code promo */}
            <div className="w-full max-w-sm mx-auto mb-5">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => { setCouponCode(e.target.value); setCouponError(''); setCouponSuccess(''); }}
                  placeholder={lang === 'fr' ? 'Code promo' : 'Promo code'}
                  className="flex-1 bg-white/15 border border-white/30 text-white placeholder-indigo-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 font-medium uppercase tracking-wider"
                  maxLength={32}
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponCode.trim()}
                  className="bg-white/20 hover:bg-white/30 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition active:scale-95 border border-white/30"
                >
                  {couponLoading ? '…' : (lang === 'fr' ? 'Appliquer' : 'Apply')}
                </button>
              </form>
              {couponSuccess && (
                <p className="text-xs text-green-300 font-semibold mt-2 text-center">{couponSuccess}</p>
              )}
              {couponError && (
                <p className="text-xs text-red-300 font-medium mt-2 text-center">{couponError}</p>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-3">
              {isFree ? (
                <div className="w-full max-w-sm space-y-3">
                  <div>
                    <label className="text-xs font-bold text-indigo-200 uppercase tracking-wider block mb-1.5">
                      Email <span className="text-red-300">*</span>
                      <span className="ml-1 font-normal text-indigo-300 normal-case">(pour recevoir vos fichiers)</span>
                    </label>
                    <input
                      type="email"
                      value={freeEmail}
                      onChange={e => { setFreeEmail(e.target.value); setFreeEmailError(''); }}
                      placeholder="votre@email.com"
                      className="w-full bg-white/15 border border-white/30 text-white placeholder-indigo-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 font-medium"
                    />
                    {freeEmailError && (
                      <p className="text-xs text-red-300 font-medium mt-1">{freeEmailError}</p>
                    )}
                  </div>
                  <button
                    onClick={processFreeCheckout}
                    disabled={freeLoading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-extrabold px-10 py-4 rounded-2xl shadow-lg transition active:scale-95 text-base"
                  >
                    {freeLoading
                      ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{lang === 'fr' ? 'Traitement…' : 'Processing…'}</>
                      : (lang === 'fr' ? '✓ Obtenir gratuitement' : '✓ Get for free')}
                  </button>
                </div>
              ) : (
                <PayPalButton
                  book={{ id: isCombo ? 'combo' : 'pack', title: packTitle, price }}
                  isPack={!isCombo}
                  isCombo={isCombo}
                  className="w-full sm:w-auto px-10"
                />
              )}
            </div>
            <p className="text-xs text-indigo-400 mt-3">
              {lang === 'fr'
                ? 'Carte bancaire · PayPal · Cartes prépayées virtuelles · Paiement sécurisé'
                : 'Credit card · PayPal · Virtual prepaid cards · Secure payment'}
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6">

          {/* Toggle pack/combo */}
          <div className="flex justify-center gap-3 mb-10">
            <a href="/pack"
              className={`px-5 py-2 rounded-xl text-sm font-bold transition border ${!isCombo
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}>
              {lang === 'fr' ? `📖 Pack FR · ${eur(PACK_PRICE)}` : `📖 EN Pack · ${eur(PACK_PRICE)}`}
            </a>
            <a href="/pack?combo=1"
              className={`px-5 py-2 rounded-xl text-sm font-bold transition border ${isCombo
                ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                : 'bg-white text-gray-500 border-gray-200 hover:border-violet-300'}`}>
              🌍 {lang === 'fr' ? `Combo FR+EN · ${eur(COMBO_PRICE)}` : `FR+EN Combo · ${eur(COMBO_PRICE)}`}
            </a>
          </div>

          {/* Ce qui est inclus */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
            {(isCombo ? [
              { icon: '📚', label: lang === 'fr' ? '12 e-books EPUB'        : '12 EPUB e-books',       sub: lang === 'fr' ? 'FR & EN'                     : 'FR & EN' },
              { icon: '🖨️', label: lang === 'fr' ? '12 PDF imprimables'     : '12 printable PDFs',     sub: lang === 'fr' ? 'Qualité impression'           : 'Print quality' },
              { icon: '🌍', label: lang === 'fr' ? '2 langues'              : '2 languages',            sub: lang === 'fr' ? 'Français + Anglais'          : 'French + English' },
              { icon: '🎙️', label: lang === 'fr' ? 'Audio narré FR'         : 'FR audio narration',    sub: lang === 'fr' ? 'Une voix par page'           : 'Voice per page' },
              { icon: '🎨', label: lang === 'fr' ? 'Illustrations aquarelle': 'Watercolour illustrations', sub: lang === 'fr' ? 'Pages vibrantes'          : 'Vibrant pages' },
              { icon: '⚡', label: lang === 'fr' ? 'Accès immédiat'         : 'Instant access',        sub: lang === 'fr' ? 'Après paiement'             : 'After payment' },
            ] : [
              { icon: '📚', label: lang === 'fr' ? '6 e-books EPUB'         : '6 EPUB e-books',        sub: lang === 'fr' ? 'Pour liseuses et tablettes'  : 'For e-readers & tablets' },
              { icon: '🖨️', label: lang === 'fr' ? '6 PDF imprimables'      : '6 printable PDFs',      sub: lang === 'fr' ? 'Qualité impression'           : 'Print quality' },
              { icon: '🎙️', label: lang === 'fr' ? 'Audio narré'            : 'Audio narration',       sub: lang === 'fr' ? 'Une voix par page'           : 'Voice per page' },
              { icon: '🎨', label: lang === 'fr' ? 'Illustrations aquarelle': 'Watercolour illustrations', sub: lang === 'fr' ? 'Pages vibrantes'          : 'Vibrant pages' },
              { icon: '🎁', label: lang === 'fr' ? 'Édition Collector'      : 'Collector Edition',     sub: lang === 'fr' ? 'Tome 6 avec bonus'           : 'Volume 6 with bonus' },
              { icon: '⚡', label: lang === 'fr' ? 'Accès immédiat'         : 'Instant access',        sub: lang === 'fr' ? 'Après paiement'             : 'After payment' },
            ]).map(f => (
              <div key={f.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition">
                <div className="text-3xl mb-2">{f.icon}</div>
                <div className="text-sm font-bold text-gray-800">{f.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{f.sub}</div>
              </div>
            ))}
          </div>

          {/* Liste des tomes */}
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6 text-center">
            {isCombo
              ? (lang === 'fr' ? 'Les 12 tomes inclus dans le combo' : 'All 12 volumes included in the combo')
              : (lang === 'fr' ? 'Les 6 tomes inclus dans le pack'   : 'All 6 volumes included in the pack')}
          </h2>

          <div className="space-y-3 mb-12">
            {books.map((b, i) => (
              <div key={i} className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-indigo-200 transition">
                <div className={`w-10 h-10 rounded-xl text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md
                  ${b.lang === 'EN' ? 'bg-violet-600 shadow-violet-200' : 'bg-indigo-600 shadow-indigo-200'}`}>
                  {b.tome}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">{b.title}</span>
                    {isCombo && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full
                        ${b.lang === 'EN' ? 'bg-violet-100 text-violet-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {b.lang}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{b.desc}</div>
                </div>
                <div className="text-xs font-bold text-gray-300 shrink-0 line-through">{eur(UNIT_PRICE)}</div>
              </div>
            ))}
          </div>

          {/* Récap + CTA bas */}
          <div className={`rounded-3xl p-8 text-white text-center shadow-2xl
            ${isCombo ? 'bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-900' : 'bg-gradient-to-br from-indigo-600 to-indigo-800'}`}>
            <p className="text-indigo-200 text-sm mb-2">
              {lang === 'fr' ? 'Total si achat séparé' : 'Total if bought separately'}
            </p>
            <p className="text-2xl font-black line-through text-indigo-300 mb-1">{eur(normalPrice)}</p>
            <p className="text-indigo-200 text-sm mb-1">
              {lang === 'fr' ? 'Prix du Pack' : 'Pack Price'}
            </p>
            <p className={`text-4xl font-black mb-2 ${isFree ? 'text-green-300' : priceColor}`}>
              {isFree ? (lang === 'fr' ? 'Gratuit' : 'Free') : eur(price)}
            </p>
            {discountAmount > 0 && (
              <p className="text-xs text-green-300 font-bold mb-3">
                {couponSuccess}
              </p>
            )}
            <p className="text-sm text-indigo-200 mb-6">
              {lang === 'fr'
                ? `Vous économisez ${eur(savings)} — soit ${pct}% de réduction`
                : `You save ${eur(savings)} — ${pct}% off`}
            </p>
            {/* CTA bas — gratuit ou PayPal */}
            <div className="mt-3 flex flex-col items-center">
              {isFree ? (
                <div className="w-full max-w-sm space-y-3">
                  {!freeEmail && (
                    <div>
                      <label className="text-xs font-bold text-indigo-200 uppercase tracking-wider block mb-1.5">
                        Email <span className="text-red-300">*</span>
                        <span className="ml-1 font-normal text-indigo-300 normal-case">(pour recevoir vos fichiers)</span>
                      </label>
                      <input
                        type="email"
                        value={freeEmail}
                        onChange={e => { setFreeEmail(e.target.value); setFreeEmailError(''); }}
                        placeholder="votre@email.com"
                        className="w-full bg-white/15 border border-white/30 text-white placeholder-indigo-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 font-medium"
                      />
                      {freeEmailError && (
                        <p className="text-xs text-red-300 font-medium mt-1">{freeEmailError}</p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={processFreeCheckout}
                    disabled={freeLoading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-extrabold px-10 py-4 rounded-2xl shadow-lg transition active:scale-95 text-base"
                  >
                    {freeLoading
                      ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{lang === 'fr' ? 'Traitement…' : 'Processing…'}</>
                      : (lang === 'fr' ? '✓ Obtenir gratuitement' : '✓ Get for free')}
                  </button>
                </div>
              ) : (
                <PayPalButton
                  book={{ id: isCombo ? 'combo' : 'pack', title: packTitle, price }}
                  isPack={!isCombo}
                  isCombo={isCombo}
                  className="w-full sm:w-auto"
                />
              )}
            </div>
            <p className="text-xs text-indigo-400 mt-3">
              {lang === 'fr' ? 'Paiement sécurisé · Accès instantané' : 'Secure payment · Instant access'}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
