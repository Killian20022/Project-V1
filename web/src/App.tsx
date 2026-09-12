import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { completeLesson, loadGameState, saveGameState } from '@/lib/state';
import { HomePage } from '@/pages/HomePage';
import { LearnPage } from '@/pages/LearnPage';
import { LessonPage } from '@/pages/LessonPage';
import { ExercisePage } from '@/pages/ExercisePage';
import { IslandPage, ShopPage, TrophiesPage } from '@/pages/WorldPages';
import { DictionaryPage } from '@/pages/DictionaryPage';
import type { GameState, Lesson, Level, Page } from './types';

type LessonSelection = { level: Level; index: number; lesson: Lesson };

export default function App() {
  const [state, setState] = useState<GameState>(loadGameState);
  const [page, setPage] = useState<Page>('home');
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [lesson, setLesson] = useState<LessonSelection | null>(null);
  const [exercising, setExercising] = useState(false);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.dark);
    saveGameState(state);
  }, [state]);

  // Mise à jour de la série quotidienne au démarrage
  useEffect(() => {
    const today = new Date().toDateString();
    setState((current) => {
      if (current.lastActive === today) return current;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const streak = current.lastActive === yesterday ? current.streak + 1 : 1;
      return { ...current, streak: Math.max(1, streak), lastActive: today };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function navigate(next: Page) {
    setPage(next);
    setLesson(null);
    setExercising(false);
    setResult(null);
  }

  function openLevel(level: Level) {
    setSelectedLevel(level);
    setPage('learn');
    setLesson(null);
  }

  function finishLesson(correct: number, total: number, maxCombo = 0) {
    if (!lesson) return;
    setState((current) => completeLesson(current, lesson.level, lesson.index, correct, total, maxCombo));
    setResult({ correct, total });
    setExercising(false);
  }

  let content: React.ReactNode;

  if (exercising && lesson) {
    content = <ExercisePage {...lesson} onFinish={finishLesson} onQuit={() => setExercising(false)} />;
  } else if (result && lesson) {
    const ratio = result.correct / Math.max(1, result.total);
    content = (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="p-8">
          <div className="text-5xl">{ratio === 1 ? '🏆' : ratio >= 0.7 ? '✅' : '🔁'}</div>
          <h2 className="mt-4 text-2xl font-bold">Leçon terminée !</h2>
          <div className="mt-2 text-4xl font-black text-primary">
            {result.correct}/{result.total}
          </div>
          <p className="mt-2 text-muted-foreground">Ta progression et tes récompenses ont été enregistrées.</p>
          <Button
            className="mt-6 w-full"
            size="lg"
            onClick={() => {
              setResult(null);
              setLesson(null);
              setPage('learn');
            }}
          >
            Retour au parcours
          </Button>
        </CardContent>
      </Card>
    );
  } else if (lesson) {
    content = <LessonPage {...lesson} onBack={() => setLesson(null)} onStart={() => setExercising(true)} />;
  } else if (page === 'home') {
    content = <HomePage state={state} navigate={navigate} openLevel={openLevel} />;
  } else if (page === 'learn') {
    content = (
      <LearnPage
        state={state}
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
        onOpenLesson={(level, index, selectedLesson) => setLesson({ level, index, lesson: selectedLesson })}
      />
    );
  } else if (page === 'island') {
    content = <IslandPage state={state} navigate={navigate} />;
  } else if (page === 'shop') {
    content = <ShopPage state={state} setState={setState} />;
  } else if (page === 'trophies') {
    content = <TrophiesPage state={state} />;
  } else if (page === 'dictionary') {
    content = <DictionaryPage />;
  } else {
    content = <HomePage state={state} navigate={navigate} openLevel={openLevel} />;
  }

  return (
    <Layout page={page} onNavigate={navigate} state={state}>
      {content}
    </Layout>
  );
}
