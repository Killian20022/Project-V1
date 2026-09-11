import type { GameState, Page } from '../types';

const nav: Array<{ page: Page; label: string; icon: string }> = [
  { page: 'home', label: 'Accueil', icon: '⌂' },
  { page: 'learn', label: 'Parcours', icon: '▶' },
  { page: 'island', label: 'Île', icon: '♣' },
  { page: 'shop', label: 'Boutique', icon: '◆' },
  { page: 'trophies', label: 'Trophées', icon: '★' },
  { page: 'dictionary', label: 'Dictionnaire', icon: 'A' },
];

export function Layout({ state, page, onNavigate, onTheme, children }: { state: GameState; page: Page; onNavigate: (page: Page) => void; onTheme: () => void; children: React.ReactNode }) {
  return (
    <>
      <header className="nav">
        <button className="brand brand-button" onClick={() => onNavigate('home')}><span className="dot" />English<b>Quest</b></button>
        <nav className="desktop-tabs" aria-label="Navigation principale">
          {nav.map(item => <button key={item.page} className={`tab ${page === item.page ? 'active' : ''}`} onClick={() => onNavigate(item.page)}>{item.label}</button>)}
        </nav>
        <div className="nav-stats">
          <div className="chip streak">Série <b>{state.streak}</b></div>
          <div className="chip gold">XP <b>{state.points}</b></div>
          <div className="chip coins"><span className="coin-ic" /> <b>{state.coins}</b></div>
          <button className="icon-btn" onClick={onTheme} aria-label="Changer le thème">{state.dark ? '☾' : '☀'}</button>
          <button className="icon-btn" onClick={() => onNavigate('account')} aria-label="Compte">♙</button>
        </div>
      </header>
      <main className="wrap">{children}</main>
      <nav className="botnav" aria-label="Navigation mobile">
        {nav.slice(0, 5).map(item => (
          <button key={item.page} className={`botnav-item ${page === item.page ? 'active' : ''}`} onClick={() => onNavigate(item.page)}>
            <span className="bn-ic">{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
    </>
  );
}
