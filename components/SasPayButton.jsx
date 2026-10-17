/**
 * components/SasPayButton.jsx
 * Bouton de paiement officiel SasPay optimisé pour l'Afrique francophone (100% FCFA).
 * - Modes de paiement : Wave, Orange Money, MTN MoMo, Moov Money, Carte bancaire
 * - Devises : FCFA (XOF) exclusivement, aucun euro
 * - Saisie email (obligatoire) et téléphone Mobile Money (optionnel mais guidé pour éviter les erreurs d'indicatif)
 * - Intégration Meta Pixel (InitiateCheckout)
 */
import React, { useState, useEffect } from 'react';

// Liste des pays d'Afrique francophone ciblés avec leurs indicatifs
const AFRICAN_COUNTRIES = [
  { code: 'CI', name: "Côte d'Ivoire", dial: '+225', placeholder: '07 00 00 00 00' },
  { code: 'SN', name: 'Sénégal', dial: '+221', placeholder: '77 000 00 00' },
  { code: 'BJ', name: 'Bénin', dial: '+229', placeholder: '97 00 00 00' },
  { code: 'CM', name: 'Cameroun', dial: '+237', placeholder: '6 00 00 00 00' },
  { code: 'BF', name: 'Burkina Faso', dial: '+226', placeholder: '70 00 00 00' },
  { code: 'TG', name: 'Togo', dial: '+228', placeholder: '90 00 00 00' },
  { code: 'NE', name: 'Niger', dial: '+227', placeholder: '89 00 00 00' },
  { code: 'ML', name: 'Mali', dial: '+223', placeholder: '70 00 00 00' },
  { code: 'GN', name: 'Guinée', dial: '+224', placeholder: '620 00 00 00' },
  { code: 'GA', name: 'Gabon', dial: '+241', placeholder: '07 00 00 00' },
  { code: 'CG', name: 'Congo', dial: '+242', placeholder: '06 000 00 00' },
];

export default function SasPayButton({
  book,
  isPack = false,
  isCombo = false,
  lang = 'fr',
  className = '',
  coupon = '',
  initialEmail = '',
}) {
  const [email, setEmail] = useState(initialEmail || '');
  const [emailError, setEmailError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('CI');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');

  const isEn = lang === 'en';

  // Calcul du montant en FCFA
  let displayAmountXof = 1300;
  if (isCombo) {
    displayAmountXof = 9900;
  } else if (isPack) {
    displayAmountXof = 6500;
  } else {
    const rawP = Number(book?.price || 1300);
    displayAmountXof = rawP >= 500 ? rawP : 1300;
  }

  const isFree = displayAmountXof <= 0;
  const formattedXof = displayAmountXof.toLocaleString('fr-FR') + ' FCFA';

  const currentCountry = AFRICAN_COUNTRIES.find((c) => c.code === selectedCountry) || AFRICAN_COUNTRIES[0];

  // Récupérer l'email et le téléphone en cache si présent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('pending_purchase') || '{}');
        const cachedEmail = stored.email || localStorage.getItem('customer_email');
        if (cachedEmail && !email) setEmail(cachedEmail);
        const cachedPhone = stored.phone || localStorage.getItem('customer_phone');
        if (cachedPhone && !phone) setPhone(cachedPhone);
        const cachedCountry = localStorage.getItem('customer_country');
        if (cachedCountry) setSelectedCountry(cachedCountry);
      } catch {}
    }
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
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('customer_email', cleanEmail);
      } catch {}
    }
    return cleanEmail;
  }

  // Nettoyage intelligent du numéro de téléphone pour éviter la double indicatif (ex: 227 227...)
  function getSanitizedPhone() {
    if (!phone) return '';
    let digits = phone.replace(/[\s\-\.\(\)]/g, '');
    const dialDigits = currentCountry.dial.replace('+', '');

    // Si l'utilisateur a tapé l'indicatif dans le champ, on le retire pour avoir le bon format E.164
    if (digits.startsWith(`+${dialDigits}`)) {
      digits = digits.slice(dialDigits.length + 1);
    } else if (digits.startsWith(dialDigits)) {
      digits = digits.slice(dialDigits.length);
    } else if (digits.startsWith('00' + dialDigits)) {
      digits = digits.slice(dialDigits.length + 2);
    }

    if (!digits) return '';
    return `${currentCountry.dial}${digits}`;
  }

  // Traitement gratuit si coupon 100%
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
          bookId: book?.id || 1,
          email: cleanEmail,
          productId: isCombo ? 'combo' : isPack ? 'pack' : String(book?.id || '1'),
          amount: 0,
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

  // Lancement du paiement SasPay
  async function handleSasPayPayment() {
    if (isLoading) return;

    const cleanEmail = validateEmail();
    if (!cleanEmail) return;

    const fullPhone = getSanitizedPhone();
    if (typeof window !== 'undefined') {
      try {
        if (phone) localStorage.setItem('customer_phone', phone);
        if (selectedCountry) localStorage.setItem('customer_country', selectedCountry);
      } catch {}
    }

    setIsLoading(true);
    setLoadingStep(isEn ? 'Connecting to SasPay…' : 'Connexion à SasPay (Mobile Money & Carte)…');
    setError('');

    // Déclencher l'événement standard InitiateCheckout pour le Pixel Meta
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'InitiateCheckout', {
        content_name: book?.title || (isCombo ? 'Pack Combo 12 Livres' : isPack ? 'Pack 6 Tomes' : 'Livre Léo'),
        content_ids: [String(book?.id || (isCombo ? 'combo' : isPack ? 'pack' : 'single'))],
        content_type: 'product',
        value: displayAmountXof,
        currency: 'XOF',
        num_items: isCombo ? 12 : isPack ? 6 : 1,
      });
    }

    // Sauvegarder dans localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pending_purchase', JSON.stringify({
          productId: isCombo ? 'combo' : isPack ? 'pack' : String(book?.id || '1'),
          amount: displayAmountXof,
          currency: 'XOF',
          title: book?.title || (isCombo ? 'Pack Combo 12 Livres' : isPack ? 'Pack 6 Tomes' : 'Livre Léo'),
          email: cleanEmail,
          phone: fullPhone,
          country: selectedCountry,
          provider: 'saspay',
        }));
      } catch {}
    }

    try {
      const res = await fetch('/api/saspay/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book,
          isPack,
          isCombo,
          customerEmail: cleanEmail,
          customerPhone: fullPhone,
          country: selectedCountry,
          currency: 'XOF',
        }),
      });

      const data = await res.json();

      if (res.ok && data.checkoutUrl) {
        // Mémoriser le sessionId de session pour que /success puisse vérifier le paiement
        // côté serveur même si le cookie de session est perdu (navigation mobile sortante).
        if (typeof window !== 'undefined' && data.sessionId) {
          try { localStorage.setItem('saspay_session_id', String(data.sessionId)); } catch {}
        }
        setLoadingStep(isEn ? 'Redirecting to secure payment…' : 'Redirection vers la page de paiement sécurisée…');
        window.location.href = data.checkoutUrl;
      } else {
        setIsLoading(false);
        setError(data.error || (isEn ? 'Payment initialization error' : 'Erreur lors de l\'initialisation du paiement SasPay'));
      }
    } catch {
      setIsLoading(false);
      setError(isEn ? 'Connection error, please retry' : 'Erreur de connexion, veuillez réessayer');
    }
  }

  return (
    <div className={`flex flex-col items-stretch gap-3.5 max-w-md mx-auto w-full ${className}`}>
      {/* ── CHAMP EMAIL DU CLIENT (REQUIS) ── */}
      <div className="w-full text-left">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
          ✉️ {isEn ? 'Email address to receive your books & audio' : 'Votre adresse e-mail pour recevoir vos livres et audios'} <span className="text-rose-500">*</span>
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError('');
          }}
          placeholder={isEn ? 'your@email.com' : 'votre@email.com'}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B7F56] font-medium shadow-sm transition"
        />
        {emailError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1 flex items-center gap-1">
            <span>⚠️</span> {emailError}
          </p>
        )}
      </div>

      {/* ── CHAMP TÉLÉPHONE MOBILE MONEY (FACULTATIF MAIS RECOMMANDÉ) ── */}
      <div className="w-full text-left">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
          📱 {isEn ? 'Mobile Money phone number (optional)' : 'Numéro Mobile Money (Wave, Orange, MTN, Moov)'}
        </label>
        <div className="flex gap-2">
          {/* Sélecteur de pays */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-36 shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold px-2 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7F56]"
          >
            {AFRICAN_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.dial} ({c.name})
              </option>
            ))}
          </select>
          {/* Input téléphone */}
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={currentCountry.placeholder}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B7F56] font-medium shadow-sm transition"
          />
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl p-2.5 mt-2 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
          <p className="font-bold flex items-center gap-1 mb-0.5">
            <span>ℹ️</span> {isEn ? 'Conseil Mobile Money :' : 'Conseil Mobile Money :'}
          </p>
          <p>
            {isEn
              ? `Sur la page de paiement sécurisée, le drapeau du pays applique déjà l'indicatif. Tapez uniquement votre numéro local sans réécrire l'indicatif (ex : ${currentCountry.placeholder}).`
              : `Sur la page de paiement sécurisée, le drapeau du pays applique déjà l'indicatif. Tapez uniquement votre numéro local sans réécrire l'indicatif (ex : ${currentCountry.placeholder}).`}
          </p>
        </div>
      </div>

      {isFree ? (
        /* ── OPTION GRATUITE (COUPON 100%) ── */
        <button
          type="button"
          onClick={handleFreeCheckout}
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#1B7F56] hover:bg-[#156644] active:scale-[0.98] disabled:opacity-60 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 text-sm sm:text-base cursor-pointer"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>✓</span>
          )}
          <span>
            {isLoading
              ? loadingStep
              : (isEn ? 'Get for free now' : 'Obtenir gratuitement maintenant')}
          </span>
        </button>
      ) : (
        <>
          {/* ── BOUTON PRINCIPAL SASPAY 100% FCFA ── */}
          <button
            type="button"
            onClick={handleSasPayPayment}
            disabled={isLoading}
            className="group relative w-full inline-flex flex-col items-center justify-center bg-gradient-to-r from-[#1B7F56] via-[#249666] to-[#1B7F56] hover:from-[#249666] hover:to-[#2EB37A] active:scale-[0.98] disabled:opacity-75 text-white font-extrabold px-6 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 border border-emerald-400/30 cursor-pointer"
          >
            {/* Ligne principale avec icône et montant */}
            <div className="flex items-center justify-center gap-2.5 text-base sm:text-lg">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              ) : (
                <span className="text-xl">⚡</span>
              )}
              <span>
                {isLoading ? loadingStep : `Payer ${formattedXof}`}
              </span>
            </div>

            {/* Sous-titre des réseaux africains */}
            <span className="text-[11px] text-emerald-100 font-semibold mt-1">
              Wave • Orange Money • MTN MoMo • Moov • Carte bancaire
            </span>
          </button>

          {/* ── BADGES RÉSEAUX DE PAIEMENT AFRICAINS ── */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
            {/* Wave */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-[#1DA1F2]/15 text-[#0c7abf] dark:text-[#38bdf8] border border-[#1DA1F2]/30">
              <span className="w-2 h-2 rounded-full bg-[#1DA1F2]" /> WAVE
            </span>

            {/* Orange Money */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-[#FF6600]/15 text-[#d95500] dark:text-[#fb923c] border border-[#FF6600]/30">
              <span className="w-2 h-2 rounded-full bg-[#FF6600]" /> ORANGE MONEY
            </span>

            {/* MTN MoMo */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-[#FFCC00]/25 text-[#997a00] dark:text-[#fde047] border border-[#FFCC00]/40">
              <span className="w-2 h-2 rounded-full bg-[#eab308]" /> MTN MOMO
            </span>

            {/* Moov Money */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-[#009944]/15 text-[#008038] dark:text-[#4ade80] border border-[#009944]/30">
              <span className="w-2 h-2 rounded-full bg-[#009944]" /> MOOV
            </span>

            {/* Cartes Visa / Mastercard */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              VISA / MASTERCARD
            </span>
          </div>
        </>
      )}

      {/* Message d'erreur éventuel */}
      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 text-center font-medium bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-2.5 mt-1">
          {error}
        </p>
      )}

      {/* ── RÉASSURANCE OFFICIELLE SASPAY ── */}
      <div className="flex flex-col items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 text-center pt-1">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Paiement 100% sécurisé via SasPay
          </span>
        </div>
        <span>
          Cryptage SSL 256 bits · Mobile Money & Carte · Accès et téléchargement immédiats
        </span>
      </div>
    </div>
  );
}
