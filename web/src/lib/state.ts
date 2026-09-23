import type { GameState, Level, SavedWord } from '../types';
import { SHOP_MAP } from '../data/shop';

// Anciens articles (thème précédent) : retirés de la carte et remboursés en pièces d'or.
const OLD_PRICES: Record<string, number> = {
  r2d2: 120, bb8: 160, stormtrooper: 180, boba: 240, chewie: 260, yoda: 320,
  tie: 140, xwing: 160, rancor: 200, bantha: 220, atat: 400,
  chicken: 40, cow: 60, farmer: 80, tree: 30, bush: 20, rock: 15, sunflower: 20,
  nest: 20, chest: 50, bridge: 40, coop: 60,
};

/** Retire les objets qui n'existent plus au marché et rembourse leur prix. */
export function migrateState(state: GameState): GameState {
  const placed = state.placed ?? [];
  const keep = placed.filter((p) => SHOP_MAP[p.id]);
  if (keep.length === placed.length && !(state.island ?? []).length) return state;
  const refund = placed
    .filter((p) => !SHOP_MAP[p.id])
    .reduce((sum, p) => sum + (OLD_PRICES[p.id] ?? 100), 0);
  return { ...state, placed: keep, island: [], coins: state.coins + refund };
}


export const DEFAULT_STATE: GameState = {
  points: 0,
  streak: 0,
  lastActive: null,
  lastDaily: null,
  dark: true,
  maxLevelIdx: 0,
  lessons: {},
  coins: 0,
  island: [],
  placed: [],
  trophies: [],
  stats: {},
  dailyXP: 0,
  dailyDate: null,
  sound: true,
  unlocks: [],
  badges: [],
  completed: [],
  srs: {},
};

export function loadGameState(): GameState {
  try {
    const saved = localStorage.getItem('eq_v4');
    if (!saved) return DEFAULT_STATE;
    const parsed = JSON.parse(saved) as Partial<GameState>;
    return migrateState({
      ...DEFAULT_STATE,
      ...parsed,
      lessons: { ...DEFAULT_STATE.lessons, ...(parsed.lessons ?? {}) },
      stats: { ...DEFAULT_STATE.stats, ...(parsed.stats ?? {}) },
      srs: { ...(parsed.srs ?? {}) },
      island: parsed.island ?? [],
      placed: parsed.placed ?? [],
      trophies: parsed.trophies ?? [],
    });
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveGameState(state: GameState) {
  localStorage.setItem('eq_v4', JSON.stringify(state));
}

export function completeLesson(
  state: GameState,
  level: Level,
  index: number,
  correct: number,
  total: number,
  maxCombo = 0,
): GameState {
  const firstCompletion = (state.lessons[level] ?? 0) <= index;
  const earnedXp = correct * 10;
  const earnedCoins = 10 + Math.round((correct / Math.max(1, total)) * 10) + (firstCompletion ? 5 : 0);
  const today = new Date().toDateString();
  const dailyXP = state.dailyDate === today ? state.dailyXP + earnedXp : earnedXp;
  const perfect = correct === total;
  return {
    ...state,
    points: state.points + earnedXp,
    coins: state.coins + earnedCoins,
    dailyDate: today,
    dailyXP,
    lastActive: today,
    lessons: { ...state.lessons, [level]: Math.max(state.lessons[level] ?? 0, index + 1) },
    maxLevelIdx: Math.max(state.maxLevelIdx, Math.min(5, Math.floor((index + 1) / 10))),
    stats: {
      ...state.stats,
      exercises: (state.stats.exercises ?? 0) + total,
      correct: (state.stats.correct ?? 0) + correct,
      perfect: (state.stats.perfect ?? 0) + (perfect ? 1 : 0),
      coinsEarned: (state.stats.coinsEarned ?? 0) + earnedCoins,
      bestCombo: Math.max(state.stats.bestCombo ?? 0, maxCombo),
    },
  };
}

// Complétion d'un module Business English. Ne touche PAS state.lessons (la
// progression de la campagne) : on marque simplement l'id dans
// state.completed et on crédite XP/pièces + stats. L'ajout des phrases au SRS
// est géré à part par l'appelant (addCards, comme pour une leçon classique).
export function completeBusiness(
  state: GameState,
  moduleId: string,
  correct: number,
  total: number,
  maxCombo = 0,
): GameState {
  const doneId = `biz:${moduleId}`;
  const firstCompletion = !state.completed.includes(doneId);
  const earnedXp = correct * 10;
  const earnedCoins = 10 + Math.round((correct / Math.max(1, total)) * 10) + (firstCompletion ? 5 : 0);
  const today = new Date().toDateString();
  const dailyXP = state.dailyDate === today ? state.dailyXP + earnedXp : earnedXp;
  const perfect = correct === total;
  return {
    ...state,
    points: state.points + earnedXp,
    coins: state.coins + earnedCoins,
    dailyDate: today,
    dailyXP,
    lastActive: today,
    completed: firstCompletion ? [...state.completed, doneId] : state.completed,
    stats: {
      ...state.stats,
      exercises: (state.stats.exercises ?? 0) + total,
      correct: (state.stats.correct ?? 0) + correct,
      perfect: (state.stats.perfect ?? 0) + (perfect ? 1 : 0),
      coinsEarned: (state.stats.coinsEarned ?? 0) + earnedCoins,
      bestCombo: Math.max(state.stats.bestCombo ?? 0, maxCombo),
      business: (state.stats.business ?? 0) + (firstCompletion ? 1 : 0),
    },
  };
}

// Entraînement libre (Hub Grammaire) : donne XP/pièces + alimente les stats,
// mais N'AVANCE PAS la campagne (state.lessons) — sinon on débloquerait des
// missions en avance. Le SRS est géré par l'appelant (addCards). Récompense
// volontairement plus faible qu'une mission (rejouable à l'infini).
export function completePractice(
  state: GameState,
  correct: number,
  total: number,
  maxCombo = 0,
): GameState {
  const earnedXp = correct * 5;
  const earnedCoins = 5;
  const today = new Date().toDateString();
  const dailyXP = state.dailyDate === today ? state.dailyXP + earnedXp : earnedXp;
  return {
    ...state,
    points: state.points + earnedXp,
    coins: state.coins + earnedCoins,
    dailyDate: today,
    dailyXP,
    lastActive: today,
    stats: {
      ...state.stats,
      exercises: (state.stats.exercises ?? 0) + total,
      correct: (state.stats.correct ?? 0) + correct,
      coinsEarned: (state.stats.coinsEarned ?? 0) + earnedCoins,
      bestCombo: Math.max(state.stats.bestCombo ?? 0, maxCombo),
      practice: (state.stats.practice ?? 0) + 1,
    },
  };
}

export function loadSavedWords(): SavedWord[] {
  try {
    const words = JSON.parse(localStorage.getItem('eq_words') ?? '[]') as Array<{ word: string; def?: string; definition?: string }>;
    return words.map(({ word, def, definition }) => ({ word, definition: definition ?? def ?? '' }));
  } catch {
    return [];
  }
}

export function saveWords(words: SavedWord[]) {
  localStorage.setItem('eq_words', JSON.stringify(words.map(({ word, definition }) => ({ word, def: definition }))));
}
