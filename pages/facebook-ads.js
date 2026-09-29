import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function FacebookAdsPage() {
  const [selectedAdIndex, setSelectedAdIndex] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState('mobile'); // 'mobile' | 'tablet' | 'desktop'
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'video' | 'packs' | 'combo' | 'tomes'
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const ads = [
    {
      id: 'video-promo',
      category: 'video',
      type: 'video',
      title: '🎥 Vidéo Animée MP4 : Spot Télévisuel 12s',
      badge: '🎬 Vidéo Verticale 9:16 (Stories, Reels & TikTok)',
      angle: 'Spot Publicitaire Vidéo 9:16 Vertical HD (Format Instagram Reels & Facebook Stories)',
      image: '/ads/fb_ad_tome1_shadows.png?v=10',
      videoUrl: '/ads/fb_ad_video_promo_9_16.mp4?v=2',
      primaryText: `✨ Offrez à votre enfant une aventure extraordinaire en français et en anglais qu'il n'oubliera jamais ! 📚🎬\n\nDécouvrez "Les Aventures de Léo", la saga féerique préférée des enfants de 6 à 10 ans. 6 tomes remplis de créatures magiques, de mystères et de courage.\n\n🎁 PACK INTÉGRAL EN PROMOTION : Ebooks EPUB HD + Livres Audio MP3 avec comédiens voix studio en accès instantané !\n\n✔️ Histoires captivantes et apaisantes pour la routine du soir\n✔️ 0% Écran passif • 100% Imagination\n✔️ Téléchargement immédiat par e-mail après commande\n\n👉 Regardez la vidéo et débloquez la collection complète dès ce soir !`,
      headline: '🎥 Les Aventures de Léo - La Saga Féerique Numérique (Ebooks & Audio)',
      description: '★★★★★ (+10 000 lecteurs) • Téléchargement Immédiat',
      cta: 'Télécharger le Pack',
      targetAudience: 'Parents d\'enfants de 4-10 ans sur Facebook & Instagram (Reels & Feed Video)'
    },
    {
      id: 'pack-fr',
      category: 'packs',
      type: 'image',
      title: 'Pack FR : Coffret Intégral 6 Tomes',
      badge: '🇫🇷 Pack FR 6 Tomes',
      angle: 'Offre Spéciale Coffret 6 Livres (Français)',
      image: '/ads/fb_ad_pack_collection.png?v=10',
      primaryText: `✨ Offrez à votre enfant une aventure extraordinaire en français qu'il n'oubliera jamais ! 📚\n\nDécouvrez "Les Aventures de Léo", la saga magique qui passionne les enfants de 6 à 10 ans. 6 tomes pleins de mystères, de créatures féeriques et de courage.\n\n🎁 PACK INTÉGRAL FR (6 TOMES) : Ebooks EPUB HD + Livres Audio MP3 avec voix studio en téléchargement instantané !\n\n✔️ 6 Histoires palpitantes adaptées aux jeunes lecteurs\n✔️ 6 Livres audio apaisants pour s'endormir calmement\n✔️ Accès immédiat par e-mail après commande (0 frais de livraison)\n\n👉 Téléchargez la saga française complète dès ce soir !`,
      headline: 'Pack Intégral 6 Tomes FR - Les Aventures de Léo (100% Digital)',
      description: '6 Livres Audio MP3 + 6 Ebooks EPUB HD • Téléchargement Immédiat',
      cta: 'Télécharger le Pack FR',
      targetAudience: 'Parents francophones d\'enfants de 4-10 ans (France, Belgique, Suisse, Canada)'
    },
    {
      id: 'pack-en',
      category: 'packs',
      type: 'image',
      title: 'Pack EN : Full 6-Book Collection',
      badge: '🇬🇧 Pack EN 6 Books',
      angle: 'English Saga Collection (Kids 6-10)',
      image: '/ads/fb_ad_pack_en.png?v=10',
      primaryText: `✨ Give your child a magical reading adventure they will cherish forever! 📚\n\nDiscover "Leo's Adventures", the spellbinding 6-book saga for kids aged 6 to 10. 6 volumes packed with mysteries, magical creatures, and bravery.\n\n🎁 FULL ENGLISH PACK (6 BOOKS): High-Definition EPUB Ebooks + MP3 Studio Audiobooks for instant download!\n\n✔️ 6 Thrilling stories perfect for young readers and English learners\n✔️ 6 Soothing audiobooks for peaceful bedtime listening\n✔️ Instant email access right after purchase (No shipping delays)\n\n👉 Download the full 6-book English collection tonight!`,
      headline: 'Full 6-Book English Collection - Leo\'s Adventures (100% Digital)',
      description: '6 MP3 Audiobooks + 6 HD EPUB Ebooks • Instant Download',
      cta: 'Download English Pack',
      targetAudience: 'English-speaking parents, bilingual families, kids learning English'
    },
    {
      id: 'combo-bilingual',
      category: 'combo',
      type: 'image',
      title: 'Combo FR+EN : 12 Livres Bilingue',
      badge: '🌍 Mega Combo FR+EN (12 Livres)',
      angle: 'Offre Ultime Bilingue (Économisez 48%)',
      image: '/ads/fb_ad_combo_bilingual.png?v=10',
      primaryText: `🌍 OFFRE ULTIME BILINGUE : 12 LIVRES (6 FRANÇAIS + 6 ANGLAIS) ! 📚🎧\n\nOffrez à votre enfant la saga complète "Les Aventures de Léo" en version française ET en version anglaise ! Le moyen le plus amusant et immersif d'éveiller votre enfant à l'anglais dès le plus jeune âge.\n\n🎁 PACK COMBO BILINGUE (12 LIVRES) :\n• 6 Ebooks EPUB FR + 6 Ebooks EPUB EN HD\n• 6 Livres Audio MP3 FR + 6 Livres Audio MP3 EN (Comédiens voix studio)\n\n⚡️ Réduction exceptionnelle de 48% • Téléchargement immédiat des 12 livres !\n\n👉 Cliquez ci-dessous pour débloquer la bibliothèque bilingue complète dès ce soir !`,
      headline: 'Pack Combo Bilingue FR + EN — 12 Livres (Ebooks + Audio MP3)',
      description: '12 Ebooks EPUB + 12 Livres Audio MP3 • Économisez 48% • Téléchargement Immédiat',
      cta: 'Télécharger le Combo 12 Livres',
      targetAudience: 'Parents souhaitant éveiller leurs enfants à l\'anglais, familles bilingues'
    },
    {
      id: 'tome1-shadows',
      category: 'tomes',
      type: 'image',
      title: 'Tome 1 FR/EN : Focus Best-Seller',
      badge: 'Best-Seller ★★★★★',
      angle: 'Découverte du Tome 1 (Léo et le Voleur d\'Ombres)',
      image: '/ads/fb_ad_tome1_shadows.png?v=10',
      primaryText: `🌙 Que se passe-t-il quand le voleur d'ombres s'empare de la nuit ?\n\nRejoignez Léo, un petit garçon courageux armé d'une lanterne magique, dans une quête fascinante pour apprivoiser la nuit et ses mystères.\n\n⭐ Plus de 10 000 petits lecteurs conquis !\n⭐ Élu "Livre du Soir Préféré" par les familles\n\n"Mon fils adorait écouter l'histoire dans sa chambre avant de s'endormir. Le format audio est magique !" - Sophie M.\n\n📖 Commencez l'aventure dès ce soir avec le Tome 1 (Disponible en Français et en Anglais).`,
      headline: 'Léo et le Voleur d\'Ombres - Tome 1 (Ebook HD & Audio MP3)',
      description: '★★★★★ (4.9/5 sur +250 avis parents) • Téléchargement Immédiat',
      cta: 'Obtenir le Tome 1',
      targetAudience: 'Parents cherchant des livres captivants numériques pour donner le goût de lire'
    },
    {
      id: 'bedtime-routine',
      category: 'tomes',
      type: 'image',
      title: 'Routine du Soir & Alternative Écrans',
      badge: 'Routine du Soir & Alternative Écrans',
      angle: 'Émotion & Éducation',
      image: '/ads/fb_ad_bedtime_routine.png?v=10',
      primaryText: `📱 Marre des écrans passifs avant de dormir ?\n\nTransformez le moment du coucher en un rituel magique et apaisant. "Les Aventures de Léo" plongent votre enfant dans un univers poétique où l'imagination prend le dessus.\n\n✨ 0% Écran passif avant de dormir\n✨ 100% Écoute et lecture apaisante\n✨ Livres Audio MP3 + Ebooks EPUB HD en accès instantané\n\nOffrez-lui de doux rêves et le plaisir d'aimer lire dès ce soir ! 🌟`,
      headline: 'Éloignez les écrans : Offrez-lui le goût de lire et d\'écouter !',
      description: 'Histoires du soir féeriques 100% numériques pour enfants de 6 à 10 ans',
      cta: 'Obtenir la collection',
      targetAudience: 'Parents intéressés par l\'éducation positive, Montessori, alternatives aux écrans'
    },
    {
      id: 'audiobook-ebook',
      category: 'packs',
      type: 'image',
      title: 'Pack Duo : Ebook HD + Livre Audio MP3',
      badge: 'Duo Format Immersion',
      angle: 'Flexibilité & Écoute Nomade',
      image: '/ads/fb_ad_audiobook_ebook.png?v=10',
      primaryText: `🎧 À lire sur écran ou à écouter en audio les yeux fermés ! 📚✨\n\nOffrez à votre enfant le meilleur des deux mondes : des Ebooks magnifiquement illustrés pour tablette ou liseuse, ET des Livres Audio MP3 avec voix de studio immersives pour la voiture et le rituel du soir.\n\n🎁 PACK DUO NUMÉRIQUE :\n• Ebooks EPUB HD plein écran pour iPad, Kindle & Kobo\n• Livres Audio MP3 immersifs pour s'endormir calmement\n• Accès instantané à vie sans frais de livraison\n\n👉 Téléchargez le pack duo immédiatement !`,
      headline: 'Duo Format : Ebook Illustré HD + Livre Audio MP3',
      description: 'Lisible sur tout écran + Écoute audio apaisante • Téléchargement Immédiat',
      cta: 'Télécharger le Pack Duo',
      targetAudience: 'Parents nomades, voyages en voiture, rituel d\'histoire du soir'
    }
  ];

  const filteredAds = activeTab === 'all' 
    ? ads 
    : ads.filter(ad => ad.category === activeTab);

  const activeAd = ads[selectedAdIndex] || ads[0];

  const handleCopyText = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(selectedAdIndex);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedIndex(null);
      setCopiedField(null);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#0A0D18] text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950">
      <Head>
        <title>Kit Publicitaire Catalogues Meta Ads - Les Aventures de Léo</title>
        <meta name="description" content="Catalogue d'affiches HD et Vidéos MP3/MP4 Meta Ads pour Packs FR, Packs EN, Combo Bilingue FR+EN." />
      </Head>

      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-[#0F1424]/90 backdrop-blur-md sticky top-0 z-50 px-4 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-amber-500 to-indigo-600 flex items-center justify-center text-slate-950 text-xl font-black shadow-lg shadow-amber-500/20">
              🚀
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Kit Publicitaire Meta Ads (Affiches HD & Vidéo MP4)</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30 rounded-full uppercase">
                  Format Carré 1080x1080
                </span>
              </div>
              <p className="text-xs text-slate-400">Vidéos MP4 • Affiches HD • Tomes 1 à 6 FR/EN • Pack FR • Pack EN • Combo Bilingue</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition shadow-sm">
              ← Retour au site
            </Link>
            <a 
              href={activeAd.type === 'video' ? activeAd.videoUrl : activeAd.image} 
              download={activeAd.type === 'video' ? `facebook_ad_video.mp4` : `facebook_ad_${activeAd.id}.png`}
              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 transform active:scale-95"
            >
              <span>📥</span> {activeAd.type === 'video' ? 'Télécharger la Vidéo MP4 HD' : 'Télécharger cette Affiche HD'}
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        {/* Hero Section Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-[#0F1424] p-6 md:p-10 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Nouveau : Spot Vidéo MP4 & Affiches HD Full-Bleed
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Kit Publicitaire Complet (Vidéos Animées & Visuels HD)
            </h2>
            
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Téléchargez votre <strong className="text-amber-300">Spot Vidéo MP4 animé (12s)</strong> et vos affiches HD prêtes à l'emploi. Idéal pour captiver les parents sur Facebook Feed, Instagram Reels & Stories.
            </p>

            {/* Catalog Structure Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <p className="text-[11px] font-bold text-amber-400">🎥 Spot Vidéo MP4</p>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">Vidéo Animée 1080x1080</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <p className="text-[11px] font-bold text-indigo-400">🇫🇷 Pack FR</p>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">6 Tomes (Ebook + Audio)</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <p className="text-[11px] font-bold text-emerald-400">🌍 Combo Bilingue</p>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">12 Livres FR + EN (-48%)</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <p className="text-[11px] font-bold text-violet-300">🇬🇧 Pack EN</p>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">6 Books (EPUB + Audio)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Catalog Filter Tabs & Ad Switcher */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🖼️</span> Sélectionnez un format publicitaire :
            </h3>

            {/* Category Filter Tabs */}
            <div className="flex bg-[#0F1424] p-1.5 rounded-2xl border border-slate-800 text-xs font-bold flex-wrap gap-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl transition ${activeTab === 'all' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Tous les Formats ({ads.length})
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`px-4 py-2 rounded-xl transition ${activeTab === 'video' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                🎥 Vidéo Animée MP4
              </button>
              <button
                onClick={() => setActiveTab('packs')}
                className={`px-4 py-2 rounded-xl transition ${activeTab === 'packs' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Packs FR & EN
              </button>
              <button
                onClick={() => setActiveTab('combo')}
                className={`px-4 py-2 rounded-xl transition ${activeTab === 'combo' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Combo Bilingue FR+EN
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {filteredAds.map((ad) => {
              const originalIndex = ads.findIndex(a => a.id === ad.id);
              const isSelected = selectedAdIndex === originalIndex;
              return (
                <button
                  key={ad.id}
                  onClick={() => setSelectedAdIndex(originalIndex)}
                  className={`text-left p-4 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                    isSelected
                      ? 'bg-slate-900/90 border-amber-400/80 ring-2 ring-amber-400/25 shadow-xl shadow-amber-500/10 scale-[1.02]'
                      : 'bg-[#0F1424]/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-3 border border-slate-800 bg-slate-950 relative">
                    {ad.type === 'video' ? (
                      <div className="relative w-full h-full bg-indigo-950 flex items-center justify-center">
                        <img src={ad.image} alt={ad.title} className="w-full h-full object-cover opacity-60" />
                        <div className="absolute w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-bold shadow-lg shadow-amber-400/40">
                          ▶
                        </div>
                      </div>
                    ) : (
                      <img src={ad.image} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black shadow">
                        SÉLECTIONNÉ
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 inline-block mb-1.5">
                    {ad.badge}
                  </span>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{ad.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{ad.angle}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Live Facebook Ad Feed Simulator & Ad Copy Hub */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Simulator Column (Left) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex justify-between items-center bg-[#0F1424] p-3 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📱</span> Aperçu Réaliste Feed Facebook / Instagram
              </h3>
              
              {/* Device Selector */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setSelectedDevice('mobile')}
                  className={`px-3 py-1 rounded-lg transition ${selectedDevice === 'mobile' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Mobile
                </button>
                <button
                  onClick={() => setSelectedDevice('tablet')}
                  className={`px-3 py-1 rounded-lg transition ${selectedDevice === 'tablet' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Tablette
                </button>
                <button
                  onClick={() => setSelectedDevice('desktop')}
                  className={`px-3 py-1 rounded-lg transition ${selectedDevice === 'desktop' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Desktop
                </button>
              </div>
            </div>

            {/* Realistic Facebook Post Card */}
            <div className={`mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
              selectedDevice === 'mobile' ? 'max-w-md' : selectedDevice === 'tablet' ? 'max-w-lg' : 'w-full'
            }`}>
              {/* Sponsor Header */}
              <div className="p-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-indigo-600 flex items-center justify-center font-black text-slate-950 text-xs shadow-md">
                    LÉO
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white">Les Aventures de Léo</span>
                      <span className="text-blue-400 text-xs font-bold">✓</span>
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <span>Sponsorisé • {activeAd.badge}</span> • <span>🌐</span>
                    </p>
                  </div>
                </div>
                <span className="text-slate-500 cursor-pointer font-bold">•••</span>
              </div>

              {/* Primary Text Content */}
              <div className="px-4 py-3.5 text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed border-b border-slate-800/50 bg-slate-950/40 font-sans">
                {activeAd.primaryText}
              </div>

              {/* Visual Ad Banner (Image or Video) */}
              <div className="relative aspect-square bg-slate-950 border-y border-slate-800">
                {activeAd.type === 'video' ? (
                  <video 
                    src={activeAd.videoUrl} 
                    controls 
                    autoPlay 
                    loop 
                    muted 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <img src={activeAd.image} alt={activeAd.title} className="w-full h-full object-cover" />
                )}
              </div>

              {/* Call-to-Action Link Bar */}
              <div className="p-4 bg-slate-950 flex items-center justify-between gap-3 border-b border-slate-800/60">
                <div className="space-y-0.5 overflow-hidden">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold truncate">
                    LIVRESLEO.APP • TÉLÉCHARGEMENT IMMÉDIAT
                  </p>
                  <h5 className="font-bold text-sm text-white truncate">{activeAd.headline}</h5>
                  <p className="text-xs text-slate-400 truncate">{activeAd.description}</p>
                </div>
                <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs whitespace-nowrap shadow-lg shadow-indigo-600/30 transition">
                  {activeAd.cta}
                </button>
              </div>

              {/* Social Reaction Bar */}
              <div className="px-4 py-2.5 bg-slate-900 flex justify-around items-center text-xs text-slate-400 font-semibold border-t border-slate-800/40">
                <button className="flex items-center gap-1.5 hover:text-amber-400 transition">
                  👍 <span>J'aime (782)</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-amber-400 transition">
                  💬 <span>Commenter (142)</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-amber-400 transition">
                  ↗️ <span>Partager</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ad Copy Inspector & Copy Tools (Right) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#0F1424] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
              
              {/* Header Box */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    Format : {activeAd.type === 'video' ? '🎥 Vidéo MP4 (1080x1080)' : '🖼️ Image HD'} • {activeAd.badge}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{activeAd.title}</h3>
                </div>
                <a
                  href={activeAd.type === 'video' ? activeAd.videoUrl : activeAd.image}
                  download={activeAd.type === 'video' ? 'facebook_ad_video.mp4' : `facebook_ad_${activeAd.id}.png`}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md flex items-center gap-2"
                >
                  📥 Télécharger {activeAd.type === 'video' ? 'le Fichier Vidéo MP4' : 'cette Image HD'}
                </a>
              </div>

              {/* Primary Text Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Texte Principal (Ad Copy Body)
                  </label>
                  <button
                    onClick={() => handleCopyText(activeAd.primaryText, 'primary')}
                    className="text-[11px] text-amber-400 hover:underline font-bold"
                  >
                    {copiedIndex === selectedAdIndex && copiedField === 'primary' ? '✓ Copié !' : '📋 Copier ce texte'}
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed font-mono relative group">
                  {activeAd.primaryText}
                </div>
              </div>

              {/* Headline & Subtitle Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Titre Principal (Headline)
                  </label>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold font-mono">
                    {activeAd.headline}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Description / Sous-titre
                  </label>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono">
                    {activeAd.description}
                  </div>
                </div>
              </div>

              {/* Recommended Call to Action */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-300 font-semibold">Bouton Call-To-Action (CTA) recommandé :</p>
                  <p className="text-sm font-extrabold text-white mt-0.5">{activeAd.cta}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  Meta Ads Manager
                </span>
              </div>
            </div>

            {/* Target Audience Recommendation Box */}
            <div className="bg-[#0F1424] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <span>🎯</span> Ciblage Recommandé pour cette offre
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                <strong className="text-white font-bold">Public Cible :</strong> {activeAd.targetAudience}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#070A14] py-8 text-center text-xs text-slate-500">
        <p>Les Aventures de Léo © 2026 • Kit Publicitaire Meta Ads (Vidéos MP4 & Affiches HD)</p>
      </footer>
    </div>
  );
}
