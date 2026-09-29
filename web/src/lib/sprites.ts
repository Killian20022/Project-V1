import SPRITES_JSON from '../data/sprites.json';

// Catalogue des sprites Tiny Swords (généré depuis la carte Tiled).
// fw/fh = taille d'une image, n = nombre d'images, feet = décalage (px) entre le bas de l'image et les pieds.
export interface SpriteDef {
  name: string;
  src: string;
  fw: number;
  fh: number;
  n: number;
  fps: number;
  feet: number;
  run?: { src: string; n: number };
  act?: { src: string; n: number }[]; // actions : attaque, tir, soin, hache, pioche…
  // Planches « charge à la main » : le villageois qui rapporte sa bûche, son minerai ou sa viande.
  // On change de PLANCHE, jamais de clé : une clé `villageois-bois` perdrait sa couleur aux yeux de
  // `factionOf`, et un villageois rouge repasserait pour un bleu — donc pour un ennemi des siens.
  hold?: Partial<Record<'wood' | 'gold' | 'food', { idle: { src: string; n: number }; run: { src: string; n: number } }>>;
}

export const SPRITES = SPRITES_JSON as unknown as Record<string, SpriteDef>;

// ---------- Les trois métiers du village ----------
// Tiny Swords n'a qu'UN pion par couleur, mais il sait manier la hache, la pioche et le couteau : ses
// planches d'action portent déjà les trois outils. Bûcheron, mineur et chasseur sont donc le même
// personnage sous trois clés, chacune gardant la couleur de son royaume. On dérive ici plutôt que
// d'écrire quinze entrées dans `sprites.json` : ce fichier est REGÉNÉRÉ depuis Tiled, tout ce qu'on y
// ajouterait à la main disparaîtrait à la prochaine passe.
// ⚠️ Aucun suffixe après la couleur : `factionOf` (world.ts) est ancrée en fin de clé.
for (const [base, name] of [
  ['bucheron', 'Bûcheron'],
  ['mineur', 'Mineur'],
  ['chasseur', 'Chasseur'],
] as const)
  for (const suffix of ['', '-rouge', '-jaune', '-violet', '-noir']) {
    const pawn = SPRITES['villageois' + suffix];
    if (pawn) SPRITES[base + suffix] = { ...pawn, name };
  }

export const spriteUrl = (src: string) => `${import.meta.env.BASE_URL}ts/${src}`;
export const uiUrl = (file: string) => `${import.meta.env.BASE_URL}ts/ui/${file}`;
