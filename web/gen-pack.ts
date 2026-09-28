// Copie dans public/ts/ les images du pack Tiny Swords que le jeu n'utilisait pas encore.
//
//   bun gen-pack.ts            → copie ce qui manque
//   bun gen-pack.ts --force    → recopie tout, même l'existant
//
// Les 166 sprites déjà présents suivent une convention : le chemin dans le pack, aplati en
// kebab-case (`Units/Blue Units/Pawn/Pawn_Idle.png` → `units-blue-units-pawn-pawn-idle.png`).
// Ça avait été fait à la main ; ce script l'automatise pour que la prochaine fois soit triviale.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import sharp from 'sharp';

const PACK = process.env.PACK ?? '../Tiled/Tiny Swords (Free Pack)';
const SPRITES = 'public/ts/sprites/';
const UI = 'public/ts/ui/';
mkdirSync(SPRITES, { recursive: true });
mkdirSync(UI, { recursive: true });
const force = process.argv.includes('--force');

/** Chemin du pack → nom de fichier plat, à l'identique de la convention existante. */
const flat = (rel: string) =>
  rel
    .replace(/\.png$/i, '')
    .replace(/[\s_/]+/g, '-')
    .replace(/[()]/g, '')
    .toLowerCase() + '.png';

let copied = 0;
let skipped = 0;
function grab(rel: string, out: string, dir = SPRITES) {
  const src = `${PACK}/${rel}`;
  if (!existsSync(src)) throw new Error(`absent du pack : ${rel}`);
  const dst = dir + out;
  if (!force && existsSync(dst)) {
    skipped++;
    return;
  }
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  copied++;
}

// ---------- Villageois : outils et charges portées ----------
// `Idle/Run` en Wood/Gold/Meat = le villageois qui RAPPORTE sa récolte à la main.
// `Interact Knife` = le dépeçage du mouton (jusqu'ici fait à la hache, ce qui n'avait aucun sens).
const COLORS = ['Blue', 'Red', 'Purple', 'Yellow', 'Black'];
const PAWN = ['Pawn_Idle Wood', 'Pawn_Run Wood', 'Pawn_Idle Gold', 'Pawn_Run Gold', 'Pawn_Idle Meat', 'Pawn_Run Meat', 'Pawn_Interact Knife'];
for (const c of COLORS)
  for (const f of PAWN) {
    const rel = `Units/${c} Units/Pawn/${f}.png`;
    grab(rel, flat(rel));
  }

// ---------- Interface : curseurs, barres, icônes de ressources ----------
// Les curseurs servent tels quels en CSS ; 64 px est la bonne taille, au-delà les navigateurs
// refusent l'image.
for (const n of ['01', '02', '03', '04']) grab(`UI Elements/UI Elements/Cursors/Cursor_${n}.png`, `cursor_${n}.png`, UI);
grab('UI Elements/UI Elements/Bars/SmallBar_Base.png', 'smallbar_base.png', UI);
grab('UI Elements/UI Elements/Bars/SmallBar_Fill.png', 'smallbar_fill.png', UI);
grab('Terrain/Resources/Wood/Wood Resource/Wood Resource.png', 'res_wood.png', UI);
grab('Terrain/Resources/Gold/Gold Resource/Gold_Resource.png', 'res_gold.png', UI);
grab('Terrain/Resources/Meat/Meat Resource/Meat Resource.png', 'res_food.png', UI);

console.log(`public/ts — ${copied} image(s) copiée(s), ${skipped} déjà présente(s)`);

// Contrôle : une planche d'unité doit être un multiple de 192 px de large, sinon le découpage
// d'animation serait faux et on ne s'en apercevrait qu'à l'écran.
for (const c of COLORS)
  for (const f of PAWN) {
    const m = await sharp(SPRITES + flat(`Units/${c} Units/Pawn/${f}.png`)).metadata();
    if (m.width! % 192 || m.height !== 192) throw new Error(`${c}/${f} : ${m.width}×${m.height} n'est pas un multiple de 192`);
  }
console.log('✓ toutes les planches du villageois sont au format 192×192');
