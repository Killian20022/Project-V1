import { CURRICULUM } from '../data/curriculum';
import { SENTENCES } from '../data/sentences';
import type { Lesson, Level, Sentence } from '../types';

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const LESSONS_PER_LEVEL = 10;

export const LEVEL_INFO: Record<Level, { name: string; description: string; gradient: string }> = {
  A1: { name: 'Découverte', description: 'Premiers mots et phrases', gradient: 'from-cyan-300 to-sky-400' },
  A2: { name: 'Élémentaire', description: 'Communiquer au quotidien', gradient: 'from-sky-400 to-blue-400' },
  B1: { name: 'Intermédiaire', description: 'Devenir autonome', gradient: 'from-blue-400 to-blue-500' },
  B2: { name: 'Avancé', description: "S'exprimer avec aisance", gradient: 'from-blue-500 to-indigo-500' },
  C1: { name: 'Expert', description: 'Nuancer son expression', gradient: 'from-indigo-500 to-blue-600' },
  C2: { name: 'Maîtrise', description: 'Comprendre avec précision', gradient: 'from-sky-500 to-indigo-600' },
};

export function lessonsFor(level: Level): Lesson[] {
  return [...((CURRICULUM as unknown as Record<Level, readonly Lesson[]>)[level] ?? [])];
}

export function sentencesFor(level: Level): Sentence[] {
  return [...((SENTENCES as unknown as Record<Level, readonly Sentence[]>)[level] ?? [])];
}
