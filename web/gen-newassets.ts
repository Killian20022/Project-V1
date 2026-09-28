// Découpe les deux nouveaux packs au format attendu par le moteur (une bande horizontale par
// animation) et les dépose dans public/ts/sprites/.
//
//   SRC="/mnt/c/Users/lopezk19/Desktop/Code Github" bun gen-newassets.ts
//
// Pourquoi un script plutôt qu'une copie : la planche du démon est une grille 22×5 (une ligne par
// animation, toutes complétées à 22 cases), alors que `SpriteDef` attend une bande contiguë de `n`
// images. On extrait donc ligne par ligne, en ne gardant que les images réellement utilisées.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = process.env.SRC ?? '/mnt/c/Users/lopezk19/Desktop/Code Github';
const OUT = 'public/ts/sprites/';
mkdirSync(OUT, { recursive: true });

// ---------- Démon ----------
// Planche 6336×800 = 22 colonnes × 5 lignes de 288×160. Nombre d'images réellement dessinées par
// ligne (le reste est vide) : compté dans « individual sprites ».
const SHEET = `${SRC}/boss_demon_slime_FREE_v1.0/spritesheets/demon_slime_FREE_v1.0_288x160_spritesheet.png`;
const FW = 288;
const FH = 160;
const ROWS: { row: number; n: number; out: string }[] = [
  { row: 0, n: 6, out: 'demon-idle.png' },
  { row: 1, n: 12, out: 'demon-run.png' },
  { row: 2, n: 15, out: 'demon-cleave.png' },
  { row: 3, n: 5, out: 'demon-hit.png' },
  { row: 4, n: 22, out: 'demon-death.png' },
];
for (const r of ROWS) {
  await sharp(SHEET)
    .extract({ left: 0, top: r.row * FH, width: r.n * FW, height: FH })
    .toFile(OUT + r.out);
  console.log(`${OUT}${r.out} — ${r.n} images de ${FW}×${FH}`);
}

// ---------- Portail ----------
// 672×128 = 6 images de 112×128, déjà en bande : une simple copie suffit, mais on repasse par sharp
// pour normaliser le PNG (et vérifier au passage que le découpage tombe juste).
const PORTAL = `${SRC}/2D Isometric Portal/Sprite-sheet/Isometric_Portal.png`;
const pm = await sharp(PORTAL).metadata();
if (pm.width !== 672 || pm.height !== 128) throw new Error(`portail inattendu : ${pm.width}×${pm.height}`);
await sharp(PORTAL).toFile(OUT + 'portail.png');
console.log(`${OUT}portail.png — 6 images de 112×128`);
