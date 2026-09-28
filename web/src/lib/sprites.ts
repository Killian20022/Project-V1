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

export const spriteUrl = (src: string) => `${import.meta.env.BASE_URL}ts/${src}`;
export const uiUrl = (file: string) => `${import.meta.env.BASE_URL}ts/ui/${file}`;
