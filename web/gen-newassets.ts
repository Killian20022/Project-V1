// Prépare le sprite du Portail au format attendu par le moteur.
//
//   SRC="/mnt/c/Users/lopezk19/Desktop/Code Github" bun gen-newassets.ts
//
// La planche est déjà une bande horizontale (6 images de 112×128) : on repasse quand même par sharp
// pour normaliser le PNG et vérifier que le découpage tombe juste.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = process.env.SRC ?? '/mnt/c/Users/lopezk19/Desktop/Code Github';
const OUT = 'public/ts/sprites/';
mkdirSync(OUT, { recursive: true });

const PORTAL = `${SRC}/2D Isometric Portal/Sprite-sheet/Isometric_Portal.png`;
const pm = await sharp(PORTAL).metadata();
if (pm.width !== 672 || pm.height !== 128) throw new Error(`portail inattendu : ${pm.width}×${pm.height}`);
await sharp(PORTAL).toFile(OUT + 'portail.png');
console.log(`${OUT}portail.png — 6 images de 112×128`);
