import { Swords, BookOpen, Brain, Play, ScrollText, Target, Map as MapIcon, ArrowRight, Compass, Lock, Check, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sprite } from '@/components/Sprite';
import { RankMap } from '@/components/RankMap';
import { LEVELS, LEVEL_INFO, lessonCount, lessonsFor, TOTAL_LESSONS } from '@/lib/content';
import { countDue } from '@/lib/srs';
import { uiUrl } from '@/lib/sprites';
import type { GameState, Lesson, Level, Page } from '../types';
import { useIsDev } from '@/lib/dev';

// Titres de noblesse calculés à partir de l'XP total.
export const RANKS: { name: string; min: number; avatar: string }[] = [
  { name: 'Paysan', min: 0, avatar: 'avatars_05.png' },
  { name: 'Écuyer', min: 500, avatar: 'avatars_04.png' },
  { name: 'Homme d’armes', min: 1500, avatar: 'avatars_02.png' },
  { name: 'Chevalier', min: 3500, avatar: 'avatars_01.png' },
  { name: 'Seigneur', min: 6500, avatar: 'avatars_11.png' },
  { name: 'Légende du royaume', min: 10000, avatar: 'avatars_16.png' },
];

export function HomePage({
  state,
  navigate,
  openLevel,
  onReview,
  onResume,
  onStartBoss,
}: {
  state: GameState;
  navigate: (page: Page) => void;
  openLevel: (level: Level) => void;
  onReview: () => void;
  onResume: (level: Level, index: number, lesson: Lesson) => void;
  onStartBoss: (level: Level) => void;
}) {
  const isDev = useIsDev();
  const lessonsDone = LEVELS.reduce((sum, lv) => sum + Math.min(state.lessons[lv] ?? 0, lessonCount(lv)), 0);
  const dailyGoal = 50;
  const dailyToday = state.dailyDate === new Date().toDateString() ? state.dailyXP : 0;
  const dailyPct = Math.min(100, Math.round((dailyToday / dailyGoal) * 100));
  const due = countDue(state.srs);

  // Boss à affronter : le rang le plus avancé déjà entamé (sinon le premier).
  const bossLevel: Level = [...LEVELS].reverse().find((lv) => (state.lessons[lv] ?? 0) > 0) ?? 'A1';

  // Prochaine quête : premier rang non terminé, à sa leçon courante.
  const nextQuest = (() => {
    for (const lv of LEVELS) {
      const total = lessonCount(lv);
      const done = state.lessons[lv] ?? 0;
      if (done < total) return { level: lv, index: done, lesson: lessonsFor(lv)[done] };
    }
    return null;
  })();

  const rankIdx = RANKS.reduce((acc, r, i) => (state.points >= r.min ? i : acc), 0);
  const rank = RANKS[rankIdx];
  const nextRank = RANKS[rankIdx + 1] ?? null;
  const rankPct = nextRank
    ? Math.min(100, Math.round(((state.points - rank.min) / (nextRank.min - rank.min)) * 100))
    : 100;


  return (
    <div className="home-dashboard">
      <div className="page-intro"><div><span className="eyebrow">LE CHÂTEAU · VOTRE QUARTIER GÉNÉRAL</span><h1>Une nouvelle page de votre aventure.</h1></div><span className="chapter-tag"><Compass size={15} /> A1 → C2</span></div>
      <section className="adventure-hero" aria-labelledby="adventure-title">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow"><span /> APPRENDRE. EXPLORER. CONQUÉRIR.</div>
          <h2 id="adventure-title">Forgez votre anglais.<br /><em>Bâtissez votre royaume.</em></h2>
          <p>Une quête à la fois, gagnez en confiance et donnez vie à votre royaume. Votre prochaine aventure commence par quelques mots.</p>
          <div className="hero-actions"><Button size="lg" onClick={() => nextQuest ? onResume(nextQuest.level, nextQuest.index, nextQuest.lesson) : navigate('learn')}><Play size={15} /> {lessonsDone ? 'Reprendre ma quête' : 'Commencer l’aventure'}<ArrowRight size={16} /></Button><button className="hero-link" onClick={() => navigate('island')}>Explorer le royaume <ArrowRight size={15} /></button></div>
          <div className="hero-footnote"><ShieldMark /> 95 quêtes · 6 niveaux · Un royaume à façonner</div>
        </div>
        <button className="hero-illustration" onClick={() => navigate('island')} aria-label="Explorer mon royaume">
          <img src={import.meta.env.BASE_URL + 'ts/map-medium.jpg'} alt="Carte en pixel art des îles du royaume" /><span className="map-compass">N<span>✧</span>S</span><span className="map-caption"><MapIcon size={16}/><span>L’archipel de Scriptoria<small>VOTRE MONDE À CONQUÉRIR</small></span><ArrowRight size={17}/></span>
        </button>
      </section>
      <section className="journey-stats" aria-label="Votre progression">
        <div className="journey-stat"><span className="stat-icon"><Swords size={19} /></span><div><strong>{state.points.toLocaleString('fr-FR')}</strong><span>Points d’expérience</span></div></div>
        <div className="journey-stat"><span className="stat-icon"><ScrollText size={19} /></span><div><strong>{lessonsDone}<small> / {TOTAL_LESSONS}</small></strong><span>Quêtes accomplies</span></div></div>
        <div className="journey-stat"><span className="stat-icon"><img src={uiUrl('icon_03.png')} alt="" /></span><div><strong>{state.coins.toLocaleString('fr-FR')}</strong><span>Pièces d’or</span></div></div>
        <div className="journey-rank"><img src={uiUrl(rank.avatar)} alt="" className="pixel" /><div><span>VOTRE TITRE</span><strong>{rank.name}</strong><div className="fine-progress" role="progressbar" aria-label="Progression vers le prochain titre" aria-valuenow={rankPct} aria-valuemin={0} aria-valuemax={100}><i style={{width: rankPct + '%'}} /></div><small>{nextRank ? (nextRank.min - state.points) + ' XP avant ' + nextRank.name : 'Titre suprême'}</small></div></div>
      </section>
      <div className="dashboard-columns">
        <section><div className="section-heading"><h2>Votre prochaine quête</h2><span>LE VOYAGE CONTINUE</span></div>
          <Card className="next-quest"><CardContent className="quest-card-content">
            <div className="quest-card-top"><span className="quest-seal"><ScrollText size={25} strokeWidth={1.3} /></span><span className="subtle-badge">{nextQuest ? LEVEL_INFO[nextQuest.level].name + ' · ' + nextQuest.level : 'Campagne terminée'}</span></div>
            <div className="eyebrow">{nextQuest ? 'QUÊTE ' + String(nextQuest.index + 1).padStart(2,'0') + ' · ' + (nextQuest.lesson.t === 'V' ? 'VOCABULAIRE' : 'GRAMMAIRE') : 'TOUTES NOS FÉLICITATIONS'}</div>
            <h3>{nextQuest?.lesson.title ?? 'Le royaume vous appartient.'}</h3>
            <p>{nextQuest ? 'Un nouveau savoir à maîtriser, une nouvelle étape à franchir.' : 'Poursuivez votre entraînement pour garder votre anglais bien affûté.'}</p>
            <Button onClick={() => nextQuest ? onResume(nextQuest.level, nextQuest.index, nextQuest.lesson) : navigate('learn')}>{nextQuest ? 'Ouvrir la quête' : 'Revoir mes quêtes'}<ArrowRight /></Button>
          </CardContent></Card>
        </section>
        <section><div className="section-heading"><h2>Un peu, chaque jour.</h2><Target size={18} /></div>
          <Card className="daily-card"><CardContent className="daily-content"><div><span className="eyebrow">OBJECTIF DU JOUR</span><h3>{dailyPct >= 100 ? 'Objectif accompli !' : 'Gardez votre élan.'}</h3><p>{dailyToday} / {dailyGoal} XP aujourd’hui</p></div><div className="daily-ring" style={{'--daily-progress': dailyPct + '%', background: 'conic-gradient(#a8874f ' + dailyPct + '%, #e8e3d8 0)'} as React.CSSProperties}><span>{dailyPct}<small>%</small></span></div></CardContent></Card>
          <div className="practice-links"><button disabled={due === 0} onClick={onReview}><Brain size={19}/><span><strong>Entraînement</strong><small>{due > 0 ? due + ' cartes à réviser' : 'Vos révisions après la première quête'}</small></span><ArrowRight size={16}/></button><button onClick={() => onStartBoss(bossLevel)}><Swords size={19}/><span><strong>Défier le chevalier noir</strong><small>Mettez votre anglais à l’épreuve</small></span><ArrowRight size={16}/></button></div>
        </section>
      </div>
      <section className="campaign-section"><div className="section-heading"><div><span className="eyebrow">VOTRE CAMPAGNE</span><h2>De l’écuyer au roi.</h2></div><button className="text-link" onClick={() => navigate('learn')}>Toutes les quêtes <ArrowRight size={15}/></button></div>
        <div className="rank-grid">{LEVELS.map((lv, i) => { const done = Math.min(state.lessons[lv] ?? 0, lessonCount(lv)); const locked = !isDev && i > 0 && (state.lessons[LEVELS[i-1]] ?? 0) === 0; return <button key={lv} disabled={locked} onClick={() => openLevel(lv)} className={'rank-card ' + (locked ? 'rank-locked' : 'rank-open')} title={locked ? 'Avancez dans le rang précédent pour débloquer' : 'Ouvrir les quêtes'}><span className="rank-level">{lv}{locked ? <Lock size={12}/> : done >= lessonCount(lv) ? <Check size={13}/> : <Flag size={13}/>}</span><img src={uiUrl(LEVEL_INFO[lv].avatar)} alt="" className="pixel"/><strong>{LEVEL_INFO[lv].name}</strong><small>{done} / {lessonCount(lv)} quêtes</small><span className="fine-progress"><i style={{width: done / lessonCount(lv) * 100 + '%'}}/></span></button>;})}</div>
      </section>
      <section className="lore-scroll" aria-labelledby="lore-title">
        <span className="lore-seal"><ScrollText size={26} strokeWidth={1.3} /></span>
        <div className="lore-body">
          <span className="eyebrow">POURQUOI « SCRIPTORIA » ?</span>
          <h2 id="lore-title">Le nom vient des <em>scriptoria</em> médiévaux.</h2>
          <p>Au Moyen Âge, le <strong>scriptorium</strong> était la salle des monastères où les moines copistes recopiaient et enluminaient les manuscrits, à la main, mot après mot. C’était le cœur du savoir : on y préservait et transmettait les langues.</p>
          <p>Ici, c’est votre scriptorium à vous. Chaque quête ajoute un mot, une tournure, une page à votre maîtrise de l’anglais — jusqu’à bâtir tout un royaume de savoir.</p>
        </div>
      </section>
      <button className="grimoire-strip" onClick={() => navigate('dictionary')}><BookOpen size={24} strokeWidth={1.4}/><span><strong>Les mots sont vos meilleures armes.</strong><small>Un mot à découvrir ? Ouvrez votre grimoire.</small></span><ArrowRight size={20}/></button>
    </div>
  );
}
function ShieldMark() { return <Swords size={13} strokeWidth={1.5}/>; }
