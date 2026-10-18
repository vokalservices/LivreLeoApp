/**
 * components/SasPayButton.jsx — réécriture 2026-10 (audit SasPay).
 *
 * Principes :
 *  - Le MONTANT affiché vient de la prop `amount` (prix déjà validé côté
 *    serveur par /api/coupons?validate&productId=…) ou du catalogue FCFA.
 *    Plus AUCUNE heuristique « < 500 → plein tarif » (bug coupon ×656).
 *  - Le COUPON est envoyé au serveur à chaque paiement : c'est
 *    /api/saspay/create-checkout qui le revalide et calcule le montant réel.
 *  - Réponse 409 COUPON_100 → bascule automatique sur le flux gratuit.
 *  - orderRef/amount retournés par le serveur sont mémorisés (localStorage)
 *    pour la page /success (vérification multi-appareils, sans cookie).
 *  - Mobile Money : Wave, Orange Money, MTN MoMo, Moov, carte — 100 % XOF.
 */
import React, { useState, useEffect } from 'react';

const CATALOG_XOF = { single: 1300, pack: 6500, combo: 9900 };

// NB : plus de champ téléphone/pays ici — le checkout hébergé SasPay collecte
// lui-même le numéro avec son propre drapeau. Envoyer customer_phone forçait
// un push vers un réseau précis (hypothèse du conflit Airtel Niger : le site
// scolaris.ngsafrique.com, qui n'envoie pas de téléphone, passe très bien).

export default function SasPayButton({
  book,
  isPack = false,
  isCombo = false,
  lang = 'fr',
  className = '',
  coupon = '',
  amount = null,       // prix final validé SERVEUR (après coupon) — autorité d'affichage
  initialEmail = '',
}) {
  const [email, setEmail] = useState(initialEmail || '');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');

  const isEn = lang === 'en';

  // Montant affiché : prop serveur > prix catalogue. Jamais de seuil magique.
  const catalogBase = isCombo ? CATALOG_XOF.combo : isPack ? CATALOG_XOF.pack : CATALOG_XOF.single;
  const cleanAmount = Number(amount);
  const displayAmountXof = Number.isFinite(cleanAmount) && cleanAmount > 0
    ? Math.round(cleanAmount)
    : catalogBase;
  const formattedXof = displayAmountXof.toLocaleString('fr-FR') + ' FCFA';

  const productId = isCombo ? 'combo' : isPack ? 'pack' : String(book?.id || 'single');

  // E-mail en cache (confort, jamais autorité).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = JSON.parse(localStorage.getItem('pending_purchase') || '{}');
      const cachedEmail = stored.email || localStorage.getItem('customer_email');
      if (cachedEmail && !email) setEmail(cachedEmail);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validateEmail() {
    const cleanEmail = (email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setEmailError(
        isEn
          ? 'Please enter a valid email to receive your books & audio.'
          : 'Veuillez entrer une adresse e-mail valide pour recevoir vos livres et audios.'
      );
      return null;
    }
    setEmailError('');
    try { localStorage.setItem('customer_email', cleanEmail); } catch {}
    return cleanEmail;
  }

  function trackInitiateCheckout(valueXof) {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'InitiateCheckout', {
        content_name: book?.title || (isCombo ? 'Pack Combo 12 Livres' : isPack ? 'Pack 6 Tomes' : 'Livre Léo'),
        content_ids: [productId],
        content_type: 'product',
        value: valueXof,
        currency: 'XOF',
        num_items: isCombo ? 12 : isPack ? 6 : 1,
      });
    }
  }

  // Flux gratuit (coupon 100 %) — validé serveur par /api/checkout_free.
  async function handleFreeCheckout() {
    const cleanEmail = validateEmail();
    if (!cleanEmail) return;

    setIsLoading(true);
    setLoadingStep(isEn ? 'Processing your order…' : 'Validation de votre commande…');
    setError('');

    try {
      const res = await fetch('/api/checkout_free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon: (coupon || '').trim().toUpperCase(),
          bookId: Number(book?.id) || 1,
          productId,
          email: cleanEmail,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || (isEn ? 'Error processing free order' : 'Erreur lors du traitement gratuit'));
        setIsLoading(false);
      }
    } catch {
      setError(isEn ? 'Connection error, please retry' : 'Erreur de connexion, veuillez réessayer');
      setIsLoading(false);
    }
  }

  // Paiement SasPay — le SERVEUR valide le coupon et fixe le montant.
  async function handleSasPayPayment() {
    if (isLoading) return;

    const cleanEmail = validateEmail();
    if (!cleanEmail) return;

    setIsLoading(true);
    setLoadingStep(isEn ? 'Connecting to SasPay…' : 'Connexion à SasPay (Mobile Money & Carte)…');
    setError('');

    try {
      const res = await fetch('/api/saspay/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          isPack,
          isCombo,
          coupon: (coupon || '').trim().toUpperCase(),
          customerEmail: cleanEmail,
        }),
      });
      const data = await res.json();

      // Coupon 100 % → bascule automatique sur le flux gratuit.
      if (res.status === 409 && data.error === 'COUPON_100') {
        return handleFreeCheckout();
      }

      if (res.ok && data.checkoutUrl) {
        const serverAmount = Math.round(Number(data.amount) || displayAmountXof);

        // Mémoire pour /success : orderRef (autorité) + montant serveur.
        try {
          localStorage.setItem('saspay_order_ref', String(data.orderRef || ''));
          localStorage.setItem('pending_purchase', JSON.stringify({
            orderRef: data.orderRef || null,
            productId: data.productId || productId,
            amount: serverAmount,
            currency: 'XOF',
            title: book?.title || (isCombo ? 'Pack Combo 12 Livres' : isPack ? 'Pack 6 Tomes' : 'Livre Léo'),
            email: cleanEmail,
            provider: 'saspay',
          }));
        } catch {}

        trackInitiateCheckout(serverAmount);

        setLoadingStep(isEn ? 'Redirecting to secure payment…' : 'Redirection vers la page de paiement sécurisée…');
        window.location.href = data.checkoutUrl;
      } else {
        setIsLoading(false);
        setError(data.error || (isEn ? 'Payment initialization error' : 'Erreur lors de l’initialisation du paiement SasPay'));
      }
    } catch {
      setIsLoading(false);
      setError(isEn ? 'Connection error, please retry' : 'Erreur de connexion, veuillez réessayer');
    }
  }

  return (
    <div className={`flex flex-col items-stretch gap-3.5 max-w-md mx-auto w-full ${className}`}>
      {/* ── CHAMP EMAIL (REQUIS — spec SasPay customer_email) ── */}
      <div className="w-full text-left">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
          ✉️ {isEn ? 'Email address to receive your books & audio' : 'Votre adresse e-mail pour recevoir vos livres et audios'} <span className="text-rose-500">*</span>
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
          placeholder={isEn ? 'your@email.com' : 'votre@email.com'}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B7F56] font-medium shadow-sm transition"
        />
        {emailError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1 flex items-center gap-1">
            <span>⚠️</span> {emailError}
          </p>
        )}
      </div>

      {/* ── BOUTON PRINCIPAL SASPAY (montant serveur) ── */}
      <button
        type="button"
        onClick={handleSasPayPayment}
        disabled={isLoading}
        className="group relative w-full inline-flex flex-col items-center justify-center bg-gradient-to-r from-[#1B7F56] via-[#249666] to-[#1B7F56] hover:from-[#249666] hover:to-[#2EB37A] active:scale-[0.98] disabled:opacity-75 text-white font-extrabold px-6 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 border border-emerald-400/30 cursor-pointer"
      >
        <div className="flex items-center justify-center gap-2.5 text-base sm:text-lg">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
          ) : (
            <span className="text-xl">⚡</span>
          )}
          <span>{isLoading ? loadingStep : `Payer ${formattedXof}`}</span>
        </div>
        <span className="text-[11px] text-emerald-100 font-semibold mt-1">
          Wave • Orange Money • MTN MoMo • Moov • Carte bancaire
        </span>
      </button>

      {/* ── BADGES RÉSEAUX ── */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-[#1DA1F2]/15 text-[#0c7abf] dark:text-[#38bdf8] border border-[#1DA1F2]/30">
          <span className="w-2 h-2 rounded-full bg-[#1DA1F2]" /> WAVE
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-[#FF6600]/15 text-[#d95500] dark:text-[#fb923c] border border-[#FF6600]/30">
          <span className="w-2 h-2 rounded-full bg-[#FF6600]" /> ORANGE MONEY
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-[#FFCC00]/25 text-[#997a00] dark:text-[#fde047] border border-[#FFCC00]/40">
          <span className="w-2 h-2 rounded-full bg-[#eab308]" /> MTN MOMO
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-[#009944]/15 text-[#008038] dark:text-[#4ade80] border border-[#009944]/30">
          <span className="w-2 h-2 rounded-full bg-[#009944]" /> MOOV
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
          VISA / MASTERCARD
        </span>
      </div>

      {/* Message d'erreur éventuel */}
      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 text-center font-medium bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-2.5 mt-1">
          {error}
        </p>
      )}

      {/* ── RÉASSURANCE ── */}
      <div className="flex flex-col items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 text-center pt-1">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Paiement 100% sécurisé via SasPay
          </span>
        </div>
        <span>Cryptage SSL 256 bits · Mobile Money & Carte · Accès et téléchargement immédiats</span>
      </div>
    </div>
  );
}
