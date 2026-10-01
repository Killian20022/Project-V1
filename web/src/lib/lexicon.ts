// Le lexique : le MOT devient un objet de première classe.
//
// Jusqu'ici le site n'en avait aucun. Les leçons de vocabulaire portaient cinq paires
// (anglais, français) dans leur champ `forms` — 160 mots enseignés volontairement sur tout le
// site — et la révision espacée ne connaissait que des PHRASES. Impossible, dans ces conditions,
// de compter ce qu'on sait, donc impossible de viser un objectif de vocabulaire.
//
// Un mot porte ici tout ce qu'il faut pour l'enseigner ET pour le réviser : sa nature, sa
// traduction, son niveau, un exemple écrit POUR lui, ses formes fléchies (pour le retrouver dans
// le corpus de phrases) et, le cas échéant, le piège qui va avec.
import type { Level } from '../types';

/** Nature du mot. `phr` = locution ou verbe à particule (« hand in », « get along with »). */
export type Pos = 'n' | 'v' | 'adj' | 'adv' | 'phr';

export const POS_LABEL: Record<Pos, string> = {
  n: 'nom',
  v: 'verbe',
  adj: 'adjectif',
  adv: 'adverbe',
  phr: 'locution',
};

export interface WordEntry {
  w: string; // la forme vedette
  pos: Pos;
  fr: string; // traduction — la plus courante dans CE thème, pas toutes les acceptions
  cefr: Level;
  ex: { en: string; fr: string }; // un exemple écrit pour ce mot, dans son contexte de thème
  also?: readonly string[]; // formes fléchies, pour repérer le mot dans le corpus de phrases
  note?: string; // piège, faux ami, collocation à retenir
}

/** Grande famille de thèmes, pour que la page ne soit pas une liste de 36 cartes à plat. */
export interface Domain {
  key: string;
  label: string;
  blurb: string;
}

export interface Theme {
  key: string;
  label: string;
  blurb: string;
  domain: string; // clé d'un `Domain`
  // Objectif de mots pour ce thème. Déclaré même quand `words` est encore vide : c'est ce qui
  // permet d'afficher la carte COMPLÈTE du vocabulaire — ce qui est fait et ce qui reste — au
  // lieu de laisser croire que le site s'arrête au seul thème rempli.
  target: number;
  words: readonly WordEntry[];
}

/** Taille d'un palier. Dix mots : assez pour une séance, assez peu pour la finir. */
export const STEP_SIZE = 10;

const CEFR_ORDER: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * Découpe un thème en paliers : du plus simple au plus rare, et par ordre alphabétique à niveau
 * égal — pour que l'ordre soit stable d'une session à l'autre (un tirage au sort déplacerait les
 * mots d'un palier à l'autre et casserait la progression affichée).
 *
 * Le reste de la division est RECOLLÉ au palier précédent quand il fait moins de la moitié d'un
 * palier : treize thèmes finissaient sinon sur une séance de 1 à 4 mots, qui ne vaut pas l'ouverture
 * de l'écran et donne l'impression de buter sur un fond de tiroir. Un palier final de 11 à 14 mots
 * est un meilleur marché que deux paliers dont un bâclé.
 */
export function stepsOf(theme: Theme): WordEntry[][] {
  const sorted = [...theme.words].sort(
    (a, b) => CEFR_ORDER.indexOf(a.cefr) - CEFR_ORDER.indexOf(b.cefr) || a.w.localeCompare(b.w),
  );
  const steps: WordEntry[][] = [];
  for (let i = 0; i < sorted.length; i += STEP_SIZE) steps.push(sorted.slice(i, i + STEP_SIZE));
  // `steps.length > 1` : un thème de 3 mots garde son unique palier — il n'y a rien où le recoller.
  if (steps.length > 1 && steps[steps.length - 1].length < STEP_SIZE / 2) {
    steps[steps.length - 2].push(...steps.pop()!);
  }
  return steps;
}

/** Identifiant d'un palier, stable : c'est lui qu'on inscrit dans `state.completed`. */
export function stepId(themeKey: string, index: number): string {
  return `voc:${themeKey}:${index}`;
}

/** Toutes les formes sous lesquelles un mot peut apparaître dans une phrase. */
export function formsOf(entry: WordEntry): string[] {
  return [entry.w, ...(entry.also ?? [])].map((f) => f.toLowerCase());
}

/**
 * Distracteurs pour un QCM de vocabulaire : des mots du MÊME thème et de la MÊME nature.
 *
 * C'est tout l'intérêt d'avoir un lexique. Le moteur d'exercices tirait jusqu'ici ses distracteurs
 * au hasard parmi tous les mots du niveau : on proposait donc souvent un verbe contre trois noms,
 * et la bonne réponse sautait aux yeux sans rien savoir. Ici les quatre propositions sont
 * interchangeables grammaticalement — il faut vraiment connaître le mot.
 */
export function wordDistractors(entry: WordEntry, pool: readonly WordEntry[], n = 3): WordEntry[] {
  const same = pool.filter((o) => o.w !== entry.w && o.pos === entry.pos);
  // À défaut d'assez de mots de même nature, on complète avec le reste du thème plutôt que de
  // rendre une question à deux propositions.
  const rest = pool.filter((o) => o.w !== entry.w && o.pos !== entry.pos);
  const pick = [...same].sort(() => Math.random() - 0.5).slice(0, n);
  if (pick.length < n) pick.push(...[...rest].sort(() => Math.random() - 0.5).slice(0, n - pick.length));
  return pick;
}
