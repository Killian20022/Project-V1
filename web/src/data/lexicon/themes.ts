// La carte complète du vocabulaire : 36 thèmes en 6 domaines.
//
// Elle est déclarée EN ENTIER dès maintenant, y compris les thèmes encore vides. Un thème vide
// n'est pas un oubli : c'est une case du plan qu'on remplira, et l'afficher « 0 / 140 » dit la
// vérité sur l'état du site. L'inverse — ne montrer que ce qui est fait — laisse croire que le
// vocabulaire se résume à un thème isolé.
//
// Les `target` additionnés donnent l'objectif de 5 000 mots (`check-content.ts` en fait la somme
// et la vérifie). Ils sont dimensionnés à l'importance du thème, pas répartis à l'identique : on
// a besoin de plus de mots pour la santé que pour demander son chemin.
//
// Les thèmes reprennent ceux qui existaient déjà dans le curriculum sous forme de leçons « V »
// de cinq mots, et absorbent le vocabulaire de l'ancienne section Business (entreprise,
// réunions, entretien).
import type { Domain } from '../../lib/lexicon';

export const DOMAINS: readonly Domain[] = [
  { key: 'quotidien', label: 'Vie quotidienne', blurb: 'Ce dont on parle tous les jours.' },
  { key: 'gens', label: 'Les gens', blurb: 'Soi, les autres, le corps et les sentiments.' },
  { key: 'monde', label: 'Le monde', blurb: 'La nature, les lieux, le vivant.' },
  { key: 'travail', label: 'Travail & études', blurb: 'Le bureau, l’argent, l’école.' },
  { key: 'culture', label: 'Culture & société', blurb: 'Ce dont parlent les journaux et les livres.' },
  { key: 'debrouille', label: 'Se débrouiller', blurb: 'Voyager, s’orienter, faire face.' },
];

/** Un thème pas encore rempli : tout est déclaré sauf les mots. */
export interface ThemePlan {
  key: string;
  label: string;
  blurb: string;
  domain: string;
  target: number;
}

export const THEME_PLAN: readonly ThemePlan[] = [
  // ---------- Vie quotidienne ----------
  { key: 'maison', domain: 'quotidien', label: 'La maison & le mobilier', blurb: 'Les pièces, les meubles, le bricolage.', target: 140 },
  { key: 'nourriture', domain: 'quotidien', label: 'La nourriture & les boissons', blurb: 'Les aliments, la cuisine, les goûts.', target: 180 },
  { key: 'vetements', domain: 'quotidien', label: 'Les vêtements & l’apparence', blurb: 'S’habiller, les matières, les tailles.', target: 120 },
  { key: 'courses', domain: 'quotidien', label: 'Les courses & les achats', blurb: 'Acheter, payer, échanger, se plaindre.', target: 120 },
  { key: 'routine', domain: 'quotidien', label: 'La routine & les tâches', blurb: 'La journée, le ménage, les habitudes.', target: 120 },
  { key: 'ville', domain: 'quotidien', label: 'La ville & les commerces', blurb: 'Les rues, les services, la vie urbaine.', target: 160 },

  // ---------- Les gens ----------
  { key: 'famille', domain: 'gens', label: 'La famille & les proches', blurb: 'Les liens de parenté, les âges de la vie.', target: 120 },
  { key: 'corps', domain: 'gens', label: 'Le corps & la santé', blurb: 'L’anatomie, les maladies, les soins.', target: 190 },
  { key: 'emotions', domain: 'gens', label: 'Les émotions & les sentiments', blurb: 'Dire ce qu’on ressent, avec nuance.', target: 160 },
  { key: 'caractere', domain: 'gens', label: 'Le caractère & la personnalité', blurb: 'Décrire quelqu’un autrement que « nice ».', target: 140 },
  { key: 'relations', domain: 'gens', label: 'Les relations & la vie sociale', blurb: 'L’amitié, le couple, les conflits.', target: 130 },

  // ---------- Le monde ----------
  { key: 'nature', domain: 'monde', label: 'La nature & l’environnement', blurb: 'Le climat, l’écologie, les ressources.', target: 160 },
  { key: 'animaux', domain: 'monde', label: 'Les animaux', blurb: 'Domestiques, sauvages, marins.', target: 120 },
  { key: 'meteo', domain: 'monde', label: 'La météo & les saisons', blurb: 'Le temps qu’il fait, du crachin au blizzard.', target: 100 },
  { key: 'geographie', domain: 'monde', label: 'La géographie & les paysages', blurb: 'Le relief, les eaux, les milieux.', target: 120 },
  { key: 'pays', domain: 'monde', label: 'Pays, peuples & langues', blurb: 'Nationalités, continents, frontières.', target: 110 },

  // ---------- Travail & études ----------
  { key: 'travail', domain: 'travail', label: 'Le travail & les métiers', blurb: 'Le bureau, l’équipe, le contrat, la carrière.', target: 150 },
  { key: 'entreprise', domain: 'travail', label: 'L’entreprise & la gestion', blurb: 'Les services, la stratégie, les résultats.', target: 150 },
  { key: 'argent', domain: 'travail', label: 'L’argent, la banque & les impôts', blurb: 'Compter, emprunter, déclarer.', target: 170 },
  { key: 'ecole', domain: 'travail', label: 'L’école & les études', blurb: 'Les matières, les examens, le diplôme.', target: 140 },
  { key: 'reunions', domain: 'travail', label: 'Réunions, emails & téléphone', blurb: 'Les formules qui font la communication pro.', target: 130 },
  { key: 'entretien', domain: 'travail', label: 'Candidature & entretien', blurb: 'CV, lettre, entretien, négociation d’offre.', target: 110 },

  // ---------- Culture & société ----------
  { key: 'medias', domain: 'culture', label: 'Les médias & l’information', blurb: 'La presse, l’actualité, la rumeur.', target: 160 },
  { key: 'politique', domain: 'culture', label: 'La politique & les institutions', blurb: 'Voter, gouverner, contester.', target: 160 },
  { key: 'art', domain: 'culture', label: 'L’art & la littérature', blurb: 'Les genres, les formes, la critique.', target: 140 },
  { key: 'spectacle', domain: 'culture', label: 'Cinéma, musique & spectacle', blurb: 'Les métiers et le vocabulaire de la scène.', target: 130 },
  { key: 'sport', domain: 'culture', label: 'Le sport & les loisirs', blurb: 'Les disciplines, les règles, la compétition.', target: 130 },
  { key: 'histoire', domain: 'culture', label: 'L’histoire & le patrimoine', blurb: 'Les époques, les guerres, la mémoire.', target: 120 },
  { key: 'sciences', domain: 'culture', label: 'Les sciences & la technologie', blurb: 'La recherche, la mesure, l’innovation.', target: 180 },
  { key: 'justice', domain: 'culture', label: 'Le droit & la justice', blurb: 'Le procès, le contrat, la peine.', target: 140 },

  // ---------- Se débrouiller ----------
  { key: 'voyage', domain: 'debrouille', label: 'Les voyages & les transports', blurb: 'Partir, circuler, arriver.', target: 180 },
  { key: 'hotel', domain: 'debrouille', label: 'L’hôtel & le restaurant', blurb: 'Réserver, commander, réclamer.', target: 130 },
  { key: 'directions', domain: 'debrouille', label: 'S’orienter & demander son chemin', blurb: 'La position, la distance, l’itinéraire.', target: 90 },
  { key: 'numerique', domain: 'debrouille', label: 'Le numérique & Internet', blurb: 'Les appareils, les comptes, les pannes.', target: 180 },
  { key: 'temps', domain: 'debrouille', label: 'Le temps, les dates & les nombres', blurb: 'Dire l’heure, la durée, la quantité.', target: 110 },
  { key: 'urgences', domain: 'debrouille', label: 'Urgences, sécurité & imprévus', blurb: 'Alerter, expliquer, se faire aider.', target: 110 },
];
