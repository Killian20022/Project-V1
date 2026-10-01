// Partie 1 — Photographies. Banque n°1 : 6 items.
//
// ── Les images ─────────────────────────────────────────────────────────────
// Ce sont des DESSINS SVG, pas des photographies : `bun gen-toeic-scenes.ts` les écrit dans
// `public/assets/toeic/`. Toute modification d'une scène passe par ce script, jamais par le SVG.
//
// Une photo de banque libre serait plus réaliste, mais un item de partie 1 ne vaut QUE si l'image
// tranche sans ambiguïté — et une photo rapporte toujours des détails qu'on n'a pas voulus, si bien
// qu'un distracteur qu'on croyait réfutable devient défendable. Le dessin ne contient que ce qu'on y
// met : le nombre de personnes, leur posture et les objets présents sont exactement ceux que les
// items interrogent ci-dessous. Si l'on remplace un jour un dessin par une photo, il faudra relire
// l'item EN REGARDANT l'image, et non l'inverse.
//
// Ce que chaque scène doit montrer, et qui fait la réponse :
//   p1-01  un homme SEUL, assis, qui tape sur un portable — personne d'autre dans le cadre
//   p1-02  cartons sur palettes + chariot élévateur présent mais À L'ARRÊT, sans conducteur
//   p1-03  quatre personnes assises à une table, UNE debout devant un écran
//   p1-04  deux ouvriers casqués et en gilet, l'un tenant un plan DÉPLIÉ, aucun engin en marche
//   p1-05  des piétons qui marchent, des vitrines, des vélos GARÉS (personne dessus)
//   p1-06  une salle de restaurant dressée mais VIDE, un serveur debout
//
// ── Règles d'écriture ───────────────────────────────────────────────────────
// Rien n'est imprimé à l'écran : on ENTEND quatre phrases et on ne voit que la photo. Les quatre
// propositions sont donc lues à voix haute, et les pièges du vrai examen sont sonores :
//   · un mot qui ressemble à un autre (« working » / « walking », « sitting » / « setting ») ;
//   · un objet réellement présent mais une action fausse ;
//   · une action plausible mais un objet absent du cadre ;
//   · le passif « is being + participe » quand personne n'agit — le piège le plus rentable.
import type { ToeicItem } from '../../lib/toeic';

export const PART1_BANK_01: readonly ToeicItem[] = [
  {
    id: 'p1-001',
    part: 1,
    image: 'p1-01.svg',
    stem: 'Photo 1 — Un homme seul, assis devant un ordinateur portable.',
    options: [
      'The man is walking toward the window.',
      'The man is typing on a laptop.',
      'The man is putting on a jacket.',
      'The laptop is being repaired.',
    ],
    answer: 1,
    explain:
      '« Walking » et « working » se ressemblent à l’oral : c’est le piège sonore classique. « Is being repaired » décrit une action subie par l’ordinateur alors que personne ne le répare — le passif progressif est presque toujours faux en partie 1, sauf si quelqu’un agit visiblement sur l’objet.',
    cefr: 'A1',
    tags: ['photo-description'],
  },
  {
    id: 'p1-002',
    part: 1,
    image: 'p1-02.svg',
    stem: 'Photo 2 — Un entrepôt : cartons sur palettes, chariot élévateur à l’arrêt.',
    options: [
      'A forklift is lifting a pallet.',
      'Boxes are stacked on pallets.',
      'Workers are loading a truck.',
      'The shelves have been emptied.',
    ],
    answer: 1,
    explain:
      'Le chariot est bien là, mais à l’arrêt : l’objet est présent, l’action est fausse. C’est le deuxième piège type de la partie 1. La bonne réponse décrit un ÉTAT (« are stacked »), ce qui est le plus sûr quand rien ne bouge sur la photo.',
    cefr: 'A2',
    tags: ['photo-description', 'voice'],
  },
  {
    id: 'p1-003',
    part: 1,
    image: 'p1-03.svg',
    stem: 'Photo 3 — Une réunion : une personne debout présente devant un écran, les autres assises.',
    options: [
      'They are leaving the conference room.',
      'A woman is handing out documents.',
      'One of them is standing in front of a screen.',
      'The room is being cleaned.',
    ],
    answer: 2,
    explain:
      'Seule proposition qui résiste : une personne debout devant un écran. « Handing out documents » est une action plausible en réunion mais absente du cadre — la partie 1 punit précisément ceux qui décrivent la scène qu’ils IMAGINENT plutôt que celle qu’ils voient.',
    cefr: 'A2',
    tags: ['photo-description'],
  },
  {
    id: 'p1-004',
    part: 1,
    image: 'p1-04.svg',
    stem: 'Photo 4 — Deux ouvriers casqués sur un chantier, l’un tient un plan déplié.',
    options: [
      'They are wearing hard hats.',
      'They are climbing a ladder.',
      'A machine is being operated.',
      'They are rolling up a carpet.',
    ],
    answer: 0,
    explain:
      '« Wearing » décrit un état vestimentaire visible, toujours sûr quand le vêtement est au cadre. Noter le couple « rolling up a carpet » / « unrolling a plan » : même geste, objet différent — l’oreille attrape le verbe et manque le nom.',
    cefr: 'A1',
    tags: ['photo-description'],
  },
  {
    id: 'p1-005',
    part: 1,
    image: 'p1-05.svg',
    stem: 'Photo 5 — Une rue commerçante : des piétons sur le trottoir, des vélos garés.',
    options: [
      'Pedestrians are crossing a bridge.',
      'Bicycles have been parked along the street.',
      'A cyclist is riding past the shops.',
      'The shops are closed for the day.',
    ],
    answer: 1,
    explain:
      'Les vélos sont garés, pas montés : « have been parked » décrit le résultat d’une action passée, ce qui est juste ici — contrairement au passif progressif, le passif accompli est souvent la bonne réponse. « Crossing a bridge » reprend le son de « street » sans rien décrire de réel.',
    cefr: 'A2',
    tags: ['photo-description', 'voice'],
  },
  {
    id: 'p1-006',
    part: 1,
    image: 'p1-06.svg',
    stem: 'Photo 6 — Une salle de restaurant dressée mais vide avant le service.',
    options: [
      'Customers are being served a meal.',
      'A waiter is clearing the plates.',
      'The tables have been set.',
      'People are waiting in line outside.',
    ],
    answer: 2,
    explain:
      'La salle est vide : toute proposition qui met des clients dans le cadre est fausse, même si elle est très plausible pour un restaurant. « The tables have been set » décrit exactement ce que montre la photo. Repérer d’abord s’il y a des GENS, et combien, élimine la moitié des propositions avant même de les comprendre.',
    cefr: 'A2',
    tags: ['photo-description', 'voice'],
  },
];
