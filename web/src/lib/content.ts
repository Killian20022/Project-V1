import { CURRICULUM } from '../data/curriculum';
import { SENTENCES } from '../data/sentences';
import { COMPREHENSION } from '../data/comprehension';
import { BUSINESS_MODULES, BUSINESS_CATEGORIES } from '../data/business';
import type { BusinessModule, Lesson, Level, Sentence } from '../types';

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// Nombre de leçons réellement présentes pour un niveau (dynamique)
export function lessonCount(level: Level): number {
  return ((CURRICULUM as unknown as Record<Level, readonly Lesson[]>)[level] ?? []).length;
}

// Total de leçons tous niveaux confondus
export const TOTAL_LESSONS = LEVELS.reduce((sum, lv) => sum + lessonCount(lv), 0);

// Rangs « English Sword » : de l'écuyer au roi. Le code CEFR (A1…C2) reste affiché
// sur le blason — la pédagogie est inchangée. `avatar` = portrait Tiny Swords.
export const LEVEL_INFO: Record<Level, { name: string; description: string; gradient: string; avatar: string; island: string }> = {
  A1: { name: 'Écuyer', description: 'Premiers mots et phrases', gradient: 'from-[#5b8fb9] to-[#2f5f8a]', avatar: 'avatars_04.png', island: 'Royaume bleu' },
  A2: { name: 'Soldat', description: 'Communiquer au quotidien', gradient: 'from-[#c9a33a] to-[#8e6b1c]', avatar: 'avatars_02.png', island: 'Ferme jaune' },
  B1: { name: 'Garde royal', description: 'Devenir autonome', gradient: 'from-[#9b6fc2] to-[#5e3a86]', avatar: 'avatars_03.png', island: 'Monastère violet' },
  B2: { name: 'Chevalier', description: "S'exprimer avec aisance", gradient: 'from-[#4a9ec9] to-[#23608a]', avatar: 'avatars_01.png', island: 'Avant-poste' },
  C1: { name: 'Seigneur', description: 'Nuancer son expression', gradient: 'from-[#d9b233] to-[#a0741a]', avatar: 'avatars_11.png', island: 'Mine d’or' },
  C2: { name: 'Roi', description: 'Comprendre avec précision', gradient: 'from-[#4a4f5c] to-[#1e2129]', avatar: 'avatars_21.png', island: 'Île Noire' },
};

export function lessonsFor(level: Level): Lesson[] {
  const base = [...((CURRICULUM as unknown as Record<Level, readonly Lesson[]>)[level] ?? [])];
  // Fusionne le contenu de compréhension additif (data/comprehension.ts) sans
  // toucher au curriculum : clé `${niveau}:${index}`.
  return base.map((lesson, index) => {
    const extra = COMPREHENSION[`${level}:${index}`];
    return extra ? { ...lesson, comprehension: extra } : lesson;
  });
}

export function sentencesFor(level: Level): Sentence[] {
  return [...((SENTENCES as unknown as Record<Level, readonly Sentence[]>)[level] ?? [])];
}

// ── Parcours Business English (formation pro) ─────────────────────────────
// Contenu additif rangé dans data/business.ts, indépendant du curriculum.
export function businessModules(): readonly BusinessModule[] {
  return BUSINESS_MODULES;
}

export function businessCategories(): readonly string[] {
  return BUSINESS_CATEGORIES;
}

// Identifiant de complétion stocké dans state.completed pour un module donné.
export function businessDoneId(id: string): string {
  return `biz:${id}`;
}

// ── Hub Grammaire ─────────────────────────────────────────────────────────
// Agrège toutes les leçons de grammaire (t === 'G') de tous les niveaux en une
// liste consultable/recherchable. On conserve l'index d'origine dans le niveau
// (nécessaire au moteur d'exercices). Aucun contenu réécrit : réutilise le
// curriculum existant via lessonsFor().
export interface GrammarEntry {
  level: Level;
  index: number;
  lesson: Lesson;
  category: string; // clé de famille grammaticale (voir GRAMMAR_CATEGORIES)
}

// Familles grammaticales, dans l'ordre pédagogique d'affichage.
export interface GrammarCategory {
  key: string;
  label: string;
  description: string;
}

export const GRAMMAR_CATEGORIES: readonly GrammarCategory[] = [
  { key: 'tenses', label: 'Temps & conjugaison', description: 'Présent, passé, futur, aspects perfect' },
  { key: 'modals', label: 'Modaux', description: 'can, must, should, déduction…' },
  { key: 'conditionals', label: 'Conditionnels & hypothèses', description: 'if, wish, subjonctif' },
  { key: 'nouns', label: 'Noms & déterminants', description: 'articles, pluriels, quantité' },
  { key: 'adjectives', label: 'Adjectifs & comparaisons', description: 'comparatifs, superlatifs, adverbes' },
  { key: 'prepositions', label: 'Prépositions & phrasal verbs', description: 'in/on/at, verbes à particule' },
  { key: 'structure', label: 'Structure de la phrase', description: 'relatives, passif, discours rapporté…' },
  { key: 'style', label: 'Style & discours', description: 'connecteurs, cohésion, registre' },
];

// Classe une fiche par mots-clés de son titre. Règles ORDONNÉES : la première
// qui matche gagne (l'ordre évite les conflits, ex. « passif (présent) » doit
// tomber dans « structure » avant que « présent » ne l'envoie dans « tenses »).
export function categorizeGrammar(title: string): string {
  const t = title.toLowerCase();
  const has = (...kw: string[]) => kw.some((k) => t.includes(k));

  if (has('conditionnel', 'wish', 'if only', 'subjonctif')) return 'conditionals';
  if (has('modau', 'can /', 'can/')) return 'modals';
  if (has('préposition', 'phrasal', 'particule')) return 'prepositions';
  if (
    has(
      'passif', 'relati', 'discours rapporté', 'gérondif', 'infinitif', 'inversion',
      'cleft', 'mise en relief', 'ellipse', 'substitution', 'emphatique', 'interrogatif',
    )
  )
    return 'structure';
  if (
    has(
      'présent', 'present', 'passé', 'past', 'futur', 'prétérit', 'perfect', 'continu',
      'for, since', 'used to', 'irréguli', 'to be', 'have got', 'temps',
    )
  )
    return 'tenses';
  if (has('article', 'possessif', 'pluriel', 'this, that', 'there is', 'some, any', 'quantité')) return 'nouns';
  if (has('comparatif', 'superlatif', 'adverbe', 'so, such', 'enough')) return 'adjectives';
  if (has('connecteur', 'nominalisation', 'hedging', 'ponctuation', 'style natif', 'cohésion', 'cohérence'))
    return 'style';
  return 'structure';
}

export function grammarEntries(): GrammarEntry[] {
  const entries: GrammarEntry[] = [];
  for (const level of LEVELS) {
    lessonsFor(level).forEach((lesson, index) => {
      if (lesson.t === 'G') entries.push({ level, index, lesson, category: categorizeGrammar(lesson.title) });
    });
  }
  return entries;
}
