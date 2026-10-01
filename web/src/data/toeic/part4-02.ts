// Partie 4 — Exposés courts. Banque n°2 : 3 exposés, 9 items.
//
// Porte la partie 4 de 9 à 18 items (le vrai examen en compte 30 : 10 exposés).
// Trois genres que la banque n°1 n'avait pas : la visite guidée, le bulletin d'information
// radiophonique et l'ouverture d'une formation. Comme en banque n°1, chaque exposé contient un
// CHANGEMENT DE CAP en milieu de texte — c'est ce qui punit le candidat qui répond trop tôt.
import type { ToeicItem, ToeicPassage } from '../../lib/toeic';

export const PART4_PASSAGES_02: readonly ToeicPassage[] = [
  {
    id: 'p4-talk-04',
    kind: 'talk',
    intro: 'Questions 10 to 12 refer to the following talk.',
    turns: [
      {
        speaker: 'Homme',
        voice: 'B',
        text:
          'Welcome to the Haverly Pottery Works. My name is Ewan and I’ll be taking you round this morning. ' +
          'The tour lasts about fifty minutes and finishes in the shop, where everything you’ll see being made today is on sale. ' +
          'A word on photography: you’re welcome to take pictures anywhere on the ground floor, but not in the glazing room upstairs, where the designs are still unreleased. ' +
          'You’ll also notice it gets quite warm near the kilns, so do leave your coats on the rack behind me rather than carrying them. ' +
          'One last thing — the floor in the throwing room is often wet. Please stay on the marked walkway.',
      },
    ],
  },
  {
    id: 'p4-talk-05',
    kind: 'talk',
    intro: 'Questions 13 to 15 refer to the following broadcast.',
    turns: [
      {
        speaker: 'Femme',
        voice: 'A',
        text:
          'And now the local business report. Ridgeway Foods has confirmed that it will open a second processing plant at Kellerton, creating around two hundred and forty jobs over the next eighteen months. ' +
          'The company had originally identified a site at Brackwell, but withdrew after a survey found the access road could not take the lorry traffic. ' +
          'Recruitment for the first eighty positions begins in September, and Ridgeway says it will give preference to applicants already living within the county. ' +
          'A jobs fair is planned for the last weekend of August at the Kellerton community hall — we’ll bring you the exact dates once they’re announced. ' +
          'After the break, the weather for the holiday weekend.',
      },
    ],
  },
  {
    id: 'p4-talk-06',
    kind: 'talk',
    intro: 'Questions 16 to 18 refer to the following introduction.',
    turns: [
      {
        speaker: 'Femme',
        voice: 'C',
        text:
          'Good morning everyone, and thank you for making the early start. Today’s session is on the new customer database, and I want to set expectations before we begin. ' +
          'This is not a demonstration — you will each be working on a live test account, and you’ll make mistakes, which is the point of doing it here rather than in front of a customer. ' +
          'I had planned to cover reporting as well, but the reporting module won’t be switched on until October, so we’ll leave that for a second session. ' +
          'Your login details are on the card at your place. Please don’t share them, even with colleagues in this room — every action is logged against the account that performed it.',
      },
    ],
  },
];

export const PART4_BANK_02: readonly ToeicItem[] = [
  // ---------- Exposé 4 : visite guidée ----------
  {
    id: 'p4-010',
    part: 4,
    passage: 'p4-talk-04',
    stem: 'Where does the talk take place?',
    options: ['At a pottery factory', 'In an art gallery', 'At a garden centre', 'In a department store'],
    answer: 0,
    explain:
      '« Welcome to the Haverly Pottery Works », puis four, salle d’émaillage, salle de tournage. La boutique est mentionnée comme fin de parcours : encore une fois, un lieu CITÉ n’est pas le lieu de la scène.',
    cefr: 'A2',
    tags: ['gist'],
  },
  {
    id: 'p4-011',
    part: 4,
    passage: 'p4-talk-04',
    stem: 'What restriction does the speaker mention?',
    options: [
      'Photography is not allowed upstairs.',
      'The shop closes before the tour ends.',
      'Bags must be left at the entrance.',
      'Visitors may not enter the throwing room.',
    ],
    answer: 0,
    explain:
      'C’est le changement de cap : « you’re welcome to take pictures anywhere on the ground floor, BUT not in the glazing room upstairs ». Le vestiaire concerne les manteaux, pas les sacs, et la salle de tournage reste accessible — seulement par le passage balisé.',
    cefr: 'B1',
    tags: ['detail'],
  },
  {
    id: 'p4-012',
    part: 4,
    passage: 'p4-talk-04',
    stem: 'Why does the speaker ask listeners to use the rack?',
    options: [
      'To keep the walkway clear',
      'Because the work areas are hot',
      'To prevent damage to the pottery',
      'Because the tour includes a climb',
    ],
    answer: 1,
    explain:
      '« It gets quite warm near the kilns, SO do leave your coats on the rack. » La cause est donnée juste avant la consigne. Le passage balisé existe bien, mais pour le sol mouillé : deux consignes voisines, deux raisons différentes, et c’est là qu’on se trompe.',
    cefr: 'B1',
    tags: ['detail', 'inference'],
  },

  // ---------- Exposé 5 : bulletin économique ----------
  {
    id: 'p4-013',
    part: 4,
    passage: 'p4-talk-05',
    stem: 'What is the main topic of the report?',
    options: [
      'The opening of a new processing plant',
      'A change to local road regulations',
      'The closure of a food company',
      'The results of a county survey',
    ],
    answer: 0,
    explain:
      '« Ridgeway Foods has confirmed that it will open a second processing plant at Kellerton. » L’étude de voirie et le site abandonné expliquent le CHOIX du lieu : ce sont des circonstances, pas le sujet.',
    cefr: 'B1',
    tags: ['gist'],
  },
  {
    id: 'p4-014',
    part: 4,
    passage: 'p4-talk-05',
    stem: 'Why was the Brackwell site rejected?',
    options: [
      'The land was too expensive.',
      'Local residents objected.',
      'The access road was inadequate.',
      'It was too far from the county.',
    ],
    answer: 2,
    explain:
      '« A survey found the access road could not take the lorry traffic. » C’est le changement de cap : l’entreprise avait d’abord retenu Brackwell. Un candidat qui cesse d’écouter après « Kellerton » rate complètement cette question.',
    cefr: 'B2',
    tags: ['detail'],
  },
  {
    id: 'p4-015',
    part: 4,
    passage: 'p4-talk-05',
    stem: 'What does the speaker say will be announced later?',
    options: [
      'The total number of jobs created',
      'The exact dates of a jobs fair',
      'The name of the new plant manager',
      'The date recruitment begins',
    ],
    answer: 1,
    explain:
      '« We’ll bring you the exact dates once they’re announced. » Les trois autres informations sont déjà données dans le bulletin — 240 emplois, recrutement en septembre. La question porte sur ce qui MANQUE encore, pas sur ce qui a été dit.',
    cefr: 'B2',
    tags: ['detail', 'inference'],
  },

  // ---------- Exposé 6 : ouverture de formation ----------
  {
    id: 'p4-016',
    part: 4,
    passage: 'p4-talk-06',
    stem: 'What does the speaker emphasize about the session?',
    options: [
      'Participants will practise themselves.',
      'Attendance is compulsory.',
      'It will be recorded for later viewing.',
      'It replaces an earlier training course.',
    ],
    answer: 0,
    explain:
      '« This is not a demonstration — you will each be working on a live test account. » Elle insiste même sur le droit à l’erreur. C’est l’opposition explicite démonstration / pratique qui porte la réponse.',
    cefr: 'B1',
    tags: ['gist'],
  },
  {
    id: 'p4-017',
    part: 4,
    passage: 'p4-talk-06',
    stem: 'Why will reporting not be covered today?',
    options: [
      'There is not enough time.',
      'The module is not yet available.',
      'It requires a separate licence.',
      'Participants have already learned it.',
    ],
    answer: 1,
    explain:
      '« The reporting module won’t be switched on until October. » Le manque de temps est le distracteur naturel — c’est la raison qu’on suppose — mais l’exposé en donne une autre, et c’est celle-là qu’il faut entendre.',
    cefr: 'B1',
    tags: ['detail'],
  },
  {
    id: 'p4-018',
    part: 4,
    passage: 'p4-talk-06',
    stem: 'Why does the speaker warn against sharing login details?',
    options: [
      'Accounts are limited to one device.',
      'The passwords expire after one use.',
      'Actions are recorded against each account.',
      'Colleagues have their own test data.',
    ],
    answer: 2,
    explain:
      '« Every action is logged against the account that performed it. » La raison suit immédiatement la consigne, introduite par un tiret. En partie 4, une consigne est presque toujours suivie de sa justification — c’est elle qui est interrogée.',
    cefr: 'B2',
    tags: ['detail', 'inference'],
  },
];
