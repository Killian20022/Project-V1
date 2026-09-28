// Détecte les RAMPES déjà dessinées sur la carte et les écrit dans src/data/ramps.json.
// À relancer après toute modification du terrain (land.png / world.json).
//
//   bun gen-ramps.ts
//
// Le problème qu'on résout : au bout de chaque falaise, la carte dessine un biseau d'herbe en
// diagonale — la rampe par laquelle on monte d'un palier à l'autre. Mais dans world.json, cette case
// est marquée « bloquée » EXACTEMENT comme la pierre de la falaise. Le moteur ne fait donc aucune
// différence entre une rampe et un mur, et les unités venaient se coller à la paroi.
//
// Rien à dessiner : l'art existe. Il suffit de distinguer les deux, et l'image le dit d'elle-même —
// une rampe est verte, une falaise est en pierre. Mesuré sur les 525 cases bloquées de la carte, la
// séparation est franche : 428 cases sous 20 % d'herbe (pierre), 97 au-dessus de 40 % (rampes), et
// STRICTEMENT AUCUNE entre les deux. D'où le seuil à 0,3, au milieu du vide.
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import WORLD from './src/data/world.json' assert { type: 'json' };

const W: any = WORLD;
const S = 4096 / W.w; // land.png est en demi-résolution : 32 px par case
const GRASS_MIN = 0.3;

const lv = (x: number, y: number) => +W.levels[y]?.[x] || 0;
const blocked = (x: number, y: number) => W.blocked[y]?.[x] === '1';
const isl = (x: number, y: number) => {
  const c = W.island[y]?.[x];
  return !c || c === '.' ? -1 : c.charCodeAt(0) - 65;
};
/** Sol normal : praticable sans rien franchir. */
const ground = (x: number, y: number) => lv(x, y) > 0 && !blocked(x, y);

const { data, info } = await sharp('public/ts/land.png').raw().toBuffer({ resolveWithObject: true });
const px = (x: number, y: number) => {
  const i = (y * info.width + x) * info.channels;
  return { g: data[i + 1], b: data[i + 2], a: info.channels === 4 ? data[i + 3] : 255 };
};
// Part d'herbe d'une case. L'herbe est franchement verte (g ≫ b) ; la pierre de falaise est un
// bleu-vert où g et b sont proches.
function grassRatio(cx: number, cy: number): number {
  let g = 0;
  let n = 0;
  for (let y = Math.round(cy * S); y < Math.round((cy + 1) * S); y++)
    for (let x = Math.round(cx * S); x < Math.round((cx + 1) * S); x++) {
      const p = px(x, y);
      if (p.a < 128) continue;
      n++;
      if (p.g > p.b + 25) g++;
    }
  return n ? g / n : 0;
}

// ---------- 1. Les cases de rampe ----------
const ramp: [number, number][] = [];
const rampSet = new Set<string>();
for (let y = 0; y < W.h; y++)
  for (let x = 0; x < W.w; x++) {
    if (!blocked(x, y) || lv(x, y) <= 0) continue;
    if (grassRatio(x, y) < GRASS_MIN) continue;
    ramp.push([x, y]);
    rampSet.add(`${x},${y}`);
  }
const isRamp = (x: number, y: number) => rampSet.has(`${x},${y}`);

// ---------- 2. Les paliers (régions de sol de même niveau) ----------
const region = new Int32Array(W.w * W.h).fill(-1);
const regionSize: number[] = [];
const regionIsland: number[] = [];
let regions = 0;
for (let y = 0; y < W.h; y++)
  for (let x = 0; x < W.w; x++) {
    if (!ground(x, y) || region[y * W.w + x] >= 0) continue;
    const id = regions++;
    const L = lv(x, y);
    const I = isl(x, y);
    regionSize.push(0);
    regionIsland.push(I);
    const stack: [number, number][] = [[x, y]];
    region[y * W.w + x] = id;
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      regionSize[id]++;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W.w || ny >= W.h || region[ny * W.w + nx] >= 0) continue;
        if (!ground(nx, ny) || lv(nx, ny) !== L || isl(nx, ny) !== I) continue;
        region[ny * W.w + nx] = id;
        stack.push([nx, ny]);
      }
    }
  }

// ---------- 3. Ce que chaque rampe relie ----------
// Les cases de rampe se touchent souvent (un biseau fait deux cases de haut) : on les regroupe, puis
// on regarde quels paliers bordent le groupe. Chaque paire de paliers distincts devient un passage,
// avec les deux cases de sol par lesquelles on y entre et on en sort.
const seen = new Set<string>();
type Passage = { a: [number, number]; b: [number, number] };
const passages: Passage[] = [];
const pairSeen = new Set<string>();
for (const start of ramp) {
  const k0 = `${start[0]},${start[1]}`;
  if (seen.has(k0)) continue;
  const cluster: [number, number][] = [];
  const stack = [start];
  seen.add(k0);
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    cluster.push([cx, cy]);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = cx + dx;
      const ny = cy + dy;
      const k = `${nx},${ny}`;
      if (!isRamp(nx, ny) || seen.has(k)) continue;
      seen.add(k);
      stack.push([nx, ny]);
    }
  }
  // Sols qui bordent le groupe, par palier
  const touch = new Map<number, [number, number]>();
  for (const [cx, cy] of cluster)
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!ground(nx, ny)) continue;
      const r = region[ny * W.w + nx];
      if (r >= 0 && !touch.has(r)) touch.set(r, [nx, ny]);
    }
  const ends = [...touch.entries()];
  for (let i = 0; i < ends.length; i++)
    for (let j = i + 1; j < ends.length; j++) {
      const key = `${Math.min(ends[i][0], ends[j][0])}|${Math.max(ends[i][0], ends[j][0])}`;
      if (pairSeen.has(key)) continue;
      pairSeen.add(key);
      passages.push({ a: ends[i][1], b: ends[j][1] });
    }
}

writeFileSync(
  'src/data/ramps.json',
  JSON.stringify({ cells: ramp, passages: passages.map((p) => ({ ax: p.a[0], ay: p.a[1], bx: p.b[0], by: p.b[1] })) }) + '\n',
);

// ---------- 4. Contrôle : que reste-t-il d'inaccessible ? ----------
const parent = Array.from({ length: regions }, (_, i) => i);
const find = (a: number): number => (parent[a] === a ? a : (parent[a] = find(parent[a])));
for (const p of passages) {
  const ra = find(region[p.a[1] * W.w + p.a[0]]);
  const rb = find(region[p.b[1] * W.w + p.b[0]]);
  if (ra !== rb) parent[ra] = rb;
}
const groups = new Map<number, Set<number>>();
for (let i = 0; i < regions; i++) {
  if (regionSize[i] < 4) continue;
  if (!groups.has(regionIsland[i])) groups.set(regionIsland[i], new Set());
  groups.get(regionIsland[i])!.add(find(i));
}
const stranded = [...groups].filter(([, s]) => s.size > 1);
console.log(`src/data/ramps.json — ${ramp.length} cases de rampe déjà dessinées, ${passages.length} passages entre paliers`);
console.log(
  stranded.length
    ? `${stranded.length} île(s) gardent une zone sans rampe : ${stranded.map(([i]) => `${String.fromCharCode(65 + i)} (${W.islands[i]?.name})`).join(', ')}`
    : '✓ tous les paliers d’au moins 4 cases sont desservis par une rampe',
);
