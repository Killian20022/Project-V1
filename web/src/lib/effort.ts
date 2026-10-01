// L'EFFORT D'ANGLAIS — la monnaie unique qui relie ce qu'on apprend à ce qu'on bâtit.
//
// Le royaume ne comptait qu'une chose : les QUÊTES de la campagne. Le vocabulaire, les formules
// et les épreuves blanches ne lui donnaient rien. Conséquence directe : tout le contenu ajouté
// de ce côté-là vivait À CÔTÉ de la boucle qui fait revenir — on pouvait écrire des milliers de
// mots sans que le joueur ait la moindre raison de les travailler.
//
// Désormais toute forme de travail d'anglais fait pousser le royaume, et le cap reste l'examen :
// une épreuve blanche rapporte autant que trois quêtes, parce qu'elle en demande autant.
//
// ⚠ Le total ne peut que MONTER pour une sauvegarde existante : on ajoute des sources, on n'en
// retire aucune. Personne ne perd une île, une levée, ni ne retombe en vassalité.
import { LEVELS, lessonCount } from './content';
import type { GameState } from '../types';

/** Poids de chaque forme de travail, proportionnels au nombre de questions qu'elle demande. */
export const EFFORT = {
  quest: 1, // une quête de campagne : 12 questions
  vocabStep: 1, // un palier de vocabulaire : 10 mots
  formula: 1, // une situation de la section Formules
  drill: 1, // un entraînement de chapitre : 8 questions au format TOEIC
  exam: 3, // une épreuve blanche : 30 questions
} as const;

/** Score minimal d'une épreuve pour qu'elle compte : on récompense le travail, pas le clic. */
export const EXAM_PASS = 0.6;

/** Quêtes de campagne terminées, bornées au nombre de leçons qui existent vraiment. */
export function questsDone(state: GameState): number {
  return LEVELS.reduce((sum, lv) => sum + Math.min(state.lessons[lv] ?? 0, lessonCount(lv)), 0);
}

const countPrefix = (state: GameState, prefix: string) =>
  (state.completed ?? []).filter((id) => id.startsWith(prefix)).length;

/**
 * Épreuves blanches réussies, comptées UNE FOIS PAR ÉPREUVE et non par tentative : sinon on
 * repasserait vingt fois le même test connu par cœur pour ouvrir la carte sans rien apprendre.
 */
export function examsPassed(state: GameState): number {
  const best = new Set<string>();
  for (const a of state.examAttempts ?? []) if (a.raw / Math.max(1, a.total) >= EXAM_PASS) best.add(a.examId);
  return best.size;
}

/** Le détail, pour pouvoir l'AFFICHER : personne ne travaille pour un nombre qu'il ne comprend pas. */
export function effortBreakdown(state: GameState) {
  const quests = questsDone(state);
  const vocab = countPrefix(state, 'voc:');
  const formulas = countPrefix(state, 'biz:');
  // Les entraînements de chapitre sont arrivés avec la campagne tissée (`lib/campaign.ts`). Les
  // compter est conforme à la règle du fichier — on ajoute une source, le total ne peut que monter —
  // et c'est nécessaire : sans ça, soixante-dix étapes de la campagne ne feraient rien pousser, ce
  // qui est exactement le défaut qu'`effort.ts` avait été écrit pour corriger.
  const drills = countPrefix(state, 'drill:');
  const exams = examsPassed(state);
  return {
    quests,
    vocab,
    formulas,
    drills,
    exams,
    total:
      quests * EFFORT.quest +
      vocab * EFFORT.vocabStep +
      formulas * EFFORT.formula +
      drills * EFFORT.drill +
      exams * EFFORT.exam,
  };
}

/** Total des travaux d'anglais : c'est lui qui ouvre les îles, lève le ban et paie la rançon. */
export function englishEffort(state: GameState): number {
  return effortBreakdown(state).total;
}
