// Marché de « Scriptoria » — tout ce qu'on peut acheter puis poser sur la carte du royaume.
// Chaque article pointe vers un sprite Tiny Swords (voir src/data/sprites.json).

export type ShopCategory = 'soldats' | 'entrainement' | 'batiments' | 'nature' | 'ressources' | 'animaux';
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
  { id: 'entrainement', label: 'Entraînement', hint: 'Monte tout un corps de troupe en grade — les soldats déjà sur la carte comme ceux à venir' },
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

/**
 * Les trois métiers du village. Un villageois ne fait plus tout : il abat, il creuse ou il chasse.
 * `tool` est l'indice dans `act[]` du sprite pion (0 hache, 1 pioche, 2 marteau, 3 couteau) — c'est
 * la planche que la carte du Marché affiche, pour qu'on reconnaisse le métier à l'outil avant même
 * de lire le nom. Sur la carte, le moteur joue déjà cette planche pendant la récolte.
 */
export interface WorkerJob {
  base: string;
  name: string;
  res: 'wood' | 'gold' | 'food';
  tool: number;
  blurb: string;
}
export const WORKER_JOBS: WorkerJob[] = [
  { base: 'bucheron', name: 'Bûcheron', res: 'wood', tool: 0, blurb: 'Hache — n’abat que les arbres' },
  { base: 'mineur', name: 'Mineur', res: 'gold', tool: 1, blurb: 'Pioche — ne creuse que les filons d’or' },
  { base: 'chasseur', name: 'Chasseur', res: 'food', tool: 3, blurb: 'Couteau — ne chasse que les moutons' },
];
/** Métier d'une clé d'unité (toute faction), ou `undefined` si ce n'en est pas un. */
export const jobOf = (id: string): WorkerJob | undefined => WORKER_JOBS.find((j) => id.startsWith(j.base));

// Recruter coûte de l'or + des ressources récoltées ; les soldats exigent le bâtiment adéquat.
const UNITS: { key: string; name: string; price: number; wood?: number; food?: number; needs?: string; max?: number; blurb: string; job?: WorkerJob }[] = [
  ...WORKER_JOBS.map((j) => ({ key: j.base, name: j.name, price: 50, blurb: j.blurb, job: j })),
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
  { key: 'tour', fem: true, name: 'Tour de guet', price: 320, wood: 120, max: 6, blurb: 'Tire sur les assaillants à portée' },
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
    max: u.max ?? 25,
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
    blurb: i === 0 ? '+4 population · molette : 3 styles × 2 sens' : undefined,
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

// Le Portail n'appartient à aucun royaume : une seule et même ruine, quelle que soit ta couleur.
// Il ne se bat pas, ne se prend pas ; il relie tes îles. Deux suffisent à ouvrir une route, d'où un
// prix élevé mais un maximum généreux.
const portals: ShopItem[] = [
  {
    id: 'portail',
    name: 'Portail',
    price: 900,
    wood: 300,
    category: 'batiments',
    max: 6,
    blurb: 'Relie tes îles · clic droit dessus pour choisir où ressortir',
  },
];

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

// Le villageois polyvalent ne se recrute plus (il est devenu bûcheron, mineur ou chasseur), mais sa
// clé RESTE au catalogue, masquée : `migrateState` supprime et rembourse tout objet posé absent de
// `SHOP_MAP`. Sans ces entrées, un seul chargement effacerait les villageois d'une vieille partie —
// et ceux que l'IA produit encore.
const legacyWorkers: ShopItem[] = FACTIONS.map(({ id: f }) => ({
  id: 'villageois' + SUFFIX[f].m,
  name: `Villageois ${LABEL[f].m}`,
  price: 50,
  pop: 1,
  category: 'soldats' as const,
  faction: f,
  max: 25,
  walks: true,
  hidden: true,
  blurb: 'Ancien villageois polyvalent',
}));

export const SHOP: ShopItem[] = [...soldiers, ...legacyWorkers, ...buildings, ...portals, ...nature, ...resources, ...animals];
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

/**
 * Plafond de stockage (or/bois/nourriture) = base + apport de chaque bâtiment possédé.
 * ⚠️ Le volet OR n'est plus appliqué : le trésor est aussi alimenté par les leçons, le plafonner
 * arrêtait les mineurs pour de bon (cf. `roomFor` dans world.ts). On garde le champ pour ne pas
 * casser le type `Stock`, mais ni le moteur ni le HUD ne s'en servent.
 */
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
  if ((m = /^(villageois|bucheron|mineur|chasseur|guerrier|lancier|archer|moine)(?:-(?:rouge|jaune|violet|noir))?$/.exec(id)))
    return m[1] + (fac === 'bleu' ? '' : `-${fac}`);
  if ((m = /^maison-(?:bleue|rouge|jaune|violette|noire)-(\d)$/.exec(id))) return `maison-${fem}-${m[1]}`;
  if ((m = /^(tour|caserne|archerie)(?:-(?:rouge|jaune|violette|noire))?$/.exec(id)))
    return m[1] + (fac === 'bleu' ? '' : `-${fem}`);
  if ((m = /^(chateau|monastere)(?:-(?:rouge|jaune|violet|noir))?$/.exec(id))) return m[1] + (fac === 'bleu' ? '' : `-${fac}`);
  return id; // neutre (arbres, or, moutons, rochers…)
}

/**
 * Relever une ruine coûte MOITIÉ moins que bâtir à neuf : les fondations et une partie des pierres
 * sont encore là. `id` est la clé du bâtiment d'origine, quelle que soit sa couleur — on rebâtit
 * toujours dans la sienne, donc on repasse par `applyFaction` pour trouver le tarif.
 */
export function rebuildCost(id: string, fac: Faction): { id: string; price: number; wood: number; food: number } | null {
  const mine = applyFaction(id, fac);
  const item = SHOP_MAP[mine];
  if (!item) return null;
  const half = (n = 0) => Math.ceil(n / 2);
  return { id: mine, price: half(item.price), wood: half(item.wood), food: half(item.food) };
}

const BASE_LABEL: Record<string, string> = {
  caserne: 'une Caserne',
  archerie: 'une Archerie',
  monastere: 'un Monastère',
  chateau: 'un Château',
};
export const needsLabel = (base: string) => BASE_LABEL[base] ?? 'un bâtiment spécial';

// ---------- Entraînement : les niveaux de soldats (1 → 3) ----------
// Deux façons de monter en grade, qui se cumulent :
//  - l'ENTRAÎNEMENT, acheté ici, vaut pour tout un type d'unité (tous tes guerriers, d'un coup) ;
//  - la VÉTÉRANCE, gagnée au combat, appartient à un soldat en particulier (voir `world.ts`).
// Le total est plafonné à 3. Les rivaux progressent aussi, sans quoi ta montée en puissance
// transformerait la fin de partie en promenade.
export const RANK_MAX = 3;

/** Soldats qui peuvent progresser. Les gens de métier ne se battent pas : pas de grade pour eux. */
export interface Training {
  base: string;
  name: string;
  needs?: string;
  blurb: string;
}
export const TRAININGS: Training[] = UNITS.filter((u) => !u.job).map((u) => ({
  base: u.key,
  name: u.name,
  needs: u.needs,
  blurb: u.blurb,
}));

/** Palier acheté pour un type de soldat (1 = aucun entraînement). */
export const trainedRank = (upgrades: Record<string, number> | undefined, base: string): number =>
  Math.min(RANK_MAX, Math.max(1, upgrades?.[base] ?? 1));

/**
 * Prix pour faire passer TOUT un type de soldat au palier `to`. Dérivé du prix de l'unité : un
 * lancier coûte plus cher qu'un guerrier, son entraînement aussi, sans table à maintenir à part.
 * `null` si le palier n'existe pas.
 */
export function upgradeCost(base: string, to: number): { gold: number; wood: number } | null {
  const unit = UNITS.find((u) => u.key === base);
  if (!unit || to < 2 || to > RANK_MAX) return null;
  const [g, w] = to === 2 ? [5, 1.5] : [11, 3.5];
  return { gold: Math.round((unit.price * g) / 10) * 10, wood: Math.round((unit.price * w) / 5) * 5 };
}
