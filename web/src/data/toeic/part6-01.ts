// Partie 6 — Textes à compléter. Banque n°1 : 2 textes, 8 items.
//
// La partie 6 n'est PAS une partie 5 allongée, et c'est l'erreur que fait tout le monde : les
// quatre propositions sont souvent toutes correctes GRAMMATICALEMENT, et seule la lecture du reste
// du texte départage. Chaque texte contient donc ici :
//   · un trou qui se joue sur le temps verbal, décidable seulement avec une date citée ailleurs ;
//   · un trou de connecteur logique, décidable seulement en lisant la phrase précédente ;
//   · une PHRASE ENTIÈRE à insérer (le format depuis 2016) ;
//   · un trou de vocabulaire ou de construction, lui décidable localement.
//
// `stem` reprend la phrase trouée telle qu'elle apparaît dans le texte, pour que la correction
// soit lisible sans relire tout le document. Le document complet, lui, est dans le `ToeicPassage`
// et reste affiché à l'écran pendant toute la section — comme au vrai examen.
import type { ToeicItem, ToeicPassage } from '../../lib/toeic';

export const PART6_PASSAGES_01: readonly ToeicPassage[] = [
  {
    id: 'p6-text-01',
    kind: 'text',
    intro: 'Questions 1 to 4 refer to the following email.',
    docs: [
      {
        label: 'Courriel interne',
        body: `To: All Birchwood House staff
From: Facilities Management
Date: 3 October
Subject: Relocation to the Carlton Building

Dear colleagues,

As announced in July, our move to the Carlton Building will take place over the weekend of 18–19 October. By the time you return on Monday the 20th, the removal team ______(1)______ every desk, chair and monitor to the new floor.

Please pack your personal belongings into the grey crates delivered to your desk this week. ______(2)______ Anything left loose on a desk on Friday evening will be treated as waste.

______(3)______ the lifts in the Carlton Building are smaller than ours, the removal team has asked that no crate weigh more than fifteen kilograms. Use two crates rather than overfilling one.

Finally, your door badge will stop working at the Birchwood entrance on Friday at 6 p.m. Replacement badges can be ______(4)______ from the reception desk on Monday morning from 8 a.m.

Thank you for your patience,
Facilities Management`,
      },
    ],
  },
  {
    id: 'p6-text-02',
    kind: 'text',
    intro: 'Questions 5 to 8 refer to the following notice.',
    docs: [
      {
        label: 'Note de service',
        body: `NOTICE — Changes to the expense claim procedure

Effective 1 November, all expense claims must be submitted through the Aster portal rather than on paper forms. The finance team ______(5)______ paper claims since the portal was introduced last spring, but from November they will no longer be accepted at all.

Submitting through the portal has one clear advantage: claims are reimbursed in the payroll run that follows approval, which is usually within ten working days. ______(6)______

Receipts must be photographed and attached to each line of the claim. A claim submitted ______(7)______ a legible receipt will be returned automatically, and the delay counts against the sixty-day deadline.

______(8)______ you have questions about a specific category of expense, the full policy is available on the intranet under Finance › Expenses.

Alina Novak
Head of Finance`,
      },
    ],
  },
];

export const PART6_BANK_01: readonly ToeicItem[] = [
  // ---------- Texte 1 : déménagement ----------
  {
    id: 'p6-001',
    part: 6,
    passage: 'p6-text-01',
    stem: 'By the time you return on Monday the 20th, the removal team ______ every desk, chair and monitor to the new floor.',
    options: ['moves', 'will have moved', 'had moved', 'is moving'],
    answer: 1,
    explain:
      '« By the time + présent » projette dans le futur, et l’action doit être ACHEVÉE à ce moment-là : c’est exactement l’emploi du futur antérieur, « will have moved ». « Had moved » situerait l’achèvement avant un point du PASSÉ, alors que le lundi 20 est encore à venir au moment où le courriel est écrit (daté du 3 octobre).',
    cefr: 'B2',
    tags: ['tense'],
  },
  {
    id: 'p6-002',
    part: 6,
    passage: 'p6-text-01',
    stem: 'Please pack your personal belongings into the grey crates delivered to your desk this week. ______',
    options: [
      'Label each crate with your name and new desk number.',
      'The grey crates are available in three different sizes.',
      'Parking permits for the Carlton Building are issued separately.',
      'Our July announcement explained the reasons for the move.',
    ],
    answer: 0,
    explain:
      'Phrase à INSÉRER : elle doit tenir entre ce qui précède (rangez vos affaires dans les caisses) et ce qui suit (ce qui reste sur le bureau sera jeté). Seule la consigne d’étiquetage prolonge cette instruction. Les trois autres sont vraies ou plausibles mais rompent le fil : c’est le test de cohérence, pas de vérité.',
    cefr: 'B2',
    tags: ['text-structure'],
  },
  {
    id: 'p6-003',
    part: 6,
    passage: 'p6-text-01',
    stem: '______ the lifts in the Carlton Building are smaller than ours, the removal team has asked that no crate weigh more than fifteen kilograms.',
    options: ['Nevertheless', 'Because', 'In spite of', 'So that'],
    answer: 1,
    explain:
      'La petitesse des ascenseurs est la CAUSE de la limite de poids : il faut une conjonction de cause suivie d’une proposition, « because ». « In spite of » est une préposition (elle appellerait un nom, pas « the lifts are… ») et exprimerait en plus une concession — l’inverse du lien logique.',
    cefr: 'B1',
    tags: ['conjunction'],
  },
  {
    id: 'p6-004',
    part: 6,
    passage: 'p6-text-01',
    stem: 'Replacement badges can be ______ from the reception desk on Monday morning from 8 a.m.',
    options: ['collecting', 'collection', 'collected', 'collective'],
    answer: 2,
    explain:
      'Après « can be », la voix passive exige le PARTICIPE PASSÉ : « collected ». Les trois autres sont la même racine sous d’autres natures — gérondif, nom, adjectif —, le schéma de distracteur le plus fréquent de tout le TOEIC.',
    cefr: 'A2',
    tags: ['word-form', 'voice'],
  },

  // ---------- Texte 2 : note de frais ----------
  {
    id: 'p6-005',
    part: 6,
    passage: 'p6-text-02',
    stem: 'The finance team ______ paper claims since the portal was introduced last spring, but from November they will no longer be accepted at all.',
    options: ['discourages', 'has been discouraging', 'will discourage', 'discouraged'],
    answer: 1,
    explain:
      '« Since + point de départ dans le passé » et une action qui dure jusqu’à maintenant : c’est le present perfect, ici dans sa forme continue. Le « but from November » qui suit confirme qu’on n’est pas encore en novembre — « will discourage » placerait à tort toute la phrase dans le futur.',
    cefr: 'B2',
    tags: ['tense'],
  },
  {
    id: 'p6-006',
    part: 6,
    passage: 'p6-text-02',
    stem: 'Claims are reimbursed in the payroll run that follows approval, which is usually within ten working days. ______',
    options: [
      'Paper claims often took six weeks or more.',
      'The payroll department has moved to the third floor.',
      'Please do not send receipts by internal post.',
      'Aster also manages our holiday requests.',
    ],
    answer: 0,
    explain:
      'La phrase précédente annonce « one clear advantage » et donne un délai de dix jours. Un avantage se démontre par une COMPARAISON : les six semaines du papier. Les trois autres sont du contexte vrai mais ne soutiennent pas l’argument, et laisseraient « one clear advantage » sans démonstration.',
    cefr: 'B2',
    tags: ['text-structure'],
  },
  {
    id: 'p6-007',
    part: 6,
    passage: 'p6-text-02',
    stem: 'A claim submitted ______ a legible receipt will be returned automatically.',
    options: ['without', 'except', 'besides', 'unless'],
    answer: 0,
    explain:
      'Il faut une préposition suivie d’un groupe nominal et signifiant l’absence : « without a legible receipt ». « Unless » est une conjonction, elle appellerait un sujet et un verbe ; « besides » veut dire « en plus de » — sens contraire.',
    cefr: 'B1',
    tags: ['preposition'],
  },
  {
    id: 'p6-008',
    part: 6,
    passage: 'p6-text-02',
    stem: '______ you have questions about a specific category of expense, the full policy is available on the intranet.',
    options: ['Although', 'If', 'Whereas', 'Despite'],
    answer: 1,
    explain:
      'La proposition pose une CONDITION — si vous avez des questions, voilà où chercher. « Although » et « whereas » marquent l’opposition, « despite » est une préposition. Rappel utile : au TOEIC, un trou en tête de phrase suivi d’un sujet et d’un verbe ne peut jamais être « despite » ni « in spite of ».',
    cefr: 'A2',
    tags: ['conjunction'],
  },
];
