import { useState } from 'react';
import { ArrowLeft, BookMarked, Check, Layers, PenLine, Play, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DOMAINS, THEMES, VOCAB_TARGET, allWords, themeByKey } from '@/data/lexicon';
import { POS_LABEL, stepId, stepsOf, type Theme, type WordEntry } from '@/lib/lexicon';
import { KNOWN_BOX, knownInTheme, wordCardId, wordStats } from '@/lib/srs';
import { speak } from '@/lib/speak';
import type { GameState } from '../types';

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-secondary">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
        style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }}
      />
    </div>
  );
}

export function VocabularyPage({
  state,
  onStartStep,
}: {
  state: GameState;
  onStartStep: (themeKey: string, stepIndex: number) => void;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const theme = openKey ? themeByKey(openKey) : null;
  const { known, seen } = wordStats(state.srs);
  const total = allWords().length;

  if (theme) return <ThemeDetail state={state} theme={theme} onBack={() => setOpenKey(null)} onStartStep={onStartStep} />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#5c3a1f] to-[#2b1a0d] text-white shadow-[0_0_14px_hsl(var(--brand-gold)/0.35)]">
          <BookMarked />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl text-[#ffe7a6]">Vocabulaire</h1>
          <p className="text-muted-foreground">
            Un thème, un inventaire complet, du A1 au C1. Un mot compte comme acquis quand tu l’as retrouvé assez
            souvent pour qu’il ne revienne plus qu’une fois par semaine.
          </p>
        </div>
      </div>

      {/* Le compteur qui manquait : sans objet « mot » dans le code, il était impossible à calculer. */}
      <Card className="mt-6">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Mots acquis</span>
            <span className="font-display text-2xl text-[#ffe7a6]">
              {known} <span className="text-base text-muted-foreground">/ {VOCAB_TARGET.toLocaleString('fr-FR')}</span>
            </span>
          </div>
          <div className="mt-3">
            <Bar value={known} max={VOCAB_TARGET} />
          </div>
          {/* « Rencontrés » monte dès la première séance ; « acquis » demande d'avoir retrouvé le
              mot plusieurs fois à plusieurs jours d'intervalle. Afficher les deux évite de croire
              qu'il ne s'est rien passé. Et on dit franchement combien de mots sont écrits à ce
              jour : le plan est complet, le contenu se remplit thème par thème. */}
          <p className="mt-2 text-[11px] text-muted-foreground">
            {seen} mot{seen > 1 ? 's' : ''} rencontré{seen > 1 ? 's' : ''} · {total} écrit{total > 1 ? 's' : ''} à ce
            jour sur {THEMES.length} thèmes en {DOMAINS.length} domaines.
          </p>
          {/* À dire noir sur blanc : le gris n'est pas un verrou. Sans cette phrase, on croit
              devoir terminer les quêtes pour ouvrir les thèmes — ce qui n'existe nulle part
              dans le code. */}
          <p className="mt-1 text-[11px] text-muted-foreground">
            <strong className="text-[#ffe7a6]">Aucun thème n’est verrouillé</strong> : commence par celui que tu veux,
            dans l’ordre que tu veux. Ceux en pointillé n’ont simplement pas encore de mots — je les écris un par un.
          </p>
        </CardContent>
      </Card>

      {DOMAINS.map((domain) => {
        const themes = THEMES.filter((t) => t.domain === domain.key);
        if (!themes.length) return null;
        const domainDone = themes.reduce((n, t) => n + knownInTheme(state.srs, t.words), 0);
        const domainTarget = themes.reduce((n, t) => n + t.target, 0);
        return (
          <section key={domain.key} className="mt-8">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{domain.label}</h2>
              <span className="text-xs text-muted-foreground">{domain.blurb}</span>
              <span className="ml-auto text-xs font-semibold">
                {domainDone} / {domainTarget}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {themes.map((t) => {
                const written = t.words.length;
                const done = knownInTheme(state.srs, t.words);
                // Un thème sans mots n'est PAS verrouillé — il n'est pas encore écrit. La nuance
                // est capitale : grisé + barre à zéro, ça se lit « à débloquer », et on croit
                // devoir faire toutes les leçons pour y accéder. D'où le trait pointillé, la
                // mention explicite, et surtout AUCUNE barre de progression : une barre vide
                // suggère un compte à rebours, alors qu'il n'y a rien à attendre de sa part.
                const empty = written === 0;
                if (empty)
                  return (
                    <div
                      key={t.key}
                      className="flex h-full flex-col gap-2 rounded-xl border border-dashed border-border/70 p-5"
                    >
                      <h3 className="font-display text-[17px] text-muted-foreground">{t.label}</h3>
                      <p className="text-sm text-muted-foreground/70">{t.blurb}</p>
                      <span className="mt-auto flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                        <PenLine className="size-3" /> pas encore écrit · {t.target} mots prévus
                      </span>
                    </div>
                  );
                return (
                  <Card
                    key={t.key}
                    onClick={() => setOpenKey(t.key)}
                    className="cursor-pointer transition hover:border-[hsl(var(--primary))]"
                  >
                    <CardContent className="flex h-full flex-col gap-3 p-5">
                      <div>
                        <h3 className="font-display text-[17px] text-[#ffe7a6]">{t.label}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
                      </div>
                      <div className="mt-auto">
                        <div className="mb-1 flex justify-between text-[11px] font-semibold">
                          <span className="text-muted-foreground">
                            {stepsOf(t).length} paliers · {written} mots
                          </span>
                          <span>
                            {done} / {written}
                          </span>
                        </div>
                        <Bar value={done} max={written} />
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
  );
}

function ThemeDetail({
  state,
  theme,
  onBack,
  onStartStep,
}: {
  state: GameState;
  theme: Theme;
  onBack: () => void;
  onStartStep: (themeKey: string, stepIndex: number) => void;
}) {
  const steps = stepsOf(theme);
  const done = knownInTheme(state.srs, theme.words);

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft /> Tous les thèmes
      </Button>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-3xl text-[#ffe7a6]">{theme.label}</h1>
          <p className="text-muted-foreground">{theme.blurb}</p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
          {done} / {theme.words.length} mots acquis
        </span>
      </div>
      <div className="mt-3">
        <Bar value={done} max={theme.words.length} />
      </div>

      <div className="mt-6 space-y-4">
        {steps.map((words, i) => {
          const finished = state.completed.includes(stepId(theme.key, i));
          const acquired = words.filter((w) => (state.srs[wordCardId(w.w)]?.box ?? -1) >= KNOWN_BOX).length;
          return (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary font-bold">
                    {finished ? <Check className="size-4 text-[#8cff9e]" /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[15px] text-[#ffe7a6]">
                      Palier {i + 1} · {words[0].cefr}
                      {words[words.length - 1].cefr !== words[0].cefr ? ` – ${words[words.length - 1].cefr}` : ''}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {words.length} mots · {acquired} acquis
                    </div>
                  </div>
                  <Button size="sm" variant={finished ? 'secondary' : 'default'} onClick={() => onStartStep(theme.key, i)}>
                    <Play /> {finished ? 'Refaire' : 'Apprendre'}
                  </Button>
                </div>

                {/* La liste reste visible : un thème sert aussi de référence, pas seulement
                    d'exercice. On écoute chaque mot d'un clic. */}
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {words.map((w) => (
                    <WordRow key={w.w} entry={w} known={(state.srs[wordCardId(w.w)]?.box ?? -1) >= KNOWN_BOX} />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function WordRow({ entry, known }: { entry: WordEntry; known: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-md border p-2.5 ${known ? 'border-[#4a7a52] bg-[#2f6b3a]/10' : 'border-border'}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => speak(entry.w)}
          className="grid h-7 w-7 shrink-0 place-items-center rounded text-muted-foreground hover:bg-secondary"
          aria-label={`Écouter « ${entry.w} »`}
        >
          <Volume2 className="size-4" />
        </button>
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(!open)}>
          <span className="font-semibold text-[#ffe7a6]">{entry.w}</span>
          <span className="ml-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">{POS_LABEL[entry.pos]}</span>
          <span className="block truncate text-sm text-muted-foreground">{entry.fr}</span>
        </button>
        <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold">{entry.cefr}</span>
      </div>
      {open && (
        <div className="mt-2 border-t border-border pt-2 text-sm">
          <div className="italic">{entry.ex.en}</div>
          <div className="text-muted-foreground">{entry.ex.fr}</div>
          {entry.note && (
            <div className="mt-1.5 flex gap-1.5 rounded bg-secondary/60 p-2 text-[11px] leading-snug">
              <Layers className="mt-0.5 size-3 shrink-0 text-[#ffcf6b]" />
              <span>{entry.note}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
