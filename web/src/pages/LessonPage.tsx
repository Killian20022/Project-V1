import { ChevronLeft, Volume2, AlertTriangle, KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { speak } from '@/lib/speak';
import type { Lesson, Level } from '../types';

export function LessonPage({
  level,
  index,
  lesson,
  onBack,
  onStart,
}: {
  level: Level;
  index: number;
  lesson: Lesson;
  onBack: () => void;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ChevronLeft /> Parcours
      </Button>

      <div className="flex items-center gap-2">
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
          {lesson.t === 'V' ? 'Vocabulaire' : 'Grammaire'}
        </span>
        <span className="text-sm text-muted-foreground">
          {level} · Leçon {index + 1}
        </span>
      </div>

      <h1 className="text-3xl font-black">{lesson.title}</h1>
      {lesson.intro && <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: lesson.intro }} />}

      {lesson.forms && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 font-bold">{lesson.formsTitle ?? 'Les formes'}</div>
            <table className="w-full text-sm">
              <tbody>
                {lesson.forms.map(([left, right]) => (
                  <tr key={`${left}-${right}`} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4 font-medium text-muted-foreground">{left}</td>
                    <td className="py-2 font-semibold">{right}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {lesson.sections?.map((section) => (
        <Card key={section.h}>
          <CardContent className="p-5">
            <div className="mb-2 font-bold">{section.h}</div>
            <div className="text-sm leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: section.body }} />
          </CardContent>
        </Card>
      ))}

      {!!lesson.examples?.length && (
        <div>
          <div className="mb-2 font-bold">Exemples</div>
          <div className="space-y-2">
            {lesson.examples.map(([en, fr]) => (
              <Card key={en}>
                <CardContent className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <div className="font-semibold">{en}</div>
                    <div className="text-sm text-muted-foreground">{fr}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => speak(en)} aria-label="Écouter">
                    <Volume2 />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!!lesson.pitfalls?.length && (
        <Card className="border-orange-500/40 bg-orange-500/5">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center gap-2 font-bold text-orange-400">
              <AlertTriangle className="size-4" /> À éviter
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {lesson.pitfalls.map((item) => (
                <li key={item} dangerouslySetInnerHTML={{ __html: `• ${item}` }} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {!!lesson.keypoints?.length && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center gap-2 font-bold text-primary">
              <KeyRound className="size-4" /> À retenir
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {lesson.keypoints.map((item) => (
                <li key={item} dangerouslySetInnerHTML={{ __html: `• ${item}` }} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Button className="w-full" size="lg" onClick={onStart}>
        Commencer les exercices <ArrowRight />
      </Button>
    </div>
  );
}
