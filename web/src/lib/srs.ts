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

// ---------- Cartes de MOT ----------
// Le préfixe « w| » ne peut entrer en collision avec aucune carte de phrase : celles-ci sont
// toutes préfixées par un niveau (« A1| », « B2| »…). Une sauvegarde existante est donc intacte.
export function wordCardId(word: string): string {
  return `w|${word.toLowerCase()}`;
}

/** Palier de Leitner à partir duquel on considère un mot comme ACQUIS (revu à 7 jours au moins). */
export const KNOWN_BOX = 3;

/** Ajoute au pool les mots d'un palier terminé, sans jamais réinitialiser un mot déjà connu. */
export function addWordCards(
  srs: Record<string, SrsCard>,
  words: readonly { w: string; fr: string; cefr: Level; pos: string; theme?: string }[],
): Record<string, SrsCard> {
  const now = Date.now();
  const next = { ...srs };
  for (const word of words) {
    const id = wordCardId(word.w);
    if (!next[id])
      next[id] = {
        id,
        level: word.cefr,
        en: word.w,
        fr: word.fr,
        kind: 'word',
        pos: word.pos,
        theme: word.theme,
        box: 0,
        due: now,
        lapses: 0,
        last: 0,
      };
  }
  return next;
}

/** Mots rencontrés (toutes boîtes) et mots ACQUIS — c'est le compteur « X / N mots ». */
export function wordStats(srs: Record<string, SrsCard>): { seen: number; known: number } {
  const cards = Object.values(srs).filter((c) => c.kind === 'word');
  return { seen: cards.length, known: cards.filter((c) => c.box >= KNOWN_BOX).length };
}

/** Mots acquis d'un thème donné, pour la barre de progression de sa page. */
export function knownInTheme(srs: Record<string, SrsCard>, words: readonly { w: string }[]): number {
  return words.filter((word) => (srs[wordCardId(word.w)]?.box ?? -1) >= KNOWN_BOX).length;
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
