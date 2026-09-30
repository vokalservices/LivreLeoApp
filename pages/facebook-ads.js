import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// ============================================================
// COMPOSANT : Compte à rebours animé (urgence psychologique)
// ============================================================
function CountdownTimer({ hours = 23, minutes = 59, seconds = 59 }) {
  const [time, setTime] = useState({ h: hours, m: minutes, s: seconds });

  useEffect(() => {
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + hours, endTime.getMinutes() + minutes, endTime.getSeconds() + seconds);

    const tick = () => {
      const now = new Date();
      const diff = Math.max(0, endTime - now);
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-2 justify-center">
      {[
        { val: time.h, label: 'Heures' },
        { val: time.m, label: 'Min' },
        { val: time.s, label: 'Sec' },
      ].map((unit, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white tabular-nums bg-gradient-to-b from-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-lg" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {pad(unit.val)}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-amber-300/70 font-bold mt-0.5">{unit.label}</span>
          </div>
          {i < 2 && <span className="text-xl sm:text-2xl text-amber-400/60 font-black animate-pulse">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================
// COMPOSANT : Étoiles animées
// ============================================================
function AnimatedStars({ rating = 5, count = 250 }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`text-lg ${i < rating ? 'text-amber-400' : 'text-slate-600'}`} style={{ animationDelay: `${i * 100}ms` }}>★</span>
        ))}
      </div>
      <span className="text-sm font-bold text-amber-300">{rating}.0/5</span>
      <span className="text-xs text-slate-400">({count}+ avis vérifiés)</span>
    </div>
  );
}

// ============================================================
// COMPOSANT : Témoignage Parent
// ============================================================
function TestimonialCard({ name, role, text, avatar, stars = 5 }) {
  return (
    <div className="min-w-[300px] sm:min-w-[360px] bg-gradient-to-br from-slate-900/90 to-indigo-950/80 border border-slate-700/50 rounded-2xl p-5 sm:p-6 shadow-xl flex-shrink-0 backdrop-blur-sm">
      <div className="flex items-center gap-0.5 mb-3">
        {Array.from({ length: stars }).map((_, i) => (
          <span key={i} className="text-amber-400 text-sm">★</span>
        ))}
      </div>
      <p className="text-sm text-slate-200 leading-relaxed italic mb-4">"{text}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
          {avatar}
        </div>
        <div>
          <p className="text-sm font-bold text-white">{name}</p>
          <p className="text-[11px] text-slate-400">{role}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPOSANT : Carte de Prix (Offre)
// ============================================================
function PricingCard({ featured, title, badge, originalPrice, salePrice, discount, features, cta, ctaLink, icon, delay = 0 }) {
  return (
    <div
      className={`relative rounded-3xl border p-6 sm:p-8 flex flex-col transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${
        featured
          ? 'bg-gradient-to-br from-amber-950/30 via-slate-900 to-indigo-950/40 border-amber-400/50 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400/20'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 text-xs font-black rounded-full shadow-lg shadow-amber-500/30 uppercase tracking-wider whitespace-nowrap">
          ⚡ Plus Populaire — Économisez {discount}
        </div>
      )}

      <div className="text-center space-y-3 mb-6 pt-2">
        <span className="text-3xl sm:text-4xl">{icon}</span>
        <h3 className="text-xl sm:text-2xl font-extrabold text-white">{title}</h3>
        {badge && (
          <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${
            featured ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30' : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
          }`}>
            {badge}
          </span>
        )}
      </div>

      <div className="text-center mb-6">
        {originalPrice && (
          <span className="text-lg text-slate-500 line-through font-medium mr-2">{originalPrice}€</span>
        )}
        <span className={`text-4xl sm:text-5xl font-black ${featured ? 'text-amber-400' : 'text-white'}`}>{salePrice}€</span>
        <p className="text-xs text-slate-400 mt-1">Accès à vie • Téléchargement immédiat</p>
      </div>

      <ul className="space-y-2.5 mb-8 flex-grow">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-200">
            <span className="text-emerald-400 text-base mt-0.5 flex-shrink-0">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaLink || '/'}
        className={`block text-center py-4 px-6 rounded-2xl font-bold text-sm transition-all duration-300 transform active:scale-95 shadow-lg ${
          featured
            ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-amber-500/30 hover:shadow-amber-400/40'
            : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-600/30'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

// ============================================================
// COMPOSANT : Feature Highlight
// ============================================================
function FeatureHighlight({ icon, title, description }) {
  return (
    <div className="text-center p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-950/60 border border-slate-800/60 hover:border-slate-700 transition-all duration-300 group hover:shadow-xl hover:-translate-y-1">
      <div className="text-3xl sm:text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h4 className="text-sm sm:text-base font-bold text-white mb-1.5">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

// ============================================================
// PAGE PRINCIPALE : Landing Page Facebook Ads (Conversion)
// ============================================================
export default function FacebookAdsPage() {
  const [activeOffer, setActiveOffer] = useState('combo');
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  const [liveViewers, setLiveViewers] = useState(247);
  const [recentBuyer, setRecentBuyer] = useState(null);
  const testimonialsRef = useRef(null);

  // Nombres de spectateurs en direct (simulation réaliste)
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveViewers((prev) => {
        const delta = Math.floor(Math.random() * 11) - 5;
        return Math.max(180, Math.min(350, prev + delta));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Afficher le CTA flottant après scroll
  useEffect(() => {
    const handleScroll = () => setShowFloatingCta(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Notification d'achat récent (preuve sociale)
  useEffect(() => {
    const buyers = [
      { name: 'Sophie M.', city: 'Paris', pack: 'Pack FR 6 Tomes', time: 'il y a 3 min' },
      { name: 'Marie L.', city: 'Lyon', pack: 'Combo Bilingue 12 Livres', time: 'il y a 5 min' },
      { name: 'Sarah K.', city: 'Bruxelles', pack: 'Pack EN 6 Books', time: 'il y a 8 min' },
      { name: 'Camille D.', city: 'Montréal', pack: 'Pack FR 6 Tomes', time: 'il y a 12 min' },
      { name: 'Isabelle R.', city: 'Genève', pack: 'Combo Bilingue', time: 'il y a 15 min' },
      { name: 'Nathalie P.', city: 'Marseille', pack: 'Pack FR 6 Tomes', time: 'il y a 18 min' },
    ];

    let idx = 0;
    const showNext = () => {
      setRecentBuyer(buyers[idx % buyers.length]);
      idx++;
      setTimeout(() => setRecentBuyer(null), 5000);
    };

    const timerId = setTimeout(showNext, 8000);
    const intervalId = setInterval(showNext, 25000);
    return () => {
      clearTimeout(timerId);
      clearInterval(intervalId);
    };
  }, []);

  // Auto-scroll horizontal des témoignages
  useEffect(() => {
    const el = testimonialsRef.current;
    if (!el) return;
    let scrollPos = 0;
    const speed = 0.5;
    let animId;
    const animate = () => {
      scrollPos += speed;
      if (scrollPos >= el.scrollWidth - el.clientWidth) scrollPos = 0;
      el.scrollLeft = scrollPos;
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    const pause = () => cancelAnimationFrame(animId);
    const resume = () => { animId = requestAnimationFrame(animate); };
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
    };
  }, []);

  const testimonials = [
    { name: 'Sophie M.', role: 'Maman de Lucas, 7 ans', text: "Mon fils adorait écouter l'histoire dans sa chambre avant de s'endormir. Le format audio est magique ! Il ne réclame plus la tablette le soir.", avatar: 'SM' },
    { name: 'Pierre D.', role: 'Papa de Chloé, 6 ans', text: "Chloé était captivée dès la première page. Elle connaît maintenant tous les personnages par cœur et rejoue les scènes. Un bonheur à voir.", avatar: 'PD' },
    { name: 'Isabelle R.', role: 'Grand-mère de Théo, 5 ans', text: "J'ai offert le pack complet à mon petit-fils pour Noël. La qualité des illustrations est incroyable. Même moi je les écoute !", avatar: 'IR' },
    { name: 'Marie L.', role: 'Maman de Emma, 8 ans', text: "Le combo bilingue est top pour l'apprentissage de l'anglais. Emma compare les versions et apprend sans s'en rendre compte.", avatar: 'ML' },
    { name: 'Sarah K.', role: 'Parent, Bruxelles', text: "Livraison instantanée, pas de frais de port, qualité impeccable sur la tablette comme sur la liseuse. Je recommande les yeux fermés !", avatar: 'SK' },
    { name: 'Nathalie P.', role: 'Maman de Louis et Léa', text: "Mes deux enfants se disputent pour choisir le tome du soir ! Les voix audio sont excellentes, comme une vraie pièce de théâtre.", avatar: 'NP' },
    { name: 'Camille D.', role: 'Maman de Raphaël, 9 ans', text: "Raphaël n'aimait pas lire avant. Grâce à Léo, il dévore les histoires ! Les illustrations sont magnifiques et l'univers est captivant.", avatar: 'CD' },
    { name: 'Thomas B.', role: 'Papa de Mila, 5 ans', text: "Nous écoutons les livres audio en voiture pendant les trajets. Mila adore et c'est bien mieux que les vidéos YouTube !", avatar: 'TB' },
  ];

  const covers = [
    { slug: 'leo-et-le-voleur-d-ombres', title: 'Le Voleur d\'Ombres', num: 1 },
    { slug: 'leo-et-le-voleur-de-reves', title: 'Le Voleur de Rêves', num: 2 },
    { slug: 'leo-et-le-voleur-de-couleurs', title: 'Le Voleur de Couleurs', num: 3 },
    { slug: 'leo-et-le-voleur-d-etoiles', title: 'Le Voleur d\'Étoiles', num: 4 },
    { slug: 'leo-et-le-voleur-de-nuages', title: 'Le Voleur de Nuages', num: 5 },
    { slug: 'leo-et-le-voleur-de-temps', title: 'Le Voleur de Temps', num: 6 },
  ];

  return (
    <div className="min-h-screen bg-[#070A14] text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden">
      <Head>
        <title>Offre Spéciale — Les Aventures de Léo | Collection Numérique Complète</title>
        <meta name="description" content="Offrez à votre enfant la saga féerique Les Aventures de Léo. 6 Ebooks EPUB HD + 6 Livres Audio MP3. Téléchargement immédiat. -45% en promotion limitée." />
        <meta property="og:title" content="Les Aventures de Léo — Pack 6 Tomes (Ebook + Audio)" />
        <meta property="og:description" content="La saga féerique qui fait rêver +10 000 enfants. Ebooks EPUB HD + Livres Audio MP3. Promotion -45%." />
        <meta property="og:image" content="/ads/fb_hero_banner.jpg" />
        <meta property="og:type" content="website" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      {/* ================================================== */}
      {/* BARRE DE CONFIANCE SUPÉRIEURE (Trust Bar) */}
      {/* ================================================== */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-slate-950 text-center py-2 px-4 text-[11px] sm:text-xs font-bold tracking-wide relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        <div className="relative flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
          <span>⚡ OFFRE LIMITÉE — Promotion valable encore :</span>
          <span className="font-black text-sm tabular-nums">
            <CountdownTimer hours={11} minutes={47} seconds={33} />
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            {liveViewers} personnes consultent cette page
          </span>
        </div>
      </div>

      {/* ================================================== */}
      {/* HEADER ULTRA-COMPACT */}
      {/* ================================================== */}
      <header className="sticky top-0 z-50 bg-[#0A0D18]/95 backdrop-blur-xl border-b border-slate-800/60 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-amber-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
              LÉO
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-white">Les Aventures de Léo</p>
              <p className="text-[10px] text-slate-400">Collection numérique officielle</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <AnimatedStars rating={5} count={250} />
            <Link
              href="/"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 hidden sm:block"
            >
              Obtenir le Pack →
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ================================================== */}
        {/* HERO SECTION : Impact Visuel Maximum */}
        {/* ================================================== */}
        <section className="relative overflow-hidden">
          {/* Background avec effets */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-[#070A14] to-[#070A14]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[300px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16 md:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Texte Hero */}
              <div className="space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/20">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[11px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider">Promotion limitée — Jusqu'à -48% aujourd'hui</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
                  La saga qui fait{' '}
                  <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 bg-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    rêver
                  </span>
                  {' '}+10 000 enfants
                </h1>

                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  <strong className="text-white">6 tomes captivants</strong> remplis de mystères, créatures magiques et courage.
                  Disponibles en <strong className="text-amber-300">Ebook EPUB HD</strong> et{' '}
                  <strong className="text-amber-300">Livre Audio MP3</strong> avec voix studio immersives.
                </p>

                {/* Avantages Clés */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { icon: '📚', text: 'Ebook EPUB HD', sub: 'Lisible partout' },
                    { icon: '🎧', text: 'Livre Audio MP3', sub: 'Voix studio' },
                    { icon: '⚡', text: 'Accès Immédiat', sub: '0 frais livraison' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/50">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{item.text}</p>
                        <p className="text-[10px] text-slate-400">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA Principal */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center lg:justify-start">
                  <Link
                    href="/"
                    className="w-full sm:w-auto text-center px-8 py-4 rounded-2xl text-base font-black bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-xl shadow-amber-500/30 transition-all transform hover:scale-105 active:scale-95"
                  >
                    🎁 Découvrir les Offres (-45%)
                  </Link>
                  <Link
                    href="/#preview"
                    className="w-full sm:w-auto text-center px-6 py-4 rounded-2xl text-sm font-bold bg-slate-800/60 hover:bg-slate-700/60 text-white border border-slate-700/60 transition-all"
                  >
                    📖 Lire un Extrait Gratuit
                  </Link>
                </div>

                {/* Garantie */}
                <p className="text-xs text-slate-500 flex items-center justify-center lg:justify-start gap-2">
                  <span className="text-emerald-400">🔒</span>
                  Paiement 100% sécurisé • Satisfaction garantie ou remboursé
                </p>
              </div>

              {/* Visuel Hero : Couvertures de livres */}
              <div className="relative flex justify-center items-center">
                <div className="absolute inset-0 bg-gradient-to-t from-[#070A14] via-transparent to-transparent z-10 pointer-events-none lg:hidden" />
                
                {/* Illustration avec les 6 couvertures */}
                <div className="relative">
                  <img
                    src="/ads/fb_hero_banner.jpg"
                    alt="Les Aventures de Léo - Collection complète 6 tomes"
                    className="w-full max-w-lg rounded-3xl shadow-2xl shadow-indigo-500/10 border border-slate-800/50"
                  />
                  
                  {/* Badge Promo flottant */}
                  <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex flex-col items-center justify-center text-white shadow-xl shadow-red-500/40 transform rotate-12 border-2 border-red-400">
                    <span className="text-[10px] sm:text-xs font-bold">PROMO</span>
                    <span className="text-lg sm:text-2xl font-black leading-none">-45%</span>
                  </div>

                  {/* Badge vidéo */}
                  <div className="absolute bottom-4 left-4 px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-700 backdrop-blur-sm flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white">🎥 Vidéo Spot Animé Inclus</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* BANDE PREUVE SOCIALE / TRUST BADGES */}
        {/* ================================================== */}
        <section className="border-y border-slate-800/50 bg-slate-900/30 py-8 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
              {[
                { num: '10 000+', label: 'Familles conquises', icon: '👨‍👩‍👧‍👦' },
                { num: '4.9/5', label: 'Note moyenne parents', icon: '⭐' },
                { num: '12', label: 'Livres disponibles', icon: '📚' },
                { num: '100%', label: 'Téléchargement immédiat', icon: '⚡' },
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <span className="text-2xl sm:text-3xl">{stat.icon}</span>
                  <p className="text-xl sm:text-2xl font-black text-white">{stat.num}</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION : Aperçu des 6 Tomes (Couvertures réelles) */}
        {/* ================================================== */}
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 space-y-10">
            <div className="text-center space-y-4">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-wider">
                📖 La Collection Complète
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
                6 Tomes Magiques, 6 Aventures Inoubliables
              </h2>
              <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
                Chaque tome emmène Léo dans un univers unique. Mystères cosmiques, créatures féeriques et leçons de courage captiveront votre enfant dès les premières pages.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              {covers.map((book, i) => (
                <Link key={i} href={`/books/${i + 1}`} className="group cursor-pointer">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-slate-800 shadow-lg group-hover:shadow-xl group-hover:shadow-amber-500/10 transition-all duration-500 group-hover:-translate-y-2 group-hover:border-amber-400/30">
                    <img
                      src={`/illustrations/${book.slug}/cover.png`}
                      alt={`Tome ${book.num} - ${book.title}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">Tome {book.num}</span>
                      <p className="text-xs font-bold text-white line-clamp-2 mt-0.5">{book.title}</p>
                    </div>
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black shadow-md">
                      {book.num}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Disponibles en <strong className="text-white">🇫🇷 Français</strong> et <strong className="text-white">🇬🇧 Anglais</strong></p>
              <p className="text-xs text-slate-500">Format Ebook EPUB HD + Livre Audio MP3 pour chaque tome</p>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION : Vidéo Promo (avec le spot animé existant) */}
        {/* ================================================== */}
        <section className="py-16 bg-gradient-to-b from-[#070A14] via-indigo-950/10 to-[#070A14]">
          <div className="max-w-4xl mx-auto px-4 space-y-8">
            <div className="text-center space-y-3">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-red-500/10 text-red-300 border border-red-500/20 uppercase tracking-wider">
                🎬 Regardez le Spot Vidéo
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Découvrez l'Univers de Léo en 12 Secondes
              </h2>
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl shadow-indigo-500/10 bg-slate-950">
              <video
                src="/ads/fb_ad_video_promo.mp4"
                controls
                poster="/ads/fb_ad_tome1_shadows.png"
                className="w-full aspect-video object-cover"
                preload="metadata"
              />
            </div>

            <p className="text-center text-xs text-slate-500">
              Spot publicitaire officiel — Utilisable sur Facebook Feed, Instagram Reels & Stories
            </p>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION : Pourquoi les Parents Adorent */}
        {/* ================================================== */}
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
                Pourquoi les Parents <span className="text-amber-400">Adorent</span> cette Collection
              </h2>
              <p className="text-sm text-slate-400">6 raisons de choisir Les Aventures de Léo ce soir</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <FeatureHighlight
                icon="🌙"
                title="Routine du Soir Magique"
                description="Remplacez les écrans par des histoires immersives. Les livres audio sont parfaits pour le rituel du coucher."
              />
              <FeatureHighlight
                icon="🎧"
                title="Voix Studio Professionnelles"
                description="Chaque livre audio est enregistré avec des comédiens voix off en studio. Qualité cinématographique."
              />
              <FeatureHighlight
                icon="📱"
                title="0% Écran Passif"
                description="Avec le format audio, votre enfant développe son imagination sans être collé à un écran."
              />
              <FeatureHighlight
                icon="🌍"
                title="Bilingue FR & EN"
                description="Tous les tomes existent en français et en anglais. Le moyen le plus fun d'apprendre l'anglais !"
              />
              <FeatureHighlight
                icon="⚡"
                title="Téléchargement Instantané"
                description="Accès immédiat par e-mail après commande. Aucune attente, aucun frais de livraison."
              />
              <FeatureHighlight
                icon="💎"
                title="Accès à Vie"
                description="Achetez une fois, gardez pour toujours. Compatible iPad, Kindle, Kobo, tout lecteur EPUB."
              />
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION : Témoignages Défilants */}
        {/* ================================================== */}
        <section className="py-16 bg-gradient-to-b from-[#070A14] via-slate-950/50 to-[#070A14] border-y border-slate-800/30">
          <div className="max-w-7xl mx-auto px-4 space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Ce que Disent les <span className="text-amber-400">Parents</span>
              </h2>
              <AnimatedStars rating={5} count={250} />
            </div>

            <div
              ref={testimonialsRef}
              className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {[...testimonials, ...testimonials].map((t, i) => (
                <TestimonialCard key={i} {...t} />
              ))}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION : Tableau des Offres (Conversion Principale) */}
        {/* ================================================== */}
        <section id="offers" className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 space-y-10">
            <div className="text-center space-y-4">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                🎁 Offres Spéciales Limitées
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
                Choisissez Votre Pack
              </h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">
                Toutes les offres incluent Ebooks EPUB HD + Livres Audio MP3. Accès instantané à vie.
              </p>
            </div>

            {/* Toggle FR / EN / Combo */}
            <div className="flex justify-center">
              <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold gap-1">
                {[
                  { key: 'fr', label: '🇫🇷 Pack FR', count: '6 tomes' },
                  { key: 'combo', label: '🌍 Combo', count: '12 livres' },
                  { key: 'en', label: '🇬🇧 Pack EN', count: '6 books' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveOffer(tab.key)}
                    className={`px-4 sm:px-5 py-2.5 rounded-xl transition-all ${
                      activeOffer === tab.key
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {tab.label} <span className="hidden sm:inline text-[10px] opacity-70">({tab.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cartes Offres */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              {activeOffer === 'fr' && (
                <>
                  <PricingCard
                    title="Tome Unique FR"
                    icon="📖"
                    badge="1 Tome au choix"
                    salePrice="4.99"
                    features={[
                      '1 Ebook EPUB HD illustré',
                      '1 Livre Audio MP3 immersif',
                      'Choix du tome (1 à 6)',
                      'Téléchargement immédiat',
                      'Compatible tous appareils',
                    ]}
                    cta="Choisir un Tome →"
                    ctaLink="/"
                  />
                  <PricingCard
                    featured
                    title="Pack FR Complet"
                    icon="🎁"
                    badge="6 Tomes — Best-Seller"
                    originalPrice="29.94"
                    salePrice="16.49"
                    discount="-45%"
                    features={[
                      '6 Ebooks EPUB HD illustrés',
                      '6 Livres Audio MP3 studio',
                      'La saga complète en français',
                      'Accès instantané à vie',
                      'Compatible iPad, Kindle, Kobo',
                      '🔥 Économisez 13.45€',
                    ]}
                    cta="🎁 Obtenir le Pack 6 Tomes FR"
                    ctaLink="/"
                    delay={100}
                  />
                  <PricingCard
                    title="Tome 1 — Découverte"
                    icon="🌟"
                    badge="Best-Seller ★★★★★"
                    salePrice="4.99"
                    features={[
                      'Léo et le Voleur d\'Ombres',
                      'Ebook EPUB HD + Audio MP3',
                      'Le tome préféré des enfants',
                      'Parfait pour découvrir la saga',
                      'Idéal dès 4 ans',
                    ]}
                    cta="Commencer par le Tome 1"
                    ctaLink="/books/1"
                    delay={200}
                  />
                </>
              )}

              {activeOffer === 'combo' && (
                <>
                  <PricingCard
                    title="Pack FR Seul"
                    icon="🇫🇷"
                    badge="6 Tomes Français"
                    originalPrice="29.94"
                    salePrice="16.49"
                    discount="-45%"
                    features={[
                      '6 Ebooks EPUB HD en français',
                      '6 Livres Audio MP3 FR',
                      'Voix studio professionnelles',
                      'Téléchargement immédiat',
                      'Compatible tous appareils',
                    ]}
                    cta="Pack FR Seul — 16.49€"
                    ctaLink="/"
                  />
                  <PricingCard
                    featured
                    title="Combo Bilingue"
                    icon="🌍"
                    badge="12 Livres (FR + EN) — Offre Ultime"
                    originalPrice="59.88"
                    salePrice="30.99"
                    discount="-48%"
                    features={[
                      '6 Ebooks EPUB HD en français',
                      '6 Ebooks EPUB HD en anglais',
                      '6 Livres Audio MP3 FR',
                      '6 Livres Audio MP3 EN',
                      'Éveil bilingue par le jeu',
                      'Accès à vie — 0 frais livraison',
                      '🔥 Économisez 28.89€',
                    ]}
                    cta="🌍 Obtenir le Combo 12 Livres"
                    ctaLink="/"
                    delay={100}
                  />
                  <PricingCard
                    title="Pack EN Seul"
                    icon="🇬🇧"
                    badge="6 Books English"
                    originalPrice="29.94"
                    salePrice="16.49"
                    discount="-45%"
                    features={[
                      '6 HD EPUB Ebooks in English',
                      '6 MP3 Audiobooks EN',
                      'Professional studio voices',
                      'Instant download',
                      'All devices compatible',
                    ]}
                    cta="English Pack — 16.49€"
                    ctaLink="/"
                    delay={200}
                  />
                </>
              )}

              {activeOffer === 'en' && (
                <>
                  <PricingCard
                    title="Single Book EN"
                    icon="📖"
                    badge="1 Book of your choice"
                    salePrice="4.99"
                    features={[
                      '1 HD illustrated EPUB Ebook',
                      '1 Immersive MP3 Audiobook',
                      'Choose your book (1 to 6)',
                      'Instant download',
                      'All devices compatible',
                    ]}
                    cta="Choose a Book →"
                    ctaLink="/"
                  />
                  <PricingCard
                    featured
                    title="Full English Pack"
                    icon="🎁"
                    badge="6 Books — Best-Seller"
                    originalPrice="29.94"
                    salePrice="16.49"
                    discount="-45%"
                    features={[
                      '6 HD illustrated EPUB Ebooks',
                      '6 Studio MP3 Audiobooks',
                      'Complete saga in English',
                      'Lifetime instant access',
                      'Compatible iPad, Kindle, Kobo',
                      '🔥 Save 13.45€',
                    ]}
                    cta="🎁 Get the 6-Book English Pack"
                    ctaLink="/"
                    delay={100}
                  />
                  <PricingCard
                    title="Book 1 — Discovery"
                    icon="🌟"
                    badge="Best-Seller ★★★★★"
                    salePrice="4.99"
                    features={[
                      'Leo and the Shadow Thief',
                      'EPUB Ebook + MP3 Audiobook',
                      'Kids\' #1 favorite book',
                      'Perfect to discover the saga',
                      'Ages 4 and up',
                    ]}
                    cta="Start with Book 1"
                    ctaLink="/books/11"
                    delay={200}
                  />
                </>
              )}
            </div>

            {/* Garantie & Moyens de paiement */}
            <div className="text-center space-y-3 pt-6">
              <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="text-emerald-400">🔒</span> Paiement Sécurisé SSL</span>
                <span className="flex items-center gap-1.5"><span>💳</span> Stripe, PayPal, Moneroo</span>
                <span className="flex items-center gap-1.5"><span>✅</span> Satisfait ou Remboursé</span>
                <span className="flex items-center gap-1.5"><span>⚡</span> Livraison Email Instantanée</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION : FAQ Rapide */}
        {/* ================================================== */}
        <section className="py-16 border-t border-slate-800/50 bg-slate-950/30">
          <div className="max-w-3xl mx-auto px-4 space-y-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center">
              Questions Fréquentes
            </h2>

            <div className="space-y-4">
              {[
                {
                  q: 'Comment recevoir les livres après achat ?',
                  a: 'Dès votre commande validée, vous recevez instantanément un e-mail avec les liens de téléchargement de vos Ebooks EPUB et Livres Audio MP3. Aucune attente !',
                },
                {
                  q: 'Sur quels appareils puis-je lire les ebooks ?',
                  a: 'Les Ebooks EPUB HD sont compatibles avec tous les appareils : iPad, iPhone, tablettes Android, liseuses Kindle, Kobo, et tout ordinateur avec un lecteur EPUB.',
                },
                {
                  q: 'L\'offre promotionnelle est-elle limitée dans le temps ?',
                  a: 'Oui ! Les réductions -45% et -48% sont des offres spéciales à durée limitée. Nous vous recommandons d\'en profiter tant qu\'elles sont disponibles.',
                },
                {
                  q: 'Mon enfant peut-il écouter les livres audio seul ?',
                  a: 'Absolument ! Les livres audio sont conçus pour être écoutés de manière autonome. Les voix studio sont claires, chaleureuses et apaisantes — parfaites pour le rituel du soir.',
                },
                {
                  q: 'Le combo bilingue convient-il aux débutants en anglais ?',
                  a: 'Oui ! Les enfants peuvent d\'abord lire/écouter l\'histoire en français, puis la redécouvrir en anglais. C\'est la méthode la plus naturelle et amusante pour apprendre.',
                },
              ].map((faq, i) => (
                <details key={i} className="group bg-slate-900/50 border border-slate-800/60 rounded-2xl overflow-hidden">
                  <summary className="px-5 py-4 cursor-pointer font-bold text-sm text-white flex items-center justify-between hover:bg-slate-800/30 transition">
                    {faq.q}
                    <span className="text-amber-400 group-open:rotate-45 transition-transform text-lg ml-2">+</span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-slate-300 leading-relaxed border-t border-slate-800/40 pt-3">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECTION : CTA Final */}
        {/* ================================================== */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-indigo-950/20 via-[#070A14] to-[#070A14]">
          <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
              Offrez à Votre Enfant des{' '}
              <span className="text-amber-400">Rêves Extraordinaires</span>{' '}
              Dès Ce Soir
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Rejoignez les +10 000 familles qui ont choisi Les Aventures de Léo pour le rituel du soir.
              Téléchargement immédiat, accès à vie.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link
                href="/"
                className="px-10 py-5 rounded-2xl text-base font-black bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-xl shadow-amber-500/30 transition-all transform hover:scale-105 active:scale-95"
              >
                🎁 Profiter de l'Offre -45% Maintenant
              </Link>
            </div>
            <p className="text-xs text-slate-500">
              🔒 Paiement sécurisé • Satisfaction garantie • 0 frais de livraison
            </p>
          </div>
        </section>
      </main>

      {/* ================================================== */}
      {/* FOOTER */}
      {/* ================================================== */}
      <footer className="border-t border-slate-800 bg-[#050710] py-8 text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex justify-center items-center gap-4 text-xs text-slate-500">
            <Link href="/" className="hover:text-white transition">Accueil</Link>
            <span>•</span>
            <Link href="/books/1" className="hover:text-white transition">Lire un Extrait</Link>
            <span>•</span>
            <a href="mailto:contact@livresleo.app" className="hover:text-white transition">Contact</a>
          </div>
          <p className="text-[11px] text-slate-600">
            Les Aventures de Léo © 2026 — Collection Numérique Officielle (Ebooks EPUB HD & Livres Audio MP3)
          </p>
        </div>
      </footer>

      {/* ================================================== */}
      {/* CTA FLOTTANT STICKY (apparaît après scroll) */}
      {/* ================================================== */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ${
          showFloatingCta ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="bg-gradient-to-r from-slate-950/98 via-slate-900/98 to-slate-950/98 backdrop-blur-xl border-t border-amber-400/20 px-4 py-3 shadow-2xl shadow-slate-950/50">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-white">Pack 6 Tomes — <span className="text-amber-400">-45%</span></p>
              <p className="text-xs text-slate-400">Ebooks + Audio • Téléchargement immédiat</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="text-right hidden sm:block">
                <span className="text-xs text-slate-500 line-through">29.94€</span>
                <span className="text-lg font-black text-amber-400 ml-2">16.49€</span>
              </div>
              <Link
                href="/"
                className="flex-grow sm:flex-grow-0 text-center px-6 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/30 hover:from-amber-300 hover:to-orange-400 transition-all transform active:scale-95"
              >
                🎁 Obtenir le Pack →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* NOTIFICATION D'ACHAT RÉCENT (Social Proof Pop-up) */}
      {/* ================================================== */}
      <div
        className={`fixed bottom-20 left-4 z-40 transition-all duration-700 ${
          recentBuyer ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
      >
        {recentBuyer && (
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-4 shadow-2xl max-w-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-500 flex items-center justify-center text-white text-lg flex-shrink-0">
              ✓
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {recentBuyer.name} ({recentBuyer.city})
              </p>
              <p className="text-[10px] text-slate-400">
                a acheté le <span className="text-amber-300 font-semibold">{recentBuyer.pack}</span>
              </p>
              <p className="text-[10px] text-slate-500">{recentBuyer.time}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
