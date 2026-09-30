import { useState, type ReactNode } from 'react';
import { Moon, Sun, Flame, Volume2, Castle, Swords, BriefcaseBusiness, BookOpen, BookMarked, GraduationCap, Map, ShoppingBag, Trophy, ScrollText, Menu, X, ChevronRight, Shield } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { WelcomeArrival } from '@/components/WelcomeArrival';
import { VoiceSettings } from '@/components/VoiceSettings';
import { uiUrl } from '@/lib/sprites';
import { useIsDev } from '@/lib/dev';
import type { GameState, Page } from '../types';
// Six matières alignées à plat, ça ne se lit pas. On les range en trois intentions : suivre le
// parcours, travailler une matière, viser un objectif — plus le royaume, qui est le jeu.
// `group` ouvre une nouvelle section dès qu'il change : aucun index en dur à maintenir.
const NAV = [
  { group: 'VOTRE AVENTURE', label: 'Château', page: 'home', icon: Castle },
  { group: 'VOTRE AVENTURE', label: 'Quêtes', page: 'learn', icon: Swords },
  { group: 'APPRENDRE', label: 'Vocabulaire', page: 'vocab', icon: BookMarked },
  { group: 'APPRENDRE', label: 'Grammaire', page: 'grammar', icon: BookOpen },
  { group: 'VOS OBJECTIFS', label: 'Formules', page: 'business', icon: BriefcaseBusiness },
  { group: 'VOS OBJECTIFS', label: 'Examens', page: 'exam', icon: GraduationCap },
  { group: 'LE ROYAUME', label: 'Royaume', page: 'island', icon: Map },
  { group: 'LE ROYAUME', label: 'Marché', page: 'shop', icon: ShoppingBag },
  { group: 'LE ROYAUME', label: 'Hauts faits', page: 'trophies', icon: Trophy },
  { group: 'LE ROYAUME', label: 'Grimoire', page: 'dictionary', icon: ScrollText },
] satisfies { group: string; label: string; page: Page; icon: typeof Castle }[];
export function Layout({ page, onNavigate, state, children, onAddCoins, onToggleDark }: {
  page: Page; onNavigate: (page: Page) => void; state: GameState; children: ReactNode; onAddCoins?: () => void; onToggleDark: () => void;
}) {
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isLoaded } = useUser();
  const [welcomeReplay, setWelcomeReplay] = useState(0);
  const isDev = useIsDev(); // même test que partout ailleurs (l'adresse était recopiée en dur ici)
  function go(next: Page) { onNavigate(next); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }); }
  return (
    <div className={`quest-shell ${page === 'island' ? 'quest-shell-world' : ''}`}>
      <WelcomeArrival replay={welcomeReplay} userId={user?.id} authReady={isLoaded} />
      <a href="#main-content" className="skip-link">Aller au contenu</a>
      <aside className="quest-sidebar">
        <button className="quest-brand" onClick={() => go('home')} aria-label="Scriptoria — accueil">
          <span className="brand-emblem"><Swords size={24} strokeWidth={1.4} /></span>
          <span>Scriptoria<small>L’ANGLAIS EST UNE AVENTURE</small></span>
        </button>
        <button className="mobile-menu-toggle" aria-expanded={menuOpen} aria-controls="quest-navigation" aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <nav id="quest-navigation" className={`quest-navigation ${menuOpen ? 'is-open' : ''}`} aria-label="Navigation principale" onKeyDown={e => { if (e.key === 'Escape') setMenuOpen(false); }}>
          {NAV.map(({ group, label, page: target, icon: Icon }, i) => <div key={target}>
            {group !== NAV[i - 1]?.group && <div className={`nav-caption ${i ? 'nav-divider' : ''}`}>{group}</div>}
            <button className={`quest-nav-item ${page === target ? 'is-active' : ''}`} aria-current={page === target ? 'page' : undefined} onClick={() => go(target)}>
              <Icon size={18} strokeWidth={1.5} /><span>{label}</span>{page === target && <ChevronRight size={14} />}
            </button>
          </div>)}
          <button className="replay-arrival replay-arrival-mobile" onClick={() => { setMenuOpen(false); setWelcomeReplay(value => value + 1); }}><Castle size={14}/> Revoir l’entrée du royaume</button>
        </nav>
        <div className="sidebar-bottom"><Shield size={25} strokeWidth={1.2} /><p>Chaque mot appris.<br /><strong>Un royaume qui grandit.</strong></p><span>DE L’ÉCUYER AU ROI · A1 → C2</span><button className="replay-arrival" onClick={() => setWelcomeReplay(value => value + 1)}><Castle size={14}/> Revoir l’entrée du royaume</button></div>
      </aside>
      <div className="quest-workspace">
        <header className="quest-topbar">
          <div className="quest-breadcrumb">Votre royaume <ChevronRight size={13} /><strong>{NAV.find(n => n.page === page)?.label ?? 'Château'}</strong></div>
          <div className="quest-account">
            <span className="resource streak-resource" title="Jours de série"><Flame size={16} />{state.streak}<span className="resource-label">{state.streak > 1 ? 'jours' : 'jour'}</span></span>
            <span className="resource" title="Expérience"><Shield size={16} />{state.points}<span className="resource-label">XP</span></span>
            <span className="resource gold-resource" title="Pièces d’or"><img src={uiUrl('icon_03.png')} alt="" />{state.coins}</span>
            {isDev && onAddCoins && <Button size="sm" variant="secondary" onClick={onAddCoins} title="Dev : +1000 pièces d’or">+1000</Button>}
            <button className="theme-toggle" onClick={onToggleDark} aria-label={state.dark ? "Activer le mode clair" : "Activer le mode sombre"} title={state.dark ? "Mode clair" : "Mode sombre"}>{state.dark ? <Sun size={17} /> : <Moon size={17} />}</button>
            <button className="voice-toggle" onClick={() => setVoiceOpen(true)} aria-label="Réglages de la voix"><Volume2 size={17} /></button>
            <SignedOut><SignInButton mode="modal"><Button variant="ghost" size="sm">Connexion</Button></SignInButton><SignUpButton mode="modal"><Button size="sm" className="signup-button">S’inscrire</Button></SignUpButton></SignedOut>
            <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
          </div>
        </header>
        <VoiceSettings open={voiceOpen} onClose={() => setVoiceOpen(false)} />
        <main id="main-content" tabIndex={-1} className={page === 'island' ? 'quest-world' : 'quest-content'}>{children}</main>
        {/* Crédits : les phrases d'entraînement viennent de Tatoeba, sous licence CC BY 2.0 FR —
            l'attribution est OBLIGATOIRE, elle manquait. La mention ETS accompagne la section
            Examens, qui s'entraîne au format d'une marque qui ne nous appartient pas. */}
        {page !== 'island' && <footer className="quest-footer"><span>SCRIPTORIA</span><span>Un mot après l’autre, l’aventure continue.<br />Phrases d’entraînement : <a href="https://tatoeba.org" target="_blank" rel="noreferrer noopener" className="underline">Tatoeba</a> (CC BY 2.0 FR). TOEIC® est une marque déposée d’ETS ; Scriptoria n’est ni affilié à ETS ni approuvé par ETS.</span><Swords size={16} /></footer>}
      </div>
    </div>
  );
}
