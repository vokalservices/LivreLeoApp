/**
 * translations.js — Prix en EUR, textes mis à jour, suppression références FCFA/Stripe/Mobile Money
 */

export const eur = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

export const t = {
  fr: {
    nav_shop: 'Boutique',

    hero_badge:    "L'univers de Léo l'inventeur",
    hero_title1:   'Partagez de Merveilleux',
    hero_title2:   "Contes de l'Espace",
    hero_subtitle: "Une fantastique collection illustrée en aquarelle pour les enfants de 4 à 8 ans. 6 aventures, 6 mondes, 1 héros : Léo, le petit inventeur de génie.",
    hero_cta_pack: 'Obtenir le Pack Complet',
    hero_cta_cat:  'Voir les livres',

    price_unit_label:  'Prix unitaire',
    price_fr_label:    'Pack FR',
    price_en_label:    'Pack EN',
    price_combo_label: 'Pack FR + EN',
    price_combo_sub:   '12 livres, 2 langues',
    price_savings:     (n) => `Économie de ${eur(n)}`,
    price_instead:     'au lieu de',
    price_per_book:    (n) => `Soit ${eur(n)} / livre`,

    pack_badge:      'Meilleure offre · −50 %',
    pack_title:      'Pack Intégral — Les 6 Aventures de Léo',
    pack_desc:       '6 histoires illustrées — PDF + EPUB + 6 narrations audio. Idéal pour lire ensemble et faire rêver les enfants.',
    pack_features:   ['6 histoires illustrées', 'PDF + EPUB inclus', '6 narrations audio', 'Illustrations aquarelle', 'Tome collector Bonus'],
    pack_cta:        'Commander le Pack',
    pack_unit_info:  (n, s) => `Soit ${eur(n)} / livre — économie de ${eur(s)}`,

    combo_badge:    'Offre Bilingue · −62 %',
    combo_title:    'Pack Combo FR + EN — 12 Livres',
    combo_desc:     "L'intégrale en français ET en anglais. Idéal pour les familles bilingues ou l'apprentissage de l'anglais par les enfants.",
    combo_features: ['12 histoires illustrées', 'PDF + EPUB inclus', 'FR & EN inclus', 'Narrations audio FR', 'Illustrations aquarelle'],
    combo_cta:      'Commander le Combo',
    combo_unit_info:(n, s) => `Soit ${eur(n)} / livre — économie de ${eur(s)}`,

    cat_title:    'Collection Complète',
    cat_subtitle: (p) => `Tomes 1 à 6 des Aventures de Léo — ${eur(p)} / tome`,
    cat_meta:     'Aquarelles & Audio inclus',
    cat_loading:  'Chargement de la collection...',
    cat_error1:   'Impossible de charger le catalogue',
    cat_reminder: '💡 Vous aimez la collection ?',
    cat_reminder2:(s) => `Achetez les 6 tomes ensemble et économisez ${eur(s)} — soit 50% de réduction.`,
    cat_cta:      'Voir le Pack Complet',

    footer_desc:     "Découvrez les merveilleuses collections illustrées de Théo Arven. Des récits drôles, poétiques et inspirants sur l'imagination et l'amitié, écrits spécialement pour faire rêver les enfants.",
    footer_shop:     'Boutique',
    footer_all:      'Tous les livres',
    footer_tomes:    'Tomes 1 à 6',
    footer_pack:     '🎁 Pack Complet −50 %',
    footer_pay:      'Paiement Sécurisé',
    footer_pay_desc: 'Nous acceptons les paiements par carte bancaire, PayPal et cartes prépayées virtuelles. Paiement sécurisé, accès instantané.',
    footer_copy:     (y) => `© ${y} Éditions Galaxie Carton / Théo Arven. Tous droits réservés.`,
    footer_illu:     "Illustré à l'aquarelle",
    footer_ebook:    'Version e-book & audio',

    lang_switch: 'English',
  },

  en: {
    nav_shop: 'Shop',

    hero_badge:    "Leo the Inventor's Universe",
    hero_title1:   'Share Wonderful',
    hero_title2:   'Space Adventures',
    hero_subtitle: 'A stunning watercolour illustrated collection for children aged 4–8. 6 adventures, 6 worlds, 1 hero: Leo, the little genius inventor.',
    hero_cta_pack: 'Get the Complete Pack',
    hero_cta_cat:  'Browse the books',

    price_unit_label:  'Unit price',
    price_fr_label:    'FR Pack',
    price_en_label:    'EN Pack',
    price_combo_label: 'FR + EN Pack',
    price_combo_sub:   '12 books, 2 languages',
    price_savings:     (n) => `Save ${eur(n)}`,
    price_instead:     'instead of',
    price_per_book:    (n) => `${eur(n)} / book`,

    pack_badge:      'Best deal · −50 %',
    pack_title:      "Complete Pack — Leo's 6 Adventures",
    pack_desc:       '6 illustrated stories — PDF + EPUB + 6 audio narrations. Perfect for reading together.',
    pack_features:   ['6 illustrated stories', 'PDF + EPUB included', '6 audio narrations', 'Watercolour illustrations', 'Bonus collector volume'],
    pack_cta:        'Order the Pack',
    pack_unit_info:  (n, s) => `${eur(n)} / book — save ${eur(s)}`,

    combo_badge:    'Bilingual Offer · −62 %',
    combo_title:    'Combo Pack FR + EN — 12 Books',
    combo_desc:     'The complete series in French AND English. Perfect for bilingual families or children learning French.',
    combo_features: ['12 illustrated stories', 'PDF + EPUB included', 'FR & EN included', 'FR audio narrations', 'Watercolour illustrations'],
    combo_cta:      'Order the Combo',
    combo_unit_info:(n, s) => `${eur(n)} / book — save ${eur(s)}`,

    cat_title:    'Full Collection',
    cat_subtitle: (p) => `Volumes 1–6 of Leo's Adventures — ${eur(p)} / volume`,
    cat_meta:     'Watercolours & Audio included',
    cat_loading:  'Loading the collection...',
    cat_error1:   'Could not load the catalogue',
    cat_reminder: '💡 Love the collection?',
    cat_reminder2:(s) => `Buy all 6 volumes together and save ${eur(s)} — 50% off.`,
    cat_cta:      'See the Complete Pack',

    footer_desc:     "Discover Theo Arven's beautifully illustrated collections. Funny, poetic and inspiring stories about imagination and friendship, written to make children dream.",
    footer_shop:     'Shop',
    footer_all:      'All books',
    footer_tomes:    'Volumes 1–6',
    footer_pack:     '🎁 Complete Pack −50 %',
    footer_pay:      'Secure Payment',
    footer_pay_desc: 'We accept credit card, PayPal and virtual prepaid card payments. Secure payment, instant access.',
    footer_copy:     (y) => `© ${y} Galaxie Carton Publishing / Theo Arven. All rights reserved.`,
    footer_illu:     'Watercolour illustrated',
    footer_ebook:    'e-book & audio edition',

    lang_switch: 'Français',
  },
};

// Alias pour la compatibilité avec les anciens appels fcfa()
export const fcfa = eur;
