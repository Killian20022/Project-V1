import { useState, type ReactNode } from 'react';
import { Flame, Volume2 } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { VoiceSettings } from '@/components/VoiceSettings';
import { uiUrl } from '@/lib/sprites';
import type { GameState, Page } from '../types';

const NAV: { label: string; page: Page }[] = [
  { label: 'Château', page: 'home' },
  { label: 'Quêtes', page: 'learn' },
  { label: 'Business', page: 'business' },
  { label: 'Grammaire', page: 'grammar' },
  { label: 'Royaume', page: 'island' },
  { label: 'Marché', page: 'shop' },
  { label: 'Hauts faits', page: 'trophies' },
  { label: 'Grimoire', page: 'dictionary' },
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
    <div className={page === 'island' ? 'flex h-[100dvh] flex-col' : 'min-h-screen'}>
      <header className="wood-bar sticky top-0 z-20 text-[#ffeccc]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
          <button className="flex items-center gap-2" onClick={() => onNavigate('home')} aria-label="English Sword — accueil">
            <img src={uiUrl('icon_05.png')} alt="" className="pixel h-9 w-9 drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]" />
            <span className="font-display text-xl leading-none text-[#fff3d6] drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]">
              English <span className="text-[#f7c948]">Sword</span>
            </span>
          </button>

          <nav className="order-3 flex w-full gap-1 overflow-x-auto md:order-2 md:w-auto">
            {NAV.map((item) => (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`font-display whitespace-nowrap rounded-md px-3 py-1.5 text-[15px] transition ${
                  page === item.page
                    ? 'bg-[#2b1a0d]/60 text-[#f7c948] shadow-[inset_0_2px_4px_rgba(0,0,0,0.45)]'
                    : 'text-[#ffeccc] hover:bg-[#2b1a0d]/35'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="order-2 ml-auto flex items-center gap-1.5 text-sm font-bold sm:gap-2 md:order-3">
            <span className="hidden items-center gap-1 rounded-full bg-[#2b1a0d]/55 px-3 py-1 sm:flex" title="Jours de série">
              <Flame className="size-4 text-orange-400" /> {state.streak}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-[#2b1a0d]/55 px-3 py-1" title="Expérience">
              <img src={uiUrl('icon_06.png')} alt="" className="pixel h-5 w-5" /> {state.points}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-[#2b1a0d]/55 px-3 py-1" title="Pièces d'or">
              <img src={uiUrl('icon_03.png')} alt="" className="pixel h-5 w-5" /> {state.coins}
            </span>
            {isDev && onAddCoins && (
              <Button size="sm" variant="secondary" onClick={onAddCoins} title="Dev : +1000 pièces d'or">
                +1000
              </Button>
            )}
            <button
              className="grid h-9 w-9 place-items-center rounded-md hover:bg-[#2b1a0d]/35"
              onClick={() => setVoiceOpen(true)}
              title="Réglages de la voix"
              aria-label="Réglages de la voix"
            >
              <Volume2 className="size-4" />
            </button>

            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="secondary" size="sm">Connexion</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="hidden sm:inline-flex">S'inscrire</Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>

      <VoiceSettings open={voiceOpen} onClose={() => setVoiceOpen(false)} />

      <main className={page === 'island' ? 'min-h-0 w-full flex-1 p-0' : 'mx-auto max-w-6xl px-4 pb-28 pt-8'}>{children}</main>
    </div>
  );
}
