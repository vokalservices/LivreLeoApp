import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// ============================================================
// COMPOSANT : Compte à rebours animé (urgence psychologique)
// ============================================================
function CountdownTimer({ hours = 11, minutes = 47, seconds = 33 }) {
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
  }, [hours, minutes, seconds]);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
      {[
        { val: time.h, label: 'Heures' },
        { val: time.m, label: 'Min' },
        { val: time.s, label: 'Sec' },
      ].map((unit, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-amber-400 tabular-nums drop-shadow-md">
              {pad(unit.val)}
            </span>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-amber-200/80 font-bold">
              {unit.label}
            </span>
          </div>
          {i < 2 && <span className="text-lg sm:text-xl text-amber-400/80 font-black animate-pulse">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================
// COMPOSANT : Lecteur Audio Interactif Studio (Conversion Booster)
// ============================================================
function InteractiveAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const audioRef = useRef(null);

  const tracks = [
    {
      title: "Tome 1 — Léo et le Voleur d'Ombres",
      sub: "Extrait introductif • Voix comédien studio",
      src: "/audio/leo-et-le-voleur-d-ombres/page_002.mp3",
      durationApprox: "0:45",
      lang: "🇫🇷 FR",
    },
    {
      title: "Tome 2 — Léo et le Voleur de Rêves",
      sub: "Ambiance nocturne apaisante • Rituel du coucher",
      src: "/audio/leo-et-le-voleur-de-reves/page_002.mp3",
      durationApprox: "0:40",
      lang: "🇫🇷 FR",
    },
    {
      title: "Book 1 — Leo and the Shadow Thief",
      sub: "Native British accent • Éveil bilingue",
      src: "/audio/en/leo-and-the-shadow-thief/page_002.mp3",
      durationApprox: "0:42",
      lang: "🇬🇧 EN",
    },
  ];

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const selectTrack = (idx) => {
    setActiveTrack(idx);
    setIsPlaying(false);
    setProgress(0);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }, 100);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration;
    if (dur && !isNaN(dur)) {
      setProgress((cur / dur) * 100);
      setCurrentTime(formatTime(cur));
      setDuration(formatTime(dur));
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = clickX / rect.width;
    if (audioRef.current.duration) {
      audioRef.current.currentTime = newProgress * audioRef.current.duration;
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 relative overflow-hidden">
      <audio
        ref={audioRef}
        src={tracks[activeTrack].src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        {/* Colonne gauche : infos du titre & contrôle */}
        <div className="flex items-center gap-5 w-full md:w-auto">
          <button
            onClick={togglePlay}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-orange-500 text-slate-950 flex items-center justify-center text-2xl sm:text-3xl font-black shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all flex-shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/15 text-amber-300 border border-amber-400/30">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              {tracks[activeTrack].lang} • QUALITÉ STUDIO
            </div>
            <h4 className="text-base sm:text-lg font-black text-white leading-tight">
              {tracks[activeTrack].title}
            </h4>
            <p className="text-xs text-slate-400">{tracks[activeTrack].sub}</p>
          </div>
        </div>

        {/* Colonne droite : Sélecteur d'extraits */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
          {tracks.map((t, i) => (
            <button
              key={i}
              onClick={() => selectTrack(i)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTrack === i
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
              }`}
            >
              {t.lang} Tome {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Barre de progression & Waveform animée */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 relative z-10">
        <div
          onClick={handleSeek}
          className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden cursor-pointer relative group"
        >
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono mt-2">
          <span>{currentTime}</span>
          <div className="flex items-center gap-1">
            {[6, 12, 18, 10, 16, 22, 14, 20, 8, 18, 14, 10].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full ${isPlaying ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'}`}
                style={{
                  height: `${h}px`,
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
          <span>{duration !== '0:00' ? duration : tracks[activeTrack].durationApprox}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPOSANT : Étoiles et avis
// ============================================================
function AnimatedStars({ rating = 5, count = 250 }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5 text-amber-400 text-base">
        {'★'.repeat(rating)}
      </div>
      <span className="text-xs font-bold text-amber-300">{rating}.0/5</span>
      <span className="text-[11px] text-slate-400">({count}+ avis vérifiés)</span>
    </div>
  );
}

// ============================================================
// COMPOSANT : Carte d'Offre (Pricing)
// ============================================================
function PricingCard({ featured, title, badge, originalPrice, salePrice, discount, features, cta, ctaLink, icon }) {
  return (
    <div
      className={`relative rounded-3xl border p-6 sm:p-8 flex flex-col transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl ${
        featured
          ? 'bg-gradient-to-b from-amber-950/30 via-slate-900 to-indigo-950/40 border-amber-400/60 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400/30'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      {featured && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 text-[11px] font-black rounded-full shadow-lg shadow-amber-500/30 uppercase tracking-wider whitespace-nowrap">
          ⚡ Choix N°1 des Parents — {discount}
        </div>
      )}

      <div className="text-center space-y-2 mb-6 pt-1">
        <span className="text-4xl">{icon}</span>
        <h3 className="text-xl sm:text-2xl font-black text-white">{title}</h3>
        {badge && (
          <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${
            featured ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
          }`}>
            {badge}
          </span>
        )}
      </div>

      <div className="text-center mb-6">
        {originalPrice && (
          <span className="text-base text-slate-500 line-through font-medium mr-2">{originalPrice}€</span>
        )}
        <span className={`text-4xl sm:text-5xl font-black ${featured ? 'text-amber-400' : 'text-white'}`}>
          {salePrice}€
        </span>
        <p className="text-xs text-slate-400 mt-1">Accès à vie • Téléchargement immédiat par email</p>
      </div>

      <ul className="space-y-3 mb-8 flex-grow">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
            <span className="text-emerald-400 font-bold mt-0.5">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaLink || '/'}
        className={`block text-center py-4 px-6 rounded-2xl font-black text-sm transition-all transform active:scale-95 shadow-lg ${
          featured
            ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-amber-500/30'
            : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-600/30'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

// ============================================================
// PAGE PRINCIPALE : Landing Page Bestseller & Hub Campagnes
// ============================================================
export default function FacebookAdsPage() {
  const [currentMode, setCurrentMode] = useState('landing'); // 'landing' | 'swipefile'
  const [activeOffer, setActiveOffer] = useState('fr');
  const [selectedAngle, setSelectedAngle] = useState(0);
  const [selectedScript, setSelectedScript] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  const [liveViewers, setLiveViewers] = useState(247);
  const [recentBuyer, setRecentBuyer] = useState(null);

  // Fluctuations spectateurs en direct
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveViewers((prev) => {
        const delta = Math.floor(Math.random() * 9) - 4;
        return Math.max(190, Math.min(340, prev + delta));
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // CTA flottant après défilement
  useEffect(() => {
    const handleScroll = () => setShowFloatingCta(window.scrollY > 550);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pop-up d'achat récent (preuve sociale)
  useEffect(() => {
    const buyers = [
      { name: 'Sophie M.', city: 'Paris', pack: 'Pack FR 6 Tomes (16.49€)', time: 'il y a 2 min' },
      { name: 'Marie L.', city: 'Lyon', pack: 'Combo Bilingue 12 Livres (30.99€)', time: 'il y a 5 min' },
      { name: 'Sarah K.', city: 'Bruxelles', pack: 'Pack FR 6 Tomes', time: 'il y a 8 min' },
      { name: 'Camille D.', city: 'Montréal', pack: 'Combo Bilingue', time: 'il y a 11 min' },
      { name: 'Pierre T.', city: 'Genève', pack: 'Pack FR 6 Tomes', time: 'il y a 15 min' },
    ];
    let idx = 0;
    const showNext = () => {
      setRecentBuyer(buyers[idx % buyers.length]);
      idx++;
      setTimeout(() => setRecentBuyer(null), 5500);
    };
    const firstTimer = setTimeout(showNext, 6000);
    const timer = setInterval(showNext, 24000);
    return () => {
      clearTimeout(firstTimer);
      clearInterval(timer);
    };
  }, []);

  // Fonction de copie presse-papier 1-clic
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // ============================================================
  // LES 5 ANGLES MARKETING D'ÉLITE (Swipe File Bestseller)
  // ============================================================
  const marketingAngles = [
    {
      id: 'angle_screens',
      name: "1. L'Alternative aux Écrans (Pain / Agitation)",
      tag: "TOP CONVERSION COLD AUDIENCE",
      hookHeadline: "Dites adieu aux crises de 20h30 quand vous éteignez la tablette",
      creativeImage: "/ads/fb_ad_screen_vs_leo.png",
      primaryText: `🌙 Vous redoutez le moment du coucher parce qu'éteindre les écrans vire au drame chaque soir ?

La lumière bleue bloque la mélatonine naturelle de votre enfant. Résultat : agitation, coucher qui traîne pendant 45 minutes et culpabilité parentale.

✨ Découvrez Les Aventures de Léo : la saga féerique qui transforme le coucher en un havre de paix.

🎧 6 Livres Audio immersifs enregistrés en studio par des comédiens professionnels : votre enfant ferme les yeux, écoute une voix douce et s'endort apaisé en 12 minutes chrono.
📚 6 Ebooks illustrés haute définition à lire ensemble sur tablette ou liseuse.

🔥 Offre spéciale de lancement : -45% sur le Coffret Complet 6 Tomes (16,49€ au lieu de 29,94€ — soit seulement 2,75€ par histoire complète à vie).
⚡ Téléchargement immédiat par email dès validation.`,
      headline: "Terminez le rituel du coucher en 12 minutes (Sans Écran) ⭐ 4.9/5",
      description: "Pack 6 Livres Audio + 6 Ebooks HD • 16.49€ aujourd'hui • Accès instantané",
      cta: "Profiter de l'offre",
      targetAudience: "Parents d'enfants 3-8 ans, Intérêts : Pédagogie Montessori, Livres pour enfants, Routine du soir, Histoires du soir, Lunii, Yoto.",
    },
    {
      id: 'angle_bundle',
      name: "2. L'Offre No-Brainer / Value Stack",
      tag: "MEILLEUR ROAS DIRECT",
      hookHeadline: "6 Livres Audio + 6 Ebooks HD pour le prix d'un seul livre papier en librairie",
      creativeImage: "/ads/fb_ad_value_stack_bundle.png",
      primaryText: `🎁 Un livre pour enfants en librairie coûte entre 12€ et 18€. Et il est lu en 10 minutes...

Et si vous offriez à votre enfant une collection géante complète pour moins que ça ?

Voici le Pack Intégral « Les Aventures de Léo » :
✅ 6 Ebooks EPUB HD avec illustrations féeriques plein écran (Valeur : 29,94€)
✅ 6 Livres Audio MP3 studio avec comédiens voix off (Valeur : 29,94€)
✅ Disponible en Français & Anglais pour l'éveil linguistique (Valeur : 14,99€)
✅ Zéro abonnement, accès illimité à vie sur tous vos appareils
✅ Garantie 30 jours : 100% Satisfait ou Remboursé

💸 Valeur totale réelle : 74,87€
👉 Aujourd'hui en offre flash : 16,49€ seulement (-45%) !

Rejoignez plus de 10 000 familles conquises. Cliquez ci-dessous pour télécharger la collection instantanément.`,
      headline: "Pack 6 Tomes Complet : -45% Aujourd'hui Seulement (-13.45€)",
      description: "Ebooks HD + Livres Audio inclus • 16.49€ à vie • Téléchargement immédiat",
      cta: "Obtenir l'offre",
      targetAudience: "Advantage+ Shopping Campaigns (ASC+) en ciblage large (Broad France/Belgique/Suisse/Canada 25-50 ans).",
    },
    {
      id: 'angle_ugc',
      name: "3. Témoignage Émotionnel Parent (UGC Review)",
      tag: "PREUVE SOCIALE PUISSANTE",
      hookHeadline: "« C'est le meilleur investissement pour nos soirées en famille »",
      creativeImage: "/ads/fb_ad_ugc_review.png",
      primaryText: `« Mon fils Lucas (6 ans) réclamait des vidéos YouTube jusqu'à pas d'heure. On passait parfois une heure et demie à négocier dans les larmes.

J'ai testé Les Aventures de Léo un peu par désespoir. Premier soir : on éteint la lumière, on lance le livre audio du Tome 1 (Léo et le Voleur d'Ombres).

La voix est tellement douce et immersive que Lucas s'est blotti sous sa couette sans dire un mot. En 10 minutes, il dormait profondément avec un petit sourire.

Ça fait maintenant 3 semaines, et c'est lui qui me demande 'la suite de Léo' dès 20h. Un vrai soulagement pour nous. » — Sophie M., maman comblée.

⭐ Noté 4.9/5 par plus de 250 parents.
Débloquez les 6 tomes (Ebooks + Audios) pour 16,49€ dès maintenant.`,
      headline: "« Il s'endort sans crise en 10 minutes » — Avis Vérifié ★★★★★",
      description: "Pack 6 Tomes Audio + Ebook • Satisfait ou remboursé • Accès immédiat",
      cta: "En savoir plus",
      targetAudience: "Mères de famille 25-45 ans, centres d'intérêt Parentalité positive, Éveil de l'enfant, Sommeil bébé et enfant.",
    },
    {
      id: 'angle_bilingual',
      name: "4. L'Éveil Bilingue par le Jeu (FR + EN)",
      tag: "ANGLE HAUT PANIER MOYEN (COMBO 30.99€)",
      hookHeadline: "Comment apprendre l'anglais à votre enfant sans leçons ennuyeuses",
      creativeImage: "/ads/fb_ad_combo_bilingual.png",
      primaryText: `🌍 Tous les experts s'accordent : c'est entre 4 et 8 ans que l'oreille de l'enfant absorbe les langues avec une facilité prodigieuse.

Inutile d'acheter des cours de soutien hors de prix ou des applications compliquées.

Avec le Combo Bilingue des Aventures de Léo :
1️⃣ Votre enfant écoute d'abord l'histoire en français pour s'attacher aux personnages.
2️⃣ Il réécoute ensuite la même aventure en anglais avec un accent natif parfait.
3️⃣ Il associe le vocabulaire et les tournures de phrases sans le moindre effort, comme un jeu magique.

🎁 LE PACK COMBO BILINGUE (12 LIVRES) :
- 6 Ebooks FR + 6 Ebooks EN
- 6 Livres Audio FR + 6 Livres Audio EN
- Promotion exceptionnelle : -48% (30,99€ au lieu de 59,88€).`,
      headline: "12 Livres Bilingues (FR + EN) : Éveillez votre enfant à l'anglais (-48%)",
      description: "6 Tomes Français + 6 Livres Anglais • Livres audio studio inclus",
      cta: "Commander le combo",
      targetAudience: "Parents cadres, expatriés, bilingues, éducation internationale, immersion anglais enfant.",
    },
    {
      id: 'angle_bedtime',
      name: "5. Le Rituel Coucher & Valeurs de Courage",
      tag: "ANGLE ÉDUCATIF & MORAL",
      hookHeadline: "Des histoires qui apprennent à vaincre la peur du noir et des monstres",
      creativeImage: "/ads/fb_ad_bedtime_routine.png",
      primaryText: `✨ Chaque enfant traverse des moments de doute, la peur du noir, les cauchemars ou la timidité.

Dans « Les Aventures de Léo », notre petit héros ne combat pas les monstres avec des épées : il apprend à écouter ses émotions, à faire preuve d'empathie et à trouver le courage en lui.

🌙 Des contes bienveillants et poétiques conçus pour rassurer l'enfant avant la nuit :
• Tome 1 : Vaincre la peur du noir et apprivoiser ses ombres
• Tome 2 : Transformer les mauvais rêves en étoiles
• Tome 3 : Exprimer ses émotions et retrouver ses couleurs
• Tomes 4 à 6 : Partage, patience et persévérance

Accompagnez les rêves de votre enfant ce soir avec le coffret complet en promotion.`,
      headline: "Aidez votre enfant à grandir en confiance • Contes audio apaisants",
      description: "Collection complète 6 tomes • Téléchargement immédiat sur vos appareils",
      cta: "Découvrir la saga",
      targetAudience: "Parents soucieux du développement émotionnel, psychologie enfant, littérature jeunesse.",
    },
  ];

  // ============================================================
  // LES 3 SCRIPTS VIDÉO UGC 9:16 (TikTok / Reels / Stories)
  // ============================================================
  const videoScripts = [
    {
      title: "Script 1 : « Pourquoi nous avons banni YouTube à 20h » (Format Facecam Maman / Papa)",
      duration: "30 secondes",
      format: "9:16 vertical • Tonalité naturelle, bienveillante et authentique",
      scenes: [
        {
          time: "0:00 - 0:03",
          action: "Maman face caméra, chuchotant avec un air soulagé dans le couloir d'une chambre d'enfant.",
          textOverlay: "On a arrêté YouTube à 20h... voici ce qui s'est passé 🤫",
          voice: "« Si le coucher avec votre enfant ressemble à un combat de catch tous les soirs, écoutez ça... »",
        },
        {
          time: "0:03 - 0:10",
          action: "Plan de coupe : chambre tamisée, une veilleuse douce, l'enfant sous la couette qui sourit les yeux fermés.",
          textOverlay: "Avant : 45 min de larmes\nMaintenant : Endormi en 10 min !",
          voice: "« On en avait marre des crises quand on coupait les écrans. Alors on a testé Les Aventures de Léo en livre audio. »",
        },
        {
          time: "0:10 - 0:20",
          action: "Écran de smartphone ou tablette posé sur la table de nuit, montrant la jolie couverture de Léo, avec l'extrait audio en fond.",
          textOverlay: "🎧 Voix studio hyper douce (zéro écran passif)",
          voice: "« C'est une vraie voix de studio, apaisante et féerique. Il ferme les yeux, imagine l'histoire et s'endort sans aucune crise. »",
        },
        {
          time: "0:20 - 0:30",
          action: "Maman souriante montrant le site sur son téléphone avec le bouton du pack.",
          textOverlay: "🎁 16,49€ les 6 livres audio + 6 ebooks (-45%)",
          voice: "« Le pack complet de 6 tomes est à 16€ en ce moment. Vous le recevez direct par mail. Cliquez en dessous pour tester ce soir ! »",
        },
      ],
    },
    {
      title: "Script 2 : « Unboxing Digital du Pack 6 Tomes » (Démonstration Produit)",
      duration: "25 secondes",
      format: "9:16 vertical • Rythme dynamique avec musique douce",
      scenes: [
        {
          time: "0:00 - 0:03",
          action: "Main qui ouvre une notification email sur iPad : 'Vos Livres Léo sont prêts !'",
          textOverlay: "POV : Tu viens de débloquer le pack Léo à 16,49€ 📲",
          voice: "« Qu'est-ce qu'on reçoit exactement quand on prend le Pack Léo ? Regardez ça. »",
        },
        {
          time: "0:03 - 0:12",
          action: "Feuilletage rapide des illustrations magnifiques plein écran sur liseuse et iPad.",
          textOverlay: "✨ 6 Ebooks HD magnifiquement illustrés",
          voice: "« 6 livres numériques avec des illustrations juste splendides sur tablette ou liseuse Kindle. »",
        },
        {
          time: "0:12 - 0:20",
          action: "Mise en route de l'audio avec des écouteurs ou une enceinte connectée dans la chambre.",
          textOverlay: "🌙 + 6 Livres Audio MP3 pour le dodo",
          voice: "« Et surtout : les 6 livres audio complets pour remplacer les écrans avant de dormir. »",
        },
        {
          time: "0:20 - 0:25",
          action: "Affichage de l'offre barrée 29,94€ -> 16,49€ avec le lien cliquable.",
          textOverlay: "⚡ Téléchargement immédiat • Moins de 2,75€/tome",
          voice: "« C'est à -45% en ce moment avec téléchargement immédiat. Le lien est juste ici ! »",
        },
      ],
    },
    {
      title: "Script 3 : « Le Secret des Enfants Bilingues » (Focus Éveil Anglais)",
      duration: "28 secondes",
      format: "9:16 vertical • Éducatif et inspirant",
      scenes: [
        {
          time: "0:00 - 0:04",
          action: "Enfant qui écoute attentivement et répète un mot anglais avec fierté.",
          textOverlay: "Comment elle a appris 100 mots d'anglais sans s'en rendre compte 🇬🇧✨",
          voice: "« Vous voulez que votre enfant apprenne l'anglais sans le forcer à faire des devoirs ? »",
        },
        {
          time: "0:04 - 0:14",
          action: "Split screen montrant la version française à gauche et la version anglaise à droite.",
          textOverlay: "1 conte en Français 🇫🇷\nPuis le même en Anglais 🇬🇧",
          voice: "« L'astuce magique : il écoute d'abord l'histoire en français. Une fois qu'il connaît l'intrigue, on passe à la version anglaise. »",
        },
        {
          time: "0:14 - 0:22",
          action: "Capture de la narration audio anglaise fluide avec un accent britannique naturel.",
          textOverlay: "Absorption naturelle de l'accent dès 4 ans 🧠",
          voice: "« Son cerveau fait les connexions tout seul, sans effort. Le combo bilingue regroupe les 12 livres audio et ebooks. »",
        },
        {
          time: "0:22 - 0:28",
          action: "Bouton CTA bien visible avec logo 12 livres.",
          textOverlay: "Combo 12 Livres à -48% • Cliquez pour en profiter",
          voice: "« Profitez de l'offre spéciale bilingue avant qu'elle n'expire en cliquant ci-dessous ! »",
        },
      ],
    },
  ];

  const currentAngleData = marketingAngles[selectedAngle];
  const currentScriptData = videoScripts[selectedScript];

  return (
    <div className="min-h-screen bg-[#070A14] text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden">
      <Head>
        <title>Pack Campagnes Meta Ads Bestseller — Les Aventures de Léo</title>
        <meta
          name="description"
          content="Hub stratégique et Landing Page Haute Performance pour les campagnes publicitaires Facebook et Instagram de la saga Les Aventures de Léo."
        />
        <meta property="og:title" content="Offre Spéciale — Les Aventures de Léo (Pack 6 Tomes)" />
        <meta property="og:image" content="/ads/fb_ad_screen_vs_leo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* ================================================== */}
      {/* BARRE DE SWITCH : MODE CLIENT vs MODE ANNONCEUR */}
      {/* ================================================== */}
      <div className="sticky top-0 z-50 bg-[#0A0E1F]/95 backdrop-blur-xl border-b border-amber-500/20 py-2.5 px-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wide">
              CAMPAGNES META ADS 2026 • BESTSELLER SUITE
            </span>
          </div>

          {/* Toggle Button Mode */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setCurrentMode('landing')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                currentMode === 'landing'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🚀 Landing Page (Vue Client)
            </button>
            <button
              onClick={() => setCurrentMode('swipefile')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                currentMode === 'swipefile'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎯 Kit Annonceur & Swipe File
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
            <span className="text-amber-400 font-bold">16.49€ (-45%)</span>
            <span>•</span>
            <span>{liveViewers} visiteurs chauds</span>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* VUE 1 : LANDING PAGE CLIENT HAUTE CONVERSION */}
      {/* ================================================== */}
      {currentMode === 'landing' && (
        <main>
          {/* Top Urgency Trust Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-slate-950 text-center py-2 px-4 text-xs font-black tracking-wide">
            <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <span>⚡ OFFRE SPÉCIALE FACEBOOK : -45% EXPIRANT DANS :</span>
              <CountdownTimer hours={11} minutes={47} seconds={33} />
              <span className="hidden sm:inline">|</span>
              <span className="text-slate-900 font-extrabold">Livraison par E-mail Instantanée (0€ Frais)</span>
            </div>
          </div>

          {/* HERO SECTION */}
          <section className="relative pt-12 pb-16 md:py-20 px-4 overflow-hidden">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Colonne Gauche : Pitch Copywriting */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    ⭐ LE RITUEL DU COUCHER PRÉFÉRÉ DE +10 000 FAMILLES
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
                  Dites adieu aux crises d'écran le soir.{' '}
                  <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">
                    Endormez votre enfant en 12 minutes
                  </span>{' '}
                  avec Léo.
                </h1>

                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Offrez-lui les <strong className="text-white">6 Tomes Complets</strong> de la saga féerique :{' '}
                  <strong className="text-amber-300">6 Livres Audio MP3 immersifs</strong> enregistrés en studio d'acteur +{' '}
                  <strong className="text-amber-300">6 Ebooks EPUB HD</strong> magnifiquement illustrés.
                </p>

                {/* 3 USPs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
                    <span className="text-2xl">🌙</span>
                    <p className="text-xs font-black text-white mt-1">0% Écran Passif</p>
                    <p className="text-[11px] text-slate-400">Écoute calme dans le noir</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
                    <span className="text-2xl">🎧</span>
                    <p className="text-xs font-black text-white mt-1">Voix Studio Douce</p>
                    <p className="text-[11px] text-slate-400">Comédiens professionnels</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
                    <span className="text-2xl">⚡</span>
                    <p className="text-xs font-black text-white mt-1">Accès Instantané</p>
                    <p className="text-[11px] text-slate-400">Reçu par e-mail en 10 sec</p>
                  </div>
                </div>

                {/* CTA & Rating */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-3 justify-center lg:justify-start">
                  <a
                    href="#pricing"
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-black bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all text-center"
                  >
                    🎁 Télécharger le Pack 6 Tomes (-45%)
                  </a>
                  <AnimatedStars rating={5} count={250} />
                </div>
              </div>

              {/* Colonne Droite : Visuel Split Screen ou Pack 3D */}
              <div className="lg:col-span-5 relative flex justify-center">
                <div className="relative group max-w-md w-full">
                  <img
                    src="/ads/fb_ad_screen_vs_leo.png"
                    alt="Comparatif Routine Écran vs Livres de Léo"
                    className="w-full rounded-3xl shadow-2xl border border-slate-800 group-hover:border-amber-400/40 transition-all duration-300"
                  />
                  <div className="absolute -bottom-4 -right-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-2xl shadow-xl flex items-center gap-1.5">
                    <span>✓</span> 100% Satisfait ou Remboursé
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* NOUVEAUTÉ : LECTEUR AUDIO INTERACTIF EN DIRECT */}
          {/* ================================================== */}
          <section className="py-12 bg-slate-950/60 border-y border-slate-800/80 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  🎧 ÉCOUTEZ UN EXTRAIT MAINTENANT
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Découvrez la voix magique qui apaise les enfants
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                  Cliquez sur lecture pour écouter un échantillon studio des contes de Léo. Aucune musique stridente, juste un récit chaleureux et captivant.
                </p>
              </div>

              <InteractiveAudioPlayer />
            </div>
          </section>

          {/* ================================================== */}
          {/* TABLEAU COMPARATIF : AVANT / APRÈS (Prouvé Scientifiquement) */}
          {/* ================================================== */}
          <section className="py-16 px-4">
            <div className="max-w-5xl mx-auto space-y-10">
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-4xl font-black text-white">
                  Pourquoi Léo remplace définitivement les écrans
                </h2>
                <p className="text-sm text-slate-400">Le tableau qui convainc 9 parents sur 10</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Boîte Négative */}
                <div className="p-6 sm:p-8 rounded-3xl bg-red-950/20 border border-red-500/30 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center text-xl font-bold">
                      ✕
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-red-300">La Routine Écrans & Tablettes</h3>
                      <p className="text-xs text-red-200/60">YouTube, dessins animés, jeux mobiles</p>
                    </div>
                  </div>
                  <ul className="space-y-3.5 text-xs sm:text-sm text-red-100/90">
                    <li className="flex items-start gap-2.5">
                      <span className="text-red-400 font-bold">✕</span>
                      <span>Crises systématiques et pleurs quand on éteint l'écran.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-red-400 font-bold">✕</span>
                      <span>Lumière bleue qui bloque la sécrétion naturelle de mélatonine.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-red-400 font-bold">✕</span>
                      <span>Enfant surexcité : temps d'endormissement supérieur à 45 minutes.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-red-400 font-bold">✕</span>
                      <span>Passivité cérébrale et risques accrus de cauchemars nocturnes.</span>
                    </li>
                  </ul>
                </div>

                {/* Boîte Positive */}
                <div className="p-6 sm:p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/40 space-y-5 shadow-xl shadow-emerald-950/20">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
                      ✓
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-emerald-300">Avec Les Contes de Léo</h3>
                      <p className="text-xs text-emerald-200/60">Livres Audio MP3 & Ebooks illustrés</p>
                    </div>
                  </div>
                  <ul className="space-y-3.5 text-xs sm:text-sm text-emerald-100">
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>L'enfant réclame lui-même le rituel du soir dès 20h.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>0% Écran avec le livre audio : il écoute dans la pénombre.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Endormissement serein et rapide en 10 à 12 minutes chrono.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Développe le vocabulaire, le courage et l'imagination fertile.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* APERÇU DES 6 TOMES & VISUELS */}
          {/* ================================================== */}
          <section className="py-16 bg-slate-950/40 px-4">
            <div className="max-w-6xl mx-auto space-y-10">
              <div className="text-center space-y-2">
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
                  📚 LA SAGA COMPLÈTE
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-white">
                  6 Aventures, 6 Leçons de Vie Inoubliables
                </h2>
                <p className="text-sm text-slate-400 max-w-xl mx-auto">
                  Chaque histoire aborde avec poésie une étape essentielle de l'enfance : la peur du noir, les cauchemars, la gestion des émotions et le partage.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { title: "Le Voleur d'Ombres", num: 1, theme: "Vaincre la peur du noir", slug: "leo-et-le-voleur-d-ombres" },
                  { title: "Le Voleur de Rêves", num: 2, theme: "Adieu les cauchemars", slug: "leo-et-le-voleur-de-reves" },
                  { title: "Le Voleur de Couleurs", num: 3, theme: "Exprimer ses émotions", slug: "leo-et-le-voleur-de-couleurs" },
                  { title: "Le Voleur d'Étoiles", num: 4, theme: "L'amitié & l'entraide", slug: "leo-et-le-voleur-d-etoiles" },
                  { title: "Le Voleur de Nuages", num: 5, theme: "Patience et persévérance", slug: "leo-et-le-voleur-de-nuages" },
                  { title: "Le Voleur de Temps", num: 6, theme: "Savourer l'instant présent", slug: "leo-et-le-voleur-de-temps" },
                ].map((b, i) => (
                  <div
                    key={i}
                    className="group bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex flex-col items-center text-center hover:border-amber-400/40 hover:-translate-y-1 transition-all"
                  >
                    <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden mb-3">
                      <img
                        src={`/illustrations/${b.slug}/cover.png`}
                        alt={b.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all"
                      />
                      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                        {b.num}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white line-clamp-1">{b.title}</p>
                    <p className="text-[10px] text-amber-300/80 mt-0.5">{b.theme}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* SECTION OFFRES & VALUE STACK (Conversion Directe) */}
          {/* ================================================== */}
          <section id="pricing" className="py-16 md:py-24 px-4 relative">
            <div className="max-w-6xl mx-auto space-y-10">
              <div className="text-center space-y-3">
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black bg-amber-400/15 text-amber-300 border border-amber-400/30 uppercase tracking-widest">
                  🎁 OFFRES SPÉCIALES LIMITÉES
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
                  Choisissez Votre Coffret
                </h2>
                <p className="text-sm text-slate-400 max-w-xl mx-auto">
                  Chaque pack comprend le téléchargement immédiat des Ebooks EPUB HD et des Livres Audio MP3 studio.
                </p>

                {/* Tabs */}
                <div className="flex justify-center pt-4">
                  <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-1">
                    {[
                      { key: 'fr', label: '🇫🇷 Pack FR (6 Tomes)' },
                      { key: 'combo', label: '🌍 Combo Bilingue (12 Livres)' },
                      { key: 'en', label: '🇬🇧 Pack EN (6 Books)' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveOffer(tab.key)}
                        className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                          activeOffer === tab.key
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grille Tarifs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
                {activeOffer === 'fr' && (
                  <>
                    <PricingCard
                      title="Tome 1 Découverte"
                      icon="🌟"
                      badge="Le Favori des Petits"
                      salePrice="4.99"
                      features={[
                        "Livre Léo et le Voleur d'Ombres",
                        'Ebook EPUB HD illustré',
                        'Livre Audio MP3 studio complet',
                        'Idéal pour tester ce soir',
                        'Téléchargement immédiat par email',
                      ]}
                      cta="Commencer par le Tome 1"
                      ctaLink="/books/1"
                    />

                    <PricingCard
                      featured
                      title="Coffret 6 Tomes FR"
                      icon="🎁"
                      badge="Best-Seller Mondial (-45%)"
                      originalPrice="29.94"
                      salePrice="16.49"
                      discount="-45%"
                      features={[
                        'Les 6 Ebooks EPUB HD illustrés',
                        'Les 6 Livres Audio MP3 studio complets',
                        'La saga intégrale en français',
                        'Soit seulement 2,75€ par histoire complète',
                        'Accès illimité à vie sans abonnement',
                        'Compatible iPad, iPhone, Android, Kindle, Kobo',
                        'Garantie 30 jours Satisfait ou Remboursé',
                      ]}
                      cta="🎁 Obtenir le Pack 6 Tomes FR (16.49€)"
                      ctaLink="/"
                    />

                    <PricingCard
                      title="Pack Éveil Bilingue"
                      icon="🌍"
                      badge="FR + EN (12 Livres)"
                      originalPrice="59.88"
                      salePrice="30.99"
                      discount="-48%"
                      features={[
                        '6 Tomes FR + 6 Livres Anglais EN',
                        '12 Ebooks EPUB HD',
                        '12 Livres Audio MP3',
                        'Parfait pour initier à l’anglais dès 4 ans',
                        'Accès illimité à vie',
                      ]}
                      cta="Découvrir le Combo 12 Livres"
                      ctaLink="/"
                    />
                  </>
                )}

                {activeOffer === 'combo' && (
                  <>
                    <PricingCard
                      title="Pack FR 6 Tomes"
                      icon="🇫🇷"
                      badge="Français Seul"
                      originalPrice="29.94"
                      salePrice="16.49"
                      discount="-45%"
                      features={[
                        '6 Ebooks EPUB HD en français',
                        '6 Livres Audio MP3 studio',
                        'La saga complète en français',
                        'Téléchargement immédiat',
                      ]}
                      cta="Pack FR Seul — 16.49€"
                      ctaLink="/"
                    />

                    <PricingCard
                      featured
                      title="Combo Bilingue Ultime"
                      icon="🌍"
                      badge="12 Livres (FR + EN) — -48%"
                      originalPrice="59.88"
                      salePrice="30.99"
                      discount="-48%"
                      features={[
                        '6 Ebooks EPUB HD en français',
                        '6 Ebooks EPUB HD en anglais',
                        '6 Livres Audio MP3 en français',
                        '6 Livres Audio MP3 en anglais',
                        'Éveil bilingue naturel par immersion',
                        'Économisez 28,89€ sur le lot complet',
                        'Accès à vie sur tous vos appareils',
                      ]}
                      cta="🌍 Obtenir les 12 Livres (30.99€)"
                      ctaLink="/"
                    />

                    <PricingCard
                      title="Pack EN 6 Books"
                      icon="🇬🇧"
                      badge="English Only"
                      originalPrice="29.94"
                      salePrice="16.49"
                      discount="-45%"
                      features={[
                        '6 HD EPUB Ebooks in English',
                        '6 Studio MP3 Audiobooks',
                        'Full saga in British English',
                        'Instant download',
                      ]}
                      cta="English Pack — 16.49€"
                      ctaLink="/"
                    />
                  </>
                )}

                {activeOffer === 'en' && (
                  <>
                    <PricingCard
                      title="Single Book EN"
                      icon="📖"
                      badge="Book 1 Discovery"
                      salePrice="4.99"
                      features={[
                        'Leo and the Shadow Thief',
                        'HD illustrated EPUB Ebook',
                        'Studio MP3 Audiobook',
                        'Instant download',
                      ]}
                      cta="Get Book 1 EN"
                      ctaLink="/books/11"
                    />

                    <PricingCard
                      featured
                      title="Complete English Pack"
                      icon="🎁"
                      badge="6 Books — 45% OFF"
                      originalPrice="29.94"
                      salePrice="16.49"
                      discount="-45%"
                      features={[
                        'All 6 HD illustrated EPUB Ebooks',
                        'All 6 Studio MP3 Audiobooks',
                        'Complete saga in English',
                        'Save 13.45€ today',
                        'Lifetime access, all devices',
                      ]}
                      cta="🎁 Get the 6-Book Pack (16.49€)"
                      ctaLink="/"
                    />

                    <PricingCard
                      title="Bilingual Combo"
                      icon="🌍"
                      badge="FR + EN (12 Books)"
                      originalPrice="59.88"
                      salePrice="30.99"
                      discount="-48%"
                      features={[
                        '6 Books French + 6 Books English',
                        '12 Ebooks + 12 Audiobooks',
                        'Best value bundle',
                        'Instant access',
                      ]}
                      cta="Get 12 Books Combo"
                      ctaLink="/"
                    />
                  </>
                )}
              </div>

              {/* Réassurance & Paiements */}
              <div className="text-center pt-6 space-y-2">
                <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-400">🔒</span> Paiement Sécurisé SSL (Stripe, PayPal, CB)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-amber-400">⚡</span> Livraison Immédiate par E-mail
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-indigo-400">🛡️</span> Garantie 30 Jours Satisfait ou Remboursé
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* FAQ DEROULEMENT */}
          {/* ================================================== */}
          <section className="py-16 bg-slate-950/40 border-t border-slate-800/80 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-2xl sm:text-3xl font-black text-white text-center">
                Questions Fréquentes des Parents
              </h2>

              <div className="space-y-3">
                {[
                  {
                    q: 'Comment et quand vais-je recevoir les livres ?',
                    a: 'Instantanément ! Dès la validation de votre paiement, un e-mail automatique vous est envoyé avec les liens de téléchargement de vos Ebooks (EPUB) et Livres Audio (MP3). Aucune attente, aucun livre égaré par la poste.',
                  },
                  {
                    q: 'Sur quels appareils les livres sont-ils compatibles ?',
                    a: 'Sur 100% de vos appareils. Vous pouvez écouter les fichiers MP3 sur smartphone (iPhone, Android), tablette, ordinateur ou les diffuser sur enceinte connectée. Les fichiers EPUB s’ouvrent sur l’application Livres d’Apple, Kindle, Kobo ou toute liseuse.',
                  },
                  {
                    q: 'Comment fonctionne la garantie 30 jours Satisfait ou Remboursé ?',
                    a: 'C’est très simple : testez les histoires avec votre enfant ce soir. Si pour une raison quelconque vous ou votre enfant n’êtes pas totalement émerveillés, envoyez-nous un simple e-mail et nous vous remboursons intégralement.',
                  },
                  {
                    q: 'À quel âge ces contes conviennent-ils le mieux ?',
                    a: 'La collection est spécialement écrite et rythmée pour les enfants de 4 à 8 ans. Le vocabulaire est riche mais accessible, avec des métaphores poétiques et des créatures bienveillantes.',
                  },
                ].map((item, idx) => (
                  <details
                    key={idx}
                    className="group bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden transition-all"
                  >
                    <summary className="px-5 py-4 cursor-pointer font-bold text-sm text-white flex items-center justify-between hover:bg-slate-800/40">
                      {item.q}
                      <span className="text-amber-400 group-open:rotate-45 transition-transform text-xl ml-2">+</span>
                    </summary>
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/50 pt-3">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ================================================== */}
      {/* VUE 2 : HUB ANNONCEUR & MEDIA KIT PRO (SWIPE FILE) */}
      {/* ================================================== */}
      {currentMode === 'swipefile' && (
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
          {/* Header Annonceur */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              🛠️ SUITE STRATÉGIQUE META ADS MANAGER
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white">
              Kit Campagnes Meta Ads Bestseller
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Ce kit complet contient 5 angles publicitaires éprouvés, des scripts vidéo UGC 9:16 prêts pour TikTok/Reels,
              les simulations de Feed en direct et les boutons de copie instantanée pour vos campagnes Advantage+ et CBO.
            </p>
          </div>

          {/* SÉLECTEUR D'ANGLES MARKETING */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>🎯</span> Choisissez un Angle Marketing Éprouvé
              </h3>
              <span className="text-xs text-amber-400 font-bold">5 Angles Disponibles</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {marketingAngles.map((angle, idx) => (
                <button
                  key={angle.id}
                  onClick={() => setSelectedAngle(idx)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    selectedAngle === idx
                      ? 'bg-amber-400/10 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-300 block mb-1">
                      {angle.tag}
                    </span>
                    <p className="text-xs font-bold text-white line-clamp-2">{angle.name}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2">Cliquez pour inspecter →</span>
                </button>
              ))}
            </div>
          </div>

          {/* SIMULATEUR D'ANNONCE EN DIRECT + COPYWRITING */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Colonne Gauche : Aperçu Réaliste de l'Annonce Meta Feed */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-300">Simulateur Mobile Facebook / Instagram Feed</h4>
                <a
                  href={currentAngleData.creativeImage}
                  download
                  className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>⬇</span> Télécharger le Visuel HD
                </a>
              </div>

              {/* Cadre Mockup Facebook Feed */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                {/* Header Page FB */}
                <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-slate-950 font-black text-xs">
                      LÉO
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-white">Les Aventures de Léo</p>
                        <span className="w-3 h-3 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px]">
                          ✓
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        Sponsorisé • <span>🌍</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-500 text-sm">•••</span>
                </div>

                {/* Primary Text */}
                <div className="p-4 text-xs text-slate-200 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto scrollbar-thin">
                  {currentAngleData.primaryText}
                </div>

                {/* Image Créative */}
                <div className="relative aspect-square w-full bg-slate-950">
                  <img
                    src={currentAngleData.creativeImage}
                    alt="Creative Meta Ad"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Bottom Ad Bar */}
                <div className="p-4 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">LIVRE-LEO.VERCEL.APP</p>
                    <p className="text-xs font-black text-white line-clamp-1">{currentAngleData.headline}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{currentAngleData.description}</p>
                  </div>
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black flex-shrink-0">
                    {currentAngleData.cta}
                  </button>
                </div>
              </div>
            </div>

            {/* Colonne Droite : Textes Prêts à Copier & Paramètres */}
            <div className="lg:col-span-6 space-y-5">
              <h4 className="text-sm font-bold text-slate-300">Textes et Paramètres Publicitaires (Prêts à coller)</h4>

              {/* Primary Text */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-300 uppercase">Texte Principal (Primary Text)</span>
                  <button
                    onClick={() => copyToClipboard(currentAngleData.primaryText, 'primary')}
                    className="px-3 py-1 rounded-lg bg-amber-400/20 text-amber-300 text-[11px] font-bold hover:bg-amber-400/30"
                  >
                    {copiedId === 'primary' ? '✓ Copié !' : '📋 Copier le texte'}
                  </button>
                </div>
                <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl max-h-36 overflow-y-auto whitespace-pre-line font-mono text-[11px]">
                  {currentAngleData.primaryText}
                </div>
              </div>

              {/* Headline */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-300 uppercase">Titre (Headline)</span>
                  <button
                    onClick={() => copyToClipboard(currentAngleData.headline, 'headline')}
                    className="px-3 py-1 rounded-lg bg-amber-400/20 text-amber-300 text-[11px] font-bold hover:bg-amber-400/30"
                  >
                    {copiedId === 'headline' ? '✓ Copié !' : '📋 Copier'}
                  </button>
                </div>
                <p className="text-xs text-white font-mono bg-slate-950/60 p-2.5 rounded-xl">
                  {currentAngleData.headline}
                </p>
              </div>

              {/* Description */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-300 uppercase">Description</span>
                  <button
                    onClick={() => copyToClipboard(currentAngleData.description, 'desc')}
                    className="px-3 py-1 rounded-lg bg-amber-400/20 text-amber-300 text-[11px] font-bold hover:bg-amber-400/30"
                  >
                    {copiedId === 'desc' ? '✓ Copié !' : '📋 Copier'}
                  </button>
                </div>
                <p className="text-xs text-white font-mono bg-slate-950/60 p-2.5 rounded-xl">
                  {currentAngleData.description}
                </p>
              </div>

              {/* Ciblage Recommandé */}
              <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-4 space-y-1.5">
                <span className="text-xs font-bold text-indigo-300 uppercase">Ciblage Meta Recommandé</span>
                <p className="text-xs text-slate-300 leading-relaxed">{currentAngleData.targetAudience}</p>
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* SCRIPTS VIDÉOS UGC 9:16 (TikTok & Reels) */}
          {/* ================================================== */}
          <div className="space-y-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  🎬 SCRIPTS TOURNAGE UGC 9:16
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  3 Scripts Vidéo pour Instagram Reels & TikTok
                </h3>
              </div>

              <div className="flex gap-2">
                {videoScripts.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedScript(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedScript === idx
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Script {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Script Viewer */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h4 className="text-lg font-black text-white">{currentScriptData.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Durée : {currentScriptData.duration} • {currentScriptData.format}
                  </p>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      currentScriptData.scenes.map((s) => `${s.time}\nAction: ${s.action}\nTexte Écran: ${s.textOverlay}\nVoix: ${s.voice}`).join('\n\n'),
                      'script'
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300"
                >
                  {copiedId === 'script' ? '✓ Script Copié !' : '📋 Copier le Script Intégral'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentScriptData.scenes.map((sc, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono text-amber-400 font-bold">
                      <span>Scène {i + 1}</span>
                      <span>{sc.time}</span>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase">Visuel / Action :</p>
                      <p className="text-xs text-slate-200 mt-0.5">{sc.action}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-indigo-400 font-bold uppercase">Texte incrusté à l'écran :</p>
                      <p className="text-xs font-black text-indigo-200 mt-0.5 whitespace-pre-line">{sc.textOverlay}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-amber-400 font-bold uppercase">Voix Off / Paroles :</p>
                      <p className="text-xs italic text-slate-300 mt-0.5">{sc.voice}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* FOOTER */}
      {/* ================================================== */}
      <footer className="border-t border-slate-800 bg-[#050710] py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>Les Aventures de Léo © 2026 — Suite Campagnes Meta Ads Bestseller</p>
          <div className="flex justify-center gap-4">
            <Link href="/" className="hover:text-white">Accueil Boutique</Link>
            <span>•</span>
            <Link href="/pack" className="hover:text-white">Packs & Offres</Link>
            <span>•</span>
            <Link href="/admin/login" className="hover:text-white">Admin</Link>
          </div>
        </div>
      </footer>

      {/* ================================================== */}
      {/* CTA FLOTTANT STICKY MOBILE */}
      {/* ================================================== */}
      {currentMode === 'landing' && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-500 ${
            showFloatingCta ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}
        >
          <div className="bg-slate-950/98 backdrop-blur-xl border-t border-amber-400/30 p-3 shadow-2xl">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div>
                <p className="text-xs sm:text-sm font-black text-white">
                  Pack 6 Tomes FR — <span className="text-amber-400">16,49€</span> (-45%)
                </p>
                <p className="text-[10px] text-slate-400">6 Livres Audio + 6 Ebooks HD</p>
              </div>
              <a
                href="#pricing"
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/30"
              >
                Obtenir l'Offre →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* SOCIAL PROOF POP-UP */}
      {/* ================================================== */}
      <div
        className={`fixed bottom-16 left-4 z-40 transition-all duration-500 ${
          recentBuyer ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
      >
        {recentBuyer && (
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 shadow-2xl max-w-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs flex-shrink-0">
              ✓
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {recentBuyer.name} ({recentBuyer.city})
              </p>
              <p className="text-[10px] text-slate-400">
                a commandé <span className="text-amber-300 font-bold">{recentBuyer.pack}</span>
              </p>
              <p className="text-[9px] text-slate-500">{recentBuyer.time}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
