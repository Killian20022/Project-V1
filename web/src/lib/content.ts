import { CURRICULUM } from '../data/curriculum';
import { SENTENCES } from '../data/sentences';
import { COMPREHENSION } from '../data/comprehension';
import type { Lesson, Level, Sentence } from '../types';

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// Nombre de leçons réellement présentes pour un niveau (dynamique)
export function lessonCount(level: Level): number {
  return ((CURRICULUM as unknown as Record<Level, readonly Lesson[]>)[level] ?? []).length;
}

// Total de leçons tous niveaux confondus
export const TOTAL_LESSONS = LEVELS.reduce((sum, lv) => sum + lessonCount(lv), 0);

// Grades « English Wars » : la progression Jedi, du Youngling au Grand Maître.
// Le code CEFR (A1…C2) reste affiché sur le badge — la pédagogie est inchangée.
export const LEVEL_INFO: Record<Level, { name: string; description: string; gradient: string }> = {
  A1: { name: 'Youngling', description: 'Premiers mots et phrases', gradient: 'from-sky-300 to-cyan-400' },
  A2: { name: 'Padawan', description: 'Communiquer au quotidien', gradient: 'from-cyan-400 to-sky-500' },
  B1: { name: 'Chevalier Jedi', description: 'Devenir autonome', gradient: 'from-emerald-400 to-teal-500' },
  B2: { name: 'Maître Jedi', description: "S'exprimer avec aisance", gradient: 'from-amber-400 to-yellow-500' },
  C1: { name: 'Gardien de la Force', description: 'Nuancer son expression', gradient: 'from-orange-400 to-amber-500' },
  C2: { name: 'Grand Maître', description: 'Comprendre avec précision', gradient: 'from-yellow-400 to-amber-600' },
};

export function lessonsFor(level: Level): Lesson[] {
  const base = [...((CURRICULUM as unknown as Record<Level, readonly Lesson[]>)[level] ?? [])];
  // Fusionne le contenu de compréhension additif (data/comprehension.ts) sans
  // toucher au curriculum : clé `${niveau}:${index}`.
  return base.map((lesson, index) => {
    const extra = COMPREHENSION[`${level}:${index}`];
    return extra ? { ...lesson, comprehension: extra } : lesson;
  });
}

export function sentencesFor(level: Level): Sentence[] {
  return [...((SENTENCES as unknown as Record<Level, readonly Sentence[]>)[level] ?? [])];
}
