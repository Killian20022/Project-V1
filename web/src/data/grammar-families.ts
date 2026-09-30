// Famille grammaticale de chaque fiche, DÉCLARÉE.
//
// Le Hub Grammaire devinait jusqu'ici la famille en cherchant des mots-clés dans le titre de la
// fiche (`categorizeGrammar`). Ça marchait sur les 59 fiches actuelles, mais par accident : la
// dernière règle est un fourre-tout (« structure »), donc toute fiche ajoutée dont le titre ne
// contenait aucun mot-clé y tombait en silence. Un classement qui échoue sans rien dire est un
// classement sur lequel on ne peut pas construire.
//
// La table ci-dessous fige le classement actuel, relu fiche par fiche. La clé est
// `${niveau}:${index dans le niveau}` — le même repère que `data/comprehension.ts`.
// `categorizeGrammar` reste comme repli, mais `checkGrammarFamilies()` signale toute fiche
// absente d'ici : on ne peut plus en oublier une par inadvertance.
export const GRAMMAR_FAMILY: Record<string, string> = {
  // A1
  'A1:0': 'tenses', // Le verbe « to be »
  'A1:3': 'nouns', // Les possessifs (my, your, his…)
  'A1:4': 'nouns', // Les articles : a, an, the
  'A1:5': 'nouns', // Le pluriel des noms
  'A1:6': 'nouns', // This, that, these, those
  'A1:12': 'tenses', // Le présent simple
  'A1:13': 'tenses', // Have got
  'A1:14': 'structure', // Les mots interrogatifs
  'A1:15': 'modals', // Can / can't

  // A2
  'A2:0': 'tenses', // Le présent continu
  'A2:2': 'adjectives', // Les adverbes de fréquence
  'A2:3': 'prepositions', // Les prépositions de lieu
  'A2:4': 'tenses', // Le passé simple (réguliers)
  'A2:5': 'tenses', // Les verbes irréguliers
  'A2:6': 'tenses', // Le passé continu
  'A2:7': 'tenses', // Le futur « going to »
  'A2:12': 'adjectives', // Les comparatifs
  'A2:14': 'nouns', // There is / There are
  'A2:15': 'nouns', // Quantité : some, any, much, many

  // B1
  'B1:0': 'tenses', // Le present perfect
  'B1:1': 'tenses', // Present perfect vs prétérit
  'B1:2': 'tenses', // for, since, already, yet, just
  'B1:4': 'tenses', // Le futur « will »
  'B1:5': 'conditionals', // Le premier conditionnel
  'B1:7': 'adjectives', // Le superlatif
  'B1:8': 'structure', // Les pronoms relatifs
  'B1:9': 'structure', // Le passif (présent)
  'B1:11': 'modals', // Les modaux : can, must, should
  'B1:12': 'tenses', // Would, used to
  'B1:13': 'prepositions', // Les verbes à particule courants

  // B2
  'B2:0': 'conditionals', // Le deuxième conditionnel
  'B2:1': 'conditionals', // wish & if only
  'B2:2': 'modals', // Les modaux de déduction
  'B2:3': 'tenses', // Le present perfect continu
  'B2:4': 'tenses', // Le past perfect
  'B2:5': 'structure', // Le discours rapporté
  'B2:6': 'structure', // Le passif (tous les temps)
  'B2:7': 'structure', // Gérondif & infinitif
  'B2:8': 'structure', // Les propositions relatives
  'B2:9': 'adjectives', // so, such, enough, too
  'B2:10': 'style', // Connecteurs : contraste & cause

  // C1
  'C1:0': 'conditionals', // Le troisième conditionnel
  'C1:1': 'conditionals', // Les conditionnels mixtes
  'C1:2': 'structure', // Les inversions
  'C1:3': 'structure', // La mise en relief (cleft)
  'C1:4': 'modals', // Nuances des modaux passés
  'C1:5': 'style', // Les connecteurs logiques
  'C1:6': 'style', // La nominalisation & le style formel
  'C1:7': 'style', // Hedging
  'C1:14': 'prepositions', // Phrasal verbs avancés
  'C1:15': 'structure', // Ellipse & substitution

  // C2
  'C2:0': 'conditionals', // Le subjonctif
  'C2:1': 'nouns', // L'article zéro
  'C2:2': 'structure', // Les structures emphatiques
  'C2:3': 'tenses', // Temps rares & style littéraire
  'C2:9': 'style', // Ponctuation & rythme
  'C2:10': 'style', // Le style natif
  'C2:11': 'style', // Les connecteurs logiques avancés
  'C2:13': 'style', // Cohésion & cohérence du discours
};
