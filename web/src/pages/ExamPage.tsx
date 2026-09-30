import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Flag, Timer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PART_LABEL, allItems, countCorrect, scaledScore, scoreRange, scoreVerdict, tagBreakdown } from '@/lib/toeic';
import type { ToeicExam } from '@/lib/toeic';
import type { ExamAttempt } from '../types';

const LETTER = ['A', 'B', 'C', 'D'];

function clock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Moteur d'épreuve chronométrée. Volontairement séparé d'ExercisePage : les règles d'un examen
 * sont l'inverse de celles d'une leçon — aucune correction avant la fin, pas de cœurs, pas de
 * combo, mais un chrono qui rend la copie tout seul et une navigation libre entre les questions.
 */
export function ExamPage({
  exam,
  onFinish,
  onQuit,
}: {
  exam: ToeicExam;
  onFinish: (attempt: ExamAttempt) => void;
  onQuit: () => void;
}) {
  const items = useMemo(() => allItems(exam), [exam]);
  // Bornes de chaque section dans le tableau à plat : l'épreuve n'en a qu'une aujourd'hui, mais
  // les parties écoute s'ajouteront sans toucher à cette mécanique.
  const bounds = useMemo(() => {
    let start = 0;
    return exam.sections.map((s) => {
      const range = { start, end: start + s.items.length, section: s };
      start = range.end;
      return range;
    });
  }, [exam]);

  const [sectionIdx, setSectionIdx] = useState(0);
  const [position, setPosition] = useState(0); // indice GLOBAL de la question affichée
  const [answers, setAnswers] = useState<(number | null)[]>(() => items.map(() => null));
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [done, setDone] = useState<ExamAttempt | null>(null);
  const [reviewIdx, setReviewIdx] = useState(0);

  const range = bounds[sectionIdx];
  const startedAt = useRef(Date.now());
  const [deadline, setDeadline] = useState(() => Date.now() + bounds[0].section.minutes * 60_000);
  const [now, setNow] = useState(Date.now());

  // Un seul battement par seconde : le chrono se déduit d'un horodatage de fin, jamais d'un
  // compteur décrémenté — sinon un onglet mis en veille « gagnerait » du temps.
  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [done]);

  const remaining = (deadline - now) / 1000;

  const submitRef = useRef<() => void>(() => {});
  submitRef.current = () => {
    const raw = countCorrect(items, answers);
    const scaled = scaledScore(raw, items.length);
    setDone({
      examId: exam.id,
      at: Date.now(),
      raw,
      total: items.length,
      scaled,
      seconds: Math.round((Date.now() - startedAt.current) / 1000),
      answers: [...answers],
    });
  };

  // Temps écoulé : la copie est rendue en l'état, comme au vrai examen.
  useEffect(() => {
    if (done || remaining > 0) return;
    submitRef.current();
  }, [done, remaining]);

  // ---------- Feuille de score ----------
  if (done) {
    const [low, high] = scoreRange(done.scaled);
    const verdict = scoreVerdict(done.scaled);
    const tags = tagBreakdown(items, done.answers);
    const weak = tags.filter((t) => t.correct / t.total < 0.7).slice(0, 4);
    const item = items[reviewIdx];
    const given = done.answers[reviewIdx];

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl text-[#ffe7a6]">Copie rendue</h1>
            <div className="mt-4 text-5xl font-bold text-[hsl(var(--primary))]">
              {done.raw}
              <span className="text-2xl text-muted-foreground">/{done.total}</span>
            </div>
            <div className="mt-4 rounded-lg bg-secondary/60 p-4">
              <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Score estimé</div>
              <div className="text-3xl font-bold text-[#ffe7a6]">
                {low} – {high}
              </div>
              <div className="mt-1 text-sm">
                {verdict.label} · niveau {verdict.cefr}
              </div>
              {/* Dire ce qu'on ne sait pas : la table de conversion officielle n'est pas publiée
                  et varie d'une session à l'autre. Promettre un score exact serait mentir. */}
              <p className="mx-auto mt-2 max-w-md text-[11px] leading-snug text-muted-foreground">
                Estimation. La table de conversion officielle n’est pas publiée et change d’une session à l’autre : ce
                chiffre situe ton niveau, il ne prédit pas ton score exact.
              </p>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              Temps passé : {Math.floor(done.seconds / 60)} min {done.seconds % 60} s
            </div>
          </CardContent>
        </Card>

        {weak.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg text-[#ffe7a6]">À retravailler en priorité</h2>
              <div className="mt-3 space-y-2">
                {weak.map((t) => (
                  <div key={t.tag} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm">{t.label}</span>
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-[hsl(var(--primary))]" style={{ width: `${(t.correct / t.total) * 100}%` }} />
                    </div>
                    <span className="w-12 text-right text-sm font-semibold tabular-nums">
                      {t.correct}/{t.total}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg text-[#ffe7a6]">Correction</h2>
              <span className="text-sm text-muted-foreground">
                Question {reviewIdx + 1} / {items.length}
              </span>
            </div>

            {/* Grille de toutes les questions : vert = juste, rouge = faux. On repère d'un coup d'œil
                où ça a cassé, au lieu de faire défiler. */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {items.map((it, i) => {
                const ok = done.answers[i] === it.answer;
                return (
                  <button
                    key={it.id}
                    onClick={() => setReviewIdx(i)}
                    aria-label={`Question ${i + 1} — ${ok ? 'juste' : 'fausse'}`}
                    className={`h-7 w-7 rounded text-xs font-bold transition ${
                      i === reviewIdx ? 'ring-2 ring-[#ffe7a6]' : ''
                    } ${ok ? 'bg-[#2f6b3a] text-white' : 'bg-[#7a2020] text-white'}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <p className="mt-5 text-lg">{item.stem}</p>
            <div className="mt-3 space-y-2">
              {item.options.map((opt, i) => {
                const isAnswer = i === item.answer;
                const isGiven = i === given;
                return (
                  <div
                    key={opt}
                    className={`flex items-center gap-2 rounded-md border-2 px-3 py-2 text-sm ${
                      isAnswer
                        ? 'border-[#6cbf7a] bg-[#2f6b3a]/25'
                        : isGiven
                          ? 'border-[#e08a7a] bg-[#7a2020]/25'
                          : 'border-border'
                    }`}
                  >
                    <span className="font-bold text-muted-foreground">{LETTER[i]}</span>
                    <span className="flex-1">{opt}</span>
                    {isAnswer && <Check className="size-4 text-[#8cff9e]" />}
                    {isGiven && !isAnswer && <X className="size-4 text-[#ff9a8a]" />}
                  </div>
                );
              })}
            </div>
            {given === null && <p className="mt-2 text-sm text-[#ff9a8a]">Tu n’as pas répondu à cette question.</p>}
            <p className="mt-3 rounded-md bg-secondary/60 p-3 text-sm leading-relaxed">{item.explain}</p>

            <div className="mt-4 flex justify-between gap-2">
              <Button variant="secondary" size="sm" disabled={reviewIdx === 0} onClick={() => setReviewIdx(reviewIdx - 1)}>
                <ArrowLeft /> Précédente
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={reviewIdx === items.length - 1}
                onClick={() => setReviewIdx(reviewIdx + 1)}
              >
                Suivante <ArrowRight />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button onClick={() => onFinish(done)}>Enregistrer et revenir</Button>
        </div>
      </div>
    );
  }

  // ---------- Épreuve en cours ----------
  const item = items[position];
  const answeredInSection = answers.slice(range.start, range.end).filter((a) => a !== null).length;
  const sectionSize = range.end - range.start;
  const lastSection = sectionIdx === bounds.length - 1;
  const urgent = remaining <= 60;

  function choose(i: number) {
    setAnswers((current) => current.map((a, k) => (k === position ? i : a)));
  }

  function toggleFlag() {
    setFlagged((current) => {
      const next = new Set(current);
      if (next.has(position)) next.delete(position);
      else next.add(position);
      return next;
    });
  }

  function nextSection() {
    if (lastSection) return submitRef.current();
    const i = sectionIdx + 1;
    setSectionIdx(i);
    setPosition(bounds[i].start);
    setDeadline(Date.now() + bounds[i].section.minutes * 60_000);
    setConfirmSubmit(false);
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Bandeau d'épreuve : chrono et avancement. Il ne dit JAMAIS si les réponses sont bonnes. */}
      <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onQuit}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
            aria-label="Abandonner l’épreuve"
          >
            <X className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-[#ffe7a6]">{PART_LABEL[range.section.part]}</div>
            <div className="text-[11px] text-muted-foreground">
              {answeredInSection}/{sectionSize} répondues
            </div>
          </div>
          <span
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-bold tabular-nums ${
              urgent ? 'animate-pulse bg-[#7a2020] text-white' : 'bg-secondary'
            }`}
            role="timer"
            aria-live="off"
          >
            <Timer className="size-4" /> {clock(remaining)}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-[hsl(var(--primary))] transition-all"
            style={{ width: `${(answeredInSection / sectionSize) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              Question {position - range.start + 1} / {sectionSize}
            </span>
            <Button
              size="sm"
              variant={flagged.has(position) ? 'default' : 'secondary'}
              onClick={toggleFlag}
              title="Marquer pour y revenir"
            >
              <Flag /> {flagged.has(position) ? 'Marquée' : 'À revoir'}
            </Button>
          </div>

          <p className="mt-4 text-lg leading-relaxed">{item.stem}</p>

          <div className="mt-4 space-y-2">
            {item.options.map((opt, i) => (
              <button
                key={opt}
                onClick={() => choose(i)}
                aria-pressed={answers[position] === i}
                className={`flex w-full items-center gap-3 rounded-md border-2 px-3 py-3 text-left transition ${
                  answers[position] === i
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/15'
                    : 'border-border hover:bg-secondary'
                }`}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold">
                  {LETTER[i]}
                </span>
                <span>{opt}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 flex justify-between gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={position === range.start}
              onClick={() => setPosition(position - 1)}
            >
              <ArrowLeft /> Précédente
            </Button>
            <Button
              size="sm"
              disabled={position === range.end - 1}
              onClick={() => setPosition(position + 1)}
            >
              Suivante <ArrowRight />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grille de navigation : aller n'importe où dans la section, repérer les trous et les
          questions marquées. Aucune couleur ne trahit la justesse — on ne la connaît pas encore. */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Navigation
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: sectionSize }, (_, k) => {
              const g = range.start + k;
              const answered = answers[g] !== null;
              return (
                <button
                  key={g}
                  onClick={() => setPosition(g)}
                  aria-label={`Question ${k + 1}${answered ? ', répondue' : ', sans réponse'}${flagged.has(g) ? ', marquée' : ''}`}
                  className={`relative h-8 w-8 rounded text-xs font-bold transition ${
                    g === position ? 'ring-2 ring-[#ffe7a6]' : ''
                  } ${answered ? 'bg-[hsl(var(--primary))] text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                >
                  {k + 1}
                  {flagged.has(g) && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#ffcf6b]" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-end">
        {confirmSubmit ? (
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <AlertTriangle className="size-4 text-[#ffcf6b]" />
              <span className="text-sm">
                {answeredInSection < sectionSize
                  ? `${sectionSize - answeredInSection} question(s) sans réponse — elles compteront comme fausses.`
                  : 'Rendre la copie ?'}
              </span>
              <Button size="sm" onClick={nextSection}>
                {lastSection ? 'Rendre' : 'Section suivante'}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirmSubmit(false)}>
                Continuer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Button variant="secondary" onClick={() => setConfirmSubmit(true)}>
            {lastSection ? 'Rendre la copie' : 'Terminer la section'}
          </Button>
        )}
      </div>
    </div>
  );
}
