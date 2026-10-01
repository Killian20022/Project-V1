// Partie 4 — Exposés courts. Banque n°1 : 3 exposés, 9 items.
//
// Un seul locuteur, 90 à 130 mots, et les trois genres qui reviennent le plus au vrai examen :
// message vocal professionnel, annonce au public, extrait de réunion. Comme en partie 3, le script
// reste à l'oral et seules les questions sont imprimées.
//
// Le piège propre à la partie 4 est le CHANGEMENT DE CAP en milieu d'exposé (« however »,
// « that said », « one correction ») : l'information finale contredit celle du début, et le candidat
// qui a répondu trop tôt se trompe. Chaque exposé en contient un, délibérément.
import type { ToeicItem, ToeicPassage } from '../../lib/toeic';

export const PART4_PASSAGES_01: readonly ToeicPassage[] = [
  {
    id: 'p4-talk-01',
    kind: 'talk',
    intro: 'Questions 1 to 3 refer to the following telephone message.',
    turns: [
      {
        speaker: 'Femme',
        voice: 'A',
        text:
          'Hello, Mr. Okafor, this is Lena Brandt from Halvorsen Engineering. I’m following up on the site survey we scheduled for the twelfth. ' +
          'Our structural engineer has reviewed the plans you sent and she has everything she needs, so the visit should take about two hours rather than the full morning we originally blocked out. ' +
          'However, I do need one thing before we come: a copy of the building’s current fire safety certificate. Our insurer won’t let us on site without it. ' +
          'If you can email that to me by Thursday, we’ll confirm the appointment. Otherwise we may have to push the survey back a week. You can reach me on extension 2-1-4.',
      },
    ],
  },
  {
    id: 'p4-talk-02',
    kind: 'talk',
    intro: 'Questions 4 to 6 refer to the following announcement.',
    turns: [
      {
        speaker: 'Homme',
        voice: 'B',
        text:
          'Good afternoon, shoppers, and welcome to Thornbury Home and Garden. A reminder that our autumn clearance continues through Sunday, with thirty percent off all outdoor furniture on the lower level. ' +
          'Please note that the clearance discount does not apply to power tools, despite what you may have read in Wednesday’s local paper — that advertisement contained an error, and we apologise for the confusion. ' +
          'Customers with a Thornbury loyalty card can also collect a free packet of spring bulbs at the garden desk, one per household while supplies last. ' +
          'Finally, the lower-level escalator is out of service this week; please use the lifts near the main entrance.',
      },
    ],
  },
  {
    id: 'p4-talk-03',
    kind: 'talk',
    intro: 'Questions 7 to 9 refer to the following excerpt from a meeting.',
    turns: [
      {
        speaker: 'Femme',
        voice: 'C',
        text:
          'Before we close, a word on the customer survey results. Nine hundred and forty people responded, which is almost double last year — so thank you to everyone who pushed the reminder emails. ' +
          'The headline is good: satisfaction with our products is up four points. But the comments tell a harsher story about response times. ' +
          'Roughly one in three respondents said they waited more than two days for an answer to a support ticket, and that single issue accounts for most of our negative scores. ' +
          'I’ve asked Yusuf to draft a staffing proposal for the support desk, and we’ll review it at the next meeting. Please read the full report before then — I’m sending it round tonight.',
      },
    ],
  },
];

export const PART4_BANK_01: readonly ToeicItem[] = [
  // ---------- Exposé 1 : message vocal ----------
  {
    id: 'p4-001',
    part: 4,
    passage: 'p4-talk-01',
    stem: 'What is the main purpose of the message?',
    options: [
      'To cancel a scheduled appointment',
      'To request a document before a visit',
      'To complain about a late delivery',
      'To apply for a building permit',
    ],
    answer: 1,
    explain:
      'Tout l’appel converge vers « I do need one thing before we come: a copy of the building’s current fire safety certificate ». Le report (« push the survey back a week ») n’est qu’une CONSÉQUENCE possible si le document n’arrive pas — ce n’est pas une annulation.',
    cefr: 'B1',
    tags: ['gist'],
  },
  {
    id: 'p4-002',
    part: 4,
    passage: 'p4-talk-01',
    stem: 'What does the speaker say has changed?',
    options: [
      'The date of the site survey',
      'The engineer assigned to the project',
      'The expected length of the visit',
      'The cost of the survey',
    ],
    answer: 2,
    explain:
      '« The visit should take about two hours rather than the full morning we originally blocked out. » La date, elle, n’a PAS changé — elle ne changerait qu’à défaut du certificat. C’est le piège du conditionnel : entendre « push the survey back » ne veut pas dire que c’est décidé.',
    cefr: 'B1',
    tags: ['detail', 'conditional'],
  },
  {
    id: 'p4-003',
    part: 4,
    passage: 'p4-talk-01',
    stem: 'What is the listener asked to do by Thursday?',
    options: [
      'Send a fire safety certificate',
      'Return a signed contract',
      'Call extension 214 to reschedule',
      'Meet the structural engineer',
    ],
    answer: 0,
    explain:
      '« If you can email that to me by Thursday » — « that » renvoie au certificat de sécurité incendie. Le numéro de poste est donné pour la joindre en général, pas pour reporter : une information entendue n’hérite pas de la fonction qu’on lui prête.',
    cefr: 'A2',
    tags: ['next-action', 'detail'],
  },

  // ---------- Exposé 2 : annonce en magasin ----------
  {
    id: 'p4-004',
    part: 4,
    passage: 'p4-talk-02',
    stem: 'Where is the announcement being made?',
    options: ['At a garden show', 'In a home and garden store', 'At a furniture factory', 'In a newspaper office'],
    answer: 1,
    explain:
      '« Welcome to Thornbury Home and Garden », avec étages, escalator et caisse jardinerie : c’est un magasin. Le journal et le salon de jardinage sont évoqués, mais comme éléments du discours — un lieu mentionné n’est pas le lieu où l’on se trouve.',
    cefr: 'A2',
    tags: ['gist'],
  },
  {
    id: 'p4-005',
    part: 4,
    passage: 'p4-talk-02',
    stem: 'What correction does the speaker make?',
    options: [
      'The sale ends earlier than announced.',
      'The discount does not include power tools.',
      'The loyalty offer is limited to two packets.',
      'The lower level is closed to customers.',
    ],
    answer: 1,
    explain:
      'C’est le changement de cap de l’exposé : « the clearance discount does not apply to power tools, despite what you may have read in Wednesday’s local paper ». L’escalator est hors service, mais l’étage reste accessible par les ascenseurs — le distracteur 4 exagère une information réelle.',
    cefr: 'B2',
    tags: ['detail', 'inference'],
  },
  {
    id: 'p4-006',
    part: 4,
    passage: 'p4-talk-02',
    stem: 'What are loyalty card holders offered?',
    options: ['A thirty percent discount', 'Free delivery of furniture', 'A packet of flower bulbs', 'Access to the lifts'],
    answer: 2,
    explain:
      '« Can also collect a free packet of spring bulbs at the garden desk ». Les 30 % s’appliquent à TOUS les clients sur le mobilier de jardin, pas aux seuls porteurs de carte : la partie 4 teste souvent cette confusion entre offre générale et offre réservée.',
    cefr: 'A2',
    tags: ['detail'],
  },

  // ---------- Exposé 3 : extrait de réunion ----------
  {
    id: 'p4-007',
    part: 4,
    passage: 'p4-talk-03',
    stem: 'What is the speaker mainly reporting on?',
    options: [
      'The results of a customer survey',
      'A new product launch',
      'A change in email policy',
      'The hiring of a support manager',
    ],
    answer: 0,
    explain:
      '« A word on the customer survey results » annonce le sujet, et tout l’exposé en découle. La proposition de recrutement n’est qu’une suite donnée à un constat de l’enquête, et elle n’est pas encore décidée.',
    cefr: 'A2',
    tags: ['gist'],
  },
  {
    id: 'p4-008',
    part: 4,
    passage: 'p4-talk-03',
    stem: 'According to the speaker, what is the main source of negative feedback?',
    options: ['Product quality', 'Slow responses to support tickets', 'The price of the products', 'The survey’s length'],
    answer: 1,
    explain:
      '« One in three respondents said they waited more than two days […] and that single issue accounts for most of our negative scores. » La satisfaction PRODUIT est au contraire en hausse de quatre points : l’exposé oppose explicitement les deux, et c’est le cœur du changement de cap.',
    cefr: 'B1',
    tags: ['detail', 'inference'],
  },
  {
    id: 'p4-009',
    part: 4,
    passage: 'p4-talk-03',
    stem: 'What are the listeners asked to do before the next meeting?',
    options: [
      'Read the full survey report',
      'Draft a staffing proposal',
      'Send reminder emails to customers',
      'Interview candidates for the support desk',
    ],
    answer: 0,
    explain:
      '« Please read the full report before then. » La proposition de personnel est confiée à Yusuf, nommément — comme en partie 3, il faut retenir QUI est chargé de quoi, pas seulement la liste des tâches.',
    cefr: 'B1',
    tags: ['next-action'],
  },
];
