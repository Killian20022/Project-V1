// Registre des thèmes de vocabulaire.
//
// La carte des 36 thèmes est déclarée dans `themes.ts` ; ce fichier y rattache les thèmes dont
// les mots sont écrits. Un thème sans mots reste dans la liste, affiché avec son objectif — on
// montre le plan complet, pas seulement ce qui est fait.
import type { Theme } from '../../lib/lexicon';
import { THEME_PLAN } from './themes';
import { THEME_TRAVAIL } from './travail';
import { THEME_VETEMENTS } from './vetements';
import { THEME_URGENCES } from './urgences';
import { THEME_SPORT } from './sport';
import { THEME_SPECTACLE } from './spectacle';
import { THEME_REUNIONS } from './reunions';
import { THEME_RELATIONS } from './relations';
import { THEME_PAYS } from './pays';
import { THEME_JUSTICE } from './justice';
import { THEME_HISTOIRE } from './histoire';
import { THEME_GEOGRAPHIE } from './geographie';
import { THEME_ENTRETIEN } from './entretien';
import { THEME_DIRECTIONS } from './directions';
import { THEME_COURSES } from './courses';
import { THEME_CARACTERE } from './caractere';
import { THEME_ARGENT } from './argent';
import { THEME_ANIMAUX } from './animaux';
// Thèmes repris du curriculum par `gen-lexicon-from-curriculum.ts` : leur vocabulaire existait
// déjà dans les leçons « V », traduit et illustré, mais restait prisonnier des leçons — invisible
// depuis la partie Vocabulaire, jamais révisé au niveau du mot, impossible à compter.
import { THEME_ART } from './art';
import { THEME_CORPS } from './corps';
import { THEME_ECOLE } from './ecole';
import { THEME_EMOTIONS } from './emotions';
import { THEME_ENTREPRISE } from './entreprise';
import { THEME_FAMILLE } from './famille';
import { THEME_HOTEL } from './hotel';
import { THEME_MAISON } from './maison';
import { THEME_MEDIAS } from './medias';
import { THEME_METEO } from './meteo';
import { THEME_NATURE } from './nature';
import { THEME_NOURRITURE } from './nourriture';
import { THEME_NUMERIQUE } from './numerique';
import { THEME_POLITIQUE } from './politique';
import { THEME_ROUTINE } from './routine';
import { THEME_SCIENCES } from './sciences';
import { THEME_TEMPS } from './temps';
import { THEME_VILLE } from './ville';
import { THEME_VOYAGE } from './voyage';

export { DOMAINS } from './themes';

/** Thèmes remplis, indexés par clé. Ajouter une ligne ici suffit à publier un thème. */
const FILLED: Record<string, Theme> = {
  travail: THEME_TRAVAIL,
  vetements: THEME_VETEMENTS,
  urgences: THEME_URGENCES,
  sport: THEME_SPORT,
  spectacle: THEME_SPECTACLE,
  reunions: THEME_REUNIONS,
  relations: THEME_RELATIONS,
  pays: THEME_PAYS,
  justice: THEME_JUSTICE,
  histoire: THEME_HISTOIRE,
  geographie: THEME_GEOGRAPHIE,
  entretien: THEME_ENTRETIEN,
  directions: THEME_DIRECTIONS,
  courses: THEME_COURSES,
  caractere: THEME_CARACTERE,
  argent: THEME_ARGENT,
  animaux: THEME_ANIMAUX,
  art: THEME_ART,
  corps: THEME_CORPS,
  ecole: THEME_ECOLE,
  emotions: THEME_EMOTIONS,
  entreprise: THEME_ENTREPRISE,
  famille: THEME_FAMILLE,
  hotel: THEME_HOTEL,
  maison: THEME_MAISON,
  medias: THEME_MEDIAS,
  meteo: THEME_METEO,
  nature: THEME_NATURE,
  nourriture: THEME_NOURRITURE,
  numerique: THEME_NUMERIQUE,
  politique: THEME_POLITIQUE,
  routine: THEME_ROUTINE,
  sciences: THEME_SCIENCES,
  temps: THEME_TEMPS,
  ville: THEME_VILLE,
  voyage: THEME_VOYAGE,
};

/**
 * Les 36 thèmes, dans l'ordre du plan. Ceux qui ne sont pas encore écrits sortent avec une liste
 * de mots vide : la page les affiche « 0 / objectif » plutôt que de les cacher.
 */
export const THEMES: readonly Theme[] = THEME_PLAN.map((plan) => FILLED[plan.key] ?? { ...plan, words: [] });

export function themeByKey(key: string): Theme | undefined {
  return THEMES.find((t) => t.key === key);
}

/** Tous les mots écrits à ce jour — le numérateur de « X mots disponibles ». */
export function allWords() {
  return THEMES.flatMap((t) => t.words);
}

/** L'objectif, additionné depuis le plan : c'est le « / 5 000 » affiché. */
export const VOCAB_TARGET = THEME_PLAN.reduce((n, t) => n + t.target, 0);
