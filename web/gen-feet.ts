// Mesure le « pied » de chaque sprite et l'écrit dans src/data/sprites.json.
//
//   bun gen-feet.ts            → réécrit les valeurs qui ont bougé
//   bun gen-feet.ts --check    → ne réécrit rien, signale seulement les écarts
//
// `feet` = hauteur de vide transparent SOUS l'image. C'est ce qui relie le dessin au sol : le moteur
// pose l'objet en `y`, dessine son bas en `y + feet`, et en déduit la case qu'il occupe. Une valeur
// trop petite décale la case VERS LE BAS — c'est exactement ce qui se passait pour les buissons, les
// rochers et les filons d'or (feet = 0 alors que leur image a 40 à 52 px de vide en dessous) : le
// curseur de pose encadrait la case d'en dessous, et la récolte visait la mauvaise case.
// Les valeurs étaient saisies à la main, donc justes pour les unités (mesuré : lancier 122 = 122 px)
// et fausses partout ailleurs. Ce script les mesure une fois pour toutes.
//
// Deux familles restent volontairement à l'écart :
//  · les BÂTIMENTS — leur ancre suit une autre convention (`snapTo` cale une emprise de 2×2 cases ou
//    plus sur le bas de la case, pas sur le pied du dessin) et elle est juste telle quelle ;
//  · les NUAGES et particules — le moteur les place en coordonnées libres, ils n'ont pas de sol.
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'src/data/sprites.json';
const check = process.argv.includes('--check');
const sprites: Record<string, { src: string; fw: number; fh: number; feet: number }> = JSON.parse(readFileSync(FILE, 'utf8'));

/** Ce script ne mesure que ce qui se pose vraiment au sol (cf. en-tête). */
const measured = (src: string) => /^sprites\/(terrain|units)-/.test(src) && !src.includes('clouds');

/** Hauteur de vide transparent sous la PREMIÈRE image de la planche. */
async function padding(src: string, fw: number, fh: number): Promise<number> {
  const { data, info } = await sharp(`public/ts/${src}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.height !== fh) throw new Error(`${src} : hauteur ${info.height} ≠ fh ${fh} déclaré`);
  for (let y = fh - 1; y >= 0; y--)
    for (let x = 0; x < fw; x++) if (data[(y * info.width + x) * info.channels + 3] > 8) return fh - 1 - y;
  throw new Error(`${src} : première image entièrement vide`);
}

const changes: string[] = [];
for (const [key, def] of Object.entries(sprites)) {
  if (!measured(def.src)) continue;
  const feet = await padding(def.src, def.fw, def.fh);
  if (feet === def.feet) continue;
  changes.push(`${key.padEnd(20)} ${String(def.feet).padStart(4)} → ${feet}`);
  def.feet = feet;
}

if (!changes.length) console.log('✓ tous les pieds sont déjà justes');
else {
  console.log(changes.join('\n'));
  if (check) console.log(`\n${changes.length} écart(s) — relance sans --check pour corriger`);
  else {
    // Même mise en forme que le fichier existant (un champ par ligne, sans indentation) : la
    // relecture du diff ne montre alors QUE les pieds qui ont bougé.
    writeFileSync(FILE, `${JSON.stringify(sprites, null, 1).replace(/^ +/gm, '')}\n`);
    console.log(`\n${FILE} — ${changes.length} valeur(s) corrigée(s)`);
  }
}
