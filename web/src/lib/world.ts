// Moteur de la carte du royaume « English Sword » (canvas 2D, pixel art Tiny Swords).
// - carte générée depuis Tiled (src/data/world.json + public/ts/land-*.png, land.png = vue d’ensemble)
// - écume, arbres, soldats, feux… animés image par image
// - objets achetés au marché : déplaçables à la souris / au doigt, les personnages se promènent
// - îles verrouillées recouvertes de brouillard tant que les quêtes ne sont pas faites
// - tous les personnages (achetés ou du décor) se prennent et se déplacent, jamais dans l'eau
import WORLD_JSON from '../data/world.json';
import { SPRITES, spriteUrl, type SpriteDef } from './sprites';
import { SHOP_MAP } from '../data/shop';

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
/** Case en bas à gauche de l'emprise d'un objet dont les pieds sont en (x, y). */
function anchorOf(fp: Footprint, x: number, y: number) {
  return { c0: Math.round(x / TS - fp.w / 2), cy: Math.floor((y - 8) / TS) };
}
export function cellsOf(key: string, x: number, y: number): [number, number][] {
  const fp = footprint(key);
  if (!fp) return [];
  const { c0, cy } = anchorOf(fp, x, y);
  const out: [number, number][] = [];
  for (let dy = 0; dy < fp.h; dy++) for (let dx = 0; dx < fp.w; dx++) out.push([c0 + dx, cy - dy]);
  return out;
}
/** Aimante un objet sur la grille : renvoie la position des pieds parfaitement calée. */
export function snapTo(key: string, wx: number, wy: number) {
  const fp = footprint(key) ?? { w: 1, h: 1, blocks: false, unit: true };
  const { c0, cy } = anchorOf(fp, wx, wy);
  return {
    x: (c0 + fp.w / 2) * TS,
    y: fp.w >= 2 ? (cy + 1) * TS + 4 : cy * TS + TS * 0.75,
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
};

export function createWorld(
  canvas: HTMLCanvasElement,
  opts: {
    placed: Placed[];
    unlocked: Set<number>;
    missionsDone: number;
    onMove?: (k: string, x: number, y: number) => void;
    onSelect?: (k: string | null, info?: { id: string; bought: boolean }) => void;
    onMoveMode?: (active: boolean) => void;
    decorRemoved?: string[]; // personnages du décor supprimés par le joueur
    onDecorRemove?: (id: string) => void;
    decorPos?: Record<string, [number, number]>; // personnages du décor déplacés par le joueur
    onDecorMove?: (id: string, x: number, y: number) => void;
  },
) {
  const ctx = canvas.getContext('2d')!;
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
  let W = 300;
  let H = 300;
  let DPR = 1;
  const cam = { x: WORLD.islands[0]?.cx ?? WORLD_W / 2, y: WORLD_H / 2, z: 1 };
  let raf = 0;
  let last = performance.now();
  let t = 0;
  let selected: string | null = null;
  let moveEnt: Ent | null = null; // mode « Déplacer » (bouton) : on touche une case pour poser
  let ghost: { x: number; y: number } | null = null;
  let flashBad = 0; // instant du dernier refus (case rouge qui tremble)
  const effects: { x: number; y: number; t0: number; kind: 'dust' | 'ring'; s?: number }[] = [];
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
  const clouds: { key: string; def: SpriteDef; x: number; y: number; speed: number }[] = [];
  WORLD.decor.forEach(([key, x0, y0, cloud], index) => {
    const def = SPRITES[key];
    if (!def) return;
    if (opts.decorRemoved?.includes(String(index))) return;
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
      }
      e.id = String(index);
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
        } as Ent;
      });
  }
  setPlaced(opts.placed);

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
  // Choisit la prochaine activité : se promener, travailler/combattre, ou rester là.
  function nextActivity(e: Ent) {
    const acts = e.def.act ?? [];
    const r = Math.random();
    if (acts.length && (r < 0.45 || !e.walks)) {
      const i = Math.floor(Math.random() * acts.length);
      const n = acts[i].n;
      const loops = e.key.startsWith('mouton') ? 2 : 2 + Math.floor(Math.random() * 3);
      e.acting = i;
      e.actT0 = t;
      e.actEnd = t + (loops * n) / 10;
      return;
    }
    if (e.walks && r < 0.85) pickTarget(e);
    else e.wait = 1.5 + Math.random() * 3;
  }
  function stepAgent(e: Ent, dt: number) {
    if (e.acting! >= 0) {
      if (t >= e.actEnd!) {
        e.acting = -1;
        e.wait = 1 + Math.random() * 3;
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
        e.wait = 1 + Math.random() * 3;
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
    if (e.wait! <= 0) nextActivity(e);
  }
  function update(dt: number) {
    for (const e of placed) {
      if (!e.agent || e === drag?.ent || e === moveEnt) continue;
      if (e.home!.isl < 0 || !unlocked.has(e.home!.isl)) continue;
      stepAgent(e, dt);
    }
    for (const e of decor) if (e.agent) stepAgent(e, dt);
    for (const c of clouds) {
      c.x += c.speed * dt;
      if (c.x - c.def.fw / 2 > WORLD_W) c.x = -c.def.fw / 2;
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
      ctx.ellipse(e.x, e.y + 2 - (fw > 1 ? 16 : 0), 22 * fw, 8 * Math.max(1, fw * 0.6), 0, 0, Math.PI * 2);
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
    function drawFrame() {
      if (e.face === -1) {
        ctx.save();
        ctx.translate(e.x * 2, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(im, f * def.fw, 0, def.fw, def.fh, dx, dy, def.fw, def.fh);
        ctx.restore();
      } else {
        ctx.drawImage(im, f * def.fw, 0, def.fw, def.fh, dx, dy, def.fw, def.fh);
      }
    }
  }


  function hitBox(e: Ent) {
    const def = e.def;
    const person = def.feet > 0;
    const w = person ? Math.min(def.fw * 0.42, 70) : def.fw * 0.8;
    const h = person ? Math.min((def.fh - def.feet) * 0.55, 90) : def.fh * 0.85;
    return { x0: e.x - w / 2, x1: e.x + w / 2, y0: e.y - h, y1: e.y + 8 };
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
      ctx.ellipse(sel.x, sel.y - (fw > 1 ? 16 : 0), 30 * fw + 3 * pulse, 11 * Math.max(1, fw * 0.7) + pulse, 0, 0, Math.PI * 2);
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
      const b = e.y + e.def.feet;
      return e.x + e.def.fw / 2 > vx0 && e.x - e.def.fw / 2 < vx1 && b > vy0 && b - e.def.fh < vy1;
    });
    all.sort((a, b) => a.y - b.y);
    const lifted = drag?.ent && drag.moved ? drag.ent : null;
    for (const e of all) {
      if (e === moveEnt) drawSprite(e, 0.35);
      else if (e !== lifted) drawSprite(e);
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
      } else {
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
    update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  // ---------- Entrées (souris, tactile, molette) ----------
  const pointers = new Map<number, { x: number; y: number }>();
  let drag: { ent?: Ent; ox: number; oy: number; sx: number; sy: number; moved: boolean; start: { x: number; y: number } } | null = null;
  let pinch: { d: number; z: number } | null = null;

  function localXY(ev: PointerEvent | WheelEvent) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }
  function pick(sx: number, sy: number): Ent | undefined {
    const p = s2w(sx, sy);
    const people = decor.filter((e) => movable(e) && unlocked.has(islandAt(Math.floor(e.x / TS), Math.floor((e.y - 8) / TS))));
    const sorted = [...placed, ...people].sort((a, b) => b.y - a.y);
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
    // mode « Déplacer » : le glisser déplace la carte, un simple toucher pose le personnage
    const ent = moveEnt ? undefined : pick(p.x, p.y);
    if (moveEnt) ghost = snapGhost(p.x, p.y);
    drag = { ent, ox: cam.x, oy: cam.y, sx: p.x, sy: p.y, moved: false, start: ent ? { x: ent.x, y: ent.y } : { x: 0, y: 0 } };
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
    const cy = Math.floor((y - 8) / TS);
    ent.x = x;
    ent.y = y;
    occDirty();
    ent.home = { isl: islandAt(cx, cy), lvl: levelAt(cx, cy) };
    ent.wait = 2;
    ent.moving = false;
    ent.bounceT0 = t;
    const fs = footprint(ent.key)?.w ?? 1;
    const ey = y - (fs > 1 ? 16 : 0);
    effects.push({ x, y: ey, t0: t, kind: 'ring', s: fs }, { x, y: ey, t0: t, kind: 'dust', s: fs });
    if (ent.placed) {
      ent.placed.x = x;
      ent.placed.y = y;
      ent.orig = { x, y };
      opts.onMove?.(ent.placed.k, x, y);
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
  function onMove(ev: PointerEvent) {
    const p = localXY(ev);
    if (!pointers.has(ev.pointerId)) {
      if (moveEnt) {
        ghost = snapGhost(p.x, p.y);
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
      const sn = snapTo(drag.ent.key, w.x, w.y + 10);
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
    } else if (d.ent) {
      if (d.moved && !dropAt(d.ent, d.ent.x, d.ent.y)) {
        d.ent.x = d.start.x;
        d.ent.y = d.start.y;
      }
    } else if (!d.moved && !moveEnt) {
      select(null);
    }
    canvas.style.cursor = 'default';
  }
  function onWheel(ev: WheelEvent) {
    ev.preventDefault();
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
    },
    stop() {
      cancelAnimationFrame(raf);
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
  };
}
