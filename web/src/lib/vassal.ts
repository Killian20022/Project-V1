// Vassalité — « Le Tribut ».
// Quand ton dernier château tombe, le vainqueur ne rase pas : il plante sa bannière et prélève
// une part de chaque récolte. Rien n'est détruit, mais l'or file. Deux façons de briser le joug :
// payer la rançon en terminant des quêtes d'anglais, ou raser le dernier château du suzerain.
import type { GameState } from '../types';
import type { ResKind } from './world';

/** Part de chaque récolte détournée vers le suzerain. */
export const TRIBUTE_SHARE = 1 / 3;
/** Nombre de quêtes à terminer, à partir de la chute, pour payer la rançon royale. */
export const RANSOM_QUESTS = 5;

/** Quêtes restant à terminer pour racheter ta liberté (0 = la rançon est payée). */
export function ransomLeft(state: GameState, questsDone: number): number {
  const v = state.vassal;
  return v ? Math.max(0, v.atQuests + RANSOM_QUESTS - questsDone) : 0;
}

/**
 * Applique le tribut à un lot récolté. L'arriéré fractionnaire est reporté dans `carry` (muté) :
 * sans lui, un tiers de lots de 1 ou 2 serait arrondi à 0 et le suzerain ne prélèverait jamais rien.
 */
export function levyTribute(kind: ResKind, amount: number, carry: Record<ResKind, number>): number {
  carry[kind] += amount * TRIBUTE_SHARE;
  const take = Math.min(amount, Math.floor(carry[kind]));
  carry[kind] -= take;
  return take;
}

/** Fin du vassalage : le tribut accumulé revient d'un bloc, et le haut fait se débloque. */
export function breakYoke(state: GameState): GameState {
  const v = state.vassal;
  if (!v) return state;
  return {
    ...state,
    vassal: null,
    coins: state.coins + v.tribute.gold,
    resources: {
      wood: (state.resources?.wood ?? 0) + v.tribute.wood,
      food: (state.resources?.food ?? 0) + v.tribute.food,
    },
    stats: { ...state.stats, yokesBroken: (state.stats.yokesBroken ?? 0) + 1 },
  };
}
