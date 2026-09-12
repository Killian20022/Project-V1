export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type Page = 'home' | 'learn' | 'shop' | 'island' | 'trophies' | 'dictionary' | 'account';

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
  trophies: string[];
  stats: Record<string, number>;
  dailyXP: number;
  dailyDate: string | null;
  sound: boolean;
  unlocks: string[];
  badges: string[];
  completed: string[];
}

export interface SavedWord {
  id?: string;
  word: string;
  definition: string;
}
