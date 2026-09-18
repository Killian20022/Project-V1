export type ShopItem = {
  id: string;
  name: string;
  price: number;
  kind: 'char' | 'decor';
  file: string;
  blurb?: string;
};

// Boutique « English Wars » — compagnons (se promènent tout seuls sur Endor)
// et véhicules / créatures à poser. Les visuels sont les sprites Star Wars.
export const SHOP: ShopItem[] = [
  { id: 'r2d2', name: 'R2-D2', price: 120, kind: 'char', file: 'chip_r2d2.png', blurb: 'Astromech loyal' },
  { id: 'bb8', name: 'BB-8', price: 160, kind: 'char', file: 'chip_bb8.png', blurb: 'Toujours de bonne humeur' },
  { id: 'stormtrooper', name: 'Stormtrooper', price: 180, kind: 'char', file: 'chip_stormtrooper.png', blurb: 'Patrouille impériale' },
  { id: 'boba', name: 'Boba Fett', price: 240, kind: 'char', file: 'chip_boba.png', blurb: 'Chasseur de primes' },
  { id: 'chewie', name: 'Chewbacca', price: 260, kind: 'char', file: 'chip_chewie.png', blurb: 'Copilote wookiee' },
  { id: 'yoda', name: 'Maître Yoda', price: 320, kind: 'char', file: 'chip_yoda.png', blurb: 'La Force, puissante en lui' },
  { id: 'tie', name: 'TIE Fighter', price: 140, kind: 'decor', file: 'chip_tie.png' },
  { id: 'xwing', name: 'X-Wing', price: 160, kind: 'decor', file: 'chip_xwing.png' },
  { id: 'rancor', name: 'Rancor', price: 200, kind: 'decor', file: 'chip_rancor.png' },
  { id: 'bantha', name: 'Bantha', price: 220, kind: 'decor', file: 'chip_bantha.png' },
  { id: 'atat', name: 'TB-TT · AT-AT', price: 400, kind: 'decor', file: 'chip_atat.png' },
];

export const SHOP_MAP = Object.fromEntries(SHOP.map((item) => [item.id, item]));
