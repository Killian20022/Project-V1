import { Lock, Check, Play, ChevronLeft, GraduationCap, BookText, Brain, Swords, Briefcase, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useIsDev } from '@/lib/dev';
import { LEVELS, LEVEL_INFO, lessonsFor } from '@/lib/content';
import { chapterProgress, chapterUnlocked, chaptersFor } from '@/lib/campaign';
import type { CampaignStep } from '@/lib/campaign';
import { countDue } from '@/lib/srs';
import { stepDone } from '@/lib/campaign';
import { Sprite } from '@/components/Sprite';
import { uiUrl } from '@/lib/sprites';
import type { GameState, Lesson, Level } from '../types';

/** Pastille d'une étape : sa nature se lit d'un coup d'œil, avant son titre. */
const STEP_BADGE: Record<CampaignStep['kind'], { label: string; Icon: typeof BookText }> = {
  quest: { label: 'Leçon', Icon: GraduationCap },
  vocab: { label: 'Vocabulaire', Icon: BookText },
  toeic: { label: 'Entraînement', Icon: Headphones },
  business: { label: 'Formules', Icon: Briefcase },
};

export function LearnPage({
  state,
  selectedLevel,
  onSelectLevel,
  onOpenLesson,
  onOpenStep,
  onReview,
  onBoss,
}: {
  state: GameState;
  selectedLevel: Level | null;
  onSelectLevel: (level: Level | null) => void;
  onOpenLesson: (level: Level, index: number, lesson: Lesson) => void;
  onOpenStep: (level: Level, step: CampaignStep) => void;
  onReview: (level: Level) => void;
  onBoss: (level: Level) => void;
}) {
  const isDev = useIsDev();
  if (!selectedLevel) {
    return (
      <div>
        <h1 className="ribbon text-2xl">Les quêtes du royaume</h1>
        <p className="mt-3 text-muted-foreground">Choisis ton rang pour voir ta campagne. Chaque rang est une île de l’archipel.</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((lv) => {
            // L'avancement se compte en ÉTAPES et non plus en leçons : un niveau contient désormais
            // ses paliers de vocabulaire et ses entraînements, et n'afficher que les leçons donnerait
            // « 16/16 » à quelqu'un qui n'a fait qu'un sixième du rang.
            const chapters = chaptersFor(lv);
            const steps = chapters.flatMap((c) => c.steps);
            const done = steps.filter((s) => stepDone(state, s, lv)).length;
            const total = steps.length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <Card
                key={lv}
                className="cursor-pointer transition hover:-translate-y-0.5"
                onClick={() => onSelectLevel(lv)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <img src={uiUrl(LEVEL_INFO[lv].avatar)} alt="" className="pixel h-14 w-14" />
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${LEVEL_INFO[lv].gradient} text-sm font-black text-white shadow`}
                    >
                      {lv}
                    </span>
                    <span className="ml-auto text-xs font-semibold text-muted-foreground">{LEVEL_INFO[lv].island}</span>
                  </div>
                  <CardTitle className="mt-2">{LEVEL_INFO[lv].name}</CardTitle>
                  <CardDescription>{LEVEL_INFO[lv].description}</CardDescription>
                  <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full border border-[#3a2412]/40 bg-secondary">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#f7c948] to-[#e08a2e]" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {done}/{total} étapes · {chapters.length} chapitres
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const lessons = lessonsFor(selectedLevel);
  const chapters = chaptersFor(selectedLevel);
  const info = LEVEL_INFO[selectedLevel];
  const dueHere = countDue(state.srs, Date.now(), selectedLevel);

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => onSelectLevel(null)}>
        <ChevronLeft /> Tous les rangs
      </Button>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <img src={uiUrl(info.avatar)} alt="" className="pixel h-16 w-16" />
        <div className="flex-1">
          <h1 className="text-3xl">
            {info.name} <span className="text-lg text-muted-foreground">· {selectedLevel}</span>
          </h1>
          <p className="text-muted-foreground">
            {info.description} · {info.island}
          </p>
        </div>
        {dueHere > 0 && (
          <Button onClick={() => onReview(selectedLevel)}>
            <Brain /> Entraînement ({dueHere})
          </Button>
        )}
        <Button variant="destructive" onClick={() => onBoss(selectedLevel)}>
          <Swords /> Boss du rang
        </Button>
      </div>

      {/* Un chapitre par carte : la leçon, puis ce qui l'ancre. Le chapitre s'ouvre en entier et on
          choisit l'ordre à l'intérieur — ce qui bloque, c'est le passage au chapitre SUIVANT. */}
      <div className="mt-6 space-y-4">
        {chapters.map((chapter, ci) => {
          const unlocked = isDev || chapterUnlocked(state, chapters, ci);
          const { done: cd, total: ct } = chapterProgress(state, chapter);
          const complete = cd === ct;
          const current = unlocked && !complete;
          return (
            <Card
              key={chapter.id}
              className={`transition ${unlocked ? '' : 'opacity-60 saturate-50'} ${
                current ? 'drop-shadow-[0_0_12px_rgba(247,201,72,0.55)]' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                      complete ? 'bg-primary text-primary-foreground' : unlocked ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {complete ? <Check /> : unlocked ? <span className="text-sm font-bold">{ci + 1}</span> : <Lock className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display truncate text-lg">{chapter.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{chapter.blurb}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold tabular-nums">
                      {cd}/{ct}
                    </div>
                    <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-[hsl(var(--primary))]" style={{ width: `${(cd / ct) * 100}%` }} />
                    </div>
                  </div>
                </div>

                {unlocked ? (
                  <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {chapter.steps.map((step) => {
                      const sd = stepDone(state, step, selectedLevel);
                      const { label, Icon } = STEP_BADGE[step.kind];
                      return (
                        <button
                          key={step.id}
                          onClick={() => {
                            if (step.kind === 'quest' && step.lessonIndex !== undefined)
                              onOpenLesson(selectedLevel, step.lessonIndex, lessons[step.lessonIndex]);
                            else onOpenStep(selectedLevel, step);
                          }}
                          className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-left transition hover:bg-secondary ${
                            sd ? 'border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/10' : 'border-border'
                          }`}
                        >
                          <span className={`shrink-0 ${sd ? 'text-[hsl(var(--primary))]' : 'text-muted-foreground'}`}>
                            {sd ? <Check className="size-4" /> : <Icon className="size-4" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm">{step.label}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {label} · {step.detail}
                            </span>
                          </span>
                          {!sd && <Play className="size-3.5 shrink-0 text-muted-foreground" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Termine le chapitre précédent pour ouvrir celui-ci.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-end justify-center gap-2 pb-6 pt-8">
        <Sprite k="villageois" height={80} crop={0.2} />
        <Sprite k="guerrier" height={100} crop={0.2} />
        <Sprite k="mouton" height={60} crop={0.15} flip />
      </div>
    </div>
  );
}
