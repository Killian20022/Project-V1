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
  // Parties 1 et 2 : le script est porté par l'item lui-même (une photo, un échange de deux
  // répliques). Parties 3, 4, 6 et 7 : il est porté par le `passage` partagé, voir `ToeicPassage`.
  script?: readonly ToeicTurn[];
  passage?: string; // identifiant d'un `ToeicPassage`
  image?: string; // partie 1 : fichier dans public/assets/toeic/
}

/** Une réplique du script audio. `voice` distingue les interlocuteurs d'une conversation. */
export interface ToeicTurn {
  speaker: string; // « Homme », « Femme », « Narrateur » — affiché seulement dans la correction
  text: string;
  voice?: 'A' | 'B' | 'C'; // trois timbres suffisent : la partie 3 monte à trois interlocuteurs
}

/**
 * Le support partagé par plusieurs questions : la conversation des parties 3-4, le texte des
 * parties 6-7. Trois questions sur une même conversation, c'est UN passage et trois `ToeicItem`
 * qui le citent — sinon le script serait recopié trois fois et pourrait diverger.
 */
export interface ToeicPassage {
  id: string;
  kind: 'dialogue' | 'talk' | 'text';
  intro: string; // « Questions 32 à 34 — conversation suivante. » Lu à voix haute en 3-4.
  turns?: readonly ToeicTurn[]; // 3-4 : le script. JAMAIS affiché pendant l'épreuve.
  docs?: readonly { label: string; body: string }[]; // 6-7 : le ou les documents, eux affichés.
}

export interface ToeicSection {
  part: ToeicPart;
  minutes: number;
  items: readonly ToeicItem[];
}

/**
 * Ce que le livret montre VRAIMENT, partie par partie — c'est la différence entre un examen blanc
 * et un QCM déguisé.
 *
 * Aux parties 1 et 2, les propositions ne sont pas imprimées : on les ENTEND, et la feuille de
 * réponses n'offre que des pastilles A/B/C(/D). Afficher leur texte rendrait l'épreuve
 * trivialement plus facile que la vraie et fausserait le score estimé. Aux parties 3 et 4, en
 * revanche, les questions et leurs propositions SONT imprimées (seul le script reste à l'oral) :
 * c'est ce qui permet de lire les questions pendant l'écoute, une stratégie que l'examen assume.
 */
export const PART_DISPLAY: Record<ToeicPart, { stem: boolean; options: boolean; audio: boolean }> = {
  1: { stem: false, options: false, audio: true }, // on ne voit que la photo
  2: { stem: false, options: false, audio: true }, // rien d'imprimé du tout
  3: { stem: true, options: true, audio: true },
  4: { stem: true, options: true, audio: true },
  5: { stem: true, options: true, audio: false },
  6: { stem: true, options: true, audio: false },
  7: { stem: true, options: true, audio: false },
};

/** Les parties 1 à 4 forment la section Listening, les parties 5 à 7 la section Reading. */
export const isListening = (part: ToeicPart): boolean => part <= 4;

export const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Tout ce qui doit être PRONONCÉ pour une question d'écoute, dans l'ordre.
 *
 * Aux parties 1 et 2, les propositions font partie de la bande : elles ne sont pas imprimées, donc
 * si on ne les dit pas, la question est insoluble. On annonce chaque proposition par sa lettre,
 * exactement comme la bande de l'examen, sinon rien ne permet de savoir laquelle on vient
 * d'entendre. Aux parties 3 et 4, au contraire, seules l'annonce et le script se disent : les
 * questions sont sous les yeux du candidat.
 */
export function audioTurnsFor(item: ToeicItem, passage?: ToeicPassage): ToeicTurn[] {
  if (!PART_DISPLAY[item.part].audio) return [];
  const intro =
    passage?.intro ??
    (item.part === 1
      ? 'Look at the picture and choose the statement that best describes it.'
      : 'Listen to the question and choose the best response.');
  const out: ToeicTurn[] = [{ speaker: 'Narrateur', text: intro, voice: 'C' }];
  if (passage?.turns?.length) out.push(...passage.turns);
  // Partie 2 : la question elle-même est orale. Partie 1 : il n'y a pas de question, juste la photo.
  if (item.part === 2) out.push({ speaker: 'Question', text: item.stem, voice: 'A' });
  if (!PART_DISPLAY[item.part].options) {
    item.options.forEach((opt, i) => out.push({ speaker: LETTERS[i], text: `${LETTERS[i]}. ${opt}`, voice: 'B' }));
  }
  return out;
}

/**
 * Identifiant de l'unité d'écoute. Les trois questions d'une même conversation partagent UNE bande :
 * sans cette clé, passer à la question suivante relancerait le script depuis le début, ce qui
 * donnerait trois écoutes au lieu d'une et fausserait complètement l'épreuve.
 */
export function audioUnitOf(item: ToeicItem): string | null {
  return PART_DISPLAY[item.part].audio ? (item.passage ?? item.id) : null;
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

  // Compréhension (parties 1-4 et 7). Les familles ci-dessus sont grammaticales : elles ne disent
  // rien d'une épreuve d'écoute. Un candidat qui rate systématiquement les chiffres n'a pas le même
  // problème que celui qui perd le fil d'une conversation, et le bilan doit les distinguer.
  gist: 'Idée générale (sujet, lieu, intention)',
  detail: 'Détail précis (chiffre, date, nom)',
  inference: 'Déduction (ce qui n’est pas dit explicitement)',
  'speech-act': 'Fonction de l’énoncé (demande, offre, suggestion)',
  'next-action': 'Ce qui va se passer ensuite',
  'photo-description': 'Description d’image',
  'text-structure': 'Cohérence du texte (phrase à insérer)',
  synonym: 'Mot le plus proche en contexte',
  'cross-reference': 'Recoupement entre deux documents',
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

// La section Listening est notée un peu plus généreusement que Reading dans le bas du barème —
// c'est constant d'une session à l'autre, même si les valeurs exactes, elles, varient. Même
// réserve que ci-dessus : approximation assumée, affichée comme telle.
const SCALE_LISTENING: readonly (readonly [number, number])[] = [
  [0, 5], [5, 15], [10, 25], [15, 40], [20, 60], [25, 85], [30, 110], [35, 135], [40, 160],
  [45, 190], [50, 225], [55, 260], [60, 300], [65, 340], [70, 375], [75, 405], [80, 430],
  [85, 455], [90, 475], [95, 490], [100, 495],
];

function interpolate(scale: readonly (readonly [number, number])[], on100: number): number {
  for (let i = 1; i < scale.length; i++) {
    const [x0, y0] = scale[i - 1];
    const [x1, y1] = scale[i];
    if (on100 <= x1) {
      const t = x1 === x0 ? 0 : (on100 - x0) / (x1 - x0);
      return Math.round(y0 + t * (y1 - y0));
    }
  }
  return 495;
}

/**
 * Score estimé sur l'échelle 5–495 d'une section, par interpolation linéaire entre deux paliers.
 * `raw` = bonnes réponses, `outOf` = nombre de questions de la section RÉELLEMENT posées : une
 * banque de 30 items est donc ramenée à l'échelle des 100 questions d'une vraie section.
 */
export function scaledScore(raw: number, outOf: number, section: 'listening' | 'reading' = 'reading'): number {
  if (outOf <= 0) return 5;
  return interpolate(section === 'listening' ? SCALE_LISTENING : SCALE_READING, (raw / outOf) * 100);
}

export interface SectionResult {
  raw: number;
  outOf: number;
  scaled: number;
}

/**
 * Les deux scores de section et leur total sur 990 — la façon dont un score TOEIC se lit
 * réellement. Un seul nombre global masquerait le déséquilibre le plus courant chez un
 * francophone : une compréhension écrite correcte et une écoute en retard de 100 points.
 *
 * Une section ABSENTE de l'épreuve rend `null` plutôt que 5 : une épreuve de lecture seule n'a pas
 * « échoué » l'écoute, elle ne l'a pas passée, et le total ne la compte donc pas.
 */
export function sectionResults(
  items: readonly ToeicItem[],
  answers: readonly (number | null)[],
): { listening: SectionResult | null; reading: SectionResult | null; total: number } {
  const tally = (keep: (p: ToeicPart) => boolean, scale: 'listening' | 'reading'): SectionResult | null => {
    const picked = items.map((it, i) => ({ it, given: answers[i] })).filter((x) => keep(x.it.part));
    if (!picked.length) return null;
    const raw = picked.reduce((n, x) => n + (x.given === x.it.answer ? 1 : 0), 0);
    return { raw, outOf: picked.length, scaled: scaledScore(raw, picked.length, scale) };
  };
  const listening = tally((p) => isListening(p), 'listening');
  const reading = tally((p) => !isListening(p), 'reading');
  return { listening, reading, total: (listening?.scaled ?? 0) + (reading?.scaled ?? 0) };
}

/** Fourchette affichée autour du score estimé : une estimation ne se donne pas au point près. */
export function scoreRange(scaled: number): [number, number] {
  return [Math.max(5, scaled - 25), Math.min(495, scaled + 25)];
}

/**
 * Appréciation adossée au score TOTAL sur 990. Les seuils sont ceux de la correspondance
 * TOEIC → CEFR publiée par ETS, et non une échelle inventée : c'est ce qui permet d'annoncer
 * « viser le B2 » comme objectif de formation, chiffre à l'appui.
 */
export function totalVerdict(total: number): { label: string; cefr: string } {
  if (total >= 945) return { label: 'Maîtrise avancée', cefr: 'C1' };
  if (total >= 785) return { label: 'Autonomie confirmée', cefr: 'B2' };
  if (total >= 550) return { label: 'Autonomie en construction', cefr: 'B1' };
  if (total >= 225) return { label: 'Bases solides', cefr: 'A2' };
  return { label: 'Premiers pas', cefr: 'A1' };
}

/** Appréciation adossée au score d'UNE section (5–495). */
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
export function toQuestion(item: ToeicItem, passage?: ToeicPassage): Question {
  // Sans son support, une question de partie 7 n'a plus de quoi se répondre : l'énoncé demande
  // « what is indicated about the position ? » et le texte qui le dit a disparu. On remet donc le
  // support en tête de l'énoncé — l'entraînement libre n'a pas d'écran dédié.
  //
  // Pour les parties orales, c'est la TRANSCRIPTION qui est fournie : l'entraînement libre devient
  // un exercice de lecture sur un dialogue. C'est assumé — c'est la marche d'avant l'écoute, et
  // l'épreuve chronométrée, elle, ne montre jamais le script.
  const docs = passage?.docs?.map((d) => `— ${d.label} —\n${d.body}`).join('\n\n');
  const script = passage?.turns?.map((t) => `${t.speaker} — ${t.text}`).join('\n');
  const support = docs ?? script;
  return {
    type: 'qcm',
    prompt: support ? `${support}\n\n${item.stem}` : item.stem,
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
