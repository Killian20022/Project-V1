import type { ReactNode } from 'react';
import { Flame, Star, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Walkers } from '@/components/Walkers';
import type { GameState, Page } from '../types';

const NAV: { label: string; page: Page }[] = [
  { label: 'Accueil', page: 'home' },
  { label: 'Apprendre', page: 'learn' },
  { label: 'Île', page: 'island' },
  { label: 'Boutique', page: 'shop' },
  { label: 'Trophées', page: 'trophies' },
  { label: 'Dictionnaire', page: 'dictionary' },
];

export function Layout({
  page,
  onNavigate,
  state,
  children,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
  state: GameState;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <button className="flex items-center gap-2 font-extrabold tracking-tight" onClick={() => onNavigate('home')}>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">EQ</span>
            <span>
              English<span className="text-primary">Quest</span>
            </span>
          </button>

          <nav className="order-3 flex w-full gap-1 overflow-x-auto md:order-2 md:w-auto">
            {NAV.map((item) => (
              <Button
                key={item.page}
                variant={page === item.page ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onNavigate(item.page)}
              >
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="order-2 ml-auto flex items-center gap-2 text-sm font-semibold md:order-3">
            <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1" title="Série">
              <Flame className="text-orange-400" /> {state.streak}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1" title="Points d'expérience">
              <Star className="text-yellow-400" /> {state.points}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1" title="Pièces">
              <Coins className="text-amber-400" /> {state.coins}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-8">{children}</main>

      {/* Personnages qui traversent le bas de la page (décoratif, sur le fond) */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-20 overflow-hidden">
        <Walkers />
      </div>
    </div>
  );
}
