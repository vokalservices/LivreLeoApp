# 🧠 MÉMOIRE DU PROJET — LES AVENTURES DE LÉO (FUSÉE CARTON)

Ce fichier est chargé automatiquement au début de chaque session pour maintenir une mémoire continue et instantanée de l'avancement, des décisions et de la configuration du projet.

---

## 📌 1. Vue d'Ensemble & Objectifs
* **Projet** : Saga de contes illustrés et audio pour enfants (4-8 ans) créée par Théo Arven.
* **Boutique en ligne** : [https://livre-leo.vercel.app](https://livre-leo.vercel.app)
* **Landing Page Publicitaire dédiée** : [https://livre-leo.vercel.app/facebook-ads](https://livre-leo.vercel.app/facebook-ads)
* **Console d'administration** : [https://livre-leo.vercel.app/admin/login](https://livre-leo.vercel.app/admin/login) (ou raccourci clavier `KIRO2026` sur l'accueil). Identifiants : `admin` / `password`.
* **Dépôt GitHub lié à Vercel** : `https://github.com/vokalservices/LivreLeoApp.git` (branche `main`). *Note de déploiement : le déploiement sur Vercel passe par le sous-dossier `push_temp` qui exclut les fichiers lourds.*

---

## 💰 2. Grille Tarifaire Officielle et Harmonisée
Tous les prix et pourcentages sont strictement harmonisés entre les publicités Meta Ads, les vidéos et le site web :
* **Tome individuel (Découverte)** : **4,99 €**
* **Pack 6 Tomes (FR ou EN)** : **16,49 €** au lieu de 29,94 € (**-45 %** de réduction / économie de 13,45 € — soit 2,75 € / livre).
* **Pack Combo Bilingue (12 Livres FR + EN)** : **30,99 €** au lieu de 59,88 € (**-48 %** de réduction / économie de 28,89 € — soit 2,58 € / livre).

---

## 📣 3. Campagne Meta Ads (Facebook & Instagram)
* **Compte Publicitaire** : `1134959114040068` (Martial Dhossou).
* **Nom de la Campagne** : `[ASC+] - Les Aventures de Léo - Pack 6 Tomes - Launch`
* **Objectif de performance** : Achats sur site Web.
* **Budget Quotidien** : `5,00 $ / jour` (seuil de facturation Meta : 25,00 $).
* **Ciblage** : Parents d'enfants en Île-de-France.
* **Pixel Meta actif** : ID `1320626546685214` (injecté dans l'en-tête de `pages/_document.js` et `pages/_app.js`).
* **Annonces créées (A/B testing)** :
  1. `Ad 1 - Routine du Soir (UGC)` : Vidéo `fb_ad_video_ugc_routine.mp4` (angle fin des crises d'écrans à 20h, endormissement apaisé en 12 min).
  2. `Ad 2 - Unboxing Pack Complet (-45%)` : Vidéo `fb_ad_video_unboxing_pack.mp4` (angle valeur massive, 6 ebooks + 6 audios pour 16,49€).
  3. `Ad 3 - Saga Magique Bestseller (9:16)` : Vidéo `fb_ad_video_promo_9_16.mp4` (angle imaginaire féerique, format Stories/Reels).
* **Statut de diffusion** : En cours de validation / « Préparation en cours » par Meta.

---

## 🛠️ 4. Infrastructure & Données
* **Hébergement & CDN** : Vercel (Frontend Next.js).
* **Stockage Cloud (Supabase)** : `https://wreswtwnlrwcbmzyioky.supabase.co`
  * Buckets : `books` (EPUBs, PDFs, ZIPs), `illustrations` (289 images HD), `audio` (287 narrations MP3).
* **Paiements** : Stripe (cartes bancaires) & PayPal (Live).
* **Expédition emails post-achat** : SMTP Gmail (`vokalservices@gmail.com`).

---

## 🧭 5. Consignes de reprise pour l'Assistant
Lors de chaque nouvelle conversation ou reprise :
1. Consulter ce fichier pour avoir l'état exact du projet.
2. Toujours respecter les prix harmonisés (16,49 € pour le pack 6 tomes et 30,99 € pour le combo).
3. Ne jamais proposer de modifier la campagne Meta Ads si elle est en cours d'examen.
4. Pour déployer sur Vercel, synchroniser les modifications dans `push_temp` et pousser vers `origin main` via le jeton d'accès GitHub configuré.
