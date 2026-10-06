import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import PayPalButton from '../components/PayPalButton';

// ============================================================
// COMPOSANT : Compte à rebours (style doux)
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
    <div className="flex items-center gap-1.5 justify-center">
      {[
        { val: time.h, label: 'h' },
        { val: time.m, label: 'min' },
        { val: time.s, label: 'sec' },
      ].map((unit, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-0.5">
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.25)',
              borderRadius: '8px',
              padding: '2px 7px',
              fontWeight: 800,
              fontSize: '15px',
              color: '#4a3560',
              fontVariantNumeric: 'tabular-nums',
              minWidth: '32px',
            }}>
              {pad(unit.val)}
            </span>
            <span style={{ fontSize: '10px', color: '#6b5e80', fontWeight: 700 }}>{unit.label}</span>
          </div>
          {i < 2 && <span style={{ color: '#8b7ea0', fontWeight: 800, fontSize: '14px' }}>:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================
// COMPOSANT : Lecteur Audio (Adapté style chaleureux)
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
    <div style={{
      background: 'linear-gradient(135deg, #f3eef8 0%, #e8e0f0 50%, #f0eaf6 100%)',
      border: '1px solid #d8c8e8',
      borderRadius: '24px',
      padding: '24px 28px',
      boxShadow: '0 8px 32px rgba(120,90,160,0.08)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <audio
        ref={audioRef}
        src={tracks[activeTrack].src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Decoration */}
      <div style={{
        position: 'absolute',
        top: '-30px',
        right: '-30px',
        width: '120px',
        height: '120px',
        background: 'radial-gradient(circle, rgba(167,139,199,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={togglePlay}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #7c5caa 0%, #9b7cc8 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 900,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(124,92,170,0.3)',
              transition: 'transform 0.15s',
              flexShrink: 0,
            }}
            aria-label={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 10px',
              borderRadius: '20px',
              fontSize: '10px',
              fontWeight: 800,
              background: 'rgba(124,92,170,0.12)',
              color: '#7c5caa',
              border: '1px solid rgba(124,92,170,0.2)',
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isPlaying ? '#60c090' : '#a088c0',
              }} />
              {tracks[activeTrack].lang} • QUALITÉ STUDIO
            </div>
            <h4 style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 800, color: '#2d2444' }}>
              {tracks[activeTrack].title}
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#8b7ea0' }}>{tracks[activeTrack].sub}</p>
          </div>
        </div>

        {/* Track selection */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {tracks.map((t, i) => (
            <button
              key={i}
              onClick={() => selectTrack(i)}
              style={{
                padding: '6px 14px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700,
                border: activeTrack === i ? '2px solid #7c5caa' : '1px solid #ccc0d8',
                background: activeTrack === i ? '#7c5caa' : '#fff',
                color: activeTrack === i ? '#fff' : '#5a4878',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t.lang} Tome {i + 1}
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(140,120,170,0.15)' }}>
          <div
            onClick={handleSeek}
            style={{
              width: '100%',
              height: '8px',
              background: '#ddd0e8',
              borderRadius: '10px',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #7c5caa 0%, #a88dd0 100%)',
                borderRadius: '10px',
                transition: 'width 0.15s',
                width: `${progress}%`,
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#8b7ea0',
            fontFamily: 'monospace',
            marginTop: '6px',
          }}>
            <span>{currentTime}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {[6, 12, 18, 10, 16, 22, 14, 20, 8, 18, 14, 10].map((h, i) => (
                <span
                  key={i}
                  style={{
                    width: '3px',
                    borderRadius: '2px',
                    height: `${h}px`,
                    background: isPlaying ? '#7c5caa' : '#c8b8d8',
                    transition: 'background 0.3s',
                  }}
                />
              ))}
            </div>
            <span>{duration !== '0:00' ? duration : tracks[activeTrack].durationApprox}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPOSANT : Étoiles
// ============================================================
function AnimatedStars({ rating = 5, count = 250 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '2px', color: '#e8a838', fontSize: '16px' }}>
        {'★'.repeat(rating)}
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, color: '#c48820' }}>{rating}.0/5</span>
      <span style={{ fontSize: '11px', color: '#8b7ea0' }}>({count}+ avis vérifiés)</span>
    </div>
  );
}

// ============================================================
// COMPOSANT : Carte d'Offre (Pricing) avec PayPal intégré
// ============================================================
function PricingCard({ featured, title, badge, originalPrice, salePrice, discount, features, icon, bookId, isPack, isCombo }) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '24px',
        border: featured ? '2px solid #9b7cc8' : '1px solid #e0d4ee',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s',
        background: featured
          ? 'linear-gradient(180deg, #f5eeff 0%, #ffffff 60%, #f8f3ff 100%)'
          : '#ffffff',
        boxShadow: featured
          ? '0 12px 40px rgba(124,92,170,0.12), 0 0 0 1px rgba(155,124,200,0.2)'
          : '0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      {featured && (
        <div style={{
          position: 'absolute',
          top: '-14px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '5px 16px',
          background: 'linear-gradient(90deg, #7c5caa 0%, #9b7cc8 100%)',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 900,
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(124,92,170,0.3)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
        }}>
          ✨ Choix N°1 des Parents — {discount}
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '16px', paddingTop: featured ? '8px' : '0' }}>
        <span style={{ fontSize: '36px' }}>{icon}</span>
        <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#2d2444', margin: '8px 0 4px' }}>{title}</h3>
        {badge && (
          <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            background: featured ? 'rgba(124,92,170,0.1)' : 'rgba(100,140,200,0.1)',
            color: featured ? '#7c5caa' : '#5a80b0',
            border: featured ? '1px solid rgba(124,92,170,0.25)' : '1px solid rgba(100,140,200,0.25)',
          }}>
            {badge}
          </span>
        )}
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {originalPrice && (
          <span style={{ fontSize: '16px', color: '#a098b0', textDecoration: 'line-through', marginRight: '8px' }}>
            {originalPrice}€
          </span>
        )}
        <span style={{
          fontSize: '42px',
          fontWeight: 900,
          color: featured ? '#7c5caa' : '#2d2444',
        }}>
          {salePrice}€
        </span>
        <p style={{ fontSize: '12px', color: '#8b7ea0', marginTop: '4px' }}>
          Accès à vie • Téléchargement immédiat par email
        </p>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1 }}>
        {features.map((f, i) => (
          <li key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '13px',
            color: '#3d3458',
            marginBottom: '10px',
            lineHeight: 1.5,
          }}>
            <span style={{ color: '#60c090', fontWeight: 700, marginTop: '2px', flexShrink: 0 }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* Direct Payment — plus de redirection lente */}
      {(isPack || isCombo) ? (
        <PayPalButton
          book={{ id: isCombo ? 'combo' : 'pack', title: title, price: parseFloat(salePrice) }}
          isPack={!!isPack}
          isCombo={!!isCombo}
          className="w-full"
        />
      ) : (
        <PayPalButton
          book={{ id: bookId || 1, title: title, price: parseFloat(salePrice) }}
          className="w-full"
        />
      )}
    </div>
  );
}

// ============================================================
// PAGE PRINCIPALE : Landing Page Parents (couleurs douces)
// ============================================================
export default function FacebookAdsPage() {
  const router = useRouter();
  const isProMode = router.query.kit === 'pro';
  const [currentMode, setCurrentMode] = useState('landing');
  const [activeOffer, setActiveOffer] = useState('fr');
  const [selectedAngle, setSelectedAngle] = useState(0);
  const [selectedScript, setSelectedScript] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  const [recentBuyer, setRecentBuyer] = useState(null);

  // CTA flottant après défilement
  useEffect(() => {
    const handleScroll = () => setShowFloatingCta(window.scrollY > 550);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Déclencher l'événement standard ViewContent pour le Pixel Meta
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'ViewContent', {
        content_name: 'Pack 6 Tomes - Les Aventures de Léo',
        content_category: 'Contes Audio & Ebooks Enfants',
        content_ids: ['pack-6-tomes'],
        content_type: 'product',
        value: 16.49,
        currency: 'EUR',
      });
    }
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

  // ============================================================
  // STYLES PRINCIPAUX — palette douce parent-friendly
  // ============================================================
  const pageBg = '#faf7f5';
  const sectionAltBg = '#f3eef8';
  const textPrimary = '#2d2444';
  const textSecondary = '#5a4878';
  const textMuted = '#8b7ea0';
  const accentPurple = '#7c5caa';
  const accentSoft = '#9b7cc8';
  const accentWarm = '#e8a838';
  const successGreen = '#60c090';

  return (
    <div style={{
      minHeight: '100vh',
      background: pageBg,
      color: textPrimary,
      fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
      overflowX: 'hidden',
    }}>
      <Head>
        <title>Les Aventures de Léo — Coffret 6 Tomes pour des soirées sereines</title>
        <meta
          name="description"
          content="Offrez à votre enfant des soirées apaisées avec Les Aventures de Léo : 6 livres audio et ebooks illustrés. Pack à -45% avec téléchargement immédiat."
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
      {/* BARRE DE NAVIGATION ÉPURÉE PARENTS (SANS MODE ANNONCEUR) */}
      {/* ================================================== */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #e8ddf0',
        padding: '10px 16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span style={{ fontSize: '18px' }}>🌙</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: textPrimary, letterSpacing: '0.3px' }}>
              Les Aventures de Léo
            </span>
          </Link>

          {/* Mode Pro réservé à l'administrateur via ?kit=pro */}
          {isProMode ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f3eef8',
              border: '1px solid #e0d4ee',
              borderRadius: '14px',
              padding: '3px',
              gap: '3px',
            }}>
              <button
                onClick={() => setCurrentMode('landing')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '11px',
                  fontSize: '12px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: currentMode === 'landing' ? accentPurple : 'transparent',
                  color: currentMode === 'landing' ? '#fff' : textMuted,
                }}
              >
                🌟 Boutique
              </button>
              <button
                onClick={() => setCurrentMode('swipefile')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '11px',
                  fontSize: '12px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: currentMode === 'swipefile' ? accentPurple : 'transparent',
                  color: currentMode === 'swipefile' ? '#fff' : textMuted,
                }}
              >
                🛠️ Mode Pro (Admin)
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a href="#offres" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #7c5caa 0%, #9b7cc8 100%)',
                color: '#fff',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(124,92,170,0.25)',
                transition: 'transform 0.15s ease',
              }}>
                <span>Pack 6 Tomes · 16,49 €</span>
                <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 7px', borderRadius: '8px', fontSize: '11px', fontWeight: 900 }}>−45 %</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ================================================== */}
      {/* VUE 1 : LANDING PAGE CLIENT */}
      {/* ================================================== */}
      {currentMode === 'landing' && (
        <main>
          {/* Top Banner - doux */}
          <div style={{
            background: 'linear-gradient(90deg, #e8ddf0 0%, #f0e8f6 50%, #f5eeff 100%)',
            textAlign: 'center',
            padding: '10px 16px',
            fontSize: '12px',
            fontWeight: 800,
            color: textSecondary,
          }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>✨ Offre spéciale : -45% sur le coffret 6 Tomes · Expire dans :</span>
              <CountdownTimer hours={11} minutes={47} seconds={33} />
              <span style={{ color: accentPurple, fontWeight: 900 }}>• Livraison par e-mail (0€)</span>
            </div>
          </div>

          {/* HERO SECTION REDESIGN */}
          <section style={{
            position: 'relative',
            padding: '50px 20px 65px',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #FAF7F5 0%, #F5EEFF 60%, #EFE7F8 100%)',
          }}>
            {/* Glowing background orbs */}
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '420px',
              height: '420px',
              background: 'radial-gradient(circle, rgba(124,92,170,0.14) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '-40px',
              width: '380px',
              height: '380px',
              background: 'radial-gradient(circle, rgba(232,168,56,0.12) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }} />

            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '44px',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1,
            }}>
              {/* COLONNE GAUCHE : Pitch émotionnel, Réassurance & Offre */}
              <div>
                {/* Badge d'en-tête */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: 'rgba(124,92,170,0.1)',
                  border: '1px solid rgba(124,92,170,0.2)',
                  marginBottom: '16px',
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: accentPurple }}>
                    🌙 Rituel du Soir sans Écran · 4 à 8 ans
                  </span>
                </div>

                <h1 style={{
                  fontSize: 'clamp(28px, 4.2vw, 44px)',
                  fontWeight: 900,
                  color: textPrimary,
                  lineHeight: 1.15,
                  letterSpacing: '-0.5px',
                  marginBottom: '18px',
                }}>
                  Finies les crises d'écrans à 20h.{' '}
                  <span style={{
                    display: 'block',
                    background: 'linear-gradient(90deg, #7c5caa 0%, #a88dd0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Endormissement doux en 12 min.
                  </span>
                </h1>

                <p style={{
                  fontSize: 'clamp(14px, 1.8vw, 16px)',
                  color: textSecondary,
                  lineHeight: 1.65,
                  marginBottom: '22px',
                }}>
                  Offrez à votre enfant la saga complète des <strong>6 contes féeriques de Léo l’inventeur</strong> :{' '}
                  <strong style={{ color: accentPurple }}>6 Livres Audio MP3</strong> contés par des comédiens studio +{' '}
                  <strong style={{ color: accentPurple }}>6 Ebooks illustrés</strong> en aquarelle.
                </p>

                {/* 3 USPs douces */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '10px',
                  marginBottom: '24px',
                }}>
                  {[
                    { icon: '🌙', title: '0% Écran Passif', sub: 'Écoute calme au lit' },
                    { icon: '🎧', title: 'Voix Studio Douce', sub: 'Comédiens bienveillants' },
                    { icon: '⚡', title: 'Accès Immédiat', sub: 'Reçu par email en 10 sec' },
                  ].map((usp, i) => (
                    <div key={i} style={{
                      padding: '12px 14px',
                      borderRadius: '16px',
                      background: '#fff',
                      border: '1px solid #e8ddf0',
                      boxShadow: '0 2px 8px rgba(124,92,170,0.04)',
                    }}>
                      <span style={{ fontSize: '20px' }}>{usp.icon}</span>
                      <p style={{ fontSize: '12px', fontWeight: 800, color: textPrimary, marginTop: '4px' }}>{usp.title}</p>
                      <p style={{ fontSize: '11px', color: textMuted }}>{usp.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Bloc Prix & Bouton Action */}
                <div style={{
                  background: '#fff',
                  border: '1.5px solid #d8c8e8',
                  borderRadius: '20px',
                  padding: '18px 20px',
                  boxShadow: '0 8px 24px rgba(124,92,170,0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Offre Spéciale Coffret 6 Tomes
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '32px', fontWeight: 900, color: accentPurple }}>16,49 €</span>
                        <span style={{ fontSize: '18px', color: textMuted, textDecoration: 'line-through', fontWeight: 600 }}>29,94 €</span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 900,
                          background: 'rgba(96,192,144,0.15)',
                          color: '#28885a',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          border: '1px solid rgba(96,192,144,0.3)',
                        }}>
                          -45 % Économie 13,45 €
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: textMuted, marginTop: '2px' }}>
                        Soit seulement 2,75 € par livre & audio · Accès à vie sans abonnement
                      </div>
                    </div>
                  </div>

                  <a
                    href="#pricing"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '15px 24px',
                      borderRadius: '16px',
                      fontSize: '15px',
                      fontWeight: 900,
                      background: 'linear-gradient(135deg, #7c5caa 0%, #9b7cc8 100%)',
                      color: '#fff',
                      textDecoration: 'none',
                      boxShadow: '0 6px 20px rgba(124,92,170,0.35)',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <span>🌟 Obtenir le Coffret 6 Tomes (-45%)</span>
                    <span>→</span>
                  </a>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '12px', fontSize: '11px', color: textMuted }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#f59e0b' }}>★★★★★</span>
                      <strong style={{ color: textPrimary }}>4.9/5</strong>
                      <span>(+10 000 parents)</span>
                    </div>
                    <div>
                      <span style={{ color: successGreen, fontWeight: 800 }}>✓</span> Garantie 30j satisfait ou remboursé
                    </div>
                  </div>
                </div>
              </div>

              {/* COLONNE DROITE : Composition Visuelle Magique du Coffret */}
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '440px',
                  background: '#fff',
                  border: '1px solid #e0d4ee',
                  borderRadius: '28px',
                  padding: '24px 20px 20px',
                  boxShadow: '0 20px 48px rgba(124,92,170,0.12)',
                }}>
                  {/* Badge supérieur */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #7c5caa 0%, #9b7cc8 100%)',
                      color: '#fff',
                    }}>
                      🎁 Coffret Complet 6 Tomes
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 900,
                      background: '#fef3c7',
                      color: '#b45309',
                      border: '1px solid #fde68a',
                    }}>
                      -45 % OFFRE LIMITÉE
                    </span>
                  </div>

                  {/* Grande Couverture Tome 1 avec effet de livre */}
                  <div style={{
                    position: 'relative',
                    aspectRatio: '1/1',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 12px 32px rgba(45,36,68,0.2)',
                    marginBottom: '14px',
                    border: '1px solid #e8ddf0',
                  }}>
                    <img
                      src="/illustrations/leo-et-le-voleur-d-ombres/cover.png"
                      alt="Les Aventures de Léo - Coffret 6 Tomes"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      background: 'linear-gradient(to top, rgba(45,36,68,0.85) 0%, transparent 100%)',
                      padding: '20px 16px 12px',
                      color: '#fff',
                    }}>
                      <p style={{ fontSize: '11px', color: '#fde68a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Tome 1 à 6 Inclus
                      </p>
                      <p style={{ fontSize: '15px', fontWeight: 900, lineHeight: 1.2 }}>
                        Léo et la Fusée en Carton
                      </p>
                    </div>
                  </div>

                  {/* 6 Miniatures des tomes */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '14px' }}>
                    {[
                      { slug: 'leo-et-le-voleur-d-ombres', title: 'Tome 1' },
                      { slug: 'leo-et-le-voleur-d-etoiles', title: 'Tome 2' },
                      { slug: 'leo-et-le-voleur-de-couleurs', title: 'Tome 3' },
                      { slug: 'leo-et-le-voleur-de-reves', title: 'Tome 4' },
                      { slug: 'leo-et-le-voleur-de-nuages', title: 'Tome 5' },
                      { slug: 'leo-et-le-voleur-de-temps', title: 'Tome 6' },
                    ].map((b, idx) => (
                      <div key={idx} style={{
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #e0d4ee',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                      }}>
                        <img
                          src={`/illustrations/${b.slug}/cover.png`}
                          alt={b.title}
                          style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Encadré d'écoute rapide */}
                  <a
                    href="#demo-audio"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f5eeff',
                      border: '1px solid #d8c8e8',
                      borderRadius: '14px',
                      padding: '10px 14px',
                      textDecoration: 'none',
                      color: accentPurple,
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>🎧</span>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: textPrimary }}>
                          Extrait audio disponible
                        </div>
                        <div style={{ fontSize: '10px', color: textMuted }}>
                          Écoutez 1 minute de narration studio
                        </div>
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '10px',
                      background: accentPurple,
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 800,
                    }}>
                      Écouter ▶
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* LECTEUR AUDIO */}
          {/* ================================================== */}
          <section id="demo-audio" style={{ padding: '60px 20px', background: sectionAltBg }}>
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 800,
                  background: 'rgba(124,92,170,0.1)',
                  color: accentPurple,
                  border: '1px solid rgba(124,92,170,0.2)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '12px',
                }}>
                  🎧 Écoutez un extrait
                </span>
                <h2 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: textPrimary }}>
                  Découvrez la voix qui apaise les enfants
                </h2>
                <p style={{ fontSize: '13px', color: textMuted, maxWidth: '500px', margin: '8px auto 0' }}>
                  Cliquez sur lecture pour écouter un échantillon studio. Un récit chaleureux et captivant.
                </p>
              </div>

              <InteractiveAudioPlayer />
            </div>
          </section>

          {/* ================================================== */}
          {/* TABLEAU COMPARATIF : AVANT / APRÈS */}
          {/* ================================================== */}
          <section style={{ padding: '70px 20px', background: pageBg }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                <h2 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 900, color: textPrimary }}>
                  Pourquoi Léo change les soirées en famille
                </h2>
                <p style={{ fontSize: '14px', color: textMuted }}>Le comparatif qui parle aux parents</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Avant */}
                <div style={{
                  padding: '28px',
                  borderRadius: '24px',
                  background: 'linear-gradient(180deg, #fff5f5 0%, #fff 100%)',
                  border: '1px solid #f0d0d0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                    <span style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: '#ffe8e8',
                      color: '#cc6060',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 700,
                    }}>✕</span>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#aa4444' }}>La routine écrans</h3>
                      <p style={{ fontSize: '11px', color: '#cc8888' }}>YouTube, dessins animés, jeux</p>
                    </div>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {[
                      "Crises et pleurs quand on éteint l'écran.",
                      'Lumière bleue qui perturbe le sommeil.',
                      'Endormissement qui traîne pendant 45 minutes.',
                      'Passivité cérébrale et risques de cauchemars.',
                    ].map((t, i) => (
                      <li key={i} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        marginBottom: '12px',
                        fontSize: '13px',
                        color: '#774444',
                        lineHeight: 1.5,
                      }}>
                        <span style={{ color: '#cc6060', fontWeight: 700, flexShrink: 0 }}>✕</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Après */}
                <div style={{
                  padding: '28px',
                  borderRadius: '24px',
                  background: 'linear-gradient(180deg, #f0faf5 0%, #fff 100%)',
                  border: '1px solid #c0e8d0',
                  boxShadow: '0 4px 20px rgba(96,192,144,0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                    <span style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: '#e0f8e8',
                      color: '#50a878',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 700,
                    }}>✓</span>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#388860' }}>Avec Les Contes de Léo</h3>
                      <p style={{ fontSize: '11px', color: '#80b898' }}>Livres Audio & Ebooks illustrés</p>
                    </div>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {[
                      "L'enfant réclame lui-même le rituel dès 20h.",
                      '0% Écran : il écoute dans la pénombre.',
                      'Endormissement serein en 10 à 12 minutes.',
                      'Développe vocabulaire, courage et imagination.',
                    ].map((t, i) => (
                      <li key={i} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        marginBottom: '12px',
                        fontSize: '13px',
                        color: '#2d5540',
                        lineHeight: 1.5,
                      }}>
                        <span style={{ color: successGreen, fontWeight: 700, flexShrink: 0 }}>✓</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* APERÇU DES 6 TOMES */}
          {/* ================================================== */}
          <section style={{ padding: '70px 20px', background: sectionAltBg }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <span style={{ fontSize: '12px', fontWeight: 900, color: accentPurple, textTransform: 'uppercase', letterSpacing: '2px' }}>
                  📚 La saga complète
                </span>
                <h2 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 900, color: textPrimary, marginTop: '8px' }}>
                  6 Aventures, 6 Leçons de Vie Inoubliables
                </h2>
                <p style={{ fontSize: '14px', color: textMuted, maxWidth: '550px', margin: '8px auto 0' }}>
                  Chaque histoire aborde avec poésie une étape essentielle de l'enfance.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '16px',
              }}>
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
                    style={{
                      background: '#fff',
                      border: '1px solid #e0d4ee',
                      borderRadius: '16px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{
                      position: 'relative',
                      aspectRatio: '3/4',
                      width: '100%',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      marginBottom: '10px',
                    }}>
                      <img
                        src={`/illustrations/${b.slug}/cover.png`}
                        alt={b.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: accentPurple,
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {b.num}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: 800, color: textPrimary }}>{b.title}</p>
                    <p style={{ fontSize: '10px', color: accentSoft, marginTop: '2px' }}>{b.theme}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* SECTION OFFRES — CHECKOUT DIRECT INTÉGRÉ */}
          {/* ================================================== */}
          <div id="offres" />
          <section id="pricing" style={{
            padding: '80px 20px',
            background: 'linear-gradient(180deg, #faf7f5 0%, #f5eeff 50%, #faf7f5 100%)',
            position: 'relative',
          }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '5px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 800,
                  background: 'rgba(124,92,170,0.1)',
                  color: accentPurple,
                  border: '1px solid rgba(124,92,170,0.2)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '12px',
                }}>
                  🌟 Offres spéciales
                </span>
                <h2 style={{ fontSize: 'clamp(26px, 5vw, 42px)', fontWeight: 900, color: textPrimary }}>
                  Choisissez Votre Coffret
                </h2>
                <p style={{ fontSize: '14px', color: textMuted, maxWidth: '500px', margin: '8px auto 0' }}>
                  Paiement sécurisé par Carte Bancaire ou PayPal. Téléchargement immédiat par e-mail.
                </p>

                {/* Tabs */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                  <div style={{
                    display: 'flex',
                    background: '#fff',
                    padding: '5px',
                    borderRadius: '14px',
                    border: '1px solid #e0d4ee',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}>
                    {[
                      { key: 'fr', label: '🇫🇷 Pack FR (6 Tomes)' },
                      { key: 'combo', label: '🌍 Combo Bilingue (12)' },
                      { key: 'en', label: '🇬🇧 Pack EN (6 Books)' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveOffer(tab.key)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 800,
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: activeOffer === tab.key ? accentPurple : 'transparent',
                          color: activeOffer === tab.key ? '#fff' : textMuted,
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grille Tarifs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                alignItems: 'stretch',
              }}>
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
                      bookId={1}
                    />

                    <PricingCard
                      featured
                      title="Coffret 6 Tomes FR"
                      icon="🎁"
                      badge="Best-Seller (-45%)"
                      originalPrice="29.94"
                      salePrice="16.49"
                      discount="-45%"
                      features={[
                        'Les 6 Ebooks EPUB HD illustrés',
                        'Les 6 Livres Audio MP3 studio',
                        'La saga intégrale en français',
                        'Soit seulement 2,75€ par histoire',
                        'Accès illimité à vie sans abonnement',
                        'Compatible iPad, iPhone, Android, Kindle',
                        'Garantie 30 jours Satisfait ou Remboursé',
                      ]}
                      isPack
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
                        "Parfait pour initier à l'anglais dès 4 ans",
                        'Accès illimité à vie',
                      ]}
                      isCombo
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
                      isPack
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
                      isCombo
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
                      isPack
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
                      bookId={11}
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
                      isPack
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
                      isCombo
                    />
                  </>
                )}
              </div>

              {/* Réassurance */}
              <div style={{ textAlign: 'center', paddingTop: '28px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '20px', fontSize: '12px', color: textMuted }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: successGreen }}>🔒</span> Paiement Sécurisé SSL (Carte, PayPal)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: accentPurple }}>💌</span> Livraison Immédiate par E-mail
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#6090c0' }}>🛡️</span> Garantie 30 Jours Satisfait ou Remboursé
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* FAQ */}
          {/* ================================================== */}
          <section style={{ padding: '70px 20px', background: sectionAltBg }}>
            <div style={{ maxWidth: '650px', margin: '0 auto' }}>
              <h2 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: textPrimary, textAlign: 'center', marginBottom: '28px' }}>
                Questions Fréquentes des Parents
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  {
                    q: 'Comment et quand vais-je recevoir les livres ?',
                    a: 'Instantanément ! Dès la validation de votre paiement, un e-mail automatique vous est envoyé avec les liens de téléchargement de vos Ebooks (EPUB) et Livres Audio (MP3). Aucune attente, aucun livre égaré par la poste.',
                  },
                  {
                    q: 'Sur quels appareils les livres sont-ils compatibles ?',
                    a: "Sur 100% de vos appareils. Vous pouvez écouter les fichiers MP3 sur smartphone (iPhone, Android), tablette, ordinateur ou les diffuser sur enceinte connectée. Les fichiers EPUB s'ouvrent sur l'application Livres d'Apple, Kindle, Kobo ou toute liseuse.",
                  },
                  {
                    q: 'Comment fonctionne la garantie 30 jours ?',
                    a: "C'est très simple : testez les histoires avec votre enfant ce soir. Si pour une raison quelconque vous n'êtes pas totalement satisfait, envoyez-nous un simple e-mail et nous vous remboursons intégralement.",
                  },
                  {
                    q: 'À quel âge ces contes conviennent-ils le mieux ?',
                    a: 'La collection est spécialement écrite et rythmée pour les enfants de 4 à 8 ans. Le vocabulaire est riche mais accessible, avec des métaphores poétiques et des créatures bienveillantes.',
                  },
                ].map((item, idx) => (
                  <details
                    key={idx}
                    style={{
                      background: '#fff',
                      border: '1px solid #e0d4ee',
                      borderRadius: '16px',
                      overflow: 'hidden',
                    }}
                  >
                    <summary style={{
                      padding: '16px 20px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: textPrimary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      listStyle: 'none',
                    }}>
                      {item.q}
                      <span style={{ color: accentPurple, fontSize: '20px', marginLeft: '8px', fontWeight: 300 }}>+</span>
                    </summary>
                    <div style={{
                      padding: '0 20px 16px',
                      fontSize: '13px',
                      color: textSecondary,
                      lineHeight: 1.7,
                      borderTop: '1px solid #f0e8f6',
                      paddingTop: '12px',
                    }}>
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
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          {/* Header Annonceur */}
          <div style={{
            background: 'linear-gradient(135deg, #2d2444 0%, #3d3060 50%, #2d2444 100%)',
            border: '1px solid rgba(124,92,170,0.3)',
            borderRadius: '24px',
            padding: '28px 32px',
            marginBottom: '36px',
          }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 800,
              background: 'rgba(124,92,170,0.25)',
              color: '#c0a8e0',
              border: '1px solid rgba(124,92,170,0.3)',
            }}>
              🛠️ SUITE STRATÉGIQUE META ADS
            </span>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 900, color: '#fff', marginTop: '12px' }}>
              Kit Campagnes Meta Ads Bestseller
            </h1>
            <p style={{ fontSize: '14px', color: '#b0a0c8', maxWidth: '700px', lineHeight: 1.7, marginTop: '8px' }}>
              Ce kit complet contient 5 angles publicitaires éprouvés, des scripts vidéo UGC 9:16 prêts pour TikTok/Reels, les simulations Feed et les boutons de copie instantanée.
            </p>
          </div>

          {/* SÉLECTEUR D'ANGLES MARKETING */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: textPrimary }}>
                🎯 Choisissez un Angle Marketing Éprouvé
              </h3>
              <span style={{ fontSize: '12px', color: accentPurple, fontWeight: 700 }}>5 Angles Disponibles</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {marketingAngles.map((angle, idx) => (
                <button
                  key={angle.id}
                  onClick={() => setSelectedAngle(idx)}
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    border: selectedAngle === idx ? `2px solid ${accentPurple}` : '1px solid #e0d4ee',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: selectedAngle === idx ? 'rgba(124,92,170,0.06)' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: accentPurple, display: 'block', marginBottom: '4px' }}>
                      {angle.tag}
                    </span>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: textPrimary }}>{angle.name}</p>
                  </div>
                  <span style={{ fontSize: '10px', color: textMuted, marginTop: '8px' }}>Cliquez pour inspecter →</span>
                </button>
              ))}
            </div>
          </div>

          {/* SIMULATEUR D'ANNONCE EN DIRECT + COPYWRITING */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}
            className="lg-grid-swipe"
          >
            {/* Aperçu Annonce */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: textSecondary }}>Simulateur Feed Facebook</h4>
                <a
                  href={currentAngleData.creativeImage}
                  download
                  style={{ fontSize: '12px', fontWeight: 700, color: accentPurple, textDecoration: 'none' }}
                >
                  ⬇ Télécharger le Visuel HD
                </a>
              </div>

              <div style={{
                background: '#fff',
                border: '1px solid #e0d4ee',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
              }}>
                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0e8f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${accentPurple} 0%, #6090c0 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: '11px',
                    }}>
                      LÉO
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 800, color: textPrimary }}>Les Aventures de Léo</p>
                        <span style={{
                          width: '14px', height: '14px', borderRadius: '50%',
                          background: '#4090d0', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '8px',
                        }}>✓</span>
                      </div>
                      <p style={{ fontSize: '10px', color: textMuted }}>Sponsorisé • 🌍</p>
                    </div>
                  </div>
                  <span style={{ color: textMuted, fontSize: '14px' }}>•••</span>
                </div>

                <div style={{
                  padding: '16px',
                  fontSize: '12px',
                  color: textSecondary,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-line',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {currentAngleData.primaryText}
                </div>

                <div style={{ position: 'relative', aspectRatio: '1/1', width: '100%', background: '#f8f4fc' }}>
                  <img
                    src={currentAngleData.creativeImage}
                    alt="Creative Meta Ad"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{
                  padding: '16px',
                  background: '#faf7f5',
                  borderTop: '1px solid #f0e8f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}>
                  <div>
                    <p style={{ fontSize: '10px', color: textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>LIVRE-LEO.VERCEL.APP</p>
                    <p style={{ fontSize: '13px', fontWeight: 800, color: textPrimary }}>{currentAngleData.headline}</p>
                    <p style={{ fontSize: '10px', color: textMuted }}>{currentAngleData.description}</p>
                  </div>
                  <button style={{
                    padding: '8px 16px',
                    background: '#f0e8f6',
                    border: '1px solid #e0d4ee',
                    color: textPrimary,
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 800,
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}>
                    {currentAngleData.cta}
                  </button>
                </div>
              </div>
            </div>

            {/* Textes Prêts à Copier */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: textSecondary }}>Textes Publicitaires (Prêts à coller)</h4>

              {[
                { label: 'Texte Principal (Primary Text)', id: 'primary', content: currentAngleData.primaryText, isLong: true },
                { label: 'Titre (Headline)', id: 'headline', content: currentAngleData.headline },
                { label: 'Description', id: 'desc', content: currentAngleData.description },
              ].map(({ label, id, content, isLong }) => (
                <div key={id} style={{
                  background: '#fff',
                  border: '1px solid #e0d4ee',
                  borderRadius: '16px',
                  padding: '16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: accentPurple, textTransform: 'uppercase' }}>{label}</span>
                    <button
                      onClick={() => copyToClipboard(content, id)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        background: 'rgba(124,92,170,0.1)',
                        color: accentPurple,
                        fontSize: '11px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {copiedId === id ? '✓ Copié !' : '📋 Copier'}
                    </button>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: textSecondary,
                    background: '#faf7f5',
                    padding: '12px',
                    borderRadius: '10px',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-line',
                    maxHeight: isLong ? '120px' : 'none',
                    overflowY: isLong ? 'auto' : 'visible',
                  }}>
                    {content}
                  </div>
                </div>
              ))}

              {/* Ciblage */}
              <div style={{
                background: '#f5eeff',
                border: '1px solid #e0d4ee',
                borderRadius: '16px',
                padding: '16px',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: accentPurple, textTransform: 'uppercase' }}>Ciblage Meta Recommandé</span>
                <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.7, marginTop: '6px' }}>{currentAngleData.targetAudience}</p>
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* SCRIPTS VIDÉOS UGC 9:16 */}
          {/* ================================================== */}
          <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #e0d4ee' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 900, color: accentPurple, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  🎬 Scripts UGC 9:16
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: textPrimary, marginTop: '4px' }}>
                  3 Scripts Vidéo pour Reels & TikTok
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {videoScripts.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedScript(idx)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: selectedScript === idx ? `2px solid ${accentPurple}` : '1px solid #e0d4ee',
                      background: selectedScript === idx ? accentPurple : '#fff',
                      color: selectedScript === idx ? '#fff' : textMuted,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Script {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              background: '#fff',
              border: '1px solid #e0d4ee',
              borderRadius: '24px',
              padding: '28px',
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', borderBottom: '1px solid #f0e8f6', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: textPrimary }}>{currentScriptData.title}</h4>
                  <p style={{ fontSize: '12px', color: textMuted, marginTop: '4px' }}>
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
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    background: accentPurple,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {copiedId === 'script' ? '✓ Script Copié !' : '📋 Copier le Script'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {currentScriptData.scenes.map((sc, i) => (
                  <div key={i} style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: '#faf7f5',
                    border: '1px solid #f0e8f6',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontFamily: 'monospace', color: accentPurple, fontWeight: 700, marginBottom: '10px' }}>
                      <span>Scène {i + 1}</span>
                      <span>{sc.time}</span>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <p style={{ fontSize: '10px', color: textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Visuel / Action :</p>
                      <p style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>{sc.action}</p>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <p style={{ fontSize: '10px', color: '#6090c0', fontWeight: 700, textTransform: 'uppercase' }}>Texte incrusté :</p>
                      <p style={{ fontSize: '12px', fontWeight: 800, color: '#4070a0', marginTop: '2px', whiteSpace: 'pre-line' }}>{sc.textOverlay}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: accentPurple, fontWeight: 700, textTransform: 'uppercase' }}>Voix Off :</p>
                      <p style={{ fontSize: '12px', fontStyle: 'italic', color: textSecondary, marginTop: '2px' }}>{sc.voice}</p>
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
      <footer style={{
        borderTop: '1px solid #e0d4ee',
        background: '#f5eeff',
        padding: '32px 20px',
        textAlign: 'center',
        fontSize: '12px',
        color: textMuted,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p>Les Aventures de Léo © 2026 — Contes féeriques pour des soirées sereines</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
            <Link href="/" style={{ color: textMuted, textDecoration: 'none' }}>Accueil</Link>
            <span>•</span>
            <Link href="/pack" style={{ color: textMuted, textDecoration: 'none' }}>Packs & Offres</Link>
            <span>•</span>
            <Link href="/admin/login" style={{ color: textMuted, textDecoration: 'none' }}>Admin</Link>
          </div>
        </div>
      </footer>

      {/* ================================================== */}
      {/* CTA FLOTTANT STICKY */}
      {/* ================================================== */}
      {currentMode === 'landing' && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            transition: 'all 0.5s',
            transform: showFloatingCta ? 'translateY(0)' : 'translateY(100%)',
            opacity: showFloatingCta ? 1 : 0,
          }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid #e0d4ee',
            padding: '12px 16px',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 900, color: textPrimary }}>
                  Pack 6 Tomes — <span style={{ color: accentPurple }}>16,49€</span> (-45%)
                </p>
                <p style={{ fontSize: '11px', color: textMuted }}>6 Livres Audio + 6 Ebooks HD</p>
              </div>
              <a
                href="#pricing"
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 900,
                  background: `linear-gradient(135deg, ${accentPurple} 0%, ${accentSoft} 100%)`,
                  color: '#fff',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(124,92,170,0.3)',
                  whiteSpace: 'nowrap',
                }}
              >
                Commander →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* SOCIAL PROOF POP-UP */}
      {/* ================================================== */}
      <div
        style={{
          position: 'fixed',
          bottom: showFloatingCta ? '72px' : '16px',
          left: '16px',
          zIndex: 40,
          transition: 'all 0.5s',
          transform: recentBuyer ? 'translateX(0)' : 'translateX(calc(-100% - 20px))',
          opacity: recentBuyer ? 1 : 0,
        }}
      >
        {recentBuyer && (
          <div style={{
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #e0d4ee',
            borderRadius: '16px',
            padding: '12px 16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            maxWidth: '300px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: successGreen,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '12px',
              flexShrink: 0,
            }}>
              ✓
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: textPrimary }}>
                {recentBuyer.name} ({recentBuyer.city})
              </p>
              <p style={{ fontSize: '10px', color: textMuted }}>
                a commandé <span style={{ color: accentPurple, fontWeight: 700 }}>{recentBuyer.pack}</span>
              </p>
              <p style={{ fontSize: '9px', color: '#b0a0c0' }}>{recentBuyer.time}</p>
            </div>
          </div>
        )}
      </div>

      {/* CSS responsive overrides */}
      <style jsx global>{`
        @media (min-width: 1024px) {
          .lg-grid-hero {
            grid-template-columns: 1fr 1fr !important;
          }
          .lg-grid-swipe {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        details > summary::-webkit-details-marker {
          display: none;
        }
        details > summary::marker {
          display: none;
          content: '';
        }
      `}</style>
    </div>
  );
}
