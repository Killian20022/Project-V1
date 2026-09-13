import type { Level, Sentence, SrsCard } from '../types';

const DAY = 86_400_000;

// Délais de Leitner par boîte (en ms). Réponse juste → on monte d'une boîte ;
// réponse fausse → on redescend d'une boîte. Plus la boîte est haute, plus la
// phrase revient rarement (car on la connaît bien).
export const INTERVALS = [10 * 60_000, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY, 90 * DAY];
export const MAX_BOX = INTERVALS.length - 1;

// Identifiant stable d'une carte, dérivé du niveau + de la phrase anglaise.
export function cardId(level: Level, en: string): string {
  return `${level}|${en}`;
}

// Ajoute au pool les phrases d'une leçon terminée, sans écraser une carte déjà
// présente (on ne réinitialise jamais la progression d'une phrase connue).
export function addCards(
  srs: Record<string, SrsCard>,
  level: Level,
  sentences: readonly Sentence[],
): Record<string, SrsCard> {
  const now = Date.now();
  const next = { ...srs };
  for (const s of sentences) {
    const id = cardId(level, s.en);
    if (!next[id]) {
      next[id] = { id, level, en: s.en, fr: s.fr, box: 0, due: now, lapses: 0, last: 0 };
    }
  }
  return next;
}

// Cartes à réviser maintenant (dues), triées de la plus ancienne à la plus
// récente, éventuellement filtrées par niveau et plafonnées.
export function dueCards(
  srs: Record<string, SrsCard>,
  now: number = Date.now(),
  opts: { level?: Level | null; max?: number } = {},
): SrsCard[] {
  let list = Object.values(srs).filter((c) => c.due <= now);
  if (opts.level) list = list.filter((c) => c.level === opts.level);
  list.sort((a, b) => a.due - b.due);
  if (opts.max && list.length > opts.max) list = list.slice(0, opts.max);
  return list;
}

// Nombre de cartes dues (pour le badge « Réviser (N) »).
export function countDue(
  srs: Record<string, SrsCard>,
  now: number = Date.now(),
  level?: Level | null,
): number {
  return Object.values(srs).filter((c) => c.due <= now && (!level || c.level === level)).length;
}

// Reprogramme une carte après une réponse (juste ou fausse).
export function review(card: SrsCard, success: boolean): SrsCard {
  const box = success ? Math.min(MAX_BOX, card.box + 1) : Math.max(0, card.box - 1);
  const now = Date.now();
  return {
    ...card,
    box,
    due: now + INTERVALS[box],
    lapses: card.lapses + (success ? 0 : 1),
    last: now,
  };
}

// Applique une révision dans le dictionnaire srs (sans mutation).
export function applyReview(
  srs: Record<string, SrsCard>,
  card: SrsCard,
  success: boolean,
): Record<string, SrsCard> {
  const updated = review(card, success);
  return { ...srs, [updated.id]: updated };
}
