import { sentencesFor } from './content';
import type { Lesson, Level, Sentence } from '../types';

export type Question =
  | { type: 'qcm' | 'listen'; prompt: string; options: string[]; answer: string; explanation: string; audio?: string }
  | { type: 'fill'; prompt: string; fr: string; options: string[]; answer: string; explanation: string }
  | { type: 'order'; prompt: string; tokens: string[]; answer: string; explanation: string }
  | { type: 'dictation'; prompt: string; tokens: string[]; answer: string; explanation: string; audio: string }
  | { type: 'match'; prompt: string; pairs: { en: string; fr: string }[]; explanation: string }
  | { type: 'speak'; prompt: string; answer: string; explanation: string };

export function shuffle<T>(items: readonly T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function words(sentence: string): string[] {
  return sentence.replace(/[.,!?;:'’"]/g, '').split(/\s+/).filter(Boolean);
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

const TOTAL_QUESTIONS = 12;

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

  const types: Question['type'][] = ['fill', 'order', 'dictation', 'listen', 'speak'];
  shuffle(pool)
    .slice(0, Math.max(0, TOTAL_QUESTIONS - questions.length))
    .forEach((sentence, index) => {
      const type = types[index % types.length];
      if (type === 'fill') questions.push(fillQuestion(level, sentence));
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

export function normalized(value: string) {
  return value
    .toLowerCase()
    .replace(/[.,!?;:'’"]/g, '')
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
