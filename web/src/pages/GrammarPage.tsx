import { useMemo, useState } from 'react';
import {
  BookOpen, Search, ChevronLeft, ChevronRight, Clock, KeyRound, Shuffle, Boxes, Scale, Puzzle, Blocks, PenLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LEVELS, LEVEL_INFO, GRAMMAR_CATEGORIES, grammarEntries, type GrammarEntry } from '@/lib/content';
import type { Level } from '../types';

// Icône + dégradé par famille grammaticale (clé = GrammarCategory.key).
const CAT_STYLE: Record<string, { icon: typeof Clock; gradient: string }> = {
  tenses: { icon: Clock, gradient: 'from-sky-400 to-blue-600' },
  modals: { icon: KeyRound, gradient: 'from-violet-400 to-purple-600' },
  conditionals: { icon: Shuffle, gradient: 'from-amber-400 to-orange-600' },
  nouns: { icon: Boxes, gradient: 'from-emerald-400 to-teal-600' },
  adjectives: { icon: Scale, gradient: 'from-cyan-400 to-sky-600' },
  prepositions: { icon: Puzzle, gradient: 'from-rose-400 to-pink-600' },
  structure: { icon: Blocks, gradient: 'from-indigo-400 to-violet-600' },
  style: { icon: PenLine, gradient: 'from-fuchsia-400 to-purple-600' },
};

function plain(text?: string): string {
  return (text ?? '').replace(/<[^>]+>/g, '').trim();
}

// Plage de niveaux couverte par un ensemble de fiches, ex. « A1 · A2 » ou « A1 → C2 ».
function levelRange(entries: GrammarEntry[]): string {
  const idxs = entries.map((e) => LEVELS.indexOf(e.level));
  const min = LEVELS[Math.min(...idxs)];
  const max = LEVELS[Math.max(...idxs)];
  return min === max ? min : `${min} → ${max}`;
}

function FicheCard({
  entry,
  showCategory,
  onOpen,
}: {
  entry: GrammarEntry;
  showCategory?: boolean;
  onOpen: (e: GrammarEntry) => void;
}) {
  const cat = GRAMMAR_CATEGORIES.find((c) => c.key === entry.category);
  return (
    <Card
      className="group cursor-pointer transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5"
      onClick={() => onOpen(entry)}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${LEVEL_INFO[entry.level].gradient} text-xs font-black text-white`}
        >
          {entry.level}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{entry.lesson.title}</div>
          {showCategory ? (
            <span className="text-xs font-medium text-primary/80">{cat?.label}</span>
          ) : (
            plain(entry.lesson.intro) && (
              <p className="truncate text-sm text-muted-foreground">{plain(entry.lesson.intro)}</p>
            )
          )}
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </CardContent>
    </Card>
  );
}

export function GrammarPage({ onOpenGrammar }: { onOpenGrammar: (entry: GrammarEntry) => void }) {
  const [query, setQuery] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [level, setLevel] = useState<Level | 'all'>('all');

  const all = useMemo(() => grammarEntries(), []);
  const byCategory = useMemo(() => {
    const map: Record<string, GrammarEntry[]> = {};
    for (const e of all) (map[e.category] ??= []).push(e);
    return map;
  }, [all]);

  const q = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!q) return [];
    return all.filter((e) => {
      const hay = `${e.lesson.title} ${plain(e.lesson.intro)} ${(e.lesson.keypoints ?? []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [all, q]);

  const activeCat = openCategory ? GRAMMAR_CATEGORIES.find((c) => c.key === openCategory) : null;
  const catEntries = openCategory ? byCategory[openCategory] ?? [] : [];
  const catFiltered = level === 'all' ? catEntries : catEntries.filter((e) => e.level === level);

  return (
    <div>
      {/* En-tête */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#9b6fc2] to-[#5e3a86] text-white shadow-[0_0_14px_hsl(var(--brand-gold)/0.35)]">
          <BookOpen />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl text-[#ffe7a6]">Grammaire du royaume</h1>
          <p className="text-muted-foreground">
            {all.length} fiches classées par famille — trouve un point précis et révise-le quand tu veux.
          </p>
        </div>
      </div>

      {/* Recherche (prioritaire sur la vue par familles) */}
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2 focus-within:border-primary/60">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une règle (ex. present perfect, articles, modaux)…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button className="text-xs font-semibold text-muted-foreground hover:text-foreground" onClick={() => setQuery('')}>
            Effacer
          </button>
        )}
      </div>

      {/* ── Mode recherche : résultats à plat ── */}
      {q ? (
        <div className="mt-6">
          <p className="mb-3 text-sm text-muted-foreground">
            {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} pour « {query} »
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {searchResults.map((entry) => (
              <FicheCard key={`${entry.level}-${entry.index}`} entry={entry} showCategory onOpen={onOpenGrammar} />
            ))}
          </div>
          {searchResults.length === 0 && (
            <p className="mt-10 text-center text-muted-foreground">Aucune fiche ne correspond à « {query} ».</p>
          )}
        </div>
      ) : activeCat ? (
        /* ── Détail d'une famille ── */
        <div className="mt-4">
          <Button variant="ghost" size="sm" onClick={() => { setOpenCategory(null); setLevel('all'); }}>
            <ChevronLeft /> Toutes les familles
          </Button>

          <div className="mt-3 flex items-center gap-3">
            <div
              className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${CAT_STYLE[activeCat.key]?.gradient} text-white`}
            >
              {(() => {
                const Icon = CAT_STYLE[activeCat.key]?.icon ?? BookOpen;
                return <Icon />;
              })()}
            </div>
            <div>
              <h2 className="text-2xl">{activeCat.label}</h2>
              <p className="text-sm text-muted-foreground">{activeCat.description}</p>
            </div>
          </div>

          {/* Sous-filtre par niveau (uniquement les niveaux présents) */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant={level === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLevel('all')}>
              Tous ({catEntries.length})
            </Button>
            {LEVELS.filter((lv) => catEntries.some((e) => e.level === lv)).map((lv) => (
              <Button key={lv} variant={level === lv ? 'secondary' : 'ghost'} size="sm" onClick={() => setLevel(lv)}>
                {lv} ({catEntries.filter((e) => e.level === lv).length})
              </Button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {catFiltered.map((entry) => (
              <FicheCard key={`${entry.level}-${entry.index}`} entry={entry} onOpen={onOpenGrammar} />
            ))}
          </div>
        </div>
      ) : (
        /* ── Vue par familles (grille de tuiles) ── */
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GRAMMAR_CATEGORIES.map((cat) => {
            const entries = byCategory[cat.key] ?? [];
            const style = CAT_STYLE[cat.key];
            const Icon = style?.icon ?? BookOpen;
            return (
              <button key={cat.key} className="text-left" onClick={() => { setOpenCategory(cat.key); setLevel('all'); }}>
                <Card className="group h-full cursor-pointer overflow-hidden transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10">
                  <CardContent className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-start justify-between">
                      <div
                        className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${style?.gradient} text-white shadow-lg transition group-hover:scale-105`}
                      >
                        <Icon />
                      </div>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {levelRange(entries)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-display text-lg">{cat.label}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{cat.description}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-primary">{entries.length} fiches</span>
                      <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
