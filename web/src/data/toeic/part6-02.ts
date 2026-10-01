// Partie 6 — Textes à compléter. Banque n°2 : 2 textes, 8 items.
//
// Avec la banque n°1, la partie 6 atteint les **16 questions du vrai examen** (4 textes × 4 trous).
// Même structure imposée que dans `part6-01.ts` : un trou de temps verbal décidable seulement par
// une date citée ailleurs, un connecteur logique, une PHRASE ENTIÈRE à insérer, un trou local.
//
// Les deux genres ajoutés ici — article de presse interne et lettre commerciale — sont les deux
// autres supports que la partie 6 utilise réellement, à côté du courriel et de la note de service.
import type { ToeicItem, ToeicPassage } from '../../lib/toeic';

export const PART6_PASSAGES_02: readonly ToeicPassage[] = [
  {
    id: 'p6-text-03',
    kind: 'text',
    intro: 'Questions 9 to 12 refer to the following article.',
    docs: [
      {
        label: 'Lettre d’information interne',
        body: `WESTFIELD GROUP — Staff Newsletter, March edition

Cycle-to-work scheme doubles in its first year

When the cycle-to-work scheme opened last March, the Facilities team hoped that perhaps forty employees ______(9)______ up by the end of the year. In fact, one hundred and sixty-two have joined, and the secure bike store behind Building C is now full most mornings.

______(10)______ The company has therefore approved a second store, to be built on the far side of the staff car park before the summer.

The scheme is simple: the company buys the bicycle and the employee repays the cost over twelve months through payroll, ______(11)______ interest. Staff on fixed-term contracts of less than a year are not eligible, as the repayment period would outlast their contract.

Applications for the next round close on 30 April. Forms are available from Human Resources, and the Facilities team will be in the main atrium every Tuesday lunchtime to answer ______(12)______ about sizing and maintenance.`,
      },
    ],
  },
  {
    id: 'p6-text-04',
    kind: 'text',
    intro: 'Questions 13 to 16 refer to the following letter.',
    docs: [
      {
        label: 'Lettre commerciale',
        body: `Pellworth Instruments Ltd.
14 Carlisle Way, Sheffield S9 2TY

8 February

Ms. Hélène Rousseau
Laboratoire Vaugirard
Paris

Dear Ms. Rousseau,

Thank you for your enquiry of 2 February regarding calibration services for your spectrometers.

I am pleased to confirm that we can carry out the work on site. One of our engineers ______(13)______ your laboratory for two full days, which avoids the three-week turnaround that shipping the instruments to Sheffield would involve.

______(14)______ We would therefore ask that the instruments remain switched on and connected during the visit.

Our fee is 1,850 € per day, including travel. ______(15)______ the certificates are issued within five working days of the visit, at no additional charge.

If these terms are acceptable, please return the enclosed agreement. We have availability in the ______(16)______ week of March and would be glad to reserve it for you.

Yours sincerely,

Daniel Achebe
Service Manager`,
      },
    ],
  },
];

export const PART6_BANK_02: readonly ToeicItem[] = [
  // ---------- Texte 3 : lettre d'information interne ----------
  {
    id: 'p6-009',
    part: 6,
    passage: 'p6-text-03',
    stem: 'The Facilities team hoped that perhaps forty employees ______ up by the end of the year.',
    options: ['will sign', 'would sign', 'have signed', 'are signing'],
    answer: 1,
    explain:
      'Le verbe principal est au passé (« hoped »), et la subordonnée exprime un futur VU DEPUIS ce passé : c’est le futur dans le passé, « would sign ». « Will sign » serait correct après « hopes » au présent — toute la question tient à la concordance, pas au sens.',
    cefr: 'B2',
    tags: ['tense'],
  },
  {
    id: 'p6-010',
    part: 6,
    passage: 'p6-text-03',
    stem: 'The secure bike store behind Building C is now full most mornings. ______',
    options: [
      'Demand has clearly outgrown the space available.',
      'Building C was refurbished three years ago.',
      'Employees may also claim a mileage allowance for walking.',
      'The scheme was first proposed by the Finance department.',
    ],
    answer: 0,
    explain:
      'Phrase à INSÉRER : elle doit expliquer le passage du constat (l’abri est plein) à la décision qui suit (« the company has THEREFORE approved a second store »). Seule la première pose le problème que « therefore » résout. Les trois autres sont du contexte sans lien de cause.',
    cefr: 'B2',
    tags: ['text-structure'],
  },
  {
    id: 'p6-011',
    part: 6,
    passage: 'p6-text-03',
    stem: 'The employee repays the cost over twelve months through payroll, ______ interest.',
    options: ['free of', 'apart from', 'instead of', 'as well as'],
    answer: 0,
    explain:
      '« Free of interest » = sans intérêts, ce qui est l’argument de l’article (le dispositif est avantageux). « As well as interest » dirait l’inverse, et « instead of interest » n’a pas de sens : on rembourse un coût, pas des intérêts à la place.',
    cefr: 'B1',
    tags: ['preposition', 'collocation'],
  },
  {
    id: 'p6-012',
    part: 6,
    passage: 'p6-text-03',
    stem: 'The Facilities team will be in the main atrium every Tuesday lunchtime to answer ______ about sizing and maintenance.',
    options: ['questioning', 'questionable', 'questions', 'questioned'],
    answer: 2,
    explain:
      '« Answer » est transitif et appelle un NOM pluriel : « answer questions ». Les trois autres sont gérondif, adjectif et participe passé — le quatuor de formes d’une même racine, schéma de distracteur omniprésent aux parties 5 et 6.',
    cefr: 'A2',
    tags: ['word-form'],
  },

  // ---------- Texte 4 : lettre commerciale ----------
  {
    id: 'p6-013',
    part: 6,
    passage: 'p6-text-04',
    stem: 'One of our engineers ______ your laboratory for two full days.',
    options: ['visited', 'will visit', 'had visited', 'has visited'],
    answer: 1,
    explain:
      'La lettre propose une intervention à VENIR — elle se clôt sur une disponibilité « in the first week of March » alors qu’on est le 8 février. Seul le futur convient. Les trois autres situent la visite dans le passé, ce qui contredirait toute la lettre.',
    cefr: 'B1',
    tags: ['tense'],
  },
  {
    id: 'p6-014',
    part: 6,
    passage: 'p6-text-04',
    stem: 'This avoids the three-week turnaround that shipping the instruments to Sheffield would involve. ______',
    options: [
      'Calibration must be performed while the instruments are running.',
      'Our Sheffield workshop was expanded last year.',
      'Shipping costs are calculated by weight.',
      'Most of our clients are based in the United Kingdom.',
    ],
    answer: 0,
    explain:
      'Phrase à INSÉRER : la phrase suivante commence par « We would THEREFORE ask that the instruments remain switched on » — il faut donc une raison technique pour qu’ils restent allumés. Seule la première la donne. Le mot de liaison qui suit le trou est toujours le meilleur indice en partie 6.',
    cefr: 'B2',
    tags: ['text-structure'],
  },
  {
    id: 'p6-015',
    part: 6,
    passage: 'p6-text-04',
    stem: '______ the certificates are issued within five working days of the visit, at no additional charge.',
    options: ['Nevertheless', 'In addition,', 'Otherwise', 'By contrast'],
    answer: 1,
    explain:
      'Le paragraphe annonce un tarif, puis AJOUTE un avantage compris dedans : c’est une addition, pas une opposition. « Nevertheless » et « by contrast » marqueraient un contraste qui n’existe pas, et « otherwise » introduirait une alternative.',
    cefr: 'B1',
    tags: ['conjunction'],
  },
  {
    id: 'p6-016',
    part: 6,
    passage: 'p6-text-04',
    stem: 'We have availability in the ______ week of March and would be glad to reserve it for you.',
    options: ['one', 'first', 'once', 'former'],
    answer: 1,
    explain:
      'Pour situer une semaine dans le mois, l’anglais emploie l’ORDINAL : « the first week of March ». « The one week » compterait, « former » signifie « ancien » ou « le premier de deux déjà cités » — ce qui n’a pas de référent ici.',
    cefr: 'A2',
    tags: ['word-form', 'quantifier'],
  },
];
