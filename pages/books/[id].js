import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import PayPalButton from '../../components/PayPalButton';
import { eur } from '../../lib/translations';

export default function BookDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // États du lecteur de livre (Preview Reader)
  const [currentPage, setCurrentPage] = useState(0); // 0 = Couverture, 1 = Page 1, etc.
  const [pages, setPages] = useState([]);
  const [isReading, setIsReading] = useState(false);

  // États de l'audio interactif
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef(null);

  // États pour le Code Promo / Réduction
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [freeEmail, setFreeEmail] = useState('');
  const [freeEmailError, setFreeEmailError] = useState('');

  const maxFreePages = 4; // Nombre de pages gratuites dans l'aperçu

  const finalPrice = Math.max(0, (book?.price || 0) - discountAmount);

  // États commentaires
  const [comments, setComments] = useState([]);
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [commentHover, setCommentHover] = useState(0);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [commentError, setCommentError] = useState('');

  // Effet pour stopper l'audio lors du changement de page ou de la fermeture du lecteur
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [currentPage, isReading]);

  // Fonction de bascule de l'audio Play/Pause
  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error("Impossible de jouer le fichier audio", err);
          alert("La lecture audio a échoué. Assurez-vous que votre navigateur autorise l'audio.");
        });
    }
  };

  // Traiter l'application du coupon via l'API
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setPaymentLoading(true);
    setCouponError('');
    try {
      const res = await fetch(`/api/coupons?validate=1&code=${encodeURIComponent(code)}&price=${book?.price || 0}`);
      const data = await res.json();
      if (data.valid) {
        setDiscountAmount(data.discount);
        setCouponError('');
        // Message discret sous le code, pas d'alert
        setCouponSuccess(`✓ -${data.value}${data.type === 'percent' ? '%' : '€'} appliqué${data.description ? ` · ${data.description}` : ''}`);
      } else {
        setDiscountAmount(0);
        setCouponSuccess('');
        setCouponError(data.error || 'Code promo invalide.');
      }
    } catch {
      setCouponError('Erreur de connexion.');
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;

    async function fetchBookDetail() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Erreur lors du chargement des livres');
        const data = await res.json();
        const found = data.find((b) => Number(b.id) === Number(id));

        if (!found) {
          throw new Error('Livre introuvable dans notre collection');
        }

        setBook(found);

        // Extraction des pages pour le lecteur
        if (found.metadata) {
          const parsed = JSON.parse(found.metadata);
          if (parsed.pages) {
            setPages(parsed.pages);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBookDetail();
  }, [id, router.isReady]);

  // Chargement des commentaires approuvés du livre
  useEffect(() => {
    if (!id) return;
    fetch(`/api/comments?productId=${id}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setComments(data); })
      .catch(() => {});
  }, [id]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentAuthor.trim() || !commentBody.trim()) {
      setCommentError('Le nom et le commentaire sont obligatoires.');
      return;
    }
    setCommentSubmitting(true);
    setCommentError('');
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: book.id,
          author: commentAuthor,
          email: commentEmail,
          body: commentBody,
          rating: commentRating,
        }),
      });
      if (res.ok) {
        setCommentSuccess(true);
        setCommentAuthor('');
        setCommentEmail('');
        setCommentBody('');
        setCommentRating(5);
      } else {
        const d = await res.json();
        setCommentError(d.error || 'Erreur lors de l\'envoi.');
      }
    } catch {
      setCommentError('Erreur de connexion.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const processFreeCheckout = async () => {
    // Valider l'email
    if (!freeEmail || !freeEmail.includes('@')) {
      setFreeEmailError('Veuillez entrer une adresse email valide pour recevoir vos fichiers.');
      return;
    }
    setFreeEmailError('');
    try {
      const res = await fetch('/api/checkout_free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon: couponCode.trim().toUpperCase(),
          bookId: book.id,
          email: freeEmail.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erreur lors du traitement gratuit.");
      }
    } catch {
      alert('Erreur de connexion.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleBuyPayPal = async () => {
    // PayPal gère cartes + comptes PayPal + cartes prépayées
    if (finalPrice <= 0) return processFreeCheckout();
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !book) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
          <div className="bg-white p-8 rounded-2xl shadow border max-w-md w-full text-center">
            <p className="text-red-500 font-bold text-lg mb-4">Mince ! {error || "Ce livre n'existe pas."}</p>
            <Link href="/" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-xl">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Métadonnées extraites
  const parsedMeta = book.metadata ? JSON.parse(book.metadata) : {};
  const keywords = parsedMeta.keywords || [];
  const series = parsedMeta.series || {};
  const style = parsedMeta.style || {};

  return (
    <Layout
      title={`${book.title} — Fusée Carton`}
      description={book.description}
      ogImage={book.imageUrl?.startsWith('http') ? book.imageUrl : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${book.imageUrl}`}
    >
      <div className="min-h-screen bg-gray-50/50 pb-24">
      {/* Barre de retour */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <Link href="/" className="inline-flex items-center text-gray-500 hover:text-blue-600 font-medium transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour au catalogue
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Colonne Gauche : Visuel ou Lecteur e-book */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
          {!isReading ? (
            <div className="flex flex-col items-center">
              <div className="relative group bg-gray-50 rounded-2xl p-8 flex items-center justify-center w-full max-w-sm mb-6 border border-gray-100 shadow-inner">
                <img
                  className="w-56 h-80 object-cover rounded-md shadow-2xl transition-transform duration-500 hover:scale-105 border border-gray-200"
                  src={book.imageUrl}
                  alt={book.title}
                />
                <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  Tome {series.volume || 1}
                </div>
              </div>

              {pages.length > 0 && (
                <button
                  onClick={() => setIsReading(true)}
                  className="w-full max-w-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 text-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Lire un extrait (Gratuit)</span>
                </button>
              )}
            </div>
          ) : (
            /* LECTEUR DE LIVRE ACTIF */
            <div className="flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-6 border-b pb-4">
                <h4 className="font-bold text-gray-800 text-lg sm:text-xl">Aperçu : {book.title}</h4>
                <button
                  onClick={() => {
                    setIsReading(false);
                    setCurrentPage(0);
                  }}
                  className="text-red-500 hover:text-red-700 font-semibold text-sm flex items-center space-x-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" strokeWidth={2.5}/>
                  </svg>
                  <span>Fermer le lecteur</span>
                </button>
              </div>

              {/* Contenu de la Page Active */}
              {pages[currentPage] && (
                <div className="w-full flex flex-col items-center">
                  {/* Image de la Page */}
                  <div className="relative bg-gray-50 rounded-2xl p-4 md:p-6 mb-6 border w-full flex items-center justify-center h-80 sm:h-96 max-w-md overflow-hidden">
                    <img
                      className="h-full object-contain rounded shadow-lg border border-gray-200 animate-fadeIn"
                      src={pages[currentPage].image}
                      alt={pages[currentPage].alt_text || `Page ${currentPage + 1}`}
                    />
                    <span className="absolute bottom-4 right-4 bg-black/60 backdrop-blur text-white text-xs font-medium px-2.5 py-1 rounded">
                      Page {pages[currentPage].page_number} / {pages.length}
                    </span>
                  </div>

                  {/* Narration textuelle de la Page */}
                  <div className="bg-gray-50 p-6 rounded-2xl w-full text-center border border-gray-100 max-w-xl relative group/narration">
                    {/* Audio Player caché et bouton de lecture */}
                    {pages[currentPage].audio && (
                      <div className="mb-4">
                        <audio
                          ref={audioRef}
                          src={pages[currentPage].audio}
                          onEnded={() => setIsPlaying(false)}
                          className="hidden"
                        />
                        <button
                          onClick={toggleAudio}
                          className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition shadow-sm active:scale-95 ${
                            isPlaying
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          }`}
                        >
                          {isPlaying ? (
                            <>
                              <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75V5.25L7.75 9.5H4.5v5h3.25L12 18.75z" strokeWidth={2}/>
                              </svg>
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072M12 18.75V5.25L7.75 9.5H4.5v5h3.25L12 18.75z" strokeWidth={2}/>
                              </svg>
                              <span>Écouter le conte</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="text-gray-800 font-medium text-base leading-relaxed font-serif space-y-2">
                      {pages[currentPage].text ? (
                        pages[currentPage].text.split('\n\n').map((paragraph, pIdx) => {
                          const isInteraction = paragraph.trim().startsWith('[') && paragraph.trim().endsWith(']');
                          return (
                            <p
                              key={pIdx}
                              className={isInteraction ? "text-indigo-900 bg-indigo-50/90 border border-indigo-100 p-2.5 rounded-xl text-xs sm:text-sm font-sans font-semibold mt-2 shadow-xs" : ""}
                            >
                              {paragraph}
                            </p>
                          );
                        })
                      ) : (
                        <span className="italic text-gray-400">Illustration de Couverture</span>
                      )}
                    </div>
                  </div>

                  {/* Contrôles de Navigation du Lecteur */}
                  <div className="flex justify-between items-center w-full mt-6 max-w-xl">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                      className="bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-gray-100 text-gray-700 font-bold px-4 py-2 rounded-xl transition"
                    >
                      Précédent
                    </button>

                    <span className="text-gray-500 font-medium text-sm">
                      {currentPage === 0 ? "Couverture" : `Page ${currentPage}`}
                    </span>

                    {currentPage < maxFreePages - 1 ? (
                      <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition animate-pulse"
                      >
                        Suivant
                      </button>
                    ) : (
                      <div className="relative">
                        <button
                          disabled
                          className="bg-gray-200 text-gray-400 cursor-not-allowed font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          <span>Suivant</span>
                        </button>
                        <div className="absolute right-0 bottom-full mb-3 w-56 p-3 bg-indigo-900 text-white text-xs rounded-xl shadow-lg border border-indigo-700/60 z-20 text-center font-medium leading-normal pointer-events-none">
                          <div className="absolute top-full right-6 w-3 h-3 bg-indigo-900 rotate-45 transform -translate-y-1.5" />
                          Achetez le livre pour accéder aux {pages.length - maxFreePages} pages restantes de l'histoire et à ses coloriages !
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Colonne Droite : Achat, Métadonnées et Synopsis */}
        <div className="lg:col-span-5 space-y-8">
          {/* Section Synopsis et Titres */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center space-x-2 text-sm font-semibold text-blue-600 mb-2">
              <span>{book.author}</span>
              <span>•</span>
              <span className="text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full text-xs">Ages {book.ageGroup}</span>
            </div>

            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4 leading-tight">
              {book.title}
            </h1>

            {series && series.name && (
              <p className="text-gray-500 text-sm font-semibold mb-6 flex items-center">
                <svg className="w-5 h-5 mr-1.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {series.name} (Tome {series.volume} sur {series.total_volumes})
              </p>
            )}

            <h3 className="font-bold text-gray-800 mb-2 text-md">Synopsis</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-6 font-light">
              {book.description}
            </p>

            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {keywords.map((kw, i) => (
                  <span key={i} className="text-xs bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg border">
                    #{kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section Achat & Paiement */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Prix avec réduction éventuelle */}
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <span className="text-gray-500 font-semibold text-sm">Prix de l'e-book</span>
              <div className="flex items-center gap-2">
                {discountAmount > 0 && (
                  <span className="text-lg text-gray-400 line-through font-semibold">{eur(book.price)}</span>
                )}
                <span className={`text-3xl font-extrabold ${discountAmount > 0 ? 'text-green-600' : 'text-indigo-900'}`}>
                  {finalPrice === 0 ? 'Gratuit' : eur(finalPrice)}
                </span>
              </div>
            </div>

            {/* Code promo */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-5">
              <input
                type="text"
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value); setCouponError(''); setCouponSuccess(''); }}
                placeholder="Code promo"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium uppercase tracking-wider"
                maxLength={32}
              />
              <button
                type="submit"
                disabled={paymentLoading || !couponCode.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition active:scale-95"
              >
                {paymentLoading ? '…' : 'Appliquer'}
              </button>
            </form>
            {couponSuccess && (
              <p className="text-xs text-green-700 font-semibold bg-green-50 px-3 py-2 rounded-lg mb-3 border border-green-100">{couponSuccess}</p>
            )}
            {couponError && (
              <p className="text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg mb-3 border border-red-100">{couponError}</p>
            )}

            {/* Suggestion pack */}
            <a href="/pack"
              className="flex items-center gap-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-2xl p-3.5 mb-5 transition group">
              <span className="text-xl">🎁</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-indigo-700">Pack 6 livres à −50 %</div>
                <div className="text-xs text-indigo-500 truncate">Obtenez toute la collection pour {eur(14.99)}</div>
              </div>
              <svg className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="h-px bg-gray-200 flex-1" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payer ce tome</span>
                <span className="h-px bg-gray-200 flex-1" />
              </div>

              {/* Gratuit via coupon -100% */}
              {finalPrice === 0 ? (
                <div className="space-y-3">
                  {/* Champ email obligatoire pour recevoir les fichiers */}
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                      Email <span className="text-red-400">*</span>
                      <span className="ml-1 font-normal text-gray-400 normal-case">(pour recevoir vos fichiers)</span>
                    </label>
                    <input
                      type="email"
                      value={freeEmail}
                      onChange={e => { setFreeEmail(e.target.value); setFreeEmailError(''); }}
                      placeholder="votre@email.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 font-medium"
                    />
                    {freeEmailError && (
                      <p className="text-xs text-red-600 font-medium mt-1">{freeEmailError}</p>
                    )}
                  </div>
                  <button
                    onClick={processFreeCheckout}
                    disabled={paymentLoading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    {paymentLoading ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Traitement...</>
                    ) : (
                      <>✓ Obtenir gratuitement</>
                    )}
                  </button>
                </div>
              ) : (
                <PayPalButton
                  book={{ id: book.id, title: book.title, price: finalPrice }}
                  className="w-full py-3.5"
                />
              )}
            </div>

            <div className="mt-5 text-center text-xs text-gray-400">
              Paiements sécurisés · Livre disponible instantanément
            </div>
          </div>
        </div>
      </div>

      {/* ===== SECTION COMMENTAIRES ===== */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-10">

        {/* Avis approuvés */}
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
            <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Avis des lecteurs
            {comments.length > 0 && (
              <span className="text-sm font-bold text-slate-400 bg-gray-100 px-2.5 py-1 rounded-full">{comments.length}</span>
            )}
          </h2>

          {comments.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-slate-500 font-semibold text-sm">Aucun avis pour l'instant.</p>
              <p className="text-slate-400 text-xs mt-1">Soyez le premier à partager votre expérience !</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(c => {
                const avg = c.rating;
                return (
                  <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-800 text-sm">{c.author}</span>
                          <span className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <svg key={s} className={`w-3.5 h-3.5 ${s <= avg ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">{c.body}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Formulaire de commentaire */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-slate-800 mb-1">Laisser un avis</h3>
          <p className="text-xs text-slate-400 mb-5">Votre commentaire sera publié après validation par notre équipe.</p>

          {commentSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-extrabold text-slate-800">Merci pour votre avis !</p>
              <p className="text-sm text-slate-500">Il sera publié après validation.</p>
              <button
                onClick={() => setCommentSuccess(false)}
                className="text-xs text-blue-600 hover:underline font-semibold mt-2"
              >
                Laisser un autre avis
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitComment} className="space-y-4">
              {/* Note étoiles */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Note</label>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCommentRating(s)}
                      onMouseEnter={() => setCommentHover(s)}
                      onMouseLeave={() => setCommentHover(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <svg className={`w-7 h-7 transition-colors ${s <= (commentHover || commentRating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                  <span className="text-xs text-slate-400 ml-2 font-semibold">{commentRating}/5</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                    Nom <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={commentAuthor}
                    onChange={e => setCommentAuthor(e.target.value)}
                    placeholder="Votre prénom ou pseudo"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    maxLength={60}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Email (optionnel)</label>
                  <input
                    type="email"
                    value={commentEmail}
                    onChange={e => setCommentEmail(e.target.value)}
                    placeholder="Non affiché publiquement"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Commentaire <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  placeholder="Partagez votre expérience de lecture..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none"
                  maxLength={1000}
                  required
                />
                <p className="text-xs text-slate-400 text-right mt-1">{commentBody.length}/1000</p>
              </div>

              {commentError && (
                <p className="text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">{commentError}</p>
              )}

              <button
                type="submit"
                disabled={commentSubmitting}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl text-sm transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {commentSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Envoi...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Soumettre l'avis</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  </Layout>
);
}
