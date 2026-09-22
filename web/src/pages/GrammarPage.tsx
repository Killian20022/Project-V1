import { useMemo, useState } from 'react';
import { BookOpen, Search, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LEVELS, LEVEL_INFO, grammarEntries, type GrammarEntry } from '@/lib/content';
import type { Level } from '../types';

// Nettoie le HTML éventuel de l'intro pour l'aperçu.
function plain(text?: string): string {
  return (text ?? '').replace(/<[^>]+>/g, '').trim();
}

export function GrammarPage({ onOpenGrammar }: { onOpenGrammar: (entry: GrammarEntry) => void }) {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<Level | 'all'>('all');
  const all = useMemo(() => grammarEntries(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((e) => {
      if (level !== 'all' && e.level !== level) return false;
      if (!q) return true;
      const hay = `${e.lesson.title} ${plain(e.lesson.intro)} ${(e.lesson.keypoints ?? []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [all, query, level]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_0_14px_hsl(var(--brand-gold)/0.35)]">
          <BookOpen />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Hub Grammaire</h1>
          <p className="text-muted-foreground">
            Toutes les règles au même endroit — cherche un point précis et révise-le quand tu veux.
          </p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">{all.length} fiches</span>
      </div>

      {/* Recherche */}
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une règle (ex. present perfect, articles, modaux)…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Filtre niveau */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant={level === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLevel('all')}>
          Tous
        </Button>
        {LEVELS.map((lv) => (
          <Button key={lv} variant={level === lv ? 'secondary' : 'ghost'} size="sm" onClick={() => setLevel(lv)}>
            {lv}
          </Button>
        ))}
      </div>

      {/* Résultats */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map((entry) => (
          <Card
            key={`${entry.level}-${entry.index}`}
            className="cursor-pointer transition hover:-translate-y-0.5 hover:border-primary/60"
            onClick={() => onOpenGrammar(entry)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${LEVEL_INFO[entry.level].gradient} text-xs font-black text-white`}
              >
                {entry.level}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{entry.lesson.title}</div>
                {plain(entry.lesson.intro) && (
                  <p className="truncate text-sm text-muted-foreground">{plain(entry.lesson.intro)}</p>
                )}
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">Aucune fiche ne correspond à « {query} ».</p>
      )}
    </div>
  );
}
