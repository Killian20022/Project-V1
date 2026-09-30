// Corrections appliquées à la récupération du vocabulaire du curriculum.
//
// `gen-lexicon-from-curriculum.ts` découpe des rangées d'affichage en entrées de lexique. Il s'en
// sort bien (228 mots, 80 % avec leur exemple déjà écrit), mais il ne peut pas tout deviner :
// une rangée mal formée, une traduction qui traîne son article, un exemple manquant, un mot déjà
// présent dans un autre thème. Ces arbitrages sont MIENS et vivent ici, en données, pour que
// relancer la récupération redonne exactement le même résultat.
//
// Clé : `thème:mot`.
export interface WordFix {
  drop?: true; // à écarter (rangée cassée, ou doublon d'un thème mieux fourni)
  w?: string; // forme vedette corrigée
  pos?: string;
  fr?: string;
  ex?: { en: string; fr: string };
}

export const CURRICULUM_FIXES: Record<string, WordFix> = {
  // ---------- Doublons : ces mots sont déjà écrits, mieux, dans le thème « travail » ----------
  'entreprise:client': { drop: true },
  'entreprise:stakeholder': { drop: true },
  'entreprise:revenue': { drop: true },
  'entreprise:to outsource': { drop: true },
  'entreprise:profit': { drop: true },
  'routine:school': { drop: true }, // vient de « go to work / school » : sa place est dans « école »

  // Un mot ne vit que dans UN thème : sinon il aurait deux cartes de révision pour un seul
  // identifiant. On garde l'entrée la plus riche, ou celle du thème le plus naturel.
  'entreprise:customer': { drop: true }, // « travail » distingue client / customer dans une note
  'entreprise:employee': { drop: true },
  'medias:report': { drop: true },
  'ecole:research': { drop: true }, // sa place est dans « sciences »
  'ecole:hypothesis': { drop: true },
  'ville:station': { drop: true }, // sa place est dans « voyages »
  'numerique:email': { drop: true },
  'numerique:phone': { drop: true }, // gardé en A1 dans « maison », comme objet du quotidien

  // ---------- Rangées cassées ----------
  'temps:l\'âge': { drop: true }, // colonnes inversées que la détection n'a pas rattrapées

  // ---------- Exemples manquants et retouches ----------
  'entreprise:loss': { ex: { en: 'The group reported a heavy loss last year.', fr: 'Le groupe a annoncé une lourde perte l’an dernier.' } },
  'entreprise:to launch': { w: 'launch', pos: 'v', ex: { en: 'They will launch the product in May.', fr: 'Ils lanceront le produit en mai.' } },

  'ecole:school': { ex: { en: 'She left school at sixteen.', fr: 'Elle a quitté l’école à seize ans.' } },
  'ecole:paradigm': { ex: { en: 'The study challenges the dominant paradigm.', fr: 'L’étude remet en cause le paradigme dominant.' } },

  'nourriture:food': { ex: { en: 'The food here is excellent.', fr: 'La nourriture est excellente ici.' } },
  'nourriture:breakfast': { fr: 'petit-déjeuner', ex: { en: 'I never skip breakfast.', fr: 'Je ne saute jamais le petit-déjeuner.' } },
  'nourriture:lunch': { ex: { en: 'We had lunch at one.', fr: 'Nous avons déjeuné à treize heures.' } },
  'nourriture:dinner': { ex: { en: 'Dinner is at eight.', fr: 'Le dîner est à vingt heures.' } },

  'voyage:airport': { ex: { en: 'The airport is closed because of the snow.', fr: 'L’aéroport est fermé à cause de la neige.' } },

  'medias:broadcast': { ex: { en: 'The broadcast was watched by millions.', fr: 'La diffusion a été suivie par des millions de personnes.' } },
  'medias:bias': { ex: { en: 'The article shows a clear bias.', fr: 'L’article montre un net parti pris.' } },

  'famille:grandfather': { ex: { en: 'My grandfather was born in Lyon.', fr: 'Mon grand-père est né à Lyon.' } },
  'famille:parents': { pos: 'n', fr: 'parents' },
  'famille:children': { pos: 'n', fr: 'enfants', ex: { en: 'The children are playing outside.', fr: 'Les enfants jouent dehors.' } },

  'meteo:sunny': { ex: { en: 'It will be sunny all weekend.', fr: 'Il fera beau tout le week-end.' } },
  'meteo:warm': { ex: { en: 'The water is warm enough to swim.', fr: 'L’eau est assez douce pour se baigner.' } },
  'meteo:cloud': { ex: { en: 'A dark cloud covered the sun.', fr: 'Un nuage sombre a caché le soleil.' } },

  'temps:six': { fr: 'six', ex: { en: 'There are six chairs around the table.', fr: 'Il y a six chaises autour de la table.' } },
  'temps:eight': { fr: 'huit', ex: { en: 'The train leaves at eight.', fr: 'Le train part à huit heures.' } },
  'temps:nine': { fr: 'neuf', ex: { en: 'She is nine years old.', fr: 'Elle a neuf ans.' } },
  'temps:hundred': { ex: { en: 'The book has a hundred pages.', fr: 'Le livre fait cent pages.' } },
  'temps:first': { ex: { en: 'This is my first day here.', fr: 'C’est mon premier jour ici.' } },
  'temps:second': { ex: { en: 'Take the second street on the left.', fr: 'Prenez la deuxième rue à gauche.' } },

  'corps:arm': { ex: { en: 'He broke his arm skiing.', fr: 'Il s’est cassé le bras au ski.' } },
  'corps:leg': { ex: { en: 'My leg hurts when I run.', fr: 'J’ai mal à la jambe quand je cours.' } },
  'corps:foot': { ex: { en: 'She hurt her foot on the stairs.', fr: 'Elle s’est blessée au pied dans l’escalier.' } },
  'corps:nurse': { ex: { en: 'The nurse took my temperature.', fr: 'L’infirmière a pris ma température.' } },
  'corps:sick': { ex: { en: 'He was sick all night.', fr: 'Il a été malade toute la nuit.' } },
  'corps:ill': { ex: { en: 'She has been ill for a week.', fr: 'Elle est malade depuis une semaine.' } },
  'corps:pain': { ex: { en: 'Do you feel any pain here?', fr: 'Ressentez-vous une douleur ici ?' } },

  'numerique:internet': { ex: { en: 'The internet is down again.', fr: 'Internet est encore en panne.' } },
  'numerique:message': { ex: { en: 'I left you a message this morning.', fr: 'Je t’ai laissé un message ce matin.' } },

  'maison:flat': { pos: 'n', ex: { en: 'They rent a small flat in town.', fr: 'Ils louent un petit appartement en ville.' } },

  'art:artist': { ex: { en: 'The artist works mainly in clay.', fr: 'L’artiste travaille surtout la terre.' } },
  'art:metaphor': { fr: 'métaphore', ex: { en: 'The poem is built on a single metaphor.', fr: 'Le poème repose sur une seule métaphore.' } },

  'hotel:starter': { fr: 'entrée (plat)', ex: { en: 'I’ll take the soup as a starter.', fr: 'Je prendrai la soupe en entrée.' } },
  'hotel:dessert': { fr: 'dessert', ex: { en: 'What is there for dessert?', fr: 'Qu’y a-t-il comme dessert ?' } },

  'routine:come home': { ex: { en: 'I come home at six every day.', fr: 'Je rentre à dix-huit heures tous les jours.' } },

  'politique:rights': { pos: 'n' },

  'corps:head': { ex: { en: 'She shook her head and left.', fr: 'Elle a secoué la tête et est partie.' } },
  'meteo:wind': { ex: { en: 'The wind is strong today.', fr: 'Le vent est fort aujourd’hui.' } },
};
