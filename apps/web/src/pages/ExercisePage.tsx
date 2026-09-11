import { useMemo, useState } from 'react';
import { sentencesFor } from '../lib/content';
import type { Lesson, Level, Sentence } from '../types';
import { speak } from './LessonPage';

type Question =
  | { type: 'qcm' | 'listen'; prompt: string; options: string[]; answer: string; explanation: string; audio?: string }
  | { type: 'fill'; prompt: string; answer: string; explanation: string }
  | { type: 'order'; prompt: string; tokens: string[]; answer: string; explanation: string }
  | { type: 'speak'; prompt: string; answer: string; explanation: string };

function shuffle<T>(items: readonly T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function fillQuestion(sentence: Sentence): Question {
  const words = sentence.en.replace(/[.!?]/g, '').split(/\s+/);
  const hint = sentence.hint && words.some(word => word.toLowerCase() === sentence.hint!.toLowerCase()) ? sentence.hint : words[Math.min(1, words.length - 1)];
  return { type: 'fill', prompt: `Complète : ${sentence.en.replace(new RegExp(`\\b${hint}\\b`, 'i'), '___')} (${sentence.fr})`, answer: hint ?? '', explanation: sentence.en };
}

function buildQuestions(level: Level, lesson: Lesson): Question[] {
  const pool = lesson.practice?.length ? [...lesson.practice] : shuffle(sentencesFor(level)).slice(0, 10);
  const questions: Question[] = shuffle(lesson.drills ?? []).slice(0, 4).map(drill => ({ type: 'qcm', prompt: drill.q, options: shuffle(drill.options), answer: drill.answer, explanation: drill.exp ?? drill.answer }));
  const types: Question['type'][] = ['fill', 'order', 'listen', 'qcm', 'speak'];
  shuffle(pool).slice(0, Math.max(0, 10 - questions.length)).forEach((sentence, index) => {
    const type = types[index % types.length];
    if (type === 'fill') questions.push(fillQuestion(sentence));
    else if (type === 'order') questions.push({ type, prompt: `Remets la phrase dans l’ordre : ${sentence.fr}`, tokens: shuffle(sentence.en.split(' ')), answer: sentence.en, explanation: sentence.en });
    else if (type === 'speak') questions.push({ type, prompt: 'Prononce cette phrase', answer: sentence.en, explanation: sentence.fr });
    else {
      const alternatives = shuffle(sentencesFor(level).filter(item => item.en !== sentence.en)).slice(0, 3).map(item => item.en);
      questions.push({ type, prompt: type === 'listen' ? 'Écoute et choisis la bonne phrase' : `Traduis : ${sentence.fr}`, options: shuffle([sentence.en, ...alternatives]), answer: sentence.en, explanation: `${sentence.en} = ${sentence.fr}`, audio: type === 'listen' ? sentence.en : undefined });
    }
  });
  return shuffle(questions).slice(0, 10);
}

function normalized(value: string) {
  return value.toLowerCase().replace(/[.,!?;:'’]/g, '').replace(/\s+/g, ' ').trim();
}

export function ExercisePage({ level, index, lesson, onFinish, onQuit }: { level: Level; index: number; lesson: Lesson; onFinish: (correct: number, total: number) => void; onQuit: () => void }) {
  const questions = useMemo(() => buildQuestions(level, lesson), [level, lesson]);
  const [position, setPosition] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [answer, setAnswer] = useState('');
  const [ordered, setOrdered] = useState<string[]>([]);
  const [result, setResult] = useState<boolean | null>(null);
  const question = questions[position];

  function grade(value: string) {
    if (result !== null) return;
    const success = normalized(value) === normalized(question.answer);
    setAnswer(value);
    setResult(success);
    if (success) setCorrect(count => count + 1);
    else setHearts(count => Math.max(0, count - 1));
  }

  function next() {
    const nextHearts = result === false ? hearts : hearts;
    if (nextHearts <= 0 || position === questions.length - 1) {
      onFinish(correct, questions.length);
      return;
    }
    setPosition(value => value + 1);
    setAnswer(''); setOrdered([]); setResult(null);
  }

  if (!question) return null;
  return <section className="ex-wrap">
    <div className="ex-top"><button className="quiet-button" onClick={onQuit}>Quitter</button><span>{position + 1} / {questions.length}</span><span className="hearts">{'♥'.repeat(hearts)}<span className="lost">{'♥'.repeat(5 - hearts)}</span></span></div>
    <div className="bar"><div className="bar-fill" style={{ width: `${((position + 1) / questions.length) * 100}%` }} /></div>
    <div className="card exercise-card">
      <div className="q-type">{question.type === 'qcm' ? 'Choix multiple' : question.type === 'fill' ? 'Compléter' : question.type === 'order' ? 'Remettre en ordre' : question.type === 'listen' ? 'Écoute' : 'Prononciation'}</div>
      <div className="q-text">{question.prompt}</div>
      {question.type === 'listen' && <button className="audio-btn" onClick={() => speak(question.audio ?? question.answer)}>♪ Écouter</button>}
      {(question.type === 'qcm' || question.type === 'listen') && question.options.map(option => <button disabled={result !== null} className={`opt ${result !== null && option === question.answer ? 'correct' : result === false && option === answer ? 'wrong' : ''}`} key={option} onClick={() => grade(option)}>{option}</button>)}
      {question.type === 'fill' && <form onSubmit={event => { event.preventDefault(); grade(answer); }}><input className="text-input" disabled={result !== null} value={answer} onChange={event => setAnswer(event.target.value)} placeholder="Ta réponse…" /><button className="btn btn-primary full" disabled={result !== null}>Vérifier</button></form>}
      {question.type === 'order' && <><div className="tokens">{ordered.map((token, tokenIndex) => <button className="token placed" key={`${token}-${tokenIndex}`} onClick={() => setOrdered(items => items.filter((_, i) => i !== tokenIndex))}>{token}</button>)}</div><div className="token-bank">{question.tokens.map((token, tokenIndex) => <button className="token" key={`${token}-${tokenIndex}`} disabled={result !== null} onClick={() => setOrdered(items => [...items, token])}>{token}</button>)}</div><button className="btn btn-primary full" disabled={result !== null} onClick={() => grade(ordered.join(' '))}>Vérifier</button></>}
      {question.type === 'speak' && <><div className="speak-target">« {question.answer} »</div><button className="audio-btn" onClick={() => speak(question.answer)}>♪ Écouter le modèle</button><p className="sub compact">Prononce la phrase, puis indique si tu as réussi.</p><div className="answer-actions"><button className="btn btn-ghost" disabled={result !== null} onClick={() => grade('')}>À retravailler</button><button className="btn btn-primary" disabled={result !== null} onClick={() => grade(question.answer)}>J’ai réussi</button></div></>}
      {result !== null && <div className={`feedback show ${result ? 'ok' : 'no'}`}>{result ? '✓ Correct' : '✕ Pas tout à fait'}<br /><strong>{question.explanation}</strong></div>}
      {result !== null && <button className="btn btn-primary full" onClick={next}>{hearts <= 0 || position === questions.length - 1 ? 'Voir le résultat' : 'Continuer →'}</button>}
    </div>
  </section>;
}
