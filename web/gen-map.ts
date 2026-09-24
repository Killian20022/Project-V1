// Régénère les aperçus de carte de l'accueil en redessinant la scène complète
// (eau + écume + terre + décor), exactement comme le canvas de src/lib/world.ts.
// À relancer après toute modif du terrain (land.png) ou du décor (world.json).
import { createCanvas, loadImage, type Image } from '@napi-rs/canvas';
import sharp from 'sharp';
import WORLD from './src/data/world.json' assert { type: 'json' };
import SPRITES from './src/data/sprites.json' assert { type: 'json' };

const S: Record<string, any> = SPRITES as any;
const W: any = WORLD;
const TS = W.ts;                 // 64
const WORLD_W = W.w * TS;        // 8192
const WORLD_H = W.h * TS;        // 5120
const WATER = '#47aba9';
const TS_DIR = 'public/ts/';

const canvas = createCanvas(WORLD_W, WORLD_H);
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Cache d'images
const cache = new Map<string, Image>();
async function img(src: string): Promise<Image> {
  if (!cache.has(src)) cache.set(src, await loadImage(TS_DIR + src));
  return cache.get(src)!;
}

// 1) Eau
ctx.fillStyle = WATER;
ctx.fillRect(0, 0, WORLD_W, WORLD_H);

// 2) Écume (frame 0), tuiles 192×192 posées à (cx*TS-TS, cy*TS-TS)
const foam = await img('sprites/foam.png');
for (const [cx, cy] of W.foam as [number, number][]) {
  const col = ((0 + cx + cy) % 16) * 192;
  ctx.drawImage(foam, col, 0, 192, 192, cx * TS - TS, cy * TS - TS, 192, 192);
}

// 3) Terre / falaises / plateaux : land.png (moitié) agrandi ×2
const land = await img('land.png');
ctx.drawImage(land, 0, 0, land.width, land.height, 0, 0, WORLD_W, WORLD_H);

// 4) Décor : sprites statiques, frame 0. On ignore les nuages (cloud) et les
//    clés inconnues. Tri par y (bas de l'image) pour un empilement correct.
type D = { key: string; def: any; x: number; y: number };
const decor: D[] = [];
(W.decor as [string, number, number, number][]).forEach(([key, x0, y0, cloud]) => {
  const def = S[key];
  if (!def || cloud) return;
  decor.push({ key, def, x: x0, y: y0 });
});
decor.sort((a, b) => a.y - b.y);

let drawn = 0;
for (const e of decor) {
  const def = e.def;
  const im = await img(def.src);
  const dx = e.x - def.fw / 2;   // bottom = y0 ; dy = y0 - fh
  const dy = e.y - def.fh;
  ctx.drawImage(im, 0, 0, def.fw, def.fh, dx, dy, def.fw, def.fh);
  drawn++;
}
console.log(`décor dessiné : ${drawn} / ${(W.decor as any[]).length} entrées`);

// 5) Export : PNG plein format → sharp pour des JPG propres
const full = canvas.toBuffer('image/png');
async function out(path: string, w: number, h: number, q: number) {
  await sharp(full).resize(w, h, { fit: 'fill' }).jpeg({ quality: q, mozjpeg: true }).toFile(path);
  console.log(`écrit ${path} (${w}×${h})`);
}
await out('public/ts/map-medium.jpg', WORLD_W / 4, WORLD_H / 4, 84); // 2048×1280
await out('public/ts/map-small.jpg', WORLD_W / 8, WORLD_H / 8, 82);  // 1024×640
console.log('terminé — scène', `${WORLD_W}×${WORLD_H}`);
