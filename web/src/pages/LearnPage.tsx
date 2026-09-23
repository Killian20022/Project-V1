import { Lock, Check, Play, ChevronLeft, GraduationCap, BookText, Brain, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LEVELS, LEVEL_INFO, lessonCount, lessonsFor } from '@/lib/content';
import { countDue } from '@/lib/srs';
import { Sprite } from '@/components/Sprite';
import { uiUrl } from '@/lib/sprites';
import type { GameState, Lesson, Level } from '../types';

export function LearnPage({
  state,
  selectedLevel,
  onSelectLevel,
  onOpenLesson,
  onReview,
  onBoss,
}: {
  state: GameState;
  selectedLevel: Level | null;
  onSelectLevel: (level: Level | null) => void;
  onOpenLesson: (level: Level, index: number, lesson: Lesson) => void;
  onReview: (level: Level) => void;
  onBoss: (level: Level) => void;
}) {
  if (!selectedLevel) {
    return (
      <div>
        <h1 className="ribbon text-2xl">Les quêtes du royaume</h1>
        <p className="mt-3 text-muted-foreground">Choisis ton rang pour voir ta campagne. Chaque rang est une île de l’archipel.</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((lv) => {
            const total = lessonCount(lv);
            const done = state.lessons[lv] ?? 0;
            const pct = total ? Math.round((Math.min(done, total) / total) * 100) : 0;
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
                    {Math.min(done, total)}/{total} quêtes
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

      <div className="mt-6 space-y-3">
        {lessons.map((lesson, index) => {
          const isDone = index < done;
          const isCurrent = index === done;
          const locked = index > done;
          return (
            <Card
              key={`${selectedLevel}-${index}`}
              className={`transition ${locked ? 'opacity-70 saturate-50' : 'cursor-pointer hover:-translate-y-0.5'} ${
                isCurrent ? 'drop-shadow-[0_0_12px_rgba(247,201,72,0.7)]' : ''
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
                    <span className="text-xs text-muted-foreground">Quête {index + 1}</span>
                  </div>
                  <div className="font-display truncate text-lg">{lesson.title}</div>
                </div>
                {isCurrent && <span className="shrink-0 text-xs font-semibold text-primary">À faire</span>}
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
