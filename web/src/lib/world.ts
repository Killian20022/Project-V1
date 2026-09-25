// Moteur de la carte du royaume de « Scriptoria » (canvas 2D, pixel art Tiny Swords).
// - carte générée depuis Tiled (src/data/world.json + public/ts/land-*.png, land.png = vue d’ensemble)
// - écume, arbres, soldats, feux… animés image par image
// - objets achetés au marché : déplaçables à la souris / au doigt, les personnages se promènent
// - îles verrouillées recouvertes de brouillard tant que les quêtes ne sont pas faites
// - tous les personnages (achetés ou du décor) se prennent et se déplacent, jamais dans l'eau
import WORLD_JSON from '../data/world.json';
import { SPRITES, spriteUrl, type SpriteDef } from './sprites';
import { SHOP_MAP, houseVariants, storageCaps } from '../data/shop';

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
  tour: { hp: 500, dmg: 13, range: 5.5, atk: 0.9, ranged: true },
};
const AGGRO_TILES = 7; // distance à laquelle une unité repère un ennemi
// Fraction de l'animation d'attaque (à 10 img/s) au bout de laquelle l'arme « touche » :
// c'est à cet instant précis que les dégâts s'appliquent / que la flèche part.
const IMPACT_FRAC = 0.45;
const combatBase = (key: string): string | null => /^(guerrier|lancier|archer|moine|villageois|tour)/.exec(key)?.[1] ?? null;

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
  or: { resource: 'gold', actIndex: 1, yield: 2, cycles: 3, regrowMs: 30000 },
  'or-petit': { resource: 'gold', actIndex: 1, yield: 1, cycles: 2, regrowMs: 30000 },
  'or-gros': { resource: 'gold', actIndex: 1, yield: 3, cycles: 4, regrowMs: 30000 },
  mouton: { resource: 'food', actIndex: 0, yield: 1, cycles: 2, regrowMs: 25000 },
};

export interface Placed {
  k: string;
  id: string;
  x: number; // position des pieds (px monde)
  y: number;
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

export function unlockedIslands(missionsDone: number): Set<number> {
  return new Set(WORLD.islands.map((isl, i) => (missionsDone >= isl.unlock ? i : -1)).filter((i) => i >= 0));
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
  if (/^(chateau|monastere|guerrier|lancier|archer|moine|villageois)$/.test(key)) return `${key}-${fac}`;
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
  task?: { node: Ent; phase: 'goto' | 'work'; cyclesLeft: number }; // tâche de récolte en cours
  // Combat (Phase 3)
  hp?: number;
  maxHp?: number;
  dead?: boolean;
  target?: Ent; // ennemi visé
  atkCd?: number; // instant (s) de la prochaine attaque possible
  hurtT?: number; // instant du dernier coup reçu (flash / affichage barre)
  raider?: boolean; // ennemi apparu lors d'un raid (nettoyé à sa mort)
  // Ordres du joueur (RTS)
  order?: { x: number; y: number }; // point de marche désigné (attaque-déplacement)
  orderTarget?: Ent; // ennemi précis à pourchasser (au-delà de l'aggro auto)
  recoilT?: number; // instant du dernier recul (knockback visuel)
  recoilX?: number; // direction du recul
  recoilY?: number;
  // Coup programmé : les dégâts (ou la flèche) ne partent qu'au moment où l'arme touche (frame d'impact),
  // pas au début de l'animation d'attaque.
  strike?: { at: number; foe: Ent; dmg: number; ranged: boolean; heal?: boolean; oy: number };
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
    onSelect?: (k: string | null, info?: { id: string; bought: boolean }) => void;
    onMoveMode?: (active: boolean) => void;
    onOrderMode?: (active: boolean) => void; // mode « envoyer les troupes » actif ?
    onPlaceNew?: (k: string, id: string, x: number, y: number) => void; // objet de l'inventaire posé sur la carte
    decorRemoved?: string[]; // personnages du décor supprimés par le joueur
    onDecorRemove?: (id: string) => void;
    decorPos?: Record<string, [number, number]>; // personnages du décor déplacés par le joueur
    onDecorMove?: (id: string, x: number, y: number) => void;
    onHarvest?: (kind: ResKind, amount: number) => void; // ressources récoltées (batché ~1/s)
    stock?: { gold: number; wood: number; food: number }; // réserves actuelles (pour le plafond)
    onUnitLost?: (k: string) => void; // une unité achetée est morte au combat
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

  let unlocked = opts.unlocked;
  let missionsDone = opts.missionsDone;
  const playerFaction = opts.playerFaction ?? 'bleu';
  const homeIsl = WORLD.islands.findIndex((i) => i.unlock === 0);
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
    kind: 'dust' | 'ring' | 'hit' | 'slash' | 'sand' | 'dmg' | 'rally';
    s?: number; // échelle
    vx?: number; // vitesse (particules de sable)
    vy?: number;
    val?: number; // valeur (chiffre de dégâts)
    enemy?: boolean; // cible ennemie (couleur du chiffre)
    ang?: number; // angle (éclair de mêlée)
  }[] = [];
  let orderMode = false; // mode « envoyer les troupes » : un toucher désigne la destination
  const projectiles: { x: number; y: number; target: Ent; dmg: number; from: 'player' | 'enemy' }[] = [];
  let raidAt = 999; // instant du prochain raid (fixé au démarrage)
  let produceAt = 10; // instant de la prochaine production des royaumes rivaux
  let dispatchAt = 20; // instant du prochain envoi d'escadrons IA (anti-surpopulation)
  const dust = img('sprites/dust.png');
  const keyOf = (e: Ent) => (e.placed ? e.placed.k : `decor:${e.id}`);
  let occCache: Occupancy | null = null;
  const getOcc = () =>
    (occCache ??= buildOcc(
      [...placed, ...decor].map((e) => ({ id: keyOf(e), key: e.key, x: e.x, y: e.y })),
    ));
  const occDirty = () => {
    occCache = null;
  };
  const movable = (e: Ent) => !!footprint(e.key);
  const findByKey = (k: string) => [...placed, ...decor].find((e) => (e.placed || e.id) && keyOf(e) === k);

  const walkableCell = (cx: number, cy: number) => islandAt(cx, cy) >= 0 && levelAt(cx, cy) > 0 && !blockedAt(cx, cy);

  // Décor fixe (généré depuis Tiled)
  const decor: Ent[] = [];
  const nodes: Ent[] = []; // nœuds récoltables (arbres, or, moutons)
  const clouds: { key: string; def: SpriteDef; x: number; y: number; speed: number }[] = [];
  // La carte de base ne doit garder que très peu de personnages par île : le joueur
  // peuplera son royaume en achetant au marché. On plafonne les PNJ humains à l'init.
  const HUMAN_RE = /^(villageois|guerrier|lancier|archer|moine)/;
  const DECOR_UNIT_CAP = 2;
  const humanPerIsl = new Map<number, number>();
  WORLD.decor.forEach(([key0, x0, y0, cloud], index) => {
    // Le royaume de départ prend la couleur choisie par le joueur.
    const key = !cloud && islandAt(Math.floor(x0 / TS), Math.floor(y0 / TS)) === homeIsl ? recolorKey(key0, playerFaction) : key0;
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
        const cx = Math.floor(x / TS);
        const cy = Math.floor((y - def.feet) / TS);
        e.agent = true;
        e.walks = !!def.run && walkableCell(cx, cy);
        e.home = { isl: islandAt(cx, cy), lvl: levelAt(cx, cy) };
        e.origin = { x: e.x, y: e.y };
        e.radius = 2;
        e.wait = Math.random() * 4;
        e.acting = -1;
        // l'armée noire (à l'est) regarde vers l'ouest, les autres au hasard
        e.face = x > 44 * TS ? -1 : Math.random() < 0.5 ? -1 : 1;
        const cst = COMBAT[combatBase(key) ?? ''];
        if (cst) {
          e.hp = cst.hp;
          e.maxHp = cst.hp;
        }
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
  const FOG_PAD = 2;
  const FOG_SCALE = 8;
  const fogCanvas = document.createElement('canvas');
  fogCanvas.width = ((WORLD.w + 2 * FOG_PAD) * TS) / FOG_SCALE;
  fogCanvas.height = ((WORLD.h + 2 * FOG_PAD) * TS) / FOG_SCALE;
  let fogDirty = true;
  function buildFog() {
    fogDirty = false;
    const g = fogCanvas.getContext('2d')!;
    g.clearRect(0, 0, fogCanvas.width, fogCanvas.height);
    const cell = TS / FOG_SCALE;
    const shape = document.createElement('canvas');
    shape.width = fogCanvas.width;
    shape.height = fogCanvas.height;
    const sg = shape.getContext('2d')!;
    sg.fillStyle = '#e9eef2';
    for (let cy = 0; cy < WORLD.h; cy++)
      for (let cx = 0; cx < WORLD.w; cx++) {
        const isl = islandAt(cx, cy);
        if (isl >= 0 && !unlocked.has(isl)) {
          // on déborde vers le haut pour cacher aussi les arbres et les tours
          for (const oy of [0.5, -1.3]) {
            sg.beginPath();
            sg.arc((cx + FOG_PAD + 0.5) * cell, (cy + FOG_PAD + oy) * cell, cell * 1.5, 0, Math.PI * 2);
            sg.fill();
          }
        }
      }
    g.filter = `blur(${cell * 0.9}px)`;
    g.drawImage(shape, 0, 0);
    g.drawImage(shape, 0, 0); // deux passes : brouillard bien opaque au centre
    g.filter = 'none';
  }
  // Gros nuages posés sur chaque île verrouillée (ils ondulent doucement)
  const fogClouds: { isl: number; def: SpriteDef; x: number; y: number; ph: number; sp: number }[] = [];
  WORLD.islands.forEach((isl, i) => {
    if (isl.unlock === 0) return;
    const n = isl.size > 150 ? 4 : isl.size > 60 ? 3 : isl.size > 12 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const def = SPRITES[`nuage-${1 + ((i * 3 + k) % 8)}`];
      if (!def) continue;
      const spread = Math.sqrt(isl.size) * TS * 0.35;
      fogClouds.push({
        isl: i,
        def,
        x: isl.cx + (k - (n - 1) / 2) * spread * 0.9,
        y: isl.cy + ((k % 2) - 0.5) * spread * 0.6,
        ph: Math.random() * 6,
        sp: 0.25 + Math.random() * 0.2,
      });
    }
  });

  // Objets achetés
  let placed: Ent[] = [];
  function setPlaced(list: Placed[]) {
    occCache = null;
    const prev = new Map(placed.map((e) => [e.placed!.k, e]));
    placed = list
      .filter((p) => SPRITES[p.id])
      .map((p) => {
        const old = prev.get(p.k);
        const def = SPRITES[p.id];
        const walks = !!SHOP_MAP[p.id]?.walks;
        if (old && old.orig!.x === p.x && old.orig!.y === p.y) return old;
        const cx = Math.floor(p.x / TS);
        const cy = Math.floor(p.y / TS);
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
          hp: COMBAT[combatBase(p.id) ?? '']?.hp,
          maxHp: COMBAT[combatBase(p.id) ?? '']?.hp,
        } as Ent;
      });
  }
  setPlaced(opts.placed);

  // ---------- Récolte : accumulateur batché + plafond de stockage ----------
  const pending: Record<ResKind, number> = { wood: 0, gold: 0, food: 0 };
  // Réserves actuelles (miroir du state React) : servent à savoir quand le stockage est plein.
  let stock = { gold: opts.stock?.gold ?? 0, wood: opts.stock?.wood ?? 0, food: opts.stock?.food ?? 0 };
  const capNow = () => storageCaps(placed.map((e) => ({ id: e.key })));
  // Place restante pour une ressource (réserve + en attente vs plafond des bâtiments).
  const roomFor = (k: ResKind) => Math.max(0, capNow()[k] - (stock[k] + pending[k]));
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
  }
  const isWorker = (e: Ent) => /^villageois/.test(e.key);
  const isSoldier = (e: Ent) => /^(guerrier|lancier|archer|moine)/.test(e.key);
  const isMelee = (e: Ent) => /^(guerrier|lancier)/.test(e.key);
  const factionOf = (key: string) => {
    const m = /-(rouge|jaune|violette?|noire?)$/.exec(key); // gère aussi les suffixes féminins des bâtiments
    if (!m) return 'bleu';
    return m[1].startsWith('viol') ? 'violet' : m[1].startsWith('noir') ? 'noir' : m[1];
  };
  const unitKey = (base: string, fac: string) => base + (fac === 'bleu' ? '' : `-${fac}`);
  // Allégeance par couleur : même couleur = alliés, couleurs différentes = ennemis.
  // Le joueur dirige le royaume de sa couleur (playerFaction) ; les autres couleurs sont des rivaux.
  const isFriendly = (e: Ent) => factionOf(e.key) === playerFaction;
  const hostile = (a: Ent, b: Ent) => factionOf(a.key) !== factionOf(b.key);
  const statsFor = (e: Ent): CombatDef | null => COMBAT[combatBase(e.key) ?? ''] ?? null;
  const isFighter = (e: Ent) => {
    const s = statsFor(e);
    return !!s && (s.dmg > 0 || s.heal === true);
  };
  const alive = (e?: Ent | null): e is Ent => !!e && !e.dead && (e.hp ?? 1) > 0;
  // Tous les villageois récoltent (vie du monde) ; seul le bleu du joueur, sur île débloquée, crédite tes réserves.
  const canHarvest = (e: Ent) => /^villageois/.test(e.key);
  const harvestCredits = (e: Ent) => isFriendly(e) && unlocked.has(e.home?.isl ?? -1);
  const nodeCell = (n: Ent) => [Math.floor(n.x / TS), Math.floor((n.y - n.def.feet) / TS)] as const;
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

  // ---------- Soldats : entraînement à deux (au lieu de frapper dans le vide) ----------
  function nearestSoldier(e: Ent, maxDist: number, needIdle: boolean, meleeOnly: boolean): Ent | null {
    const fac = factionOf(e.key);
    let best: Ent | null = null;
    let bd = maxDist;
    for (const o of [...placed, ...decor]) {
      if (o === e || !o.agent || !isSoldier(o)) continue;
      if (meleeOnly && !isMelee(o)) continue;
      if (o.home?.isl !== e.home?.isl || factionOf(o.key) !== fac) continue;
      if (needIdle && (o.acting! >= 0 || o.moving)) continue;
      const d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d < bd) {
        bd = d;
        best = o;
      }
    }
    return best;
  }
  function swingAt(u: Ent, other: Ent) {
    const n = u.def.act?.[0]?.n ?? 6;
    u.face = other.x < u.x ? -1 : 1;
    u.acting = 0;
    u.actT0 = t;
    u.actEnd = t + (3 * n) / 10;
    u.moving = false;
  }
  // Deux soldats de mêlée côte à côte s'entraînent : ils se font face et échangent des coups.
  function trySpar(e: Ent): boolean {
    if (!isMelee(e)) return false;
    const p = nearestSoldier(e, TS * 1.7, true, true);
    if (!p) return false;
    swingAt(e, p);
    if (p.acting! < 0 && !p.moving && !p.task) swingAt(p, e); // le partenaire réplique s'il est libre
    return true;
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
  function nearestFoe(e: Ent, maxTiles: number, wantAlly: boolean): Ent | null {
    let best: Ent | null = null;
    let bd = maxTiles * TS;
    for (const o of [...placed, ...decor]) {
      if (o === e || !o.agent || !alive(o) || o.maxHp === undefined) continue;
      if (o.home?.isl !== e.home?.isl) continue;
      if (wantAlly ? hostile(e, o) || (o.hp ?? 0) >= (o.maxHp ?? 1) : !hostile(e, o)) continue;
      const d = Math.hypot(o.x - e.x, o.y - e.y);
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
  function hurt(u: Ent, dmg: number, from?: { x: number; y: number }, melee = false) {
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
    if (u.hp <= 0) {
      u.dead = true;
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
  function combatMove(e: Ent, tx: number, ty: number, dt: number) {
    if (!e.home) return; // sécurité : pas de déplacement sans île d'attache (évite un crash)
    const dx = tx - e.x;
    const dy = ty - e.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) return;
    const step = Math.min(d, 48 * dt);
    const nx = e.x + (dx / d) * step;
    const ny = e.y + (dy / d) * step;
    if (walkable(Math.floor(nx / TS), Math.floor(ny / TS), e.home!)) {
      e.x = nx;
      e.y = ny;
      e.moving = true;
      e.acting = -1;
      if (Math.abs(dx) > 1) e.face = dx < 0 ? -1 : 1;
    }
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
      const ally = alive(e.target) && (e.target!.hp ?? 0) < (e.target!.maxHp ?? 1) ? e.target! : nearestFoe(e, AGGRO_TILES, true);
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
      } else combatMove(e, ally.x, ally.y, dt);
      return true;
    }
    const foe = alive(e.target) && e.target!.home?.isl === e.home?.isl ? e.target! : nearestFoe(e, AGGRO_TILES, false);
    if (!foe) {
      e.target = undefined;
      return false;
    }
    e.target = foe;
    const d = Math.hypot(foe.x - e.x, foe.y - e.y);
    if (d <= st.range * TS) swing(e, foe, st);
    else combatMove(e, foe.x, foe.y, dt);
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
    // Soldats : s'entraîner à deux, sinon se regrouper vers un allié, sinon patrouiller.
    if (isSoldier(e)) {
      if (trySpar(e)) return;
      if (isMelee(e)) {
        const ally = nearestSoldier(e, 12 * TS, false, true);
        if (ally && e.walks && Math.random() < 0.75) {
          walkToward(e, ally);
          return;
        }
      } else if (e.def.act?.length && Math.random() < 0.5) {
        // Archers (tir) & moines (soin) : ils s'exercent → leurs belles animations sont visibles hors combat.
        const n = e.def.act[0].n;
        e.acting = 0;
        e.actT0 = t;
        e.actEnd = t + (2 * n) / 10;
        return;
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
      e.order = undefined; // arrivé : l'unité tient la position
      e.wait = 0.3;
      return;
    }
    e.tx = e.order.x;
    e.ty = e.order.y;
    e.moving = true;
  }
  function stepAgent(e: Ent, dt: number) {
    if (e.dead) return;
    if (e.reservedBy) return; // nœud-agent (mouton) figé pendant qu'un villageois le récolte
    // Ordre d'attaque sur une cible précise : on force le combat à la pourchasser (au-delà de l'aggro).
    if (e.orderTarget) {
      if (!alive(e.orderTarget) || e.orderTarget.home?.isl !== e.home?.isl) e.orderTarget = undefined;
      else e.target = e.orderTarget;
    }
    if (isFighter(e) && combatStep(e, dt)) return; // le combat prime sur tout le reste
    if (e.acting! >= 0) {
      if (t >= e.actEnd!) {
        e.acting = -1;
        if (e.task && e.task.phase === 'work') {
          const node = e.task.node;
          const cfg = HARVEST[node.origKey!];
          if (harvestCredits(e)) credit(cfg.resource, cfg.yield);
          node.nodeStock = (node.nodeStock ?? 0) - 1;
          e.task.cyclesLeft--;
          if ((node.nodeStock ?? 0) > 0) {
            startCycle(e); // encore un coup sur le même nœud
          } else {
            depleteNode(node);
            node.reservedBy = undefined;
            e.task = undefined;
            e.wait = 0.4 + Math.random();
          }
        } else {
          e.wait = 1 + Math.random() * 3;
        }
      }
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
        } else if (e.order) {
          e.order = undefined; // arrivé au point d'ordre
          e.wait = 0.3;
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
        const ncx = Math.floor(nx / TS);
        const ncy = Math.floor(ny / TS);
        const occ = getOcc();
        const inside = occ.has(`${Math.floor(e.x / TS)},${Math.floor(e.y / TS)}`);
        if (!walkable(ncx, ncy, e.home!) || (!inside && occ.has(`${ncx},${ncy}`))) {
          e.moving = false;
          e.wait = 0.5;
        } else {
          e.x = nx;
          e.y = ny;
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
      if (s.heal) {
        s.foe.hp = Math.min(s.foe.maxHp ?? 1, (s.foe.hp ?? 0) + s.dmg);
      } else if (s.ranged) {
        projectiles.push({ x: e.x, y: e.y - s.oy, target: s.foe, dmg: s.dmg, from: isFriendly(e) ? 'player' : 'enemy' });
      } else {
        // Mêlée : le coup ne porte que si l'ennemi est encore à portée (sinon il a esquivé pendant le geste).
        const stx = statsFor(e);
        const d = Math.hypot(s.foe.x - e.x, s.foe.y - e.y);
        if (!stx || d <= (stx.range + 0.7) * TS) hurt(s.foe, s.dmg, { x: e.x, y: e.y }, true);
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
        hurt(p.target, p.dmg, { x: p.x, y: p.y }, false);
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
      try { spawnRaid(); } catch (err) { console.error('Scriptoria: raid', err); }
    }
    if (t >= produceAt) {
      produceAt = t + 9;
      try { aiProduce(); } catch (err) { console.error('Scriptoria: production IA', err); }
    }
    if (t >= dispatchAt) {
      dispatchAt = t + 12;
      try { aiDispatch(); } catch (err) { console.error('Scriptoria: escadrons IA', err); }
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
          hp: cst.hp,
          maxHp: cst.hp,
          id: `ai:${Math.random().toString(36).slice(2, 7)}`,
        } as Ent);
        return true;
      }
    return false;
  }
  // Production des royaumes rivaux : chaque bâtiment ennemi forme lentement des unités (garnison plafonnée).
  function aiProduce() {
    for (const b of [...decor]) {
      const base = /(caserne|archerie|monastere|chateau)/.exec(b.key)?.[1];
      if (!base) continue;
      const fac = factionOf(b.key);
      if (fac === playerFaction) continue; // le joueur recrute lui-même au marché
      const isl = islandAt(Math.floor(b.x / TS), Math.floor((b.y - b.def.feet) / TS));
      if (isl < 0) continue;
      const cnt = [...decor, ...placed].filter(
        (e) => e.agent && alive(e) && e.maxHp !== undefined && factionOf(e.key) === fac && e.home?.isl === isl,
      ).length;
      if (cnt >= 6) continue; // garnison pleine sur cette île (plafond réduit pour désencombrer la carte)
      if (Math.random() > 0.5) continue; // production lente
      const ut =
        base === 'caserne' ? (Math.random() < 0.5 ? 'guerrier' : 'lancier') : base === 'archerie' ? 'archer' : base === 'monastere' ? 'moine' : 'villageois';
      spawnUnitNear(unitKey(ut, fac), b, isl);
    }
  }

  // Anti-surpopulation : quand une île IA accumule trop de troupes, elle envoie un escadron à l'assaut
  // de l'ennemi le plus proche (ce qui déclenche le combat et désencombre) ; sans cible, on retire le surplus.
  const SQUAD_THRESHOLD = 5;
  const AI_HARD_CAP = 8;
  function aiDispatch() {
    const groups = new Map<string, Ent[]>();
    for (const e of [...decor, ...placed]) {
      if (!e.agent || !alive(e) || e.maxHp === undefined || !isFighter(e)) continue;
      const fac = factionOf(e.key);
      if (fac === playerFaction) continue; // on ne bouscule que les royaumes IA
      const isl = e.home?.isl ?? -1;
      if (isl < 0 || !unlocked.has(isl)) continue;
      const k = `${fac}@${isl}`;
      let arr = groups.get(k);
      if (!arr) groups.set(k, (arr = []));
      arr.push(e);
    }
    for (const [k, units] of groups) {
      if (units.length < SQUAD_THRESHOLD) continue;
      const isl = +k.split('@')[1];
      const cx = units.reduce((s, u) => s + u.x, 0) / units.length;
      const cy = units.reduce((s, u) => s + u.y, 0) / units.length;
      // Ennemi (autre couleur) vivant le plus proche du centre du groupe, sur la même île.
      let target: Ent | null = null;
      let bd = Infinity;
      for (const o of [...decor, ...placed]) {
        if (!o.agent || !alive(o) || o.maxHp === undefined || o.home?.isl !== isl || !hostile(units[0], o)) continue;
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

  // Fait apparaître un petit groupe de raiders au bord de l'île de départ.
  function spawnRaid() {
    const home = WORLD.islands.findIndex((i) => i.unlock === 0);
    if (home < 0 || !unlocked.has(home)) return;
    // Ne raid que si le joueur a une force armée sur l'île (sinon les villageois se feraient massacrer).
    const armed = [...placed, ...decor].some(
      (e) => alive(e) && isFriendly(e) && e.home?.isl === home && (isFighter(e) || combatBase(e.key) === 'tour'),
    );
    if (!armed) return;
    const isl = WORLD.islands[home];
    const ccx = Math.floor(isl.cx / TS);
    const ccy = Math.floor(isl.cy / TS);
    // Cherche des cases de bord (marchables mais entourées d'eau/verrou) loin du centre.
    const spots: [number, number][] = [];
    for (let ring = 10; ring >= 5 && spots.length < 6; ring--)
      for (let a = 0; a < 12; a++) {
        const cx = ccx + Math.round(Math.cos((a / 12) * 2 * Math.PI) * ring);
        const cy = ccy + Math.round(Math.sin((a / 12) * 2 * Math.PI) * ring);
        if (islandAt(cx, cy) === home && walkableCell(cx, cy) && !getOcc().has(`${cx},${cy}`)) spots.push([cx, cy]);
      }
    if (!spots.length) return;
    // Un royaume rival au hasard mène le raid (une seule couleur par assaut).
    const rivals = ['bleu', 'rouge', 'jaune', 'violet', 'noir'].filter((f) => f !== playerFaction);
    const fac = rivals[Math.floor(Math.random() * rivals.length)];
    const suf = fac === 'bleu' ? '' : `-${fac}`;
    const kinds = [`guerrier${suf}`, `guerrier${suf}`, `archer${suf}`, `lancier${suf}`];
    // Taille du raid : croît avec ton armée présente sur l'île (assauts plus rudes quand tu montes).
    const army = [...placed, ...decor].filter((e) => alive(e) && isFriendly(e) && isFighter(e) && e.home?.isl === home).length;
    const n = Math.min(6, 2 + Math.floor(army / 3));
    for (let k = 0; k < n; k++) {
      const [cx, cy] = spots[Math.floor(Math.random() * spots.length)];
      const key = kinds[Math.floor(Math.random() * kinds.length)];
      const def = SPRITES[key];
      if (!def) continue;
      const cst = COMBAT[combatBase(key) ?? '']!;
      decor.push({
        key,
        def,
        x: cx * TS + TS / 2,
        y: cy * TS + TS * 0.75,
        ph: Math.random() * 10,
        agent: true,
        walks: true,
        acting: -1,
        radius: 3,
        wait: Math.random(),
        face: -1,
        home: { isl: home, lvl: levelAt(cx, cy) },
        origin: { x: cx * TS + TS / 2, y: cy * TS + TS * 0.75 },
        hp: cst.hp,
        maxHp: cst.hp,
        raider: true,
        id: `raider:${Math.random().toString(36).slice(2, 7)}`,
      } as Ent);
    }
  }

  // ---------- Dessin ----------
  function roundRect(x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
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
    const sheet = run ? def.run! : act ?? { src: def.src, n: def.n };
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


  function drawHealth(e: Ent) {
    const w = combatBase(e.key) === 'tour' ? 52 : 40;
    const h = 5;
    const frac = Math.max(0, Math.min(1, (e.hp ?? 0) / (e.maxHp ?? 1)));
    const cx = e.x;
    const top = e.y - (e.def.fh - e.def.feet) * 0.5 - 12;
    const enemy = !isFriendly(e);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(cx - w / 2 - 1, top - 1, w + 2, h + 2);
    ctx.fillStyle = 'rgba(60,20,20,0.9)';
    ctx.fillRect(cx - w / 2, top, w, h);
    ctx.fillStyle = enemy ? 'rgba(225,70,70,0.95)' : 'rgba(95,210,95,0.95)';
    ctx.fillRect(cx - w / 2, top, w * frac, h);
    ctx.restore();
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
    if (sel && !drag?.ent && !moveEnt) {
      const pulse = (Math.sin(t * 5) + 1) / 2;
      ctx.save();
      ctx.shadowColor = 'rgba(255, 220, 110, 0.9)';
      ctx.shadowBlur = 12 + 10 * pulse;
      ctx.strokeStyle = `rgba(255, 226, 120, ${0.65 + 0.35 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const fw = footprint(sel.key)?.w ?? 1;
      const ringY = sel.y - decorLift(sel.key) - (fw > 1 ? 16 : 0); // recale le rond sous l'objet centré
      ctx.ellipse(sel.x, ringY, 30 * fw + 3 * pulse, 11 * Math.max(1, fw * 0.7) + pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // zone de pose : grille lumineuse façon jeu de stratégie
    const placing = drag?.ent && drag.moved ? drag.ent : moveEnt && ghost ? moveEnt : null;
    if (placing) {
      const px = placing === moveEnt ? ghost!.x : placing.x;
      const py = placing === moveEnt ? ghost!.y : placing.y;
      drawPlacement(placing, px, py);
    }
    // sprites triés par profondeur
    const all = [...decor, ...placed].filter((e) => {
      if (e.dead) return false;
      const b = e.y + e.def.feet;
      return e.x + e.def.fw / 2 > vx0 && e.x - e.def.fw / 2 < vx1 && b > vy0 && b - e.def.fh < vy1;
    });
    all.sort((a, b) => a.y - b.y);
    const lifted = drag?.ent && drag.moved ? drag.ent : null;
    for (const e of all) {
      if (e === moveEnt) drawSprite(e, 0.35);
      else if (e !== lifted) drawSprite(e);
    }
    // barres de vie : au-dessus des unités blessées ou sélectionnées
    for (const e of all) {
      if (e.maxHp === undefined || e.hp === undefined) continue;
      const wounded = e.hp < e.maxHp;
      if (!wounded && keyOf(e) !== selected) continue;
      drawHealth(e);
    }
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

    // brouillard sur les îles verrouillées
    if (fogDirty) buildFog();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 0.97;
    ctx.drawImage(fogCanvas, 0, 0, fogCanvas.width, fogCanvas.height, -FOG_PAD * TS, -FOG_PAD * TS, WORLD_W + 2 * FOG_PAD * TS, WORLD_H + 2 * FOG_PAD * TS);
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = false;
    for (const c of fogClouds) {
      if (unlocked.has(c.isl)) continue;
      const im = img(c.def.src);
      if (!im.complete || !im.naturalWidth) continue;
      const x = c.x + Math.sin(t * c.sp + c.ph) * 40;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(im, x - c.def.fw * 0.75, c.y - c.def.fh * 0.75, c.def.fw * 1.5, c.def.fh * 1.5);
      ctx.globalAlpha = 1;
    }
    // nuages
    for (const c of clouds) {
      const im = img(c.def.src);
      if (!im.complete || !im.naturalWidth) continue;
      ctx.globalAlpha = 0.85;
      ctx.drawImage(im, c.x - c.def.fw / 2, c.y - c.def.fh);
      ctx.globalAlpha = 1;
    }

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
      const label = locked
        ? `🔒 ${isl.name} · ${isl.unlock - missionsDone} quête${isl.unlock - missionsDone > 1 ? 's' : ''}`
        : isl.name;
      ctx.font = `700 ${locked ? 13 : 14}px "MedievalSharp", Georgia, serif`;
      const tw = ctx.measureText(label).width + 22;
      ctx.fillStyle = locked ? 'rgba(20, 26, 34, 0.86)' : 'rgba(60, 38, 20, 0.86)';
      ctx.strokeStyle = locked ? 'rgba(200, 200, 210, 0.35)' : 'rgba(240, 200, 110, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(sx - tw / 2, sy - 14, tw, 28, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = locked ? '#dfe3ea' : '#ffe7a6';
      ctx.fillText(label, sx, sy + 1);
    });
  }

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    try {
      update(dt);
      draw();
    } catch (err) {
      console.error('Scriptoria: erreur de frame (ignorée)', err);
    }
    raf = requestAnimationFrame(frame);
  }

  // ---------- Entrées (souris, tactile, molette) ----------
  const pointers = new Map<number, { x: number; y: number }>();
  let drag: { ent?: Ent; ox: number; oy: number; sx: number; sy: number; moved: boolean; start: { x: number; y: number }; gx: number; gy: number } | null = null;
  let pinch: { d: number; z: number } | null = null;

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
    const sorted = [...placed.filter((e) => !e.dead), ...people].sort((a, b) => b.y - a.y);
    return sorted.find((e) => {
      const b = hitBox(e);
      return p.x >= b.x0 && p.x <= b.x1 && p.y >= b.y0 && p.y <= b.y1;
    });
  }
  function onDown(ev: PointerEvent) {
    canvas.setPointerCapture(ev.pointerId);
    const p = localXY(ev);
    pointers.set(ev.pointerId, p);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z };
      if (drag?.ent) cancelDrag();
      drag = null;
      return;
    }
    // modes « Déplacer » / « Envoyer les troupes » : le glisser déplace la carte, un simple toucher agit
    const ent = moveEnt || orderMode ? undefined : pick(p.x, p.y);
    if (moveEnt) ghost = snapGhost(p.x, p.y);
    const wg = s2w(p.x, p.y); // point saisi (monde) → on garde l'écart avec l'ancre de l'objet
    drag = { ent, ox: cam.x, oy: cam.y, sx: p.x, sy: p.y, moved: false, start: ent ? { x: ent.x, y: ent.y } : { x: 0, y: 0 }, gx: ent ? ent.x - wg.x : 0, gy: ent ? ent.y - wg.y : 0 };
    if (ent) {
      ent.moving = false;
      ent.acting = -1;
      select(ent);
    }
  }
  function select(ent: Ent | null) {
    selected = ent ? keyOf(ent) : null;
    opts.onSelect?.(selected, ent ? { id: ent.placed ? ent.placed.id : ent.key, bought: !!ent.placed } : undefined);
  }
  // pose un personnage (ou bâtiment) sur une case ; renvoie false si c'est interdit
  function dropAt(ent: Ent, wx: number, wy: number) {
    if (!checkFit(ent.key, wx, wy, unlocked, getOcc(), keyOf(ent)).ok) {
      flashBad = t;
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
  function endOrder() {
    if (!orderMode) return;
    orderMode = false;
    opts.onOrderMode?.(false);
  }
  // Ennemi vivant sous (ou tout près de) le point monde (x, y), même île de préférence.
  function enemyAt(x: number, y: number, isl: number): Ent | null {
    let near: Ent | null = null;
    let nd = TS * 1.4;
    for (const o of [...decor, ...placed]) {
      if (!o.agent || !alive(o) || o.maxHp === undefined || isFriendly(o)) continue;
      const b = hitBox(o);
      if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) return o;
      if (o.home?.isl === isl) {
        const d = Math.hypot(o.x - x, o.y - y);
        if (d < nd) {
          nd = d;
          near = o;
        }
      }
    }
    return near;
  }
  // Ordre du joueur : envoie toutes tes unités de combat de l'île vers le point désigné.
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
    let sent = 0;
    for (const e of [...placed, ...decor]) {
      if (!e.agent || e.dead || !isFriendly(e) || !isFighter(e)) continue;
      if (e.home?.isl !== isl) continue;
      if (e === drag?.ent || e === moveEnt) continue;
      e.order = { x: dest.x, y: dest.y };
      e.orderTarget = foe ?? undefined;
      e.task = undefined;
      e.moving = false;
      e.acting = -1;
      e.wait = 0;
      sent++;
    }
    if (sent) effects.push({ x: w.x, y: w.y, t0: t, kind: 'rally' });
    else flashBad = t;
    endOrder();
  }
  function onMove(ev: PointerEvent) {
    const p = localXY(ev);
    if (!pointers.has(ev.pointerId)) {
      if (moveEnt) {
        ghost = snapGhost(p.x, p.y);
        canvas.style.cursor = 'crosshair';
      } else if (orderMode) {
        canvas.style.cursor = 'crosshair';
      } else canvas.style.cursor = pick(p.x, p.y) ? 'grab' : 'default';
      return;
    }
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
    if (drag.ent) {
      const w = s2w(p.x, p.y);
      const sn = snapTo(drag.ent.key, w.x + drag.gx, w.y + drag.gy); // conserve le point de saisie
      drag.ent.x = sn.x;
      drag.ent.y = sn.y;
      canvas.style.cursor = 'grabbing';
    } else {
      cam.x = drag.ox - dx / cam.z;
      cam.y = drag.oy - dy / cam.z;
      clamp();
    }
  }
  function cancelDrag() {
    if (drag?.ent) {
      drag.ent.x = drag.start.x;
      drag.ent.y = drag.start.y;
    }
  }
  function onUp(ev: PointerEvent) {
    pointers.delete(ev.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!drag) return;
    const d = drag;
    drag = null;
    if (moveEnt && !d.moved) {
      const w = snapGhost(d.sx, d.sy)!;
      ghost = w;
      if (dropAt(moveEnt, w.x, w.y)) endMove();
    } else if (orderMode && !d.moved) {
      commandTo(d.sx, d.sy);
    } else if (d.ent) {
      if (d.moved && !dropAt(d.ent, d.ent.x, d.ent.y)) {
        d.ent.x = d.start.x;
        d.ent.y = d.start.y;
      }
    } else if (!d.moved && !moveEnt && !orderMode) {
      select(null);
    }
    canvas.style.cursor = 'default';
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
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
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
      raidAt = t + 60; // premier raid après ~1 min
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
    /** Active le mode « Déplacer » pour l'élément sélectionné. */
    startMove(k: string) {
      const e = findByKey(k);
      if (!e) return false;
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
    /** Pose un objet de l'inventaire : crée un fantôme déplaçable ; il n'est ajouté à la carte qu'une fois posé. */
    placeNew(k: string, id: string) {
      const def = SPRITES[id];
      if (!def) return false;
      endOrder();
      if (moveEnt) endMove();
      select(null);
      const g = snapTo(id, cam.x, cam.y);
      const cst = COMBAT[combatBase(id) ?? ''];
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
        hp: cst?.hp,
        maxHp: cst?.hp,
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
      if (set.size !== unlocked.size) fogDirty = true;
      unlocked = set;
      missionsDone = done;
    },
    /** Met à jour le miroir des réserves (pour savoir quand le stockage est plein). */
    setStock(s: { gold: number; wood: number; food: number }) {
      stock = { gold: s.gold, wood: s.wood, food: s.food };
    },
    /** Reverse immédiatement les ressources en attente (ex. avant de quitter le site). */
    flush() {
      flushPending();
    },
  };
}
