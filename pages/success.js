import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

// ── Boutons de téléchargement pack avec gestion des parties ────────────────
function PackDownloadButtons({ isCombo, email, productId }) {
  const count = isCombo ? '12' : '6';

  // Générer les URLs via /api/download pour le fallback
  const enc = encodeURIComponent(email || '');
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const packFiles = {
    pdf: isCombo
      ? [
          { label: 'PDF Partie 1/3', url: `${baseUrl}/api/download?productId=${productId}&format=pdf&email=${enc}&part=1` },
          { label: 'PDF Partie 2/3', url: `${baseUrl}/api/download?productId=${productId}&format=pdf&email=${enc}&part=2` },
          { label: 'PDF Partie 3/3', url: `${baseUrl}/api/download?productId=${productId}&format=pdf&email=${enc}&part=3` },
        ]
      : [
          { label: 'PDF Partie 1/2', url: `${baseUrl}/api/download?productId=${productId}&format=pdf&email=${enc}&part=1` },
          { label: 'PDF Partie 2/2', url: `${baseUrl}/api/download?productId=${productId}&format=pdf&email=${enc}&part=2` },
        ],
    epub: isCombo
      ? [
          { label: 'EPUB Partie 1/2', url: `${baseUrl}/api/download?productId=${productId}&format=epub&email=${enc}&part=1` },
          { label: 'EPUB Partie 2/2', url: `${baseUrl}/api/download?productId=${productId}&format=epub&email=${enc}&part=2` },
        ]
      : [{ label: 'EPUB (6 livres)', url: `${baseUrl}/api/download?productId=${productId}&format=epub&email=${enc}` }],
    audio: [{ label: isCombo ? 'Audio (12 livres)' : 'Audio (6 livres)', url: `${baseUrl}/api/download?productId=${productId}&format=audio&email=${enc}` }],
  };

  const btnBase = 'inline-flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-2xl shadow-md transition active:scale-95 text-sm';

  const renderGroup = (icon, label, color, files) => (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
        {icon} {label} ({count} livres)
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {files.map((f, i) => (
          <a key={i} href={f.url} download className={`${btnBase} ${color}`}>
            {files.length > 1 ? f.label : `Télécharger ${label}`}
          </a>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 mb-8">
      {renderGroup('📄', 'PDF',   'bg-[#7C5CAA] hover:bg-[#6D4E9B] text-white',   packFiles.pdf)}
      {renderGroup('📱', 'EPUB',  'bg-slate-700 hover:bg-slate-800 text-white',     packFiles.epub)}
      {renderGroup('🎙️', 'Audio', 'bg-[#E8A838] hover:bg-[#D97706] text-white',    packFiles.audio)}
    </div>
  );
}

const AUTO_PAGE_DURATION = 6000;

// ── Lecteur de livre inline ────────────────────────────────────────────────
function BookReader({ book, pages, onClose }) {
  const [currentPage, setCurrentPage]   = useState(0);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [isMuted, setIsMuted]           = useState(false);
  const [autoPlay, setAutoPlay]         = useState(false);
  const [finished, setFinished]         = useState(false);
  const [pageProgress, setPageProgress] = useState(0);
  const audioRef    = useRef(null);
  const timerRef    = useRef(null);
  const progressRef = useRef(null);
  const pageStartRef    = useRef(null);
  const pageDurationRef = useRef(AUTO_PAGE_DURATION);

  const clearAutoTimer = useCallback(() => {
    if (timerRef.current)    { clearTimeout(timerRef.current);         timerRef.current    = null; }
    if (progressRef.current) { cancelAnimationFrame(progressRef.current); progressRef.current = null; }
  }, []);

  const animateProgress = useCallback(() => {
    if (!pageStartRef.current) return;
    const elapsed = Date.now() - pageStartRef.current;
    const pct = Math.min(100, (elapsed / pageDurationRef.current) * 100);
    setPageProgress(pct);
    if (pct < 100) progressRef.current = requestAnimationFrame(animateProgress);
  }, []);

  const goToNextPageAuto = useCallback(() => {
    setCurrentPage(prev => {
      const next = prev + 1;
      if (next >= pages.length) {
        setAutoPlay(false); setFinished(true); setCurrentPage(0); setPageProgress(0); clearAutoTimer();
        return 0;
      }
      return next;
    });
  }, [pages.length, clearAutoTimer]);

  const scheduleNextPage = useCallback((duration) => {
    clearAutoTimer();
    pageDurationRef.current = duration;
    pageStartRef.current    = Date.now();
    setPageProgress(0);
    progressRef.current = requestAnimationFrame(animateProgress);
    timerRef.current    = setTimeout(goToNextPageAuto, duration);
  }, [clearAutoTimer, animateProgress, goToNextPageAuto]);

  useEffect(() => {
    if (!autoPlay || finished) { clearAutoTimer(); return; }
    const page = pages[currentPage];
    if (!page) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    if (page.audio && audioRef.current) {
      audioRef.current.src = page.audio;
      audioRef.current.muted = isMuted;
      audioRef.current.load();
      const onLoaded = () => {
        const dur = audioRef.current.duration;
        const totalDur = (dur && isFinite(dur) && dur > 1) ? (dur * 1000) + 1500 : AUTO_PAGE_DURATION;
        audioRef.current.play().then(() => { setIsPlaying(true); scheduleNextPage(totalDur); }).catch(() => { setIsPlaying(false); scheduleNextPage(AUTO_PAGE_DURATION); });
      };
      const onError = () => { setIsPlaying(false); scheduleNextPage(AUTO_PAGE_DURATION); };
      audioRef.current.addEventListener('loadedmetadata', onLoaded, { once: true });
      audioRef.current.addEventListener('error', onError, { once: true });
      return () => { if (audioRef.current) { audioRef.current.removeEventListener('loadedmetadata', onLoaded); audioRef.current.removeEventListener('error', onError); } };
    } else { setIsPlaying(false); scheduleNextPage(AUTO_PAGE_DURATION); }
  }, [currentPage, autoPlay, finished, isMuted, pages, scheduleNextPage, clearAutoTimer]);

  useEffect(() => { if (!autoPlay && audioRef.current) { audioRef.current.pause(); setIsPlaying(false); } }, [autoPlay]);
  useEffect(() => { if (audioRef.current) audioRef.current.muted = isMuted; }, [isMuted]);
  useEffect(() => () => clearAutoTimer(), [clearAutoTimer]);

  const stopAutoPlay = () => { setAutoPlay(false); clearAutoTimer(); setPageProgress(0); if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); } };
  const toggleAudio  = () => { if (!audioRef.current) return; if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); } else audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {}); };

  const page = pages[currentPage];

  return (
    <div className="flex flex-col items-center w-full">
      {/* Header */}
      <div className="flex justify-between items-center w-full mb-4 border-b pb-3">
        <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2 truncate">
          <span className="text-green-600">▶</span>
          <span className="truncate">{book.title}</span>
        </h2>
        <button onClick={() => { stopAutoPlay(); onClose(); }} className="text-red-500 hover:text-red-700 font-semibold text-sm shrink-0 ml-2">✕ Fermer</button>
      </div>

      {/* Contrôles */}
      <div className="flex items-center justify-center gap-3 w-full mb-4 flex-wrap">
        {autoPlay ? (
          <button onClick={stopAutoPlay} className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-full text-xs font-bold transition active:scale-95">⏸ Pause</button>
        ) : (
          <button onClick={() => { setFinished(false); setAutoPlay(true); }} className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-full text-xs font-bold transition active:scale-95">▶ {finished ? 'Relancer' : 'Lecture auto'}</button>
        )}
        <button onClick={() => setIsMuted(m => !m)} className={`px-3 py-2 rounded-full text-xs font-bold transition ${isMuted ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
          {isMuted ? '🔇 Son coupé' : '🔊 Son activé'}
        </button>
        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">{currentPage + 1} / {pages.length}</span>
      </div>

      {autoPlay && <div className="w-full max-w-md h-1.5 bg-gray-200 rounded-full mb-4 overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${pageProgress}%` }} /></div>}

      {finished && !autoPlay ? (
        <div className="flex flex-col items-center py-10 gap-4">
          <div className="text-5xl">🎉</div>
          <h3 className="text-xl font-extrabold text-slate-800">Lecture terminée !</h3>
          <div className="flex gap-3">
            <button onClick={() => { setFinished(false); setCurrentPage(0); setAutoPlay(true); }} className="bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition active:scale-95">🔄 Relire</button>
            <button onClick={() => { onClose(); }} className="bg-gray-100 text-gray-700 font-bold px-6 py-2.5 rounded-xl text-sm transition active:scale-95">Retour</button>
          </div>
        </div>
      ) : page && (
        <div className="w-full flex flex-col items-center">
          <div className="relative bg-gray-50 rounded-2xl p-4 mb-5 border w-full flex items-center justify-center h-80 sm:h-96 max-w-md overflow-hidden shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="h-full object-contain rounded shadow-lg border border-gray-200" src={page.image} alt={page.alt_text || `Page ${currentPage + 1}`} />
            {autoPlay && <span className="absolute top-3 left-3 bg-green-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">Lecture auto</span>}
            <span className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full">Page {currentPage + 1} / {pages.length}</span>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl w-full text-center border border-gray-100 max-w-xl">
            <audio ref={audioRef} className="hidden" onEnded={() => setIsPlaying(false)} />
            {!autoPlay && page.audio && (
              <button onClick={toggleAudio} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-4 transition ${isPlaying ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                🔊 {isPlaying ? 'Pause' : 'Écouter'}
              </button>
            )}
            <p className="text-gray-800 font-medium text-lg leading-relaxed font-serif">
              {page.text || <span className="italic text-gray-400">Illustration de Couverture</span>}
            </p>
          </div>
          <div className="flex justify-between items-center w-full mt-5 max-w-xl">
            <button onClick={() => { if (autoPlay) stopAutoPlay(); setCurrentPage(p => Math.max(0, p - 1)); }} disabled={currentPage === 0} className="bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 font-bold px-4 py-2 rounded-xl transition">← Précédent</button>
            <div className="flex-1 mx-4">
              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }} /></div>
              <span className="text-[10px] font-semibold text-gray-400 mt-1 block text-center">{currentPage === 0 ? 'Couverture' : `Page ${currentPage}`} / {pages.length - 1}</span>
            </div>
            <button onClick={() => { if (autoPlay) stopAutoPlay(); setCurrentPage(p => Math.min(pages.length - 1, p + 1)); }} disabled={currentPage === pages.length - 1} className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl transition">Suivant →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Carte d'un tome dans la vue pack/combo ─────────────────────────────────
function BookCard({ product, email, onRead }) {
  const meta     = JSON.parse(product.metadata || '{}');
  const volume   = meta.series?.volume;
  const lang     = product.lang === 'en' ? 'EN' : 'FR';
  const pages    = meta.pages || [];
  const hasAudio = pages.some(p => p.audio);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.title} className="w-14 h-20 object-cover rounded-lg shadow border shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {volume && <span className="text-[10px] font-black bg-[#F5EEFF] text-[#7C5CAA] px-1.5 py-0.5 rounded-full border border-[#E0D4EE]">T{volume}</span>}
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${lang === 'EN' ? 'bg-[#F5EEFF] text-[#7C5CAA] border border-[#E0D4EE]' : 'bg-[#FAF7F5] text-[#5A4878] border border-[#E0D4EE]'}`}>{lang}</span>
          </div>
          <h3 className="font-extrabold text-slate-800 text-sm leading-tight">{product.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{pages.length} pages · {product.author || 'Théo Arven'}</p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {pages.length > 0 && (
          <button onClick={() => onRead(product, pages)} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-xl transition active:scale-95 flex items-center justify-center gap-1">
            📖 Lire
          </button>
        )}
        <a href={`/api/download?productId=${product.id}&format=pdf&email=${encodeURIComponent(email || '')}`}
           className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold py-2 rounded-xl transition active:scale-95 flex items-center justify-center gap-1">
          📄 PDF
        </a>
        <a href={`/api/download?productId=${product.id}&format=epub&email=${encodeURIComponent(email || '')}`}
           className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold py-2 rounded-xl transition active:scale-95 flex items-center justify-center gap-1">
          📱 EPUB
        </a>
        {hasAudio && (
          <a href={`/api/download?productId=${product.id}&format=audio&email=${encodeURIComponent(email || '')}`}
             className="flex-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold py-2 rounded-xl transition active:scale-95 flex items-center justify-center gap-1">
            🎙️ Audio
          </a>
        )}
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────
export default function Success() {
  const router = useRouter();
  const [loading, setLoading]         = useState(true);
  const [success, setSuccess]         = useState(false);
  const [book, setBook]               = useState(null);       // tome individuel
  const [packBooks, setPackBooks]     = useState([]);          // livres du pack/combo
  const [pages, setPages]             = useState([]);
  const [readingBook, setReadingBook] = useState(null);   // {book, pages} en cours de lecture
  const [activeProductId, setActiveProductId] = useState('pack');
  const [activeEmail, setActiveEmail]         = useState('');
  const [payOutcome, setPayOutcome]           = useState(null); // 'ok' | 'pending' | 'failed' (SasPay)
  const registeredRef = useRef(false);

  const isSpecialPack = (id) => id === 'pack' || id === 'combo';

  useEffect(() => {
    if (!router.isReady) return;
    const { provider } = router.query;

    // orderRef : query → localStorage → cookie. C'est la clé qui relie cette
    // page à la session SasPay persistée en base (multi-appareils, sans cookie).
    let orderRef = router.query.orderRef || '';
    let stored = {};
    if (typeof window !== 'undefined') {
      try { stored = JSON.parse(localStorage.getItem('pending_purchase') || '{}'); } catch {}
      if (!orderRef) {
        try { orderRef = localStorage.getItem('saspay_order_ref') || ''; } catch {}
      }
      if (!orderRef && typeof document !== 'undefined') {
        const m = document.cookie.match(/saspay_order_ref=([^;]+)/);
        if (m) orderRef = decodeURIComponent(m[1]);
      }
    }

    let queryProductId = router.query.productId || stored.productId || null;
    let queryAmount    = router.query.amount || (stored.amount != null ? String(stored.amount) : null);
    let queryEmail     = router.query.email || stored.email || null;

    async function init() {
      let saspayRef = null; // transaction_id SasPay → idempotence Order.saspayRef
      try {
        // ── Vérification SasPay — RÈGLE ABSOLUE (guidelines) : on ne livre que
        // sur SUCCESS confirmé par GET /payments/{id}/verify/ (via notre API).
        // La redirection return_url ne prouve rien.
        if (provider === 'saspay' || (!provider && orderRef)) {
          const MAX_ATTEMPTS = 20; // 20 × 3 s ≈ 60 s — la confirmation USSD peut être lente
          let outcome = null;
          let info = null;
          for (let i = 0; i < MAX_ATTEMPTS && !outcome; i++) {
            try {
              const qs = orderRef ? `?orderRef=${encodeURIComponent(orderRef)}` : '';
              const r = await fetch(`/api/saspay/verify-session${qs}`);
              const d = await r.json();
              if (d.paid === true) { outcome = 'ok'; info = d; }
              else if (/FAILED|CANCELLED|EXPIRED/.test(`${d.status || ''} ${d.transactionStatus || ''}`)) { outcome = 'failed'; info = d; }
            } catch (e) {
              console.warn('[SasPay] Erreur vérification (tentative ' + (i + 1) + '):', e.message);
            }
            if (!outcome && i < MAX_ATTEMPTS - 1) {
              await new Promise(rsv => setTimeout(rsv, 3000));
            }
          }
          outcome = outcome || 'pending';
          setPayOutcome(outcome);
          if (outcome !== 'ok') {
            // Échoué ou en attente : AUCUNE commande, AUCUN e-mail, AUCUN pixel.
            // Le webhook SasPay (une fois l'URL à jour) livrera si le paiement
            // aboutit plus tard.
            setLoading(false);
            return;
          }
          // Les données SERVEUR priment sur l'URL/localStorage.
          if (info.productId) queryProductId = info.productId;
          if (info.amount) queryAmount = info.amount;
          if (info.email) queryEmail = info.email;
          if (info.transactionId) saspayRef = info.transactionId;
          try { localStorage.removeItem('saspay_order_ref'); } catch {}
          console.log('[SasPay] Paiement vérifié avec succès (SUCCESS confirmé).');
        }

        const effectiveProductId = queryProductId || 'pack';
        // Fallback FCFA catalogue (jamais d'euros résiduels).
        const fallbackFcfa = effectiveProductId === 'combo' ? '9900' : effectiveProductId === 'pack' ? '6500' : '1300';
        const effectiveAmount = queryAmount || fallbackFcfa;
        setActiveProductId(effectiveProductId);
        if (queryEmail) setActiveEmail(queryEmail);

        // ── Chargement des produits ─────────────────────────────────────
        const productsRes = await fetch('/api/products');
        const allProducts = productsRes.ok ? await productsRes.json() : [];

        if (isSpecialPack(effectiveProductId)) {
          // Pack FR ou Combo FR+EN
          const isCombo = effectiveProductId === 'combo';
          let books = allProducts.filter(p => p.lang === 'fr');
          if (isCombo) {
            const enBooks = allProducts.filter(p => p.lang === 'en');
            books = [...books, ...enBooks];
          }
          // Trier par volume puis lang
          books.sort((a, b) => {
            const va = JSON.parse(a.metadata || '{}').series?.volume || 0;
            const vb = JSON.parse(b.metadata || '{}').series?.volume || 0;
            if (va !== vb) return va - vb;
            return (a.lang === 'fr' ? 0 : 1) - (b.lang === 'fr' ? 0 : 1);
          });
          setPackBooks(books);
          setBook({
            id: effectiveProductId,
            title: isCombo ? 'Pack Combo FR + EN — 12 Livres' : 'Pack Intégral — Les 6 Aventures de Léo',
            imageUrl: 'https://olexgwicxunynysiwugp.supabase.co/storage/v1/object/public/illustrations/leo-et-le-voleur-d-ombres/cover.png',
          });
        } else {
          // Tome individuel
          const found = allProducts.find(p => Number(p.id) === Number(effectiveProductId));
          if (found) {
            setBook(found);
            const meta = JSON.parse(found.metadata || '{}');
            if (meta.pages) setPages(meta.pages);
          }
        }

        // ── Enregistrement commande ─────────────────────────────────────
        // provider=free : la commande a déjà été créée (et l'e-mail envoyé) par
        // /api/checkout_free côté serveur → on ne ré-enregistre rien ici.
        if (!registeredRef.current && provider !== 'free') {
          registeredRef.current = true;
          const currentEmail = queryEmail || router.query.email;
          const orderEmail = currentEmail?.includes('@') ? currentEmail : `client_${provider || 'web'}@example.com`;
          const dbProductId = isSpecialPack(effectiveProductId) ? 1 : Number(effectiveProductId);
          try {
            await fetch('/api/orders', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: isSpecialPack(effectiveProductId) ? effectiveProductId : dbProductId,
                amount: Number(effectiveAmount),
                email: orderEmail,
                // saspayRef = transaction_id → Order.saspayRef @unique :
                // le webhook et cette page convergent sans doublon ni double e-mail.
                saspayRef: saspayRef || undefined,
              }),
            });
          } catch {}

          // Événement Purchase pour le Pixel Meta — uniquement si payé.
          if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
            window.fbq('track', 'Purchase', {
              value: Number(effectiveAmount) || 6500,
              currency: 'XOF',
              content_name: isSpecialPack(effectiveProductId)
                ? (effectiveProductId === 'combo' ? 'Pack Combo FR+EN 12 Livres' : 'Pack 6 Livres')
                : 'Livre Léo',
              content_type: 'product',
            });
          }
        }
        setSuccess(true);
      } catch (err) {
        console.error(err);
        setSuccess(true);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router.isReady, router.query]);

  const isPackOrCombo = isSpecialPack(activeProductId);
  const isCombo       = activeProductId === 'combo';
  const email         = activeEmail || router.query.email || '';
  const productId     = activeProductId;

  // ── Vue lecteur ────────────────────────────────────────────────────────
  if (readingBook) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-teal-900 to-indigo-900 p-4 flex flex-col justify-center items-center">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-2xl">
          <BookReader
            book={readingBook.book}
            pages={readingBook.pages}
            onClose={() => setReadingBook(null)}
          />
        </div>
      </div>
    );
  }

  // ── Vue principale ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-teal-900 to-indigo-900 p-4 sm:p-6 flex flex-col justify-center items-center">
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl">

        {/* ── En-tête succès (masqué si paiement échoué/en attente) ── */}
        <div className={`text-center mb-8 ${payOutcome === 'failed' || payOutcome === 'pending' ? 'hidden' : ''}`}>
          <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mb-2">Achat Réussi !</h1>
          <p className="text-sm text-slate-400 font-semibold uppercase tracking-wider">
            {isCombo ? '12 livres débloqués — FR & EN' : isPackOrCombo ? '6 livres débloqués' : 'Votre livre est disponible'}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600 mb-3" />
            <p className="text-sm text-gray-500">Préparation de vos accès...</p>
          </div>
        ) : payOutcome === 'failed' ? (
          <div className="flex flex-col items-center py-8 text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-2 shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">Paiement non abouti</h2>
            <p className="text-sm text-gray-500 max-w-md">
              Le paiement n'a pas été confirmé chez SasPay (échec ou annulation). Aucun montant ne vous a été débité
              pour cet essai. Réessayez ou choisissez un autre réseau Mobile Money.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition active:scale-95"
            >
              🔎 Vérifier à nouveau
            </button>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 font-semibold mt-1">← Retour à la boutique</Link>
          </div>
        ) : payOutcome === 'pending' ? (
          <div className="flex flex-col items-center py-8 text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-2 shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">Paiement en cours de confirmation…</h2>
            <p className="text-sm text-gray-500 max-w-md">
              Votre transaction est en cours de validation chez SasPay. Dès confirmation, vous recevrez
              automatiquement <strong>vos livres et vos liens de téléchargement par e-mail</strong>.
              Gardez votre téléphone à portée de main — certains réseaux (MTN, Moov) demandent une confirmation USSD.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition active:scale-95"
            >
              🔎 Vérifier à nouveau
            </button>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 font-semibold mt-1">← Retour à la boutique</Link>
          </div>
        ) : !success ? (
          <p className="text-center text-red-600 font-medium py-6">
            Votre transaction est confirmée, mais une erreur est survenue. Veuillez actualiser la page.
          </p>
        ) : isPackOrCombo ? (
          /* ── Vue Pack / Combo ── */
          <>
            <div className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 mx-auto flex justify-center border
              ${isCombo ? 'bg-[#F5EEFF] text-[#7C5CAA] border-[#E0D4EE]' : 'bg-[#FAF7F5] text-[#5A4878] border-[#E0D4EE]'}`}>
              {isCombo ? '🌍 Pack Combo FR + EN — 12 livres' : '📚 Pack Intégral — 6 livres'}
            </div>

            <p className="text-center text-gray-500 text-sm mb-4">
              Cliquez sur <strong>Lire</strong> pour ouvrir le lecteur, ou téléchargez en <strong>PDF</strong> / <strong>EPUB</strong>.
            </p>

            {/* ── Boutons Tout télécharger → API download avec fallback ── */}
            <PackDownloadButtons isCombo={isCombo} email={email} productId={productId} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {packBooks.map(product => (
                <BookCard
                  key={product.id}
                  product={product}
                  email={email}
                  onRead={(b, p) => setReadingBook({ book: b, pages: p })}
                />
              ))}
            </div>
          </>
        ) : (
          /* ── Vue Tome individuel ── */
          <>
            {book && (
              <div className="bg-gray-50 border rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center gap-4 text-left max-w-xl mx-auto shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={book.imageUrl} alt={book.title} className="w-20 h-28 object-cover rounded shadow-md border shrink-0" />
                <div>
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded uppercase tracking-wider">Livre Débloqué</span>
                  <h3 className="font-extrabold text-slate-900 text-lg mt-1">{book.title}</h3>
                  <p className="text-slate-400 text-xs mt-1">Par {book.author || 'Théo Arven'} · {pages.length} pages</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
              {pages.length > 0 && (
                <button
                  onClick={() => setReadingBook({ book, pages })}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold p-4 rounded-2xl shadow-sm active:scale-95 transition flex flex-col items-center gap-2 text-center"
                >
                  <span className="text-2xl">📖</span>
                  <span className="text-sm">Lire en ligne</span>
                  <span className="text-[10px] text-green-200">Lecteur e-book</span>
                </button>
              )}
              <a href={`/api/download?productId=${book?.id}&format=pdf&email=${encodeURIComponent(email || '')}`}
                 className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold p-4 rounded-2xl shadow-sm active:scale-95 transition flex flex-col items-center gap-2 text-center">
                <span className="text-2xl">📄</span>
                <span className="text-sm">Télécharger PDF</span>
                <span className="text-[10px] text-gray-400">Imprimable</span>
              </a>
              <a href={`/api/download?productId=${book?.id}&format=epub&email=${encodeURIComponent(email || '')}`}
                 className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold p-4 rounded-2xl shadow-sm active:scale-95 transition flex flex-col items-center gap-2 text-center">
                <span className="text-2xl">📱</span>
                <span className="text-sm">Télécharger EPUB</span>
                <span className="text-[10px] text-gray-400">Liseuse & tablette</span>
              </a>
              {pages.some(p => p.audio) && (
                <a href={`/api/download?productId=${book?.id}&format=audio&email=${encodeURIComponent(email || '')}`}
                   className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold p-4 rounded-2xl shadow-sm active:scale-95 transition flex flex-col items-center gap-2 text-center">
                  <span className="text-2xl">🎙️</span>
                  <span className="text-sm">Télécharger Audio</span>
                  <span className="text-[10px] text-amber-500">MP3 · narration</span>
                </a>
              )}
            </div>

            {/* Upsell pack */}
            {!isPackOrCombo && (
              <div className="bg-[#F5EEFF] border border-[#E0D4EE] rounded-2xl p-5 text-left max-w-xl mx-auto shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="text-2xl shrink-0">🎁</div>
                  <div>
                    <p className="font-extrabold text-[#2D2444] text-sm mb-1">Vous avez adoré ? Obtenez les 6 tomes à −67 %</p>
                    <p className="text-[#6B5E80] text-xs mb-3">Le Pack Intégral inclut les 6 aventures en PDF, EPUB & Audio pour seulement <strong>6 500 FCFA</strong>.</p>
                    <Link href="/pack" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#7C5CAA] to-[#9B7CC8] hover:from-[#6D4E9B] hover:to-[#8C6DBA] text-white font-bold px-5 py-2 rounded-xl text-xs transition active:scale-95 shadow-sm">
                      Voir le Pack Complet →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Retour boutique */}
        <div className="flex justify-center mt-8 pt-6 border-t">
          <Link href="/" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-xl text-sm transition">
            ← Retour à la boutique
          </Link>
        </div>

      </div>
    </div>
  );
}
