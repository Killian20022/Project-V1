// Partie 3 — Conversations. Banque n°2 : 4 conversations, 12 items.
//
// Porte la partie 3 de 9 à 21 items (le vrai examen en compte 39 : 13 conversations).
// Mêmes règles qu'en banque n°1, plus les deux situations que la n°1 n'avait pas :
//   · un échange avec un CLIENT externe, et non entre collègues ;
//   · une conversation où un interlocuteur se MÉPREND, ce qui donne une question d'intention.
import type { ToeicItem, ToeicPassage } from '../../lib/toeic';

export const PART3_PASSAGES_02: readonly ToeicPassage[] = [
  {
    id: 'p3-conv-04',
    kind: 'dialogue',
    intro: 'Questions 10 to 12 refer to the following conversation.',
    turns: [
      {
        speaker: 'Homme',
        voice: 'B',
        text: 'Pardon me — I booked a rental car under the name Villard, but the desk says there’s nothing in the system.',
      },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'Let me check. Ah — I see the problem. The reservation was made for the city centre branch, not the airport. They’re separate locations.',
      },
      { speaker: 'Homme', voice: 'B', text: 'That’s twenty minutes away, and my meeting starts at two.' },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'I can transfer the booking here, but the only vehicle left on the lot is a van. It’s a larger category, though I won’t charge you the difference given the mix-up.',
      },
      { speaker: 'Homme', voice: 'B', text: 'A van is fine. How soon can I have the keys?' },
      { speaker: 'Femme', voice: 'A', text: 'Five minutes, once I’ve printed the new agreement.' },
    ],
  },
  {
    id: 'p3-conv-05',
    kind: 'dialogue',
    intro: 'Questions 13 to 15 refer to the following conversation.',
    turns: [
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'Did you see that the print supplier raised their prices again? Eight percent on everything.',
      },
      { speaker: 'Homme', voice: 'B', text: 'Eight? They told us last autumn that the previous rise would be the last one.' },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'Apparently paper costs went up. I’ve asked two other firms for quotes, but neither can match the turnaround we get now — three days instead of one.',
      },
      {
        speaker: 'Homme',
        voice: 'B',
        text: 'For the monthly catalogue, three days would be tight but manageable. For urgent client work it would not.',
      },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'Then maybe we split it: the catalogue goes to whoever is cheapest, and the urgent work stays where it is.',
      },
      { speaker: 'Homme', voice: 'B', text: 'Put that to Priya. She signs off on anything over ten thousand.' },
    ],
  },
  {
    id: 'p3-conv-06',
    kind: 'dialogue',
    intro: 'Questions 16 to 18 refer to the following conversation with three speakers.',
    turns: [
      {
        speaker: 'Homme 1',
        voice: 'B',
        text: 'So the new starters arrive Monday. Have we sorted out their equipment?',
      },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'Laptops arrived yesterday. What we don’t have are the security passes — HR only sent me the photographs this morning.',
      },
      { speaker: 'Homme 2', voice: 'C', text: 'How long does the pass printing usually take?' },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'Three working days with the external provider. So Monday is out of the question.',
      },
      {
        speaker: 'Homme 2',
        voice: 'C',
        text: 'We still have that box of visitor badges in the drawer. They open the main door and the lifts — just not the server floor, which new starters don’t need in their first week anyway.',
      },
      { speaker: 'Homme 1', voice: 'B', text: 'That solves it. Can you set six of those aside before Friday?' },
    ],
  },
  {
    id: 'p3-conv-07',
    kind: 'dialogue',
    intro: 'Questions 19 to 21 refer to the following conversation with three speakers.',
    turns: [
      {
        speaker: 'Femme 1',
        voice: 'A',
        text: 'The architect sent the revised drawings for the café refit. The counter has moved to the window side.',
      },
      {
        speaker: 'Homme',
        voice: 'B',
        text: 'That’s what we asked for. Does it still leave room for the queue without blocking the entrance?',
      },
      {
        speaker: 'Femme 2',
        voice: 'C',
        text: 'Just about. I measured it off the plan — one metre eighty between the counter and the first table. The regulations require one metre fifty.',
      },
      { speaker: 'Homme', voice: 'B', text: 'Then we’re fine on paper. I’d still like to see it marked out on the floor before anyone orders the units.' },
      {
        speaker: 'Femme 1',
        voice: 'A',
        text: 'I can tape it out tomorrow morning while the café is closed. It takes an hour and it has saved us twice before.',
      },
    ],
  },
];

export const PART3_BANK_02: readonly ToeicItem[] = [
  // ---------- Conversation 4 : location de voiture ----------
  {
    id: 'p3-010',
    part: 3,
    passage: 'p3-conv-04',
    stem: 'Where most likely are the speakers?',
    options: ['At an airport rental counter', 'In a hotel lobby', 'At a repair garage', 'In a city centre office'],
    answer: 0,
    explain:
      'Déduction : il parle d’un véhicule réservé, la femme oppose « the city centre branch » à « the airport », et il y a un « lot » avec des véhicules. On est donc AU comptoir de l’aéroport. L’agence du centre-ville est citée pour être écartée — un lieu mentionné n’est pas le lieu de la scène.',
    cefr: 'B1',
    tags: ['gist', 'inference'],
  },
  {
    id: 'p3-011',
    part: 3,
    passage: 'p3-conv-04',
    stem: 'What does the woman offer the man?',
    options: [
      'A refund of his deposit',
      'A larger vehicle at no extra cost',
      'Transport to another branch',
      'A discount on his next rental',
    ],
    answer: 1,
    explain:
      '« The only vehicle left is a van. It’s a larger category, though I won’t charge you the difference. » La bonne réponse condense deux répliques : la catégorie supérieure ET la gratuité du supplément. Les questions de détail de la partie 3 exigent souvent cette synthèse.',
    cefr: 'B1',
    tags: ['detail'],
  },
  {
    id: 'p3-012',
    part: 3,
    passage: 'p3-conv-04',
    stem: 'What will the woman do next?',
    options: ['Call the other branch', 'Inspect the vehicle', 'Print a new agreement', 'Cancel the original booking'],
    answer: 2,
    explain:
      '« Five minutes, once I’ve printed the new agreement. » Le transfert de réservation est déjà annoncé plus haut, mais c’est l’impression du contrat qui est l’action IMMÉDIATE — « next » veut dire la toute prochaine, pas n’importe laquelle des suivantes.',
    cefr: 'B1',
    tags: ['next-action'],
  },

  // ---------- Conversation 5 : hausse de tarif fournisseur ----------
  {
    id: 'p3-013',
    part: 3,
    passage: 'p3-conv-05',
    stem: 'What problem do the speakers discuss?',
    options: [
      'A supplier has increased its prices.',
      'A delivery was lost in transit.',
      'A catalogue contains errors.',
      'A contract has expired.',
    ],
    answer: 0,
    explain:
      '« The print supplier raised their prices again? Eight percent on everything. » Tout le reste — devis, délais, répartition — découle de ce problème unique, et c’est lui que demande la question d’ensemble.',
    cefr: 'A2',
    tags: ['gist'],
  },
  {
    id: 'p3-014',
    part: 3,
    passage: 'p3-conv-05',
    stem: 'Why does the man say, “For urgent client work it would not”?',
    options: [
      'He believes the price rise is unjustified.',
      'A three-day turnaround would be too slow.',
      'He prefers to keep a single supplier.',
      'Client work is less profitable than the catalogue.',
    ],
    answer: 1,
    explain:
      'Question d’INTENTION, sur une phrase ELLIPTIQUE : « it would not » reprend « would be manageable » de la proposition précédente. Il dit donc que trois jours ne sont PAS gérables pour l’urgent. Ce type d’ellipse est précisément ce que la partie 3 teste depuis 2016.',
    cefr: 'B2',
    tags: ['inference'],
  },
  {
    id: 'p3-015',
    part: 3,
    passage: 'p3-conv-05',
    stem: 'What does the man suggest the woman do?',
    options: [
      'Negotiate directly with the current supplier',
      'Request three more quotes',
      'Take the proposal to Priya for approval',
      'Postpone the next catalogue',
    ],
    answer: 2,
    explain:
      '« Put that to Priya. She signs off on anything over ten thousand. » La seconde phrase donne la RAISON et confirme qu’il s’agit d’une validation, pas d’une simple information. Repérer qui détient la décision est une question récurrente de la partie 3.',
    cefr: 'B1',
    tags: ['next-action', 'detail'],
  },

  // ---------- Conversation 6 : badges des nouveaux arrivants ----------
  {
    id: 'p3-016',
    part: 3,
    passage: 'p3-conv-06',
    stem: 'What is the main problem?',
    options: [
      'The laptops have not been delivered.',
      'The security passes will not be ready in time.',
      'HR has not confirmed the start date.',
      'The new employees need server access.',
    ],
    answer: 1,
    explain:
      '« Three working days with the external provider. So Monday is out of the question. » Les ordinateurs sont au contraire arrivés la veille : le distracteur 1 inverse une information donnée explicitement, piège constant de la partie 3.',
    cefr: 'B1',
    tags: ['gist', 'detail'],
  },
  {
    id: 'p3-017',
    part: 3,
    passage: 'p3-conv-06',
    stem: 'What solution does the second man propose?',
    options: [
      'Delaying the new employees’ start date',
      'Printing the passes in-house',
      'Using visitor badges temporarily',
      'Asking HR to resend the photographs',
    ],
    answer: 2,
    explain:
      '« We still have that box of visitor badges in the drawer. » Il justifie ensuite leur limite — pas d’accès à l’étage des serveurs — en montrant qu’elle est sans conséquence la première semaine. Une solution est souvent accompagnée, en partie 3, de la réfutation de son objection.',
    cefr: 'B1',
    tags: ['detail', 'inference'],
  },
  {
    id: 'p3-018',
    part: 3,
    passage: 'p3-conv-06',
    stem: 'What is the woman asked to do before Friday?',
    options: [
      'Set aside six badges',
      'Contact the external provider',
      'Collect the laptops',
      'Photograph the new starters',
    ],
    answer: 0,
    explain:
      '« Can you set six of those aside before Friday ? » Attention : la demande s’adresse à la femme, alors que c’est le SECOND homme qui a proposé la solution. Les conversations à trois voix exploitent systématiquement cette confusion.',
    cefr: 'B1',
    tags: ['next-action'],
  },

  // ---------- Conversation 7 : réaménagement d'un café ----------
  {
    id: 'p3-019',
    part: 3,
    passage: 'p3-conv-07',
    stem: 'What are the speakers reviewing?',
    options: [
      'Revised plans for a café refit',
      'A new health and safety policy',
      'Applications for a café manager',
      'A customer satisfaction survey',
    ],
    answer: 0,
    explain:
      '« The architect sent the revised drawings for the café refit. » La réglementation est évoquée comme critère de vérification du plan, pas comme un sujet distinct — ne pas confondre un critère avec l’objet de la réunion.',
    cefr: 'A2',
    tags: ['gist'],
  },
  {
    id: 'p3-020',
    part: 3,
    passage: 'p3-conv-07',
    stem: 'What does the second woman confirm?',
    options: [
      'The counter is too close to the entrance.',
      'The spacing exceeds the legal minimum.',
      'The drawings are missing a dimension.',
      'The tables will have to be removed.',
    ],
    answer: 1,
    explain:
      'Un mètre quatre-vingts mesurés contre un mètre cinquante exigés : l’espace est SUPÉRIEUR au minimum. La question demande de comparer deux chiffres entendus une seule fois chacun — c’est l’exercice le plus coûteux de la partie 3, et la raison pour laquelle on note les nombres au vol.',
    cefr: 'B2',
    tags: ['detail', 'comparative'],
  },
  {
    id: 'p3-021',
    part: 3,
    passage: 'p3-conv-07',
    stem: 'What will the first woman do tomorrow morning?',
    options: [
      'Order the counter units',
      'Meet the architect on site',
      'Mark the layout on the floor',
      'Review the safety regulations',
    ],
    answer: 2,
    explain:
      '« I can tape it out tomorrow morning while the café is closed. » « Tape it out » reprend « marked out on the floor » demandé par l’homme : la bonne réponse PARAPHRASE, elle ne recopie pas — et commander les meubles est justement ce qu’il faut éviter avant ce traçage.',
    cefr: 'B2',
    tags: ['next-action', 'inference'],
  },
];
