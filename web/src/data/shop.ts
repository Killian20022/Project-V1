// Marché de « Scriptoria » — tout ce qu'on peut acheter puis poser sur la carte du royaume.
// Chaque article pointe vers un sprite Tiny Swords (voir src/data/sprites.json).

export type ShopCategory = 'soldats' | 'batiments' | 'nature' | 'ressources' | 'animaux';
export type Faction = 'bleu' | 'rouge' | 'jaune' | 'violet' | 'noir';

export interface ShopItem {
  id: string; // = clé du sprite
  name: string;
  price: number; // coût en or
  wood?: number; // coût en bois
  food?: number; // coût en nourriture
  pop?: number; // population consommée (unités = 1)
  popCap?: number; // population fournie (maisons, château)
  needs?: string; // bâtiment requis pour recruter (base : 'caserne', 'archerie', 'monastere')
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

// Recruter coûte de l'or + des ressources récoltées ; les soldats exigent le bâtiment adéquat.
const UNITS: { key: string; name: string; price: number; wood?: number; food?: number; needs?: string; blurb: string }[] = [
  { key: 'villageois', name: 'Villageois', price: 50, blurb: 'Récolte le bois, l’or et la nourriture' },
  { key: 'moine', name: 'Moine', price: 120, food: 20, needs: 'monastere', blurb: 'Soigne les blessés' },
  { key: 'archer', name: 'Archer', price: 90, wood: 40, food: 20, needs: 'archerie', blurb: 'Vise juste de loin' },
  { key: 'guerrier', name: 'Guerrier', price: 80, wood: 20, food: 30, needs: 'caserne', blurb: 'Épée et bouclier' },
  { key: 'lancier', name: 'Lancier', price: 110, wood: 30, food: 30, needs: 'caserne', blurb: 'Garde d’élite' },
];

// Les 3 styles de maison : une seule carte dans le marché, on change de style à la molette.
const HOUSE_STYLES = [
  { key: 'maison-1', name: 'Maison' },
  { key: 'maison-2', name: 'Maison à étage' },
  { key: 'maison-3', name: 'Chaumière' },
];
const OTHER_BUILDINGS: { key: string; fem: boolean; name: string; price: number; wood: number; max: number; popCap?: number; blurb?: string }[] = [
  { key: 'tour', fem: true, name: 'Tour de guet', price: 320, wood: 120, max: 6, blurb: 'Défend l’île (bientôt)' },
  { key: 'caserne', fem: true, name: 'Caserne', price: 420, wood: 180, max: 4, blurb: 'Permet de recruter guerriers & lanciers' },
  { key: 'archerie', fem: true, name: 'Archerie', price: 420, wood: 180, max: 4, blurb: 'Permet de recruter des archers' },
  { key: 'monastere', fem: false, name: 'Monastère', price: 520, wood: 150, max: 3, blurb: 'Permet de recruter des moines' },
  { key: 'chateau', fem: false, name: 'Château', price: 1000, wood: 400, max: 2, popCap: 8, blurb: '+8 population' },
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
    wood: u.wood,
    food: u.food,
    pop: 1,
    needs: u.needs,
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
    wood: 60,
    popCap: 4,
    category: 'batiments' as const,
    faction: f,
    max: 12,
    hidden: i > 0,
    variants: i === 0 ? variantIds : undefined,
    blurb: i === 0 ? '+4 population · molette : change le style' : undefined,
  }));
  const others: ShopItem[] = OTHER_BUILDINGS.map((b) => ({
    id: buildingKey(b.key, f),
    name: `${b.name} ${b.fem ? LABEL[f].f : LABEL[f].m}`,
    price: b.price,
    wood: b.wood,
    popCap: b.popCap,
    category: 'batiments' as const,
    faction: f,
    max: b.max,
    blurb: b.blurb,
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

// ---------- Population & bâtiments (phase 2) ----------
export const POP_BASE = 6; // population de départ, sans aucun bâtiment

/** Type de bâtiment (sans faction) à partir d'une clé de sprite, ou null. */
export function buildingBase(id: string): string | null {
  if (/chateau/.test(id)) return 'chateau';
  if (/caserne/.test(id)) return 'caserne';
  if (/archerie/.test(id)) return 'archerie';
  if (/monastere/.test(id)) return 'monastere';
  if (/tour/.test(id)) return 'tour';
  if (/maison/.test(id)) return 'maison';
  return null;
}

/** Population maximale = base + capacité fournie par les bâtiments possédés. */
export function popMaxOf(placed: { id: string }[]): number {
  return placed.reduce((cap, p) => cap + (SHOP_MAP[p.id]?.popCap ?? 0), POP_BASE);
}

// ---------- Stockage des ressources ----------
// Chaque ressource a un plafond : quand c'est plein, les villageois arrêtent de récolter.
// Le plafond de base est modeste et AUGMENTE avec les bâtiments possédés (le château stocke le plus).
export type Stock = { gold: number; wood: number; food: number };
// Bases assez larges pour financer le bâtiment le plus cher (château : 1000 or / 400 bois) sans blocage.
export const STORE_BASE: Stock = { gold: 1200, wood: 500, food: 150 };
const STORE_PER: Record<string, Stock> = {
  chateau: { gold: 1500, wood: 300, food: 200 },
  maison: { gold: 150, wood: 40, food: 30 },
  caserne: { gold: 0, wood: 80, food: 40 },
  archerie: { gold: 0, wood: 80, food: 40 },
  monastere: { gold: 0, wood: 40, food: 80 },
  tour: { gold: 100, wood: 60, food: 0 },
};

/** Plafond de stockage (or/bois/nourriture) = base + apport de chaque bâtiment possédé. */
export function storageCaps(placed: { id: string }[]): Stock {
  const cap: Stock = { ...STORE_BASE };
  for (const p of placed) {
    const add = STORE_PER[buildingBase(p.id) ?? ''];
    if (add) {
      cap.gold += add.gold;
      cap.wood += add.wood;
      cap.food += add.food;
    }
  }
  return cap;
}

/** Population utilisée = nombre d'unités possédées (villageois + soldats). */
export function popUsedOf(placed: { id: string }[]): number {
  return placed.filter((p) => SHOP_MAP[p.id]?.category === 'soldats').length;
}

/** Le joueur possède-t-il au moins un bâtiment du type demandé (toute faction) ? */
export function ownsBuilding(placed: { id: string }[], base: string): boolean {
  return placed.some((p) => buildingBase(p.id) === base);
}

/** Reconvertit une clé d'unité/bâtiment vers une faction donnée (garde la position/le type). */
export function applyFaction(id: string, fac: Faction): string {
  const fem = { bleu: 'bleue', rouge: 'rouge', jaune: 'jaune', violet: 'violette', noir: 'noire' }[fac];
  let m: RegExpExecArray | null;
  if ((m = /^(villageois|guerrier|lancier|archer|moine)(?:-(?:rouge|jaune|violet|noir))?$/.exec(id)))
    return m[1] + (fac === 'bleu' ? '' : `-${fac}`);
  if ((m = /^maison-(?:bleue|rouge|jaune|violette|noire)-(\d)$/.exec(id))) return `maison-${fem}-${m[1]}`;
  if ((m = /^(tour|caserne|archerie)(?:-(?:rouge|jaune|violette|noire))?$/.exec(id)))
    return m[1] + (fac === 'bleu' ? '' : `-${fem}`);
  if ((m = /^(chateau|monastere)(?:-(?:rouge|jaune|violet|noir))?$/.exec(id))) return m[1] + (fac === 'bleu' ? '' : `-${fac}`);
  return id; // neutre (arbres, or, moutons, rochers…)
}

const BASE_LABEL: Record<string, string> = {
  caserne: 'une Caserne',
  archerie: 'une Archerie',
  monastere: 'un Monastère',
  chateau: 'un Château',
};
export const needsLabel = (base: string) => BASE_LABEL[base] ?? 'un bâtiment spécial';
