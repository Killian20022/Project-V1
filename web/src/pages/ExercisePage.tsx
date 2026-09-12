import { useMemo, useState } from 'react';
import { Heart, Volume2, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { buildQuestions, normalized } from '@/lib/exercises';
import { speak } from '@/lib/speak';
import type { Lesson, Level } from '../types';

const TYPE_LABEL: Record<string, string> = {
  qcm: 'Choix multiple',
  fill: 'Compléter',
  order: 'Remettre en ordre',
  listen: 'Écoute',
  speak: 'Prononciation',
};

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
  const question = questions[position];

  function grade(value: string) {
    if (result !== null) return;
    const success = normalized(value) === normalized(question.answer);
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

  function next() {
    if (hearts <= 0 || position === questions.length - 1) {
      onFinish(correct, questions.length, maxCombo);
      return;
    }
    setPosition((value) => value + 1);
    setAnswer('');
    setOrdered([]);
    setResult(null);
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
            <form
              onSubmit={(event) => {
                event.preventDefault();
                grade(answer);
              }}
              className="space-y-3"
            >
              <input
                className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:border-primary"
                disabled={result !== null}
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Ta réponse…"
                autoFocus
              />
              <Button type="submit" className="w-full" disabled={result !== null}>
                Vérifier
              </Button>
            </form>
          )}

          {question.type === 'order' && (
            <div className="space-y-3">
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
                {question.tokens.map((token, tokenIndex) => (
                  <button
                    key={`${token}-${tokenIndex}`}
                    disabled={result !== null}
                    className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-primary/60 hover:bg-secondary disabled:opacity-50"
                    onClick={() => setOrdered((items) => [...items, token])}
                  >
                    {token}
                  </button>
                ))}
              </div>
              <Button className="w-full" disabled={result !== null} onClick={() => grade(ordered.join(' '))}>
                Vérifier
              </Button>
            </div>
          )}

          {question.type === 'speak' && (
            <div className="space-y-3">
              <div className="rounded-lg bg-secondary p-4 text-center text-lg font-semibold">« {question.answer} »</div>
              <Button variant="outline" onClick={() => speak(question.answer)}>
                <Volume2 /> Écouter le modèle
              </Button>
              <p className="text-sm text-muted-foreground">Prononce la phrase à voix haute, puis indique si tu as réussi.</p>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" disabled={result !== null} onClick={() => grade('')}>
                  À retravailler
                </Button>
                <Button className="flex-1" disabled={result !== null} onClick={() => grade(question.answer)}>
                  J'ai réussi
                </Button>
              </div>
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
