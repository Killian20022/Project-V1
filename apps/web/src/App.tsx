import { useEffect, useRef, useState } from 'react';
import { Layout } from './components/Layout';
import { api } from './lib/api';
import { completeLesson, loadGameState, saveGameState } from './lib/state';
import { AccountPage } from './pages/AccountPage';
import { DictionaryPage } from './pages/DictionaryPage';
import { ExercisePage } from './pages/ExercisePage';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { LessonPage } from './pages/LessonPage';
import { IslandPage, ShopPage, TrophiesPage } from './pages/WorldPages';
import type { GameState, Lesson, Level, Page } from './types';

type LessonSelection = { level: Level; index: number; lesson: Lesson };

export default function App() {
  const [state, setState] = useState<GameState>(loadGameState);
  const [page, setPage] = useState<Page>('home');
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [lesson, setLesson] = useState<LessonSelection | null>(null);
  const [exercising, setExercising] = useState(false);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('eq_token'));
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem('eq_email'));
  const hydrated = useRef(false);

  useEffect(() => {
    document.body.classList.toggle('light', !state.dark);
    saveGameState(state);
    if (!token || !hydrated.current) return;
    const timeout = window.setTimeout(() => api.saveProgress(token, state).catch(() => undefined), 700);
    return () => window.clearTimeout(timeout);
  }, [state, token]);

  useEffect(() => {
    if (!token) { hydrated.current = false; return; }
    api.progress(token).then(remote => {
      if (remote?.state) setState(current => ({ ...current, ...remote.state }));
      else return api.saveProgress(token, state);
    }).then(() => { hydrated.current = true; }).catch(() => { hydrated.current = true; });
  }, [token]);

  function navigate(next: Page) {
    setPage(next); setLesson(null); setExercising(false); setResult(null);
  }

  function openLevel(level: Level) { setSelectedLevel(level); setPage('learn'); setLesson(null); }

  function finishLesson(correct: number, total: number) {
    if (!lesson) return;
    setState(current => completeLesson(current, lesson.level, lesson.index, correct, total));
    setResult({ correct, total }); setExercising(false);
  }

  let content: React.ReactNode;
  if (exercising && lesson) content = <ExercisePage {...lesson} onFinish={finishLesson} onQuit={() => setExercising(false)} />;
  else if (result && lesson) content = <section className="result card"><div className="reward-emoji">{result.correct === result.total ? '★' : result.correct / result.total >= .7 ? '✓' : '↻'}</div><h2 className="title">Leçon terminée !</h2><div className="score">{result.correct}/{result.total}</div><p className="sub">Ta progression et tes récompenses ont été enregistrées.</p><button className="btn btn-primary full" onClick={() => { setResult(null); setLesson(null); setPage('learn'); }}>Retour au parcours</button></section>;
  else if (lesson) content = <LessonPage {...lesson} onBack={() => setLesson(null)} onStart={() => setExercising(true)} />;
  else if (page === 'home') content = <HomePage state={state} navigate={navigate} openLevel={openLevel} />;
  else if (page === 'learn') content = <LearnPage state={state} selectedLevel={selectedLevel} onSelectLevel={setSelectedLevel} onOpenLesson={(level, index, selectedLesson) => setLesson({ level, index, lesson: selectedLesson })} />;
  else if (page === 'dictionary') content = <DictionaryPage token={token} />;
  else if (page === 'shop') content = <ShopPage state={state} update={setState} />;
  else if (page === 'island') content = <IslandPage state={state} />;
  else if (page === 'trophies') content = <TrophiesPage state={state} />;
  else content = <AccountPage token={token} email={email} onSignedIn={(newToken, newEmail) => { localStorage.setItem('eq_token', newToken); localStorage.setItem('eq_email', newEmail); setToken(newToken); setEmail(newEmail); }} onSignedOut={() => { localStorage.removeItem('eq_token'); localStorage.removeItem('eq_email'); setToken(null); setEmail(null); }} />;

  return <Layout state={state} page={page} onNavigate={navigate} onTheme={() => setState(current => ({ ...current, dark: !current.dark }))}>{content}</Layout>;
}
