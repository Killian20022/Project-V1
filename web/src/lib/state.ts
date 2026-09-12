import type { GameState, Level, SavedWord } from '../types';

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
  trophies: [],
  stats: {},
  dailyXP: 0,
  dailyDate: null,
  sound: true,
  unlocks: [],
  badges: [],
  completed: [],
};

export function loadGameState(): GameState {
  try {
    const saved = localStorage.getItem('eq_v4');
    if (!saved) return DEFAULT_STATE;
    const parsed = JSON.parse(saved) as Partial<GameState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      lessons: { ...DEFAULT_STATE.lessons, ...(parsed.lessons ?? {}) },
      stats: { ...DEFAULT_STATE.stats, ...(parsed.stats ?? {}) },
      island: parsed.island ?? [],
      trophies: parsed.trophies ?? [],
    };
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
