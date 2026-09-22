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
  island: string[];
  placed: PlacedItem[];
  trophies: string[];
  stats: Record<string, number>;
  dailyXP: number;
  dailyDate: string | null;
  sound: boolean;
  unlocks: string[];
  badges: string[];
  completed: string[];
  srs: Record<string, SrsCard>;
}

export interface PlacedItem {
  k: string;
  id: string;
  x: number;
  y: number;
  rot?: number; // rotation en degrés (0, 90, 180, 270) — molette sur un objet sélectionné
}

export interface SavedWord {
  id?: string;
  word: string;
  definition: string;
}
