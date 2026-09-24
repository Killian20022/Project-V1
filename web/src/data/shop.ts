// Marché de « Scriptoria » — tout ce qu'on peut acheter puis poser sur la carte du royaume.
// Chaque article pointe vers un sprite Tiny Swords (voir src/data/sprites.json).

export type ShopCategory = 'soldats' | 'batiments' | 'nature' | 'ressources' | 'animaux';
export type Faction = 'bleu' | 'rouge' | 'jaune' | 'violet' | 'noir';

export interface ShopItem {
  id: string; // = clé du sprite
  name: string;
  price: number;
  category: ShopCategory;
  faction?: Faction;
  max: number; // exemplaires maximum
  walks?: boolean; // se promène tout seul sur l'île
  blurb?: string;
  hidden?: boolean; // variante non affichée dans la grille du marché (ex. styles de maison)
  variants?: string[]; // clés cyclables à la molette pendant la pose (styles de maison)
}

export const CATEGORIES: { id: ShopCategory; label: string; hint: string }[] = [
  { id: 'soldats', label: 'Soldats', hint: 'Ils patrouillent tout seuls sur tes îles' },
  { id: 'batiments', label: 'Bâtiments', hint: 'Bâtis ton village, ton château, ta forteresse' },
  { id: 'nature', label: 'Arbres & buissons', hint: 'Pour une île verdoyante' },
  { id: 'ressources', label: 'Rochers & trésors', hint: 'Pierres, or et bois' },
  { id: 'animaux', label: 'Animaux', hint: 'Des moutons qui broutent' },
];

export const FACTIONS: { id: Faction; label: string; color: string }[] = [
  { id: 'bleu', label: 'Bleu', color: '#3f8fd1' },
  { id: 'rouge', label: 'Rouge', color: '#d1473f' },
  { id: 'jaune', label: 'Jaune', color: '#d9b233' },
  { id: 'violet', label: 'Violet', color: '#9b5fc2' },
  { id: 'noir', label: 'Noir', color: '#4a4f5c' },
];

// Suffixe des clés de sprites selon la faction (le bleu n'a pas de suffixe).
const SUFFIX: Record<Faction, { m: string; f: string }> = {
  bleu: { m: '', f: '' },
  rouge: { m: '-rouge', f: '-rouge' },
  jaune: { m: '-jaune', f: '-jaune' },
  violet: { m: '-violet', f: '-violette' },
  noir: { m: '-noir', f: '-noire' },
};
const LABEL: Record<Faction, { m: string; f: string }> = {
  bleu: { m: 'bleu', f: 'bleue' },
  rouge: { m: 'rouge', f: 'rouge' },
  jaune: { m: 'jaune', f: 'jaune' },
  violet: { m: 'violet', f: 'violette' },
  noir: { m: 'noir', f: 'noire' },
};

const UNITS = [
  { key: 'villageois', name: 'Villageois', price: 60, blurb: 'Travailleur infatigable' },
  { key: 'moine', name: 'Moine', price: 120, blurb: 'Soigne les blessés' },
  { key: 'archer', name: 'Archer', price: 150, blurb: 'Vise juste de loin' },
  { key: 'guerrier', name: 'Guerrier', price: 180, blurb: 'Épée et bouclier' },
  { key: 'lancier', name: 'Lancier', price: 220, blurb: 'Garde d’élite' },
];

// Les 3 styles de maison : une seule carte dans le marché, on change de style à la molette.
const HOUSE_STYLES = [
  { key: 'maison-1', name: 'Maison' },
  { key: 'maison-2', name: 'Maison à étage' },
  { key: 'maison-3', name: 'Chaumière' },
];
const OTHER_BUILDINGS: { key: string; fem: boolean; name: string; price: number; max: number }[] = [
  { key: 'tour', fem: true, name: 'Tour de guet', price: 320, max: 6 },
  { key: 'caserne', fem: true, name: 'Caserne', price: 420, max: 4 },
  { key: 'archerie', fem: true, name: 'Archerie', price: 420, max: 4 },
  { key: 'monastere', fem: false, name: 'Monastère', price: 520, max: 3 },
  { key: 'chateau', fem: false, name: 'Château', price: 1000, max: 2 },
];

/** Renvoie les 3 clés de style d'une maison (même faction), ou null si ce n'est pas une maison. */
export function houseVariants(id: string): string[] | null {
  const m = /^maison-(bleue|rouge|jaune|violette|noire)-[123]$/.exec(id);
  if (!m) return null;
  return [1, 2, 3].map((n) => `maison-${m[1]}-${n}`);
}

function buildingKey(b: string, f: Faction): string {
  const s = SUFFIX[f];
  if (b.startsWith('maison-')) {
    const n = b.split('-')[1];
    if (f === 'bleu') return `maison-bleue-${n}`;
    const fem = { rouge: 'rouge', jaune: 'jaune', violet: 'violette', noir: 'noire' }[f];
    return `maison-${fem}-${n}`;
  }
  const fem = ['tour', 'caserne', 'archerie'].includes(b);
  return b + (fem ? s.f : s.m);
}

const soldiers: ShopItem[] = FACTIONS.flatMap(({ id: f }) =>
  UNITS.map((u) => ({
    id: u.key + SUFFIX[f].m,
    name: `${u.name} ${LABEL[f].m}`,
    price: u.price + (f === 'noir' ? 30 : 0),
    category: 'soldats' as const,
    faction: f,
    max: 25,
    walks: true,
    blurb: u.blurb,
  })),
);

const buildings: ShopItem[] = FACTIONS.flatMap(({ id: f }) => {
  const variantIds = HOUSE_STYLES.map((h) => buildingKey(h.key, f));
  // 3 styles de maison : seul le 1er s'affiche (carte « Maison »), les autres sont cyclables à la molette.
  const houses: ShopItem[] = HOUSE_STYLES.map((h, i) => ({
    id: variantIds[i],
    name: `${i === 0 ? 'Maison' : h.name} ${LABEL[f].f}`,
    price: 150,
    category: 'batiments' as const,
    faction: f,
    max: 12,
    hidden: i > 0,
    variants: i === 0 ? variantIds : undefined,
    blurb: i === 0 ? 'Molette pendant la pose : change le style' : undefined,
  }));
  const others: ShopItem[] = OTHER_BUILDINGS.map((b) => ({
    id: buildingKey(b.key, f),
    name: `${b.name} ${b.fem ? LABEL[f].f : LABEL[f].m}`,
    price: b.price,
    category: 'batiments' as const,
    faction: f,
    max: b.max,
  }));
  return [...houses, ...others];
});

const nature: ShopItem[] = [
  { id: 'sapin-1', name: 'Sapin', price: 40, category: 'nature', max: 30 },
  { id: 'sapin-2', name: 'Grand sapin', price: 50, category: 'nature', max: 30 },
  { id: 'arbre-jaune', name: 'Arbre doré', price: 45, category: 'nature', max: 30 },
  { id: 'arbre-orange', name: 'Arbre d’automne', price: 45, category: 'nature', max: 30 },
  { id: 'buisson-1', name: 'Buisson rond', price: 20, category: 'nature', max: 30 },
  { id: 'buisson-2', name: 'Petit buisson', price: 15, category: 'nature', max: 30 },
  { id: 'buisson-3', name: 'Fougère', price: 20, category: 'nature', max: 30 },
  { id: 'buisson-4', name: 'Touffe d’herbes', price: 15, category: 'nature', max: 30 },
  { id: 'souche-1', name: 'Souche', price: 15, category: 'nature', max: 20 },
  { id: 'souche-2', name: 'Vieille souche', price: 15, category: 'nature', max: 20 },
];

const resources: ShopItem[] = [
  { id: 'rocher-1', name: 'Caillou', price: 10, category: 'ressources', max: 20 },
  { id: 'rocher-2', name: 'Pierre', price: 12, category: 'ressources', max: 20 },
  { id: 'rocher-3', name: 'Rocher moussu', price: 15, category: 'ressources', max: 20 },
  { id: 'rocher-4', name: 'Gros rocher', price: 18, category: 'ressources', max: 20 },
  { id: 'bois', name: 'Tas de bois', price: 25, category: 'ressources', max: 20 },
  { id: 'or-petit', name: 'Pépite d’or', price: 80, category: 'ressources', max: 10 },
  { id: 'or', name: 'Filon d’or', price: 150, category: 'ressources', max: 10 },
  { id: 'or-gros', name: 'Mine d’or', price: 260, category: 'ressources', max: 6 },
];

const animals: ShopItem[] = [
  { id: 'mouton', name: 'Mouton', price: 50, category: 'animaux', max: 30, walks: true, blurb: 'Bêêê !' },
  { id: 'mouton-qui-broute', name: 'Mouton gourmand', price: 55, category: 'animaux', max: 30, blurb: 'Il broute sans s’arrêter' },
];

export const SHOP: ShopItem[] = [...soldiers, ...buildings, ...nature, ...resources, ...animals];
export const SHOP_MAP: Record<string, ShopItem> = Object.fromEntries(SHOP.map((item) => [item.id, item]));
