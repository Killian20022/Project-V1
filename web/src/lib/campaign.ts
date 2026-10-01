// LA CAMPAGNE TISSÉE — comment 95 quêtes en deviennent 800 sans écrire une ligne de contenu.
//
// Constat de départ : la campagne exposait 95 quêtes, strictement linéaires, et s'arrêtait net à la
// 95ᵉ. Pendant ce temps 501 paliers de vocabulaire, 200 items TOEIC et 8 modules de formules étaient
// écrits, jouables, comptés par `effort.ts` pour l'or et les îles — mais accessibles seulement
// depuis des menus latéraux. La page Quêtes montrait donc 95 unités sur 804, soit 12 % du contenu.
//
// Ce fichier ne crée aucun contenu : il construit un CHEMIN à travers celui qui existe.
//
// ── Un chapitre ─────────────────────────────────────────────────────────────
// Un chapitre = une quête du curriculum + ses satellites, c'est-à-dire ce qui travaille le MÊME
// point :
//   · une quête de GRAMMAIRE est suivie d'un entraînement TOEIC sur sa famille (« Le présent
//     simple » → les items étiquetés `tense`) ;
//   · une quête de VOCABULAIRE est suivie des paliers de son thème (« La famille » → les 12 paliers
//     des 117 mots du thème `famille`).
// S'y ajoutent des chapitres de THÈME pur, pour les quinze thèmes qu'aucune quête ne couvrait.
//
// ── Le déverrouillage, et pourquoi il est plus subtil qu'il n'y paraît ──────
// Règle voulue : on finit un chapitre pour ouvrir le suivant, et on choisit l'ordre à l'intérieur.
// Mais appliquée telle quelle, elle REVERROUILLERAIT la campagne de quelqu'un qui a déjà terminé ses
// 95 quêtes sans avoir touché au vocabulaire — on lui retirerait un accès qu'il avait. D'où le
// rattrapage de `chapterUnlocked` : un chapitre dont la quête était DÉJÀ atteignable le reste pour
// toujours. On ajoute du contenu, on n'enlève jamais un acquis.
import { LEVELS, lessonsFor } from './content';
import { STEP_SIZE, stepId, stepsOf } from './lexicon';
import { GRAMMAR_FAMILY } from '../data/grammar-families';
import { EXTRA_THEME_LEVEL, QUEST_THEME } from '../data/quest-themes';
import { THEMES, themeByKey } from '../data/lexicon';
import { TOEIC_BANKS } from '../data/toeic';
import { BUSINESS_MODULES } from '../data/business';
import type { GameState, Lesson, Level } from '../types';

/**
 * Famille de grammaire → étiquettes TOEIC qui testent la même chose.
 *
 * Huit familles d'un côté, seize étiquettes de l'autre : la table ci-dessous est le seul endroit où
 * les deux vocabulaires se rencontrent. Elle est écrite à la main parce qu'elle relève du jugement —
 * « nouns » englobe les pronoms et les quantifieurs, qui ne sont pas des noms mais se travaillent
 * avec eux.
 */
export const FAMILY_TAGS: Record<string, readonly string[]> = {
  tenses: ['tense', 'subject-verb', 'voice'],
  nouns: ['pronoun', 'quantifier', 'word-form'],
  structure: ['conjunction', 'relative-clause', 'verb-pattern'],
  modals: ['modal'],
  adjectives: ['comparative', 'word-form'],
  prepositions: ['preposition', 'phrasal-verb'],
  conditionals: ['conditional', 'modal'],
  style: ['vocabulary', 'collocation'],
};

/** Nombre d'items d'un entraînement TOEIC de chapitre. Assez pour mordre, assez peu pour ne pas lasser. */
export const DRILL_SIZE = 8;

/**
 * Les chapitres de compréhension, et à quel niveau ils arrivent.
 *
 * Déclarés ici plutôt que déduits : quelles parties du TOEIC on juge abordables à quel niveau est
 * une décision pédagogique, pas un calcul. La partie 2 (questions-réponses courtes) passe dès le B1,
 * la partie 7 (documents croisés) attend le C1.
 */
const COMPREHENSION_CHAPTERS: readonly { key: string; level: Level; parts: number[]; title: string; label: string; blurb: string }[] = [
  { key: 'l-short', level: 'B1', parts: [1, 2], title: 'L’oreille : échanges courts', label: 'écoute', blurb: 'Photographies et questions-réponses. Tout se joue à l’oral, rien n’est imprimé.' },
  { key: 'l-conv', level: 'B2', parts: [3], title: 'L’oreille : conversations', label: 'écoute', blurb: 'Des dialogues de bureau, trois questions chacun. L’enregistrement ne passe qu’une fois.' },
  { key: 'l-talk', level: 'C1', parts: [4], title: 'L’oreille : exposés', label: 'écoute', blurb: 'Messages, annonces et réunions. Chacun cache un changement de cap en milieu de texte.' },
  { key: 'r-docs', level: 'C1', parts: [7], title: 'Lire pour trouver', label: 'lecture', blurb: 'Lettres, formulaires, documents croisés. La réponse est rarement dans un seul document.' },
  { key: 'r-exam', level: 'C2', parts: [5, 6], title: 'La précision de l’examen', label: 'lecture', blurb: 'Phrases et textes à compléter, au rythme réel : une question toutes les quarante-cinq secondes.' },
];

/** Les modules de formules, regroupés en chapitres par usage. */
const FORMULA_CHAPTERS: readonly { key: string; level: Level; categories: string[]; title: string; blurb: string }[] = [
  { key: 'oral', level: 'B1', categories: ['À l’oral'], title: 'Les formules de l’oral', blurb: 'Se présenter, tenir une réunion, téléphoner, meubler un silence.' },
  { key: 'ecrit', level: 'B2', categories: ['À l’écrit', 'Négocier & convaincre'], title: 'Écrire et convaincre', blurb: 'Le courriel professionnel, la négociation, l’entretien.' },
];

export type StepKind = 'quest' | 'vocab' | 'toeic' | 'business';

export interface CampaignStep {
  kind: StepKind;
  /** Identifiant de complétion. Pour une quête il est dérivé du compteur de niveau, pas de `completed`. */
  id: string;
  label: string;
  detail: string;
  lessonIndex?: number; // quest
  themeKey?: string; // vocab
  stepIndex?: number; // vocab
  tags?: readonly string[]; // toeic : étiquettes de grammaire (chapitres de point)
  parts?: readonly number[]; // toeic : parties entières (chapitres de compréhension)
  round?: number; // toeic : rang de la série dans le chapitre, pour découper la banque
  bizId?: string; // business
}

export interface Chapter {
  id: string; // `A1#3`
  level: Level;
  index: number; // rang du chapitre dans le niveau
  title: string;
  blurb: string;
  /** Index de la quête dans le niveau, ou `null` pour un chapitre de thème pur. */
  lessonIndex: number | null;
  steps: CampaignStep[];
}

/** Identifiant de complétion d'un entraînement TOEIC de chapitre. */
export const drillId = (level: Level, index: number) => `drill:${level}:${index}`;

/** Les items qui portent au moins une des étiquettes demandées, parmi les parties écrites. */
export function drillItems(tags: readonly string[]) {
  const wanted = new Set(tags);
  // Parties 5 et 6 seulement : ce sont elles qui testent la grammaire à la phrase. La partie 7
  // demanderait de lire un document entier pour une question de temps verbal.
  return TOEIC_BANKS.filter((b) => b.part === 5 || b.part === 6)
    .flatMap((b) => b.items)
    .filter((i) => i.tags.some((t) => wanted.has(t)));
}

/**
 * Répartit les paliers d'un thème entre les quêtes qui le visent.
 *
 * Deux quêtes peuvent pointer sur le même thème — « Les nombres & l'âge » et « Les nombres et
 * l'heure » visent tous deux `temps`. Donner les onze paliers aux deux ferait jouer deux fois la même
 * chose ; les donner à la première laisserait la seconde sans satellite. On les découpe donc en
 * tranches CONTIGUËS dans l'ordre, et comme `stepsOf` trie par niveau CEFR, la quête la plus précoce
 * hérite naturellement des paliers les plus simples.
 */
function sliceOf(total: number, rank: number, count: number): [number, number] {
  const start = Math.round((total * rank) / count);
  const end = Math.round((total * (rank + 1)) / count);
  return [start, end];
}

function vocabSteps(themeKey: string, from: number, to: number): CampaignStep[] {
  const theme = themeByKey(themeKey);
  if (!theme) return [];
  const steps = stepsOf(theme);
  return steps.slice(from, to).map((words, i) => {
    const n = from + i;
    return {
      kind: 'vocab' as const,
      id: stepId(themeKey, n),
      label: `Palier ${n + 1} · ${words[0].w} → ${words[words.length - 1].w}`,
      detail: `${words.length} mot${words.length > 1 ? 's' : ''} · ${words[0].cefr}`,
      themeKey,
      stepIndex: n,
    };
  });
}

/** Rang de chaque quête parmi celles qui visent le même thème, pour le découpage des paliers. */
function themeRanks(): Map<string, { rank: number; count: number }> {
  const byTheme = new Map<string, string[]>();
  for (const level of LEVELS) {
    lessonsFor(level).forEach((lesson, index) => {
      const key = QUEST_THEME[`${level}:${index}`];
      if (lesson.t !== 'V' || !key) return;
      const list = byTheme.get(key) ?? [];
      list.push(`${level}:${index}`);
      byTheme.set(key, list);
    });
  }
  const out = new Map<string, { rank: number; count: number }>();
  for (const [, keys] of byTheme) for (const [rank, k] of keys.entries()) out.set(k, { rank, count: keys.length });
  return out;
}

const RANKS = themeRanks();

/** Les chapitres d'un niveau, dans l'ordre de la campagne. */
export function chaptersFor(level: Level): Chapter[] {
  const lessons = lessonsFor(level);
  const chapters: Chapter[] = lessons.map((lesson, lessonIndex) => {
    const steps: CampaignStep[] = [
      {
        kind: 'quest',
        id: `quest:${level}:${lessonIndex}`,
        label: lesson.title,
        detail: lesson.t === 'G' ? 'Leçon de grammaire' : 'Leçon de vocabulaire',
        lessonIndex,
      },
    ];
    const key = `${level}:${lessonIndex}`;

    if (lesson.t === 'G') {
      const family = GRAMMAR_FAMILY[key];
      const tags = family ? FAMILY_TAGS[family] : undefined;
      if (tags?.length && drillItems(tags).length >= 4) {
        steps.push({
          kind: 'toeic',
          id: drillId(level, lessonIndex),
          label: 'Épreuve du point',
          detail: `${Math.min(DRILL_SIZE, drillItems(tags).length)} questions au format TOEIC`,
          tags,
        });
      }
    } else {
      const themeKey = QUEST_THEME[key];
      const rank = RANKS.get(key);
      if (themeKey && rank) {
        const theme = themeByKey(themeKey);
        const total = theme ? stepsOf(theme).length : 0;
        const [from, to] = sliceOf(total, rank.rank, rank.count);
        steps.push(...vocabSteps(themeKey, from, to));
      }
    }

    return {
      id: `${level}#${lessonIndex}`,
      level,
      index: lessonIndex,
      title: lesson.title,
      blurb: steps.length > 1 ? `La leçon, puis ${steps.length - 1} étape${steps.length > 2 ? 's' : ''} pour l’ancrer` : 'La leçon',
      lessonIndex,
      steps,
    };
  });

  // ── Chapitres de thème ───────────────────────────────────────────────────
  // Les quinze thèmes qu'aucune quête ne couvre, ajoutés à la fin de leur niveau. Sans eux, environ
  // 1 800 mots déjà écrits resteraient hors de la campagne.
  const extras = THEMES.filter((t) => EXTRA_THEME_LEVEL[t.key] === level && t.words.length);
  extras.forEach((theme) => {
    const steps = vocabSteps(theme.key, 0, stepsOf(theme).length);
    if (!steps.length) return;
    chapters.push({
      id: `${level}#t${theme.key}`,
      level,
      index: chapters.length,
      title: theme.label,
      blurb: `${theme.words.length} mots en ${steps.length} paliers — ${theme.blurb}`,
      lessonIndex: null,
      steps,
    });
  });

  // ── Chapitres de compréhension ───────────────────────────────────────────
  // Les parties 1 à 4 et 7 du TOEIC — 154 items — n'étaient reliées à rien : les chapitres de
  // grammaire ne piochent que dans les parties 5 et 6. Sans ces chapitres, le haut du parcours
  // restait famélique (le C2 tombait à 36 étapes) et la falaise de contenu se contentait de se
  // déplacer. Ils arrivent à partir du B1, parce qu'écouter une conversation de trois minutes
  // n'a pas de sens avant.
  for (const plan of COMPREHENSION_CHAPTERS.filter((c) => c.level === level)) {
    const items = TOEIC_BANKS.filter((b) => plan.parts.includes(b.part)).flatMap((b) => b.items);
    if (items.length < DRILL_SIZE) continue;
    const rounds = Math.floor(items.length / DRILL_SIZE);
    chapters.push({
      id: `${level}#c${plan.key}`,
      level,
      index: chapters.length,
      title: plan.title,
      blurb: plan.blurb,
      lessonIndex: null,
      steps: Array.from({ length: rounds }, (_, i) => ({
        kind: 'toeic' as const,
        id: `drill:${plan.key}:${i}`,
        label: `Série ${i + 1}`,
        detail: `${DRILL_SIZE} questions · ${plan.label}`,
        tags: [],
        parts: plan.parts,
        round: i,
      })),
    });
  }

  // ── Chapitre des formules ────────────────────────────────────────────────
  for (const plan of FORMULA_CHAPTERS.filter((c) => c.level === level)) {
    const mods = BUSINESS_MODULES.filter((m) => plan.categories.includes(m.category));
    if (!mods.length) continue;
    chapters.push({
      id: `${level}#f${plan.key}`,
      level,
      index: chapters.length,
      title: plan.title,
      blurb: plan.blurb,
      lessonIndex: null,
      steps: mods.map((m) => ({
        kind: 'business' as const,
        id: `biz:${m.id}`,
        label: m.title,
        detail: m.category,
        bizId: m.id,
      })),
    });
  }

  return chapters;
}

// ── Avancement ──────────────────────────────────────────────────────────────

export function stepDone(state: GameState, step: CampaignStep, level: Level): boolean {
  // Une quête n'a pas d'identifiant dans `completed` : la campagne a toujours compté les leçons
  // terminées par niveau, et ce compteur est la source de vérité. On ne la change pas, sous peine de
  // perdre la progression de tout le monde.
  if (step.kind === 'quest') return (state.lessons[level] ?? 0) > (step.lessonIndex ?? 0);
  return (state.completed ?? []).includes(step.id);
}

export function chapterProgress(state: GameState, chapter: Chapter): { done: number; total: number } {
  const done = chapter.steps.filter((s) => stepDone(state, s, chapter.level)).length;
  return { done, total: chapter.steps.length };
}

export const chapterComplete = (state: GameState, chapter: Chapter): boolean => {
  const { done, total } = chapterProgress(state, chapter);
  return done === total;
};

/**
 * Un chapitre est-il ouvert ?
 *
 * Trois voies, et la troisième est celle qui protège les anciennes sauvegardes : un chapitre dont la
 * quête était déjà atteignable sous l'ancienne règle (`index <= lessons[niveau]`) le reste, même si
 * le joueur n'a jamais fait les paliers de vocabulaire qui viennent d'y être rattachés. Sans ce
 * rattrapage, quelqu'un qui a fini la campagne se retrouverait reverrouillé au chapitre 2.
 */
export function chapterUnlocked(state: GameState, chapters: Chapter[], index: number): boolean {
  if (index === 0) return true;
  const chapter = chapters[index];
  const reached = state.lessons[chapter.level] ?? 0;
  if (chapter.lessonIndex !== null && chapter.lessonIndex <= reached) return true;
  return chapterComplete(state, chapters[index - 1]);
}

/** Totaux affichables, pour dire au joueur ce qu'il lui reste vraiment. */
export function campaignTotals(): { chapters: number; steps: number; quests: number; vocab: number; drills: number; formulas: number } {
  let chapters = 0, steps = 0, quests = 0, vocab = 0, drills = 0, formulas = 0;
  for (const level of LEVELS) {
    for (const c of chaptersFor(level)) {
      chapters++;
      for (const s of c.steps) {
        steps++;
        if (s.kind === 'quest') quests++;
        else if (s.kind === 'vocab') vocab++;
        else if (s.kind === 'business') formulas++;
        else drills++;
      }
    }
  }
  return { chapters, steps, quests, vocab, drills, formulas };
}

/** Le prochain pas à faire, tous niveaux confondus — ce que l'accueil met en avant. */
export function nextStep(state: GameState): { level: Level; chapter: Chapter; step: CampaignStep } | null {
  for (const level of LEVELS) {
    const chapters = chaptersFor(level);
    for (let i = 0; i < chapters.length; i++) {
      if (!chapterUnlocked(state, chapters, i)) break;
      const step = chapters[i].steps.find((s) => !stepDone(state, s, level));
      if (step) return { level, chapter: chapters[i], step };
    }
  }
  return null;
}

export type { Lesson };
export { STEP_SIZE };
