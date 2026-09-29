// Moteur de la carte du royaume de « Scriptoria » (canvas 2D, pixel art Tiny Swords).
// - carte générée depuis Tiled (src/data/world.json + public/ts/land-*.png, land.png = vue d’ensemble)
// - écume, arbres, soldats, feux… animés image par image
// - objets achetés au marché : déplaçables à la souris / au doigt, les personnages se promènent
// - îles verrouillées recouvertes de brouillard tant que les quêtes ne sont pas faites
// - tous les personnages (achetés ou du décor) se prennent et se déplacent, jamais dans l'eau
import WORLD_JSON from '../data/world.json';
import RAMPS_JSON from '../data/ramps.json';
import { createOcean } from './ocean';
import { SPRITES, spriteUrl, uiUrl, type SpriteDef } from './sprites';
import { RANK_MAX, SHOP_MAP, WORKER_JOBS, houseVariants, jobOf, storageCaps, trainedRank } from '../data/shop';

// Gens de métier : les trois spécialistes plus le « villageois » polyvalent d'avant la scission,
// qu'on croise encore dans le décor de la carte et dans les rangs des rivaux.
const WORKER_RE = new RegExp(`^(villageois|${WORKER_JOBS.map((j) => j.base).join('|')})`);
/**
 * Donne un métier à un villageois du décor. La répartition est tirée sur l'INDICE du décor, pas au
 * hasard : le décor est reconstruit depuis `world.json` à chaque chargement, et un vrai tirage ferait
 * changer de métier au même bonhomme d'une session à l'autre. La couleur est préservée telle quelle.
 */
function splitWorker(key: string, seed: number): string {
  const m = /^villageois(-(?:rouge|jaune|violet|noir))?$/.exec(key);
  return m ? WORKER_JOBS[seed % WORKER_JOBS.length].base + (m[1] ?? '') : key;
}

export interface WorldData {
  w: number;
  h: number;
  ts: number;
  levels: string[];
  blocked: string[];
  island: string[];
  islands: { name: string; unlock: number; cx: number; cy: number; size: number }[];
  foam: [number, number][];
  decor: [string, number, number, number][]; // clé, x centre, y bas de l'image, nuage ?
}

export const WORLD = WORLD_JSON as unknown as WorldData;
const TS = WORLD.ts;
export const WORLD_W = WORLD.w * TS;
export const WORLD_H = WORLD.h * TS;
const WATER = '#47aba9';

// ---------- Combat (Phase 3) ----------
// Stats par type d'unité (portée en cases, attaque = intervalle en s). `ranged` tire une flèche,
// `heal` soigne les alliés au lieu d'attaquer. Le villageois ne se bat pas (dmg 0) mais a des PV.
interface CombatDef {
  hp: number;
  dmg: number;
  range: number; // portée en cases
  atk: number; // intervalle entre deux attaques (s)
  ranged?: boolean;
  heal?: boolean;
}
const COMBAT: Record<string, CombatDef> = {
  guerrier: { hp: 120, dmg: 18, range: 1.3, atk: 1.0 },
  lancier: { hp: 100, dmg: 22, range: 1.6, atk: 1.1 },
  archer: { hp: 70, dmg: 14, range: 4.5, atk: 1.3, ranged: true },
  moine: { hp: 90, dmg: 18, range: 3.0, atk: 1.6, heal: true },
  villageois: { hp: 60, dmg: 0, range: 0, atk: 1 },
  // Les trois métiers ont la constitution du villageois dont ils sont issus : ils ne se battent pas.
  bucheron: { hp: 60, dmg: 0, range: 0, atk: 1 },
  mineur: { hp: 60, dmg: 0, range: 0, atk: 1 },
  chasseur: { hp: 60, dmg: 0, range: 0, atk: 1 },
  tour: { hp: 500, dmg: 13, range: 5.5, atk: 0.9, ranged: true },
};
// ---------- Grades (niveaux 1 → 3) ----------
// Un soldat gagne en PV et en dégâts, jamais en cadence ni en portée : sinon un vétéran distancerait
// tellement la troupe de base que le nombre ne voudrait plus rien dire.
// Indexé par niveau − 1.
const RANK_HP = [1, 1.35, 1.8];
const RANK_DMG = [1, 1.3, 1.65];
// Vétérance : ennemis abattus qu'il faut pour gagner un grade au mérite (sans rien acheter).
const VET_STEPS = [3, 8];
const vetBonus = (xp = 0) => (xp >= VET_STEPS[1] ? 2 : xp >= VET_STEPS[0] ? 1 : 0);

const AGGRO_TILES = 7; // distance à laquelle une unité repère un ennemi
const SIEGE_TILES = 10; // distance à laquelle elle se rabat sur un bâtiment ennemi (faute d'unité à combattre)
// Fraction de l'animation d'attaque (à 10 img/s) au bout de laquelle l'arme « touche » :
// c'est à cet instant précis que les dégâts s'appliquent / que la flèche part.
const IMPACT_FRAC = 0.45;
// `(?![a-z])` : sinon « archerie » (le bâtiment) serait lu comme « archer » (l'unité) et hériterait
// de ses 70 PV. La clé doit s'arrêter là ou continuer par un tiret de couleur (« archer-rouge »).
const combatBase = (key: string): string | null =>
  /^(guerrier|lancier|archer|moine|villageois|bucheron|mineur|chasseur|tour)(?![a-z])/.exec(key)?.[1] ?? null;

/**
 * Couleur du royaume à qui appartient une entité, lue dans sa clé de sprite. Pure : elle ne dépend
 * que de la clé, d'où sa place au niveau module (la construction du monde en a besoin avant que la
 * closure de `createWorld` ne soit prête).
 *
 * ⚠️ C'EST LE POINT FRAGILE DU MOTEUR. Il a déjà mordu deux fois :
 *  - `violette?` signifie « violett » + « e » optionnel : `-violet` n'était pas reconnu ;
 *  - sans `(?:-\d+)?`, les 12 maisons numérotées retombaient sur « bleu » par défaut, donc alliées
 *    du joueur et ennemies de leur propre royaume (un lancier violet rasait sa maison).
 * Le motif est ancré à la fin : ne JAMAIS ajouter de suffixe à une clé de sprite (un grade, un
 * numéro d'escouade…) sans rouvrir cette expression — sinon l'entité redevient « bleu », c'est-à-dire
 * un ennemi qui passe allié.
 */
const factionOf = (key: string): string => {
  const m = /-(bleue?|rouge|jaune|violet(?:te)?|noire?)(?:-\d+)?$/.exec(key);
  if (!m) return 'bleu';
  const c = m[1];
  return c.startsWith('viol') ? 'violet' : c.startsWith('noir') ? 'noir' : c.startsWith('bleu') ? 'bleu' : c;
};

// ---------- Siège (Phase 4) ----------
// Les bâtiments ont des PV et peuvent être rasés : c'est ce qui permet de conquérir une île.
// Beaucoup de PV pour que la chute d'un royaume soit un vrai objectif, pas un accident.
const SIEGE: Record<string, number> = {
  chateau: 1400, // ~15 s pour un escadron de 5, mais plus d'une minute pour un isolé : un siège se prépare
  caserne: 600,
  archerie: 500,
  monastere: 480,
  maison: 300,
};
const siegeBase = (key: string): string | null => /^(chateau|caserne|archerie|monastere|maison)/.exec(key)?.[1] ?? null;
// Bois qu'il faut pour relever un bâtiment RASÉ à neuf ; on n'en facture que la part manquante.
const REPAIR_WOOD: Record<string, number> = { chateau: 120, caserne: 60, archerie: 50, monastere: 45, maison: 30, tour: 40 };
/**
 * Prix en bois d'une réparation, proportionnel aux dégâts. 0 = rien à réparer, ou objet qu'on ne
 * répare pas (une unité se soigne, elle ne se reconstruit pas).
 */
export function repairCost(key: string, hp: number, maxHp: number): number {
  const base = REPAIR_WOOD[siegeBase(key) ?? (/^tour/.test(key) ? 'tour' : '')];
  if (!base || !maxHp || hp >= maxHp) return 0;
  return Math.max(1, Math.ceil(((maxHp - hp) / maxHp) * base));
}
// PV de départ d'une clé, unité comme bâtiment (undefined = objet indestructible : arbre, or, rocher…).
// `rank` ne concerne que les soldats : un bâtiment n'a pas de grade, son total ne bouge pas.
const maxHpOf = (key: string, rank = 1): number | undefined => {
  const unit = COMBAT[combatBase(key) ?? '']?.hp;
  if (unit !== undefined) return Math.round(unit * RANK_HP[Math.min(RANK_MAX, Math.max(1, rank)) - 1]);
  return SIEGE[siegeBase(key) ?? ''];
};

// ---------- Récolte (Phase 1) ----------
// Nœuds récoltables de la carte : un villageois s'en approche et joue l'animation d'action
// correspondante (villageois.act[] : 0 = hache/bois, 1 = pioche/or, 2 = marteau).
// `cycles` = nombre de coups avant épuisement ; le nœud repousse après `regrowMs`.
export type ResKind = 'wood' | 'gold' | 'food';
interface HarvestDef {
  resource: ResKind;
  actIndex: number;
  yield: number; // ressources créditées par cycle
  cycles: number; // cycles avant épuisement
  regrowMs: number; // délai de repousse
  depletedKey?: string; // sprite « épuisé » (souche) pendant la repousse
}
const HARVEST: Record<string, HarvestDef> = {
  'sapin-1': { resource: 'wood', actIndex: 0, yield: 1, cycles: 3, regrowMs: 20000, depletedKey: 'souche-1' },
  'sapin-2': { resource: 'wood', actIndex: 0, yield: 1, cycles: 3, regrowMs: 20000, depletedKey: 'souche-2' },
  'arbre-jaune': { resource: 'wood', actIndex: 0, yield: 1, cycles: 3, regrowMs: 20000, depletedKey: 'souche-1' },
  'arbre-orange': { resource: 'wood', actIndex: 0, yield: 1, cycles: 3, regrowMs: 20000, depletedKey: 'souche-2' },
  // Un filon rapportait 6 pièces puis dormait 30 s : avec deux filons sur l'île natale, six mineurs
  // se relayaient pour ~10 pièces la minute et passaient leur vie à attendre. On l'a rendu digne d'un
  // métier à plein temps, sans toucher au bois ni à la viande (eux ne manquent pas de nœuds).
  or: { resource: 'gold', actIndex: 1, yield: 3, cycles: 4, regrowMs: 22000 },
  'or-petit': { resource: 'gold', actIndex: 1, yield: 2, cycles: 3, regrowMs: 22000 },
  'or-gros': { resource: 'gold', actIndex: 1, yield: 5, cycles: 5, regrowMs: 22000 },
  // Le mouton se dépèce au COUTEAU (act[3]) : jusqu'ici on l'abattait à la hache à bois.
  mouton: { resource: 'food', actIndex: 3, yield: 1, cycles: 2, regrowMs: 25000 },
};

export interface Placed {
  k: string;
  id: string;
  x: number; // position des pieds (px monde)
  y: number;
  xp?: number; // ennemis abattus par ce soldat : sa vétérance, conservée d'une session à l'autre
}

// ---------- Aides pures (utilisables hors canvas : marché, sauvegarde) ----------
export function islandAt(cx: number, cy: number): number {
  if (cx < 0 || cy < 0 || cx >= WORLD.w || cy >= WORLD.h) return -1;
  const c = WORLD.island[cy][cx];
  return c === '.' ? -1 : c.charCodeAt(0) - 65;
}
const levelAt = (cx: number, cy: number) =>
  cx < 0 || cy < 0 || cx >= WORLD.w || cy >= WORLD.h ? 0 : +WORLD.levels[cy][cx];
const blockedAt = (cx: number, cy: number) => WORLD.blocked[cy]?.[cx] === '1';

// ---------- Rampes et régions de marche ----------
// Le terrain est en gradins. Au bout de chaque falaise, la carte dessine DÉJÀ un biseau d'herbe en
// diagonale : la rampe par laquelle on monte d'un palier à l'autre. Mais dans world.json cette case
// est marquée « bloquée » exactement comme la pierre de la falaise. Le moteur ne faisait donc aucune
// différence entre une rampe et un mur : une unité restait prisonnière de son palier à vie et venait
// se coller à la paroi sous l'ennemi qu'elle visait.
// `bun gen-ramps.ts` sépare les deux en relisant l'image (une rampe est verte, une falaise est en
// pierre) et écrit ici les cases franchissables et ce qu'elles relient. Aucun art n'est ajouté.
export interface Passage {
  a: [number, number];
  b: [number, number];
}
const RAMP_DATA = RAMPS_JSON as { cells: [number, number][]; passages: { ax: number; ay: number; bx: number; by: number }[] };
const rampCell = new Set(RAMP_DATA.cells.map(([x, y]) => `${x},${y}`));
/** Case de rampe : bloquée dans les données, mais dessinée comme une pente — on y passe. */
export const isRamp = (cx: number, cy: number) => rampCell.has(`${cx},${cy}`);
const PASSAGES: Passage[] = RAMP_DATA.passages.map((p) => ({ a: [p.ax, p.ay], b: [p.bx, p.by] }));

const groundAt = (cx: number, cy: number) => levelAt(cx, cy) > 0 && !blockedAt(cx, cy);
/** Praticable : le sol normal, plus les rampes. */
const passableAt = (cx: number, cy: number) => levelAt(cx, cy) > 0 && (!blockedAt(cx, cy) || isRamp(cx, cy));
/**
 * Un pas de la case (ax,ay) vers (bx,by) est-il légal ? On ne change de palier QUE par une rampe :
 * sans ce contrôle par paire, une unité couperait le coin d'une falaise en diagonale.
 */
export function canStep(ax: number, ay: number, bx: number, by: number): boolean {
  if (!passableAt(bx, by)) return false;
  if (ax === bx && ay === by) return true;
  if (levelAt(ax, ay) === levelAt(bx, by)) return true;
  return isRamp(ax, ay) || isRamp(bx, by);
}

// Régions : composantes connexes de sol de même niveau et même île. Deux régions ne communiquent que
// par un escalier. Tout ceci ne dépend que du terrain : calculé UNE fois (~10 000 cases), jamais
// recalculé — d'où le choix d'un graphe de régions plutôt que d'un A* sur la grille à chaque pas.
const REGION = new Int32Array(WORLD.w * WORLD.h).fill(-1);
const REGION_ISLAND: number[] = [];
let REGION_COUNT = 0;
for (let y = 0; y < WORLD.h; y++)
  for (let x = 0; x < WORLD.w; x++) {
    if (!groundAt(x, y) || REGION[y * WORLD.w + x] >= 0) continue;
    const id = REGION_COUNT++;
    const lvl = levelAt(x, y);
    const isl = islandAt(x, y);
    REGION_ISLAND.push(isl);
    const stack: [number, number][] = [[x, y]];
    REGION[y * WORLD.w + x] = id;
    while (stack.length) {
      const [px, py] = stack.pop()!;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const nx = px + dx;
        const ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= WORLD.w || ny >= WORLD.h) continue;
        if (REGION[ny * WORLD.w + nx] >= 0) continue;
        if (!groundAt(nx, ny) || levelAt(nx, ny) !== lvl || islandAt(nx, ny) !== isl) continue;
        REGION[ny * WORLD.w + nx] = id;
        stack.push([nx, ny]);
      }
    }
  }
/** Région de marche d'une case (-1 : eau, falaise, ou case bloquée). */
export const regionAt = (cx: number, cy: number): number =>
  cx < 0 || cy < 0 || cx >= WORLD.w || cy >= WORLD.h ? -1 : REGION[cy * WORLD.w + cx];

// Graphe des régions : une arête par escalier. Quelques dizaines de nœuds — un parcours y est
// instantané, et le résultat ne changeant jamais, on le mémorise.
// Une « étape » est un passage orienté : on rejoint `from`, puis on vise `to` de l'autre côté de la
// rampe. L'orientation compte — sinon l'unité ne sait pas par quel côté aborder la pente.
export interface Step {
  from: [number, number];
  to: [number, number];
}
const REGION_LINKS: { to: number; step: Step }[][] = Array.from({ length: REGION_COUNT }, () => []);
for (const p of PASSAGES) {
  const a = regionAt(p.a[0], p.a[1]);
  const b = regionAt(p.b[0], p.b[1]);
  if (a < 0 || b < 0 || a === b) continue;
  REGION_LINKS[a].push({ to: b, step: { from: p.a, to: p.b } });
  REGION_LINKS[b].push({ to: a, step: { from: p.b, to: p.a } });
}
const routeCache = new Map<string, Step[] | null>();
/**
 * Suite de passages à emprunter pour aller de la région `from` à la région `to`.
 * `[]` = même région (rien à franchir), `null` = aucun chemin (cible inatteignable).
 */
export function passageRoute(from: number, to: number): Step[] | null {
  if (from < 0 || to < 0) return null;
  if (from === to) return [];
  const key = `${from}|${to}`;
  const hit = routeCache.get(key);
  if (hit !== undefined) return hit;
  // Parcours en largeur : le premier chemin trouvé est le plus court en nombre de passages.
  const prev = new Map<number, { from: number; step: Step }>();
  const seen = new Set([from]);
  const queue = [from];
  let found = false;
  for (let i = 0; i < queue.length && !found; i++) {
    for (const link of REGION_LINKS[queue[i]]) {
      if (seen.has(link.to)) continue;
      seen.add(link.to);
      prev.set(link.to, { from: queue[i], step: link.step });
      if (link.to === to) {
        found = true;
        break;
      }
      queue.push(link.to);
    }
  }
  let route: Step[] | null = null;
  if (found) {
    route = [];
    for (let r = to; r !== from; ) {
      const back = prev.get(r)!;
      route.unshift(back.step);
      r = back.from;
    }
  }
  routeCache.set(key, route);
  return route;
}
/** Y a-t-il un chemin de la case (ax,ay) vers (bx,by) ? Sert à écarter les cibles inatteignables. */
export const reachable = (ax: number, ay: number, bx: number, by: number): boolean =>
  passageRoute(regionAt(ax, ay), regionAt(bx, by)) !== null;

export function unlockedIslands(missionsDone: number): Set<number> {
  return new Set(WORLD.islands.map((isl, i) => (missionsDone >= isl.unlock ? i : -1)).filter((i) => i >= 0));
}

// L'île natale, celle qu'on possède sans rien débloquer.
export const HOME_ISL = WORLD.islands.findIndex((i) => i.unlock === 0);
// Bâtiments que la carte pose d'emblée sur l'île natale (château, tour, maisons, monastère).
// `WORLD.decor` ne bouge jamais, on ne parcourt donc ce tableau de 845 entrées qu'une seule fois.
// Ils appartiennent tous au joueur par construction : `recolorKey` recolore TOUT le décor natal à
// sa couleur — d'où l'absence de test de faction ici.
const HOME_BUILDINGS: [string, string][] = WORLD.decor
  .map(([key, x, y, cloud], index) => {
    if (cloud || islandAt(Math.floor(x / TS), Math.floor(y / TS)) !== HOME_ISL) return null;
    if (!siegeBase(key) && !/^tour/.test(key)) return null;
    return [String(index), key] as [string, string];
  })
  .filter((e): e is [string, string] => e !== null);

/**
 * Clés des bâtiments de décor de l'île natale encore debout. Ils comptent dans le plafond de
 * stockage au même titre que ceux qu'on construit : sinon on démarre avec un château sous les yeux
 * et un plafond de départ qui l'ignore. Un bâtiment rasé au siège sort de la liste (et le plafond
 * redescend, c'est voulu).
 */
export function homeBuildings(decorRemoved?: string[]): string[] {
  if (!decorRemoved?.length) return HOME_BUILDINGS.map(([, key]) => key);
  const gone = new Set(decorRemoved);
  return HOME_BUILDINGS.filter(([id]) => !gone.has(id)).map(([, key]) => key);
}

/** Plafond de stockage réel : ce qu'on a construit + le bâti d'origine de l'île natale. */
export function capsWith(placed: { id: string }[], decorRemoved?: string[]) {
  return storageCaps([...placed, ...homeBuildings(decorRemoved).map((id) => ({ id }))]);
}

export function nextUnlock(missionsDone: number): { name: string; remaining: number } | null {
  const next = WORLD.islands
    .filter((i) => i.unlock > missionsDone && i.size > 12)
    .sort((a, b) => a.unlock - b.unlock)[0];
  return next ? { name: next.name, remaining: next.unlock - missionsDone } : null;
}

export function canPlaceAt(x: number, y: number, unlocked: Set<number>): boolean {
  return cellOk(Math.floor(x / TS), Math.floor(y / TS), unlocked);
}
function cellOk(cx: number, cy: number, unlocked: Set<number>) {
  const isl = islandAt(cx, cy);
  return isl >= 0 && unlocked.has(isl) && levelAt(cx, cy) > 0 && !blockedAt(cx, cy);
}

// ---------- Emprise au sol (en cases) ----------
// Chaque bâtiment / arbre / rocher occupe des cases : rien d'autre ne peut s'y poser.
// Les personnages et animaux occupent une case mais ne bloquent pas (ils se croisent).
const NO_FOOTPRINT = /^(feu|explosion|ecume|canard|rocher-eau|nuage)/;
export interface Footprint {
  w: number;
  h: number;
  blocks: boolean; // empêche les autres objets de se poser dessus
  unit: boolean; // personnage / animal
}
export function footprint(key: string): Footprint | null {
  const def = SPRITES[key];
  if (!def || NO_FOOTPRINT.test(key)) return null;
  if (def.run || def.act || /units|sheep/.test(def.src)) return { w: 1, h: 1, blocks: false, unit: true };
  if (def.src.includes('buildings')) {
    const w = Math.max(2, Math.ceil(def.fw / TS));
    return { w, h: w >= 5 ? 3 : 2, blocks: true, unit: false };
  }
  return { w: 1, h: 1, blocks: true, unit: false };
}
/**
 * Un objet qui ARRÊTE une unité en marche. Seuls les bâtiments en sont : on ne traverse pas un mur.
 *
 * Arbres, buissons, rochers et filons bloquent la CONSTRUCTION (`footprint().blocks`) mais jamais la
 * marche. C'est volontaire et c'est la correction d'un vrai blocage : le chemin (A*) ne raisonne que
 * sur le terrain, il traçait donc tout droit à travers un bosquet, puis le pas était refusé case par
 * case — l'unité se collait au buisson et attendait. Sur une carte de 480 arbres, ça arrivait sans
 * arrêt. Les décors se traversent maintenant ; le tri en profondeur fait passer l'unité derrière.
 */
export function blocksWalk(key: string): boolean {
  return !!SPRITES[key]?.src.includes('buildings');
}
/** Case d'ancrage d'un objet déjà posé — MÊME calcul que `cellsOf`, une seule vérité. */
export function cellAt(x: number, y: number): [number, number] {
  return [Math.floor(x / TS), Math.floor((y - 8) / TS)];
}
/**
 * Décalage de centrage pour les décors 1×1 plus hauts qu'une case (or : 128px, arbres : 256px).
 * Leur visuel est recentré sur la case occupée. IMPORTANT : `snapTo` DOIT recalculer la case avec
 * ce même décalage (voir plus bas), sinon un déplacement fait dériver l'objet d'une case.
 */
// (Historique : on décalait autrefois les décors hauts vers le haut pour « recentrer » leur visuel,
//  mais ça plaçait la case d'occupation/sélection au-dessus de l'arbre. On ancre désormais tout objet
//  sur la case de sa base — la case de sélection est bien SOUS l'arbre, comme attendu.)
function decorLift(_key: string): number {
  return 0;
}
// Recolore une clé BLEUE (sans suffixe) vers la couleur du royaume du joueur. Les clés neutres
// (arbres, or, buissons, moutons) et déjà colorées sont renvoyées telles quelles.
const FEM: Record<string, string> = { rouge: 'rouge', jaune: 'jaune', violet: 'violette', noir: 'noire' };
function recolorKey(key: string, fac: string): string {
  if (fac === 'bleu') return key;
  const mh = /^maison-bleue-(\d)$/.exec(key);
  if (mh) return `maison-${FEM[fac]}-${mh[1]}`;
  if (/^(tour|caserne|archerie)$/.test(key)) return `${key}-${FEM[fac]}`;
  if (/^(chateau|monastere|guerrier|lancier|archer|moine|villageois|bucheron|mineur|chasseur)$/.test(key)) return `${key}-${fac}`;
  return key;
}
/** Case en bas à gauche de l'emprise d'un objet dont les pieds sont en (x, y). */
function anchorOf(fp: Footprint, x: number, y: number, lift = 0) {
  return { c0: Math.round(x / TS - fp.w / 2), cy: Math.floor((y - lift - 8) / TS) };
}
export function cellsOf(key: string, x: number, y: number): [number, number][] {
  const fp = footprint(key);
  if (!fp) return [];
  const { c0, cy } = anchorOf(fp, x, y, decorLift(key));
  const out: [number, number][] = [];
  for (let dy = 0; dy < fp.h; dy++) for (let dx = 0; dx < fp.w; dx++) out.push([c0 + dx, cy - dy]);
  return out;
}
/** Aimante un objet sur la grille : renvoie la position des pieds parfaitement calée. */
export function snapTo(key: string, wx: number, wy: number) {
  const fp = footprint(key) ?? { w: 1, h: 1, blocks: false, unit: true };
  // On calcule la case avec le MÊME décalage que l'occupancy (cellsOf) → snapTo est idempotent :
  // re-poser un objet déjà calé ne le décale plus (fini la dérive des décors hauts : or, arbres).
  const { c0, cy } = anchorOf(fp, wx, wy, decorLift(key));
  return {
    x: (c0 + fp.w / 2) * TS,
    y: fp.w >= 2 ? (cy + 1) * TS + 4 : cy * TS + TS * 0.75 + decorLift(key),
  };
}
export type Occupancy = Map<string, string>; // "cx,cy" -> identifiant de l'objet
export function buildOcc(items: { id: string; key: string; x: number; y: number }[]): Occupancy {
  const occ: Occupancy = new Map();
  for (const it of items) {
    const fp = footprint(it.key);
    if (!fp?.blocks) continue;
    for (const [cx, cy] of cellsOf(it.key, it.x, it.y)) occ.set(`${cx},${cy}`, it.id);
  }
  return occ;
}
/** Occupation de tout l'archipel à partir de la sauvegarde (utilisable hors canvas, ex. marché). */
export function worldOccupancy(placed: Placed[], decorPos: Record<string, [number, number]> = {}, decorRemoved: string[] = []) {
  const items: { id: string; key: string; x: number; y: number }[] = [];
  WORLD.decor.forEach(([key, x, y, cloud], i) => {
    const def = SPRITES[key];
    if (!def || cloud || decorRemoved.includes(String(i))) return;
    const saved = decorPos[String(i)];
    items.push({ id: `decor:${i}`, key, x: saved ? saved[0] : x, y: saved ? saved[1] : y - def.feet });
  });
  for (const p of placed) items.push({ id: p.k, key: p.id, x: p.x, y: p.y });
  return buildOcc(items);
}
/** Détail case par case : peut-on poser `key` ici ? (terrain plat, île libérée, cases libres) */
export function checkFit(key: string, x: number, y: number, unlocked: Set<number>, occ: Occupancy, self?: string) {
  const cells = cellsOf(key, x, y);
  const list = cells.length ? cells : [[Math.floor(x / TS), Math.floor(y / TS)] as [number, number]];
  const lvl = levelAt(list[0][0], list[0][1]);
  const isl = islandAt(list[0][0], list[0][1]);
  const res = list.map(([cx, cy]) => {
    const o = occ.get(`${cx},${cy}`);
    const ok = cellOk(cx, cy, unlocked) && levelAt(cx, cy) === lvl && islandAt(cx, cy) === isl && (!o || o === self);
    return { cx, cy, ok };
  });
  return { ok: res.every((r) => r.ok), cells: res };
}

/** Trouve un emplacement libre pour `key` sur une île débloquée (île du château en priorité). */
export function findSpot(
  unlocked: Set<number>,
  taken: Placed[] = [],
  key = '',
  decorPos: Record<string, [number, number]> = {},
  decorRemoved: string[] = [],
): { x: number; y: number } {
  const occ = worldOccupancy(taken, decorPos, decorRemoved);
  // les personnages évitent aussi de s'empiler entre eux
  const units = new Set(taken.map((p) => `${Math.floor(p.x / TS)},${Math.floor((p.y - 8) / TS)}`));
  const home = WORLD.islands.findIndex((i) => i.unlock === 0);
  const spots: { x: number; y: number; home: boolean }[] = [];
  for (let cy = 0; cy < WORLD.h; cy++)
    for (let cx = 0; cx < WORLD.w; cx++) {
      if (!cellOk(cx, cy, unlocked)) continue;
      const pos = snapTo(key, cx * TS + TS / 2, cy * TS + TS * 0.75);
      if (!checkFit(key, pos.x, pos.y, unlocked, occ).ok) continue;
      if (units.has(`${cx},${cy}`)) continue;
      spots.push({ ...pos, home: islandAt(cx, cy) === home });
    }
  const pool = spots.some((s) => s.home) ? spots.filter((s) => s.home) : spots;
  if (!pool.length) return { x: WORLD_W / 2, y: WORLD_H / 2 };
  const s = pool[Math.floor(Math.random() * pool.length)];
  return { x: s.x, y: s.y };
}

// ---------- Moteur ----------
type Ent = {
  key: string;
  def: SpriteDef;
  x: number;
  y: number; // pieds
  ph: number;
  placed?: Placed;
  orig?: { x: number; y: number };
  walks?: boolean;
  tx?: number;
  ty?: number;
  wait?: number;
  face?: number;
  moving?: boolean;
  home?: { isl: number; lvl: number };
  origin?: { x: number; y: number }; // point d'ancrage (décor) : ils restent autour
  radius?: number; // rayon de promenade en cases
  acting?: number; // index de l'action en cours (-1 = aucune)
  actT0?: number;
  actEnd?: number;
  agent?: boolean; // personnage ou animal qui vit sa vie
  id?: string; // index du personnage dans le décor (pour mémoriser son déplacement)
  bounceT0?: number; // petit rebond à l'atterrissage
  // Récolte (Phase 1)
  nodeStock?: number; // cycles restants avant épuisement (nœud récoltable)
  regrowAt?: number; // instant moteur (s) de repousse, sinon undefined
  origKey?: string; // clé d'origine du nœud (pour restaurer après épuisement)
  reservedBy?: string; // clé du villageois qui exploite ce nœud
  seeded?: boolean; // nœud généré au runtime (non sélectionnable, non persisté)
  // Tâche de récolte. `haul` = la charge est sur le dos et l'unité la rapporte au dépôt.
  task?: { node: Ent; phase: 'goto' | 'work' | 'haul'; cyclesLeft: number };
  carry?: ResKind; // ce qu'il porte : change la planche dessinée, rien d'autre
  carryQty?: number; // quantité en main, créditée à la livraison
  // Chemin calculé pour contourner le relief, et sa péremption (on ne refait pas un A* par image).
  path?: [number, number][];
  pathGoal?: string;
  pathAt?: number;
  // Combat (Phase 3)
  hp?: number;
  maxHp?: number;
  dead?: boolean;
  target?: Ent; // ennemi visé
  atkCd?: number; // instant (s) de la prochaine attaque possible
  hurtT?: number; // instant du dernier coup reçu (flash / affichage barre)
  siegeScanAt?: number; // prochain balayage autorisé des bâtiments ennemis (recherche coûteuse)
  raider?: boolean; // ennemi apparu lors d'un raid (nettoyé à sa mort)
  // Ordres du joueur (RTS)
  order?: { x: number; y: number }; // point de marche désigné (attaque-déplacement)
  orderTarget?: Ent; // ennemi précis à pourchasser (au-delà de l'aggro auto)
  // Grade (1 → 3) : entraînement acheté + vétérance gagnée au combat, plafonné à 3. Jamais dans la
  // clé du sprite — `factionOf` lit la fin de la clé, un suffixe de grade en ferait un allié.
  rank?: number;
  xp?: number; // ennemis abattus par CETTE unité
  slide?: number; // côté par lequel on longe l'obstacle en cours (+1 / -1), pour ne pas vibrer sur place
  recoilT?: number; // instant du dernier recul (knockback visuel)
  recoilX?: number; // direction du recul
  recoilY?: number;
  // Coup programmé : les dégâts (ou la flèche) ne partent qu'au moment où l'arme touche (frame d'impact),
  // pas au début de l'animation d'attaque.
  strike?: { at: number; foe: Ent; dmg: number; ranged: boolean; heal?: boolean; oy: number };
  // Ruine d'un bâtiment rasé : dessinée en gris sur place, relevable à moitié prix.
  ruin?: { k: string; id: string };
  // Expédition vers une autre île : l'unité gagne d'abord la côte, puis se met à l'eau.
  cross?: { isl: number; march?: { x: number; y: number }; final?: number }; // final : île visée au bout du voyage
  // Route par les portails : l'unité marche jusqu'au portail de son île, puis ressort à l'autre bout.
  warp?: { x: number; y: number; isl: number; march?: { x: number; y: number } };
  // En pleine traversée : on interpole la position d'une rive à l'autre pour qu'on la VOIE passer.
  // Elle reste hors de portée (ni cible, ni combat, ni case occupée) le temps de la nage.
  sailing?: { x0: number; y0: number; x1: number; y1: number; t0: number; dur: number; isl: number; march?: { x: number; y: number }; final?: number };
  // Pose depuis l'inventaire : objet fantôme pas encore ajouté à la carte (ni placed ni decor).
  fresh?: boolean;
  freshKey?: string; // clé d'inventaire de l'objet en cours de pose
};

export function createWorld(
  canvas: HTMLCanvasElement,
  opts: {
    placed: Placed[];
    unlocked: Set<number>;
    missionsDone: number;
    onMove?: (k: string, x: number, y: number) => void;
    onVariant?: (k: string, id: string) => void; // style de maison changé à la molette
    // `mine` : l'objet est à ta couleur. Les bâtiments ennemis sont sélectionnables (on les inspecte)
    // mais on ne répare évidemment pas le château qu'on assiège.
    onSelect?: (
      k: string | null,
      info?: { id: string; bought: boolean; hp?: number; maxHp?: number; mine?: boolean; rank?: number; xp?: number; ruin?: string },
    ) => void;
    onMoveMode?: (active: boolean) => void;
    onOrderMode?: (active: boolean) => void; // mode « envoyer les troupes » actif ?
    onTroop?: (n: number) => void; // nombre d'unités retenues au lasso (0 = l'ordre part à toute l'île)
    onNotice?: (text: string) => void; // message discret (ex. « île non tenue : impossible de déposer ici »)
    ruins?: { k: string; id: string; x: number; y: number }[]; // bâtiments rasés, relevables
    onRuin?: (id: string, x: number, y: number) => void; // un bâtiment vient d'être rasé : il en reste une ruine
    onPlaceNew?: (k: string, id: string, x: number, y: number) => void; // objet de l'inventaire posé sur la carte
    decorRemoved?: string[]; // personnages du décor supprimés par le joueur
    onDecorRemove?: (id: string) => void;
    decorPos?: Record<string, [number, number]>; // personnages du décor déplacés par le joueur
    onDecorMove?: (id: string, x: number, y: number) => void;
    onHarvest?: (kind: ResKind, amount: number) => void; // ressources récoltées (batché ~1/s)
    stock?: { gold: number; wood: number; food: number }; // réserves actuelles (pour le plafond)
    onUnitLost?: (k: string) => void; // une unité achetée est morte au combat
    damage?: Record<string, number>; // PV restants mémorisés (bâtiments/unités abîmés) au dernier passage
    onDamage?: (batch: Record<string, number>) => void; // PV à mémoriser (batché ~1/s ; 0 = à oublier)
    upgrades?: Record<string, number>; // entraînements achetés (palier par type de soldat)
    onXp?: (batch: Record<string, number>) => void; // vétérance de tes soldats (batché ~1/s)
    onInvasion?: (faction: string, island: string, n: number) => void; // un royaume rival débarque
    onWar?: (attacker: string, defender: string, island: string, n: number) => void; // deux rivaux se font la guerre
    // Un château est tombé. 'perdu' : l'un des tiens, il t'en reste. 'soumis' : c'était le dernier,
    // tu passes sous tutelle. 'pris' : le dernier château d'un rival, et c'est TOI qui l'as abattu.
    // 'rival' : un château rival est tombé, mais son royaume tient encore — simple chronique.
    // `faction` = le camp qui PERD le château ; `winner` = celui qui s'en empare (toi ou un rival).
    onCastle?: (kind: 'perdu' | 'soumis' | 'pris' | 'rival', faction: string, winner?: string) => void;
    playerFaction?: string; // couleur du royaume du joueur (défaut : bleu)
  },
) {
  const ctx = canvas.getContext('2d')!;
  // Petit canvas hors-écran réutilisé pour teinter une image (flash de dégâts « façon Dune »).
  const tintCv = document.createElement('canvas');
  const tintCtx = tintCv.getContext('2d')!;
  const images = new Map<string, HTMLImageElement>();
  const img = (src: string) => {
    let im = images.get(src);
    if (!im) {
      im = new Image();
      im.src = spriteUrl(src);
      images.set(src, im);
    }
    return im;
  };
  // terre découpée en morceaux de 2048 px (chargés seulement quand on les voit)
  // + une version demi-résolution pour la vue d'ensemble
  const CHUNK = 2048;
  const landLow = img('land.png');
  const landChunk = (i: number, j: number) => img(`land-${i}-${j}.png`);
  const foam = img('sprites/foam.png');
  const barBase = new Image();
  barBase.src = uiUrl('smallbar_base.png'); // habillage des barres de vie (pack Tiny Swords)
  const bracket = new Image();
  bracket.src = uiUrl('cursor_04.png'); // les quatre équerres : le traqueur de pose / déplacement
  const paperBanner = new Image();
  paperBanner.src = uiUrl('banner.png'); // bannière de papier (Tiny Swords) : fond des noms d'îles
  // Découpe en 9 morceaux (px source 248×243) : les coins gardent leur forme — dont les deux
  // rouleaux du bas — et seuls les morceaux du milieu s'étirent, pour s'adapter à chaque nom.
  const BN = { w: 248, h: 243, l: 85, r: 83, t: 30, b: 73 };
  function drawPaperBanner(x: number, y: number, w: number, h: number, s: number) {
    const im = paperBanner;
    const L = BN.l * s, R = BN.r * s, T = BN.t * s, B = BN.b * s;
    const sx = [0, BN.l, BN.w - BN.r, BN.w], sy = [0, BN.t, BN.h - BN.b, BN.h];
    const dx = [x, x + L, x + w - R, x + w], dy = [y, y + T, y + h - B, y + h];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) {
        const sw = sx[c + 1] - sx[c], sh = sy[r + 1] - sy[r];
        const dw = dx[c + 1] - dx[c], dh = dy[r + 1] - dy[r];
        if (dw > 0 && dh > 0) ctx.drawImage(im, sx[c], sy[r], sw, sh, dx[c], dy[r], dw + 0.5, dh + 0.5);
      }
  }
  const drawOcean = createOcean(WORLD_W, WORLD_H, TS, WORLD.foam, WORLD.levels);

  let unlocked = opts.unlocked;
  let missionsDone = opts.missionsDone;
  const playerFaction = opts.playerFaction ?? 'bleu';
  // Entraînements payés au Marché, par type de soldat. Mis à jour sans recréer la carte (`setUpgrades`).
  let upgrades: Record<string, number> = opts.upgrades ?? {};
  // Les royaumes rivaux montent en grade au fil de ton avancement : sans ça, tes vétérans
  // transformeraient la seconde moitié de la partie en promenade.
  const aiRank = () => (unlocked.size >= 16 ? 3 : unlocked.size >= 8 ? 2 : 1);
  /** Grade d'une unité à partir de sa seule clé : sert à la construire, avant qu'elle n'existe. */
  function rankFor(key: string, xp?: number): number {
    const base = combatBase(key);
    if (!base || !COMBAT[base] || COMBAT[base].dmg === 0) return 1; // villageois, tour, bâtiment
    const trained = factionOf(key) === playerFaction ? trainedRank(upgrades, base) : aiRank();
    return Math.min(RANK_MAX, trained + vetBonus(xp));
  }
  /** PV de départ : le total du grade, rogné par les dégâts éventuellement mémorisés. */
  function hpFor(key: string, rank: number, saved?: number): number | undefined {
    const max = maxHpOf(key, rank);
    if (max === undefined) return undefined;
    return Math.max(1, Math.min(max, saved ?? max));
  }
  // PV mémorisés au dernier passage, et lot de PV à remémoriser (0 = l'entité a disparu, on oublie
  // la clé). Déclarés ici : le décor et les objets placés sont construits juste en dessous.
  const savedDamage = opts.damage ?? {};
  const pendingDamage: Record<string, number> = {};
  // Vétérance à remonter au React, batchée comme les PV (~1×/s) : un kill par-ci par-là ne vaut pas
  // un rendu complet de la page.
  const pendingXp: Record<string, number> = {};
  const homeIsl = HOME_ISL;
  // Index du décor rasé (persisté + ce qui tombe pendant la partie) : sert à faire redescendre le
  // plafond de stockage quand un bâtiment de l'île natale est détruit.
  const razedHome = new Set(opts.decorRemoved ?? []);
  // Déclaré ici et pas avec `caps` plus bas : `setPlaced` le lève dès la construction du monde.
  let capsDirty = true;
  let W = 300;
  let H = 300;
  let DPR = 1;
  const cam = { x: WORLD.islands[0]?.cx ?? WORLD_W / 2, y: WORLD_H / 2, z: 1 };
  let raf = 0;
  let flushTimer = 0;
  let last = performance.now();
  let t = 0;
  let selected: string | null = null;
  let moveEnt: Ent | null = null; // mode « Déplacer » (bouton) : on touche une case pour poser
  let ghost: { x: number; y: number } | null = null;
  let flashBad = 0; // instant du dernier refus (case rouge qui tremble)
  // Effets visuels : poussière, onde, choc de combat, gerbe de sable, chiffres de dégâts, marqueur d'ordre.
  const effects: {
    x: number;
    y: number;
    t0: number;
    kind: 'dust' | 'ring' | 'wake' | 'hit' | 'slash' | 'sand' | 'dmg' | 'rally';
    s?: number; // échelle
    vx?: number; // vitesse (particules de sable)
    vy?: number;
    val?: number; // valeur (chiffre de dégâts)
    enemy?: boolean; // cible ennemie (couleur du chiffre)
    ang?: number; // angle (éclair de mêlée)
  }[] = [];
  let orderMode = false; // mode « envoyer les troupes » : un toucher désigne la destination
  // Troupe retenue au lasso (clés d'unités). Distincte de `selected`, qui sert à inspecter/déplacer
  // UN objet : ici on commande un groupe. Vide = l'ordre part à toute l'île, comme avant.
  let troop = new Set<string>();
  let band: { x0: number; y0: number; x1: number; y1: number } | null = null; // cadre en cours de tracé
  // `by` = le tireur, pour savoir qui porte le coup fatal (couleur du conquérant d'un château).
  const projectiles: { x: number; y: number; target: Ent; dmg: number; from: 'player' | 'enemy'; by?: Ent }[] = [];
  let raidAt = 999; // instant du prochain raid (fixé au démarrage)
  let produceAt = 10; // instant de la prochaine production des royaumes rivaux
  let dispatchAt = 20; // instant du prochain envoi d'escadrons IA (anti-surpopulation)
  let warAt = 90; // instant de la prochaine guerre entre deux royaumes rivaux
  let regenAt = 3; // prochaine passe de régénération hors combat
  const REGEN_CALM = 20; // secondes sans avoir été touché avant de commencer à se soigner
  const REGEN_UNIT = 0.02; // une troupe se remet en ~50 s
  const REGEN_WALL = 0.004; // un bâtiment en ~4 min : trop lent pour attendre, d'où la réparation au bois
  const dust = img('sprites/dust.png');
  const keyOf = (e: Ent) => (e.placed ? e.placed.k : `decor:${e.id}`);
  let occCache: Occupancy | null = null;
  const getOcc = () =>
    (occCache ??= buildOcc(
      // Les ruines occupent le sol : on rebâtit exactement à leur place, rien d'autre ne s'y pose.
      // Les unités en mer, elles, ne bloquent plus la case qu'elles viennent de quitter.
      [...placed, ...decor, ...ruins].filter((e) => !e.sailing).map((e) => ({ id: keyOf(e), key: e.key, x: e.x, y: e.y })),
    ));
  /**
   * Les cases qu'une unité ne peut PAS traverser : les bâtiments, rien d'autre (cf. `blocksWalk`).
   * Le pas (`tryStep`) ET le chemin (`findPath`, `lineOfWalk`) lisent le même index — c'est ce qui
   * garantit qu'on ne trace jamais un itinéraire qu'on refusera ensuite d'emprunter.
   */
  let wallCache: Set<number> | null = null;
  const wallKey = (cx: number, cy: number) => cy * WORLD.w + cx;
  const getWalls = () =>
    (wallCache ??= new Set(
      [...placed, ...decor, ...ruins]
        .filter((e) => !e.sailing && !e.dead && blocksWalk(e.key))
        .flatMap((e) => cellsOf(e.key, e.x, e.y).map(([cx, cy]) => wallKey(cx, cy))),
    ));
  const occDirty = () => {
    occCache = null;
    wallCache = null;
  };
  const movable = (e: Ent) => !!footprint(e.key);
  const findByKey = (k: string) => [...placed, ...decor, ...ruins].find((e) => (e.placed || e.id) && keyOf(e) === k);

  const walkableCell = (cx: number, cy: number) => islandAt(cx, cy) >= 0 && levelAt(cx, cy) > 0 && !blockedAt(cx, cy);

  // Décor fixe (généré depuis Tiled)
  const decor: Ent[] = [];
  const nodes: Ent[] = []; // nœuds récoltables (arbres, or, moutons)
  const clouds: { key: string; def: SpriteDef; x: number; y: number; speed: number }[] = [];
  // La carte de base ne doit garder que très peu de personnages par île : le joueur
  // peuplera son royaume en achetant au marché. On plafonne les PNJ humains à l'init.
  const HUMAN_RE = /^(villageois|bucheron|mineur|chasseur|guerrier|lancier|archer|moine)/;
  const DECOR_UNIT_CAP = 2;
  const humanPerIsl = new Map<number, number>();
  WORLD.decor.forEach(([key0, x0, y0, cloud], index) => {
    // Le royaume de départ prend la couleur choisie par le joueur.
    const key = splitWorker(
      !cloud && islandAt(Math.floor(x0 / TS), Math.floor(y0 / TS)) === homeIsl ? recolorKey(key0, playerFaction) : key0,
      index,
    );
    const def = SPRITES[key];
    if (!def) return;
    if (opts.decorRemoved?.includes(String(index))) return;
    if (!cloud && HUMAN_RE.test(key)) {
      const isl = islandAt(Math.floor(x0 / TS), Math.floor(y0 / TS));
      const c = humanPerIsl.get(isl) ?? 0;
      if (c >= DECOR_UNIT_CAP) return; // déjà assez de personnages sur cette île
      humanPerIsl.set(isl, c + 1);
    }
    const saved = opts.decorPos?.[String(index)];
    const x = saved && !cloud ? saved[0] : x0;
    const y = saved && !cloud ? saved[1] + def.feet : y0;
    if (cloud) clouds.push({ key, def, x, y, speed: 12 + Math.random() * 14 });
    else {
      const e: Ent = { key, def, x, y: y - def.feet, ph: Math.random() * 10 };
      if (def.run || def.act) {
        const [cx, cy] = cellAt(e.x, e.y);
        e.agent = true;
        e.walks = !!def.run && walkableCell(cx, cy);
        e.home = { isl: islandAt(cx, cy), lvl: levelAt(cx, cy) };
        e.origin = { x: e.x, y: e.y };
        e.radius = 2;
        e.wait = Math.random() * 4;
        e.acting = -1;
        // l'armée noire (à l'est) regarde vers l'ouest, les autres au hasard
        e.face = x > 44 * TS ? -1 : Math.random() < 0.5 ? -1 : 1;
        if (COMBAT[combatBase(key) ?? '']) {
          // Grade d'abord, PV ensuite : les soldats du décor ont eux aussi un rang (le tien sur
          // l'île natale, celui de leur royaume ailleurs).
          e.rank = rankFor(key);
          e.maxHp = maxHpOf(key, e.rank);
          e.hp = hpFor(key, e.rank, savedDamage[`decor:${index}`]);
        }
      } else if (maxHpOf(key) !== undefined) {
        // Bâtiment (ou tour) du décor : assiégeable. Il lui faut une île d'attache comme aux unités,
        // sinon les coups programmés sur lui sont annulés (contrôle « même île » au moment de l'impact).
        const [cx, cy] = cellAt(e.x, e.y);
        e.home = { isl: islandAt(cx, cy), lvl: levelAt(cx, cy) };
        e.maxHp = maxHpOf(key);
        e.hp = Math.max(1, Math.min(e.maxHp!, savedDamage[`decor:${index}`] ?? e.maxHp!));
      }
      e.id = String(index);
      if (HARVEST[key]) {
        e.origKey = key;
        e.nodeStock = HARVEST[key].cycles;
        nodes.push(e); // le mouton reste aussi dans `decor` comme agent
      }
      decor.push(e);
    }
  });

  // ---------- Brouillard ----------
  // Masque basse résolution (1/8) flouté puis agrandi : un brouillard doux qui déborde sur la mer.
  const FOG_PAD = 4;
  const FOG_SCALE = 8;
  const fogCanvas = document.createElement('canvas');
  fogCanvas.width = ((WORLD.w + 2 * FOG_PAD) * TS) / FOG_SCALE;
  fogCanvas.height = ((WORLD.h + 2 * FOG_PAD) * TS) / FOG_SCALE;
  let fogDirty = true;
  function buildFog() {
    fogDirty = false;
    const g = fogCanvas.getContext('2d')!;
    g.clearRect(0, 0, fogCanvas.width, fogCanvas.height);
    if (WORLD.islands.every((_, id) => unlocked.has(id))) return;
    const cell = TS / FOG_SCALE;
    // A single blanket covers unexplored land AND the sea between islands.
    const tint = g.createLinearGradient(0, 0, fogCanvas.width * 0.4, fogCanvas.height);
    tint.addColorStop(0, '#c0d3d7');
    tint.addColorStop(0.5, '#b0c8d0');
    tint.addColorStop(1, '#9fbcc8');
    g.fillStyle = tint;
    g.fillRect(0, 0, fogCanvas.width, fogCanvas.height);
    for (let y = 0; y < fogCanvas.height; y += 48) {
      for (let x = 0; x < fogCanvas.width; x += 64) {
        const px = x + Math.sin(y * 0.13 + x * 0.03) * 26;
        const py = y + Math.cos(x * 0.08) * 18;
        const wisp = g.createRadialGradient(px, py, 0, px, py, 70);
        wisp.addColorStop(0, 'rgba(235,246,244,0.075)');
        wisp.addColorStop(1, 'rgba(235,246,244,0)');
        g.fillStyle = wisp;
        g.fillRect(px - 70, py - 70, 140, 140);
      }
    }
    // Reveal only explored islands and a generous band of sea around them.
    // Union the openings before blurring: adjoining explored regions merge cleanly.
    const reveal = document.createElement('canvas');
    reveal.width = fogCanvas.width;
    reveal.height = fogCanvas.height;
    const r = reveal.getContext('2d')!;
    r.fillStyle = '#fff';
    r.beginPath();
    for (let cy = 0; cy < WORLD.h; cy++) {
      for (let cx = 0; cx < WORLD.w; cx++) {
        const isl = islandAt(cx, cy);
        if (isl < 0 || !unlocked.has(isl) || levelAt(cx, cy) <= 0) continue;
        const spread = (3.1 + Math.sin(cx * 0.33 + cy * 0.19) * 0.3) * cell;
        for (const oy of [0.5, -1.3]) {
          const x = (cx + FOG_PAD + 0.5) * cell;
          const y = (cy + FOG_PAD + oy) * cell;
          r.moveTo(x + spread, y);
          r.arc(x, y, spread, 0, Math.PI * 2);
        }
      }
    }
    r.fill();
    g.globalCompositeOperation = 'destination-out';
    g.filter = 'blur(' + cell * 0.9 + 'px)';
    g.drawImage(reveal, 0, 0);
    g.filter = 'none';
    g.globalCompositeOperation = 'source-over';
  }
  // Ruines : vestiges des bâtiments rasés. Elles occupent le terrain (on rebâtit au même endroit)
  // mais ne sont ni attaquables ni comptées comme bâtiments — seulement sélectionnables.
  let ruins: Ent[] = [];
  function setRuins(list: { k: string; id: string; x: number; y: number }[]) {
    occDirty();
    ruins = list
      .filter((r) => SPRITES[r.id])
      // `id` préfixé : `keyOf` en tire une clé unique, et le filtre `/^\d+$/` du décor d'origine ne
      // s'y applique pas (une ruine n'a ni PV à mémoriser, ni suppression à persister).
      .map((r) => ({ key: r.id, def: SPRITES[r.id], x: r.x, y: r.y, ph: 0, id: `ruine:${r.k}`, ruin: { k: r.k, id: r.id } }) as Ent);
  }

  // Objets achetés
  let placed: Ent[] = [];
  function setPlaced(list: Placed[]) {
    occDirty();
    capsDirty = true;
    const prev = new Map(placed.map((e) => [e.placed!.k, e]));
    placed = list
      .filter((p) => SPRITES[p.id])
      .map((p) => {
        const old = prev.get(p.k);
        const def = SPRITES[p.id];
        const walks = !!SHOP_MAP[p.id]?.walks;
        if (old && old.orig!.x === p.x && old.orig!.y === p.y) return old;
        const [cx, cy] = cellAt(p.x, p.y);
        return {
          key: p.id,
          def,
          x: p.x,
          y: p.y,
          ph: Math.random() * 10,
          placed: { ...p },
          orig: { x: p.x, y: p.y },
          walks: walks && !!def.run,
          agent: !!(def.run || def.act),
          acting: -1,
          radius: 3.5,
          wait: Math.random() * 3,
          face: Math.random() < 0.5 ? -1 : 1,
          home: { isl: islandAt(cx, cy), lvl: levelAt(cx, cy) },
          origKey: HARVEST[p.id] ? p.id : undefined,
          nodeStock: HARVEST[p.id] ? HARVEST[p.id].cycles : undefined,
          // Grade AVANT les PV : un vétéran blessé serait sinon plafonné aux PV d'une recrue.
          rank: rankFor(p.id, p.xp),
          xp: p.xp,
          // PV repris là où on les avait laissés à la session précédente.
          hp: hpFor(p.id, rankFor(p.id, p.xp), savedDamage[p.k]),
          maxHp: maxHpOf(p.id, rankFor(p.id, p.xp)),
        } as Ent;
      });
  }
  setPlaced(opts.placed);
  setRuins(opts.ruins ?? []);

  // ---------- Récolte : accumulateur batché + plafond de stockage ----------
  const pending: Record<ResKind, number> = { wood: 0, gold: 0, food: 0 };
  // Réserves actuelles (miroir du state React) : servent à savoir quand le stockage est plein.
  let stock = { gold: opts.stock?.gold ?? 0, wood: opts.stock?.wood ?? 0, food: opts.stock?.food ?? 0 };
  // Plafond = bâtiments achetés + bâti d'origine de l'île natale encore debout. Mémoïsé : chaque
  // villageois interroge `resourceFull` à chaque frame pour choisir sa cible, on ne va pas
  // reconstruire la liste des bâtiments 60 fois par seconde.
  let caps = capsWith([], []);
  const capNow = () => {
    if (capsDirty) {
      capsDirty = false;
      caps = capsWith(placed.map((e) => ({ id: e.key })), [...razedHome]);
    }
    return caps;
  };
  /**
   * Place restante pour une ressource (réserve + en attente vs plafond des bâtiments).
   *
   * L'or échappe au plafond : c'est le TRÉSOR du royaume, et il est aussi alimenté par les leçons
   * d'anglais. Le soumettre à la capacité des bâtiments condamnait la mine — le trésor dépasse les
   * 3100 de l'île natale au bout de quelques quêtes, `resourceFull('gold')` restait vrai pour de bon,
   * et plus un seul mineur ne descendait au filon (mesuré : 5000 pièces en réserve → +0 en 90 s,
   * six mineurs plantés à côté du gisement). Le bois et la nourriture, eux, ne viennent QUE de la
   * récolte : le plafond y garde tout son sens.
   */
  const roomFor = (k: ResKind) => (k === 'gold' ? Infinity : Math.max(0, capNow()[k] - (stock[k] + pending[k])));
  const resourceFull = (k: ResKind) => roomFor(k) <= 0;
  // On ne récolte jamais au-delà du plafond : on n'ajoute que ce qui rentre (l'or des leçons n'est jamais détruit).
  const credit = (k: ResKind, a: number) => {
    pending[k] += Math.min(a, roomFor(k));
  };
  // Reverse le lot accumulé au React (et met à jour le miroir des réserves) : appelé ~1×/s et à l'arrêt.
  function flushPending() {
    for (const k of ['wood', 'gold', 'food'] as ResKind[]) {
      if (pending[k]) {
        stock[k] += pending[k];
        opts.onHarvest?.(k, pending[k]);
        pending[k] = 0;
      }
    }
    const keys = Object.keys(pendingDamage);
    if (keys.length) {
      const batch: Record<string, number> = {};
      for (const k of keys) {
        batch[k] = pendingDamage[k];
        delete pendingDamage[k];
      }
      opts.onDamage?.(batch);
    }
    const xpKeys = Object.keys(pendingXp);
    if (xpKeys.length) {
      const batch: Record<string, number> = {};
      for (const k of xpKeys) {
        batch[k] = pendingXp[k];
        delete pendingXp[k];
      }
      opts.onXp?.(batch);
    }
  }
  const isWorker = (e: Ent) => WORKER_RE.test(e.key);
  const isSoldier = (e: Ent) => /^(guerrier|lancier|archer|moine)/.test(e.key);
  const isMelee = (e: Ent) => /^(guerrier|lancier)/.test(e.key);
  const unitKey = (base: string, fac: string) => base + (fac === 'bleu' ? '' : `-${fac}`);
  // Allégeance par couleur : même couleur = alliés, couleurs différentes = ennemis.
  // Le joueur dirige le royaume de sa couleur (playerFaction) ; les autres couleurs sont des rivaux.
  const isFriendly = (e: Ent) => factionOf(e.key) === playerFaction;
  const hostile = (a: Ent, b: Ent) => factionOf(a.key) !== factionOf(b.key);
  // Grade d'une unité : l'entraînement payé pour son type (le tien au Marché, celui des rivaux
  // dérivé de l'avancement de la partie) plus sa vétérance personnelle, le tout plafonné à 3.
  const rankOf = (e: Ent): number => rankFor(e.key, e.xp);
  /**
   * Recale le grade d'une unité et ses PV. Les PV max suivent le grade, et les PV courants sont mis
   * à l'échelle : sans ça, un guerrier en pleine forme promu passerait de 120/120 à 120/162, donc
   * « blessé », barre de vie à l'appui, juste pour avoir gagné un grade.
   */
  function applyRank(e: Ent): boolean {
    const r = rankOf(e);
    if (r === (e.rank ?? 1)) return false;
    const oldMax = e.maxHp;
    e.rank = r;
    const nm = maxHpOf(e.key, r);
    if (nm !== undefined) {
      e.hp = oldMax && oldMax > 0 ? Math.max(1, Math.min(nm, Math.round(((e.hp ?? oldMax) / oldMax) * nm))) : nm;
      e.maxHp = nm;
    }
    return true;
  }
  // Stats effectives : LE point de lecture unique du combat. Tout ce qui frappe passe par ici, donc
  // c'est le seul endroit où le grade doit peser sur les dégâts.
  const statsFor = (e: Ent): CombatDef | null => {
    const def = COMBAT[combatBase(e.key) ?? ''] ?? null;
    if (!def || def.dmg === 0) return def;
    const r = e.rank ?? 1;
    return r > 1 ? { ...def, dmg: Math.round(def.dmg * RANK_DMG[Math.min(RANK_MAX, r) - 1]) } : def;
  };
  const isFighter = (e: Ent) => {
    const s = statsFor(e);
    return !!s && (s.dmg > 0 || s.heal === true);
  };
  // Une unité EN MER n'est plus sur le plateau de jeu : on ne la vise pas, elle ne combat pas, elle
  // n'occupe aucune case. `alive` porte ce filtre pour que tous les balayages en héritent d'un coup.
  const alive = (e?: Ent | null): e is Ent => !!e && !e.dead && !e.sailing && (e.hp ?? 1) > 0;
  // Cible fixe assiégeable : PV, ne se déplace pas. La tour en fait partie — elle tirait sans jamais
  // pouvoir être détruite, ce qui rendait une île imprenable.
  // Une ruine n'est plus un bâtiment : elle ne se défend pas, ne s'assiège pas, ne compte pour
  // personne. Elle attend seulement qu'on la relève.
  const isBuilding = (e: Ent) =>
    !e.agent && !e.ruin && (SIEGE[siegeBase(e.key) ?? ''] !== undefined || combatBase(e.key) === 'tour');
  // Point visé : les pieds pour une unité, le milieu de la façade pour un bâtiment.
  const aimAt = (o: Ent) => ({ x: o.x, y: isBuilding(o) ? o.y - o.def.feet * 0.5 : o.y });
  // Distance « utile » : on retire l'emprise du bâtiment, sinon une unité resterait plantée
  // à taper dans le vide à deux cases d'un château large de quatre.
  // Clé stable d'une entité : un achat, ou un élément du décor d'origine. Les unités créées au vol
  // par l'IA / les débarquements n'en ont pas — inutile de mémoriser leurs PV, elles ne reviendront pas.
  const stableKey = (e: Ent): string | null => (e.placed ? e.placed.k : e.id && /^\d+$/.test(e.id) ? `decor:${e.id}` : null);
  const noteDamage = (e: Ent) => {
    const k = stableKey(e);
    if (!k) return;
    // Disparue ou entièrement remise sur pied : on oublie la clé au lieu de la garder à sa valeur pleine.
    const intact = e.dead || (e.hp ?? 0) >= (e.maxHp ?? 0);
    pendingDamage[k] = intact ? 0 : Math.max(0, Math.round(e.hp ?? 0));
  };
  /**
   * Le tombeur d'une unité ennemie gagne un point de vétérance, et parfois un grade. Seules les
   * UNITÉS comptent : si les bâtiments donnaient de l'expérience, un archer se ferait vétéran tout
   * seul en tirant sur une maison vide.
   */
  function gainXp(by: Ent | undefined, victim: Ent) {
    if (!by || by.dead || !victim.agent || victim.maxHp === undefined) return;
    if (!isFighter(by) || !hostile(by, victim)) return;
    by.xp = (by.xp ?? 0) + 1;
    noteXp(by);
    if (applyRank(by) && isFriendly(by))
      opts.onNotice?.(`${unitName(by.key)} promu — niveau ${by.rank} sur le champ de bataille.`);
  }
  const noteXp = (e: Ent) => {
    const k = stableKey(e);
    // Les unités de l'IA n'ont pas de clé stable : leur vétérance vit le temps de la session, comme
    // elles. On ne persiste que tes soldats à toi.
    if (k && e.placed) pendingXp[k] = e.xp ?? 0;
  };
  const unitName = (key: string) =>
    ({ guerrier: 'Guerrier', lancier: 'Lancier', archer: 'Archer', moine: 'Moine' })[combatBase(key) ?? ''] ?? 'Soldat';
  const distTo = (e: Ent, o: Ent) => {
    const a = aimAt(o);
    const slack = isBuilding(o) ? ((footprint(o.key)?.w ?? 2) * TS) / 2 : 0;
    return Math.max(0, Math.hypot(a.x - e.x, a.y - e.y) - slack);
  };
  // Tous les gens de métier récoltent (vie du monde) ; seul celui du joueur, sur île débloquée,
  // crédite tes réserves.
  const canHarvest = (e: Ent) => WORKER_RE.test(e.key);
  /**
   * Ressource qu'une unité accepte de récolter, ou `null` si elle les prend toutes.
   * Un bûcheron n'abat que du bois, un mineur ne creuse que de l'or, un chasseur ne chasse que la
   * viande : c'est tout l'intérêt de les avoir séparés. Le « villageois » d'avant la scission — celui
   * du décor de la carte et celui que produisent encore les rivaux — reste polyvalent.
   */
  const jobRes = (e: Ent): ResKind | null => (jobOf(e.key)?.res as ResKind | undefined) ?? null;
  const harvestCredits = (e: Ent) => isFriendly(e) && unlocked.has(e.home?.isl ?? -1);
  // `e.y` EST déjà le pied de l'objet (`y` de l'image moins `feet`) : retrancher `feet` une seconde
  // fois remontait la case d'un cran sur les sprites à grand vide (buissons, filons), et le
  // villageois allait taper à côté de l'arbre. `cellAt` est le seul calcul de case du moteur.
  const nodeCell = (n: Ent) => cellAt(n.x, n.y);
  // Parcourt tous les nœuds récoltables : décor + graines + ressources achetées au marché.
  const eachNode = (fn: (n: Ent) => void) => {
    for (const n of nodes) fn(n);
    for (const p of placed) if (p.origKey) fn(p);
  };

  // (Les ressources de départ de l'île — filons d'or — sont désormais injectées comme objets
  //  possédés déplaçables/persistants côté React, cf. IslandPage, et non plus « semées » ici.)

  // ---------- Caméra ----------
  const minZoom = () => Math.max(W / WORLD_W, H / WORLD_H) * 0.98;
  function clamp() {
    cam.z = Math.min(2.2, Math.max(minZoom(), cam.z));
    const hw = W / 2 / cam.z;
    const hh = H / 2 / cam.z;
    cam.x = WORLD_W <= hw * 2 ? WORLD_W / 2 : Math.min(WORLD_W - hw, Math.max(hw, cam.x));
    cam.y = WORLD_H <= hh * 2 ? WORLD_H / 2 : Math.min(WORLD_H - hh, Math.max(hh, cam.y));
  }
  const s2w = (sx: number, sy: number) => ({ x: (sx - W / 2) / cam.z + cam.x, y: (sy - H / 2) / cam.z + cam.y });

  // ---------- Promenade des personnages ----------
  function walkable(cx: number, cy: number, home: { isl: number; lvl: number }) {
    return islandAt(cx, cy) === home.isl && levelAt(cx, cy) === home.lvl && !blockedAt(cx, cy);
  }
  // Marche « en expédition » : même île, mais le palier peut changer — uniquement en passant par une
  // rampe. C'est ce qui permet enfin d'aller se battre en haut d'une falaise au lieu de s'y coller.
  // Le contrôle porte sur la PAIRE de cases : sinon on couperait le coin d'une falaise en diagonale.
  function walkableAcross(fromX: number, fromY: number, cx: number, cy: number, isl: number) {
    return islandAt(cx, cy) === isl && canStep(fromX, fromY, cx, cy);
  }
  // « En expédition » : l'unité poursuit un but (ordre du joueur, ennemi, blessé à soigner, récolte).
  // Tant qu'elle en a un, elle peut franchir les rampes et changer de palier ; au repos, non.
  const onErrand = (e: Ent) => !!(e.order || e.orderTarget || e.target || e.task);
  // L'unité vient de changer de palier : son niveau de rattachement suit, sinon toute sa vie autonome
  // (promenade, récolte) resterait calée sur l'ancien plateau.
  function syncLevel(e: Ent) {
    if (!e.home) return;
    const cx = Math.floor(e.x / TS);
    const cy = Math.floor(e.y / TS);
    if (blockedAt(cx, cy)) return; // encore sur la rampe : on attend d'avoir posé le pied en haut
    const lvl = levelAt(cx, cy);
    if (lvl > 0 && lvl !== e.home.lvl && islandAt(cx, cy) === e.home.isl) {
      e.home.lvl = lvl;
      e.origin = { x: e.x, y: e.y }; // il vit désormais autour de son nouveau palier
    }
  }
  function pickTarget(e: Ent) {
    const base = e.origin ?? { x: e.x, y: e.y };
    const r = e.radius ?? 3;
    for (let i = 0; i < 12; i++) {
      const tx = base.x + (Math.random() - 0.5) * 2 * r * TS;
      const ty = base.y + (Math.random() - 0.5) * 1.4 * r * TS;
      const tcx = Math.floor(tx / TS);
      const tcy = Math.floor(ty / TS);
      if (walkable(tcx, tcy, e.home!) && !getOcc().has(`${tcx},${tcy}`)) {
        e.tx = tx;
        e.ty = ty;
        e.moving = true;
        return;
      }
    }
    e.wait = 1 + Math.random() * 2;
  }
  // ---------- Récolte : IA du villageois ----------
  const nodeAvailable = (n: Ent, e: Ent) =>
    n.regrowAt === undefined &&
    (n.nodeStock ?? 0) > 0 &&
    (!n.reservedBy || n.reservedBy === keyOf(e)) &&
    islandAt(...nodeCell(n)) === e.home!.isl &&
    // Chacun son métier : un mineur posé sur une île sans or attend, il ne se rabat pas sur les arbres.
    (jobRes(e) === null || n.origKey === undefined || HARVEST[n.origKey].resource === jobRes(e)) &&
    // Stockage plein : le villageois du joueur arrête de récolter cette ressource (plus de stacks infinis).
    !(harvestCredits(e) && n.origKey !== undefined && resourceFull(HARVEST[n.origKey].resource));
  function nearestNode(e: Ent): Ent | null {
    let best: Ent | null = null;
    let bd = Infinity;
    eachNode((n) => {
      if (!nodeAvailable(n, e)) return;
      const d = Math.hypot(n.x - e.x, n.y - e.y);
      if (d < bd) {
        bd = d;
        best = n;
      }
    });
    return best;
  }
  // Vise la meilleure des 8 cases voisines du nœud (le nœud bloque sa propre case).
  function harvestApproach(e: Ent, node: Ent): boolean {
    const [ncx, ncy] = nodeCell(node);
    let best: [number, number] | null = null;
    let bd = Infinity;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const cx = ncx + dx;
        const cy = ncy + dy;
        if (!walkable(cx, cy, e.home!) || getOcc().has(`${cx},${cy}`)) continue;
        const tx = cx * TS + TS / 2;
        const ty = cy * TS + TS * 0.75;
        const d = Math.hypot(tx - e.x, ty - e.y);
        if (d < bd) {
          bd = d;
          best = [tx, ty];
        }
      }
    if (!best) return false;
    e.tx = best[0];
    e.ty = best[1];
    e.moving = true;
    return true;
  }
  function beginHarvest(e: Ent): boolean {
    const node = nearestNode(e);
    if (!node || !harvestApproach(e, node)) return false;
    node.reservedBy = keyOf(e);
    e.task = { node, phase: 'goto', cyclesLeft: node.nodeStock ?? 0 };
    return true;
  }
  function resumeHarvest(e: Ent): boolean {
    const node = e.task!.node;
    if (!nodeAvailable(node, e) || !harvestApproach(e, node)) {
      node.reservedBy = undefined;
      e.task = undefined;
      return false;
    }
    e.task!.phase = 'goto';
    return true;
  }
  // ---------- Dépôts : où le villageois rapporte sa charge ----------
  // Maisons et château servent de grange. Avant, la ressource était créditée au coup de hache ;
  // désormais elle voyage à dos d'homme, ce qui rend la chaîne visible.
  /** Abandonne la tache en cours ET la charge : les deux vont toujours de pair. */
  function dropTask(e: Ent) {
    if (e.task?.node.reservedBy === keyOf(e)) e.task.node.reservedBy = undefined;
    e.task = undefined;
    e.carry = undefined;
    e.carryQty = undefined;
  }
  const isDepot = (o: Ent) => !o.dead && isFriendly(o) && /^(maison|chateau)/.test(o.key);
  /** Grange la plus proche, sur l'île du villageois. `null` = aucune : on créditera sur place. */
  function nearestDepot(e: Ent): Ent | null {
    let best: Ent | null = null;
    let bd = Infinity;
    for (const o of [...placed, ...decor]) {
      if (!isDepot(o)) continue;
      const [cx, cy] = cellAt(o.x, o.y);
      if (islandAt(cx, cy) !== e.home?.isl) continue;
      const d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d < bd) {
        bd = d;
        best = o;
      }
    }
    return best;
  }
  /**
   * Devant la porte : une case LIBRE au pied de la grange. Viser la grange elle-même ne marche pas —
   * ses cases sont occupées par le bâtiment, le villageois ne peut pas y entrer et attendait
   * indéfiniment à côté, sa bûche sur le dos.
   */
  function depotDoor(o: Ent): { x: number; y: number } | null {
    const fp = footprint(o.key);
    const w = fp?.w ?? 2;
    const bx = Math.round(o.x / TS - w / 2);
    const by = Math.floor((o.y - decorLift(o.key) - 8) / TS);
    const occ = getOcc();
    let best: { x: number; y: number } | null = null;
    let bd = Infinity;
    // Tout le pourtour de l'emprise, la rangée du bas d'abord (c'est là qu'est la porte).
    for (let dy = 1; dy >= -(fp?.h ?? 2); dy--)
      for (let dx = -1; dx <= w; dx++) {
        const cx = bx + dx;
        const cy = by + dy;
        if (!groundAt(cx, cy) || occ.has(`${cx},${cy}`)) continue;
        const px = cx * TS + TS / 2;
        const py = cy * TS + TS * 0.75;
        const d = Math.hypot(px - o.x, py - o.y) + (dy === 1 ? 0 : 40); // on préfère le devant
        if (d < bd) {
          bd = d;
          best = { x: px, y: py };
        }
      }
    return best;
  }

  /**
   * La charge est prête. S'il existe une grange, l'unité s'y rend (phase `haul`) ; sinon elle
   * crédite sur place — sans quoi une île sans bâtiment ne rapporterait plus rien, et une partie
   * en cours se retrouverait bloquée.
   */
  function haulOrCredit(e: Ent, res: ResKind, qty: number) {
    const depot = nearestDepot(e);
    if (!depot) {
      if (harvestCredits(e)) credit(res, qty);
      return false;
    }
    const door = depotDoor(depot);
    if (!door) {
      // Grange cernée : on crédite sur place plutôt que de bloquer la récolte.
      if (harvestCredits(e)) credit(res, qty);
      return false;
    }
    e.carry = res;
    e.carryQty = qty;
    // On passe par `order` plutôt que de fixer tx/ty à la main : c'est lui qui déclenche le routage
    // par les rampes et le contournement d'obstacles. Sans ça, un villageois qui récolte sur un
    // plateau et dont la grange est en contrebas venait mourir d'ennui contre la falaise.
    e.order = door;
    e.moving = false;
    e.acting = -1;
    e.wait = 0;
    e.task!.phase = 'haul';
    return true;
  }

  /** Arrivé à la grange : on décharge, puis on repart au nœud s'il reste de quoi faire. */
  function deliver(e: Ent) {
    if (e.carry && harvestCredits(e)) credit(e.carry, e.carryQty ?? 1);
    effects.push({ x: e.x, y: e.y - 20, t0: t, kind: 'ring', s: 0.7 });
    e.carry = undefined;
    e.carryQty = undefined;
    e.order = undefined; // l'ordre ne servait qu'à router la livraison
    e.moving = false;
    const node = e.task?.node;
    if (node && nodeAvailable(node, e) && harvestApproach(e, node)) {
      node.reservedBy = keyOf(e);
      e.task!.phase = 'goto';
    } else {
      dropTask(e);
      e.wait = 0.3 + Math.random() * 0.6;
    }
  }

  function startCycle(e: Ent) {
    const node = e.task!.node;
    const cfg = HARVEST[node.origKey!];
    const n = e.def.act?.[cfg.actIndex]?.n ?? 6;
    e.acting = cfg.actIndex;
    e.actT0 = t;
    e.actEnd = t + (2 * n) / 10; // ~1,2 s par coup
    e.face = node.x < e.x ? -1 : 1;
  }
  function depleteNode(node: Ent) {
    const cfg = HARVEST[node.origKey!];
    node.regrowAt = t + cfg.regrowMs / 1000;
    if (cfg.depletedKey && SPRITES[cfg.depletedKey]) {
      node.key = cfg.depletedKey;
      node.def = SPRITES[cfg.depletedKey];
    }
    occDirty();
  }

  // ---------- Soldats : se regrouper entre camarades ----------
  /** Camarade de mêlée le plus proche, même île et même couleur : celui vers qui on se regroupe. */
  function nearestSoldier(e: Ent, maxDist: number): Ent | null {
    const fac = factionOf(e.key);
    let best: Ent | null = null;
    let bd = maxDist;
    for (const o of [...placed, ...decor]) {
      if (o === e || !o.agent || !isMelee(o)) continue;
      if (o.home?.isl !== e.home?.isl || factionOf(o.key) !== fac) continue;
      const d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d < bd) {
        bd = d;
        best = o;
      }
    }
    return best;
  }
  function walkToward(e: Ent, ally: Ent) {
    const tx = ally.x + (ally.x > e.x ? -TS * 0.9 : TS * 0.9);
    const ty = ally.y;
    const cx = Math.floor(tx / TS);
    const cy = Math.floor(ty / TS);
    if (walkable(cx, cy, e.home!) && !getOcc().has(`${cx},${cy}`)) {
      e.tx = tx;
      e.ty = ty;
      e.moving = true;
    } else e.wait = 1 + Math.random() * 2;
  }

  // ---------- Combat ----------
  // Une cible qu'aucun escalier ni aucune pente ne dessert doit être IGNORÉE : c'est elle qui faisait
  // venir les soldats se coller à la paroi pour l'éternité. Seuls les tireurs font exception, à
  // portée : une flèche n'a pas besoin d'escalier.
  function canEngage(e: Ent, o: Ent, ranged: boolean): boolean {
    if (ranged && Math.hypot(o.x - e.x, o.y - e.y) <= (statsFor(e)?.range ?? 0) * TS) return true;
    return reachable(Math.floor(e.x / TS), Math.floor(e.y / TS), Math.floor(o.x / TS), Math.floor(o.y / TS));
  }
  function nearestFoe(e: Ent, maxTiles: number, wantAlly: boolean): Ent | null {
    let best: Ent | null = null;
    let bd = maxTiles * TS;
    const ranged = !!statsFor(e)?.ranged || !!statsFor(e)?.heal;
    for (const o of [...placed, ...decor]) {
      if (o === e || !o.agent || !alive(o) || o.maxHp === undefined) continue;
      if (o.home?.isl !== e.home?.isl) continue;
      if (wantAlly ? hostile(e, o) || (o.hp ?? 0) >= (o.maxHp ?? 1) : !hostile(e, o)) continue;
      if (!canEngage(e, o, ranged)) continue;
      const d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d < bd) {
        bd = d;
        best = o;
      }
    }
    return best;
  }
  // Couleur ennemie la plus représentée sur une île : le conquérant présumé quand un château y tombe.
  function dominantFoe(isl: number, victim: string): string {
    const tally = new Map<string, number>();
    for (const o of [...placed, ...decor]) {
      if (!alive(o) || !o.agent || o.maxHp === undefined || o.home?.isl !== isl) continue;
      const f = factionOf(o.key);
      if (f === victim) continue;
      tally.set(f, (tally.get(f) ?? 0) + 1);
    }
    return [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  }
  // Cible de siège : bâtiment ennemi le plus proche sur la même île (quand plus aucune unité ne défend).
  function nearestBuilding(e: Ent, maxTiles: number): Ent | null {
    let best: Ent | null = null;
    let bd = maxTiles * TS;
    const ranged = !!statsFor(e)?.ranged;
    for (const o of [...placed, ...decor]) {
      if (!alive(o) || o.maxHp === undefined || !isBuilding(o)) continue;
      if (o.home?.isl !== e.home?.isl || !hostile(e, o)) continue;
      // Un bâtiment qu'on ne peut pas rejoindre n'est pas assiégeable : on ne s'y fixe pas.
      if (!canEngage(e, o, ranged)) continue;
      const d = distTo(e, o);
      if (d < bd) {
        bd = d;
        best = o;
      }
    }
    return best;
  }
  // Gerbe de sable/poussière projetée à l'impact (petites particules qui retombent).
  function spawnSand(x: number, y: number, dirX: number, n: number, power = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(-0.6 - Math.random() * 0.7, dirX * (0.4 + Math.random())) + (Math.random() - 0.5) * 0.6;
      const sp = (60 + Math.random() * 120) * power;
      effects.push({ x, y, t0: t, kind: 'sand', vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, s: 0.6 + Math.random() * 0.9 });
    }
  }
  // Effet de coup : éclair de lame (mêlée) ou éclat d'impact (tir), + onde de choc + sable.
  function spawnHit(u: Ent, dmg: number, from: { x: number; y: number } | undefined, melee: boolean) {
    const hy = u.y - (u.def.fh - u.def.feet) * 0.45;
    const dir = from ? Math.sign(u.x - from.x) || 1 : -1;
    effects.push({ x: u.x, y: hy, t0: t, kind: 'hit', s: melee ? 1.2 : 0.8 });
    if (melee) effects.push({ x: u.x - dir * 10, y: hy, t0: t, kind: 'slash', ang: dir < 0 ? Math.PI * 0.75 : Math.PI * 0.25 });
    spawnSand(u.x, u.y - 4, dir, melee ? 8 : 5, melee ? 1.2 : 0.8);
    effects.push({ x: u.x, y: hy - 6, t0: t, kind: 'dmg', val: Math.round(dmg), enemy: !isFriendly(u) });
  }
  function hurt(u: Ent, dmg: number, from?: { x: number; y: number }, melee = false, by?: Ent) {
    if (!alive(u)) return;
    u.hp = (u.hp ?? u.maxHp ?? 1) - dmg;
    u.hurtT = t;
    // Recul (knockback) : l'unité est repoussée un court instant dans la direction du coup.
    if (from) {
      const dx = u.x - from.x;
      const dy = u.y - from.y;
      const d = Math.hypot(dx, dy) || 1;
      u.recoilT = t;
      u.recoilX = (dx / d) * (melee ? 7 : 4);
      u.recoilY = (dy / d) * (melee ? 4 : 2);
    }
    spawnHit(u, dmg, from, melee);
    noteDamage(u);
    if (u.hp <= 0) {
      u.dead = true;
      noteDamage(u); // 0 : plus la peine de retenir ses PV, elle ne reviendra pas
      gainXp(by, u); // le tombeur gagne du galon (joueur comme rival)
      // Tout élément du décor D'ORIGINE qui meurt est mémorisé comme retiré : au retour sur la carte,
      // ni les soldats tombés ni les bâtiments rasés ne réapparaissent. (Les unités créées au vol par
      // l'IA ou par un débarquement ont un id non numérique : elles, on les laisse repartir de zéro.)
      if (!u.placed && u.id && /^\d+$/.test(u.id)) {
        opts.onDecorRemove?.(u.id);
        // Une grange rasée, c'est du stockage en moins : le plafond redescend séance tenante.
        razedHome.add(u.id);
        capsDirty = true;
      }
      if (isBuilding(u)) {
        // Il en reste une ruine : la pierre ne s'évapore pas, et on pourra la relever à moitié prix.
        opts.onRuin?.(u.key, u.x, u.y);
        // Effondrement : large gerbe de gravats, la case se libère.
        for (let i = 0; i < 5; i++)
          effects.push({
            x: u.x + (Math.random() - 0.5) * u.def.fw * 0.6,
            y: u.y - Math.random() * u.def.feet,
            t0: t,
            kind: 'dust',
            s: 1.6,
          });
        spawnSand(u.x, u.y - 6, 1, 22, 2);
        spawnSand(u.x, u.y - 6, -1, 22, 2);
        occDirty();
        if (siegeBase(u.key) === 'chateau') {
          // Un royaume ne tombe qu'à la chute de son DERNIER château : « soumis » (toi) / « pris » (eux).
          const fac = factionOf(u.key);
          const last = ![...placed, ...decor].some((o) => alive(o) && siegeBase(o.key) === 'chateau' && factionOf(o.key) === fac);
          // Qui s'en empare : celui qui porte le coup fatal, sinon la couleur ennemie la plus
          // présente sur l'île (l'archer qui a tiré a pu mourir entre-temps).
          const winner = by && factionOf(by.key) !== fac ? factionOf(by.key) : dominantFoe(u.home?.isl ?? -1, fac);
          if (isFriendly(u)) {
            if (winner) opts.onCastle?.(last ? 'soumis' : 'perdu', fac, winner);
          } else if (last) {
            // Le royaume rival s'effondre. Que ce soit toi ou un autre rival qui l'ait abattu, si
            // c'était ton suzerain le joug se brise : `winner` dit lequel des deux pour le texte.
            opts.onCastle?.('pris', fac, winner);
          } else {
            // Un château rival de plus est tombé : simple chronique du monde, pas une fin de royaume.
            opts.onCastle?.('rival', fac, winner);
          }
        }
      }
      effects.push({ x: u.x, y: u.y, t0: t, kind: 'dust', s: 1.3 });
      effects.push({ x: u.x, y: u.y - 18, t0: t, kind: 'hit', s: 1.6 });
      spawnSand(u.x, u.y - 4, from ? Math.sign(u.x - from.x) || 1 : 1, 12, 1.4);
      // Une unité qu'on est en train de déplacer/sélectionner vient de mourir : on abandonne proprement.
      if (drag?.ent === u) drag = null;
      if (moveEnt === u) endMove();
      if (selected === keyOf(u)) select(null);
      if (u.placed) opts.onUnitLost?.(u.placed.k);
      if (u.reservedBy !== undefined) u.reservedBy = undefined;
      // Libère le nœud que l'unité exploitait (sinon il reste réservé à jamais par un mort) + sa tâche.
      const kk = keyOf(u);
      eachNode((n) => {
        if (n.reservedBy === kk) n.reservedBy = undefined;
      });
      u.task = undefined;
    }
  }
  // Centre praticable d'une case (les pieds se posent un peu bas dans la case).
  const cellMid = (c: [number, number]) => ({ x: c[0] * TS + TS / 2, y: c[1] * TS + TS * 0.75 });
  /**
   * Point vers lequel pousser l'unité pour rejoindre (tx,ty). Si la cible est sur un autre palier, on
   * vise le prochain passage (escalier ou pente) au lieu de foncer dans la paroi. Renvoie `null` quand
   * la cible est hors d'atteinte : à l'appelant d'abandonner plutôt que de rester planté contre le mur.
   */
  /**
   * Chemin case par case entre deux cases, en contournant falaises ET bâtiments (A*, 8 directions).
   * Les diagonales n'ont le droit de passer que si les deux cases orthogonales le permettent, sinon
   * l'unité couperait le coin d'une falaise. Borné à `MAX_NODES` : sur une île de quelques centaines
   * de cases, l'exploration s'arrête bien avant.
   *
   * Les murs sont écartés ici comme dans `tryStep` : un chemin qui traverse une caserne se solderait
   * par une unité collée au mur. La case d'arrivée fait exception — on assiège bien un bâtiment.
   */
  const MAX_NODES = 3000;
  function findPath(sx: number, sy: number, gx: number, gy: number): [number, number][] | null {
    if (sx === gx && sy === gy) return [];
    const walls = getWalls();
    const key = (x: number, y: number) => y * WORLD.w + x;
    const open: { x: number; y: number; f: number }[] = [{ x: sx, y: sy, f: 0 }];
    const came = new Map<number, number>();
    const cost = new Map<number, number>([[key(sx, sy), 0]]);
    let seen = 0;
    while (open.length && seen++ < MAX_NODES) {
      // File de priorité rudimentaire : on cherche le minimum. Les files restent courtes ici, un tas
      // binaire n'apporterait rien de mesurable.
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0];
      if (cur.x === gx && cur.y === gy) {
        const path: [number, number][] = [];
        let k = key(gx, gy);
        while (k !== key(sx, sy)) {
          path.unshift([k % WORLD.w, Math.floor(k / WORLD.w)]);
          const prev = came.get(k);
          if (prev === undefined) return null;
          k = prev;
        }
        return path;
      }
      const g0 = cost.get(key(cur.x, cur.y))!;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = cur.x + dx;
          const ny = cur.y + dy;
          if (!canStep(cur.x, cur.y, nx, ny)) continue;
          if (walls.has(key(nx, ny)) && !(nx === gx && ny === gy)) continue;
          // Diagonale : interdite si elle rase un angle (les deux côtés doivent être franchissables).
          if (dx && dy && (!canStep(cur.x, cur.y, nx, cur.y) || !canStep(cur.x, cur.y, cur.x, ny))) continue;
          const g = g0 + (dx && dy ? 1.414 : 1);
          const nk = key(nx, ny);
          if (cost.has(nk) && cost.get(nk)! <= g) continue;
          cost.set(nk, g);
          came.set(nk, key(cur.x, cur.y));
          open.push({ x: nx, y: ny, f: g + Math.hypot(gx - nx, gy - ny) });
        }
    }
    return null;
  }

  /**
   * Point vers lequel pousser l'unité. Tant que la cible est en vue directe, on va tout droit —
   * c'est le cas courant et ça ne coûte rien. Dès qu'un relief s'interpose, on calcule un vrai
   * chemin et on suit ses jalons : c'est ce qui empêche de venir se coller à une falaise.
   * `null` = cible hors d'atteinte, à l'appelant d'abandonner.
   */
  function steerPoint(e: Ent, tx: number, ty: number): { x: number; y: number } | null {
    const cx = Math.floor(e.x / TS);
    const cy = Math.floor(e.y / TS);
    const gx = Math.floor(tx / TS);
    const gy = Math.floor(ty / TS);
    if (cx === gx && cy === gy) return { x: tx, y: ty };
    if (lineOfWalk(cx, cy, gx, gy)) return { x: tx, y: ty };

    // Le chemin est recalculé quand la destination change de case, ou au plus une fois par seconde :
    // un A* par unité et par image mettrait la carte à genoux.
    const want = `${gx},${gy}`;
    if (e.pathGoal !== want || t >= (e.pathAt ?? 0)) {
      e.pathGoal = want;
      e.pathAt = t + 1;
      e.path = findPath(cx, cy, gx, gy) ?? undefined;
      if (!e.path) return null;
    }
    // On consomme les jalons déjà atteints, puis on vise le suivant.
    while (e.path?.length && e.path[0][0] === cx && e.path[0][1] === cy) e.path.shift();
    if (!e.path?.length) return { x: tx, y: ty };
    return cellMid(e.path[0]);
  }
  /** Peut-on aller tout droit de (sx,sy) à (gx,gy) ? Tracé de Bresenham sur les cases. */
  function lineOfWalk(sx: number, sy: number, gx: number, gy: number): boolean {
    const walls = getWalls();
    let x = sx;
    let y = sy;
    const dx = Math.abs(gx - sx);
    const dy = Math.abs(gy - sy);
    const stepX = sx < gx ? 1 : -1;
    const stepY = sy < gy ? 1 : -1;
    let err = dx - dy;
    let guard = dx + dy + 2;
    while ((x !== gx || y !== gy) && guard-- > 0) {
      const e2 = 2 * err;
      const nx = e2 > -dy ? x + stepX : x;
      const ny = e2 < dx ? y + stepY : y;
      if (!canStep(x, y, nx, ny)) return false;
      // Un mur sur la trajectoire : on repasse par l'A*. Sauf s'il EST la destination (siège).
      if (walls.has(wallKey(nx, ny)) && !(nx === gx && ny === gy)) return false;
      if (e2 > -dy) err -= dy;
      if (e2 < dx) err += dx;
      x = nx;
      y = ny;
    }
    return true;
  }
  /** Renvoie false si l'unité n'a AUCUN moyen d'avancer vers sa cible : à l'appelant de l'abandonner. */
  function combatMove(e: Ent, tx: number, ty: number, dt: number): boolean {
    if (!e.home) return false; // sécurité : pas de déplacement sans île d'attache (évite un crash)
    const aim = steerPoint(e, tx, ty);
    // Aucun chemin. `canEngage` raisonne sur le graphe des régions, qui ignore les bâtiments : une
    // cible « joignable » peut donc être murée derrière un château. Sans ce renoncement, l'unité
    // gardait sa cible, `combatStep` renvoyait true, et elle restait plantée là pour toujours.
    if (!aim) return false;
    const dx = aim.x - e.x;
    const dy = aim.y - e.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) return true;
    const step = Math.min(d, 48 * dt);
    const nx = e.x + (dx / d) * step;
    const ny = e.y + (dy / d) * step;
    // Même contournement qu'en marche libre : sans lui, un rocher entre l'unité et sa cible la fige
    // à mi-chemin, l'arme au clair.
    if (tryStep(e, nx, ny) || tryStep(e, nx, e.y) || tryStep(e, e.x, ny) || slideAlong(e, dx, dy, step)) {
      e.moving = true;
      // On garde tx/ty cohérents avec la position RÉELLEMENT atteinte : sinon, dès que la cible
      // meurt, l'unité retombe dans la marche normale avec un tx incohérent → NaN → elle se fige
      // (rattrapée de justesse par safeStep).
      e.tx = e.x;
      e.ty = e.y;
      e.acting = -1;
      syncLevel(e); // un palier de franchi : le niveau de rattachement suit
      if (Math.abs(dx) > 1) e.face = dx < 0 ? -1 : 1;
      return true;
    }
    // Bloquée de tous les côtés : le chemin en cache est caduc, on le refait à la prochaine image.
    repath(e);
    return false;
  }
  function swing(e: Ent, foe: Ent, st: CombatDef) {
    e.moving = false;
    e.face = foe.x < e.x ? -1 : 1;
    const n = e.def.act?.[0]?.n ?? 6;
    if (e.acting! < 0) {
      e.acting = 0;
      e.actT0 = t;
      e.actEnd = t + (2 * n) / 10;
    }
    if (!e.atkCd || t >= e.atkCd) {
      e.atkCd = t + st.atk;
      // On programme l'impact au moment où l'arme frappe (≈ mi-animation), pas au début du geste.
      e.strike = { at: t + (IMPACT_FRAC * n) / 10, foe, dmg: st.dmg, ranged: !!st.ranged, oy: 30 };
    }
  }
  // Un combattant engage l'ennemi le plus proche ; renvoie true s'il est en plein combat.
  function combatStep(e: Ent, dt: number): boolean {
    const st = statsFor(e);
    if (!st || st.dmg === 0) return false;
    if (st.heal) {
      // Moine : soigne l'allié blessé le plus proche.
      const ally =
        alive(e.target) && !hostile(e, e.target!) && (e.target!.hp ?? 0) < (e.target!.maxHp ?? 1)
          ? e.target!
          : nearestFoe(e, AGGRO_TILES, true);
      if (!ally) {
        e.target = undefined;
        return false;
      }
      e.target = ally;
      const d = Math.hypot(ally.x - e.x, ally.y - e.y);
      if (d <= st.range * TS) {
        e.moving = false;
        e.face = ally.x < e.x ? -1 : 1;
        const n = e.def.act?.[0]?.n ?? 6;
        if (e.acting! < 0) {
          e.acting = 0;
          e.actT0 = t;
          e.actEnd = t + (2 * n) / 10;
        }
        if (!e.atkCd || t >= e.atkCd) {
          e.atkCd = t + st.atk;
          // Le soin s'applique au moment fort de l'animation, comme un coup.
          e.strike = { at: t + (IMPACT_FRAC * n) / 10, foe: ally, dmg: st.dmg, ranged: false, heal: true, oy: 0 };
        }
      } else if (!combatMove(e, ally.x, ally.y, dt)) {
        e.target = undefined; // blessé injoignable : le moine retourne à sa vie plutôt que de piétiner
        return false;
      }
      return true;
    }
    // Priorité aux unités ; à défaut, on prend d'assaut les bâtiments ennemis de l'île (siège).
    // Le balayage des bâtiments est limité à ~1×/s par unité : il parcourt tout le décor.
    // On revérifie la couleur à chaque image : une cible gardée d'une image sur l'autre a pu
    // changer de camp entre-temps (recoloration du royaume au Marché).
    let foe = alive(e.target) && e.target!.home?.isl === e.home?.isl && hostile(e, e.target!) ? e.target! : nearestFoe(e, AGGRO_TILES, false);
    if (!foe && t >= (e.siegeScanAt ?? 0)) {
      e.siegeScanAt = t + 1.2;
      foe = nearestBuilding(e, SIEGE_TILES);
    }
    if (!foe) {
      e.target = undefined;
      return false;
    }
    e.target = foe;
    const aim = aimAt(foe);
    if (distTo(e, foe) <= st.range * TS) swing(e, foe, st);
    else if (!combatMove(e, aim.x, aim.y, dt)) {
      // Cible murée ou hors d'atteinte : on la lâche pour de bon, sinon l'unité reste figée dessus
      // image après image, l'arme au clair, sans jamais avancer ni chercher quelqu'un d'autre.
      e.target = undefined;
      e.orderTarget = undefined;
      return false;
    }
    return true;
  }

  // Choisit la prochaine activité selon le rôle — plus personne ne frappe dans le vide.
  function nextActivity(e: Ent) {
    // Ouvriers : récolter, sinon marcher / attendre (jamais d'animation d'outil à vide).
    if (isWorker(e)) {
      if (canHarvest(e) && (e.task ? resumeHarvest(e) : beginHarvest(e))) return;
      if (e.walks && Math.random() < 0.7) pickTarget(e);
      else e.wait = 1.5 + Math.random() * 3;
      return;
    }
    // Soldats : se regrouper vers un allié, sinon patrouiller. JAMAIS d'animation d'attaque.
    // Un soldat ne dégaine que pour un vrai combat (`combatStep`) : il n'y a plus ni tir dans le
    // vide pour les archers, ni soin sur personne pour les moines, ni entraînement à deux. Les
    // deux tentatives précédentes (l'exercice solo et le sparring) donnaient la même impression de
    // gens qui frappent l'air, et rendaient illisible le seul signal qui compte : on se bat ici.
    if (isSoldier(e)) {
      if (isMelee(e)) {
        const ally = nearestSoldier(e, 12 * TS);
        if (ally && e.walks && Math.random() < 0.75) {
          walkToward(e, ally);
          return;
        }
      }
      if (e.walks && Math.random() < 0.6) pickTarget(e);
      else e.wait = 1.5 + Math.random() * 3;
      return;
    }
    // Autres (mouton qui broute…) : comportement d'origine.
    const acts = e.def.act ?? [];
    const r = Math.random();
    if (acts.length && (r < 0.45 || !e.walks)) {
      const i = Math.floor(Math.random() * acts.length);
      const n = acts[i].n;
      e.acting = i;
      e.actT0 = t;
      e.actEnd = t + (2 * n) / 10;
      return;
    }
    if (e.walks && r < 0.85) pickTarget(e);
    else e.wait = 1.5 + Math.random() * 3;
  }
  // Ordre de marche du joueur : la troupe fonce vers le point désigné (le combat prime au-dessus).
  function issueMarch(e: Ent) {
    if (!e.order) return;
    const dx = e.order.x - e.x;
    const dy = e.order.y - e.y;
    if (Math.hypot(dx, dy) < TS * 0.6) {
      if (e.warp) return teleport(e); // arrivé au portail : on ressort à l'autre bout
      if (e.cross) return embark(e); // arrivé à la côte : on prend la mer
      if (e.task?.phase === 'haul') return deliver(e); // arrivé à la grange : on décharge
      e.order = undefined; // arrivé : l'unité tient la position
      e.wait = 0.3;
      return;
    }
    // Un ordre vers un autre palier passe par les escaliers, comme le combat. Point inatteignable :
    // on abandonne l'ordre au lieu de laisser la troupe s'agglutiner contre une falaise.
    const aim = e.home ? steerPoint(e, e.order.x, e.order.y) : { x: e.order.x, y: e.order.y };
    if (!aim) {
      e.order = undefined;
      e.wait = 0.5;
      return;
    }
    e.tx = aim.x;
    e.ty = aim.y;
    e.moving = true;
  }
  function stepAgent(e: Ent, dt: number) {
    if (e.dead || e.sailing) return; // en mer : rien à animer
    if (e.reservedBy) return; // nœud-agent (mouton) figé pendant qu'un villageois le récolte
    // Ordre d'attaque sur une cible précise : on force le combat à la pourchasser (au-delà de l'aggro).
    if (e.orderTarget) {
      // Jamais de coup fratricide : même couleur = allié, quoi qu'il arrive (ordre du joueur compris).
      if (!alive(e.orderTarget) || e.orderTarget.home?.isl !== e.home?.isl || !hostile(e, e.orderTarget)) e.orderTarget = undefined;
      else e.target = e.orderTarget;
    }
    // Un ordre de DÉPLACEMENT du joueur casse le combat : sans ça, un soldat lancé à l'assaut
    // ignorait qu'on le rappelait tant qu'un ennemi restait à portée d'aggro — impossible de battre
    // en retraite. Un ordre d'ATTAQUE (clic droit sur un ennemi, `orderTarget`) continue de primer.
    const recall = !!e.order && !e.orderTarget;
    if (recall) {
      e.target = undefined;
      e.strike = undefined;
    }
    if (!recall && isFighter(e) && combatStep(e, dt)) return; // sinon le combat prime
    if (e.acting! >= 0) {
      if (t >= e.actEnd!) {
        e.acting = -1;
        if (e.task && e.task.phase === 'work') {
          const node = e.task.node;
          const cfg = HARVEST[node.origKey!];
          node.nodeStock = (node.nodeStock ?? 0) - 1;
          e.task.cyclesLeft--;
          const last = (node.nodeStock ?? 0) <= 0;
          if (last) {
            depleteNode(node);
            node.reservedBy = undefined;
          }
          // La charge part en livraison. `haulOrCredit` renvoie false quand l'île n'a aucune grange :
          // le crédit se fait alors sur place et le villageois enchaîne comme avant.
          if (!haulOrCredit(e, cfg.resource, cfg.yield)) {
            if (last) {
              e.task = undefined;
              e.wait = 0.4 + Math.random();
            } else startCycle(e); // encore un coup sur le même nœud
          }
        } else {
          e.wait = 1 + Math.random() * 3;
        }
      }
      return;
    }
    if (e.moving && (!Number.isFinite(e.tx) || !Number.isFinite(e.ty))) {
      e.moving = false; // ceinture : jamais de marche vers une destination indéfinie
      e.wait = 0.3;
      return;
    }
    if (e.moving) {
      const dx = e.tx! - e.x;
      const dy = e.ty! - e.y;
      const d = Math.hypot(dx, dy);
      const speed = e.key.startsWith('mouton') ? 24 : 40;
      if (d < 2) {
        e.moving = false;
        if (e.task && e.task.phase === 'goto') {
          e.task.phase = 'work';
          startCycle(e); // arrivé au nœud : on commence à travailler
        } else if (e.task && e.task.phase === 'haul') {
          deliver(e);
        } else if (e.order) {
          // `tx/ty` n'est PAS forcément la destination : depuis le routage par les rampes, c'est
          // souvent un point de passage. Effacer l'ordre ici faisait abandonner la troupe au pied de
          // la rampe. On ne le lève que si on est vraiment arrivé ; sinon on enchaîne sans attendre.
          if (Math.hypot(e.order.x - e.x, e.order.y - e.y) < TS * 0.6) {
            // Arrivé au quai (ou au portail) : on part, au lieu de « tenir la position ». Sans ce
            // test, la troupe atteignait la côte puis repartait se promener, l'expédition oubliée.
            if (e.warp) teleport(e);
            else if (e.cross) embark(e);
            else {
              e.order = undefined;
              e.wait = 0.3;
            }
          } else e.wait = 0;
        } else {
          e.wait = 1 + Math.random() * 3;
        }
        if (e.placed) {
          e.placed.x = Math.round(e.x);
          e.placed.y = Math.round(e.y);
        }
      } else {
        const step = Math.min(d, speed * dt);
        const nx = e.x + (dx / d) * step;
        const ny = e.y + (dy / d) * step;
        // Un simple rocher sur la trajectoire suffisait à figer l'unité : le pas diagonal était
        // refusé et elle attendait indéfiniment. On glisse désormais le long de l'obstacle en
        // retombant sur un pas purement horizontal, puis purement vertical.
        if (!tryStep(e, nx, ny) && !tryStep(e, nx, e.y) && !tryStep(e, e.x, ny) && !slideAlong(e, dx, dy, step)) {
          e.moving = false;
          e.wait = 0.25; // le temps que `repath` autorise un nouvel A* : inutile d'attendre plus
          repath(e); // coincée : le chemin en cache ne vaut plus rien, on le refait sans attendre
        } else {
          if (onErrand(e)) syncLevel(e);
          if (Math.abs(dx) > 1) e.face = dx < 0 ? -1 : 1;
        }
      }
      return;
    }
    e.wait! -= dt;
    if (e.wait! <= 0) {
      if (e.order) issueMarch(e); // priorité à l'ordre du joueur sur la vie autonome
      else nextActivity(e);
    }
  }
  /**
   * Un pas vient d'être refusé : le chemin en cache ne vaut plus rien, on avance sa péremption.
   * On ne l'annule PAS d'un coup — une unité coincée redemanderait alors un A* à chaque image, et
   * une mêlée de vingt hommes bloqués mettrait la carte à genoux. Quatre recalculs par seconde
   * suffisent largement à se dégager, contre un seul par seconde en temps normal.
   */
  function repath(e: Ent) {
    e.pathAt = Math.min(e.pathAt ?? Infinity, t + 0.25);
  }
  /**
   * Dernier recours quand même les pas horizontal et vertical sont refusés : on longe l'obstacle
   * perpendiculairement à la direction voulue. Sans ça, une unité coincée dans un angle (un mur de
   * bâtiment, un goulet entre deux maisons) s'y écrase et attend — c'est le « collé au mur ».
   * On garde le même côté d'une image à l'autre (`e.slide`) : alterner ferait vibrer l'unité sur
   * place au lieu de la faire contourner.
   */
  function slideAlong(e: Ent, dx: number, dy: number, step: number): boolean {
    const d = Math.hypot(dx, dy);
    if (!d || !Number.isFinite(d)) return false;
    const px = -dy / d;
    const py = dx / d;
    const first = e.slide ?? (Math.random() < 0.5 ? 1 : -1);
    for (const s of [first, -first]) {
      if (tryStep(e, e.x + px * s * step, e.y + py * s * step)) {
        e.slide = s;
        return true;
      }
    }
    e.slide = undefined;
    return false;
  }
  /**
   * Tente de poser l'unité en (nx, ny). Renvoie false si la case est interdite (terrain ou objet
   * déjà là), sans rien modifier — l'appelant peut alors essayer une autre direction.
   */
  function tryStep(e: Ent, nx: number, ny: number): boolean {
    const cx = Math.floor(e.x / TS);
    const cy = Math.floor(e.y / TS);
    const ncx = Math.floor(nx / TS);
    const ncy = Math.floor(ny / TS);
    if (ncx === cx && ncy === cy) {
      e.x = nx;
      e.y = ny;
      return true; // on reste dans la même case : rien à vérifier
    }
    // Une unité QUI VA QUELQUE PART a le droit de changer de palier par une rampe ; en promenade
    // elle reste sur le sien, sinon les villageois descendraient des plateaux au hasard.
    // Ce droit était jadis réservé aux ordres du joueur (`e.order`) — or le chemin (`findPath`) et la
    // ligne droite (`lineOfWalk`), eux, ont TOUJOURS accepté les rampes. Un soldat en chasse ou un
    // villageois en récolte traçait donc une route par l'escalier, puis se voyait refuser le pas au
    // pied de la marche : il restait collé à la falaise. C'est le « ils buggent sur les escaliers ».
    const ok = onErrand(e) ? walkableAcross(cx, cy, ncx, ncy, e.home!.isl) : walkable(ncx, ncy, e.home!);
    if (!ok) return false;
    // Seuls les MURS arrêtent (`getWalls`). Un buisson, un arbre, un rocher ou un filon se traverse :
    // ils gênaient la marche sans que le chemin en tienne compte, et l'unité restait plantée devant.
    //
    // On interroge l'index avec la case de TERRAIN, exactement comme `findPath` et `lineOfWalk`.
    // C'était le « collé aux bâtiments » : l'index est bâti sur `cellsOf`, dont l'ancrage vertical est
    // décalé de 8 px (`cellAt` retranche 8 pour que le sprite pose ses pieds sur la bonne case). Le pas
    // lisait donc la grille décalée pendant que le chemin lisait la grille du terrain. Les deux
    // s'accordent au CENTRE d'une case, mais pas sur les 8 px du haut : une unité qui y passait — cible
    // libre, esquive, bousculade — se voyait refuser un pas que l'A* venait de lui tracer. Elle
    // s'écrasait sur la façade, attendait, recalculait le même chemin, et recommençait indéfiniment.
    const walls = getWalls();
    // Déjà DANS un mur (bâtiment posé sur elle, débarquement, décor d'init) : on la laisse sortir,
    // sinon chaque issue lui est refusée et elle est emmurée à vie.
    if (!walls.has(wallKey(cx, cy)) && walls.has(wallKey(ncx, ncy))) return false;
    e.x = nx;
    e.y = ny;
    return true;
  }
  // Fait avancer une unité sans jamais pouvoir figer la carte : en cas d'erreur, on réinitialise
  // proprement son état de combat/tâche (et on la retire si son état est irrécupérable).
  function safeStep(e: Ent, dt: number) {
    try {
      stepAgent(e, dt);
    } catch (err) {
      console.error('Scriptoria: unité en erreur, réinitialisée', err);
      e.target = undefined;
      e.orderTarget = undefined;
      e.order = undefined;
      e.task = undefined;
      e.carry = undefined;
      e.carryQty = undefined;
      e.strike = undefined;
      e.acting = -1;
      e.moving = false;
      e.wait = 1;
      if (!e.home) e.dead = true;
    }
  }
  function update(dt: number) {
    for (const e of placed) {
      if (!e.agent || e.dead || e === drag?.ent || e === moveEnt) continue;
      if (!e.home || e.home.isl < 0 || !unlocked.has(e.home.isl)) continue;
      safeStep(e, dt);
    }
    for (const e of [...decor])
      if (e.agent && !e.dead && e !== drag?.ent && e !== moveEnt && (e.home ? unlocked.has(e.home.isl) : true)) safeStep(e, dt);
    // Tours : tir automatique sur l'ennemi le plus proche.
    for (const e of [...placed, ...decor]) {
      if (combatBase(e.key) !== 'tour' || e.dead) continue;
      if (e.home && (e.home.isl < 0 || !unlocked.has(e.home.isl))) continue;
      if (e.home === undefined) e.home = { isl: islandAt(Math.floor(e.x / TS), Math.floor(e.y / TS)), lvl: 1 };
      const st = COMBAT.tour;
      const foe = nearestFoe(e, st.range, false);
      if (foe && (!e.atkCd || t >= e.atkCd)) {
        e.atkCd = t + st.atk;
        // Petit temps de décoche avant que la flèche parte du sommet de la tour.
        e.strike = { at: t + 0.15, foe, dmg: st.dmg, ranged: true, oy: e.def.fh * 0.5 };
      }
    }
    // Coups programmés : on applique les dégâts / on décoche la flèche pile à la frame d'impact.
    for (const e of [...placed, ...decor]) {
      const s = e.strike;
      if (!s || t < s.at) continue;
      e.strike = undefined;
      if (!alive(e) || e === drag?.ent || e === moveEnt) continue;
      if (!alive(s.foe) || s.foe.home?.isl !== e.home?.isl) continue; // la cible est morte ou a quitté l'île
      if (s.heal ? hostile(e, s.foe) : !hostile(e, s.foe)) continue; // on ne soigne pas un ennemi, on ne frappe pas un allié
      if (s.heal) {
        s.foe.hp = Math.min(s.foe.maxHp ?? 1, (s.foe.hp ?? 0) + s.dmg);
      } else if (s.ranged) {
        projectiles.push({ x: e.x, y: e.y - s.oy, target: s.foe, dmg: s.dmg, from: isFriendly(e) ? 'player' : 'enemy', by: e });
      } else {
        // Mêlée : le coup ne porte que si l'ennemi est encore à portée (sinon il a esquivé pendant le geste).
        const stx = statsFor(e);
        if (!stx || distTo(e, s.foe) <= (stx.range + 0.7) * TS) hurt(s.foe, s.dmg, { x: e.x, y: e.y }, true, e);
      }
    }
    // Projectiles (flèches) : foncent sur leur cible puis infligent les dégâts.
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      if (!alive(p.target)) {
        projectiles.splice(i, 1);
        continue;
      }
      const tx = p.target.x;
      const ty = p.target.y - 24;
      const dx = tx - p.x;
      const dy = ty - p.y;
      const d = Math.hypot(dx, dy);
      const step = 380 * dt;
      if (d <= step) {
        hurt(p.target, p.dmg, { x: p.x, y: p.y }, false, p.by);
        projectiles.splice(i, 1);
      } else {
        p.x += (dx / d) * step;
        p.y += (dy / d) * step;
      }
    }
    // Raids / production / escadrons : on avance TOUJOURS le minuteur AVANT d'appeler (et on isole
    // l'appel) pour qu'une éventuelle erreur ne relance pas la fonction à chaque image (fini le gel).
    if (t >= raidAt) {
      raidAt = t + 75 + Math.random() * 45;
      try { launchInvasion(); } catch (err) { console.error('Scriptoria: invasion', err); }
    }
    if (t >= produceAt) {
      produceAt = t + 9;
      try { aiProduce(); } catch (err) { console.error('Scriptoria: production IA', err); }
    }
    // Régénération au calme : sans elle, les PV désormais mémorisés d'une session à l'autre
    // ne feraient que descendre, et une armée finirait par mourir au premier coup. Les murs, eux,
    // ne se relèvent presque pas tout seuls (REGEN_WALL) : c'est le rôle de la réparation payante.
    if (t >= regenAt) {
      regenAt = t + 1;
      for (const e of [...placed, ...decor]) {
        if (!alive(e) || e.maxHp === undefined || (e.hp ?? 0) >= e.maxHp) continue;
        if (e.hurtT !== undefined && t - e.hurtT < REGEN_CALM) continue; // pas en plein combat
        e.hp = Math.min(e.maxHp, (e.hp ?? 0) + Math.max(1, Math.round(e.maxHp * (isBuilding(e) ? REGEN_WALL : REGEN_UNIT))));
        noteDamage(e);
      }
    }
    if (t >= dispatchAt) {
      dispatchAt = t + 12;
      try { aiDispatch(); } catch (err) { console.error('Scriptoria: escadrons IA', err); }
    }
    stepCrossings();
    if (t >= warAt) {
      warAt = t + 110 + Math.random() * 70;
      try { launchRivalWar(); } catch (err) { console.error('Scriptoria: guerre entre rivaux', err); }
    }
    // Nettoyage des morts (décor + nœuds récoltables comme les moutons tués) : plus de références fantômes.
    for (let i = decor.length - 1; i >= 0; i--) if (decor[i].dead) decor.splice(i, 1);
    for (let i = nodes.length - 1; i >= 0; i--) if (nodes[i].dead) nodes.splice(i, 1);
    // Repousse des nœuds épuisés (décor + achetés)
    eachNode((n) => {
      if (n.regrowAt !== undefined && t >= n.regrowAt) {
        n.key = n.origKey!;
        n.def = SPRITES[n.origKey!];
        n.nodeStock = HARVEST[n.origKey!].cycles;
        n.regrowAt = undefined;
        occDirty();
      }
    });
    for (const c of clouds) {
      c.x += c.speed * dt;
      if (c.x - c.def.fw / 2 > WORLD_W) c.x = -c.def.fw / 2;
    }
  }
  // Fait apparaître une unité `key` sur une case libre proche de `near` (même île).
  function spawnUnitNear(key: string, near: Ent, isl: number): boolean {
    const def = SPRITES[key];
    const cst = COMBAT[combatBase(key) ?? ''];
    if (!def || !cst) return false;
    const bx = Math.floor(near.x / TS);
    const by = Math.floor(near.y / TS);
    for (let ring = 1; ring <= 4; ring++)
      for (let a = 0; a < 8; a++) {
        const cx = bx + Math.round(Math.cos((a / 8) * 2 * Math.PI) * ring);
        const cy = by + Math.round(Math.sin((a / 8) * 2 * Math.PI) * ring);
        if (islandAt(cx, cy) !== isl || !walkableCell(cx, cy) || getOcc().has(`${cx},${cy}`)) continue;
        const x = cx * TS + TS / 2;
        const y = cy * TS + TS * 0.75;
        decor.push({
          key,
          def,
          x,
          y,
          ph: Math.random() * 10,
          agent: true,
          walks: true,
          acting: -1,
          radius: 5,
          wait: Math.random(),
          face: 1,
          home: { isl, lvl: levelAt(cx, cy) },
          origin: { x, y },
          // Recrue fraîche : pas de vétérance, mais le grade d'entraînement de son royaume.
          rank: rankFor(key),
          hp: maxHpOf(key, rankFor(key)),
          maxHp: maxHpOf(key, rankFor(key)),
          id: `ai:${Math.random().toString(36).slice(2, 7)}`,
        } as Ent);
        return true;
      }
    return false;
  }
  // Recensement « qui tient quoi » : une seule passe sur la carte, partagée par la production, les
  // escadrons et les invasions (avant, chacun refaisait son propre balayage — et la production en
  // refaisait un PAR BÂTIMENT). `all` compte aussi les villageois (plafond de garnison), `fighters`
  // ne garde que ceux qui savent se battre ou soigner.
  type Garrison = { all: Ent[]; fighters: Ent[] };
  const garKey = (fac: string, isl: number) => `${fac}@${isl}`;
  function garrisons(): Map<string, Garrison> {
    const map = new Map<string, Garrison>();
    for (const e of [...decor, ...placed]) {
      if (!e.agent || !alive(e) || e.maxHp === undefined) continue;
      const isl = e.home?.isl ?? -1;
      if (isl < 0) continue;
      const k = garKey(factionOf(e.key), isl);
      let g = map.get(k);
      if (!g) map.set(k, (g = { all: [], fighters: [] }));
      g.all.push(e);
      if (isFighter(e)) g.fighters.push(e);
    }
    return map;
  }

  // Production des royaumes rivaux : chaque bâtiment ennemi forme lentement des unités (garnison plafonnée).
  function aiProduce() {
    const gar = garrisons();
    for (const b of [...decor]) {
      const base = /(caserne|archerie|monastere|chateau)/.exec(b.key)?.[1];
      if (!base) continue;
      const fac = factionOf(b.key);
      if (fac === playerFaction) continue; // le joueur recrute lui-même au marché
      const isl = islandAt(...cellAt(b.x, b.y));
      if (isl < 0) continue;
      const g = gar.get(garKey(fac, isl));
      if ((g?.all.length ?? 0) >= 6) continue; // garnison pleine sur cette île (plafond réduit pour désencombrer la carte)
      if (Math.random() > 0.5) continue; // production lente
      const ut =
        base === 'caserne' ? (Math.random() < 0.5 ? 'guerrier' : 'lancier') : base === 'archerie' ? 'archer' : base === 'monastere' ? 'moine' : 'villageois';
      const key = unitKey(ut, fac);
      // Le recensement est une photo prise en début de tour : sans ça, deux casernes de la même île
      // verraient toutes les deux « 5 » et dépasseraient le plafond au même tour.
      if (spawnUnitNear(key, b, isl)) {
        const born = { key } as Ent;
        if (g) g.all.push(born);
        else gar.set(garKey(fac, isl), { all: [born], fighters: [] });
      }
    }
  }

  // Anti-surpopulation : quand une île IA accumule trop de troupes, elle envoie un escadron à l'assaut
  // de l'ennemi le plus proche (ce qui déclenche le combat et désencombre) ; sans cible, on retire le surplus.
  const SQUAD_THRESHOLD = 5;
  const AI_HARD_CAP = 8;
  function aiDispatch() {
    for (const [k, g] of garrisons()) {
      const [fac, islStr] = k.split('@');
      if (fac === playerFaction) continue; // on ne bouscule que les royaumes IA
      const isl = +islStr;
      if (!unlocked.has(isl)) continue;
      const units = g.fighters;
      if (units.length < SQUAD_THRESHOLD) continue;
      const cx = units.reduce((s, u) => s + u.x, 0) / units.length;
      const cy = units.reduce((s, u) => s + u.y, 0) / units.length;
      // Ennemi (autre couleur) vivant le plus proche du centre du groupe, sur la même île.
      let target: Ent | null = null;
      let bd = Infinity;
      for (const o of [...decor, ...placed]) {
        // Unités ET bâtiments : sans défenseur, l'escadron va raser ce qui reste debout.
        if (!(o.agent || isBuilding(o)) || !alive(o) || o.maxHp === undefined || o.home?.isl !== isl || !hostile(units[0], o)) continue;
        const d = Math.hypot(o.x - cx, o.y - cy);
        if (d < bd) {
          bd = d;
          target = o;
        }
      }
      if (target) {
        // Envoie la moitié la plus proche en escadron ; le reste tient la garnison.
        const squad = [...units]
          .sort((a, b) => Math.hypot(a.x - target!.x, a.y - target!.y) - Math.hypot(b.x - target!.x, b.y - target!.y))
          .slice(0, Math.max(2, Math.ceil(units.length / 2)));
        for (const u of squad) {
          if (u === drag?.ent || u === moveEnt) continue;
          u.order = { x: target.x, y: target.y };
          u.orderTarget = isFighter(target) ? target : undefined;
          u.task = undefined;
          u.moving = false;
          u.acting = -1;
          u.wait = 0;
        }
      } else if (units.length > AI_HARD_CAP) {
        // Aucun ennemi sur l'île : le surplus « embarque » (retiré) pour ne pas saturer la carte.
        for (const u of units.slice(AI_HARD_CAP)) {
          u.dead = true;
          effects.push({ x: u.x, y: u.y, t0: t, kind: 'dust' });
        }
      }
    }
  }

  // ---------- Invasions (Phase 4) ----------
  // Les rivaux ne se contentent plus de produire chez eux : quand une de leurs îles a une garnison
  // suffisante, ils EMBARQUENT une partie de leurs troupes (elles quittent vraiment leur île, pas de
  // duplication) et les débarquent sur une de tes îles, avec ordre de marche sur ton château.
  // Si aucun royaume n'a encore d'armée, une bande de mercenaires débarque quand même (ancien raid).

  // Cases de bord d'une île, loin du centre : c'est là qu'on accoste.
  function shoreSpots(isl: number): [number, number][] {
    const info = WORLD.islands[isl];
    if (!info) return [];
    const ccx = Math.floor(info.cx / TS);
    const ccy = Math.floor(info.cy / TS);
    const spots: [number, number][] = [];
    for (let ring = 10; ring >= 5 && spots.length < 6; ring--)
      for (let a = 0; a < 12; a++) {
        const cx = ccx + Math.round(Math.cos((a / 12) * 2 * Math.PI) * ring);
        const cy = ccy + Math.round(Math.sin((a / 12) * 2 * Math.PI) * ring);
        if (islandAt(cx, cy) === isl && walkableCell(cx, cy) && !getOcc().has(`${cx},${cy}`)) spots.push([cx, cy]);
      }
    return spots;
  }
  // Débarque une unité sur une case de bord et lui donne son ordre de marche vers l'intérieur des terres.
  function landUnit(key: string, isl: number, spots: [number, number][], march?: { x: number; y: number }): boolean {
    const def = SPRITES[key];
    const cst = COMBAT[combatBase(key) ?? ''];
    if (!def || !cst || !spots.length) return false;
    const [cx, cy] = spots[Math.floor(Math.random() * spots.length)];
    const x = cx * TS + TS / 2;
    const y = cy * TS + TS * 0.75;
    decor.push({
      key,
      def,
      x,
      y,
      ph: Math.random() * 10,
      agent: true,
      walks: true,
      acting: -1,
      radius: 3,
      wait: Math.random(),
      face: -1,
      home: { isl, lvl: levelAt(cx, cy) },
      origin: { x, y },
      // Les envahisseurs débarquent au grade de leur royaume : une invasion tardive fait mal.
      rank: rankFor(key),
      hp: maxHpOf(key, rankFor(key)),
      maxHp: maxHpOf(key, rankFor(key)),
      raider: true,
      order: march ? { ...march } : undefined,
      id: `raider:${Math.random().toString(36).slice(2, 7)}`,
    } as Ent);
    return true;
  }
  // Vers quoi les envahisseurs marchent : le bien le plus précieux de l'île qui n'est PAS à eux
  // (château > bâtiment > unité). Le camp visé est un paramètre : la même fonction sert aux
  // débarquements chez toi et aux guerres que les rivaux se font entre eux.
  function marchGoal(isl: number, attackerFac: string): { x: number; y: number } | undefined {
    let best: Ent | null = null;
    let score = 0;
    for (const o of [...placed, ...decor]) {
      if (!alive(o) || factionOf(o.key) === attackerFac || o.home?.isl !== isl) continue;
      const b = siegeBase(o.key);
      // `maxHp` exigé pour le repli sur une unité : marcher sur un mouton ne mène nulle part
      // (il n'a pas de PV, on ne peut pas l'abattre).
      const s = b === 'chateau' ? 3 : b ? 2 : o.agent && o.maxHp !== undefined ? 1 : 0;
      if (s > score) {
        score = s;
        best = o;
      }
    }
    return best ? aimAt(best) : undefined;
  }
  // Embarque une partie d'une garnison et la débarque sur `toIsl`. Les hommes partis MEURENT chez eux :
  // une expédition DÉPLACE une armée, elle ne la duplique pas.
  function sendExpedition(units: Ent[], toIsl: number, spots: [number, number][], march?: { x: number; y: number }): number {
    let n = 0;
    for (const u of units.slice(0, Math.min(5, Math.max(2, Math.floor(units.length / 2))))) {
      if (u === drag?.ent || u === moveEnt) continue;
      if (!landUnit(u.key, toIsl, spots, march)) continue;
      u.dead = true;
      effects.push({ x: u.x, y: u.y, t0: t, kind: 'dust' });
      n++;
    }
    return n;
  }
  // ---------- Expéditions du joueur (traversées) ----------
  // Une armée ne marche pas sur l'eau. Quand on lui ordonne d'aller sur une AUTRE île, elle gagne
  // d'abord sa propre côte, embarque, traverse, puis débarque — au lieu de se téléporter.
  // Contrairement aux expéditions de l'IA, on DÉPLACE l'unité au lieu de la détruire et d'en recréer
  // une : celles du joueur sont achetées et persistées, les perdre en route serait inacceptable.
  const SWIM_SPEED = 34; // px/s dans l'eau : plus lent que la marche, et surtout bien visible

  // Vrai littoral d'une île : toute case de sol bordée d'eau. `shoreSpots` n'échantillonne que huit
  // points sur des anneaux autour du centre — assez pour poser un débarquement au hasard, beaucoup
  // trop grossier pour choisir un embarcadère : un soldat déjà au bon endroit devait rebrousser
  // chemin sur la moitié de l'île. Calculé une fois par île, puis mémorisé.
  const coastCache = new Map<number, [number, number][]>();
  function coastCells(isl: number): [number, number][] {
    const hit = coastCache.get(isl);
    if (hit) return hit;
    const out: [number, number][] = [];
    for (let y = 0; y < WORLD.h; y++)
      for (let x = 0; x < WORLD.w; x++) {
        if (islandAt(x, y) !== isl || !groundAt(x, y)) continue;
        const water =
          levelAt(x + 1, y) <= 0 || levelAt(x - 1, y) <= 0 || levelAt(x, y + 1) <= 0 || levelAt(x, y - 1) <= 0;
        if (water) out.push([x, y]);
      }
    coastCache.set(isl, out);
    return out;
  }

  /**
   * Où s'embarquer : une case de bord de l'île de `e`, joignable par lui, et tournée vers l'île
   * visée. On pondère la distance à parcourir et celle qui reste à franchir en mer — viser
   * uniquement la côte la plus proche de la destination envoyait parfois la troupe traverser toute
   * l'île pour gagner trois mètres de mer.
   */
  function departureSpot(e: Ent, to: number): [number, number] | null {
    const dest = WORLD.islands[to];
    const from = e.home?.isl ?? -1;
    if (!dest || from < 0) return null;
    const here = regionAt(Math.floor(e.x / TS), Math.floor(e.y / TS));
    const across = coastCells(to);
    if (!across.length) return null;
    // On mesure la mer VRAIMENT à franchir : la distance jusqu'à la côte d'en face la plus proche
    // (et non jusqu'au centre de l'île visée, qui faisait parfois longer la terre à la nage). La mer
    // pèse lourd : un soldat préfère marcher jusqu'au point le plus proche de l'autre rive.
    let best: [number, number] | null = null;
    let bd = Infinity;
    for (const [cx, cy] of coastCells(from)) {
      const walk = Math.hypot(cx * TS - e.x, cy * TS - e.y);
      if (walk >= bd) continue; // même sans mer, ce quai coûterait déjà plus que le meilleur
      let sea = Infinity;
      for (const [ax, ay] of across) {
        const q = (ax - cx) ** 2 + (ay - cy) ** 2;
        if (q < sea) sea = q;
      }
      const d = Math.sqrt(sea) * TS * SEA_WEIGHT + walk;
      if (d >= bd) continue;
      if (passageRoute(here, regionAt(cx, cy)) === null) continue; // côte inatteignable pour lui
      bd = d;
      best = [cx, cy];
    }
    return best;
  }
  // Un pas en mer « coûte » autant que SEA_WEIGHT pas à terre : on marche tant qu'on peut, on ne
  // nage que pour franchir le bras de mer le plus court.
  const SEA_WEIGHT = 4;

  // Plus petite largeur de mer (en cases) entre deux îles : bord à bord. Calculée à la demande, puis
  // mémorisée — le terrain ne change jamais.
  const gapCache = new Map<string, number>();
  function seaGap(a: number, b: number): number {
    const k = a < b ? `${a}-${b}` : `${b}-${a}`;
    let d = gapCache.get(k);
    if (d === undefined) {
      d = Infinity;
      const cb = coastCells(b);
      for (const [ax, ay] of coastCells(a))
        for (const [bx, by] of cb) {
          const q = (ax - bx) ** 2 + (ay - by) ** 2;
          if (q < d) d = q;
        }
      d = Math.sqrt(d);
      gapCache.set(k, d);
    }
    return d;
  }
  /**
   * Prochaine île où poser le pied pour aller de `from` à `to` en nageant le MOINS possible : on
   * traverse à pied les îles (débloquées) qui se trouvent sur le chemin plutôt que de faire toute
   * la route dans l'eau. Plus court chemin (Dijkstra) sur le graphe des îles, une arête = un bras de
   * mer, son coût = sa largeur (+ un petit forfait par débarquement, pour éviter les détours absurdes).
   */
  function nextHop(from: number, to: number): number {
    const nodes = WORLD.islands.map((_, i) => i).filter((i) => i === to || i === from || unlocked.has(i));
    const dist = new Map<number, number>(nodes.map((i) => [i, Infinity]));
    const prev = new Map<number, number>();
    const done = new Set<number>();
    dist.set(from, 0);
    while (done.size < nodes.length) {
      let u = -1;
      let du = Infinity;
      for (const i of nodes) if (!done.has(i) && dist.get(i)! < du) (u = i), (du = dist.get(i)!);
      if (u < 0 || u === to) break;
      done.add(u);
      for (const v of nodes) {
        if (done.has(v) || v === u) continue;
        const nd = du + seaGap(u, v) + 2;
        if (nd < dist.get(v)!) {
          dist.set(v, nd);
          prev.set(v, u);
        }
      }
    }
    if (!Number.isFinite(dist.get(to)!)) return to;
    let hop = to;
    while (prev.get(hop) !== undefined && prev.get(hop) !== from) hop = prev.get(hop)!;
    return hop;
  }
  /**
   * Met `e` en route vers l'île `final` : il marche jusqu'au quai le plus proche de la prochaine île
   * de l'itinéraire, nage le bras de mer, et recommence à l'arrivée jusqu'à la destination.
   */
  function planCrossing(e: Ent, final: number, march?: { x: number; y: number }): boolean {
    const from = e.home?.isl ?? -1;
    if (from < 0 || from === final) return false;
    // On ne se met JAMAIS à l'eau si les pieds suffisent. Le seul critère était « autre index d'île »,
    // or deux terres voisines peuvent très bien communiquer par une rampe ou une langue de sol : le
    // soldat partait nager le long d'une côte qu'il n'avait qu'à longer. Le graphe des régions (qui
    // relie les paliers par les escaliers) tranche, et il ne coûte rien — il est calculé une fois.
    if (
      march &&
      reachable(Math.floor(e.x / TS), Math.floor(e.y / TS), Math.floor(march.x / TS), Math.floor(march.y / TS))
    ) {
      e.cross = undefined;
      e.warp = undefined;
      e.order = { x: march.x, y: march.y };
      return true;
    }
    let to = nextHop(from, final);
    let quay = departureSpot(e, to);
    // Escale impraticable (côte hors d'atteinte depuis ce palier) : on vise directement le but.
    if (!quay && to !== final) quay = departureSpot(e, (to = final));
    if (!quay) return false;
    e.cross = { isl: to, march, final };
    e.warp = undefined;
    e.order = { x: quay[0] * TS + TS / 2, y: quay[1] * TS + TS * 0.75 };
    return true;
  }
  /** Case de bord libre de `isl` la plus proche du point (x, y) : là où l'on touchera terre. */
  // Points d'arrivée déjà promis à un nageur : l'occupation ne les connaît pas encore (personne n'y
  // est), et sans cette réserve toute une troupe partie en même temps débarquait sur la même case.
  const bookedLandings = new Set<string>();
  function landingSpot(isl: number, x: number, y: number): [number, number] | null {
    const occ = getOcc();
    let best: [number, number] | null = null;
    let bd = Infinity;
    for (const [cx, cy] of coastCells(isl)) {
      if (occ.has(`${cx},${cy}`) || bookedLandings.has(`${cx},${cy}`)) continue;
      const d = Math.hypot(cx * TS - x, cy * TS - y);
      if (d < bd) {
        bd = d;
        best = [cx, cy];
      }
    }
    return best;
  }
  /** Repose une unité EXISTANTE sur une case précise de `isl` et lui donne son ordre de marche. */
  function landExisting(e: Ent, isl: number, at: [number, number], march?: { x: number; y: number }): boolean {
    const [cx, cy] = at;
    e.x = cx * TS + TS / 2;
    e.y = cy * TS + TS * 0.75;
    e.home = { isl, lvl: levelAt(cx, cy) };
    e.origin = { x: e.x, y: e.y };
    e.order = march ? { ...march } : undefined;
    e.orderTarget = undefined;
    e.target = undefined;
    dropTask(e);
    e.moving = false;
    e.acting = -1;
    e.wait = 0;
    e.cross = undefined;
    e.sailing = undefined;
    // On persiste la nouvelle position, sinon l'unité serait de retour sur son île au rechargement.
    if (e.placed) {
      e.placed.x = Math.round(e.x);
      e.placed.y = Math.round(e.y);
      e.orig = { x: e.x, y: e.y };
      opts.onMove?.(e.placed.k, e.placed.x, e.placed.y);
    } else if (e.id && /^\d+$/.test(e.id)) opts.onDecorMove?.(e.id, Math.round(e.x), Math.round(e.y));
    occDirty();
    effects.push({ x: e.x, y: e.y, t0: t, kind: 'dust', s: 1.2 }, { x: e.x, y: e.y, t0: t, kind: 'ring' });
    return true;
  }
  // ---------- Portails ----------
  // Un portail est un bâtiment neutre qu'on achète et qu'on pose. Deux portails sur deux îles
  // différentes ouvrent une route : les troupes marchent jusqu'au plus proche et ressortent à
  // l'autre bout, au lieu de faire le tour par la mer.
  const isPortal = (e: Ent) => e.key === 'portail';
  const portals = () => placed.filter((e) => isPortal(e) && !e.dead);
  /** Portail de l'île `isl` le plus proche de (x, y), s'il y en a un. */
  function portalOn(isl: number, x: number, y: number): Ent | null {
    let best: Ent | null = null;
    let bd = Infinity;
    for (const p of portals()) {
      if (islandAt(Math.floor(p.x / TS), Math.floor(p.y / TS)) !== isl) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }
  /** Case libre au pied d'un portail : c'est là qu'on entre et qu'on ressort. */
  function portalStep(p: Ent): [number, number] | null {
    const px = Math.floor(p.x / TS);
    const py = Math.floor(p.y / TS);
    const occ = getOcc();
    for (const [dx, dy] of [
      [0, 1],
      [-1, 1],
      [1, 1],
      [-1, 0],
      [1, 0],
      [0, 2],
    ] as const) {
      const cx = px + dx;
      const cy = py + dy;
      if (!groundAt(cx, cy) || occ.has(`${cx},${cy}`)) continue;
      return [cx, cy];
    }
    return null;
  }
  /** L'unité est au pied du portail : elle disparaît dans le vortex et ressort à l'autre. */
  function teleport(e: Ent) {
    const w = e.warp!;
    e.warp = undefined;
    effects.push({ x: e.x, y: e.y - 20, t0: t, kind: 'ring', s: 1.6 }, { x: e.x, y: e.y, t0: t, kind: 'dust', s: 1.4 });
    e.x = w.x;
    e.y = w.y;
    e.home = { isl: w.isl, lvl: levelAt(Math.floor(w.x / TS), Math.floor(w.y / TS)) };
    e.origin = { x: e.x, y: e.y };
    e.order = w.march ? { ...w.march } : undefined;
    e.orderTarget = undefined;
    e.target = undefined;
    dropTask(e);
    e.moving = false;
    e.acting = -1;
    e.wait = 0;
    if (e.placed) {
      e.placed.x = Math.round(e.x);
      e.placed.y = Math.round(e.y);
      e.orig = { x: e.x, y: e.y };
      opts.onMove?.(e.placed.k, e.placed.x, e.placed.y);
    } else if (e.id && /^\d+$/.test(e.id)) opts.onDecorMove?.(e.id, Math.round(e.x), Math.round(e.y));
    occDirty();
    effects.push({ x: e.x, y: e.y - 20, t0: t, kind: 'ring', s: 1.6 }, { x: e.x, y: e.y - 18, t0: t, kind: 'hit', s: 1.3 });
  }

  /** L'unité a atteint la côte : elle se met à l'eau, et on la VOIT traverser. */
  function embark(e: Ent) {
    const to = e.cross!.isl;
    const at = landingSpot(to, e.x, e.y);
    if (!at) {
      // Rivage d'en face saturé : on réessaiera, plutôt que de la laisser plantée sur le sable.
      e.wait = 1;
      return;
    }
    bookedLandings.add(`${at[0]},${at[1]}`);
    const x1 = at[0] * TS + TS / 2;
    const y1 = at[1] * TS + TS * 0.75;
    const d = Math.hypot(x1 - e.x, y1 - e.y);
    e.sailing = { x0: e.x, y0: e.y, x1, y1, t0: t, dur: Math.max(1.2, d / SWIM_SPEED), isl: to, march: e.cross!.march, final: e.cross!.final };
    e.order = undefined;
    e.moving = true; // animation de course pendant la nage
    e.acting = -1;
    e.face = x1 < e.x ? -1 : 1;
    effects.push({ x: e.x, y: e.y, t0: t, kind: 'wake', s: 1.4 }); // gerbe d'entrée dans l'eau
    occDirty();
  }
  /** Fait avancer les nageurs et les dépose sur l'autre rive. */
  function stepCrossings() {
    for (const e of [...placed, ...decor]) {
      const s = e.sailing;
      if (!s || e.dead) continue;
      const k = (t - s.t0) / s.dur;
      if (k >= 1) {
        const at: [number, number] = [Math.floor(s.x1 / TS), Math.floor(s.y1 / TS)];
        e.sailing = undefined;
        bookedLandings.delete(`${at[0]},${at[1]}`);
        landExisting(e, s.isl, at, s.march);
        // Escale : on n'est pas encore arrivé, on traverse cette île à pied jusqu'au prochain quai.
        if (s.final !== undefined && s.final !== s.isl) planCrossing(e, s.final, s.march);
        continue;
      }
      e.x = s.x0 + (s.x1 - s.x0) * k;
      e.y = s.y0 + (s.y1 - s.y0) * k;
      // Sillage : une ondulation de loin en loin, pour que la traversée se lise comme une nage.
      if (Math.floor((t - s.t0) * 2) !== Math.floor((t - s.t0 - 0.02) * 2)) effects.push({ x: e.x, y: e.y - 14, t0: t, kind: 'wake', s: 0.8 });
    }
  }

  function launchInvasion() {
    // On ne débarque que sur une île à toi qui a de quoi se défendre (sinon on massacre des villageois).
    const defended = new Set<number>();
    for (const e of [...placed, ...decor]) {
      if (!alive(e) || !isFriendly(e)) continue;
      const isl = e.home?.isl ?? -1;
      if (isl < 0 || !unlocked.has(isl)) continue;
      if (isFighter(e) || combatBase(e.key) === 'tour') defended.add(isl);
    }
    if (!defended.size) return;
    const targets = [...defended];
    const isl = targets[Math.floor(Math.random() * targets.length)];
    const spots = shoreSpots(isl);
    if (!spots.length) return;

    // 1) Un vrai royaume envoie ses troupes : on prend sa plus grosse garnison, ailleurs que sur la cible.
    const host = [...garrisons()]
      .map(([k, g]) => ({ fac: k.split('@')[0], isl: +k.split('@')[1], units: g.fighters }))
      .filter((h) => h.fac !== playerFaction && h.isl !== isl && h.units.length >= 4)
      .sort((a, b) => b.units.length - a.units.length)[0];
    let fac = '';
    let n = 0;
    if (host) {
      fac = host.fac;
      n = sendExpedition(host.units, isl, spots, marchGoal(isl, fac));
    }
    // 2) Aucun royaume prêt : mercenaires, dont le nombre croît avec ton armée sur place.
    if (!n) {
      const rivals = ['bleu', 'rouge', 'jaune', 'violet', 'noir'].filter((f) => f !== playerFaction);
      fac = rivals[Math.floor(Math.random() * rivals.length)];
      const march = marchGoal(isl, fac);
      const kinds = ['guerrier', 'guerrier', 'archer', 'lancier'].map((b) => unitKey(b, fac));
      const army = [...placed, ...decor].filter((e) => alive(e) && isFriendly(e) && isFighter(e) && e.home?.isl === isl).length;
      const size = Math.min(6, 2 + Math.floor(army / 3));
      for (let k = 0; k < size; k++) if (landUnit(kinds[Math.floor(Math.random() * kinds.length)], isl, spots, march)) n++;
    }
    if (n) opts.onInvasion?.(fac, WORLD.islands[isl]?.name ?? 'ton royaume', n);
  }

  // Qui tient quoi, unités ET bâtiments, par île et par couleur. `garrisons()` ne connaît que les
  // vivants qui marchent ; pour choisir la cible d'une guerre il faut aussi savoir où sont les murs.
  type Holding = { fighters: number; buildings: number; castle: boolean };
  function holdings(): Map<number, Map<string, Holding>> {
    const map = new Map<number, Map<string, Holding>>();
    const touch = (isl: number, fac: string): Holding => {
      let byFac = map.get(isl);
      if (!byFac) map.set(isl, (byFac = new Map()));
      let h = byFac.get(fac);
      if (!h) byFac.set(fac, (h = { fighters: 0, buildings: 0, castle: false }));
      return h;
    };
    for (const e of [...decor, ...placed]) {
      if (!alive(e)) continue;
      if (e.agent && e.maxHp !== undefined) {
        const isl = e.home?.isl ?? -1;
        if (isl >= 0 && isFighter(e)) touch(isl, factionOf(e.key)).fighters++;
      } else if (isBuilding(e)) {
        const isl = islandAt(...cellAt(e.x, e.y));
        if (isl < 0) continue;
        const h = touch(isl, factionOf(e.key));
        h.buildings++;
        if (siegeBase(e.key) === 'chateau') h.castle = true;
      }
    }
    return map;
  }

  // Les rivaux ne s'en prennent pas qu'à toi : quand l'un d'eux a une garnison de trop, il embarque
  // pour l'île d'un AUTRE rival. Le monde change de mains même pendant que tu fais tes leçons.
  function launchRivalWar() {
    const held = holdings();
    const hosts = [...garrisons()]
      .map(([k, g]) => ({ fac: k.split('@')[0], isl: +k.split('@')[1], units: g.fighters }))
      .filter((h) => h.fac !== playerFaction && h.units.length >= 4)
      .sort((a, b) => b.units.length - a.units.length);
    for (const host of hosts) {
      // Cible : une île DÉBLOQUÉE (sous le brouillard le moteur n'anime rien, la guerre serait
      // invisible) tenue par une autre couleur rivale, et où tu n'as pas de château — tes îles
      // restent l'affaire de `launchInvasion`.
      let best: { isl: number; fac: string; force: number } | null = null;
      for (const [isl, byFac] of held) {
        if (isl === host.isl || !unlocked.has(isl)) continue;
        if (byFac.get(playerFaction)?.castle) continue;
        for (const [fac, h] of byFac) {
          if (fac === host.fac || fac === playerFaction) continue;
          if (!h.buildings && !h.fighters) continue;
          // On vise le plus faible : sinon les rivaux s'épuisent sans jamais prendre une île.
          if (!best || h.fighters < best.force) best = { isl, fac, force: h.fighters };
        }
      }
      if (!best) continue;
      const spots = shoreSpots(best.isl);
      if (!spots.length) continue;
      const n = sendExpedition(host.units, best.isl, spots, marchGoal(best.isl, host.fac));
      if (n) {
        opts.onWar?.(host.fac, best.fac, WORLD.islands[best.isl]?.name ?? 'une île', n);
        return; // une seule guerre par tour : la carte reste lisible
      }
    }
  }

  // ---------- Dessin ----------
  function roundRect(x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }
  /**
   * Les quatre équerres du pack (`Cursor_04`) autour de l'objet qu'on pose ou qu'on déplace : on voit
   * l'emprise exacte avant de lâcher. Chaque coin est découpé dans l'image d'origine et posé sur le
   * coin correspondant, sans étirer le trait.
   */
  function drawBracket(x: number, y: number, w: number, h: number, ok: boolean) {
    if (!bracket.complete || !bracket.naturalWidth) return;
    const c = 34; // taille du coin découpé dans l'image source (128 px)
    const d = Math.min(26, Math.max(14, Math.min(w, h) * 0.35)); // taille à l'écran
    ctx.save();
    ctx.globalAlpha = ok ? 0.95 : 0.55;
    const corners: [number, number, number, number][] = [
      [0, 0, x, y],
      [128 - c, 0, x + w - d, y],
      [0, 128 - c, x, y + h - d],
      [128 - c, 128 - c, x + w - d, y + h - d],
    ];
    for (const [sx, sy, dx, dy] of corners) ctx.drawImage(bracket, sx, sy, c, c, dx, dy, d, d);
    ctx.restore();
  }

  // Rond doré pulsant sous un objet : l'objet inspecté (plein) ou un membre de la troupe (atténué).
  function drawRing(e: Ent, alpha: number) {
    const pulse = (Math.sin(t * 5) + 1) / 2;
    ctx.save();
    ctx.shadowColor = `rgba(255, 220, 110, ${0.9 * alpha})`;
    ctx.shadowBlur = 12 + 10 * pulse;
    ctx.strokeStyle = `rgba(255, 226, 120, ${(0.65 + 0.35 * pulse) * alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const fw = footprint(e.key)?.w ?? 1;
    const ringY = e.y - decorLift(e.key) - (fw > 1 ? 16 : 0); // recale le rond sous l'objet centré
    ctx.ellipse(e.x, ringY, 30 * fw + 3 * pulse, 11 * Math.max(1, fw * 0.7) + pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  function drawPlacement(ent: Ent, px: number, py: number) {
    const occ = getOcc();
    const self = keyOf(ent);
    const fit = checkFit(ent.key, px, py, unlocked, occ, self);
    const ok = fit.ok;
    const xs = fit.cells.map((c) => c.cx);
    const ys = fit.cells.map((c) => c.cy);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const inFp = (x: number, y: number) => x >= minX && x <= maxX && y >= minY && y <= maxY;
    const mx = (minX + maxX) / 2;
    const my = (minY + maxY) / 2;
    const pulse = (Math.sin(t * 7) + 1) / 2;
    // grille autour : cases libres en blanc, cases déjà prises en rouge pâle
    const R = 4 + (maxX - minX) / 2;
    for (let ny = Math.floor(my - R); ny <= Math.ceil(my + R); ny++)
      for (let nx = Math.floor(mx - R - 1); nx <= Math.ceil(mx + R + 1); nx++) {
        if (inFp(nx, ny)) continue;
        const d = Math.hypot(nx - mx, (ny - my) * 1.2);
        if (d > R + 0.3) continue;
        if (!canPlaceAt(nx * TS + TS / 2, ny * TS + TS / 2, unlocked)) continue;
        const o = occ.get(`${nx},${ny}`);
        const taken = !!o && o !== self;
        const a = 0.3 * (1 - d / (R + 0.6));
        ctx.fillStyle = taken ? `rgba(255, 80, 70, ${a * 0.7})` : `rgba(255, 255, 255, ${a * 0.45})`;
        ctx.strokeStyle = taken ? `rgba(255, 110, 100, ${a * 1.2})` : `rgba(255, 255, 255, ${a})`;
        ctx.lineWidth = 2;
        roundRect(nx * TS + 4, ny * TS + 4, TS - 8, TS - 8, 10);
        ctx.fill();
        ctx.stroke();
      }
    // emprise visée : elle s'illumine et respire (rouge qui tremble si c'est interdit)
    const shake = !ok && t - flashBad < 0.35 ? Math.sin((t - flashBad) * 60) * 5 : 0;
    const grow = 3 * pulse;
    const x0 = minX * TS + 2 - grow + shake;
    const y0 = minY * TS + 2 - grow;
    const size = (maxX - minX + 1) * TS - 4 + grow * 2;
    const sizeH = (maxY - minY + 1) * TS - 4 + grow * 2;
    ctx.save();
    ctx.shadowColor = ok ? 'rgba(90, 255, 130, 1)' : 'rgba(255, 70, 60, 1)';
    ctx.shadowBlur = 18 + 16 * pulse;
    ctx.fillStyle = ok ? `rgba(90, 255, 130, ${0.28 + 0.22 * pulse})` : `rgba(255, 70, 60, ${0.3 + 0.2 * pulse})`;
    roundRect(x0, y0, size, sizeH, 12);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = ok ? `rgba(200, 255, 210, ${0.8 + 0.2 * pulse})` : `rgba(255, 190, 180, ${0.8 + 0.2 * pulse})`;
    ctx.stroke();
    ctx.restore();
    // cases en conflit : croix rouges
    if (!ok) {
      ctx.strokeStyle = 'rgba(160, 20, 20, 0.85)';
      ctx.lineWidth = 5;
      for (const c of fit.cells) {
        if (c.ok) continue;
        const cx0 = c.cx * TS + shake;
        const cy0 = c.cy * TS;
        ctx.beginPath();
        ctx.moveTo(cx0 + 18, cy0 + 18);
        ctx.lineTo(cx0 + TS - 18, cy0 + TS - 18);
        ctx.moveTo(cx0 + TS - 18, cy0 + 18);
        ctx.lineTo(cx0 + 18, cy0 + TS - 18);
        ctx.stroke();
      }
    }
    // reflet qui balaie la case
    if (ok) {
      const sweep = (t * 1.6) % 1;
      ctx.save();
      roundRect(x0, y0, size, sizeH, 12);
      ctx.clip();
      const gx = x0 + sweep * size * 2 - size * 0.5;
      const grad = ctx.createLinearGradient(gx - 20, y0, gx + 20, y0 + sizeH);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.55)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x0, y0, size, sizeH);
      ctx.restore();
    }
    // flèches aux quatre coins
    ctx.fillStyle = ok ? 'rgba(220, 255, 225, 0.95)' : 'rgba(255, 210, 200, 0.95)';
    const m = 6 + 4 * pulse;
    const c = [
      [x0 - m, y0 - m, 1, 1],
      [x0 + size + m, y0 - m, -1, 1],
      [x0 - m, y0 + sizeH + m, 1, -1],
      [x0 + size + m, y0 + sizeH + m, -1, -1],
    ];
    for (const [ax, ay, sx, sy] of c) {
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + 12 * sx, ay);
      ctx.lineTo(ax, ay + 12 * sy);
      ctx.closePath();
      ctx.fill();
    }
  }
  function drawSprite(e: Ent, alpha = 1, lift = 0) {
    const def = e.def;
    // Flash de dégâts (l'unité vire au blanc-rouge un court instant) + recul décroissant.
    const flash = e.hurtT !== undefined ? Math.max(0, 1 - (t - e.hurtT) / 0.18) * 0.85 : 0;
    let recoilX = 0;
    let recoilY = 0;
    if (e.recoilT !== undefined) {
      const rk = 1 - (t - e.recoilT) / 0.18;
      if (rk > 0) {
        recoilX = (e.recoilX ?? 0) * rk;
        recoilY = (e.recoilY ?? 0) * rk;
      }
    }
    const run = e.moving && def.run;
    const act = !run && e.acting !== undefined && e.acting >= 0 ? def.act?.[e.acting] : undefined;
    // Charge sur le dos : on remplace la planche, jamais la clé de l'unité (cf. `hold` dans
    // sprites.ts). Le reste du moteur continue de voir un villageois ordinaire.
    const held = e.carry ? def.hold?.[e.carry] : undefined;
    const sheet = held ? (run ? held.run : held.idle) : run ? def.run! : act ?? { src: def.src, n: def.n };
    const im = img(sheet.src);
    if (!im.complete || !im.naturalWidth) return;
    const fps = run ? 12 : act ? 10 : def.fps || 8;
    const f = sheet.n > 1 ? (act ? Math.floor((t - (e.actT0 ?? 0)) * fps) : Math.floor(t * fps + e.ph)) % sheet.n : 0;
    // ombre portée quand on le soulève
    if (lift) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      const fw = footprint(e.key)?.w ?? 1;
      ctx.ellipse(e.x, e.y - decorLift(e.key) + 2 - (fw > 1 ? 16 : 0), 22 * fw, 8 * Math.max(1, fw * 0.6), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const bob = lift ? Math.sin(t * 8) * 3 : 0;
    const bottom = e.y + def.feet + lift + bob;
    const dx = e.x - def.fw / 2;
    const dy = bottom - def.fh;
    // rebond à l'atterrissage
    const ba = e.bounceT0 !== undefined ? t - e.bounceT0 : 9;
    if (ba < 0.45) {
      const k = Math.sin((ba / 0.45) * Math.PI) * (1 - ba / 0.45);
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.scale(1 + 0.12 * k, 1 - 0.18 * k);
      ctx.translate(-e.x, -e.y);
      ctx.globalAlpha = alpha;
      drawFrame();
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }
    // Ruine : le bâtiment d'origine, désaturé et assombri. On reconnaît ainsi du premier coup d'œil
    // CE QU'ON pourra relever là, ce qu'un tas de gravats générique ne dirait pas.
    if (e.ruin) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.5;
      ctx.filter = 'grayscale(1) brightness(0.55)';
      drawFrame();
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }
    if (e.sailing) {
      // À la nage, on ne voit que le haut du corps : les jambes sont sous l'eau. Sans ça, l'unité
      // semblait MARCHER sur la mer.
      const water = e.y - 16 + Math.sin(t * 5 + e.ph) * 1.5;
      ctx.save();
      ctx.beginPath();
      ctx.rect(dx - def.fw, dy - def.fh, def.fw * 3, water - (dy - def.fh));
      ctx.clip();
      ctx.globalAlpha = alpha;
      drawFrame();
      ctx.restore();
      ctx.globalAlpha = 1;
      // Sillage : deux traits d'écume derrière le nageur. Avant, c'était un anneau complet autour de
      // lui — sur la mer turquoise il tirait au vert et donnait l'impression d'un cerceau posé sous
      // ses pieds plutôt que d'un remous.
      // Taillé à l'échelle de la barre de vie (44 px de monde), pas à celle du sprite : la carte se
      // joue très dézoomée, un trait de 1,5 px de monde ne couvre même pas un pixel d'écran.
      ctx.strokeStyle = 'rgba(240, 250, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      const back = e.face === -1 ? 1 : -1; // l'écume traîne derrière, du côté d'où l'on vient
      const wob = Math.sin(t * 6 + e.ph) * 2;
      for (const oy of [-5, 5]) {
        ctx.beginPath();
        ctx.moveTo(e.x + back * 9, water + oy * 0.4);
        ctx.lineTo(e.x + back * 30, water + oy + wob);
        ctx.stroke();
      }
      // Remous à la taille : un arc ouvert vers l'avant, jamais un anneau fermé.
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const a0 = back < 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      ctx.ellipse(e.x, water + 1, 11, 4, 0, a0, a0 + Math.PI);
      ctx.stroke();
      return;
    }
    ctx.globalAlpha = alpha;
    drawFrame();
    ctx.globalAlpha = 1;
    // Silhouette teintée superposée à l'image quand l'unité vient d'être frappée.
    function drawTint() {
      tintCv.width = def.fw;
      tintCv.height = def.fh;
      tintCtx.clearRect(0, 0, def.fw, def.fh);
      tintCtx.globalCompositeOperation = 'source-over';
      tintCtx.drawImage(im, f * def.fw, 0, def.fw, def.fh, 0, 0, def.fw, def.fh);
      tintCtx.globalCompositeOperation = 'source-atop';
      tintCtx.fillStyle = 'rgb(255, 232, 228)';
      tintCtx.fillRect(0, 0, def.fw, def.fh);
      tintCtx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = flash * alpha;
      ctx.drawImage(tintCv, dx, dy, def.fw, def.fh);
      ctx.globalAlpha = 1;
    }
    function drawFrame() {
      ctx.save();
      if (recoilX || recoilY) ctx.translate(recoilX, recoilY);
      if (e.face === -1) {
        ctx.save();
        ctx.translate(e.x * 2, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(im, f * def.fw, 0, def.fw, def.fh, dx, dy, def.fw, def.fh);
        if (flash > 0) drawTint();
        ctx.restore();
      } else {
        ctx.drawImage(im, f * def.fw, 0, def.fw, def.fh, dx, dy, def.fw, def.fh);
        if (flash > 0) drawTint();
      }
      ctx.restore();
    }
  }


  // Habillage de barre du pack (`SmallBar_Base`) : 5 images de 64, dont seules 0 (embout gauche),
  // 2 (corps répétable) et 4 (embout droit) portent du dessin, sur la bande y 22..40. Le remplissage
  // fourni est rouge uni : on le remplace par un aplat, il faut distinguer allié et ennemi.
  const BAR = { band: 22, tall: 19, cap: 15, fillTop: 30 - 22, fillTall: 3 };
  function drawHealth(e: Ent) {
    const big = isBuilding(e);
    const w = big ? Math.min(104, Math.max(64, e.def.fw * 0.55)) : 44;
    const s = (big ? 14 : 11) / BAR.tall; // échelle : hauteur voulue rapportée à la bande source
    const frac = Math.max(0, Math.min(1, (e.hp ?? 0) / (e.maxHp ?? 1)));
    const x0 = e.x - w / 2;
    const top = e.y - (e.def.fh - e.def.feet) * (big ? 1 : 0.5) - (big ? 10 : 14);
    const cap = BAR.cap * s;
    ctx.save();
    if (barBase.complete && barBase.naturalWidth) {
      const mid = Math.max(0, w - 2 * cap);
      ctx.drawImage(barBase, 49, BAR.band, BAR.cap, BAR.tall, x0, top, cap, BAR.tall * s);
      ctx.drawImage(barBase, 128, BAR.band, 64, BAR.tall, x0 + cap, top, mid, BAR.tall * s);
      ctx.drawImage(barBase, 256, BAR.band, BAR.cap, BAR.tall, x0 + w - cap, top, cap, BAR.tall * s);
      ctx.fillStyle = isFriendly(e) ? 'rgba(110, 216, 96, 0.95)' : 'rgba(226, 76, 62, 0.95)';
      ctx.fillRect(x0 + cap, top + BAR.fillTop * s, mid * frac, Math.max(2, BAR.fillTall * s));
    } else {
      // L'image n'est pas encore chargée : on garde l'ancienne barre pleine, jamais rien à l'écran.
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x0 - 1, top - 1, w + 2, 7);
      ctx.fillStyle = isFriendly(e) ? 'rgba(95,210,95,0.95)' : 'rgba(225,70,70,0.95)';
      ctx.fillRect(x0, top, w * frac, 5);
    }
    // Liseré de grade autour de la jauge d'un vétéran : on voit d'un coup d'œil à qui on a affaire,
    // y compris en face.
    const r = e.rank ?? 1;
    if (r > 1 && !big) {
      ctx.strokeStyle = r >= RANK_MAX ? 'rgba(255, 211, 92, 0.9)' : 'rgba(226, 226, 214, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x0 - 1.5, top + BAR.fillTop * s - 2, w + 3, Math.max(2, BAR.fillTall * s) + 4);
    }
    ctx.restore();
  }

  /**
   * Grade : des chevrons au-dessus de la tête (argent au niveau 2, or au niveau 3), et un cerne doré
   * au sol pour les vétérans confirmés.
   * Passe à part, JAMAIS dans `drawSprite` : celui-ci retourne le contexte à l'horizontale pour les
   * unités qui regardent à gauche, et les chevrons partiraient à l'envers avec.
   * La hauteur est calculée indépendamment de la barre de vie : celle-ci n'apparaît que si l'unité
   * est blessée ou sélectionnée, un chevron calé dessus sauterait au premier coup reçu.
   */
  function drawRank(e: Ent) {
    const r = e.rank ?? 1;
    if (r < 2 || !e.agent || e.sailing) return;
    const gold = r >= RANK_MAX;
    // Taillé sur la barre de vie (44 px de monde) : la carte se joue dézoomée, un chevron de 7 px
    // ne faisait que deux pixels à l'écran — dessiné, mais invisible.
    const w = 20;
    const h = 10;
    // Même ancrage que `drawHealth`, remonté juste au-dessus de son emplacement. Les cadres des
    // sprites ont beaucoup de vide au-dessus de la tête, d'où le facteur 0.5 repris tel quel.
    const base = e.y - (e.def.fh - e.def.feet) * 0.5 - 20;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < r - 1; i++) {
      const y = base - i * 9;
      ctx.beginPath();
      ctx.moveTo(e.x - w / 2, y);
      ctx.lineTo(e.x, y - h);
      ctx.lineTo(e.x + w / 2, y);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'; // cerne noir : lisible sur l'herbe comme sur la pierre
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.strokeStyle = gold ? '#ffd35c' : '#e9e9df';
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }
    ctx.restore();
  }
  /** Cerne doré au sol du vétéran confirmé. Dessiné AVANT les sprites : sinon il barre ses pieds. */
  function drawVetRing(e: Ent) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + 2, 24, 9, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 211, 92, 0.55)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  /** Bâtiment amoché : des flammes dansent sur le toit, d'autant plus nombreuses qu'il est bas. */
  function drawBurning(e: Ent) {
    const frac = (e.hp ?? 1) / (e.maxHp ?? 1);
    if (frac >= 0.6) return;
    const n = frac < 0.25 ? 3 : frac < 0.45 ? 2 : 1;
    // Le feu prend sur le TOIT, pas devant la porte : on vise le haut du sprite.
    const roof = e.y + e.def.feet - e.def.fh * 0.78;
    const span = e.def.fw * 0.42;
    for (let i = 0; i < n; i++) {
      const def = SPRITES[`feu-${1 + (i % 3)}`];
      if (!def) continue;
      const im = img(def.src);
      if (!im.complete || !im.naturalWidth) continue;
      // Positions fixes par bâtiment (dérivées de sa position) : les flammes ne sautillent pas.
      const off = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2;
      const fx = e.x + off * span * 0.5 + (((Math.floor(e.x / 13) + i * 7) % 9) - 4);
      const fy = roof + (((i * 53) % 16) - 8);
      const f = Math.floor(t * (def.fps || 12) + i * 3) % def.n;
      ctx.drawImage(im, f * def.fw, 0, def.fw, def.fh, fx - def.fw / 2, fy - def.fh / 2, def.fw, def.fh);
    }
  }

  function hitBox(e: Ent) {
    const def = e.def;
    const unit = !!def.run || !!def.act; // vrai personnage / animal (pas un arbre ni un bâtiment)
    if (unit) {
      const w = Math.min(def.fw * 0.42, 70);
      const h = Math.min((def.fh - def.feet) * 0.55, 90);
      return { x0: e.x - w / 2, x1: e.x + w / 2, y0: e.y - h, y1: e.y + 8 };
    }
    // décor / bâtiment : boîte calée sur le bas réellement dessiné (e.y + feet), couvrant l'image
    const bottom = e.y + def.feet;
    const w = def.fw * 0.7;
    const h = def.fh * 0.82;
    return { x0: e.x - w / 2, x1: e.x + w / 2, y0: bottom - h, y1: bottom + 6 };
  }

  function forChunks(x0: number, y0: number, x1: number, y1: number, fn: (im: HTMLImageElement, ox: number, oy: number) => void) {
    const i0 = Math.max(0, Math.floor(x0 / CHUNK));
    const j0 = Math.max(0, Math.floor(y0 / CHUNK));
    const i1 = Math.min(Math.ceil(WORLD_W / CHUNK) - 1, Math.floor(x1 / CHUNK));
    const j1 = Math.min(Math.ceil(WORLD_H / CHUNK) - 1, Math.floor(y1 / CHUNK));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) fn(landChunk(i, j), i * CHUNK, j * CHUNK);
  }
  function chunkReady(x0: number, y0: number, x1: number, y1: number) {
    let ok = true;
    forChunks(x0, y0, x1, y1, (im) => {
      if (!im.complete || !im.naturalWidth) ok = false;
    });
    return ok;
  }
  function draw() {
    const vx0 = cam.x - W / 2 / cam.z;
    const vy0 = cam.y - H / 2 / cam.z;
    const vx1 = cam.x + W / 2 / cam.z;
    const vy1 = cam.y + H / 2 / cam.z;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = WATER;
    ctx.fillRect(0, 0, W, H);
    ctx.setTransform(DPR * cam.z, 0, 0, DPR * cam.z, DPR * (W / 2 - cam.x * cam.z), DPR * (H / 2 - cam.y * cam.z));
    ctx.imageSmoothingEnabled = false;

    drawOcean(ctx, t, cam.z, vx0, vy0, vx1, vy1);

    // écume (sous la terre)
    if (foam.complete && foam.naturalWidth) {
      const f = Math.floor(t * 10) % 16;
      for (const [cx, cy] of WORLD.foam) {
        const x = cx * TS - TS;
        const y = cy * TS - TS;
        if (x > vx1 || y > vy1 || x + 192 < vx0 || y + 192 < vy0) continue;
        ctx.drawImage(foam, ((f + cx + cy) % 16) * 192, 0, 192, 192, x, y, 192, 192);
      }
    }
    // terre, falaises, plateaux
    if (cam.z < 0.5 || !chunkReady(vx0, vy0, vx1, vy1)) {
      if (landLow.complete && landLow.naturalWidth) {
        const sx = Math.max(0, Math.floor(vx0));
        const sy = Math.max(0, Math.floor(vy0));
        const sw = Math.min(WORLD_W, Math.ceil(vx1)) - sx;
        const sh = Math.min(WORLD_H, Math.ceil(vy1)) - sy;
        if (sw > 0 && sh > 0) ctx.drawImage(landLow, sx / 2, sy / 2, sw / 2, sh / 2, sx, sy, sw, sh);
      }
    }
    if (cam.z >= 0.5) {
      forChunks(vx0, vy0, vx1, vy1, (im, ox, oy) => {
        if (!im.complete || !im.naturalWidth) return;
        const sx = Math.max(ox, Math.floor(vx0));
        const sy = Math.max(oy, Math.floor(vy0));
        const ex = Math.min(ox + im.naturalWidth, Math.ceil(vx1));
        const ey = Math.min(oy + im.naturalHeight, Math.ceil(vy1));
        if (ex > sx && ey > sy) ctx.drawImage(im, sx - ox, sy - oy, ex - sx, ey - sy, sx, sy, ex - sx, ey - sy);
      });
    }
    // sélection
    const sel = selected ? findByKey(selected) : null;
    if (sel && !drag?.ent && !moveEnt) drawRing(sel, 1);
    // troupe retenue au lasso : même rond, plus discret (elles sont plusieurs)
    if (troop.size)
      for (const k of troop) {
        const e = findByKey(k);
        if (e && alive(e) && e !== sel) drawRing(e, 0.55);
      }
    // cadre du lasso en cours de tracé
    if (band) {
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = 'rgba(255, 226, 120, 0.9)';
      ctx.fillStyle = 'rgba(255, 226, 120, 0.1)';
      ctx.lineWidth = 2;
      ctx.fillRect(band.x0, band.y0, band.x1 - band.x0, band.y1 - band.y0);
      ctx.strokeRect(band.x0, band.y0, band.x1 - band.x0, band.y1 - band.y0);
      ctx.restore();
    }
    // zone de pose : grille lumineuse façon jeu de stratégie
    const placing = drag?.ent && drag.moved ? drag.ent : moveEnt && ghost ? moveEnt : null;
    if (placing) {
      const px = placing === moveEnt ? ghost!.x : placing.x;
      const py = placing === moveEnt ? ghost!.y : placing.y;
      drawPlacement(placing, px, py);
      // Traqueur : les équerres cadrent l'emprise réelle, vertes si la case convient.
      const fp = footprint(placing.key);
      const bw = (fp?.w ?? 1) * TS;
      const bh = (fp?.h ?? 1) * TS;
      const fit = checkFit(placing.key, px, py, unlocked, getOcc(), keyOf(placing)).ok;
      drawBracket(px - bw / 2, py - bh + TS * 0.25, bw, bh, fit);
    }
    // sprites triés par profondeur (les ruines se mêlent au tri : un soldat passe devant l'une,
    // derrière l'autre, selon sa position)
    // Les nageurs RESTENT dessinés : c'est tout l'intérêt, on les voit traverser. Ils sont seulement
    // hors-jeu par ailleurs (`alive()` les exclut du combat et de l'occupation des cases).
    const all = [...decor, ...placed, ...ruins].filter((e) => {
      if (e.dead) return false;
      const b = e.y + e.def.feet;
      return e.x + e.def.fw / 2 > vx0 && e.x - e.def.fw / 2 < vx1 && b > vy0 && b - e.def.fh < vy1;
    });
    all.sort((a, b) => a.y - b.y);
    const lifted = drag?.ent && drag.moved ? drag.ent : null;
    // cernes de vétéran : au sol, donc sous les unités
    for (const e of all) if (e.agent && (e.rank ?? 1) >= RANK_MAX && !e.sailing && e !== lifted) drawVetRing(e);
    for (const e of all) {
      if (e === moveEnt) drawSprite(e, 0.35);
      else if (e !== lifted) drawSprite(e);
    }
    // bâtiments qui brûlent : sous les barres, au-dessus des sprites
    for (const e of all) if (isBuilding(e) && e.maxHp !== undefined && e.hp !== undefined) drawBurning(e);
    // barres de vie : au-dessus des unités blessées ou sélectionnées
    for (const e of all) {
      if (e.maxHp === undefined || e.hp === undefined) continue;
      const wounded = e.hp < e.maxHp;
      if (!wounded && keyOf(e) !== selected) continue;
      drawHealth(e);
    }
    // chevrons de grade : au-dessus de tout le reste
    for (const e of all) if (e !== lifted) drawRank(e);
    // flèches
    for (const p of projectiles) {
      ctx.save();
      ctx.strokeStyle = p.from === 'enemy' ? 'rgba(40,40,50,0.95)' : 'rgba(70,45,20,0.95)';
      ctx.lineWidth = 3;
      const a = Math.atan2(p.target.y - 24 - p.y, p.target.x - p.x);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - Math.cos(a) * 14, p.y - Math.sin(a) * 14);
      ctx.stroke();
      ctx.restore();
    }
    // l'objet soulevé passe au-dessus de tout le reste
    if (lifted) drawSprite(lifted, 0.9, -14);
    if (moveEnt && ghost) {
      const saved = { x: moveEnt.x, y: moveEnt.y };
      moveEnt.x = ghost.x;
      moveEnt.y = ghost.y;
      drawSprite(moveEnt, 0.85, -14);
      moveEnt.x = saved.x;
      moveEnt.y = saved.y;
    }
    // effets : poussière et onde lumineuse à l'atterrissage
    for (let i = effects.length - 1; i >= 0; i--) {
      const fx = effects[i];
      const age = t - fx.t0;
      if (fx.kind === 'dust') {
        const f = Math.floor(age * 22);
        if (f >= 10) {
          effects.splice(i, 1);
          continue;
        }
        const ds = 128 * Math.max(1, (fx.s ?? 1) * 0.8);
        if (dust.complete && dust.naturalWidth) ctx.drawImage(dust, f * 64, 0, 64, 64, fx.x - ds / 2, fx.y - ds * 0.75, ds, ds);
      } else if (fx.kind === 'ring') {
        if (age > 0.6) {
          effects.splice(i, 1);
          continue;
        }
        const k = age / 0.6;
        ctx.save();
        ctx.strokeStyle = `rgba(140, 255, 160, ${1 - k})`;
        ctx.shadowColor = 'rgba(120, 255, 150, 0.9)';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 4 * (1 - k) + 1;
        ctx.beginPath();
        const rs = fx.s ?? 1;
        ctx.ellipse(fx.x, fx.y, (20 + 50 * k) * rs, (8 + 18 * k) * Math.max(1, rs * 0.7), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (fx.kind === 'wake') {
        // Remous d'écume : le même anneau qui s'ouvre, mais blanc. Le `ring` vert est réservé aux
        // effets « magiques » (portail, atterrissage) — sur la mer turquoise il tirait au vert vif et
        // donnait l'impression d'un cerceau lumineux sous les pieds du nageur.
        const dur = 0.9;
        if (age > dur) {
          effects.splice(i, 1);
          continue;
        }
        const k = age / dur;
        ctx.save();
        ctx.strokeStyle = `rgba(245, 252, 255, ${0.7 * (1 - k)})`;
        ctx.lineWidth = 3 * (1 - k) + 1;
        ctx.beginPath();
        const rs = fx.s ?? 1;
        ctx.ellipse(fx.x, fx.y, (10 + 26 * k) * rs, (4 + 9 * k) * rs, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (fx.kind === 'hit') {
        // Onde de choc de l'impact : anneau blanc-orangé qui s'ouvre vite (façon Dune).
        const dur = 0.32;
        if (age > dur) {
          effects.splice(i, 1);
          continue;
        }
        const k = age / dur;
        const rs = fx.s ?? 1;
        ctx.save();
        ctx.strokeStyle = `rgba(255, ${Math.round(220 - 120 * k)}, 150, ${1 - k})`;
        ctx.shadowColor = 'rgba(255, 200, 120, 0.9)';
        ctx.shadowBlur = 14;
        ctx.lineWidth = (5 * (1 - k) + 1.5) * rs;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, (6 + 34 * k) * rs, 0, Math.PI * 2);
        ctx.stroke();
        // cœur lumineux au tout début
        if (k < 0.4) {
          ctx.globalAlpha = (1 - k / 0.4) * 0.9;
          ctx.fillStyle = 'rgba(255, 250, 235, 1)';
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, 7 * rs * (1 - k), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (fx.kind === 'slash') {
        // Éclair de lame : trait blanc lumineux dans le sens du coup.
        const dur = 0.18;
        if (age > dur) {
          effects.splice(i, 1);
          continue;
        }
        const k = age / dur;
        const len = 34;
        const ang = fx.ang ?? 0;
        ctx.save();
        ctx.translate(fx.x, fx.y);
        ctx.rotate(ang);
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = 'rgba(255, 255, 245, 1)';
        ctx.shadowColor = 'rgba(255, 240, 200, 1)';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 4 * (1 - k) + 1;
        ctx.beginPath();
        ctx.moveTo(-len / 2, 0);
        ctx.lineTo(len / 2, 0);
        ctx.stroke();
        ctx.restore();
      } else if (fx.kind === 'sand') {
        // Particule de sable/poussière projetée puis qui retombe (gravité).
        const dur = 0.5;
        if (age > dur) {
          effects.splice(i, 1);
          continue;
        }
        const px = fx.x + (fx.vx ?? 0) * age;
        const py = fx.y + (fx.vy ?? 0) * age + 260 * age * age; // gravité
        ctx.save();
        ctx.globalAlpha = (1 - age / dur) * 0.85;
        ctx.fillStyle = 'rgba(214, 188, 140, 1)';
        ctx.beginPath();
        ctx.arc(px, py, 2.2 * (fx.s ?? 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (fx.kind === 'dmg') {
        // Chiffre de dégâts qui monte et s'estompe.
        const dur = 0.9;
        if (age > dur) {
          effects.splice(i, 1);
          continue;
        }
        const k = age / dur;
        const py = fx.y - 26 * k;
        ctx.save();
        ctx.globalAlpha = 1 - k * k;
        ctx.font = '700 16px "MedievalSharp", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(20, 12, 8, 0.9)';
        ctx.fillStyle = fx.enemy ? 'rgb(255, 226, 120)' : 'rgb(255, 130, 120)';
        const txt = `-${fx.val ?? 0}`;
        ctx.strokeText(txt, fx.x, py);
        ctx.fillText(txt, fx.x, py);
        ctx.restore();
      } else if (fx.kind === 'rally') {
        // Marqueur de destination des troupes : chevrons qui pulsent puis disparaissent.
        const dur = 1.1;
        if (age > dur) {
          effects.splice(i, 1);
          continue;
        }
        const k = age / dur;
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = 'rgba(255, 226, 120, 1)';
        ctx.shadowColor = 'rgba(255, 200, 90, 0.9)';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 3;
        const r = 8 + (1 - Math.abs(Math.sin(age * 8))) * 6;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fx.x - 6, fx.y - 2);
        ctx.lineTo(fx.x, fx.y + 5);
        ctx.lineTo(fx.x + 6, fx.y - 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // nuages
    for (const c of clouds) {
      const im = img(c.def.src);
      if (!im.complete || !im.naturalWidth) continue;
      ctx.globalAlpha = 0.85;
      ctx.drawImage(im, c.x - c.def.fw / 2, c.y - c.def.fh);
      ctx.globalAlpha = 1;
    }

    // brouillard sur les îles verrouillées
    if (fogDirty) buildFog();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 1;
    ctx.drawImage(fogCanvas, 0, 0, fogCanvas.width, fogCanvas.height, -FOG_PAD * TS, -FOG_PAD * TS, WORLD_W + 2 * FOG_PAD * TS, WORLD_H + 2 * FOG_PAD * TS);
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = false;
    // étiquettes des îles (taille écran constante)
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    WORLD.islands.forEach((isl, i) => {
      if (isl.size <= 12) return;
      const locked = !unlocked.has(i);
      const sx = (isl.cx - cam.x) * cam.z + W / 2;
      const sy = (isl.cy - cam.y) * cam.z + H / 2;
      if (sx < -150 || sx > W + 150 || sy < -60 || sy > H + 60) return;
      if (!locked && cam.z >= 0.5) return; // de près, on laisse voir l'île
      // Nom de l'île écrit sur une bannière de papier (pack Tiny Swords), à taille écran constante.
      const name = isl.name.toLocaleUpperCase('fr');
      const left = isl.unlock - missionsDone;
      // Pas d'emoji cadenas : toutes les polices ne l'ont pas et il tombe en carré « tofu ».
      const sub = locked ? `${left} quête${left > 1 ? 's' : ''}` : '';
      ctx.save();
      ctx.letterSpacing = '2px'; // ignoré par les navigateurs qui ne le gèrent pas : sans conséquence
      ctx.font = '600 13px "MedievalSharp", Georgia, serif';
      const tw = ctx.measureText(name).width;
      const s = 0.26; // échelle de la bannière (243 px source → ~63 px au plus haut)
      const padX = 18;
      const bw = Math.max(tw + padX * 2, (BN.l + BN.r) * s + 10);
      // Zone de papier utile : du haut de la bannière jusqu'au bord avant les rouleaux (~y 200 source).
      const textH = sub ? 30 : 18;
      const bh = BN.t * s + textH + BN.b * s - 10;
      const bx = sx - bw / 2;
      // Centre la partie papier (sans les rouleaux, ~30 px source sous le milieu) sur le point de l'île.
      const paperTop = sy - (BN.t * s + (textH - 10) + 30 * s) / 2;
      if (paperBanner.complete && paperBanner.naturalWidth) {
        ctx.imageSmoothingEnabled = true;
        ctx.globalAlpha = locked ? 0.8 : 1;
        drawPaperBanner(bx, paperTop, bw, bh, s);
        ctx.globalAlpha = 1;
      }
      const ty = sub ? sy - 7 : sy;
      ctx.fillStyle = locked ? 'rgba(74, 58, 42, 0.8)' : '#3b2716';
      ctx.fillText(name, sx, ty);
      if (sub) {
        ctx.letterSpacing = '1px';
        ctx.font = '600 10px Georgia, serif';
        ctx.fillStyle = 'rgba(74, 58, 42, 0.75)';
        ctx.fillText(sub, sx, sy + 8);
      }
      ctx.restore();
    });
  }

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    try {
      if (edge) {
        // Défilement par les bords : vitesse en pixels ÉCRAN, divisée par le zoom, pour que la carte
        // file au même rythme apparent qu'on soit dézoomé ou collé au sol.
        cam.x += (edge.x * 900 * dt) / cam.z;
        cam.y += (edge.y * 900 * dt) / cam.z;
        clamp();
      }
      update(dt);
      draw();
    } catch (err) {
      console.error('Scriptoria: erreur de frame (ignorée)', err);
    }
    raf = requestAnimationFrame(frame);
  }

  // ---------- Zone contrôlée ----------
  // On ne prend et on ne dépose une unité à la main que là où le royaume tient vraiment le terrain :
  // au moins 3 de TES bâtiments sur l'île. Ailleurs, on commande à distance (clic droit) — les troupes
  // s'y rendent à pied, elles ne s'y téléportent pas.
  const CONTROL_MIN = 3;
  function controlled(isl: number): boolean {
    if (isl < 0) return false;
    let n = 0;
    for (const e of [...placed, ...decor]) {
      if (!alive(e) || !isBuilding(e) || !isFriendly(e)) continue;
      if (islandAt(...cellAt(e.x, e.y)) === isl && ++n >= CONTROL_MIN) return true;
    }
    return false;
  }
  const islandOf = (e: Ent) => e.home?.isl ?? islandAt(...cellAt(e.x, e.y));
  /** Peut-on saisir cet objet à la main ? Les unités exigent une île tenue ; le décor et les bâtiments non. */
  function canHandle(e: Ent): boolean {
    if (!e.agent || e.maxHp === undefined) return true;
    return controlled(islandOf(e));
  }

  // Curseurs du pack : flèche, main (on peut agir ici), sens interdit (on ne peut pas). Le point
  // chaud est en haut à gauche pour la flèche, au centre du doigt pour la main. `auto` en secours si
  // le navigateur refuse l'image.
  const CUR = {
    arrow: `url(${uiUrl('cursor_01.png')}) 6 4, auto`,
    hand: `url(${uiUrl('cursor_02.png')}) 20 8, pointer`,
    no: `url(${uiUrl('cursor_03.png')}) 24 24, not-allowed`,
    // Épées croisées : une troupe est retenue et le curseur est sur un ennemi — le clic droit attaque.
    sword: `url(${uiUrl('icon_05.png')}) 32 32, crosshair`,
  };

  // ---------- Entrées (souris, tactile, molette) ----------
  const pointers = new Map<number, { x: number; y: number }>();
  // `mode` dit ce que fait le glissement en cours : déplacer la carte, tracer un lasso, ou porter un
  // objet. Avant, tout glissement déplaçait la carte ; le clic gauche sert désormais à sélectionner.
  let drag:
    | {
        ent?: Ent;
        ox: number;
        oy: number;
        sx: number;
        sy: number;
        moved: boolean;
        start: { x: number; y: number };
        gx: number;
        gy: number;
        mode: 'pan' | 'band' | 'ent';
        hit?: boolean; // l'appui a touché un objet : le relâché ne doit PAS tout désélectionner
      }
    | null = null;
  let pinch: { d: number; z: number } | null = null;
  let edge: { x: number; y: number } | null = null; // défilement quand la souris colle à un bord
  // Dernier relâché : sert à reconnaître le double-clic, qui ouvre le lasso.
  let lastUp: { t: number; x: number; y: number } | null = null;

  function localXY(ev: PointerEvent | WheelEvent) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }
  function pick(sx: number, sy: number): Ent | undefined {
    const p = s2w(sx, sy);
    const people = decor.filter(
      (e) =>
        movable(e) &&
        !e.seeded &&
        !e.dead &&
        !(e.agent && e.maxHp !== undefined && !isFriendly(e)) && // pas une unité ennemie (mais arbres/or/moutons OK)
        unlocked.has(islandAt(Math.floor(e.x / TS), Math.floor((e.y - 8) / TS))),
    );
    const sorted = [...placed.filter((e) => !e.dead), ...ruins, ...people].sort((a, b) => b.y - a.y);
    return sorted.find((e) => {
      const b = hitBox(e);
      return p.x >= b.x0 && p.x <= b.x1 && p.y >= b.y0 && p.y <= b.y1;
    });
  }
  function onDown(ev: PointerEvent) {
    canvas.setPointerCapture(ev.pointerId);
    const p = localXY(ev);
    const touch = ev.pointerType !== 'mouse';
    pointers.set(ev.pointerId, p);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z };
      if (drag?.ent) cancelDrag();
      drag = null;
      return;
    }
    // Clic DROIT : ordre de marche vers le point visé, pour la troupe retenue (ou toute l'île).
    if (ev.button === 2) {
      commandTo(p.x, p.y);
      return;
    }
    const startDrag = (mode: 'pan' | 'band' | 'ent', ent?: Ent) => {
      const wg = s2w(p.x, p.y); // point saisi (monde) → on garde l'écart avec l'ancre de l'objet
      drag = {
        ent,
        mode,
        ox: cam.x,
        oy: cam.y,
        sx: p.x,
        sy: p.y,
        moved: false,
        start: ent ? { x: ent.x, y: ent.y } : { x: 0, y: 0 },
        gx: ent ? ent.x - wg.x : 0,
        gy: ent ? ent.y - wg.y : 0,
      };
    };
    // Molette pressée : c'est elle qui déplace la carte maintenant que le clic gauche sélectionne.
    if (ev.button === 1) {
      startDrag('pan');
      return;
    }
    // modes « Déplacer » / « Envoyer les troupes » : un simple toucher agit
    const ent = moveEnt || orderMode ? undefined : pick(p.x, p.y);
    if (moveEnt) ghost = snapGhost(p.x, p.y);

    // DOUBLE-CLIC maintenu = lasso. Réserver le glissement simple au lasso rendait la carte
    // impossible à explorer et les objets impossibles à bouger ; le double-clic lève l'ambiguïté
    // sans voler le geste le plus courant.
    const now = performance.now();
    const dbl = lastUp !== null && now - lastUp.t < 350 && Math.hypot(p.x - lastUp.x, p.y - lastUp.y) < 14;
    if (dbl && !moveEnt && !orderMode) {
      startDrag('band');
      if (drag) drag.hit = true; // un double-clic ne doit rien désélectionner s'il ne traîne pas
      return;
    }

    if (ent) {
      select(ent);
      // Un clic sur un de tes combattants le prend comme troupe d'UN homme : le clic droit suivant
      // n'engage que lui. Sans ça, désigner une unité puis ordonner faisait partir toute l'île.
      if (alive(ent) && ent.agent && isFriendly(ent) && isFighter(ent)) {
        troop = new Set([keyOf(ent)]);
        opts.onTroop?.(1);
      } else clearTroop();
      // Prise en main réservée aux îles tenues : ailleurs on sélectionne, mais on ne porte pas
      // l'unité — on l'envoie au clic droit et elle s'y rend à pied.
      if (canHandle(ent)) {
        ent.moving = false;
        ent.acting = -1;
        startDrag('ent', ent);
        if (drag) drag.hit = true;
        return;
      }
      flashBad = t;
      opts.onNotice?.('Île non tenue : il faut 3 de tes bâtiments pour y porter des soldats. Clic droit pour les y envoyer.');
    }
    // Terrain nu (ou objet qu'on n'a pas le droit de porter) : le glissement explore la carte.
    startDrag('pan');
    if (ent && drag) drag.hit = true; // on a bien cliqué QUELQUE CHOSE : à ne pas désélectionner au relâché
  }
  function select(ent: Ent | null) {
    selected = ent ? keyOf(ent) : null;
    // Les PV partent avec la sélection : c'est ce qui permet au panneau de proposer une réparation.
    opts.onSelect?.(
      selected,
      ent
        ? {
            id: ent.placed ? ent.placed.id : ent.key,
            bought: !!ent.placed,
            hp: ent.hp,
            maxHp: ent.maxHp,
            mine: isFriendly(ent),
            rank: ent.agent && isFighter(ent) ? (ent.rank ?? 1) : undefined,
            xp: ent.xp,
            ruin: ent.ruin?.k, // clé de la ruine : le panneau propose alors de la relever
          }
        : undefined,
    );
  }
  // pose un personnage (ou bâtiment) sur une case ; renvoie false si c'est interdit
  function dropAt(ent: Ent, wx: number, wy: number) {
    if (!checkFit(ent.key, wx, wy, unlocked, getOcc(), keyOf(ent)).ok) {
      flashBad = t;
      return false;
    }
    // On ne dépose une unité que sur une île tenue : sinon on téléporterait une armée en terrain
    // ennemi. Pour y aller, c'est le clic droit — et elles s'y rendent à pied.
    if (ent.agent && ent.maxHp !== undefined && !controlled(islandAt(Math.floor(wx / TS), Math.floor(wy / TS)))) {
      flashBad = t;
      opts.onNotice?.('Île non tenue : il faut 3 de tes bâtiments pour y poser des soldats. Clic droit pour les y envoyer.');
      return false;
    }
    const x = Math.round(wx);
    const y = Math.round(wy);
    const cx = Math.floor(x / TS);
    const cy = Math.floor((y - decorLift(ent.key) - 8) / TS);
    ent.x = x;
    ent.y = y;
    occDirty();
    ent.home = { isl: islandAt(cx, cy), lvl: levelAt(cx, cy) };
    ent.wait = 2;
    ent.moving = false;
    ent.bounceT0 = t;
    const fs = footprint(ent.key)?.w ?? 1;
    const ey = y - decorLift(ent.key) - (fs > 1 ? 16 : 0);
    effects.push({ x, y: ey, t0: t, kind: 'ring', s: fs }, { x, y: ey, t0: t, kind: 'dust', s: fs });
    if (ent.fresh) {
      // Objet posé depuis l'inventaire : on le confirme sur la carte (React l'ajoute à `placed`).
      opts.onPlaceNew?.(ent.freshKey!, ent.key, x, y);
    } else if (ent.placed) {
      ent.placed.x = x;
      ent.placed.y = y;
      ent.placed.id = ent.key; // conserve le style de maison éventuellement choisi à la molette
      ent.orig = { x, y };
      opts.onMove?.(ent.placed.k, x, y);
      opts.onVariant?.(ent.placed.k, ent.key);
    } else {
      // personnage du décor : il vit désormais autour de son nouvel emplacement
      ent.origin = { x, y };
      ent.walks = !!ent.def.run;
      if (ent.id) opts.onDecorMove?.(ent.id, x, y);
    }
    return true;
  }
  function snapGhost(sx: number, sy: number) {
    if (!moveEnt) return null;
    const w = s2w(sx, sy);
    return snapTo(moveEnt.key, w.x, w.y + 10);
  }
  function endMove() {
    moveEnt = null;
    ghost = null;
    opts.onMoveMode?.(false);
  }
  // La troupe SURVIT à un ordre : on enchaîne plusieurs ordres sur la même sélection, comme dans
  // n'importe quel jeu de stratégie. Elle ne se vide qu'au clic sur du terrain nu.
  function clearTroop() {
    band = null;
    if (!troop.size) return;
    troop = new Set();
    opts.onTroop?.(0);
  }
  function endOrder() {
    band = null;
    if (!orderMode) return;
    orderMode = false;
    opts.onOrderMode?.(false);
  }
  // Lasso : retient tous tes combattants dont la silhouette croise le cadre.
  function selectBand(b: { x0: number; y0: number; x1: number; y1: number }) {
    troop = new Set();
    for (const e of [...placed, ...decor]) {
      if (!e.agent || !alive(e) || !isFriendly(e) || !isFighter(e)) continue;
      if (!unlocked.has(e.home?.isl ?? -1)) continue;
      const h = hitBox(e);
      if (h.x1 < b.x0 || h.x0 > b.x1 || h.y1 < b.y0 || h.y0 > b.y1) continue;
      troop.add(keyOf(e));
    }
    opts.onTroop?.(troop.size);
  }
  // Ennemi vivant sous (ou tout près de) le point monde (x, y), même île de préférence.
  // Les BÂTIMENTS ennemis comptent aussi : désigner un château, c'est ordonner le siège. Ils ne sont
  // retenus qu'en plein dessus (pas d'aimant de proximité) — ils sont larges, et on viserait sans
  // arrêt un mur au lieu du soldat qui passe devant.
  function enemyAt(x: number, y: number, isl: number): Ent | null {
    let near: Ent | null = null;
    let nd = TS * 1.4;
    for (const o of [...decor, ...placed]) {
      if (!alive(o) || o.maxHp === undefined || isFriendly(o)) continue;
      if (!o.agent && !isBuilding(o)) continue;
      const b = hitBox(o);
      if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) return o;
      if (o.agent && o.home?.isl === isl) {
        const d = Math.hypot(o.x - x, o.y - y);
        if (d < nd) {
          nd = d;
          near = o;
        }
      }
    }
    return near;
  }
  // Ordre du joueur vers le point désigné. Si une troupe a été retenue au lasso, elle seule marche
  // (et seulement ses membres présents sur l'île visée — personne ne traverse la mer) ; sinon on
  // garde le comportement d'origine : toutes tes unités de combat de l'île y vont.
  // Si le point vise un ennemi, elles le prennent pour cible et le pourchassent.
  function commandTo(sx: number, sy: number) {
    const w = s2w(sx, sy);
    const cx = Math.floor(w.x / TS);
    const cy = Math.floor(w.y / TS);
    const isl = islandAt(cx, cy);
    if (isl < 0 || !unlocked.has(isl)) {
      flashBad = t;
      return;
    }
    const foe = enemyAt(w.x, w.y, isl);
    const dest = foe ? { x: foe.x, y: foe.y } : { x: w.x, y: w.y };

    // Cible sur une AUTRE île : la troupe monte une expédition (côte → mer → débarquement) au lieu
    // de refuser l'ordre. C'est le pendant joueur des invasions que les royaumes rivaux lancent déjà.
    // SEULE la troupe désignée marche — à l'unité près. Le repli « toute l'île part » de la première
    // version envoyait des soldats qu'on n'avait pas choisis ; sans sélection, on ne bouge personne.
    if (!troop.size) {
      flashBad = t;
      opts.onNotice?.('Choisis d’abord tes soldats : clique l’un d’eux, ou encadre-en plusieurs au clic gauche glissé.');
      endOrder();
      return;
    }
    const corps = [...placed, ...decor].filter(
      (e) => alive(e) && e.agent && isFriendly(e) && isFighter(e) && e !== drag?.ent && e !== moveEnt && troop.has(keyOf(e)),
    );
    const abroad = corps.filter((e) => (e.home?.isl ?? -1) !== isl && (e.home?.isl ?? -1) >= 0);
    if (abroad.length && !corps.some((e) => e.home?.isl === isl)) {
      // Un portail de chaque côté ? On passe par là : c'est tout l'intérêt de les avoir bâtis.
      const exit = portalOn(isl, w.x, w.y);
      const exitStep = exit ? portalStep(exit) : null;
      let boarded = 0;
      let warped = 0;
      for (const e of abroad) {
        const entry = exitStep ? portalOn(e.home!.isl, e.x, e.y) : null;
        const entryStep = entry ? portalStep(entry) : null;
        if (entryStep && exitStep) {
          e.warp = { x: exitStep[0] * TS + TS / 2, y: exitStep[1] * TS + TS * 0.75, isl, march: dest };
          e.cross = undefined;
          e.order = { x: entryStep[0] * TS + TS / 2, y: entryStep[1] * TS + TS * 0.75 };
          warped++;
        } else {
          if (!planCrossing(e, isl, dest)) continue;
          boarded++;
        }
        e.orderTarget = undefined;
        dropTask(e);
        e.moving = false;
        e.acting = -1;
        e.wait = 0;
      }
      const n = boarded + warped;
      if (n) {
        effects.push({ x: w.x, y: w.y, t0: t, kind: 'rally' });
        const how = warped ? (boarded ? 'par le portail et à la nage' : 'par le portail') : 'ils gagnent la côte et embarquent';
        opts.onNotice?.(`${n} soldat${n > 1 ? 's' : ''} en route pour « ${WORLD.islands[isl]?.name ?? 'l’île'} » — ${how}.`);
      } else flashBad = t;
      endOrder();
      return;
    }

    // Marche sur place (même île) : là encore, uniquement les soldats retenus.
    let sent = 0;
    for (const e of corps) {
      if (e.home?.isl !== isl) continue;
      e.order = { x: dest.x, y: dest.y };
      e.orderTarget = foe ?? undefined;
      dropTask(e);
      e.moving = false;
      e.acting = -1;
      e.wait = 0;
      sent++;
    }
    if (sent) effects.push({ x: w.x, y: w.y, t0: t, kind: 'rally' });
    else flashBad = t;
    endOrder(); // on quitte le mode bouton, mais la troupe reste retenue pour l'ordre suivant
  }
  function onMove(ev: PointerEvent) {
    const p = localXY(ev);
    if (!pointers.has(ev.pointerId)) {
      // Souris collée à un bord : la carte défile toute seule, comme dans n'importe quel RTS.
      // Bande de 28 px ; la vitesse croît à mesure qu'on s'enfonce dans le bord.
      const M = 28;
      const ex = p.x < M ? (p.x - M) / M : p.x > W - M ? (p.x - (W - M)) / M : 0;
      const ey = p.y < M ? (p.y - M) / M : p.y > H - M ? (p.y - (H - M)) / M : 0;
      const inside = p.x >= 0 && p.y >= 0 && p.x <= W && p.y <= H;
      edge = inside && (ex || ey) ? { x: Math.max(-1, Math.min(1, ex)), y: Math.max(-1, Math.min(1, ey)) } : null;
      if (moveEnt) {
        ghost = snapGhost(p.x, p.y);
        // Pose en cours : main si l'endroit convient, sens interdit sinon — on sait avant de lâcher.
        canvas.style.cursor = ghost && checkFit(moveEnt.key, ghost.x, ghost.y, unlocked, getOcc(), keyOf(moveEnt)).ok ? CUR.hand : CUR.no;
      } else {
        const w = s2w(p.x, p.y);
        const isl = islandAt(Math.floor(w.x / TS), Math.floor(w.y / TS));
        // Une troupe est retenue et on survole un ennemi : épées croisées. Le curseur annonce ce que
        // fera le clic droit — charger CETTE cible — au lieu de laisser deviner.
        if (troop.size && enemyAt(w.x, w.y, isl)) canvas.style.cursor = CUR.sword;
        else if (orderMode) canvas.style.cursor = CUR.hand;
        else {
          const over = pick(p.x, p.y);
          canvas.style.cursor = over ? CUR.hand : isl >= 0 && !unlocked.has(isl) ? CUR.no : CUR.arrow;
        }
      }
      return;
    }
    edge = null; // un bouton est enfoncé : le glissement prime sur le défilement par les bords
    pointers.set(ev.pointerId, p);
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      cam.z = pinch.z * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d);
      clamp();
      return;
    }
    if (!drag) return;
    const dx = p.x - drag.sx;
    const dy = p.y - drag.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    if (moveEnt && !drag.moved) ghost = snapGhost(p.x, p.y);
    if (drag.mode === 'ent' && drag.ent) {
      const w = s2w(p.x, p.y);
      const sn = snapTo(drag.ent.key, w.x + drag.gx, w.y + drag.gy); // conserve le point de saisie
      drag.ent.x = sn.x;
      drag.ent.y = sn.y;
      canvas.style.cursor = CUR.hand;
    } else if (drag.mode === 'band' && drag.moved) {
      const a = s2w(drag.sx, drag.sy);
      const b = s2w(p.x, p.y);
      band = { x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y) };
    } else {
      cam.x = drag.ox - dx / cam.z;
      cam.y = drag.oy - dy / cam.z;
      clamp();
    }
  }
  function cancelDrag() {
    band = null; // un second doigt (pincement) abandonne le lasso en cours
    if (drag?.ent) {
      drag.ent.x = drag.start.x;
      drag.ent.y = drag.start.y;
    }
  }
  function onUp(ev: PointerEvent) {
    pointers.delete(ev.pointerId);
    if (ev.button === 0) {
      const q = localXY(ev);
      lastUp = { t: performance.now(), x: q.x, y: q.y };
    }
    if (pointers.size < 2) pinch = null;
    if (!drag) return;
    const d = drag;
    drag = null;
    if (moveEnt && !d.moved) {
      const w = snapGhost(d.sx, d.sy)!;
      ghost = w;
      if (dropAt(moveEnt, w.x, w.y)) endMove();
    } else if (d.mode === 'band' && d.moved && band) {
      // Lasso relâché : la troupe est retenue et le reste — le clic droit suivant l'envoie.
      selectBand(band);
      if (!troop.size) flashBad = t;
      band = null;
    } else if (orderMode && !d.moved) {
      commandTo(d.sx, d.sy); // bouton « Envoyer les troupes » : conservé pour le tactile
    } else if (d.mode === 'ent' && d.ent) {
      if (d.moved && !dropAt(d.ent, d.ent.x, d.ent.y)) {
        d.ent.x = d.start.x;
        d.ent.y = d.start.y;
      }
    } else if (!d.moved && !moveEnt && !orderMode && !d.hit) {
      // Clic dans le VIDE seulement : on relâche l'objet inspecté et la troupe. Sans le test `hit`,
      // un simple clic sur une unité la sélectionnait à l'appui puis la désélectionnait aussitôt.
      select(null);
      clearTroop();
    }
    canvas.style.cursor = CUR.arrow;
  }
  function onWheel(ev: WheelEvent) {
    ev.preventDefault();
    // En cours de pose d'une maison : la molette fait défiler les styles au lieu de zoomer.
    const placing = moveEnt ?? drag?.ent ?? null;
    if (placing) {
      const vars = houseVariants(placing.key);
      if (vars) {
        const dir = ev.deltaY > 0 ? 1 : -1;
        const nk = vars[(vars.indexOf(placing.key) + dir + vars.length) % vars.length];
        placing.key = nk;
        placing.def = SPRITES[nk];
        if (placing.placed) placing.placed.id = nk;
        return;
      }
    }
    const p = localXY(ev);
    const before = s2w(p.x, p.y);
    cam.z *= Math.exp(-ev.deltaY * 0.0015);
    clamp();
    const after = s2w(p.x, p.y);
    cam.x += before.x - after.x;
    cam.y += before.y - after.y;
    clamp();
  }
  // Le clic droit sert d'ordre de marche : pas de menu contextuel du navigateur par-dessus.
  const onContext = (ev: Event) => ev.preventDefault();
  const onLeave = () => {
    edge = null;
    canvas.style.cursor = CUR.arrow;
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('contextmenu', onContext);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  function focus(i: number, z = 1) {
    const isl = WORLD.islands[i];
    if (!isl) return;
    cam.x = isl.cx;
    cam.y = isl.cy;
    cam.z = z;
    clamp();
  }

  return {
    start(dpr: number, w: number, h: number) {
      this.resize(dpr, w, h);
      const home = WORLD.islands.findIndex((i) => i.unlock === 0);
      focus(home >= 0 ? home : 0, Math.max(0.55, Math.min(0.8, w / 2000)));
      last = performance.now();
      raf = requestAnimationFrame(frame);
      raidAt = t + 60; // premier débarquement après ~1 min
      // Récolte : reversement des ressources au React ~1×/s (borne le nombre de setState/saves).
      flushTimer = window.setInterval(flushPending, 1000);
    },
    stop() {
      cancelAnimationFrame(raf);
      clearInterval(flushTimer);
      flushPending(); // ne jamais perdre le dernier lot récolté en quittant la carte / le site
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('contextmenu', onContext);
      canvas.removeEventListener('wheel', onWheel);
    },
    resize(dpr: number, w: number, h: number) {
      DPR = dpr;
      W = w;
      H = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      clamp();
    },
    zoomBy(f: number) {
      cam.z *= f;
      clamp();
    },
    goHome() {
      const home = WORLD.islands.findIndex((i) => i.unlock === 0);
      focus(home >= 0 ? home : 0, 1);
    },
    overview() {
      cam.x = WORLD_W / 2;
      cam.y = WORLD_H / 2;
      cam.z = 0;
      clamp();
    },
    focusItem(k: string) {
      const e = placed.find((p) => p.placed!.k === k);
      if (!e) return;
      cam.x = e.x;
      cam.y = e.y;
      cam.z = Math.max(cam.z, 1);
      selected = k;
      clamp();
    },
    setPlaced,
    setRuins,
    /** Active le mode « Déplacer » pour l'élément sélectionné. */
    startMove(k: string) {
      const e = findByKey(k);
      if (!e) return false;
      if (!canHandle(e)) {
        flashBad = t;
        opts.onNotice?.('Île non tenue : il faut 3 de tes bâtiments pour y déplacer des soldats à la main.');
        return false;
      }
      endOrder();
      moveEnt = e;
      e.moving = false;
      e.acting = -1;
      ghost = null;
      opts.onMoveMode?.(true);
      return true;
    },
    cancelMove() {
      if (moveEnt) endMove();
    },
    /** Remet un bâtiment à neuf (le paiement en bois est géré côté React). Renvoie le coût facturé. */
    repair(k: string): number {
      const e = findByKey(k);
      if (!e || !alive(e) || !isFriendly(e) || e.maxHp === undefined || e.hp === undefined) return 0;
      const cost = repairCost(e.key, e.hp, e.maxHp);
      if (!cost) return 0;
      e.hp = e.maxHp;
      e.hurtT = undefined;
      noteDamage(e); // remis à neuf : la persistance oublie sa clé au lieu de la garder à valeur pleine
      const fw = footprint(e.key)?.w ?? 1;
      effects.push({ x: e.x, y: e.y - e.def.feet * 0.5, t0: t, kind: 'ring', s: fw }, { x: e.x, y: e.y, t0: t, kind: 'dust', s: fw });
      select(e); // rafraîchit le panneau : le bouton « Réparer » disparaît
      return cost;
    },
    /** Pose un objet de l'inventaire : crée un fantôme déplaçable ; il n'est ajouté à la carte qu'une fois posé. */
    placeNew(k: string, id: string) {
      const def = SPRITES[id];
      if (!def) return false;
      endOrder();
      if (moveEnt) endMove();
      select(null);
      const g = snapTo(id, cam.x, cam.y);
      const rank = rankFor(id);
      moveEnt = {
        key: id,
        def,
        x: g.x,
        y: g.y,
        ph: Math.random() * 10,
        fresh: true,
        freshKey: k,
        acting: -1,
        walks: !!def.run,
        agent: !!(def.run || def.act),
        rank,
        // La recrue arrive déjà entraînée : elle profite des paliers payés au Marché.
        hp: maxHpOf(id, rank),
        maxHp: maxHpOf(id, rank),
      } as Ent;
      ghost = g;
      opts.onMoveMode?.(true);
      return true;
    },
    /** Active le mode « Envoyer les troupes » : le prochain toucher désigne la destination d'attaque. */
    startOrder() {
      endMove();
      select(null);
      orderMode = true;
      opts.onOrderMode?.(true);
    },
    cancelOrder() {
      endOrder();
    },
    /** Retire un personnage du décor de la carte. */
    removeDecor(id: string) {
      const i = decor.findIndex((e) => e.id === id);
      if (i < 0) return;
      const e = decor[i];
      effects.push({ x: e.x, y: e.y, t0: t, kind: 'dust' });
      decor.splice(i, 1);
      occDirty();
      if (moveEnt === e) endMove();
      select(null);
    },
    deselect() {
      select(null);
    },
    setUnlocked(set: Set<number>, done: number) {
      if (set.size !== unlocked.size || [...set].some((id) => !unlocked.has(id))) fogDirty = true;
      unlocked = set;
      missionsDone = done;
    },
    /** Met à jour le miroir des réserves (pour savoir quand le stockage est plein). */
    setStock(s: { gold: number; wood: number; food: number }) {
      stock = { gold: s.gold, wood: s.wood, food: s.food };
    },
    /**
     * Nouvel entraînement acheté au Marché : tous les soldats de ce type montent en grade sur place,
     * les vivants comme ceux à venir — sans recréer la carte.
     */
    setUpgrades(u: Record<string, number>) {
      upgrades = u;
      for (const e of [...placed, ...decor]) if (alive(e) && e.agent) applyRank(e);
    },
    /** Reverse immédiatement les ressources en attente (ex. avant de quitter le site). */
    flush() {
      flushPending();
    },
  };
}
