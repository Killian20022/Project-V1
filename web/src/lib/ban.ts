// Le Ban royal — l'anglais arme le royaume.
// Chaque quête d'anglais terminée donne une « levée ». Une levée lève un soldat sans or, sans bois
// et SANS le bâtiment normalement requis : c'est le raccourci que l'étude t'offre sur l'arbre
// technologique. Seule la population reste une contrainte — un royaume ne nourrit pas une armée
// qu'il ne loge pas.
import type { GameState } from '../types';
import { applyFaction, type Faction } from '../data/shop';

/** Unités qu'on peut lever au ban, dans l'ordre d'affichage. */
export const BAN_UNITS = [
  { base: 'guerrier', name: 'Guerrier', blurb: 'Mêlée robuste, le fer de lance du ban.' },
  { base: 'lancier', name: 'Lancier', blurb: 'Frappe plus fort, portée un peu plus longue.' },
  { base: 'archer', name: 'Archer', blurb: 'Tire de loin, fragile au corps à corps.' },
] as const;

/** Levées encore disponibles : une par quête d'anglais terminée, moins celles déjà dépensées. */
export function banAvailable(state: GameState, questsDone: number): number {
  return Math.max(0, questsDone - (state.banUsed ?? 0));
}

/**
 * Lève un soldat : il part dans l'inventaire (comme un achat au Marché), à poser ensuite sur la
 * carte. Renvoie l'état inchangé s'il ne reste aucune levée.
 */
export function levy(state: GameState, base: string, faction: Faction, questsDone: number): GameState {
  if (banAvailable(state, questsDone) < 1) return state;
  // Toujours passer par `applyFaction` : la couleur ne se concatène jamais à la main.
  const id = applyFaction(base, faction);
  const k = `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    ...state,
    banUsed: (state.banUsed ?? 0) + 1,
    inventory: [...(state.inventory ?? []), { k, id }],
    stats: { ...state.stats, levied: (state.stats.levied ?? 0) + 1 },
  };
}
