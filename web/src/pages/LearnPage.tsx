import { Lock, Check, Play, ChevronLeft, GraduationCap, BookText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LEVELS, LEVEL_INFO, LESSONS_PER_LEVEL, lessonsFor } from '@/lib/content';
import type { GameState, Lesson, Level } from '../types';

export function LearnPage({
  state,
  selectedLevel,
  onSelectLevel,
  onOpenLesson,
}: {
  state: GameState;
  selectedLevel: Level | null;
  onSelectLevel: (level: Level | null) => void;
  onOpenLesson: (level: Level, index: number, lesson: Lesson) => void;
}) {
  if (!selectedLevel) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Apprendre</h1>
        <p className="text-muted-foreground">Choisis un niveau pour voir ton parcours de 10 leçons.</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((lv) => {
            const done = state.lessons[lv] ?? 0;
            const pct = Math.round((done / LESSONS_PER_LEVEL) * 100);
            return (
              <Card
                key={lv}
                className="cursor-pointer transition hover:-translate-y-0.5 hover:border-primary/60"
                onClick={() => onSelectLevel(lv)}
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
    );
  }

  const lessons = lessonsFor(selectedLevel);
  const done = state.lessons[selectedLevel] ?? 0;
  const info = LEVEL_INFO[selectedLevel];

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => onSelectLevel(null)}>
        <ChevronLeft /> Tous les niveaux
      </Button>
      <div className="mt-3 flex items-center gap-4">
        <div className={`grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br ${info.gradient} text-xl font-black text-white`}>
          {selectedLevel}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{info.name}</h1>
          <p className="text-muted-foreground">{info.description}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {lessons.map((lesson, index) => {
          const isDone = index < done;
          const isCurrent = index === done;
          const locked = index > done;
          return (
            <Card
              key={`${selectedLevel}-${index}`}
              className={`transition ${locked ? 'opacity-60' : 'cursor-pointer hover:border-primary/60'} ${
                isCurrent ? 'border-primary/70 ring-1 ring-primary/40' : ''
              }`}
              onClick={() => {
                if (!locked) onOpenLesson(selectedLevel, index, lesson);
              }}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
                    isDone ? 'bg-primary text-primary-foreground' : locked ? 'bg-secondary text-muted-foreground' : 'bg-primary/20 text-primary'
                  }`}
                >
                  {isDone ? <Check /> : locked ? <Lock /> : <Play />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {lesson.t === 'V' ? <BookText className="size-3" /> : <GraduationCap className="size-3" />}
                      {lesson.t === 'V' ? 'Vocabulaire' : 'Grammaire'}
                    </span>
                    <span className="text-xs text-muted-foreground">Leçon {index + 1}</span>
                  </div>
                  <div className="truncate font-semibold">{lesson.title}</div>
                </div>
                {isCurrent && <span className="shrink-0 text-xs font-semibold text-primary">À faire</span>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
