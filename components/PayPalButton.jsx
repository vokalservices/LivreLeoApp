/**
 * components/PayPalButton.jsx
 * Bouton PayPal réutilisable — redirige vers PayPal Checkout
 * Accepte cartes Visa/Mastercard (dont prépayées) + comptes PayPal
 */
import React, { useState } from 'react';

export default function PayPalButton({ book, isPack = false, isCombo = false, className = '' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handlePayPal() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/paypal/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ book, isPack, isCombo }),
      });
      const data = await res.json();
      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        setError(data.error || 'Erreur PayPal');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <button
        onClick={handlePayPal}
        disabled={loading}
        className={`inline-flex items-center justify-center gap-2.5 bg-[#FFC439] hover:bg-[#f0b429] active:scale-95 disabled:opacity-60 text-[#003087] font-extrabold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all ${className}`}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
        ) : (
          /* Logo PayPal SVG inline */
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#003087]" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
          </svg>
        )}
        <span>{loading ? 'Redirection…' : 'Payer avec PayPal'}</span>
      </button>
      <p className="text-[10px] text-center text-gray-400">
        Cartes Visa · Mastercard · Prépayées · Compte PayPal
      </p>
      {error && (
        <p className="text-xs text-red-500 text-center mt-1">{error}</p>
      )}
    </div>
  );
}
