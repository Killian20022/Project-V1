import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { completeLesson, loadGameState, saveGameState } from '@/lib/state';
import { addCards, applyReview, countDue, dueCards } from '@/lib/srs';
import { buildReviewQuestion, shuffle } from '@/lib/exercises';
import type { Question } from '@/lib/exercises';
import { loadRemoteProgress, saveRemoteProgress } from '@/lib/progressSync';
import { HomePage } from '@/pages/HomePage';
import { LearnPage } from '@/pages/LearnPage';
import { LessonPage } from '@/pages/LessonPage';
import { ExercisePage } from '@/pages/ExercisePage';
import { IslandPage, ShopPage, TrophiesPage } from '@/pages/WorldPages';
import { DictionaryPage } from '@/pages/DictionaryPage';
import { BossPage } from '@/pages/BossPage';
import { HyperspaceIntro } from '@/components/HyperspaceIntro';
import type { GameState, Lesson, Level, Page, SrsCard } from './types';

type LessonSelection = { level: Level; index: number; lesson: Lesson };
type ReviewSession = { items: { card: SrsCard; question: Question }[] };

export default function App() {
  const [state, setState] = useState<GameState>(loadGameState);
  const [page, setPage] = useState<Page>('home');
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [lesson, setLesson] = useState<LessonSelection | null>(null);
  const [exercising, setExercising] = useState(false);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null);
  const [reviewResult, setReviewResult] = useState<{ correct: number; total: number } | null>(null);
  const [boss, setBoss] = useState<Level | null>(null);
  const { user, isLoaded } = useUser();
  const hydrated = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.dark);
    saveGameState(state);
  }, [state]);

  // À la connexion : charger la progression du compte (source de vérité entre appareils)
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      hydrated.current = false;
      return;
    }
    let cancelled = false;
    loadRemoteProgress(user.id)
      .then((remote) => {
        if (cancelled) return;
        if (remote) {
          setState((current) => ({ ...current, ...remote }));
        } else {
          // Aucune sauvegarde en ligne : on envoie la progression locale actuelle
          setState((current) => {
            saveRemoteProgress(user.id, current);
            return current;
          });
        }
        hydrated.current = true;
      })
      .catch(() => {
        hydrated.current = true;
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  // Sauvegarde en ligne (anti-rebond) quand l'état change et qu'on est connecté
  useEffect(() => {
    if (!user || !hydrated.current) return;
    const timeout = window.setTimeout(() => {
      saveRemoteProgress(user.id, state);
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [state, user]);

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
    setReviewSession(null);
    setReviewResult(null);
    setBoss(null);
  }

  // Lance un duel de boss pour un grade donné.
  function startBoss(level: Level) {
    setLesson(null);
    setExercising(false);
    setResult(null);
    setReviewSession(null);
    setReviewResult(null);
    setBoss(level);
  }

  function openLevel(level: Level) {
    setSelectedLevel(level);
    setPage('learn');
    setLesson(null);
  }

  function finishLesson(correct: number, total: number, maxCombo = 0) {
    if (!lesson) return;
    const sel = lesson;
    setState((current) => {
      // Les phrases de la leçon terminée entrent dans le pool de révision.
      const withCards = sel.lesson.practice?.length
        ? { ...current, srs: addCards(current.srs, sel.level, sel.lesson.practice) }
        : current;
      return completeLesson(withCards, sel.level, sel.index, correct, total, maxCombo);
    });
    setResult({ correct, total });
    setExercising(false);
  }

  // Lance une session de révision : cartes dues (tous niveaux, ou un seul), plafonnées à 20.
  function startReview(level: Level | null = null) {
    const due = dueCards(state.srs, Date.now(), { level, max: 20 });
    if (!due.length) return;
    const items = shuffle(due).map((card) => ({ card, question: buildReviewQuestion(card) }));
    setLesson(null);
    setExercising(false);
    setResult(null);
    setReviewResult(null);
    setReviewSession({ items });
  }

  let content: React.ReactNode;

  if (boss) {
    content = (
      <BossPage
        level={boss}
        onExit={() => setBoss(null)}
        onVictory={(r) =>
          setState((current) => ({
            ...current,
            points: current.points + r.xp,
            coins: current.coins + r.coins,
            badges: current.badges.includes(`boss-${boss}`) ? current.badges : [...current.badges, `boss-${boss}`],
          }))
        }
      />
    );
  } else if (reviewSession) {
    content = (
      <ExercisePage
        level={reviewSession.items[0].card.level}
        reviewQuestions={reviewSession.items.map((it) => it.question)}
        onGrade={(i, success) =>
          setState((current) => ({ ...current, srs: applyReview(current.srs, reviewSession.items[i].card, success) }))
        }
        onFinish={(correct, total) => {
          setState((current) => ({
            ...current,
            points: current.points + correct * 5,
            coins: current.coins + 5,
            stats: {
              ...current.stats,
              reviews: (current.stats.reviews ?? 0) + total,
              correct: (current.stats.correct ?? 0) + correct,
            },
          }));
          setReviewResult({ correct, total });
          setReviewSession(null);
        }}
        onQuit={() => setReviewSession(null)}
      />
    );
  } else if (reviewResult) {
    const remaining = countDue(state.srs);
    content = (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="p-8">
          <div className="text-5xl">🧠</div>
          <h2 className="mt-4 text-2xl font-bold">Révision terminée !</h2>
          <div className="mt-2 text-4xl font-black text-primary">
            {reviewResult.correct}/{reviewResult.total}
          </div>
          <p className="mt-2 text-muted-foreground">Les cartes ont été reprogrammées selon tes réponses.</p>
          <div className="mt-6 flex flex-col gap-2">
            {remaining > 0 && (
              <Button
                size="lg"
                onClick={() => {
                  setReviewResult(null);
                  startReview(null);
                }}
              >
                Réviser encore ({remaining})
              </Button>
            )}
            <Button
              variant={remaining > 0 ? 'outline' : 'default'}
              size="lg"
              onClick={() => {
                setReviewResult(null);
                setPage('home');
              }}
            >
              Retour à l'accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  } else if (exercising && lesson) {
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
    content = (
      <HomePage
        state={state}
        navigate={navigate}
        openLevel={openLevel}
        onReview={() => startReview(null)}
        onResume={(level, index, selectedLesson) => setLesson({ level, index, lesson: selectedLesson })}
        onStartBoss={startBoss}
      />
    );
  } else if (page === 'learn') {
    content = (
      <LearnPage
        state={state}
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
        onOpenLesson={(level, index, selectedLesson) => setLesson({ level, index, lesson: selectedLesson })}
        onReview={(level) => startReview(level)}
        onBoss={(level) => startBoss(level)}
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
    content = (
      <HomePage
        state={state}
        navigate={navigate}
        openLevel={openLevel}
        onReview={() => startReview(null)}
        onResume={(level, index, selectedLesson) => setLesson({ level, index, lesson: selectedLesson })}
        onStartBoss={startBoss}
      />
    );
  }

  return (
    <>
      <HyperspaceIntro />
      <Layout
        page={page}
        onNavigate={navigate}
        state={state}
        onAddCoins={() => setState((current) => ({ ...current, coins: current.coins + 1000 }))}
      >
        {content}
      </Layout>
    </>
  );
}
