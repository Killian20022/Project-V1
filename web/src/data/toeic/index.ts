// Registre des épreuves et des banques d'entraînement au format TOEIC®.
//
// Tout ce qui s'ajoute ici doit passer `bun check-toeic.ts` : c'est le validateur qui garantit
// qu'une banque relue à la main et une banque générée se valent.
import type { ToeicExam, ToeicItem, ToeicPart } from '../../lib/toeic';
import { PART5_BANK_01 } from './part5-01';

/**
 * Une épreuve blanche. Aujourd'hui elle ne contient que la partie 5 — les six autres viendront
 * s'ajouter à `sections` sans rien changer au moteur.
 *
 * Durée : la vraie partie 5 compte 30 questions, et la section Reading entière (parties 5 à 7,
 * soit 100 questions) se joue en 75 minutes. Au rythme de l'examen, 30 questions valent donc
 * ~22 minutes. On arrondit à 23 pour ne pas pénaliser d'une poignée de secondes.
 */
export const TOEIC_EXAMS: readonly ToeicExam[] = [
  {
    id: 'reading-p5-01',
    title: 'Épreuve blanche n°1 — Phrases à compléter',
    blurb: '30 questions chronométrées, au rythme réel de l’examen. Aucune correction avant la fin.',
    sections: [{ part: 5, minutes: 23, items: PART5_BANK_01 }],
  },
];

/** Banques d'entraînement libre, rangées par partie (sans chrono, correction immédiate). */
export const TOEIC_BANKS: readonly { id: string; part: ToeicPart; title: string; items: readonly ToeicItem[] }[] = [
  { id: 'part5-01', part: 5, title: 'Phrases à compléter — banque n°1', items: PART5_BANK_01 },
];

export function examById(id: string): ToeicExam | undefined {
  return TOEIC_EXAMS.find((e) => e.id === id);
}

export function bankById(id: string) {
  return TOEIC_BANKS.find((b) => b.id === id);
}
