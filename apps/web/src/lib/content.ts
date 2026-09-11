import { CURRICULUM } from '../data/curriculum';
import { SENTENCES } from '../data/sentences';
import type { Lesson, Level, Sentence } from '../types';

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const LEVEL_INFO: Record<Level, { name: string; description: string; color: string }> = {
  A1: { name: 'Découverte', description: 'Premiers mots et phrases', color: 'lvl-A1' },
  A2: { name: 'Élémentaire', description: 'Communiquer au quotidien', color: 'lvl-A2' },
  B1: { name: 'Intermédiaire', description: 'Devenir autonome', color: 'lvl-B1' },
  B2: { name: 'Avancé', description: 'S’exprimer avec aisance', color: 'lvl-B2' },
  C1: { name: 'Expert', description: 'Nuancer son expression', color: 'lvl-C1' },
  C2: { name: 'Maîtrise', description: 'Comprendre avec précision', color: 'lvl-C2' },
};

export function lessonsFor(level: Level): Lesson[] {
  return [...((CURRICULUM as unknown as Record<Level, readonly Lesson[]>)[level] ?? [])];
}

export function sentencesFor(level: Level): Sentence[] {
  return [...((SENTENCES as unknown as Record<Level, readonly Sentence[]>)[level] ?? [])];
}
