// Partie 3 — Conversations. Banque n°1 : 3 conversations, 9 items.
//
// Format réel : le script est à l'ORAL et ne s'affiche jamais ; les questions et leurs quatre
// propositions, elles, SONT imprimées. Le candidat est donc censé lire les questions pendant
// l'écoute — c'est une stratégie que l'examen assume, et `PART_DISPLAY[3]` la rend possible.
//
// Une conversation du vrai TOEIC porte toujours trois questions dans cet ordre : une d'ensemble
// (où sommes-nous, qui parle, de quoi), une de détail, une de projection (« what will X do next »).
// Les trois banques d'écoute suivent cette structure, sinon le bilan par point faible serait biaisé
// vers le détail.
//
// Règles d'écriture :
//   · 3 à 6 répliques, langue parlée réelle (contractions, hésitations courtes, relances) ;
//   · l'information qui porte la réponse est dite UNE fois et jamais répétée dans les mots de la
//     proposition correcte — sinon il suffit de guetter un mot ;
//   · la troisième conversation compte trois interlocuteurs (voix A, B, C), comme au vrai examen ;
//   · aucun chiffre n'est répété deux fois : les questions de détail doivent se jouer à l'écoute.
import type { ToeicItem, ToeicPassage } from '../../lib/toeic';

export const PART3_PASSAGES_01: readonly ToeicPassage[] = [
  {
    id: 'p3-conv-01',
    kind: 'dialogue',
    intro: 'Questions 1 to 3 refer to the following conversation.',
    turns: [
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'Good morning, this is Claire Dubois from Ardent Textiles. I’m calling about purchase order 4471 — we were expecting the fabric rolls last Friday and nothing has arrived.',
      },
      {
        speaker: 'Homme',
        voice: 'B',
        text: 'I’m sorry about that, Ms. Dubois. Let me pull up the order. Right — it looks like the shipment cleared customs but it was routed to our Lille depot instead of your Tours facility.',
      },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'That’s a problem. We have a production run starting Wednesday and we can’t begin without that fabric.',
      },
      {
        speaker: 'Homme',
        voice: 'B',
        text: 'Understood. I’ll arrange a direct transfer by courier — that puts it at your door tomorrow afternoon, and we’ll absorb the shipping cost. I’ll email you the new tracking number within the hour.',
      },
    ],
  },
  {
    id: 'p3-conv-02',
    kind: 'dialogue',
    intro: 'Questions 4 to 6 refer to the following conversation.',
    turns: [
      {
        speaker: 'Homme',
        voice: 'B',
        text: 'Have you had a chance to look at the two venues for the November training week?',
      },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'I did. The hotel downtown is convenient for the train station, but their largest room seats twenty-four and we’re expecting thirty-one people.',
      },
      {
        speaker: 'Homme',
        voice: 'B',
        text: 'So that rules it out. What about the business park site?',
      },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'It fits everyone easily and it’s four hundred euros cheaper for the week. The catch is parking — there are only twelve spaces, and no tram line nearby.',
      },
      {
        speaker: 'Homme',
        voice: 'B',
        text: 'We could charter a shuttle from the station. Can you ask them to hold the room while I price that out?',
      },
      { speaker: 'Femme', voice: 'A', text: 'I’ll call them this afternoon and put a provisional hold on it.' },
    ],
  },
  {
    id: 'p3-conv-03',
    kind: 'dialogue',
    intro: 'Questions 7 to 9 refer to the following conversation with three speakers.',
    turns: [
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'Thanks for coming in early, both of you. The auditors will be here Monday and they’ve asked for three years of maintenance logs.',
      },
      {
        speaker: 'Homme 1',
        voice: 'B',
        text: 'Everything from last year onward is in the new system, so that part’s straightforward. The older records are still on paper in the basement archive.',
      },
      {
        speaker: 'Homme 2',
        voice: 'C',
        text: 'I can start scanning those, but the archive room only has one scanner and it’s slow. Realistically that’s two full days.',
      },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'Two days is cutting it close. Could you borrow the high-speed scanner from the Accounts department?',
      },
      {
        speaker: 'Homme 2',
        voice: 'C',
        text: 'I’ll ask Nadia — she usually says yes if we return it the same week. If she agrees, I can be done by Friday afternoon.',
      },
    ],
  },
];

export const PART3_BANK_01: readonly ToeicItem[] = [
  // ---------- Conversation 1 : commande égarée ----------
  {
    id: 'p3-001',
    part: 3,
    passage: 'p3-conv-01',
    stem: 'Why is the woman calling?',
    options: [
      'To place a new order for fabric',
      'To report that a delivery has not arrived',
      'To complain about the quality of a shipment',
      'To ask for a discount on shipping',
    ],
    answer: 1,
    explain:
      'Elle le dit dès la première réplique : « we were expecting the fabric rolls last Friday and nothing has arrived ». Attention au distracteur « place a new order » : le numéro de commande est cité, mais la commande existe déjà — c’est sa livraison qui manque.',
    cefr: 'A2',
    tags: ['gist'],
  },
  {
    id: 'p3-002',
    part: 3,
    passage: 'p3-conv-01',
    stem: 'What caused the problem?',
    options: [
      'The shipment was held at customs.',
      'The order was never processed.',
      'The goods were sent to the wrong location.',
      'A courier lost the package.',
    ],
    answer: 2,
    explain:
      '« It was routed to our Lille depot instead of your Tours facility » : une erreur d’acheminement. Le piège est « held at customs » — l’homme dit justement l’inverse, « the shipment CLEARED customs ». En partie 3, un mot entendu n’est pas une réponse.',
    cefr: 'B1',
    tags: ['detail'],
  },
  {
    id: 'p3-003',
    part: 3,
    passage: 'p3-conv-01',
    stem: 'What does the man say he will do within the hour?',
    options: [
      'Send a tracking number by email',
      'Deliver the fabric himself',
      'Refund the cost of the order',
      'Call the Lille depot manager',
    ],
    answer: 0,
    explain:
      'Dernière réplique : « I’ll email you the new tracking number within the hour ». Il offre aussi de prendre à sa charge les frais de port (« absorb the shipping cost »), ce qui n’est pas un remboursement de la commande — nuance que le distracteur 3 exploite.',
    cefr: 'B1',
    tags: ['next-action', 'detail'],
  },

  // ---------- Conversation 2 : choix d'un lieu de formation ----------
  {
    id: 'p3-004',
    part: 3,
    passage: 'p3-conv-02',
    stem: 'What are the speakers mainly discussing?',
    options: [
      'Where to hold a training event',
      'How many employees to hire',
      'Whether to extend a hotel contract',
      'A change to the train timetable',
    ],
    answer: 0,
    explain:
      'Les deux répliques d’ouverture posent le sujet : « the two venues for the November training week ». Tout le reste — places assises, prix, stationnement — sont des critères de ce choix, pas des sujets distincts.',
    cefr: 'A2',
    tags: ['gist'],
  },
  {
    id: 'p3-005',
    part: 3,
    passage: 'p3-conv-02',
    stem: 'Why is the downtown hotel unsuitable?',
    options: [
      'It is too expensive.',
      'It is too far from the station.',
      'Its largest room is too small.',
      'It has no parking available.',
    ],
    answer: 2,
    explain:
      '« Their largest room seats twenty-four and we’re expecting thirty-one people. » Les trois autres propositions décrivent le SECOND site ou le contraire du texte : l’hôtel est justement « convenient for the train station », et c’est le parc d’activités qui a un problème de stationnement.',
    cefr: 'B1',
    tags: ['detail', 'inference'],
  },
  {
    id: 'p3-006',
    part: 3,
    passage: 'p3-conv-02',
    stem: 'What will the woman do this afternoon?',
    options: [
      'Price out a shuttle service',
      'Reserve the room provisionally',
      'Visit the business park',
      'Cancel the hotel booking',
    ],
    answer: 1,
    explain:
      '« I’ll call them this afternoon and put a provisional hold on it. » Le chiffrage de la navette (« price that out ») est pris en charge par l’HOMME : les questions de projection exigent de savoir QUI fait quoi, pas seulement ce qui va se faire.',
    cefr: 'B1',
    tags: ['next-action'],
  },

  // ---------- Conversation 3 : trois interlocuteurs, audit ----------
  {
    id: 'p3-007',
    part: 3,
    passage: 'p3-conv-03',
    stem: 'What is the purpose of the meeting?',
    options: [
      'To prepare documents for an audit',
      'To train staff on a new system',
      'To reorganize the basement archive',
      'To choose a new equipment supplier',
    ],
    answer: 0,
    explain:
      '« The auditors will be here Monday and they’ve asked for three years of maintenance logs. » L’archive et le scanner ne sont que les moyens : la question d’ensemble porte sur le BUT, un piège fréquent quand les détails sont plus marquants que l’objectif.',
    cefr: 'B1',
    tags: ['gist'],
  },
  {
    id: 'p3-008',
    part: 3,
    passage: 'p3-conv-03',
    stem: 'What problem does the second man mention?',
    options: [
      'The records for last year are missing.',
      'The archive room is locked at weekends.',
      'Only one slow scanner is available.',
      'The auditors arrive earlier than expected.',
    ],
    answer: 2,
    explain:
      '« The archive room only has one scanner and it’s slow. » Les dossiers de l’an dernier sont au contraire déjà numérisés (« everything from last year onward is in the new system ») : le distracteur 1 inverse une information clairement donnée.',
    cefr: 'B1',
    tags: ['detail'],
  },
  {
    id: 'p3-009',
    part: 3,
    passage: 'p3-conv-03',
    stem: 'What does the second man imply when he says, “She usually says yes if we return it the same week”?',
    options: [
      'Nadia rarely lends her equipment.',
      'He expects his request to be granted.',
      'He has already borrowed the scanner.',
      'The equipment must be returned on Monday.',
    ],
    answer: 1,
    explain:
      'Question d’INTENTION, l’une des nouveautés du format : il ne s’agit pas de ce qui est dit mais de ce que cela laisse entendre. « Elle dit oui d’habitude » = il est confiant. Il ajoute d’ailleurs « if she agrees, I can be done by Friday », ce qui n’aurait aucun sens s’il s’attendait à un refus.',
    cefr: 'B2',
    tags: ['inference'],
  },
];
