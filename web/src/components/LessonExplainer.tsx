import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Lesson } from '../types';

type Slide =
  | { kind: 'form'; left: string; right: string }
  | { kind: 'example'; en: string; fr: string }
  | { kind: 'step'; label: string; detail: string; highlight?: string };

const FORM_MS = 2200;
const EXAMPLE_MS = 2800;
const STEP_MS = 3200;

// Mini-explication animée d'une leçon : par défaut, un défilé auto généré à partir
// des champs déjà présents sur la leçon (forms puis examples) — aucune donnée
// supplémentaire nécessaire. Si `lesson.explainer` est fourni, on l'utilise à la place.
export function LessonExplainer({
  title,
  forms,
  examples,
  explainer,
}: {
  title: string;
  forms?: Lesson['forms'];
  examples?: Lesson['examples'];
  explainer?: Lesson['explainer'];
}) {
  const slides: Slide[] = useMemo(() => {
    if (explainer?.steps?.length) {
      return explainer.steps.map((step) => ({ kind: 'step' as const, ...step }));
    }
    const formSlides: Slide[] = (forms ?? []).map(([left, right]) => ({ kind: 'form' as const, left, right }));
    const exampleSlides: Slide[] = (examples ?? []).map(([en, fr]) => ({ kind: 'example' as const, en, fr }));
    return [...formSlides, ...exampleSlides];
  }, [explainer, forms, examples]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides]);

  const slide = slides[index];
  const duration = !slide ? 0 : slide.kind === 'form' ? FORM_MS : slide.kind === 'example' ? EXAMPLE_MS : STEP_MS;

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % slides.length), duration);
    return () => clearTimeout(timer);
  }, [index, duration, slides.length]);

  if (!slides.length || !slide) return null;

  return (
    <Card
      className="glass cursor-pointer select-none overflow-hidden"
      role="button"
      aria-label="Avancer la mini-explication"
      onClick={() => setIndex((i) => (i + 1) % slides.length)}
    >
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-primary">
          <span>Mini-explication · {title}</span>
          <span className="normal-case text-muted-foreground">Clique pour avancer</span>
        </div>

        <div key={index} className="eq-flip flex min-h-24 flex-col items-center justify-center gap-2 text-center">
          {slide.kind === 'form' && (
            <>
              <div className="text-sm text-muted-foreground">{slide.left}</div>
              <div className="text-2xl font-black text-primary">{slide.right}</div>
            </>
          )}
          {slide.kind === 'example' && (
            <>
              <div className="eq-sweep px-1 text-lg font-semibold" style={{ animationDuration: `${EXAMPLE_MS - 400}ms` }}>
                {slide.en}
              </div>
              <div className="text-sm text-muted-foreground">{slide.fr}</div>
            </>
          )}
          {slide.kind === 'step' && (
            <>
              <div className="text-sm font-semibold text-accent">{slide.label}</div>
              <div className="text-base">{slide.detail}</div>
              {slide.highlight && (
                <div className="glow-primary mt-1 rounded-lg bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                  {slide.highlight}
                </div>
              )}
            </>
          )}
        </div>

        {slides.length > 1 && (
          <div className="mt-4 flex gap-1">
            {slides.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i === index ? 'bg-primary' : 'bg-secondary'}`} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
