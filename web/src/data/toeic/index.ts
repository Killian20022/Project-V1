// Registre des épreuves, des banques et des supports au format TOEIC®.
//
// Tout ce qui s'ajoute ici doit passer `bun check-toeic.ts` : c'est le validateur qui garantit
// qu'une banque relue à la main et une banque générée se valent.
import { isListening } from '../../lib/toeic';
import type { ToeicExam, ToeicItem, ToeicPart, ToeicPassage } from '../../lib/toeic';
import { PART1_BANK_01 } from './part1-01';
import { PART2_BANK_01 } from './part2-01';
import { PART2_BANK_02 } from './part2-02';
import { PART3_BANK_01, PART3_PASSAGES_01 } from './part3-01';
import { PART3_BANK_02, PART3_PASSAGES_02 } from './part3-02';
import { PART3_BANK_03, PART3_PASSAGES_03 } from './part3-03';
import { PART4_BANK_01, PART4_PASSAGES_01 } from './part4-01';
import { PART4_BANK_02, PART4_PASSAGES_02 } from './part4-02';
import { PART4_BANK_03, PART4_PASSAGES_03 } from './part4-03';
import { PART5_BANK_01 } from './part5-01';
import { PART6_BANK_01, PART6_PASSAGES_01 } from './part6-01';
import { PART6_BANK_02, PART6_PASSAGES_02 } from './part6-02';
import { PART7_BANK_01, PART7_PASSAGES_01 } from './part7-01';
import { PART7_BANK_02, PART7_PASSAGES_02 } from './part7-02';
import { PART7_BANK_03, PART7_PASSAGES_03 } from './part7-03';
import { PART7_BANK_04, PART7_PASSAGES_04 } from './part7-04';

// ── Partie 1 ───────────────────────────────────────────────────────────────
// Active depuis que les six scènes existent (`bun gen-toeic-scenes.ts` → `public/assets/toeic/`).
// Le drapeau reste : il suffit de le repasser à `false` pour retirer la partie 1 des épreuves si
// les images venaient à manquer — les sections et le barème s'ajustent seuls, rien d'autre à
// toucher. Six cadres cassés seraient pires que six questions en moins.
//
// Annoté `: boolean` et non laissé à l'inférence : sans ça TypeScript fige le type sur la valeur
// littérale et déclare morte la branche opposée.
const PART1_READY: boolean = true;

/**
 * Les supports partagés : conversations et exposés des parties 3-4, documents des parties 6-7.
 * Plusieurs questions citent le même support par son identifiant, de sorte qu'un script n'existe
 * qu'à UN endroit — le recopier sous chaque question le ferait fatalement diverger.
 */
export const TOEIC_PASSAGES: readonly ToeicPassage[] = [
  ...PART3_PASSAGES_01,
  ...PART3_PASSAGES_02,
  ...PART3_PASSAGES_03,
  ...PART4_PASSAGES_01,
  ...PART4_PASSAGES_02,
  ...PART4_PASSAGES_03,
  ...PART6_PASSAGES_01,
  ...PART6_PASSAGES_02,
  ...PART7_PASSAGES_01,
  ...PART7_PASSAGES_02,
  ...PART7_PASSAGES_03,
  ...PART7_PASSAGES_04,
];

const PASSAGE_BY_ID = new Map(TOEIC_PASSAGES.map((p) => [p.id, p]));

export function passageById(id: string | undefined): ToeicPassage | undefined {
  return id ? PASSAGE_BY_ID.get(id) : undefined;
}

// ── Les items d'une partie, toutes banques confondues ──────────────────────
// L'ÉPREUVE prend la partie entière ; l'entraînement libre garde les banques séparées, pour qu'une
// séance reste courte et qu'on puisse en refaire une sur des questions neuves.
const ITEMS: Record<ToeicPart, readonly ToeicItem[]> = {
  1: PART1_BANK_01,
  2: [...PART2_BANK_01, ...PART2_BANK_02],
  3: [...PART3_BANK_01, ...PART3_BANK_02, ...PART3_BANK_03],
  4: [...PART4_BANK_01, ...PART4_BANK_02, ...PART4_BANK_03],
  5: PART5_BANK_01,
  6: [...PART6_BANK_01, ...PART6_BANK_02],
  7: [...PART7_BANK_01, ...PART7_BANK_02, ...PART7_BANK_03, ...PART7_BANK_04],
};

/**
 * Minutes par question AU VRAI EXAMEN, partie par partie.
 *
 * Lecture : 75 minutes pour les 100 questions des parties 5 à 7, soit 0,75 — un chiffre officiel,
 * qui inclut déjà le temps de lire les documents. On l'applique tel quel aux trois parties, si bien
 * que notre section Lecture dure exactement 75 minutes elle aussi.
 *
 * Écoute : la durée n'y est pas un budget mais la longueur de la bande. 100 questions en 45 minutes,
 * réparties selon la longueur réelle de chaque partie — une photographie se traite en une demi-
 * minute, un exposé de la partie 4 en prend le double.
 */
const PACE: Record<ToeicPart, number> = { 1: 0.5, 2: 0.36, 3: 0.44, 4: 0.5, 5: 0.75, 6: 0.75, 7: 0.75 };

/**
 * Majoration appliquée aux SEULES parties orales.
 *
 * La bande de l'examen est un enregistrement calibré ; ici c'est la voix de synthèse du navigateur,
 * dont le débit varie d'une machine à l'autre et qui marque des pauses plus longues entre les
 * répliques. Une voix lente ne doit pas coûter de points, d'où ce quart de temps en plus — annoncé
 * ici plutôt que fondu dans des cadences bricolées, pour qu'on sache toujours de combien on s'écarte
 * du vrai examen et pourquoi.
 */
const TTS_ALLOWANCE = 1.25;

function sectionOf(part: ToeicPart) {
  const rate = PACE[part] * (isListening(part) ? TTS_ALLOWANCE : 1);
  return { part, minutes: Math.ceil(ITEMS[part].length * rate), items: ITEMS[part] };
}

const LISTENING_SECTIONS = [...(PART1_READY ? [sectionOf(1)] : []), sectionOf(2), sectionOf(3), sectionOf(4)];
const READING_SECTIONS = [sectionOf(5), sectionOf(6), sectionOf(7)];

export const TOEIC_EXAMS: readonly ToeicExam[] = [
  {
    id: 'full-01',
    title: 'Épreuve blanche n°1 — Écoute & Lecture',
    blurb:
      'Les deux sections dans l’ordre de l’examen, chacune chronométrée. Un score estimé par section, puis le total sur 990.',
    sections: [...LISTENING_SECTIONS, ...READING_SECTIONS],
  },
  // L'épreuve de lecture seule est CONSERVÉE : des tentatives enregistrées portent déjà son
  // identifiant (`ExamAttempt.examId`), et elle reste la bonne porte d'entrée pour qui veut
  // travailler la partie 5 sans y passer une heure et demie.
  {
    id: 'reading-p5-01',
    title: 'Épreuve courte — Phrases à compléter',
    blurb: '30 questions chronométrées, au rythme réel de l’examen. Aucune correction avant la fin.',
    sections: [sectionOf(5)],
  },
  {
    id: 'listening-01',
    title: 'Épreuve courte — Section Écoute',
    blurb: 'Les parties orales seules, lues par la voix de ton navigateur. Chaque enregistrement ne passe qu’une fois.',
    sections: LISTENING_SECTIONS,
  },
  {
    id: 'reading-01',
    title: 'Épreuve courte — Section Lecture',
    blurb: 'Les parties 5 à 7 enchaînées, documents compris. Le pendant écrit de l’épreuve d’écoute.',
    sections: READING_SECTIONS,
  },
];

/**
 * Banques d'entraînement libre, rangées par partie (sans chrono, correction immédiate).
 *
 * Les parties orales y sont jouées AVEC leur transcription sous les yeux (cf. `toQuestion`) : sans
 * elle, la question n'aurait aucun support et serait indevinable. C'est la marche d'avant
 * l'écoute, et le titre le dit — la vraie écoute, elle, est dans les épreuves chronométrées.
 */
export const TOEIC_BANKS: readonly { id: string; part: ToeicPart; title: string; items: readonly ToeicItem[] }[] = [
  ...(PART1_READY ? [{ id: 'part1-01', part: 1 as ToeicPart, title: 'Photographies — banque n°1', items: PART1_BANK_01 }] : []),
  { id: 'part2-01', part: 2, title: 'Questions-réponses — à l’écrit, n°1', items: PART2_BANK_01 },
  { id: 'part2-02', part: 2, title: 'Questions-réponses — à l’écrit, n°2', items: PART2_BANK_02 },
  { id: 'part3-01', part: 3, title: 'Conversations — avec transcription, n°1', items: PART3_BANK_01 },
  { id: 'part3-02', part: 3, title: 'Conversations — avec transcription, n°2', items: PART3_BANK_02 },
  { id: 'part3-03', part: 3, title: 'Conversations — avec transcription, n°3', items: PART3_BANK_03 },
  { id: 'part4-01', part: 4, title: 'Exposés courts — avec transcription, n°1', items: PART4_BANK_01 },
  { id: 'part4-02', part: 4, title: 'Exposés courts — avec transcription, n°2', items: PART4_BANK_02 },
  { id: 'part4-03', part: 4, title: 'Exposés courts — avec transcription, n°3', items: PART4_BANK_03 },
  { id: 'part5-01', part: 5, title: 'Phrases à compléter — banque n°1', items: PART5_BANK_01 },
  { id: 'part6-01', part: 6, title: 'Textes à compléter — banque n°1', items: PART6_BANK_01 },
  { id: 'part6-02', part: 6, title: 'Textes à compléter — banque n°2', items: PART6_BANK_02 },
  { id: 'part7-01', part: 7, title: 'Compréhension écrite — banque n°1', items: PART7_BANK_01 },
  { id: 'part7-02', part: 7, title: 'Compréhension écrite — banque n°2', items: PART7_BANK_02 },
  { id: 'part7-03', part: 7, title: 'Compréhension écrite — banque n°3', items: PART7_BANK_03 },
  { id: 'part7-04', part: 7, title: 'Compréhension écrite — banque n°4', items: PART7_BANK_04 },
];

export function examById(id: string): ToeicExam | undefined {
  return TOEIC_EXAMS.find((e) => e.id === id);
}

export function bankById(id: string) {
  return TOEIC_BANKS.find((b) => b.id === id);
}
