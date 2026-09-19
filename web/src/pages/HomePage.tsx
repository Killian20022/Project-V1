import { Rocket, BookOpen, Sparkles, Target, Brain, Play, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Character } from '@/components/Character';
import { Dogfight } from '@/components/Dogfight';
import { SpaceBackdrop } from '@/components/SpaceBackdrop';
import { LEVELS, LEVEL_INFO, lessonCount, lessonsFor, TOTAL_LESSONS } from '@/lib/content';
import { countDue } from '@/lib/srs';
import type { GameState, Lesson, Level, Page } from '../types';

// Rangs Jedi calculés à partir de l'XP total. Les paliers montent progressivement.
const RANKS: { name: string; min: number }[] = [
  { name: 'Youngling', min: 0 },
  { name: 'Padawan', min: 500 },
  { name: 'Chevalier Jedi', min: 1500 },
  { name: 'Maître Jedi', min: 3500 },
  { name: 'Gardien de la Force', min: 6500 },
  { name: 'Grand Maître', min: 10000 },
];

export function HomePage({
  state,
  navigate,
  openLevel,
  onReview,
  onResume,
}: {
  state: GameState;
  navigate: (page: Page) => void;
  openLevel: (level: Level) => void;
  onReview: () => void;
  onResume: (level: Level, index: number, lesson: Lesson) => void;
}) {
  const lessonsDone = LEVELS.reduce((sum, lv) => sum + Math.min(state.lessons[lv] ?? 0, lessonCount(lv)), 0);
  const totalLessons = TOTAL_LESSONS;
  const dailyGoal = 50;
  const dailyToday = state.dailyDate === new Date().toDateString() ? state.dailyXP : 0;
  const dailyPct = Math.min(100, Math.round((dailyToday / dailyGoal) * 100));
  const due = countDue(state.srs);

  // Prochaine mission à faire : premier niveau non terminé, à sa leçon courante.
  const nextMission = (() => {
    for (const lv of LEVELS) {
      const total = lessonCount(lv);
      const done = state.lessons[lv] ?? 0;
      if (done < total) {
        return { level: lv, index: done, lesson: lessonsFor(lv)[done] };
      }
    }
    return null;
  })();

  // Rang Jedi + progression vers le rang suivant.
  const rankIdx = RANKS.reduce((acc, r, i) => (state.points >= r.min ? i : acc), 0);
  const rank = RANKS[rankIdx];
  const nextRank = RANKS[rankIdx + 1] ?? null;
  const rankPct = nextRank
    ? Math.min(100, Math.round(((state.points - rank.min) / (nextRank.min - rank.min)) * 100))
    : 100;

  return (
    <div className="space-y-8">
      {/* Décor spatial (planètes, étoiles) + combat X-Wing vs TIE en fond de page */}
      <SpaceBackdrop />
      <Dogfight />
      <Card className="overflow-hidden">
        <CardContent className="relative p-8 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3" /> ENTRAÎNE-TOI · MAÎTRISE · TRIOMPHE
          </div>
          <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight md:text-5xl">
            Deviens un maître de{' '}
            <span className="text-glow bg-gradient-to-r from-[#f5c518] via-[#ffe27a] to-[#33ccff] bg-clip-text text-transparent">
              l'anglais
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Des missions courtes, des exercices variés et une galaxie qui grandit avec tes victoires.
            Que la Force (et l'anglais) soit avec toi.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => (nextMission ? onResume(nextMission.level, nextMission.index, nextMission.lesson) : navigate('learn'))}
            >
              <Rocket /> Reprendre la mission
            </Button>
            <Button size="lg" variant={due > 0 ? 'default' : 'outline'} disabled={due === 0} onClick={onReview}>
              <Brain /> {due > 0 ? `Entraînement (${due})` : 'Rien à réviser'}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('dictionary')}>
              <BookOpen /> Archives
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-8">
            <Stat value={state.points} label="XP gagnés" />
            <Stat value={`${lessonsDone}/${totalLessons}`} label="Missions accomplies" />
            <Stat value={state.streak} label="Jours de série" />
          </div>

          {/* Rang Jedi + progression vers le rang suivant */}
          <div className="mt-8 max-w-md">
            <div className="flex items-center gap-2 text-sm">
              <Award className="size-4 text-primary" />
              <span className="font-semibold text-primary">{rank.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {nextRank ? `${state.points} / ${nextRank.min} XP` : 'Rang maximal ⭐'}
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-[#ffe27a] to-accent transition-all"
                style={{ width: `${rankPct}%` }}
              />
            </div>
            {nextRank && (
              <div className="mt-1 text-xs text-muted-foreground">
                Encore {nextRank.min - state.points} XP avant {nextRank.name}
              </div>
            )}
          </div>

          {/* Duel au sabre laser : Luke (vert) face à Dark Vador (rouge), lames qui pulsent */}
          <div className="pointer-events-none absolute bottom-0 right-4 hidden items-end lg:flex">
            <img
              src={`${import.meta.env.BASE_URL}assets/chip_luke.png`}
              alt=""
              className="saber-luke"
              style={{ height: 150, width: 'auto', imageRendering: 'pixelated', transform: 'scaleX(-1)', marginRight: -8 }}
            />
            <img
              src={`${import.meta.env.BASE_URL}assets/chip_vader.png`}
              alt=""
              className="saber-vader"
              style={{ height: 168, width: 'auto', imageRendering: 'pixelated' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reprendre là où tu t'es arrêté */}
      {nextMission ? (
        <Card
          className="cursor-pointer transition hover:-translate-y-0.5 hover:border-primary/60"
          onClick={() => onResume(nextMission.level, nextMission.index, nextMission.lesson)}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${LEVEL_INFO[nextMission.level].gradient} text-white`}
            >
              <Play />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Reprendre · {LEVEL_INFO[nextMission.level].name} · Mission {nextMission.index + 1}
              </div>
              <div className="truncate text-lg font-bold">{nextMission.lesson.title}</div>
              <div className="text-sm text-muted-foreground">
                {nextMission.lesson.t === 'V' ? 'Vocabulaire' : 'Grammaire'}
              </div>
            </div>
            <Button className="ml-auto hidden shrink-0 sm:inline-flex">
              <Rocket /> Continuer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white">
              <Award />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold">Toutes les missions accomplies 🎉</div>
              <div className="text-sm text-muted-foreground">
                Continue à réviser pour garder l'anglais bien affûté, Grand Maître.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="relative grid h-16 w-16 shrink-0 place-items-center">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeDasharray={`${(dailyPct / 100) * 100.5} 100.5`}
                  strokeLinecap="round"
                />
              </svg>
              <Target className="absolute text-primary" />
            </div>
            <div>
              <div className="font-bold">Objectif du jour</div>
              <div className="text-sm text-muted-foreground">
                {dailyToday} / {dailyGoal} XP {dailyPct >= 100 ? '· atteint 🎉' : `· encore ${dailyGoal - dailyToday} XP`}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={due > 0 ? 'cursor-pointer transition hover:border-primary/60' : ''}
          onClick={due > 0 ? onReview : undefined}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary/15">
              <Brain className="text-primary" />
            </div>
            <div>
              <div className="font-bold">Réviser</div>
              <div className="text-sm text-muted-foreground">
                {due > 0
                  ? `${due} carte${due > 1 ? 's' : ''} à revoir aujourd'hui · consolide ta mémoire.`
                  : 'Termine des leçons pour remplir ta pile de révision.'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Choisis ton grade</h2>
          <span className="text-sm text-muted-foreground">Du Youngling au Grand Maître (A1 → C2)</span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((lv) => {
            const total = lessonCount(lv);
            const done = state.lessons[lv] ?? 0;
            const pct = total ? Math.round((Math.min(done, total) / total) * 100) : 0;
            return (
              <Card
                key={lv}
                className="group cursor-pointer transition hover:-translate-y-0.5 hover:border-primary/60"
                onClick={() => openLevel(lv)}
              >
                <CardHeader>
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${LEVEL_INFO[lv].gradient} text-lg font-black text-white`}
                  >
                    {lv}
                  </div>
                  <CardTitle className="mt-2">{LEVEL_INFO[lv].name}</CardTitle>
                  <CardDescription>{LEVEL_INFO[lv].description}</CardDescription>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary via-[#ffe27a] to-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {Math.min(done, total)}/{total} missions
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex origin-bottom scale-[0.62] items-end justify-center gap-2 pt-4 sm:scale-100 sm:gap-5">
        <Character file="chip_stormtrooper.png" size={84} />
        <Character file="chip_stormtrooper.png" size={84} />
        <Character file="chip_vader.png" size={150} />
        <Character file="chip_stormtrooper.png" size={84} flip />
        <Character file="chip_stormtrooper.png" size={84} flip />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
