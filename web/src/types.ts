export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type Page = 'home' | 'learn' | 'business' | 'grammar' | 'shop' | 'island' | 'trophies' | 'dictionary' | 'account';

export interface Sentence {
  en: string;
  fr: string;
  hint?: string;
}

export interface Drill {
  q: string;
  options: readonly string[];
  answer: string;
  exp?: string;
}

// Mini-explication animée sur-mesure (optionnelle) pour une leçon phare.
// Sans ce champ, LessonExplainer retombe sur un mode générique basé sur forms/examples.
export interface LessonExplainerStep {
  label: string;
  detail: string;
  highlight?: string;
}

export interface LessonExplainerSpec {
  kind: 'timeline' | 'comparison';
  steps: readonly LessonExplainerStep[];
}

// Réplique d'un dialogue : qui parle, la phrase en anglais, et sa traduction.
export interface DialogueTurn {
  speaker: string;
  en: string;
  fr: string;
}

// Compréhension écrite (un texte) ou orale (un dialogue), suivie de questions.
// Contenu additif rangé à part (voir data/comprehension.ts), fusionné aux leçons
// par content.ts — on ne touche jamais au gros curriculum.ts.
export interface Comprehension {
  kind: 'text' | 'dialogue';
  title: string;
  intro?: string; // consigne en français, ex. « Lis le texte puis réponds. »
  text?: string; // pour kind 'text' : le passage en anglais (peut contenir des \n)
  turns?: readonly DialogueTurn[]; // pour kind 'dialogue'
  translation?: string; // traduction française du texte (optionnelle, affichée en référence)
  questions: readonly Drill[]; // réutilise Drill { q, options, answer, exp? }
}

// Module du parcours Business English (formation pro / B2B).
// C'est une leçon classique (réutilise tout le moteur d'exercices) enrichie d'un
// identifiant stable, d'un niveau CEFR nominal (badge + SRS) et d'une catégorie.
// Contenu additif rangé à part (voir data/business.ts) — on ne touche jamais au
// curriculum grand public.
export interface BusinessModule extends Lesson {
  id: string; // slug stable, ex. « emails » → complété = `biz:emails`
  level: Level; // CEFR nominal (affichage + rattachement SRS)
  category: string; // regroupement dans la page Business, ex. « Écrit »
  goal?: string; // objectif court affiché sur la carte du module
}

export interface Lesson {
  t: 'G' | 'V';
  title: string;
  intro?: string;
  formsTitle?: string;
  forms?: readonly (readonly [string, string])[];
  sections?: readonly { h: string; body: string }[];
  examples?: readonly (readonly [string, string])[];
  pitfalls?: readonly string[];
  keypoints?: readonly string[];
  drills?: readonly Drill[];
  practice?: readonly Sentence[];
  explainer?: LessonExplainerSpec;
  comprehension?: Comprehension;
}

// Carte de révision espacée : une par phrase déjà étudiée.
export interface SrsCard {
  id: string; // `${level}|${en}`
  level: Level;
  en: string;
  fr: string;
  box: number; // boîte de Leitner (0..6)
  due: number; // timestamp (ms) de la prochaine révision
  lapses: number; // nombre d'oublis
  last: number; // dernière révision (timestamp ms)
}

export interface GameState {
  points: number;
  streak: number;
  lastActive: string | null;
  lastDaily: string | null;
  dark: boolean;
  maxLevelIdx: number;
  lessons: Partial<Record<Level, number>>;
  coins: number;
  resources?: { wood: number; food: number }; // réserves récoltées sur la carte (l'or reste `coins`)
  faction?: 'bleu' | 'rouge' | 'jaune' | 'violet' | 'noir'; // couleur du royaume du joueur
  starters?: boolean; // ressources de départ (filons d'or) déjà déposées une fois
  goldTopUp?: boolean; // filons de rattrapage ajoutés aux parties commencées avec seulement 2 filons
  // Ban royal : chaque quête d'anglais donne une levée, qui lève un soldat sans or ni caserne.
  // On mémorise les levées DÉPENSÉES ; les disponibles = quêtes terminées − `banUsed`.
  banUsed?: number;
  // Vassalité : ton dernier château est tombé. Un royaume rival prélève un tiers de chaque récolte
  // jusqu'à ce que tu brises le joug (rançon en quêtes d'anglais, ou son château rasé).
  vassal?: {
    of: string; // couleur du suzerain
    atQuests: number; // quêtes terminées au moment de la chute (point de départ de la rançon)
    tribute: { gold: number; wood: number; food: number }; // prélevé, rendu d'un coup à la libération
  } | null;
  // Entraînement acheté au marché : palier (2 ou 3) par type de soldat, pour TOUTE la couleur du
  // joueur — présents et futurs. Absent = palier 1. Se cumule avec la vétérance de chaque unité.
  upgrades?: Record<string, number>;
  island: string[];
  placed: PlacedItem[];
  inventory?: { k: string; id: string }[]; // achats en attente de pose (case blanche transparente)
  // Bâtiments rasés au combat : il en reste des ruines, sur place, reconstructibles à moitié prix.
  // `id` est la clé du bâtiment d'origine (avec sa couleur) — on rebâtit toujours dans la tienne.
  ruins?: { k: string; id: string; x: number; y: number }[];
  decorPos?: Record<string, [number, number]>;
  decorRemoved?: string[]; // personnages d'origine renvoyés du royaume // personnages de la carte déplacés par le joueur
  // PV restants des bâtiments et unités abîmés, par clé d'entité (`decor:<index>` ou clé d'achat) :
  // la carte reprend là où tu l'as laissée au lieu de tout réparer à chaque visite.
  damage?: Record<string, number>;
  trophies: string[];
  stats: Record<string, number>;
  dailyXP: number;
  dailyDate: string | null;
  sound: boolean;
  unlocks: string[];
  badges: string[];
  completed: string[];
  srs: Record<string, SrsCard>;
  savedAt?: number; // horodatage de la dernière sauvegarde (pour ne jamais écraser une version plus récente)
}

export interface PlacedItem {
  k: string;
  id: string;
  x: number;
  y: number;
  rot?: number; // rotation en degrés (0, 90, 180, 270) — molette sur un objet sélectionné
  xp?: number; // ennemis abattus par CE soldat : sa vétérance, qui monte son niveau
}

export interface SavedWord {
  id?: string;
  word: string;
  definition: string;
}
