// Partie 2 — Questions-réponses. Banque n°1 : 12 items.
//
// Format réel : on ENTEND une question puis trois réponses, et RIEN n'est imprimé. La feuille
// n'offre que trois pastilles A/B/C. C'est `PART_DISPLAY[2]` qui applique cette règle ; ici il faut
// seulement écrire les items en sachant que leur texte ne sera jamais lu à l'écran pendant
// l'épreuve — donc aucune indication ne peut passer par la typographie.
//
// Toutes les questions sont ORIGINALES. Règles d'écriture de la partie 2 :
//   · la question tient en une phrase parlée, 6 à 14 mots, sans subordonnée imbriquée ;
//   · les deux distracteurs accrochent un MOT de la question (même racine, même sonorité) sans y
//     répondre : c'est le piège réel de l'épreuve, pas le hors-sujet grossier ;
//   · au moins un tiers des bonnes réponses sont des réponses « indirectes » (« Je vais vérifier »
//     plutôt que « oui »), parce que c'est là que les francophones chutent ;
//   · `stem` porte la question en anglais — invisible pendant l'épreuve, affichée à la correction.
import type { ToeicItem } from '../../lib/toeic';

export const PART2_BANK_01: readonly ToeicItem[] = [
  {
    id: 'p2-001',
    part: 2,
    stem: 'When does the shipment from Rotterdam arrive?',
    options: ['At the loading dock.', 'Sometime on Thursday morning.', 'Yes, it has shipped.'],
    answer: 1,
    explain:
      '« When » demande un MOMENT : seule « Thursday morning » en donne un. « At the loading dock » répond à « where », et une question en « when » ne peut jamais recevoir « yes » — c’est le réflexe à acquérir : identifier le mot interrogatif avant d’écouter les réponses.',
    cefr: 'A2',
    tags: ['detail', 'gist'],
  },
  {
    id: 'p2-002',
    part: 2,
    stem: 'Who is handling the Mercer account now?',
    options: ['Priya took it over last month.', 'In the second-floor meeting room.', 'It was a handy solution.'],
    answer: 0,
    explain:
      '« Who » demande une PERSONNE. Les deux distracteurs rebondissent sur des sons : « handling » → « handy », et un lieu pour une question qui n’en demande pas. Cette reprise sonore est le piège numéro un de la partie 2.',
    cefr: 'A2',
    tags: ['detail'],
  },
  {
    id: 'p2-003',
    part: 2,
    stem: 'Would you like me to book the conference room for two hours?',
    options: ['It’s a very nice room, thank you.', 'Make it three, just to be safe.', 'I booked a flight yesterday.'],
    answer: 1,
    explain:
      'Réponse INDIRECTE : au lieu d’un « yes », on accepte en corrigeant la durée — « make it three » suppose qu’on veut bien la réservation. « I booked a flight » reprend « book » dans un autre sens, c’est le distracteur classique.',
    cefr: 'B1',
    tags: ['speech-act', 'inference'],
  },
  {
    id: 'p2-004',
    part: 2,
    stem: 'Why was the quarterly review postponed?',
    options: ['Because the auditors asked for more time.', 'Twice a year, usually.', 'In the main auditorium.'],
    answer: 0,
    explain:
      '« Why » demande une CAUSE, et « because » l’introduit. « Twice a year » répond à « how often », « in the auditorium » à « where » : deux réponses correctes… à d’autres questions.',
    cefr: 'A2',
    tags: ['detail'],
  },
  {
    id: 'p2-005',
    part: 2,
    stem: 'Haven’t the invoices been approved yet?',
    options: ['No, they’re still with Finance.', 'Yes, I approve of that idea.', 'About forty euros each.'],
    answer: 0,
    explain:
      'Question NÉGATIVE (« haven’t… yet ») : elle attend une confirmation, et « no » signifie ici « non, ce n’est pas encore fait ». Attention au faux ami de construction : « approve » = valider, « approve OF » = être favorable à — le distracteur joue exactement là-dessus.',
    cefr: 'B1',
    tags: ['speech-act', 'preposition'],
  },
  {
    id: 'p2-006',
    part: 2,
    stem: 'Where did you put the signed contracts?',
    options: ['They were signed on Monday.', 'In the top drawer of my desk.', 'The contractor called back.'],
    answer: 1,
    explain:
      '« Where » demande un LIEU. « They were signed on Monday » reprend « signed » pour répondre à « when », et « contractor » n’est qu’un écho sonore de « contract ». Repérer le mot interrogatif reste la seule stratégie fiable.',
    cefr: 'A1',
    tags: ['detail'],
  },
  {
    id: 'p2-007',
    part: 2,
    stem: 'How long will the server maintenance take?',
    options: ['The server room is downstairs.', 'No more than ninety minutes.', 'By our usual provider.'],
    answer: 1,
    explain:
      '« How long » demande une DURÉE : « ninety minutes ». Ne pas confondre avec « how far » (distance) ni « how often » (fréquence) — en français « combien de temps » et « à quelle fréquence » se ressemblent moins qu’en anglais parlé.',
    cefr: 'A2',
    tags: ['detail'],
  },
  {
    id: 'p2-008',
    part: 2,
    stem: 'Should we hire a temporary assistant or extend Daniel’s contract?',
    options: ['Extending his contract would be cheaper.', 'Yes, we should.', 'He assisted the auditors last year.'],
    answer: 0,
    explain:
      'Question ALTERNATIVE (« X or Y ») : elle ne peut PAS recevoir « yes » ni « no », il faut choisir une branche ou en proposer une troisième. C’est une règle mécanique qui élimine un distracteur sans rien comprendre d’autre.',
    cefr: 'B1',
    tags: ['speech-act'],
  },
  {
    id: 'p2-009',
    part: 2,
    stem: 'The new badge readers are installed on every floor, aren’t they?',
    options: ['I’ll double-check with Facilities.', 'Yes, I read it this morning.', 'On the fourth floor, mostly.'],
    answer: 0,
    explain:
      'Réponse INDIRECTE à un « tag question » : « je vérifie » est une non-réponse parfaitement valide, et c’est souvent la bonne au TOEIC. « I read it » joue sur l’homographe « readers / read ».',
    cefr: 'B1',
    tags: ['inference', 'speech-act'],
  },
  {
    id: 'p2-010',
    part: 2,
    stem: 'How much did the catering for the launch cost?',
    options: ['At the rooftop terrace.', 'The caterer arrives at noon.', 'A little under two thousand.'],
    answer: 2,
    explain:
      '« How much » demande un MONTANT. Les deux distracteurs sont construits sur « catering » (lieu de l’événement, heure du traiteur) : plausibles dans la conversation, mais muets sur le prix.',
    cefr: 'A2',
    tags: ['detail'],
  },
  {
    id: 'p2-011',
    part: 2,
    stem: 'I can’t find the attendance sheet for yesterday’s training.',
    options: ['It trains twice an hour.', 'Marta scanned it and emailed it to everyone.', 'About twenty people attended.'],
    answer: 1,
    explain:
      'Ce n’est pas une question mais une DÉCLARATION : elle attend qu’on résolve le problème. La bonne réponse dit où retrouver le document. « About twenty people attended » est vrai, utile… et répond à une question qui n’a pas été posée.',
    cefr: 'B1',
    tags: ['speech-act', 'inference'],
  },
  {
    id: 'p2-012',
    part: 2,
    stem: 'Which supplier gave us the better delivery terms?',
    options: ['Delivered on Tuesday, I believe.', 'The one in Lyon, by two days.', 'Because their prices dropped.'],
    answer: 1,
    explain:
      '« Which supplier » demande de DÉSIGNER un fournisseur parmi plusieurs : « the one in Lyon » le fait, et « by two days » précise l’écart. « Because » répond à « why » — un connecteur mal placé suffit à écarter une réponse.',
    cefr: 'B1',
    tags: ['detail', 'comparative'],
  },
];
