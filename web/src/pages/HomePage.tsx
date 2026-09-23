import { Swords, BookOpen, Brain, Play, ScrollText, Target, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sprite } from '@/components/Sprite';
import { RankMap } from '@/components/RankMap';
import { LEVELS, LEVEL_INFO, lessonCount, lessonsFor, TOTAL_LESSONS } from '@/lib/content';
import { countDue } from '@/lib/srs';
import { uiUrl } from '@/lib/sprites';
import type { GameState, Lesson, Level, Page } from '../types';

// Titres de noblesse calculés à partir de l'XP total.
export const RANKS: { name: string; min: number; avatar: string }[] = [
  { name: 'Paysan', min: 0, avatar: 'avatars_05.png' },
  { name: 'Écuyer', min: 500, avatar: 'avatars_04.png' },
  { name: 'Homme d’armes', min: 1500, avatar: 'avatars_02.png' },
  { name: 'Chevalier', min: 3500, avatar: 'avatars_01.png' },
  { name: 'Seigneur', min: 6500, avatar: 'avatars_11.png' },
  { name: 'Légende du royaume', min: 10000, avatar: 'avatars_16.png' },
];

export function HomePage({
  state,
  navigate,
  openLevel,
  onReview,
  onResume,
  onStartBoss,
}: {
  state: GameState;
  navigate: (page: Page) => void;
  openLevel: (level: Level) => void;
  onReview: () => void;
  onResume: (level: Level, index: number, lesson: Lesson) => void;
  onStartBoss: (level: Level) => void;
}) {
  const lessonsDone = LEVELS.reduce((sum, lv) => sum + Math.min(state.lessons[lv] ?? 0, lessonCount(lv)), 0);
  const dailyGoal = 50;
  const dailyToday = state.dailyDate === new Date().toDateString() ? state.dailyXP : 0;
  const dailyPct = Math.min(100, Math.round((dailyToday / dailyGoal) * 100));
  const due = countDue(state.srs);

  // Boss à affronter : le rang le plus avancé déjà entamé (sinon le premier).
  const bossLevel: Level = [...LEVELS].reverse().find((lv) => (state.lessons[lv] ?? 0) > 0) ?? 'A1';

  // Prochaine quête : premier rang non terminé, à sa leçon courante.
  const nextQuest = (() => {
    for (const lv of LEVELS) {
      const total = lessonCount(lv);
      const done = state.lessons[lv] ?? 0;
      if (done < total) return { level: lv, index: done, lesson: lessonsFor(lv)[done] };
    }
    return null;
  })();

  const rankIdx = RANKS.reduce((acc, r, i) => (state.points >= r.min ? i : acc), 0);
  const rank = RANKS[rankIdx];
  const nextRank = RANKS[rankIdx + 1] ?? null;
  const rankPct = nextRank
    ? Math.min(100, Math.round(((state.points - rank.min) / (nextRank.min - rank.min)) * 100))
    : 100;

  return (
    <div className="space-y-8">
      {/* Bannière d'accueil */}
      <Card className="overflow-hidden">
        <CardContent className="relative p-6 md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--foreground)/0.08)] px-3 py-1 text-xs font-bold tracking-wide">
            <Swords className="size-3.5" /> APPRENDS · COMBATS · RÈGNE
          </div>
          <h1 className="mt-4 max-w-2xl text-4xl leading-tight md:text-5xl">
            Forge ton anglais, <span className="text-[hsl(var(--accent))]">conquiers le royaume</span>
          </h1>
          <p className="mt-3 max-w-xl text-[hsl(var(--muted-foreground))]">
            Des quêtes courtes, des duels contre les chevaliers noirs et un archipel qui s’agrandit à chaque victoire.
            Gagne de l’or, recrute ton armée, bâtis ton village.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => (nextQuest ? onResume(nextQuest.level, nextQuest.index, nextQuest.lesson) : navigate('learn'))}
            >
              <Play /> Reprendre la quête
            </Button>
            <Button size="lg" variant={due > 0 ? 'secondary' : 'outline'} disabled={due === 0} onClick={onReview}>
              <Brain /> {due > 0 ? `Entraînement (${due})` : 'Rien à réviser'}
            </Button>
            <Button size="lg" variant="destructive" onClick={() => onStartBoss(bossLevel)}>
              <Swords /> Duel contre le boss
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('island')}>
              <MapIcon /> Mon royaume
            </Button>
          </div>

          <div className="mt-7 flex flex-wrap gap-8">
            <Stat value={state.points} label="XP gagnés" />
            <Stat value={`${lessonsDone}/${TOTAL_LESSONS}`} label="Quêtes accomplies" />
            <Stat value={state.coins} label="Pièces d’or" />
          </div>

          {/* Titre de noblesse */}
          <div className="mt-7 flex max-w-md items-center gap-3">
            <img src={uiUrl(rank.avatar)} alt="" className="pixel h-14 w-14 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-display text-lg text-[hsl(var(--primary))]">{rank.name}</span>
                <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">
                  {nextRank ? `${state.points} / ${nextRank.min} XP` : 'Titre suprême 👑'}
                </span>
              </div>
              <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full border-2 border-[#3a2412] bg-[#3a2412]/25">
                <div className="h-full bg-gradient-to-r from-[#f7c948] to-[#e08a2e] transition-all" style={{ width: `${rankPct}%` }} />
              </div>
              {nextRank && (
                <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Encore {nextRank.min - state.points} XP avant le titre de {nextRank.name}
                </div>
              )}
            </div>
          </div>

          {/* Duel : chevalier bleu face au chevalier noir */}
          <div className="pointer-events-none absolute bottom-2 right-2 hidden items-end lg:flex">
            <Sprite k="guerrier" height={150} crop={0.18} />
            <Sprite k="lancier" height={150} crop={0.2} style={{ marginLeft: -40 }} />
            <Sprite k="guerrier-noir" height={150} crop={0.18} flip style={{ marginLeft: -10 }} />
          </div>
        </CardContent>
      </Card>

      {/* Reprendre là où tu t'es arrêté */}
      {nextQuest ? (
        <Card
          className="cursor-pointer transition hover:-translate-y-0.5"
          onClick={() => onResume(nextQuest.level, nextQuest.index, nextQuest.lesson)}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <img src={uiUrl(LEVEL_INFO[nextQuest.level].avatar)} alt="" className="pixel h-16 w-16 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                Reprendre · {LEVEL_INFO[nextQuest.level].name} · Quête {nextQuest.index + 1}
              </div>
              <div className="font-display truncate text-xl">{nextQuest.lesson.title}</div>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                {nextQuest.lesson.t === 'V' ? 'Vocabulaire' : 'Grammaire'}
              </div>
            </div>
            <Button className="ml-auto hidden shrink-0 sm:inline-flex">
              <Play /> Continuer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <img src={uiUrl('avatars_16.png')} alt="" className="pixel h-16 w-16 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-display text-xl">Toutes les quêtes sont accomplies 👑</div>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                Continue à t’entraîner pour garder ton anglais bien affûté, Majesté.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
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
              <Target className="absolute text-[hsl(var(--primary))]" />
            </div>
            <div>
              <div className="font-display text-lg">Objectif du jour</div>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                {dailyToday} / {dailyGoal} XP {dailyPct >= 100 ? '· atteint 🎉' : `· encore ${dailyGoal - dailyToday} XP`}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={due > 0 ? 'cursor-pointer transition hover:-translate-y-0.5' : ''} onClick={due > 0 ? onReview : undefined}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[hsl(var(--primary)/0.15)]">
              <Brain className="text-[hsl(var(--primary))]" />
            </div>
            <div>
              <div className="font-display text-lg">Entraînement</div>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                {due > 0
                  ? `${due} carte${due > 1 ? 's' : ''} à revoir aujourd’hui.`
                  : 'Termine des quêtes pour remplir ta pile de révision.'}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition hover:-translate-y-0.5" onClick={() => navigate('dictionary')}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[hsl(var(--primary)/0.15)]">
              <BookOpen className="text-[hsl(var(--primary))]" />
            </div>
            <div>
              <div className="font-display text-lg">Grimoire</div>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">Cherche un mot, écoute-le, garde-le.</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="ribbon ribbon-red text-xl">
            <ScrollText className="mr-2 size-5" /> Choisis ton rang
          </h2>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">De l’écuyer au roi (A1 → C2)</span>
        </div>
        <RankMap state={state} onSelect={openLevel} />
      </div>

      {/* L'armée bleue en parade */}
      <div className="flex origin-bottom scale-[0.7] items-end justify-center gap-0 pt-2 sm:scale-100">
        <Sprite k="archer" height={96} crop={0.2} />
        <Sprite k="lancier" height={110} crop={0.2} />
        <Sprite k="guerrier" height={104} crop={0.2} />
        <Sprite k="moine" height={96} crop={0.2} />
        <Sprite k="guerrier" height={104} crop={0.2} flip />
        <Sprite k="lancier" height={110} crop={0.2} flip />
        <Sprite k="archer" height={96} crop={0.2} flip />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl">{value}</div>
      <div className="text-xs font-bold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">{label}</div>
    </div>
  );
}
