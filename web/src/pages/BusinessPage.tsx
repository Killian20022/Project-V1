import { Briefcase, Check, Play, Mail, Users, Phone, Presentation, Handshake, Coffee, UserRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { businessModules, businessCategories, businessDoneId } from '@/lib/content';
import type { BusinessModule, GameState } from '../types';

// Petite icône par catégorie (purement décoratif).
const CATEGORY_ICON: Record<string, typeof Mail> = {
  Relationnel: Users,
  Écrit: Mail,
  Réunions: Users,
  Communication: Phone,
  'Prise de parole': Presentation,
  Négociation: Handshake,
  Carrière: UserRound,
};

const MODULE_ICON: Record<string, typeof Mail> = {
  introductions: Users,
  emails: Mail,
  meetings: Users,
  telephoning: Phone,
  presentations: Presentation,
  negotiation: Handshake,
  'small-talk': Coffee,
  interviews: UserRound,
};

export function BusinessPage({
  state,
  onOpenModule,
}: {
  state: GameState;
  onOpenModule: (module: BusinessModule) => void;
}) {
  const modules = businessModules();
  const categories = businessCategories();
  const doneCount = modules.filter((m) => state.completed.includes(businessDoneId(m.id))).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#5c3a1f] to-[#2b1a0d] text-white shadow-[0_0_14px_hsl(var(--brand-gold)/0.35)]">
          <Briefcase />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl text-[#ffe7a6]">Business English</h1>
          <p className="text-muted-foreground">L’anglais du monde professionnel. Choisis le thème dont tu as besoin.</p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
          {doneCount}/{modules.length} modules
        </span>
      </div>

      <div className="mt-8 space-y-8">
        {categories.map((category) => {
          const inCategory = modules.filter((m) => m.category === category);
          const CatIcon = CATEGORY_ICON[category] ?? Briefcase;
          return (
            <section key={category}>
              <div className="mb-3 flex items-center gap-2">
                <CatIcon className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{category}</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inCategory.map((module) => {
                  const done = state.completed.includes(businessDoneId(module.id));
                  const Icon = MODULE_ICON[module.id] ?? Briefcase;
                  return (
                    <Card
                      key={module.id}
                      className="cursor-pointer transition hover:-translate-y-0.5 hover:border-primary/60"
                      onClick={() => onOpenModule(module)}
                    >
                      <CardContent className="flex h-full flex-col gap-3 p-5">
                        <div className="flex items-center justify-between">
                          <div
                            className={`grid h-11 w-11 place-items-center rounded-xl ${
                              done ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'
                            }`}
                          >
                            {done ? <Check /> : <Icon />}
                          </div>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            {module.level}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold">{module.title}</div>
                          {module.goal && <p className="mt-1 text-sm text-muted-foreground">{module.goal}</p>}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                          {done ? (
                            <>
                              <Check className="size-3" /> Terminé — refaire
                            </>
                          ) : (
                            <>
                              <Play className="size-3" /> Commencer
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
