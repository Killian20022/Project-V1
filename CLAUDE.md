# CLAUDE.md — EnglishQuest (Project-V1)

Guide pour toute session Claude travaillant sur ce dépôt. Lis-le en entier avant d'éditer.

## 1. Ce qu'est le projet

Application web d'apprentissage de l'anglais (A1→C2), façon Duolingo/Nihongo, **100 % dans un seul fichier `index.html`** (~580 Ko), hébergée sur **GitHub Pages** (branche `main`). Aucune étape de build, aucun framework, aucune dépendance runtime : tout le CSS est dans un `<style>` et tout le JS dans un unique `<script>` en fin de fichier.

Les seuls autres fichiers sont des **sprites PNG** (pack *Sprout Lands* de Cup Nooble) référencés par chemin relatif : `chicken.png`, `cow.png`, `character.png`, `house.png`, `tree_*.png`, `bush.png`, `rock.png`, `sunflower.png`, `nest.png`, `chest.png`, `bridge.png`, `chicken_house.png`, `Grass.png`, `Water.png`, `Hills.png`, `Wooden House.png`.

## 2. Règles absolues (à ne jamais casser)

1. **Un seul fichier.** Tout reste inline dans `index.html` (CSS + JS). Ne crée pas de `.css`/`.js` séparés, pas de bundler.
2. **Zéro dépendance externe** (hors Google Fonts). Ne charge PAS de CDN (Phaser, jQuery…) : ça a été volontairement évité pour la fiabilité et le hors-ligne. Tout est en Canvas 2D / JS vanilla.
3. **Emojis : uniquement des emojis anciens et sûrs** (≤ 2015). Les emojis récents (ex. 🪙 « coin » de 2020) s'affichent en carré « ▯ » sur beaucoup de systèmes. La pièce de monnaie est dessinée en **CSS** (`.coin-ic`), pas en emoji — garde ce principe pour toute nouvelle icône douteuse.
4. **Exercice « Compléter » (fill)** : le champ `hint` d'une phrase DOIT apparaître **en minuscules**, comme mot entier, dans la phrase `en`. `makeFill` remplace `\bhint\b` **sensible à la casse**. Un hint qui n'y est pas (ex. mot en début de phrase avec majuscule) casse l'exercice. Toujours valider (voir §6).
5. **État & compatibilité** : le state se charge via `S = {...defaults, ...JSON.parse(localStorage)}`. Quand tu ajoutes un champ au state, ajoute-le AUSSI aux valeurs par défaut de `let S={...}` et protège l'accès avec une fonction `ensureX()` (comme `ensureStats`, `ensureDaily`) car d'anciens joueurs ont un state sans ce champ.
6. **Ne renomme jamais la clé localStorage** `eq_v4` sans plan de migration (ça effacerait la progression des joueurs).
7. **Assets** : tout PNG référencé par le JS/CSS doit être commité à la racine, à côté de `index.html` (sinon 404 sur GitHub Pages).

## 3. Architecture du JS (ordre dans le `<script>`)

- **Données** (grosses constantes, ~90 % du fichier) :
  - `SENTENCES` (~ligne 354) : 3000 phrases `{en,fr,hint}`, 500 par niveau (corpus Tatoeba, traductions humaines). Sert de banque de distracteurs et de repli.
  - `VOCAB`, `DB` : anciens vocab + `DB.levelInfo` (noms/couleurs des niveaux), `DB.modules`, `DB.expressions` (expressions du jour). `DB.unlocks`/`DB.badges` sont **hérités et inertes** (voir §5).
  - `LEVEL_ORDER = ["A1".."C2"]`, `LESSONS_PER_LEVEL = 10`.
  - `CURRICULUM` (~ligne 3377) : **60 mini-cours** (6 niveaux × 10). Chaque leçon riche = `{t:'G'|'V', title, intro, formsTitle, forms:[[a,b]], sections:[{h,body}], examples:[[en,fr]], pitfalls:[], keypoints:[], drills:[{q,options,answer,exp}], practice:[{en,fr,hint}]}`.
  - `SHOP` (~ligne 3585) : articles de boutique (personnages + décors). `TROPHIES` (~ligne 3721) : 33 succès.
- **State** : `let S` (persisté, clé `eq_v4`) et `let EX` (état volatil de la leçon en cours).
- **Fonctions** : navigation (`go`), rendu des pages (`renderHome`, `renderLearnLevels`, `openLevel`/`renderLessonPath`, `renderTeach`, `renderShop`, `renderBadges`, `renderMap`→`startIsland`), moteur d'exercices (`openLesson`→`renderTeach`→`startLesson`→`buildMixedLesson`→`renderQ`→`grade`→`showLessonReward`/`showLessonFail`), économie (`buyItem`, `ownedBonuses`), succès (`checkTrophies`), moteurs Canvas (île `islandLoop`, walkers `walkerLoop`, mascotte `heroPetLoop`), sons WebAudio (`playSound`), thème (`applyTheme`/`toggleTheme`).

## 4. Boucle de jeu (comment ça s'enchaîne)

`Parcours` (10 nœuds/niveau) → clic sur un nœud → `openLesson(lv,idx)` → **fiche de cours** `renderTeach` → bouton « Commencer les exercices » → `startLesson` → `buildMixedLesson` (≈ 4 *drills* ciblés + exercices `fill/order/listen/qcm/speak` construits **depuis `practice`** de la leçon) → `renderQ`/`grade` (❤ cœurs, XP, combos, sons) → fin : `showLessonReward` (récompense + pièces + confettis) ou `showLessonFail` (plus de cœurs).

- **Cœurs** : 5 par leçon, −1 par erreur, 0 = échec. **XP** : `S.points`. **Pièces** : `S.coins` (monnaie séparée, gagnée par leçon, dépensée en boutique). Bonus passifs des personnages possédés via `ownedBonuses()`.
- **Économie** (équilibrée) : ~15 pièces de base + bonus précision + bonus 1re fois + bonus persos. Ne déséquilibre pas sans raison.

## 5. Systèmes hérités (inertes — ne pas réactiver)

`award()` est un **no-op**. `checkUnlocks()` retourne `null`. `DB.badges`/`DB.unlocks`, `S.badges`/`S.unlocks`/`S.completed` sont d'anciens systèmes remplacés par `TROPHIES`/`checkTrophies` et `S.lessons`/`S.trophies`/`S.stats`. Les laisser tranquilles (compat), ne pas rebrancher.

## 6. Éditer les données via un générateur Python (recommandé)

Les gros blocs (`SENTENCES`, `CURRICULUM`) ont été générés par des scripts Python qui **produisent le JS** puis l'**injectent** par remplacement d'ancre. Reproduis ce schéma pour toute grosse édition, et **valide toujours** :

- Pour chaque `practice`, vérifier `re.search(r'\b'+re.escape(hint)+r'\b', en)` (sinon le fill casse — piège n°1).
- Pour chaque `drill`, vérifier que `answer` ∈ `options`.
- Après injection : `node --check` sur le contenu du `<script>` (extrais-le d'abord). La syntaxe DOIT passer.

Ajouter : **une leçon** = un objet dans `CURRICULUM[lv]` (garde `LESSONS_PER_LEVEL=10` cohérent). **Un article boutique** = un objet dans `SHOP` (+ un slot dans `DECOR_SLOTS` si décor). **Un trophée** = un objet dans `TROPHIES` (`{id,c,t,ic,nm,ds,p:(S)=>valeur,g:cible}`), `id` unique, `ic` = emoji sûr.

## 7. Tester (obligatoire avant de livrer)

Test headless avec le Chromium préinstallé (`/opt/pw-browsers/...`) + Playwright (`/opt/node-tools/node_modules/playwright`). Charger la page en `file://`, router pour bloquer le réseau externe (`page.route` → `abort` si pas `file:`), et écouter `pageerror`.

**Pièges de test :**
- En `file://`, dessiner des images dans un canvas le « teinte » → `getImageData` lève une SecurityError. **Ne pas** lire les pixels en test ; vérifier via des screenshots et l'état JS. (Sur GitHub Pages, même origine → pas de problème.)
- Les moteurs Canvas utilisent `performance.now()` + `dt` : les vitesses sont en **px/seconde** (`v*dt/1000`). Ne réintroduis jamais un facteur du type `*40*dt/dt` (bug corrigé qui faisait tressauter les persos de l'île).
- Le modal « Expressions du jour » s'ouvre au démarrage : le fermer (bouton « Commencer ») avant de screenshoter.

## 8. Livraison / déploiement

- Ne peut pas être poussé depuis l'environnement Claude (auth GitHub bloquée) : **c'est l'utilisateur qui pousse** depuis sa machine. Livrer le fichier, puis donner la commande `cp … && git add … && git commit && git push`.
- GitHub Pages redéploie en ~1 min ; la page peut être en cache → **Ctrl+Maj+R** (ou navigation privée) pour voir les changements. Le code sur GitHub ≠ ce que le navigateur affiche (cache).
- Attribution des commits : voir les consignes de la session.

## 9. Optimisations possibles (si demandé)

- Le fichier est gros surtout à cause des **3000 phrases** de `SENTENCES`. Options si besoin de l'alléger : (a) réduire à ~200 phrases/niveau ; (b) externaliser `SENTENCES` dans un `sentences.json` chargé en `fetch` (romprait le « fichier unique » — à ne faire que sur demande explicite). Ne pas minifier à la main (illisible pour l'édition).
- Perf runtime : les boucles Canvas (île/walkers/mascotte) tournent en `requestAnimationFrame` et s'auto-arrêtent quand leur page n'est pas active — garde ce garde-fou (`classList.contains('active')`) pour tout nouveau moteur.
