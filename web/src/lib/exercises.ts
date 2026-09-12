import { sentencesFor } from './content';
import type { Lesson, Level, Sentence } from '../types';

export type Question =
  | { type: 'qcm' | 'listen'; prompt: string; options: string[]; answer: string; explanation: string; audio?: string }
  | { type: 'fill'; prompt: string; answer: string; explanation: string }
  | { type: 'order'; prompt: string; tokens: string[]; answer: string; explanation: string }
  | { type: 'speak'; prompt: string; answer: string; explanation: string };

export function shuffle<T>(items: readonly T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function fillQuestion(sentence: Sentence): Question {
  const words = sentence.en.replace(/[.!?]/g, '').split(/\s+/);
  const hint =
    sentence.hint && words.some((word) => word.toLowerCase() === sentence.hint!.toLowerCase())
      ? sentence.hint
      : words[Math.min(1, words.length - 1)];
  return {
    type: 'fill',
    prompt: `${sentence.en.replace(new RegExp(`\\b${hint}\\b`, 'i'), '_____')}`,
    answer: hint ?? '',
    explanation: `${sentence.en} — ${sentence.fr}`,
  };
}

export function buildQuestions(level: Level, lesson: Lesson): Question[] {
  const pool = lesson.practice?.length ? [...lesson.practice] : shuffle(sentencesFor(level)).slice(0, 10);
  const questions: Question[] = shuffle(lesson.drills ?? [])
    .slice(0, 4)
    .map((drill) => ({
      type: 'qcm' as const,
      prompt: drill.q,
      options: shuffle(drill.options),
      answer: drill.answer,
      explanation: drill.exp ?? drill.answer,
    }));
  const types: Question['type'][] = ['fill', 'order', 'listen', 'qcm', 'speak'];
  shuffle(pool)
    .slice(0, Math.max(0, 10 - questions.length))
    .forEach((sentence, index) => {
      const type = types[index % types.length];
      if (type === 'fill') questions.push(fillQuestion(sentence));
      else if (type === 'order')
        questions.push({
          type,
          prompt: `Remets la phrase dans l'ordre : ${sentence.fr}`,
          tokens: shuffle(sentence.en.split(' ')),
          answer: sentence.en,
          explanation: sentence.en,
        });
      else if (type === 'speak')
        questions.push({ type, prompt: 'Prononce cette phrase', answer: sentence.en, explanation: sentence.fr });
      else {
        const alternatives = shuffle(sentencesFor(level).filter((item) => item.en !== sentence.en))
          .slice(0, 3)
          .map((item) => item.en);
        questions.push({
          type,
          prompt: type === 'listen' ? 'Écoute et choisis la bonne phrase' : `Traduis : ${sentence.fr}`,
          options: shuffle([sentence.en, ...alternatives]),
          answer: sentence.en,
          explanation: `${sentence.en} = ${sentence.fr}`,
          audio: type === 'listen' ? sentence.en : undefined,
        });
      }
    });
  return shuffle(questions).slice(0, 10);
}

export function normalized(value: string) {
  return value
    .toLowerCase()
    .replace(/[.,!?;:'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
