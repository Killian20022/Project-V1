import { Rocket, BookOpen, Sparkles, Target, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LEVELS, LEVEL_INFO, LESSONS_PER_LEVEL } from '@/lib/content';
import type { GameState, Level, Page } from '../types';

export function HomePage({
  state,
  navigate,
  openLevel,
}: {
  state: GameState;
  navigate: (page: Page) => void;
  openLevel: (level: Level) => void;
}) {
  const lessonsDone = LEVELS.reduce((sum, lv) => sum + (state.lessons[lv] ?? 0), 0);
  const totalLessons = LEVELS.length * LESSONS_PER_LEVEL;
  const dailyGoal = 50;
  const dailyToday = state.dailyDate === new Date().toDateString() ? state.dailyXP : 0;
  const dailyPct = Math.min(100, Math.round((dailyToday / dailyGoal) * 100));

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardContent className="relative p-8 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3" /> APPRENDS · PRATIQUE · PROGRESSE
          </div>
          <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight md:text-5xl">
            Ton aventure vers un anglais{' '}
            <span className="text-glow bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-400 bg-clip-text text-transparent">
              sans limites
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Des leçons courtes, des exercices variés et une île qui grandit avec tes progrès.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('learn')}>
              <Rocket /> Continuer mon parcours
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('dictionary')}>
              <BookOpen /> Dictionnaire
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-8">
            <Stat value={state.points} label="XP gagnés" />
            <Stat value={`${lessonsDone}/${totalLessons}`} label="Leçons terminées" />
            <Stat value={state.streak} label="Jours de série" />
          </div>
        </CardContent>
      </Card>

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
        <Card className="cursor-pointer transition hover:border-primary/60" onClick={() => navigate('learn')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary/15">
              <Flame className="text-orange-400" />
            </div>
            <div>
              <div className="font-bold">Reprendre</div>
              <div className="text-sm text-muted-foreground">Continue à ton rythme, une leçon à la fois.</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Choisis ton niveau</h2>
          <span className="text-sm text-muted-foreground">Du premier mot jusqu'à la maîtrise (A1 → C2)</span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((lv) => {
            const done = state.lessons[lv] ?? 0;
            const pct = Math.round((done / LESSONS_PER_LEVEL) * 100);
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
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {done}/{LESSONS_PER_LEVEL} leçons
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
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
