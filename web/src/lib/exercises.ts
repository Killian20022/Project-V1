import { LEVELS, sentencesFor } from './content';
import type { Lesson, Level, Sentence } from '../types';

export type Question =
  | { type: 'qcm' | 'listen'; prompt: string; options: string[]; answer: string; explanation: string; audio?: string }
  | { type: 'fill'; prompt: string; fr: string; options: string[]; answer: string; explanation: string }
  | { type: 'order'; prompt: string; tokens: string[]; answer: string; explanation: string }
  | { type: 'dictation'; prompt: string; tokens: string[]; answer: string; explanation: string; audio: string }
  | { type: 'match'; prompt: string; pairs: { en: string; fr: string }[]; explanation: string }
  | { type: 'speak'; prompt: string; answer: string; explanation: string }
  | { type: 'translate'; prompt: string; direction: 'en2fr' | 'fr2en'; source: string; answer: string; explanation: string };

export function shuffle<T>(items: readonly T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function words(sentence: string): string[] {
  return sentence.replace(/[.,!?;:''"]/g, '').split(/\s+/).filter(Boolean);
}

// Texte à trou : on cache un mot, on montre la traduction, et on propose des mots à choisir → jamais ambigu.
function fillQuestion(level: Level, sentence: Sentence): Question {
  const w = words(sentence.en);
  const hint =
    sentence.hint && w.some((x) => x.toLowerCase() === sentence.hint!.toLowerCase())
      ? w.find((x) => x.toLowerCase() === sentence.hint!.toLowerCase())!
      : w[Math.min(1, w.length - 1)];

  const blanked = sentence.en.replace(new RegExp(`\\b${escapeRegExp(hint)}\\b`), '_____');

  // Distracteurs : d'autres mots du même niveau, plausibles
  const pool = [...new Set(sentencesFor(level).flatMap((s) => words(s.en)))].filter(
    (x) => x.length > 1 && x.toLowerCase() !== hint.toLowerCase(),
  );
  const distractors = shuffle(pool).slice(0, 3);
  const options = shuffle([hint, ...distractors]);

  return {
    type: 'fill',
    prompt: blanked,
    fr: sentence.fr,
    options,
    answer: hint,
    explanation: `${sentence.en} — ${sentence.fr}`,
  };
}

// Traduction libre : on donne la phrase dans une langue, il faut taper l'autre.
// Biais vers fr2en (produire de l'anglais depuis zéro) car c'est la compétence la plus utile ici.
function translateQuestion(sentence: Sentence): Question {
  const direction: 'en2fr' | 'fr2en' = Math.random() < 0.7 ? 'fr2en' : 'en2fr';
  const source = direction === 'fr2en' ? sentence.fr : sentence.en;
  const answer = direction === 'fr2en' ? sentence.en : sentence.fr;
  return {
    type: 'translate',
    prompt: direction === 'fr2en' ? `Traduis en anglais : ${sentence.fr}` : `Traduis en français : ${sentence.en}`,
    direction,
    source,
    answer,
    explanation: `${sentence.en} — ${sentence.fr}`,
  };
}

const TOTAL_QUESTIONS = 12;

// Mélange de types d'exercices selon le niveau : plus de reconnaissance/reconstruction
// en A1-A2, plus de production libre (translate, speak) en C1-C2.
function typeCycleFor(level: Level): Question['type'][] {
  const levelIdx = LEVELS.indexOf(level);
  if (levelIdx <= 1) return ['fill', 'order', 'listen', 'dictation', 'translate', 'speak'];
  if (levelIdx <= 3) return ['fill', 'translate', 'order', 'dictation', 'listen', 'translate', 'speak'];
  return ['translate', 'fill', 'translate', 'order', 'speak', 'dictation', 'listen', 'translate'];
}

// Association de paires (phrase ↔ traduction) — 4 paires, courtes de préférence
function matchQuestion(level: Level, pool: Sentence[]): Question {
  const source = pool.length >= 4 ? pool : sentencesFor(level);
  const short = source.filter((s) => s.en.length <= 36);
  const chosen = shuffle(short.length >= 4 ? short : source).slice(0, 4);
  return {
    type: 'match',
    prompt: 'Associe chaque phrase à sa traduction',
    pairs: chosen.map((s) => ({ en: s.en, fr: s.fr })),
    explanation: 'Toutes les paires étaient correctes. 🎉',
  };
}

export function buildQuestions(level: Level, lesson: Lesson): Question[] {
  const pool = lesson.practice?.length ? [...lesson.practice] : shuffle(sentencesFor(level)).slice(0, TOTAL_QUESTIONS);
  const questions: Question[] = shuffle(lesson.drills ?? [])
    .slice(0, 3)
    .map((drill) => ({
      type: 'qcm' as const,
      prompt: drill.q,
      options: shuffle(drill.options),
      answer: drill.answer,
      explanation: drill.exp ?? drill.answer,
    }));

  // Une association de paires par leçon
  questions.push(matchQuestion(level, pool));

  const types = typeCycleFor(level);
  shuffle(pool)
    .slice(0, Math.max(0, TOTAL_QUESTIONS - questions.length))
    .forEach((sentence, index) => {
      const type = types[index % types.length];
      if (type === 'fill') questions.push(fillQuestion(level, sentence));
      else if (type === 'translate') questions.push(translateQuestion(sentence));
      else if (type === 'order')
        questions.push({
          type,
          prompt: `Remets la phrase dans l'ordre : ${sentence.fr}`,
          tokens: shuffle(sentence.en.split(' ')),
          answer: sentence.en,
          explanation: `${sentence.en} — ${sentence.fr}`,
        });
      else if (type === 'dictation')
        questions.push({
          type,
          prompt: 'Écoute puis reconstitue la phrase',
          tokens: shuffle(sentence.en.split(' ')),
          answer: sentence.en,
          audio: sentence.en,
          explanation: `${sentence.en} — ${sentence.fr}`,
        });
      else if (type === 'speak')
        questions.push({ type, prompt: 'Prononce cette phrase à voix haute', answer: sentence.en, explanation: sentence.fr });
      else {
        const alternatives = shuffle(sentencesFor(level).filter((item) => item.en !== sentence.en))
          .slice(0, 3)
          .map((item) => item.en);
        questions.push({
          type,
          prompt: 'Écoute et choisis la bonne phrase',
          options: shuffle([sentence.en, ...alternatives]),
          answer: sentence.en,
          explanation: `${sentence.en} = ${sentence.fr}`,
          audio: sentence.en,
        });
      }
    });
  return shuffle(questions).slice(0, TOTAL_QUESTIONS);
}

// Construit UNE question de révision à partir d'une carte SRS.
// Le type d'exercice est tiré au hasard (jamais « match » ni « qcm de leçon »,
// qui ne s'appliquent pas à une phrase isolée).
export function buildReviewQuestion(card: { level: Level; en: string; fr: string }): Question {
  const sentence: Sentence = { en: card.en, fr: card.fr };
  const level = card.level;
  const types: Exclude<Question['type'], 'qcm' | 'match'>[] = [
    'fill',
    'order',
    'dictation',
    'listen',
    'speak',
    'translate',
  ];
  const type = types[Math.floor(Math.random() * types.length)];

  if (type === 'fill') return fillQuestion(level, sentence);
  if (type === 'translate') return translateQuestion(sentence);
  if (type === 'order')
    return {
      type: 'order',
      prompt: `Remets la phrase dans l'ordre : ${sentence.fr}`,
      tokens: shuffle(sentence.en.split(' ')),
      answer: sentence.en,
      explanation: `${sentence.en} — ${sentence.fr}`,
    };
  if (type === 'dictation')
    return {
      type: 'dictation',
      prompt: 'Écoute puis reconstitue la phrase',
      tokens: shuffle(sentence.en.split(' ')),
      answer: sentence.en,
      audio: sentence.en,
      explanation: `${sentence.en} — ${sentence.fr}`,
    };
  if (type === 'speak')
    return { type: 'speak', prompt: 'Prononce cette phrase à voix haute', answer: sentence.en, explanation: sentence.fr };

  // listen
  const alternatives = shuffle(sentencesFor(level).filter((item) => item.en !== sentence.en))
    .slice(0, 3)
    .map((item) => item.en);
  return {
    type: 'listen',
    prompt: 'Écoute et choisis la bonne phrase',
    options: shuffle([sentence.en, ...alternatives]),
    answer: sentence.en,
    explanation: `${sentence.en} = ${sentence.fr}`,
    audio: sentence.en,
  };
}

export function normalized(value: string) {
  return value
    .toLowerCase()
    .replace(/[.,!?;:''"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Comparaison souple pour la prononciation (recouvrement de mots)
export function speechMatches(said: string, target: string): boolean {
  const a = normalized(said).split(' ').filter(Boolean);
  const b = normalized(target).split(' ').filter(Boolean);
  if (!a.length) return false;
  if (normalized(said) === normalized(target)) return true;
  const overlap = b.filter((w) => a.includes(w)).length / Math.max(1, b.length);
  return overlap >= 0.7;
}

// Comparaison souple pour la traduction libre (texte tapé, pas de la voix) :
// match exact, sinon recouvrement de mots élevé pour tolérer les variantes valides
// (« I'm happy » vs « I am happy »).
export function translateMatches(said: string, target: string): boolean {
  if (normalized(said) === normalized(target)) return true;
  const a = normalized(said).split(' ').filter(Boolean);
  const b = normalized(target).split(' ').filter(Boolean);
  if (!a.length) return false;
  const overlap = b.filter((w) => a.includes(w)).length / Math.max(1, b.length);
  return b.length <= 6 ? overlap === 1 : overlap >= 0.8;
}
