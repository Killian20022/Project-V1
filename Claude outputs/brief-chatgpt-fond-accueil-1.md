# Brief pour ChatGPT — REFAIRE tout le fond de l'accueil « English Wars » (de A à Z)

> Copie-colle **tout** ce message dans ChatGPT. Il contient le contexte + les fichiers +
> la consigne. ChatGPT n'a PAS accès à mon PC : ce document EST son accès au dossier `web/`.
> Il doit répondre avec des **fichiers complets**, prêts à coller (chemins exacts, code qui
> compile).

---

## 1. Le projet

**English Wars** : application web d'apprentissage de l'anglais (A1 → C2), thème **Star Wars**
(façon Duolingo dans une galaxie lointaine).

- **Stack :** React 18 + Vite 5 + **TypeScript**, **Tailwind CSS 3.4** + **shadcn/ui**
  (composants dans `src/components/ui`), icônes **lucide-react**.
- **Polices :** Orbitron (titres) + Nunito (texte).
- **Alias d'import :** `@/` = `src/`.
- **Tokens de couleur** (HSL, dans `src/index.css`) — à utiliser, jamais de couleurs en dur :
  `--background 222 42% 6%`, `--foreground 220 20% 92%`, `--card 222 32% 10%`,
  `--primary / --brand-gold 45 96% 58%` (or #f5c518), `--accent / --brand-blue 199 100% 60%`
  (sabre bleu #33ccff), `--brand-red 0 90% 60%`, `--brand-green 128 66% 52%`.
  Ex. d'usage : `hsl(var(--brand-gold) / 0.2)`.

## 2. LA CONSIGNE (importante)

**Refais entièrement le décor de fond de la page d'accueil, de zéro.** Le fond actuel est
raté (les planètes sont des images moches, avec un halo carré et des bords baveux) et doit
être remplacé.

Ce qu'on VEUT dans le fond :
- **Des planètes** flottant dans l'espace, qui **bougent doucement** (dérive/flottement lents,
  légère rotation ou parallaxe).
- **Un champ d'étoiles** en fond (plusieurs couches, scintillement discret), éventuellement une
  **étoile filante** de temps en temps et une **nébuleuse** en dégradé qui dérive lentement.
- Les planètes doivent **ressembler aux planètes connues de Star Wars**, reconnaissables au
  premier coup d'œil (voir la liste plus bas).

Règles STRICTES :
- ❌ **Interdit d'utiliser les fichiers PNG de planètes** (`planet_saturn.png`,
  `planet_jupiter.png`, `planet_earth.png`, `planet_death.png`, `planet_mars.png`,
  `planet_neptune.png`, `planet_moon.png`). Ils sont moches → on ne les utilise plus.
- ✅ **Les planètes et tout le décor doivent être DESSINÉS en CSS / SVG dans le code**
  (`radial-gradient`, `box-shadow`, `clip-path`, `mask`, SVG inline avec `filter`…), pas de
  fichier image. Fait-les belles, avec du volume (lumière d'un côté, terminateur sombre de
  l'autre), des textures (bandes, calottes, mers de lave…) et un léger halo lumineux.
- **Planètes Star Wars à représenter** (choisis-en 4 à 6, bien réparties près des bords pour
  ne pas gêner le texte) :
  - **Tatooine** — désert ocre/sable, deux soleils suggérés par un double halo chaud.
  - **Coruscant** — planète-cité gris-doré, points lumineux (lumières de la ville) côté nuit.
  - **Hoth** — planète glacée, blanc/bleu très clair.
  - **Mustafar** — planète de lave, noir/rouge avec veines incandescentes.
  - **Endor** — lune forestière verte avec nuages.
  - **Étoile de la Mort** — sphère gris métal avec sa **rainure équatoriale** et son **canon
    concave** (le cercle en creux), style station, pas planète naturelle.
  - (option) **Kamino** bleu océan, ou une planète à **anneau** type Geonosis.
- Le décor reste **derrière le contenu** : couche `fixed inset-0`, `-z-index` négatif,
  `pointer-events: none`, `aria-hidden`.
- **Lisibilité d'abord** : garder le centre de l'écran plutôt calme pour que le texte des
  `Card` reste parfaitement lisible ; planètes surtout vers les coins/bords.
- **Perfs** : CSS/keyframes, pas de grosse boucle JS. Respecter
  `@media (prefers-reduced-motion: reduce)` (couper/atténuer les animations) et alléger sur
  mobile (`@media (max-width: 640px)` : moins de planètes / plus petites).
- **TypeScript strict** : pas de `any` non justifié, imports de types corrects.
- **Livrer des fichiers COMPLETS** (pas de « … », pas de diff partiel) avec le chemin exact.

Ce que tu dois produire :
1. **`web/src/components/SpaceBackdrop.tsx`** — réécrit de zéro. Étoiles multi-couches +
   nébuleuse + étoile filante + **4 à 6 planètes Star Wars dessinées en CSS/SVG** (aucune
   image), chacune animée d'un mouvement lent (flottement + éventuelle rotation/parallaxe).
   Structure les planètes proprement (un petit composant/tableau de données interne).
2. **`web/src/index.css`** — le CSS correspondant (sphères, textures, halos, keyframes de
   mouvement). **Supprime l'ancien bloc** `--- Décor de l'accueil ... ---` / toutes les règles
   `.sb-*` existantes et remplace-les par les tiennes. Donne le fichier complet OU un bloc
   clairement délimité « remplace le bloc décor par ceci ».

Ne touche PAS au composant `<Dogfight />` (c'est le combat X-Wing vs TIE, un élément séparé
qui reste). Ne touche pas au reste de `HomePage.tsx` : il continue d'appeler `<SpaceBackdrop />`
puis `<Dogfight />`, c'est juste le CONTENU de `SpaceBackdrop` qui change.

## 3. Fichiers actuels (état réel du dépôt — à remplacer)

### `web/src/pages/HomePage.tsx` (début — NE PAS modifier, juste pour comprendre l'usage)

```tsx
import { Dogfight } from '@/components/Dogfight';
import { SpaceBackdrop } from '@/components/SpaceBackdrop';
// ...
export function HomePage({ state, navigate, openLevel, onReview }: { /* ... */ }) {
  // ...
  return (
    <div className="space-y-8">
      {/* Décor de fond + combat X-Wing vs TIE */}
      <SpaceBackdrop />
      <Dogfight />
      <Card className="overflow-hidden">
        {/* Hero : titre "Deviens un Jedi de l'anglais", boutons, stats, duel sabre laser */}
      </Card>
      {/* Cartes "Objectif du jour" / "Réviser", grille des niveaux A1→C2, personnages */}
    </div>
  );
}
```

### `web/src/components/SpaceBackdrop.tsx` (ACTUEL — à réécrire entièrement, sans images)

```tsx
import type { CSSProperties } from 'react';

const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

const PLANETS: { file: string; size: number; position: CSSProperties; duration: number }[] = [
  { file: 'planet_saturn.png', size: 154, position: { top: '7%', left: '3%' }, duration: 28 },
  { file: 'planet_neptune.png', size: 102, position: { top: '8%', right: '4%' }, duration: 34 },
  { file: 'planet_earth.png', size: 88, position: { top: '48%', right: '3%' }, duration: 26 },
  { file: 'planet_jupiter.png', size: 120, position: { bottom: '5%', left: '3%' }, duration: 32 },
  { file: 'planet_death.png', size: 82, position: { top: '58%', left: '43%' }, duration: 38 },
  { file: 'planet_mars.png', size: 68, position: { bottom: '16%', right: '22%' }, duration: 24 },
  { file: 'planet_moon.png', size: 42, position: { top: '74%', left: '20%' }, duration: 20 },
];

export function SpaceBackdrop() {
  return (
    <div className="sb-scene pointer-events-none fixed inset-0 -z-[8] overflow-hidden" aria-hidden="true">
      <div className="sb-nebula" />
      <div className="sb-stars sb-stars-far" />
      <div className="sb-stars sb-stars-near" />
      <div className="sb-horizon" />
      <div className="sb-orbit sb-orbit-one" />
      <div className="sb-orbit sb-orbit-two" />
      <div className="sb-shooting-star sb-shooting-star-one" />
      <div className="sb-shooting-star sb-shooting-star-two" />
      {PLANETS.map((planet, index) => (
        <img key={planet.file} src={asset(planet.file)} alt="" className="sb-planet"
          style={{ ...planet.position, height: planet.size,
            animationDuration: `${planet.duration}s`, animationDelay: `${-index * 3}s` }}
          draggable={false} />
      ))}
    </div>
  );
}
```

### `web/src/index.css` — bloc décor ACTUEL (à SUPPRIMER et remplacer)

```css
/* --- Décor de l'accueil : profondeur, orbites et étoiles --- */
.sb-scene { isolation: isolate; }
.sb-nebula { position: absolute; inset: -8%;
  background:
    radial-gradient(ellipse 42% 44% at 82% 20%, hsl(var(--brand-blue) / 0.16), transparent 75%),
    radial-gradient(ellipse 35% 38% at 9% 78%, hsl(var(--brand-gold) / 0.11), transparent 76%),
    radial-gradient(ellipse 44% 38% at 57% 53%, hsl(var(--brand-red) / 0.065), transparent 79%);
  animation: sb-nebula-drift 44s ease-in-out infinite alternate; }
.sb-stars { position: absolute; inset: 0; }
.sb-stars-far { /* étoiles lointaines + background-size 330px 270px + sw-twinkle 8s */ }
.sb-stars-near { /* étoiles proches + background-size 510px 390px + sw-twinkle 5.5s reverse */ }
.sb-horizon { position: absolute; left:-20%; right:-20%; bottom:-48%; height:72%;
  border-radius:50%; border-top:1px solid hsl(var(--brand-blue)/0.18);
  box-shadow:0 -12px 70px -38px hsl(var(--brand-blue)/0.35); transform:rotate(-7deg); }
.sb-orbit { position:absolute; width:74vw; height:74vw; min-width:700px; min-height:700px;
  border:1px solid hsl(var(--brand-gold)/0.07); border-radius:50%; transform:rotate(-23deg) scaleY(0.43); }
.sb-orbit-one { top:-47vw; left:-20vw; }
.sb-orbit-two { right:-29vw; bottom:-50vw; border-color:hsl(var(--brand-blue)/0.07); }
.sb-shooting-star { /* trainée + animation sb-shoot */ }
.sb-planet { position:absolute; /* ... animation sb-float 24s ... */ }
@keyframes sb-nebula-drift { from{transform:translate3d(-2%,0,0);} to{transform:translate3d(2%,-2%,0);} }
@keyframes sb-float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-13px);} }
@keyframes sb-shoot { /* ... */ }
@media (max-width:640px){ .sb-planet{opacity:0.58;} .sb-orbit{display:none;} }
@media (prefers-reduced-motion: reduce){ .sb-nebula,.sb-stars,.sb-planet,.sb-shooting-star{animation:none;} }

/* Keyframe réutilisable déjà présent ailleurs dans le fichier : */
@keyframes sw-twinkle { 0%,100%{opacity:0.45;} 50%{opacity:0.9;} }
```

> **Rappelle-toi : on VEUT des planètes Star Wars reconnaissables + des étoiles, qui bougent
> doucement — mais DESSINÉES en CSS/SVG, aucune image PNG. Fichiers complets, chemins exacts,
> code TypeScript qui compile.**

## 4. Après ta réponse (workflow de Killian)

Coller les fichiers dans `C:\Users\damien\Project-V1\web\...`, puis :

```bash
cd /c/Users/damien/Project-V1
git pull --rebase
git add -A
git commit -m "Accueil : refonte complete du fond (sans images de planetes)"
git push
```

Vercel redéploie tout seul (Root Directory = `web`).
