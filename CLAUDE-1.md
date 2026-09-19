# CLAUDE.md — English Wars (ex-EnglishQuest)

## ⚠️ L'APPLICATION ACTIVE EST LE DOSSIER `web/`

La seule application vivante est **`web/`** : React 18 + TypeScript + Vite 5, avec
Clerk (authentification), Supabase (synchro de la progression) et Tailwind CSS.
**Tout le travail se fait dans `web/src/`.**

Le fichier **`index.html` à la racine du dépôt (~580 Ko) est une ANCIENNE version
morte**, gardée seulement comme archive. **Ne jamais l'éditer, ne pas s'en inspirer,
ne pas y ajouter de fonctionnalité.** Quand on te demande de modifier « le site »,
tu modifies le dossier `web/`, PAS le `index.html` de la racine.

Il n'existe **pas** de dossier `apps/web` ni `apps/api`, et pas de fichier
`AGENTS.md`. Ignore ces chemins s'ils apparaissent dans d'anciens documents
(README, PROJECT.md) : ils sont périmés. La référence, c'est ce fichier.

## Structure réelle de `web/`

- `web/src/pages/` — les pages (`HomePage`, `LearnPage`, `WorldPages`, …)
- `web/src/components/` — composants (`Layout`, `Dogfight`, `SpaceBackdrop`,
  `Character`, `HyperspaceIntro`, …)
- `web/src/lib/` — logique (`content`, `galaxy`, `srs`, …)
- `web/src/data/` — données (`shop`, …)
- `web/src/index.css` — styles globaux + animations (keyframes)
- `web/public/assets/` — images et sprites (`chip_*.png`, `planet_*.png`,
  `zone_*.jpg`, `endor_*.jpg`, …) ; on y référence les fichiers via
  `${import.meta.env.BASE_URL}assets/...`
- `web/index.html` — le VRAI point d'entrée (petit, ~800 o, monte `/src/main.tsx`)

## Build et vérification

```bash
cd web
npm install        # une seule fois (ou après changement de dépendances)
npm run build      # = vite build (esbuild)
```

Le build utilise esbuild : il n'échoue que sur une vraie **erreur de syntaxe**.
Les erreurs de **types** TypeScript ne bloquent PAS le build (pas de `tsc` dans le
build). Vérifier surtout que la syntaxe passe.

## Données utilisateur — à préserver

Ne jamais casser les clés localStorage `eq_v4` (progression) et `eq_words`
(dictionnaire) : d'anciens utilisateurs en dépendent.

## Publier (push) depuis Git Bash

Sous Git Bash le chemin Windows s'écrit `/c/...`, PAS `C:\...` :

```bash
cd /c/Users/damien/Project-V1
git pull          # récupérer d'abord (plusieurs agents/machines travaillent)
git add -A
git commit -m "message clair"
git push
```

## ⚠️ Déploiement — à savoir

Le site en ligne est actuellement publié par **GitHub Pages** qui sert le vieux
`index.html` de la RACINE. Le dossier `web/` (la vraie app) **n'est pas encore
branché au déploiement** : il n'y a pas de workflow `.github/workflows/` qui
compile `web/` et le publie. Tant que ce pont n'est pas mis en place, un `push`
met bien à jour le code mais **ne change pas le site en ligne**. Ce point est en
cours de résolution avec Killian (GitHub Actions → Pages, ou Vercel sur `web/`).
Ne pas « corriger » ça en réécrivant l'ancien `index.html`.
