import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { completeBusiness, completeExam, completeLesson, completePractice, loadGameState, migrateState, saveGameState } from '@/lib/state';
import { businessModules } from '@/lib/content';
import type { GrammarEntry } from '@/lib/content';
import { addCards, addWordCards, applyReview, countDue, dueCards } from '@/lib/srs';
import { buildReviewQuestion, buildWordSession, shuffle } from '@/lib/exercises';
import type { Question } from '@/lib/exercises';
import { loadRemoteProgress, saveRemoteProgress } from '@/lib/progressSync';
import { HomePage } from '@/pages/HomePage';
import { LearnPage } from '@/pages/LearnPage';
import { LessonPage } from '@/pages/LessonPage';
import { ExercisePage } from '@/pages/ExercisePage';
import { IslandPage, ShopPage, TrophiesPage } from '@/pages/WorldPages';
import { DictionaryPage } from '@/pages/DictionaryPage';
import { BusinessPage } from '@/pages/BusinessPage';
import { GrammarPage } from '@/pages/GrammarPage';
import { BossPage } from '@/pages/BossPage';
import { ExamHubPage } from '@/pages/ExamHubPage';
import { ExamPage } from '@/pages/ExamPage';
import { VocabularyPage } from '@/pages/VocabularyPage';
import { TOEIC_BANKS, bankById, passageById } from '@/data/toeic';
import { DRILL_SIZE, drillItems } from '@/lib/campaign';
import type { CampaignStep } from '@/lib/campaign';
import { toQuestion } from '@/lib/toeic';
import type { ToeicExam } from '@/lib/toeic';
import { themeByKey } from '@/data/lexicon';
import { stepId, stepsOf, type WordEntry } from '@/lib/lexicon';
import type { BusinessModule, ExamAttempt, GameState, Lesson, Level, Page, SrsCard } from './types';

// bizId → module Business (complétion à part). practice → entraînement libre
// (Hub Grammaire) qui n'avance pas la campagne. Sinon : mission de campagne.
type LessonSelection = { level: Level; index: number; lesson: Lesson; bizId?: string; practice?: boolean };
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
  // Épreuve blanche en cours, et entraînement libre au format examen (qui, lui, réutilise le
  // moteur de leçon : ce sont des QCM ordinaires une fois le chrono retiré).
  const [exam, setExam] = useState<ToeicExam | null>(null);
  // `doneId` n'existe que pour les entraînements lancés DEPUIS la campagne : c'est lui qui, une fois
  // la série réussie, coche l'étape du chapitre. L'entraînement libre du hub TOEIC n'en a pas et ne
  // marque donc rien, comme avant.
  const [drill, setDrill] = useState<{ bankId: string; questions: Question[]; doneId?: string; badge?: string } | null>(null);
  // Palier de vocabulaire en cours : les mots du palier + la séance construite à partir d'eux.
  const [vocab, setVocab] = useState<{ themeKey: string; step: number; words: WordEntry[]; questions: Question[] } | null>(null);
  const { user, isLoaded } = useUser();
  const hydrated = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.dark);
    saveGameState(state);
  }, [state]);

  // Sauvegarde forcée à la fermeture / mise en arrière-plan : rien n'est perdu en quittant le site.
  useEffect(() => {
    const flush = () => {
      saveGameState(stateRef.current);
      if (user && hydrated.current) saveRemoteProgress(user.id, stateRef.current);
    };
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [user]);

  // Chaque nouvel écran commence en haut, même après une action en bas de page.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page, lesson, exercising, result, reviewResult, selectedLevel, boss, reviewSession]);

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
          setState((current) => {
            // On ne remplace le local par le serveur QUE si le serveur est plus récent.
            // Sinon (local plus récent ou égal), on garde le local et on le renvoie au serveur :
            // fini le « tout reset » quand la sauvegarde distante était périmée.
            const localAt = current.savedAt ?? 0;
            const remoteAt = (remote as { savedAt?: number }).savedAt ?? 0;
            if (remoteAt > localAt) return migrateState({ ...current, ...remote });
            saveRemoteProgress(user.id, current);
            return current;
          });
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
    setExam(null);
    setDrill(null);
    setVocab(null);
  }

  // Palier de vocabulaire : une question par mot, du plus simple au plus exigeant selon le tirage
  // (reconnaître / employer / retrouver).
  function startVocabStep(themeKey: string, step: number) {
    const theme = themeByKey(themeKey);
    const words = theme ? stepsOf(theme)[step] : undefined;
    if (!words?.length) return;
    setVocab({ themeKey, step, words: [...words], questions: buildWordSession(words) });
  }

  // Entraînement libre au format examen : une banque d'items devient une liste de QCM, jouée par
  // ExercisePage comme une révision (pas de cœurs, correction immédiate).
  function startDrill(bankId: string) {
    const bank = bankById(bankId);
    if (!bank) return;
    // `.map(toQuestion)` passerait l'INDICE en second argument : il faut une lambda explicite pour
    // lui donner le passage et non le rang de la question.
    setDrill({ bankId, questions: shuffle(bank.items).map((it) => toQuestion(it, passageById(it.passage))) });
  }

  /**
   * Ouvre une étape de chapitre autre qu'une leçon : palier de vocabulaire, entraînement au format
   * TOEIC, ou module de formules. Les leçons passent par `onOpenLesson`, inchangé.
   */
  function openCampaignStep(level: Level, step: CampaignStep) {
    if (step.kind === 'vocab' && step.themeKey && step.stepIndex !== undefined) {
      startVocabStep(step.themeKey, step.stepIndex);
      return;
    }
    if (step.kind === 'business' && step.bizId) {
      const module = businessModules().find((m) => m.id === step.bizId);
      if (module) openBusiness(module);
      return;
    }
    if (step.kind !== 'toeic') return;

    // Deux sortes d'entraînements : par ÉTIQUETTE (le point de grammaire de la leçon) ou par PARTIE
    // entière découpée en séries (les chapitres de compréhension). `round` garantit que la série 2
    // ne repose pas les questions de la série 1.
    const pool = step.parts?.length
      ? TOEIC_BANKS.filter((b) => step.parts!.includes(b.part)).flatMap((b) => b.items)
      : drillItems(step.tags ?? []);
    const from = (step.round ?? 0) * DRILL_SIZE;
    const items = (step.parts?.length ? pool.slice(from, from + DRILL_SIZE) : shuffle(pool).slice(0, DRILL_SIZE));
    if (!items.length) return;
    setDrill({
      bankId: 'campagne',
      doneId: step.id,
      badge: `🎓 ${step.label}`,
      questions: shuffle(items).map((it) => toQuestion(it, passageById(it.passage))),
      });
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

  // Ouvre un module Business : réutilise le flux leçon (LessonPage → ExercisePage)
  // mais marqué bizId pour router la complétion vers completeBusiness.
  function openBusiness(module: BusinessModule) {
    setPage('business');
    setLesson({ level: module.level, index: 0, lesson: module, bizId: module.id });
    setExercising(false);
    setResult(null);
  }

  // Ouvre une fiche du Hub Grammaire (mode practice : pas d'avance campagne).
  function openGrammar(entry: GrammarEntry) {
    setPage('grammar');
    setLesson({ level: entry.level, index: entry.index, lesson: entry.lesson, practice: true });
    setExercising(false);
    setResult(null);
  }

  function finishLesson(correct: number, total: number, maxCombo = 0) {
    if (!lesson) return;
    const sel = lesson;
    setState((current) => {
      // Les phrases de la leçon terminée entrent dans le pool de révision.
      const withCards = sel.lesson.practice?.length
        ? { ...current, srs: addCards(current.srs, sel.level, sel.lesson.practice) }
        : current;
      // Module Business : complétion à part (ne touche pas la campagne).
      if (sel.bizId) return completeBusiness(withCards, sel.bizId, correct, total, maxCombo);
      // Entraînement libre depuis le Hub Grammaire : XP + SRS, sans avance campagne.
      if (sel.practice) return completePractice(withCards, correct, total, maxCombo);
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
  } else if (exam) {
    content = (
      <ExamPage
        exam={exam}
        onQuit={() => setExam(null)}
        onFinish={(attempt: ExamAttempt) => {
          setState((current) => completeExam(current, attempt));
          setExam(null);
        }}
      />
    );
  } else if (vocab) {
    content = (
      <ExercisePage
        level={vocab.words[0].cefr}
        reviewQuestions={vocab.questions}
        badge="📖 Vocabulaire"
        onFinish={(correct, total, maxCombo) => {
          const finished = vocab;
          setState((current) => {
            // Les mots du palier entrent au pool de révision : c'est là que « mots acquis »
            // commence à monter. Un mot déjà connu n'est jamais réinitialisé.
            const withWords = {
              ...current,
              srs: addWordCards(
                current.srs,
                finished.words.map((w) => ({ w: w.w, fr: w.fr, cefr: w.cefr, pos: w.pos, theme: finished.themeKey })),
              ),
            };
            const done = stepId(finished.themeKey, finished.step);
            const marked = withWords.completed.includes(done)
              ? withWords
              : { ...withWords, completed: [...withWords.completed, done] };
            return completePractice(marked, correct, total, maxCombo);
          });
          setVocab(null);
        }}
        onQuit={() => setVocab(null)}
      />
    );
  } else if (drill) {
    content = (
      <ExercisePage
        level={bankById(drill.bankId)?.items[0]?.cefr ?? 'B1'}
        reviewQuestions={drill.questions}
        badge={drill.badge ?? '🎓 Entraînement'}
        onFinish={(correct, total, maxCombo) => {
          setState((current) => {
            const next = completePractice(current, correct, total, maxCombo);
            // L'étape ne se coche qu'à partir de 60 % — le même seuil qu'une épreuve blanche
            // (`EXAM_PASS`). On récompense le travail, pas le fait d'avoir cliqué jusqu'au bout.
            if (!drill.doneId || correct / Math.max(1, total) < 0.6) return next;
            if (next.completed?.includes(drill.doneId)) return next;
            return { ...next, completed: [...(next.completed ?? []), drill.doneId] };
          });
          setDrill(null);
        }}
        onQuit={() => setDrill(null)}
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
          <h2 className="mt-4 text-3xl">Entraînement terminé !</h2>
          <div className="font-display mt-2 text-5xl text-primary">
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
          <h2 className="mt-4 text-3xl">Quête accomplie !</h2>
          <div className="font-display mt-2 text-5xl text-primary">
            {result.correct}/{result.total}
          </div>
          <p className="mt-2 text-muted-foreground">Ton butin (XP et pièces d’or) a été ajouté à ton trésor.</p>
          <Button
            className="mt-6 w-full"
            size="lg"
            onClick={() => {
              const back = lesson?.bizId ? 'business' : lesson?.practice ? 'grammar' : 'learn';
              setResult(null);
              setLesson(null);
              setPage(back);
            }}
          >
            Retour aux quêtes
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
        onOpenStep={openCampaignStep}
        onReview={(level) => startReview(level)}
        onBoss={(level) => startBoss(level)}
      />
    );
  } else if (page === 'vocab') {
    content = <VocabularyPage state={state} onStartStep={startVocabStep} />;
  } else if (page === 'business') {
    content = <BusinessPage state={state} onOpenModule={openBusiness} />;
  } else if (page === 'grammar') {
    content = <GrammarPage onOpenGrammar={openGrammar} />;
  } else if (page === 'exam') {
    content = <ExamHubPage state={state} onStartExam={setExam} onStartDrill={startDrill} />;
  } else if (page === 'island') {
    content = <IslandPage state={state} setState={setState} navigate={navigate} />;
  } else if (page === 'shop') {
    content = <ShopPage state={state} setState={setState} navigate={navigate} />;
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
      <Layout
        page={page}
        onNavigate={navigate}
        state={state}
        onToggleDark={() => setState((current) => ({ ...current, dark: !current.dark }))}
        onAddCoins={() => setState((current) => ({ ...current, coins: current.coins + 1000 }))}
      >
        {content}
      </Layout>
    </>
  );
}
