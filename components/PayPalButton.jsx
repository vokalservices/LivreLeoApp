/**
 * components/PayPalButton.jsx
 * Boutons de paiement combinés Carte Bancaire + PayPal
 * - Option 1 : Payer par Carte Bancaire (Visa, Mastercard, CB) direct sans compte via PayPal Guest Checkout
 * - Option 2 : Payer avec son compte PayPal
 */
import React, { useState, useEffect } from 'react';

export default function PayPalButton({
  book,
  isPack = false,
  isCombo = false,
  lang = 'fr',
  className = '',
}) {
  const [loadingMethod, setLoadingMethod] = useState(null); // 'card' | 'paypal' | null
  const [loadingStep, setLoadingStep] = useState(''); // text message
  const [error, setError] = useState('');

  const isEn = lang === 'en';

  // Préchauffer le token PayPal en tâche de fond dès le chargement du composant
  useEffect(() => {
    try {
      fetch('/api/paypal/create-order').catch(() => {});
    } catch {}
  }, []);

  async function handlePayment(method) {
    if (loadingMethod) return;
    setLoadingMethod(method);
    setLoadingStep(isEn ? 'Securing checkout…' : 'Connexion sécurisée…');
    setError('');

    // Déclencher l'événement standard InitiateCheckout pour le Pixel Meta
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'InitiateCheckout', {
        content_name: book?.title || (isCombo ? 'Pack Combo 12 Livres' : isPack ? 'Pack 6 Tomes' : 'Livre Léo'),
        content_ids: [String(book?.id || (isCombo ? 'combo' : isPack ? 'pack' : 'single'))],
        content_type: 'product',
        value: Number(book?.price || (isCombo ? 30.99 : 16.49)),
        currency: 'EUR',
        num_items: isCombo ? 12 : isPack ? 6 : 1,
      });
    }

    // Timer d'information pour rassurer le parent si le réseau est lent
    const slowTimer = setTimeout(() => {
      setLoadingStep(isEn ? 'Connecting to payment gateway…' : 'Connexion à la passerelle…');
    }, 1500);

    try {
      if (method === 'card') {
        // ── PAIEMENT CARTE BANCAIRE VIA SASPAY ──
        const res = await fetch('/api/saspay/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            book,
            isPack,
            isCombo,
          }),
        });

        clearTimeout(slowTimer);
        const data = await res.json();

        if (data.checkoutUrl) {
          if (typeof window !== 'undefined' && data.sessionId) {
            localStorage.setItem('saspay_session_id', data.sessionId);
          }
          setLoadingStep(isEn ? 'Redirecting to payment…' : 'Redirection vers SasPay…');
          window.location.href = data.checkoutUrl;
        } else {
          setLoadingMethod(null);
          setError(data.error || (isEn ? 'Payment initialization error' : 'Erreur lors de l’initialisation de la carte bancaire'));
        }
      } else {
        // ── PAIEMENT VIA PAYPAL ──
        const res = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            book,
            isPack,
            isCombo,
            paymentMethod: 'paypal',
          }),
        });

        clearTimeout(slowTimer);
        const data = await res.json();

        if (data.approveUrl) {
          setLoadingStep(isEn ? 'Redirecting to payment…' : 'Redirection vers PayPal…');
          window.location.href = data.approveUrl;
        } else {
          setLoadingMethod(null);
          setError(data.error || (isEn ? 'Payment initialization error' : 'Erreur lors de l’initialisation'));
        }
      }
    } catch {
      clearTimeout(slowTimer);
      setLoadingMethod(null);
      setError(isEn ? 'Connection error' : 'Erreur de connexion, veuillez réessayer');
    }
  }

  const isBusy = loadingMethod !== null;

  return (
    <div className={`flex flex-col items-stretch gap-2.5 max-w-md mx-auto w-full ${className}`}>
      {/* ── BOUTON 1 : CARTE BANCAIRE (SasPay) ── */}
      <button
        type="button"
        onClick={() => handlePayment('card')}
        disabled={isBusy}
        className="group relative inline-flex items-center justify-between gap-3 bg-gradient-to-r from-[#2d2444] via-[#3d3159] to-[#2d2444] hover:from-[#3d3159] hover:to-[#4d3e70] active:scale-[0.98] disabled:opacity-75 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 border border-[#6b588e]/40"
      >
        <div className="flex items-center gap-3">
          {loadingMethod === 'card' ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
          ) : (
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/10 text-emerald-300 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </span>
          )}
          <div className="text-left">
            <span className="block text-sm sm:text-base font-extrabold leading-tight tracking-wide">
              {loadingMethod === 'card'
                ? loadingStep
                : (isEn ? 'Pay with Credit Card' : 'Payer par Carte Bancaire')}
            </span>
            <span className="block text-[11px] text-purple-200/80 font-normal">
              {isEn ? 'Visa, Mastercard, CB · Secured by SasPay' : 'CB, Visa, Mastercard · Sécurisé par SasPay'}
            </span>
          </div>
        </div>

        {/* Badges Cartes */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 pl-2">
          {/* CB */}
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-white/15 text-white tracking-wider border border-white/20">
            CB
          </span>
          {/* Visa */}
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black italic bg-white text-blue-900 shadow-sm">
            VISA
          </span>
          {/* Mastercard circles */}
          <span className="flex items-center bg-white px-1.5 py-0.5 rounded shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] inline-block -mr-1" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] inline-block opacity-90" />
          </span>
        </div>
      </button>

      {/* ── SÉPARATEUR ÉLÉGANT ── */}
      <div className="flex items-center gap-3 my-0.5 px-2">
        <div className="h-px bg-slate-200 dark:bg-slate-700/60 flex-1" />
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {isEn ? 'or with PayPal' : 'ou avec PayPal'}
        </span>
        <div className="h-px bg-slate-200 dark:bg-slate-700/60 flex-1" />
      </div>

      {/* ── BOUTON 2 : PAYPAL ── */}
      <button
        type="button"
        onClick={() => handlePayment('paypal')}
        disabled={isBusy}
        className="inline-flex items-center justify-center gap-2.5 bg-[#FFC439] hover:bg-[#f0b429] active:scale-[0.98] disabled:opacity-60 text-[#003087] font-extrabold px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
      >
        {loadingMethod === 'paypal' ? (
          <div className="w-5 h-5 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#003087] shrink-0" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
          </svg>
        )}
        <span className="text-sm sm:text-base">
          {loadingMethod === 'paypal'
            ? loadingStep
            : (isEn ? 'Pay with PayPal' : 'Payer avec PayPal')}
        </span>
      </button>

      {/* Message d'erreur éventuel */}
      {error && (
        <p className="text-xs text-red-500 text-center font-medium bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-2 mt-1">
          {error}
        </p>
      )}

      {/* ── RÉASSURANCE ── */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 text-center pt-1">
        <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
        <span>
          {isEn
            ? 'SSL 256-bit encrypted · Secured Card & PayPal · Instant access'
            : 'Paiement SSL 256 bits · Carte & PayPal sécurisés · Accès immédiat'}
        </span>
      </div>
    </div>
  );
}

