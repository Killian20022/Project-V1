# Brief pour ChatGPT — Fond de la page d'accueil « English Wars »

> Copie-colle **tout** ce message dans ChatGPT. Il contient le contexte du projet + les
> fichiers concernés + la consigne. ChatGPT n'a pas accès à mon PC : ce document EST son
> accès au dossier `web/`. Il doit répondre avec des fichiers complets, prêts à coller.

---

## 1. Le projet

**English Wars** : application web d'apprentissage de l'anglais (A1 → C2), thème **Star Wars**
(façon Duolingo dans une galaxie lointaine). Missions = leçons, XP, séries, révision espacée,
galaxie/île à décorer, trophées.

- **Stack :** React 18 + Vite 5 + **TypeScript**, **Tailwind CSS 3.4** + **shadcn/ui**
  (composants dans `src/components/ui`), icônes **lucide-react**.
- **Polices :** Orbitron (titres) + Nunito (texte).
- **Thème :** sombre « espace profond », or impérial (`#f5c518`), sabre bleu (`#33ccff`),
  variables CSS dans `src/index.css` (voir plus bas). Utiliser les tokens HSL
  (`hsl(var(--primary))`, `--accent`, `--brand-gold`, `--brand-blue`, `--brand-red`,
  `--brand-green`), **jamais** de couleurs en dur hors effets.
- **Assets :** PNG pixel-art dans `public/assets/` (planètes `planet_*.png`, vaisseaux,
  `chip_luke.png`, `chip_vader.png`, `chip_r2d2.png`, `chip_chewie.png`, etc.).
  On y accède via `` `${import.meta.env.BASE_URL}assets/<fichier>.png` ``.

Alias d'import : `@/` = `src/`.

## 2. Ce qui existe DÉJÀ comme fond d'accueil

La page d'accueil (`src/pages/HomePage.tsx`) empile, tout en haut de son rendu :

- `<SpaceBackdrop />` — couche `fixed inset-0 -z-[8]` : nébuleuse (`.sb-nebula`) +
  étoiles scintillantes (`.sb-stars`) + 7 planètes flottantes (`.sb-planet`).
- `<Dogfight />` — combat X-Wing vs TIE (composant séparé, ne pas y toucher ici).

Le `<body>` a déjà un dégradé spatial global + étoiles (voir `index.css`).

## 3. La consigne

Améliore / retravaille **le fond de la page d'accueil** (la couche décor derrière le
contenu). Objectif : plus immersif et « waouh » à l'arrivée, sans nuire à la lisibilité
du texte ni aux perfs.

Contraintes :
- Rester **cohérent avec le thème Star Wars / espace** et les tokens de couleur existants.
- Ne pas gêner la lecture : le décor reste discret derrière les `Card` (garder un `-z-index`
  négatif, `pointer-events: none`).
- **Performances** : privilégier le CSS (keyframes) ; pas de grosse boucle JS.
- Respecter `@media (prefers-reduced-motion: reduce)` (couper/atténuer les animations).
- **TypeScript strict** : types corrects, pas de `any` non justifié.
- Livrer des **fichiers complets** (pas de « … » ni de diff partiel) : indique pour chacun
  son chemin exact (`web/src/...`) et donne le contenu entier à coller.
- Si tu ajoutes du CSS, mets-le dans `src/index.css` (dans le style des sections existantes).

Idées possibles (au choix / à combiner) : parallax léger des étoiles à la souris,
comète/étoile filante occasionnelle, halo de sabre qui pulse, nébuleuse animée en très lente
dérive, champ d'astéroïdes discret, texte d'intro « A long time ago… » — mais garde-le sobre.

## 4. Après ta réponse (workflow de Killian)

Killian colle tes fichiers dans `C:\Users\damien\Project-V1\web\...`, puis :

```bash
cd /c/Users/damien/Project-V1
git add -A
git commit -m "Accueil : nouveau fond spatial"
git push
```

Vercel redéploie tout seul (Root Directory = `web`). Donc : **fichiers complets, chemins
exacts, code qui compile.**

---

# FICHIERS ACTUELS (référence — c'est l'état réel du dépôt)

## `web/src/pages/HomePage.tsx`

```tsx
import { Rocket, BookOpen, Sparkles, Target, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Character } from '@/components/Character';
import { Dogfight } from '@/components/Dogfight';
import { SpaceBackdrop } from '@/components/SpaceBackdrop';
import { LEVELS, LEVEL_INFO, lessonCount, TOTAL_LESSONS } from '@/lib/content';
import { countDue } from '@/lib/srs';
import type { GameState, Level, Page } from '../types';

export function HomePage({
  state,
  navigate,
  openLevel,
  onReview,
}: {
  state: GameState;
  navigate: (page: Page) => void;
  openLevel: (level: Level) => void;
  onReview: () => void;
}) {
  const lessonsDone = LEVELS.reduce((sum, lv) => sum + Math.min(state.lessons[lv] ?? 0, lessonCount(lv)), 0);
  const totalLessons = TOTAL_LESSONS;
  const dailyGoal = 50;
  const dailyToday = state.dailyDate === new Date().toDateString() ? state.dailyXP : 0;
  const dailyPct = Math.min(100, Math.round((dailyToday / dailyGoal) * 100));
  const due = countDue(state.srs);

  return (
    <div className="space-y-8">
      {/* Décor spatial (planètes, étoiles) + combat X-Wing vs TIE en fond de page */}
      <SpaceBackdrop />
      <Dogfight />
      <Card className="overflow-hidden">
        <CardContent className="relative p-8 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3" /> ENTRAÎNE-TOI · MAÎTRISE · TRIOMPHE
          </div>
          <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight md:text-5xl">
            Deviens un Jedi de{' '}
            <span className="text-glow bg-gradient-to-r from-[#f5c518] via-[#ffe27a] to-[#33ccff] bg-clip-text text-transparent">
              l'anglais
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Des missions courtes, des exercices variés et une galaxie qui grandit avec tes victoires.
            Que la Force (et l'anglais) soit avec toi.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('learn')}>
              <Rocket /> Reprendre la mission
            </Button>
            <Button size="lg" variant={due > 0 ? 'default' : 'outline'} disabled={due === 0} onClick={onReview}>
              <Brain /> {due > 0 ? `Entraînement (${due})` : 'Rien à réviser'}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('dictionary')}>
              <BookOpen /> Archives
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-8">
            <Stat value={state.points} label="XP gagnés" />
            <Stat value={`${lessonsDone}/${totalLessons}`} label="Missions accomplies" />
            <Stat value={state.streak} label="Jours de série" />
          </div>
          {/* Duel au sabre laser : Luke (vert) face à Dark Vador (rouge), lames qui pulsent */}
          <div className="pointer-events-none absolute bottom-0 right-4 hidden items-end lg:flex">
            <img
              src={`${import.meta.env.BASE_URL}assets/chip_luke.png`}
              alt=""
              className="saber-luke"
              style={{ height: 150, width: 'auto', imageRendering: 'pixelated', transform: 'scaleX(-1)', marginRight: -8 }}
            />
            <img
              src={`${import.meta.env.BASE_URL}assets/chip_vader.png`}
              alt=""
              className="saber-vader"
              style={{ height: 168, width: 'auto', imageRendering: 'pixelated' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ... (reste de la page : objectif du jour, révision, choix du grade, personnages) ... */}
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
```

## `web/src/components/SpaceBackdrop.tsx`

```tsx
const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

// Décor spatial de fond : planètes pixel art + nébuleuse + étoiles.
// Placé derrière le combat X-Wing/TIE pour donner de la profondeur.
const PLANETS: { f: string; size: number; style: React.CSSProperties; dur: number }[] = [
  { f: 'planet_saturn.png', size: 150, style: { top: '6%', left: '2%' }, dur: 26 },
  { f: 'planet_jupiter.png', size: 124, style: { bottom: '6%', left: '2%' }, dur: 30 },
  { f: 'planet_neptune.png', size: 104, style: { top: '5%', right: '3%' }, dur: 32 },
  { f: 'planet_earth.png', size: 92, style: { top: '46%', right: '2%' }, dur: 24 },
  { f: 'planet_death.png', size: 92, style: { top: '54%', left: '43%' }, dur: 36 },
  { f: 'planet_mars.png', size: 74, style: { bottom: '20%', right: '24%' }, dur: 22 },
  { f: 'planet_moon.png', size: 46, style: { top: '72%', left: '20%' }, dur: 18 },
];

export function SpaceBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-[8] overflow-hidden">
      <div className="sb-nebula" />
      <div className="sb-stars" />
      {PLANETS.map((p, i) => (
        <img
          key={i}
          src={asset(p.f)}
          alt=""
          className="sb-planet"
          style={{ ...p.style, height: p.size, animationDuration: `${p.dur}s`, animationDelay: `${-i * 2.5}s` }}
          draggable={false}
        />
      ))}
    </div>
  );
}
```

## `web/src/index.css` — extraits pertinents (thème + fond spatial)

```css
:root {
  /* Palette « English Wars » — espace profond, or impérial, sabres laser */
  --background: 222 42% 6%;
  --foreground: 220 20% 92%;
  --card: 222 32% 10%;
  --primary: 45 96% 58%;            /* or #f5c518 */
  --secondary: 220 26% 15%;
  --muted-foreground: 220 12% 62%;
  --accent: 199 100% 60%;           /* bleu sabre #33ccff */
  --border: 220 26% 20%;
  --ring: 45 96% 58%;
  --radius: 0.75rem;
  --brand-gold: 45 96% 58%;
  --brand-blue: 199 100% 60%;
  --brand-red: 0 90% 60%;
  --brand-green: 128 66% 52%;
}

/* Fond global du body (dégradé espace + étoiles fixes) */
body {
  background:
    radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.55), transparent 60%),
    /* ...autres étoiles... */
    radial-gradient(1100px 620px at 82% -14%, hsl(var(--brand-gold) / 0.16), transparent 60%),
    radial-gradient(880px 520px at -6% 4%, hsl(var(--brand-blue) / 0.12), transparent 55%),
    linear-gradient(180deg, hsl(222 42% 8%), hsl(224 44% 4%));
  background-attachment: fixed;
}

/* Étoiles scintillantes */
@keyframes sw-twinkle { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }

/* Étoile filante (déjà défini, réutilisable) */
@keyframes sw-shoot {
  0% { transform: translate(0, 0) rotate(20deg); opacity: 0; }
  3% { opacity: 1; }
  10% { transform: translate(-420px, 150px) rotate(20deg); opacity: 0; }
  100% { transform: translate(-420px, 150px) rotate(20deg); opacity: 0; }
}

/* Décor spatial de fond */
.sb-nebula {
  position: absolute; inset: 0;
  background:
    radial-gradient(60% 50% at 78% 18%, rgba(120, 90, 220, 0.14), transparent 70%),
    radial-gradient(55% 45% at 12% 78%, rgba(40, 160, 200, 0.12), transparent 70%),
    radial-gradient(50% 40% at 52% 48%, rgba(220, 80, 160, 0.07), transparent 75%);
}
.sb-stars { position: absolute; inset: 0; /* ...étoiles... */ animation: sw-twinkle 6s ease-in-out infinite; }
@keyframes sb-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
.sb-planet {
  position: absolute; width: auto; opacity: 0.95;
  filter: drop-shadow(0 8px 22px rgba(0, 0, 0, 0.55));
  animation: sb-float 24s ease-in-out infinite;
}
```

> Fin du contexte. **Ta mission : retravailler le fond de l'accueil (`SpaceBackdrop.tsx`
> et/ou `index.css`), et livrer les fichiers complets modifiés, prêts à coller et push.**
