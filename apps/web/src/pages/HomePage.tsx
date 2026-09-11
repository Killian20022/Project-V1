import { LEVEL_INFO, LEVELS } from '../lib/content';
import type { GameState, Level, Page } from '../types';

export function HomePage({ state, navigate, openLevel }: { state: GameState; navigate: (page: Page) => void; openLevel: (level: Level) => void }) {
  const completed = Object.values(state.lessons).reduce((sum, value) => sum + (value ?? 0), 0);
  const daily = state.dailyDate === new Date().toDateString() ? state.dailyXP : 0;
  return (
    <section>
      <div className="hero">
        <div className="hero-eyebrow">Apprends · pratique · progresse</div>
        <h1>Ton aventure vers un anglais <span>sans limites</span></h1>
        <p>Des leçons courtes, des exercices variés et une île qui grandit avec tes progrès.</p>
        <div className="hero-cta">
          <button className="btn btn-primary" onClick={() => navigate('learn')}>Continuer mon parcours</button>
          <button className="btn btn-ghost" onClick={() => navigate('dictionary')}>Ouvrir le dictionnaire</button>
        </div>
        <div className="hero-mini">
          <div><div className="n">{state.points}</div><div className="l">XP gagnés</div></div>
          <div><div className="n">{completed}/60</div><div className="l">Leçons terminées</div></div>
          <div><div className="n">{state.streak}</div><div className="l">Jours de série</div></div>
        </div>
      </div>
      <div className="dash">
        <div className="dash-card goal"><div className="progress-disc"><b>{daily}</b><small>/ 50 XP</small></div><div><div className="dash-t">Objectif du jour</div><div className="dash-s">{daily >= 50 ? 'Objectif atteint !' : `Encore ${50 - daily} XP`}</div></div></div>
        <button className="dash-card cont reset-button" onClick={() => navigate('learn')}><div className="cont-ic">▶</div><div><div className="dash-t">Reprendre</div><div className="dash-s">Continue à ton rythme</div></div></button>
      </div>
      <h2 className="title">Choisis ton niveau</h2>
      <p className="sub">Du premier mot jusqu’à la maîtrise complète.</p>
      <div className="grid cols">
        {LEVELS.map(level => {
          const info = LEVEL_INFO[level];
          const progress = (state.lessons[level] ?? 0) * 10;
          return <button className="card level-card reset-button" key={level} onClick={() => openLevel(level)}>
            <div className={`level-badge ${info.color}`}>{level}</div><div className="level-name">{info.name}</div><div className="level-desc">{info.description}</div>
            <div className="level-prog"><div className="level-prog-fill" style={{ width: `${progress}%` }} /></div><div className="level-prog-txt">{progress}% terminé</div>
          </button>;
        })}
      </div>
    </section>
  );
}
