import { useState, type ReactNode } from 'react';
import { Flame, Star, Coins, Volume2 } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { VoiceSettings } from '@/components/VoiceSettings';
import type { GameState, Page } from '../types';

const NAV: { label: string; page: Page }[] = [
  { label: 'Base', page: 'home' },
  { label: 'Missions', page: 'learn' },
  { label: 'Business', page: 'business' },
  { label: 'Grammaire', page: 'grammar' },
  { label: 'Galaxie', page: 'island' },
  { label: 'Armurerie', page: 'shop' },
  { label: 'Médailles', page: 'trophies' },
  { label: 'Archives', page: 'dictionary' },
];

const DEV_EMAIL = 'killianlopez20@gmail.com';

export function Layout({
  page,
  onNavigate,
  state,
  children,
  onAddCoins,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
  state: GameState;
  children: ReactNode;
  onAddCoins?: () => void;
}) {
  const [voiceOpen, setVoiceOpen] = useState(false);
  const { user } = useUser();
  const isDev = user?.primaryEmailAddress?.emailAddress === DEV_EMAIL;
  return (
    <div className="min-h-screen">
      {/* Ambiance spatiale Star Wars (discrète) : étoiles qui scintillent + étoiles filantes */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="sw-stars" />
        <span className="sw-shoot" style={{ top: '9%', animationDelay: '-2s' }} />
        <span className="sw-shoot" style={{ top: '34%', animationDelay: '-9s' }} />
        <span className="sw-shoot" style={{ top: '66%', animationDelay: '-13s' }} />
      </div>

      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <button className="flex items-center gap-2 font-display font-extrabold tracking-tight" onClick={() => onNavigate('home')}>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_14px_hsl(var(--brand-gold)/0.6)]">EW</span>
            <span>
              English<span className="text-primary text-glow"> Wars</span>
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
            <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1" title="Crédits">
              <Coins className="text-amber-400" /> {state.coins}
            </span>
            {isDev && onAddCoins && (
              <Button size="sm" variant="secondary" onClick={onAddCoins} title="Dev : +1000 crédits">
                <Coins className="text-amber-400" /> +1000
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setVoiceOpen(true)} title="Réglages de la voix" aria-label="Réglages de la voix">
              <Volume2 />
            </Button>

            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="outline" size="sm">Connexion</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">S'inscrire</Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>

      <VoiceSettings open={voiceOpen} onClose={() => setVoiceOpen(false)} />

      <main className={page === 'island' ? 'w-full p-0' : 'mx-auto max-w-6xl px-4 pb-28 pt-8'}>{children}</main>
    </div>
  );
}
