import { Dumbbell, GraduationCap, History, Timer, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TOEIC_BANKS, TOEIC_EXAMS } from '@/data/toeic';
import { PART_LABEL, examMinutes, scoreRange, scoreVerdict, totalVerdict } from '@/lib/toeic';
import type { ToeicExam } from '@/lib/toeic';
import type { GameState } from '../types';

function shortDate(ms: number): string {
  return new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * Accueil de la section examens : d'un côté l'épreuve chronométrée, de l'autre l'entraînement
 * libre (même banque, sans chrono, avec correction immédiate — il réutilise le moteur de leçon).
 */
export function ExamHubPage({
  state,
  onStartExam,
  onStartDrill,
}: {
  state: GameState;
  onStartExam: (exam: ToeicExam) => void;
  onStartDrill: (bankId: string) => void;
}) {
  const attempts = state.examAttempts ?? [];
  // Un score sur 990 et un score de section sur 495 ne se comparent PAS : en prendre le maximum
  // commun afficherait « record 430 » sans dire de quoi, et une épreuve complète paraîtrait moins
  // bonne qu'une épreuve de lecture seule. On privilégie donc le total quand il existe, et on
  // affiche toujours son échelle.
  const full = attempts.filter((a) => a.scaledTotal != null && a.listening && a.reading);
  const best = full.length
    ? { value: Math.max(...full.map((a) => a.scaledTotal ?? 0)), outOf: 990 }
    : attempts.length
      ? { value: Math.max(...attempts.map((a) => a.scaled)), outOf: 495 }
      : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#5c3a1f] to-[#2b1a0d] text-white shadow-[0_0_14px_hsl(var(--brand-gold)/0.35)]">
          <GraduationCap />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl text-[#ffe7a6]">Entraînement au format TOEIC®</h1>
          <p className="text-muted-foreground">
            Les mêmes règles qu’à l’examen : chronomètre, aucune correction avant la fin, score estimé à l’arrivée.
          </p>
        </div>
        {best !== null && (
          <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
            <TrendingUp className="size-4" /> record {best.value}
            <span className="font-normal text-muted-foreground">/ {best.outOf}</span>
          </span>
        )}
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Timer className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Épreuves chronométrées</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {TOEIC_EXAMS.map((exam) => {
            const count = exam.sections.reduce((n, s) => n + s.items.length, 0);
            const mine = attempts.filter((a) => a.examId === exam.id);
            return (
              <Card key={exam.id}>
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <div>
                    <h3 className="font-display text-lg text-[#ffe7a6]">{exam.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{exam.blurb}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                    <span className="rounded-full bg-secondary px-2.5 py-1">{count} questions</span>
                    <span className="rounded-full bg-secondary px-2.5 py-1">{examMinutes(exam)} min</span>
                    {exam.sections.map((s) => (
                      <span key={s.part} className="rounded-full bg-secondary px-2.5 py-1">
                        {PART_LABEL[s.part]}
                      </span>
                    ))}
                  </div>
                  {mine.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Déjà passée {mine.length} fois · meilleur : {Math.max(...mine.map((a) => a.raw))}/{mine[0].total}
                    </div>
                  )}
                  <Button className="mt-auto" onClick={() => onStartExam(exam)}>
                    <Timer /> Commencer l’épreuve
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Dumbbell className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Entraînement libre — sans chrono, corrigé au fur et à mesure
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOEIC_BANKS.map((bank) => (
            <Card key={bank.id}>
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {PART_LABEL[bank.part]}
                  </div>
                  <h3 className="font-display text-base text-[#ffe7a6]">{bank.title}</h3>
                </div>
                <span className="text-sm text-muted-foreground">{bank.items.length} questions</span>
                <Button variant="secondary" className="mt-auto" onClick={() => onStartDrill(bank.id)}>
                  <Dumbbell /> S’entraîner
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {attempts.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Historique</h2>
          </div>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {attempts.map((a) => {
                // Même précaution que pour le record : une copie complète se lit sur 990, une
                // épreuve d'une seule section sur 495.
                const complete = a.scaledTotal != null && a.listening && a.reading;
                const [low, high] = complete
                  ? [Math.max(10, (a.scaledTotal ?? 0) - 50), Math.min(990, (a.scaledTotal ?? 0) + 50)]
                  : scoreRange(a.scaled);
                return (
                  <div key={a.at} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                    <span className="w-32 shrink-0 text-muted-foreground">{shortDate(a.at)}</span>
                    <span className="font-semibold">
                      {a.raw}/{a.total}
                    </span>
                    <span className="text-[#ffe7a6]">
                      {low} – {high}
                      <span className="text-muted-foreground"> / {complete ? 990 : 495}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {complete ? totalVerdict(a.scaledTotal ?? 0).label : scoreVerdict(a.scaled).label}
                    </span>
                    <span className="ml-auto text-muted-foreground">
                      {Math.floor(a.seconds / 60)} min {a.seconds % 60} s
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Mention obligatoire : on s'entraîne AU FORMAT d'un examen dont la marque ne nous
          appartient pas. Visible, jamais en tout petit dans un coin. */}
      <p className="mt-10 rounded-md border border-border bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground">
        TOEIC® est une marque déposée d’ETS (Educational Testing Service). Scriptoria n’est ni affilié à ETS, ni
        approuvé ou soutenu par ETS. Toutes les questions proposées ici sont originales : aucune annale officielle n’est
        reproduite. Les scores affichés sont des <strong>estimations</strong> destinées à situer ton niveau.
      </p>
    </div>
  );
}
