# EnglishQuest — Référence du projet

> Document vivant : contexte complet du site, à relire au début de chaque conversation
> et à mettre à jour à **chaque** modification (voir le Journal en bas).

## 1. Le projet en une phrase
EnglishQuest est une application web d'apprentissage de l'anglais (A1 → C2), façon
Duolingo : leçons de grammaire et de vocabulaire, exercices variés, système de
progression, île à décorer avec des récompenses, trophées.

- **Propriétaire / dev :** Killian (killianlopez20@gmail.com), francophone.
- **Site en ligne :** https://project-v1-orpin.vercel.app/
- **Dépôt GitHub :** Killian20022/Project-V1 (l'application est dans le sous-dossier `web/`).
- **Dossier local (PC de Killian) :** `C:\Users\damien\Project-V1` (le `web/` dedans).

## 2. Stack technique
- **React 18 + Vite 5 + TypeScript**
- **Tailwind CSS 3.4** + **shadcn/ui** (composants inclus à la main dans `src/components/ui`)
- **lucide-react** pour les icônes
- Polices Google : **Baloo 2** (titres) + **Nunito** (texte)
- Thème **sombre bleu glacier** défini par variables CSS dans `src/index.css`

## 3. Comptes & services (tous en offre gratuite)
- **Clerk** (`@clerk/clerk-react` ^5, `@clerk/themes` ^2) — connexion / comptes.
  - Clé publishable en dur dans `src/main.tsx` (`pk_test_...`) — c'est une clé **publique**, OK.
  - Thème sombre + overrides d'éléments pour rendre le menu profil lisible (texte clair).
- **Supabase** (`@supabase/supabase-js` ^2.45) — sauvegarde de la progression.
  - Clé **publishable** (`sb_publishable_...`) dans `src/lib/progressSync.ts` — publique, OK.
  - Intégration native Clerk ↔ Supabase (third-party auth, pas de template JWT).
  - Le client lit le token via `window.Clerk.session.getToken()` (champ `accessToken`).
  - Table `progress` : `user_id` (text, PK) · `state` (jsonb) · `updated_at`.
  - **RLS** activée, policies : `(select auth.jwt()->>'sub') = user_id`.
- **Vercel** — hébergement. Root Directory = `web`. **Déploiement auto à chaque `git push`.**

> ⚠️ **Secrets à ne JAMAIS exposer/committer :** la clé secrète Clerk (`sk_...`),
> la clé `service_role` Supabase, le mot de passe de la base. Seules les clés
> *publishable / anon* (publiques) sont dans le code client.

## 4. Structure du dépôt (`web/`)
```
web/
  public/
    favicon.svg
    assets/            # PNG pixel-art : île, tuiles, sprites, chip_*.png (objets boutique)
  src/
    main.tsx           # ClerkProvider + appearance (thème sombre)
    App.tsx            # machine à états (pages), charge/sauve la progression (Supabase)
    index.css          # thème bleu glacier + keyframes des animations de l'île
    types.ts           # GameState, PlacedItem, Lesson, Sentence, etc.
    components/
      Layout.tsx       # header, nav, stats, réglages voix, boutons Clerk, bouton DEV +1000 pièces
      Character.tsx    # affichage d'un sprite
      ui/              # composants shadcn (button, card, ...)
    pages/
      HomePage.tsx     # accueil + choix du niveau
      LearnPage.tsx    # parcours de leçons d'un niveau
      LessonPage.tsx   # fiche de cours (grammaire/vocabulaire)
      ExercisePage.tsx # moteur d'exercices (7 types), cœurs, combo
      WorldPages.tsx   # IslandPage (île), ShopPage (boutique), TrophiesPage
      DictionaryPage.tsx
    lib/
      state.ts         # DEFAULT_STATE, load/save (localStorage), completeLesson
      content.ts       # LEVELS, LEVEL_INFO, lessonsFor/sentencesFor, lessonCount, TOTAL_LESSONS
      exercises.ts     # types de Question, buildQuestions, comparateurs de réponses
      trophies.ts      # 33 trophées (objectifs dynamiques)
      progressSync.ts  # client Supabase + load/saveRemoteProgress
      speak.ts         # synthèse vocale (Web Speech API)
    data/
      curriculum.ts    # les 95 leçons (par niveau)
      sentences.ts     # 3000 phrases EN/FR (500 par niveau)
      shop.ts          # objets de la boutique
      landMask.json    # masque terre/eau de l'île (48×30) pour le déplacement des animaux
```

## 5. Données & état
- **localStorage :** `eq_v4` (état de jeu), `eq_words` (dictionnaire perso), `eq_voice` (voix).
- **GameState** (voir `types.ts`) : points, streak, coins, lessons (par niveau), `placed`
  (objets posés sur l'île), stats, trophies, etc.
- Sauvegarde en ligne **anti-rebond 800 ms** quand on est connecté ; au login, la
  progression du compte Supabase fait référence entre appareils.

## 6. Contenu pédagogique
- **95 leçons** : A1, A2, B1, B2, C1 = 16 chacun · C2 = 15.
- Chaque leçon : type `G` (grammaire) ou `V` (vocabulaire), intro, `forms`, `sections`,
  `examples`, `pitfalls`, `keypoints`, `drills` (QCM) et **10 phrases `practice`**.
- **3000 phrases** dans `sentences.ts` (500 par niveau) — réserve pour compléter les exercices.
- Le nombre de leçons est **dynamique** (`lessonCount`, `TOTAL_LESSONS`) : ajouter des
  leçons met à jour automatiquement barres de progression et trophées.

## 7. Moteur d'exercices (`exercises.ts` + `ExercisePage.tsx`)
- **12 questions par leçon**, mélangées.
- **7 types :** `qcm` (choix multiple), `fill` (texte à trou), `order` (remise en ordre),
  `dictation` (écoute puis reconstitution), `listen` (écoute + choix), `match` (associer
  paires phrase↔traduction), `speak` (prononciation au micro).
- 5 cœurs, système de combo, XP + pièces gagnées.
- **Web Speech API** : synthèse (`speak.ts`) et reconnaissance vocale (micro, Chrome/Edge).

## 8. L'île & la boutique (`WorldPages.tsx`)
- Carte **pixel-art** (tuiles Sprout Lands) : eau animée, nuages, oiseaux.
- Objets achetés = `state.placed`, **déplaçables** au doigt/souris (drag), position en %.
- **Taille uniforme** de tous les objets via des images pré-détourées `chip_<id>.png`
  (toutes 40 px de haut) affichées à 44 px.
- **Animaux** (poule, vache, fermier) : se **déplacent tout seuls** sur la terre, jamais
  dans l'eau (test via `landMask.json`).
- Si on lâche un animal dans l'**eau** : animation de **noyade** (`eq-drown` + éclaboussure)
  puis **réapparition** sur l'île (`eq-appear`). Achats aussi placés sur la terre.
- Boutique : **5 exemplaires max** par objet.
- **Bouton DEV +1000 pièces** dans le header, **réservé** à killianlopez20@gmail.com.

## 9. Comment je livre les modifs (workflow à suivre à chaque fois)
- Le bac à sable cloud **ne peut pas `git push`** et **npm y est bloqué** → pas de build
  ni de test dans le cloud. On **vérifie statiquement** (équilibre des accolades, parse
  du curriculum avec node) ; **Killian teste sur Vercel** après push.
- On écrit les fichiers dans le cloud puis on les **dépose sur le PC** avec
  `device_commit_files` vers `C:\Users\damien\Project-V1\web\...`.
- Copies de travail cloud : `/mnt/user-data/outputs/eq2` (référence) et `/home/claude/eq2`.
- **Killian pousse ensuite** (Git Bash — attention, il faut des slashs `/` et `/c/...`) :
  ```
  cd /c/Users/damien/Project-V1
  git add -A
  git commit -m "message"
  git push
  ```
  Vercel redéploie tout seul.

## 10. Idées / TODO (backlog)
- Continuer à ajouter des leçons (surtout C2, et plus loin).
- Nouveaux types d'exercices possibles : traduction libre, dictée à taper, mode révision
  espacée (SRS) des mots déjà vus.
- Nettoyer d'éventuels fichiers hérités à la racine du dépôt.
- Classement (leaderboard) entre amis ; nom de domaine personnalisé.

## 11. Journal des modifications
- **2026-09-12** — Île : taille uniforme des objets (chips), déplacement autonome des
  animaux sur la terre uniquement, animation de noyade + réapparition.
- **2026-09-12** — Contenu : passage de 60 à **95 leçons** ; comptage dynamique des leçons.
- **2026-09-12** — Exercices : ajout des types **« associer »** et **« dictée »**
  (7 types au total), 12 questions par leçon.
- **2026-09-13** — Création de ce document de référence (skill + `PROJECT.md`).
