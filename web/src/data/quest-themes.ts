// À quel thème du lexique se rattache chaque quête de VOCABULAIRE de la campagne.
//
// Les 36 thèmes du lexique ont été DÉRIVÉS de ces quêtes (`gen-lexicon-from-curriculum.ts`), si bien
// que la correspondance existe depuis le début — mais elle ne vivait que dans ce script de
// génération, indexée par TITRE de leçon. C'était fragile : deux entrées y coexistaient pour une même
// leçon, l'une avec l'apostrophe droite et l'autre avec la typographique. La clé est donc ici
// `${niveau}:${index}`, la même convention que `comprehension.ts` et `grammar-families.ts`.
//
// `null` signifie « cette quête n'enseigne pas des MOTS » : « Se présenter », « Registres de
// langue », « Les idiomes natifs » portent des tournures, qui ne peuvent pas devenir des entrées de
// lexique. Elles n'ont donc pas de paliers à proposer, et c'est volontaire — pas un oubli.
//
// Plusieurs quêtes peuvent viser le MÊME thème (« Les nombres & l'âge » et « Les nombres et
// l'heure » pointent tous deux sur `temps`). Le plan de campagne répartit alors les paliers du thème
// entre elles, dans l'ordre : comme `stepsOf` trie par niveau CEFR, la quête la plus précoce reçoit
// les paliers les plus simples. Voir `chaptersFor` dans `lib/campaign.ts`.
export const QUEST_THEME: Record<string, string | null> = {
  // A1
  'A1:1': null, // Se présenter — formules de politesse
  'A1:2': 'famille', // La famille
  'A1:7': 'maison', // Les couleurs et les objets du quotidien
  'A1:8': 'caractere', // Décrire : les adjectifs courants
  'A1:9': 'temps', // Les nombres & l'âge
  'A1:10': 'temps', // Les nombres et l'heure
  'A1:11': 'nourriture', // Nourriture & boissons
  // A2
  'A2:1': 'routine', // La routine quotidienne
  'A2:8': 'voyage', // Voyages & transports
  'A2:9': 'meteo', // La météo & les saisons
  'A2:10': 'hotel', // Au restaurant
  'A2:11': 'ville', // La ville et les directions
  'A2:13': 'maison', // La maison
  // B1
  'B1:3': 'travail', // Le travail & les métiers
  'B1:6': 'numerique', // La technologie
  'B1:10': 'emotions', // Émotions & sentiments
  'B1:14': 'corps', // La santé & le corps
  'B1:15': 'voyage', // Le voyage & les vacances
  // B2
  'B2:11': 'nature', // L'environnement
  'B2:12': 'medias', // Médias & actualité
  'B2:13': 'ecole', // L'éducation
  'B2:14': 'entreprise', // Les affaires & l'économie
  'B2:15': null, // Les collocations courantes — tournures
  // C1
  'C1:8': 'politique', // Politique & société
  'C1:9': 'art', // L'art & la culture
  'C1:10': 'sciences', // La science
  'C1:11': 'entreprise', // Le monde de l'entreprise
  'C1:12': null, // Les expressions idiomatiques — tournures
  'C1:13': null, // Registres de langue — tournures
  // C2
  'C2:4': null, // Les idiomes natifs — tournures
  'C2:5': 'ecole', // Le vocabulaire académique
  'C2:6': null, // Les nuances de sens — tournures
  'C2:7': null, // Collocations avancées & mots savants — tournures
  'C2:8': null, // Humour & understatement — tournures
  'C2:12': 'art', // La littérature et les arts
  'C2:14': null, // Le langage figuré — tournures
};

/**
 * Thèmes qu'aucune quête de vocabulaire ne couvre, et le niveau auquel les proposer.
 *
 * Quinze thèmes du lexique — 1 800 mots environ — n'ont aucune quête correspondante : ils ont été
 * écrits pour compléter la carte du vocabulaire, pas pour suivre le curriculum. Sans cette table ils
 * resteraient hors de la campagne, c'est-à-dire exactement le problème qu'on cherche à résoudre.
 *
 * Ils deviennent des CHAPITRES DE THÈME, placés à la fin du niveau indiqué. Le niveau est choisi
 * d'après la difficulté réelle du thème, pas au hasard : les animaux et les vêtements sont des
 * inventaires concrets de début de parcours, la justice et l'histoire demandent de l'abstraction.
 */
export const EXTRA_THEME_LEVEL: Record<string, string> = {
  animaux: 'A1',
  vetements: 'A1',
  courses: 'A2',
  directions: 'A2',
  sport: 'A2',
  argent: 'B1',
  spectacle: 'B1',
  urgences: 'B1',
  geographie: 'B1',
  relations: 'B2',
  reunions: 'B2',
  entretien: 'B2',
  pays: 'B2',
  histoire: 'C1',
  justice: 'C1',
};
