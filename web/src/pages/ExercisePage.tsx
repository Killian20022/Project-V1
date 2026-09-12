import { useMemo, useState } from 'react';
import { Heart, Volume2, X, ArrowRight, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { buildQuestions, normalized, speechMatches, shuffle } from '@/lib/exercises';
import { speak } from '@/lib/speak';
import type { Lesson, Level } from '../types';

const TYPE_LABEL: Record<string, string> = {
  qcm: 'Choix multiple',
  fill: 'Complète avec le bon mot',
  order: 'Remettre en ordre',
  dictation: 'Dictée',
  listen: 'Écoute',
  match: 'Associe les paires',
  speak: 'Prononciation',
};

// Reconnaissance vocale du navigateur (Chrome/Edge)
const SpeechRec: any =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
    : null;

export function ExercisePage({
  level,
  lesson,
  onFinish,
  onQuit,
}: {
  level: Level;
  index: number;
  lesson: Lesson;
  onFinish: (correct: number, total: number, maxCombo: number) => void;
  onQuit: () => void;
}) {
  const questions = useMemo(() => buildQuestions(level, lesson), [level, lesson]);
  const [position, setPosition] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [answer, setAnswer] = useState('');
  const [ordered, setOrdered] = useState<string[]>([]);
  const [result, setResult] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [matched, setMatched] = useState<string[]>([]);
  const [selEn, setSelEn] = useState<string | null>(null);
  const question = questions[position];

  // Colonne de droite mélangée pour l'exercice d'association (stable par question)
  const rightCol = useMemo(
    () => (question?.type === 'match' ? shuffle(question.pairs.map((p) => p.fr)) : []),
    [position, question],
  );

  function grade(value: string, forceSuccess?: boolean) {
    if (result !== null) return;
    const success = forceSuccess !== undefined ? forceSuccess : normalized(value) === normalized(question.answer);
    setAnswer(value);
    setResult(success);
    if (success) {
      setCorrect((count) => count + 1);
      setCombo((c) => {
        const nextCombo = c + 1;
        setMaxCombo((m) => Math.max(m, nextCombo));
        return nextCombo;
      });
    } else {
      setCombo(0);
      setHearts((count) => Math.max(0, count - 1));
    }
  }

  function listenSpeak() {
    if (!SpeechRec || result !== null || listening) return;
    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    setHeard('');
    setListening(true);
    rec.onresult = (event: any) => {
      const alts: string[] = Array.from(event.results[0]).map((r: any) => r.transcript);
      const said = alts[0] ?? '';
      setHeard(said);
      setListening(false);
      const ok = alts.some((a) => speechMatches(a, question.answer));
      grade(said, ok);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }

  // Association de paires : on choisit une phrase, puis sa traduction
  function tapMatchFr(fr: string) {
    if (result !== null || !selEn || question.type !== 'match') return;
    const pair = question.pairs.find((p) => p.fr === fr);
    if (pair && pair.en === selEn) {
      const nextMatched = [...matched, selEn];
      setMatched(nextMatched);
      setSelEn(null);
      if (nextMatched.length === question.pairs.length) grade('', true);
    } else {
      setSelEn(null);
    }
  }

  function next() {
    if (hearts <= 0 || position === questions.length - 1) {
      onFinish(correct, questions.length, maxCombo);
      return;
    }
    setPosition((value) => value + 1);
    setAnswer('');
    setOrdered([]);
    setResult(null);
    setHeard('');
    setMatched([]);
    setSelEn(null);
  }

  if (!question) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onQuit}>
          <X /> Quitter
        </Button>
        <span className="text-sm text-muted-foreground">
          {position + 1} / {questions.length}
        </span>
        <span className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Heart key={i} className={i < hearts ? 'size-5 fill-red-500 text-red-500' : 'size-5 text-secondary'} />
          ))}
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{ width: `${((position + 1) / questions.length) * 100}%` }}
        />
      </div>

      <Card className="mt-5">
        <CardContent className="space-y-4 p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary">{TYPE_LABEL[question.type]}</div>
          <div className="text-lg font-semibold">{question.prompt}</div>

          {question.type === 'listen' && (
            <Button variant="outline" onClick={() => speak(question.audio ?? question.answer)}>
              <Volume2 /> Écouter
            </Button>
          )}

          {(question.type === 'qcm' || question.type === 'listen') && (
            <div className="grid gap-2">
              {question.options.map((option) => {
                const isAnswer = result !== null && option === question.answer;
                const isWrong = result === false && option === answer;
                return (
                  <button
                    key={option}
                    disabled={result !== null}
                    onClick={() => grade(option)}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      isAnswer
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : isWrong
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-border hover:border-primary/60 hover:bg-secondary'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {question.type === 'fill' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sens : <span className="text-foreground">{question.fr}</span>
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {question.options.map((option) => {
                  const isAnswer = result !== null && normalized(option) === normalized(question.answer);
                  const isWrong = result === false && option === answer;
                  return (
                    <button
                      key={option}
                      disabled={result !== null}
                      onClick={() => grade(option)}
                      className={`rounded-lg border px-4 py-3 text-center font-medium transition ${
                        isAnswer
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : isWrong
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-border hover:border-primary/60 hover:bg-secondary'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(question.type === 'order' || question.type === 'dictation') && (
            <div className="space-y-3">
              {question.type === 'dictation' && (
                <Button variant="outline" onClick={() => speak(question.audio)}>
                  <Volume2 /> Réécouter
                </Button>
              )}
              <div className="flex min-h-12 flex-wrap gap-2 rounded-lg border border-dashed border-border p-2">
                {ordered.map((token, tokenIndex) => (
                  <button
                    key={`${token}-${tokenIndex}`}
                    className="rounded-md bg-primary/20 px-3 py-1.5 text-sm font-medium"
                    onClick={() => setOrdered((items) => items.filter((_, i) => i !== tokenIndex))}
                  >
                    {token}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {question.tokens.map((token, tokenIndex) => {
                  const used = ordered.filter((t) => t === token).length;
                  const total = question.tokens.filter((t) => t === token).length;
                  return (
                    <button
                      key={`${token}-${tokenIndex}`}
                      disabled={result !== null || used >= total}
                      className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-primary/60 hover:bg-secondary disabled:opacity-30"
                      onClick={() => setOrdered((items) => [...items, token])}
                    >
                      {token}
                    </button>
                  );
                })}
              </div>
              <Button className="w-full" disabled={result !== null || !ordered.length} onClick={() => grade(ordered.join(' '))}>
                Vérifier
              </Button>
            </div>
          )}

          {question.type === 'match' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                {question.pairs.map((pair) => {
                  const done = matched.includes(pair.en);
                  const active = selEn === pair.en;
                  return (
                    <button
                      key={pair.en}
                      disabled={done || result !== null}
                      onClick={() => setSelEn(pair.en)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                        done
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : active
                            ? 'border-primary bg-primary/15'
                            : 'border-border hover:border-primary/60 hover:bg-secondary'
                      }`}
                    >
                      {pair.en}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2">
                {rightCol.map((fr) => {
                  const pair = question.pairs.find((p) => p.fr === fr)!;
                  const done = matched.includes(pair.en);
                  return (
                    <button
                      key={fr}
                      disabled={done || result !== null}
                      onClick={() => tapMatchFr(fr)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                        done
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-border hover:border-primary/60 hover:bg-secondary'
                      }`}
                    >
                      {fr}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {question.type === 'speak' && (
            <div className="space-y-3">
              <div className="rounded-lg bg-secondary p-4 text-center text-lg font-semibold">« {question.answer} »</div>
              <Button variant="outline" onClick={() => speak(question.answer)}>
                <Volume2 /> Écouter le modèle
              </Button>
              {SpeechRec ? (
                <>
                  <Button className="w-full" size="lg" disabled={result !== null || listening} onClick={listenSpeak}>
                    <Mic /> {listening ? 'Je t’écoute… parle !' : 'Parler dans le micro'}
                  </Button>
                  {heard && (
                    <p className="text-sm text-muted-foreground">
                      Tu as dit : <span className="text-foreground">« {heard} »</span>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Ton navigateur ne gère pas le micro (essaie Chrome). Prononce la phrase, puis indique si tu as réussi.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="ghost" className="flex-1" disabled={result !== null} onClick={() => grade('', false)}>
                      À retravailler
                    </Button>
                    <Button className="flex-1" disabled={result !== null} onClick={() => grade(question.answer, true)}>
                      J'ai réussi
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {result !== null && (
            <div
              className={`rounded-lg p-4 text-sm ${
                result ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
              }`}
            >
              <div className="font-bold">{result ? '✓ Correct' : '✕ Pas tout à fait'}</div>
              <div className="mt-1 text-foreground">{question.explanation}</div>
            </div>
          )}

          {result !== null && (
            <Button className="w-full" size="lg" onClick={next}>
              {hearts <= 0 || position === questions.length - 1 ? 'Voir le résultat' : 'Continuer'} <ArrowRight />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
