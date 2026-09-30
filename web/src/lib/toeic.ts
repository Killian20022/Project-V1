// Entraînement au format TOEIC® — types, barème et bilan.
//
// TOEIC® est une marque déposée d'ETS. Scriptoria n'est ni affilié à ETS ni approuvé par ETS ;
// toutes les questions de cette section sont originales (cf. la mention affichée par ExamHubPage).
//
// Une épreuve N'EST PAS une leçon, et c'est pourquoi elle a son propre moteur (ExamPage) :
//   · chronomètre par section, qui rend la copie tout seul ;
//   · aucune correction avant la fin — donc ni cœurs, ni combo, ni « bonne réponse ! » ;
//   · navigation libre entre les questions, avec marquage « à revoir » ;
//   · un score converti sur l'échelle 5–495, pas un simple nombre de bonnes réponses.
// L'entraînement LIBRE, lui, réutilise tel quel le moteur de leçon (voir `toQuestion`).
import type { Level } from '../types';
import type { Question } from './exercises';
import { shuffle } from './exercises';

/** Les sept parties de l'épreuve Listening & Reading. 1–4 : écoute. 5–7 : lecture. */
export type ToeicPart = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ToeicItem {
  id: string; // 'p5-001' — stable : c'est la clé des statistiques, il ne doit jamais changer
  part: ToeicPart;
  stem: string; // l'énoncé ; en partie 5, la phrase avec ses tirets bas
  options: readonly string[]; // 4 propositions (3 seulement en partie 2)
  answer: number; // indice de la bonne réponse dans `options`
  explain: string; // la correction, en français : c'est là qu'est la valeur pédagogique
  cefr: Level;
  tags: readonly string[]; // clés de `TOEIC_TAGS` — servent au bilan par point faible
  audio?: string; // parties 1–4, plus tard : nom du fichier dans public/audio/toeic/
  image?: string; // partie 1, plus tard
}

export interface ToeicSection {
  part: ToeicPart;
  minutes: number;
  items: readonly ToeicItem[];
}

export interface ToeicExam {
  id: string;
  title: string;
  blurb: string;
  sections: readonly ToeicSection[];
}

/** Libellé officiel de chaque partie, tel qu'il figure au livret. */
export const PART_LABEL: Record<ToeicPart, string> = {
  1: 'Partie 1 · Photographies',
  2: 'Partie 2 · Questions-réponses',
  3: 'Partie 3 · Conversations',
  4: 'Partie 4 · Exposés courts',
  5: 'Partie 5 · Phrases à compléter',
  6: 'Partie 6 · Textes à compléter',
  7: 'Partie 7 · Compréhension écrite',
};

/**
 * Familles de difficulté. Le bilan de fin d'épreuve en tire les points faibles : savoir qu'on a
 * eu 22/30 n'apprend rien, savoir qu'on rate les prépositions et les formes de mot, si.
 * Le validateur (`bun check-toeic.ts`) refuse tout item dont un tag n'est pas listé ici.
 */
export const TOEIC_TAGS: Record<string, string> = {
  'word-form': 'Forme du mot (nom / verbe / adjectif / adverbe)',
  tense: 'Temps et aspect',
  voice: 'Voix passive',
  modal: 'Modaux',
  conditional: 'Conditionnel et hypothèse',
  preposition: 'Prépositions',
  conjunction: 'Conjonctions et connecteurs',
  pronoun: 'Pronoms et déterminants',
  'relative-clause': 'Propositions relatives',
  comparative: 'Comparatifs et superlatifs',
  'verb-pattern': 'Construction verbale (gérondif / infinitif)',
  'subject-verb': 'Accord sujet-verbe',
  quantifier: 'Quantifieurs',
  vocabulary: 'Vocabulaire professionnel',
  collocation: 'Collocations',
  'phrasal-verb': 'Verbes à particule',
};

// ---------- Barème ----------
// Le TOEIC ne publie pas sa table de conversion, et celle-ci change d'une session à l'autre
// (« equating » : une session plus difficile est notée plus généreusement). On ne peut donc PAS
// rendre un score officiel — seulement une ESTIMATION, et l'interface le dit noir sur blanc.
// Table d'approximation usuelle : 100 bonnes réponses ≈ 495, échelle non linéaire aux extrêmes,
// minimum 5 points même à zéro.
const SCALE_READING: readonly (readonly [number, number])[] = [
  [0, 5], [5, 15], [10, 30], [15, 55], [20, 85], [25, 120], [30, 155], [35, 190], [40, 225],
  [45, 260], [50, 295], [55, 325], [60, 355], [65, 385], [70, 410], [75, 430], [80, 450],
  [85, 465], [90, 480], [95, 490], [100, 495],
];

/**
 * Score estimé sur l'échelle 5–495 d'une section, par interpolation linéaire entre deux paliers.
 * `raw` = bonnes réponses, `outOf` = nombre de questions de la section RÉELLEMENT posées : une
 * banque de 30 items est donc ramenée à l'échelle des 100 questions d'une vraie section.
 */
export function scaledScore(raw: number, outOf: number): number {
  if (outOf <= 0) return 5;
  const on100 = (raw / outOf) * 100;
  for (let i = 1; i < SCALE_READING.length; i++) {
    const [x0, y0] = SCALE_READING[i - 1];
    const [x1, y1] = SCALE_READING[i];
    if (on100 <= x1) {
      const t = x1 === x0 ? 0 : (on100 - x0) / (x1 - x0);
      return Math.round(y0 + t * (y1 - y0));
    }
  }
  return 495;
}

/** Fourchette affichée autour du score estimé : une estimation ne se donne pas au point près. */
export function scoreRange(scaled: number): [number, number] {
  return [Math.max(5, scaled - 25), Math.min(495, scaled + 25)];
}

/** Appréciation adossée au score, dans le vocabulaire du royaume. */
export function scoreVerdict(scaled: number): { label: string; cefr: string } {
  if (scaled >= 450) return { label: 'Maîtrise avancée', cefr: 'C1' };
  if (scaled >= 385) return { label: 'Autonomie confirmée', cefr: 'B2' };
  if (scaled >= 275) return { label: 'Autonomie en construction', cefr: 'B1' };
  if (scaled >= 150) return { label: 'Bases solides', cefr: 'A2' };
  return { label: 'Premiers pas', cefr: 'A1' };
}

// ---------- Bilan ----------
export interface TagScore {
  tag: string;
  label: string;
  correct: number;
  total: number;
}

/**
 * Réussite par famille de difficulté, du point le plus faible au plus solide. Un item compte pour
 * chacun de ses tags — une question peut à la fois tester une préposition et une collocation.
 * Les familles vues moins de deux fois sont écartées : un 0/1 ne veut rien dire.
 */
export function tagBreakdown(items: readonly ToeicItem[], answers: readonly (number | null)[]): TagScore[] {
  const acc = new Map<string, { correct: number; total: number }>();
  items.forEach((item, i) => {
    for (const tag of item.tags) {
      const cell = acc.get(tag) ?? { correct: 0, total: 0 };
      cell.total++;
      if (answers[i] === item.answer) cell.correct++;
      acc.set(tag, cell);
    }
  });
  return [...acc.entries()]
    .filter(([, c]) => c.total >= 2)
    .map(([tag, c]) => ({ tag, label: TOEIC_TAGS[tag] ?? tag, correct: c.correct, total: c.total }))
    .sort((a, b) => a.correct / a.total - b.correct / b.total);
}

/** Nombre de bonnes réponses. Une question laissée vide est fausse — comme au vrai examen. */
export function countCorrect(items: readonly ToeicItem[], answers: readonly (number | null)[]): number {
  return items.reduce((n, item, i) => n + (answers[i] === item.answer ? 1 : 0), 0);
}

// ---------- Passerelle vers le moteur de leçon ----------
/**
 * Convertit un item en `Question` du moteur d'exercices existant, pour l'entraînement LIBRE
 * (sans chrono, avec correction immédiate). On réutilise ainsi ExercisePage tel quel plutôt que
 * d'écrire un second écran de QCM.
 *
 * `qcm` compare les réponses par leur TEXTE (cf. `grade` dans ExercisePage), pas par leur indice :
 * on passe donc le libellé, et on peut mélanger les propositions sans rien casser.
 */
export function toQuestion(item: ToeicItem): Question {
  return {
    type: 'qcm',
    prompt: item.stem,
    options: shuffle(item.options),
    answer: item.options[item.answer],
    explanation: item.explain,
  };
}

/** Tous les items d'une épreuve, à plat, dans l'ordre des sections. */
export function allItems(exam: ToeicExam): ToeicItem[] {
  return exam.sections.flatMap((s) => [...s.items]);
}

/** Durée totale de l'épreuve, en minutes. */
export function examMinutes(exam: ToeicExam): number {
  return exam.sections.reduce((n, s) => n + s.minutes, 0);
}
