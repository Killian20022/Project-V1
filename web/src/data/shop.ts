export type ShopItem = {
  id: string;
  name: string;
  price: number;
  kind: 'char' | 'decor';
  file: string;
  blurb?: string;
};

export const SHOP: ShopItem[] = [
  { id: 'chicken', name: 'Poule', price: 120, kind: 'char', file: 'chicken.png', blurb: '+1 pièce / leçon' },
  { id: 'farmer', name: 'Fermier', price: 200, kind: 'char', file: 'character.png', blurb: '+2 XP / leçon' },
  { id: 'cow', name: 'Vache', price: 250, kind: 'char', file: 'cow.png', blurb: '+2 pièces / leçon' },
  { id: 'rock', name: 'Rocher', price: 40, kind: 'decor', file: 'rock.png' },
  { id: 'bush', name: 'Buisson', price: 50, kind: 'decor', file: 'bush.png' },
  { id: 'nest', name: 'Nid', price: 60, kind: 'decor', file: 'nest.png' },
  { id: 'sunflower', name: 'Tournesol', price: 80, kind: 'decor', file: 'sunflower.png' },
  { id: 'chest', name: 'Coffre', price: 90, kind: 'decor', file: 'chest.png' },
  { id: 'tree', name: 'Pommier', price: 120, kind: 'decor', file: 'tree_apple.png' },
  { id: 'bridge', name: 'Pont', price: 150, kind: 'decor', file: 'bridge.png' },
  { id: 'coop', name: 'Poulailler', price: 300, kind: 'decor', file: 'chicken_house.png' },
];

export const SHOP_MAP = Object.fromEntries(SHOP.map((item) => [item.id, item]));
