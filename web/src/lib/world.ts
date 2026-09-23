// Moteur de la carte du royaume « English Sword » (canvas 2D, pixel art Tiny Swords).
// - carte générée depuis Tiled (src/data/world.json + public/ts/land.png)
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
  const cx = Math.floor(x / TS);
  const cy = Math.floor(y / TS);
  const isl = islandAt(cx, cy);
  return isl >= 0 && unlocked.has(isl) && levelAt(cx, cy) > 0 && !blockedAt(cx, cy);
}

/** Trouve un emplacement libre (pieds au centre d'une case) sur une île débloquée. */
export function findSpot(unlocked: Set<number>, taken: Placed[] = []): { x: number; y: number } {
  const cells: [number, number][] = [];
  for (let cy = 0; cy < WORLD.h; cy++)
    for (let cx = 0; cx < WORLD.w; cx++) {
      const isl = islandAt(cx, cy);
      if (isl >= 0 && unlocked.has(isl) && levelAt(cx, cy) > 0 && !blockedAt(cx, cy)) cells.push([cx, cy]);
    }
  if (!cells.length) return { x: WORLD_W / 2, y: WORLD_H / 2 };
  const occupied = new Set(taken.map((p) => `${Math.floor(p.x / TS)},${Math.floor(p.y / TS)}`));
  const decorCells = new Set(WORLD.decor.map(([, x, y]) => `${Math.floor(x / TS)},${Math.floor((y - 8) / TS)}`));
  const free = cells.filter(([cx, cy]) => !occupied.has(`${cx},${cy}`) && !decorCells.has(`${cx},${cy}`));
  // On remplit d'abord l'île du château (île de départ), puis les autres îles libérées.
  const home = WORLD.islands.findIndex((i) => i.unlock === 0);
  const freeHome = free.filter(([cx, cy]) => islandAt(cx, cy) === home);
  const pool = freeHome.length ? freeHome : free.length ? free : cells;
  const [cx, cy] = pool[Math.floor(Math.random() * pool.length)];
  return { x: cx * TS + TS / 2 + (Math.random() - 0.5) * 20, y: cy * TS + TS * 0.75 };
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
};

export function createWorld(
  canvas: HTMLCanvasElement,
  opts: {
    placed: Placed[];
    unlocked: Set<number>;
    missionsDone: number;
    onMove?: (k: string, x: number, y: number) => void;
    onSelect?: (k: string | null) => void;
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
  const land = img('land.png');
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

  const walkableCell = (cx: number, cy: number) => islandAt(cx, cy) >= 0 && levelAt(cx, cy) > 0 && !blockedAt(cx, cy);

  // Décor fixe (généré depuis Tiled)
  const decor: Ent[] = [];
  const clouds: { key: string; def: SpriteDef; x: number; y: number; speed: number }[] = [];
  WORLD.decor.forEach(([key, x0, y0, cloud], index) => {
    const def = SPRITES[key];
    if (!def) return;
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
        e.id = String(index);
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
      if (walkable(Math.floor(tx / TS), Math.floor(ty / TS), e.home!)) {
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
        if (!walkable(Math.floor(nx / TS), Math.floor(ny / TS), e.home!)) {
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
      if (!e.agent || e === drag?.ent) continue;
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
  function drawSprite(e: Ent, alpha = 1) {
    const def = e.def;
    const run = e.moving && def.run;
    const act = !run && e.acting !== undefined && e.acting >= 0 ? def.act?.[e.acting] : undefined;
    const sheet = run ? def.run! : act ?? { src: def.src, n: def.n };
    const im = img(sheet.src);
    if (!im.complete || !im.naturalWidth) return;
    const fps = run ? 12 : act ? 10 : def.fps || 8;
    const f = sheet.n > 1 ? (act ? Math.floor((t - (e.actT0 ?? 0)) * fps) : Math.floor(t * fps + e.ph)) % sheet.n : 0;
    const bottom = e.y + def.feet;
    const dx = e.x - def.fw / 2;
    const dy = bottom - def.fh;
    ctx.globalAlpha = alpha;
    if (e.face === -1) {
      ctx.save();
      ctx.translate(e.x * 2, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(im, f * def.fw, 0, def.fw, def.fh, dx, dy, def.fw, def.fh);
      ctx.restore();
    } else {
      ctx.drawImage(im, f * def.fw, 0, def.fw, def.fh, dx, dy, def.fw, def.fh);
    }
    ctx.globalAlpha = 1;
  }

  function hitBox(e: Ent) {
    const def = e.def;
    const person = def.feet > 0;
    const w = person ? Math.min(def.fw * 0.42, 70) : def.fw * 0.8;
    const h = person ? Math.min((def.fh - def.feet) * 0.55, 90) : def.fh * 0.85;
    return { x0: e.x - w / 2, x1: e.x + w / 2, y0: e.y - h, y1: e.y + 8 };
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
    if (land.complete && land.naturalWidth) {
      const sx = Math.max(0, Math.floor(vx0));
      const sy = Math.max(0, Math.floor(vy0));
      const sw = Math.min(WORLD_W, Math.ceil(vx1)) - sx;
      const sh = Math.min(WORLD_H, Math.ceil(vy1)) - sy;
      if (sw > 0 && sh > 0) ctx.drawImage(land, sx, sy, sw, sh, sx, sy, sw, sh);
    }
    // sélection
    const sel = selected ? placed.find((p) => p.placed!.k === selected) : null;
    if (sel && !drag) {
      ctx.fillStyle = 'rgba(255, 230, 140, 0.35)';
      ctx.beginPath();
      ctx.ellipse(sel.x, sel.y, 28, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // sprites triés par profondeur
    const all = [...decor, ...placed].filter((e) => {
      const b = e.y + e.def.feet;
      return e.x + e.def.fw / 2 > vx0 && e.x - e.def.fw / 2 < vx1 && b > vy0 && b - e.def.fh < vy1;
    });
    all.sort((a, b) => a.y - b.y);
    for (const e of all) drawSprite(e, drag?.ent === e ? 0.85 : 1);

    // zone de dépôt pendant le glisser
    if (drag?.ent) {
      const ok = canPlaceAt(drag.ent.x, drag.ent.y, unlocked);
      ctx.strokeStyle = ok ? 'rgba(120, 255, 140, 0.9)' : 'rgba(255, 90, 80, 0.95)';
      ctx.lineWidth = 3 / cam.z;
      ctx.strokeRect(Math.floor(drag.ent.x / TS) * TS, Math.floor(drag.ent.y / TS) * TS, TS, TS);
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
    const people = decor.filter((e) => e.agent && unlocked.has(islandAt(Math.floor(e.x / TS), Math.floor(e.y / TS))));
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
    const ent = pick(p.x, p.y);
    drag = { ent, ox: cam.x, oy: cam.y, sx: p.x, sy: p.y, moved: false, start: ent ? { x: ent.x, y: ent.y } : { x: 0, y: 0 } };
    if (ent) {
      ent.moving = false;
      ent.acting = -1;
      selected = ent.placed ? ent.placed.k : null;
      opts.onSelect?.(selected);
    }
  }
  function onMove(ev: PointerEvent) {
    const p = localXY(ev);
    if (!pointers.has(ev.pointerId)) {
      canvas.style.cursor = pick(p.x, p.y) ? 'grab' : 'default';
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
    if (drag.ent) {
      const w = s2w(p.x, p.y);
      drag.ent.x = w.x;
      drag.ent.y = w.y + 10;
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
    if (d.ent) {
      if (d.moved) {
        if (canPlaceAt(d.ent.x, d.ent.y, unlocked)) {
          const x = Math.round(d.ent.x);
          const y = Math.round(d.ent.y);
          const cx = Math.floor(x / TS);
          const cy = Math.floor(y / TS);
          d.ent.home = { isl: islandAt(cx, cy), lvl: levelAt(cx, cy) };
          d.ent.wait = 2;
          if (d.ent.placed) {
            d.ent.placed.x = x;
            d.ent.placed.y = y;
            d.ent.orig = { x, y };
            opts.onMove?.(d.ent.placed.k, x, y);
          } else {
            // personnage du décor : il vit désormais autour de son nouvel emplacement
            d.ent.x = x;
            d.ent.y = y;
            d.ent.origin = { x, y };
            d.ent.walks = !!d.ent.def.run;
            if (d.ent.id) opts.onDecorMove?.(d.ent.id, x, y);
          }
        } else {
          d.ent.x = d.start.x;
          d.ent.y = d.start.y;
        }
      }
    } else if (!d.moved) {
      selected = null;
      opts.onSelect?.(null);
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
    setUnlocked(set: Set<number>, done: number) {
      if (set.size !== unlocked.size) fogDirty = true;
      unlocked = set;
      missionsDone = done;
    },
  };
}
