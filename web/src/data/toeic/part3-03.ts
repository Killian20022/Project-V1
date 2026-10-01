// Partie 3 — Conversations. Banque n°3 : 6 conversations, 18 items.
//
// Avec les banques n°1 et n°2, la partie 3 atteint les **39 questions du vrai examen**
// (13 conversations de 3 questions). Mêmes règles qu'en banque n°1 : trois questions par
// conversation — ensemble, détail, projection —, un chiffre jamais répété, et l'information qui
// porte la réponse dite UNE seule fois.
//
// Les six situations couvrent ce que les deux premières banques n'avaient pas : un entretien
// d'embauche, un service après-vente, une négociation de délai avec un prestataire, un échange
// médical, une conversation à trois sur un budget, et un cas où les deux interlocuteurs se sont
// mal compris — c'est ce dernier qui donne la question d'intention la plus difficile.
import type { ToeicItem, ToeicPassage } from '../../lib/toeic';

export const PART3_PASSAGES_03: readonly ToeicPassage[] = [
  {
    id: 'p3-conv-08',
    kind: 'dialogue',
    intro: 'Questions 22 to 24 refer to the following conversation.',
    turns: [
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'Thanks for coming in, Mr. Adeyemi. I’ve read your application — you’ve spent six years in hospital procurement, is that right?',
      },
      {
        speaker: 'Homme',
        voice: 'B',
        text: 'Seven, counting the year I spent covering the pharmacy contracts. That’s actually why this role interests me — you handle cold-chain logistics, which I’ve only seen from the buying side.',
      },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'Good. I should be straight with you about one thing: the post is based in Rouen, not here in Lille. We can’t move it.',
      },
      {
        speaker: 'Homme',
        voice: 'B',
        text: 'I assumed that from the advertisement. My partner works remotely, so relocating isn’t a problem for us.',
      },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'That makes things simpler. I’ll pass your file to the operations director — she interviews on Thursdays. Someone will call you with a time by the end of the week.',
      },
    ],
  },
  {
    id: 'p3-conv-09',
    kind: 'dialogue',
    intro: 'Questions 25 to 27 refer to the following conversation.',
    turns: [
      {
        speaker: 'Homme',
        voice: 'B',
        text: 'Hello, I bought a coffee machine here in March and the grinder has stopped turning. I’ve got the receipt.',
      },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'Let me see — yes, that’s within the two-year warranty. Normally we send it to the manufacturer, which takes about three weeks.',
      },
      { speaker: 'Homme', voice: 'B', text: 'Three weeks without a machine. Is there no faster option?' },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'There is, actually. The grinder is a replaceable part and we keep them in stock. If our technician fits one here, you’d have it back Saturday — but it voids the manufacturer’s warranty on the grinder itself, only on that part.',
      },
      { speaker: 'Homme', voice: 'B', text: 'And the rest of the machine stays covered?' },
      { speaker: 'Femme', voice: 'A', text: 'Fully covered. I’ll write that on the repair slip so there’s no doubt later.' },
    ],
  },
  {
    id: 'p3-conv-10',
    kind: 'dialogue',
    intro: 'Questions 28 to 30 refer to the following conversation.',
    turns: [
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'Daniel, I’ve just seen the revised schedule. You’ve got the translation finishing on the twentieth, but the brochure goes to print on the eighteenth.',
      },
      {
        speaker: 'Homme',
        voice: 'B',
        text: 'I know. The client added eleven pages after we’d agreed the timeline, and they haven’t moved the print date.',
      },
      { speaker: 'Femme', voice: 'A', text: 'Can we split the file and send the first half to the translator who did last year’s catalogue?' },
      {
        speaker: 'Homme',
        voice: 'B',
        text: 'We could, but two translators on one brochure means two different styles. Last time we did that the client noticed and asked for a rewrite — which cost us more than the delay would have.',
      },
      { speaker: 'Femme', voice: 'A', text: 'Then the honest answer is to ask them to move the print date.' },
      { speaker: 'Homme', voice: 'B', text: 'I’ll call them this morning. Better they hear it from us now than on the nineteenth.' },
    ],
  },
  {
    id: 'p3-conv-11',
    kind: 'dialogue',
    intro: 'Questions 31 to 33 refer to the following conversation.',
    turns: [
      { speaker: 'Homme', voice: 'B', text: 'Good morning. I’m here for a blood test — the appointment was at nine, but reception says you have no record of it.' },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'Let me look. I see a booking for a Mr. Lindqvist at nine, but at our Southgate clinic, not this one. The online system lists both under the same name.',
      },
      { speaker: 'Homme', voice: 'B', text: 'That explains it. Southgate is across town — I’d never make it before the lab closes.' },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'You don’t need to go. We take walk-ins for blood tests until eleven. The wait is about forty minutes this morning, and you’ll need to have eaten nothing since midnight.',
      },
      { speaker: 'Homme', voice: 'B', text: 'I haven’t eaten. I’ll wait.' },
      { speaker: 'Femme', voice: 'A', text: 'Then take a ticket from the machine and I’ll cancel the Southgate slot so nobody holds it for you.' },
    ],
  },
  {
    id: 'p3-conv-12',
    kind: 'dialogue',
    intro: 'Questions 34 to 36 refer to the following conversation with three speakers.',
    turns: [
      { speaker: 'Femme 1', voice: 'A', text: 'We need to decide on the training budget before Friday. We have eighteen thousand and three proposals.' },
      {
        speaker: 'Homme',
        voice: 'B',
        text: 'The external provider is the most expensive — twelve thousand for four days. But they certify, and two of our clients now ask for certified staff.',
      },
      {
        speaker: 'Femme 2',
        voice: 'C',
        text: 'The online platform is four thousand for the whole year and unlimited users. No certificate, though, and last time we bought one of those only a third of the staff finished a course.',
      },
      { speaker: 'Femme 1', voice: 'A', text: 'So the cheap option is only cheap if people use it.' },
      {
        speaker: 'Homme',
        voice: 'B',
        text: 'Why not both? Twelve plus four leaves two thousand, and the certification only matters for the six people on client sites.',
      },
      { speaker: 'Femme 2', voice: 'C', text: 'I’ll redo the figures on that basis and send them round tonight.' },
    ],
  },
  {
    id: 'p3-conv-13',
    kind: 'dialogue',
    intro: 'Questions 37 to 39 refer to the following conversation.',
    turns: [
      { speaker: 'Homme', voice: 'B', text: 'I’ve put the samples in the post. They should reach you Wednesday.' },
      { speaker: 'Femme', voice: 'A', text: 'The post? Hugo, those have to stay below eight degrees.' },
      { speaker: 'Homme', voice: 'B', text: 'Oh. The email said “send the samples” — I didn’t know they were temperature-controlled.' },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'That’s on me, I should have said. Which batch was it? If it’s the February batch we still have duplicates in the cold room.',
      },
      { speaker: 'Homme', voice: 'B', text: 'February, yes. The box is labelled 02-114.' },
      {
        speaker: 'Femme',
        voice: 'A',
        text: 'Then we’re lucky. I’ll courier the duplicates today and tell the lab to discard whatever arrives by post, without testing it.',
      },
    ],
  },
];

export const PART3_BANK_03: readonly ToeicItem[] = [
  // ---------- Conversation 8 : entretien d'embauche ----------
  {
    id: 'p3-022',
    part: 3,
    passage: 'p3-conv-08',
    stem: 'What is the purpose of the conversation?',
    options: [
      'To conduct a job interview',
      'To negotiate a supply contract',
      'To review an employee’s performance',
      'To arrange a hospital delivery',
    ],
    answer: 0,
    explain:
      '« Thanks for coming in […] I’ve read your application » : c’est un entretien. Les achats hospitaliers et la logistique du froid sont le CONTENU de son expérience, pas l’objet de la rencontre.',
    cefr: 'B1',
    tags: ['gist'],
  },
  {
    id: 'p3-023',
    part: 3,
    passage: 'p3-conv-08',
    stem: 'What does the man correct about his experience?',
    options: [
      'He worked in a pharmacy, not procurement.',
      'He has seven years of experience, not six.',
      'He has never handled cold-chain logistics.',
      'He applied for a different position.',
    ],
    answer: 1,
    explain:
      '« Seven, counting the year I spent covering the pharmacy contracts. » Il rectifie le chiffre, il ne change pas de métier — et il dit justement n’avoir vu le froid que « from the buying side », donc il en a une expérience, partielle.',
    cefr: 'B2',
    tags: ['detail'],
  },
  {
    id: 'p3-024',
    part: 3,
    passage: 'p3-conv-08',
    stem: 'What will happen next?',
    options: [
      'The man will visit the Rouen site.',
      'The woman will renegotiate the location.',
      'The file will go to the operations director.',
      'The man will send additional references.',
    ],
    answer: 2,
    explain:
      '« I’ll pass your file to the operations director. » Le lieu, lui, est explicitement non négociable (« we can’t move it ») — le distracteur 2 propose exactement ce que la femme a exclu.',
    cefr: 'B1',
    tags: ['next-action'],
  },

  // ---------- Conversation 9 : service après-vente ----------
  {
    id: 'p3-025',
    part: 3,
    passage: 'p3-conv-09',
    stem: 'Why is the man at the store?',
    options: [
      'To return a machine for a refund',
      'To report a fault with a product',
      'To extend a warranty',
      'To buy a replacement part',
    ],
    answer: 1,
    explain:
      '« The grinder has stopped turning » : il signale une panne. Il ne demande ni remboursement ni pièce — c’est la vendeuse qui propose la pièce, et plus tard dans la conversation.',
    cefr: 'A2',
    tags: ['gist'],
  },
  {
    id: 'p3-026',
    part: 3,
    passage: 'p3-conv-09',
    stem: 'What is the drawback of the faster option?',
    options: [
      'It costs more than the standard repair.',
      'It is only available on Saturdays.',
      'It cancels the warranty on one part.',
      'It requires the receipt to be re-issued.',
    ],
    answer: 2,
    explain:
      '« It voids the manufacturer’s warranty on the grinder itself, ONLY on that part. » Toute la question tient à ce « only » : une proposition qui dirait « cancels the warranty » sans restriction serait fausse, et c’est pourquoi l’homme redemande confirmation juste après.',
    cefr: 'B2',
    tags: ['detail', 'inference'],
  },
  {
    id: 'p3-027',
    part: 3,
    passage: 'p3-conv-09',
    stem: 'What does the woman offer to do?',
    options: [
      'Put the warranty terms in writing',
      'Lend the man a machine',
      'Contact the manufacturer directly',
      'Refund the cost of the grinder',
    ],
    answer: 0,
    explain:
      '« I’ll write that on the repair slip so there’s no doubt later. » Une proposition de projection porte souvent sur un geste administratif modeste comme celui-ci, bien moins spectaculaire que les distracteurs.',
    cefr: 'B1',
    tags: ['next-action'],
  },

  // ---------- Conversation 10 : délai de traduction ----------
  {
    id: 'p3-028',
    part: 3,
    passage: 'p3-conv-10',
    stem: 'What problem do the speakers identify?',
    options: [
      'A translation will not be ready before printing.',
      'A translator has refused the work.',
      'The brochure contains factual errors.',
      'The client has cancelled the project.',
    ],
    answer: 0,
    explain:
      '« The translation finishing on the twentieth, but the brochure goes to print on the eighteenth. » Deux dates entendues une seule fois chacune, et c’est leur ORDRE qui constitue le problème.',
    cefr: 'B1',
    tags: ['gist', 'detail'],
  },
  {
    id: 'p3-029',
    part: 3,
    passage: 'p3-conv-10',
    stem: 'Why does the man reject using two translators?',
    options: [
      'The second translator is unavailable.',
      'It would cost more than the delay.',
      'The client has forbidden it.',
      'It would take longer overall.',
    ],
    answer: 1,
    explain:
      '« The client noticed and asked for a rewrite — which cost us more than the delay would have. » Le raisonnement est comparatif et porte sur un PRÉCÉDENT ; le client n’a rien interdit, il avait seulement remarqué.',
    cefr: 'B2',
    tags: ['inference', 'comparative'],
  },
  {
    id: 'p3-030',
    part: 3,
    passage: 'p3-conv-10',
    stem: 'What does the man mean when he says, “Better they hear it from us now than on the nineteenth”?',
    options: [
      'The client should be warned immediately.',
      'The deadline will be met after all.',
      'The client already knows about the delay.',
      'He will wait until the nineteenth to decide.',
    ],
    answer: 0,
    explain:
      'Question d’INTENTION : la comparaison « now » / « on the nineteenth » dit qu’annoncer tard, la veille de l’impression, serait pire. Il justifie donc l’appel immédiat. Prendre « the nineteenth » pour une échéance qu’il se fixe est exactement le piège.',
    cefr: 'B2',
    tags: ['inference'],
  },

  // ---------- Conversation 11 : rendez-vous médical ----------
  {
    id: 'p3-031',
    part: 3,
    passage: 'p3-conv-11',
    stem: 'What caused the man’s problem?',
    options: [
      'He arrived after his appointment time.',
      'His appointment was booked at another clinic.',
      'His name was misspelled in the system.',
      'The laboratory was closed.',
    ],
    answer: 1,
    explain:
      '« A booking for a Mr. Lindqvist at nine, but at our Southgate clinic, not this one. » Le nom est correct — c’est justement parce que les deux sites partagent le même nom dans le système que la confusion s’est produite.',
    cefr: 'B1',
    tags: ['detail'],
  },
  {
    id: 'p3-032',
    part: 3,
    passage: 'p3-conv-11',
    stem: 'What condition does the woman mention for the test?',
    options: [
      'The man must not have eaten since midnight.',
      'The man must bring a doctor’s letter.',
      'The test must be done before nine.',
      'The man must pay in advance.',
    ],
    answer: 0,
    explain:
      '« You’ll need to have eaten nothing since midnight. » Onze heures est l’heure limite des sans-rendez-vous, pas neuf — un chiffre entendu plus tôt n’est pas celui que la question demande.',
    cefr: 'B2',
    tags: ['detail'],
  },
  {
    id: 'p3-033',
    part: 3,
    passage: 'p3-conv-11',
    stem: 'What does the woman say she will do?',
    options: [
      'Call the Southgate clinic’s manager',
      'Cancel the other appointment',
      'Reduce the waiting time',
      'Correct the online booking system',
    ],
    answer: 1,
    explain:
      '« I’ll cancel the Southgate slot so nobody holds it for you. » Le défaut du système est bien identifié dans la conversation, mais personne ne s’engage à le corriger : ne pas confondre une cause mentionnée avec une action promise.',
    cefr: 'B1',
    tags: ['next-action', 'inference'],
  },

  // ---------- Conversation 12 : budget de formation, trois voix ----------
  {
    id: 'p3-034',
    part: 3,
    passage: 'p3-conv-12',
    stem: 'What are the speakers deciding?',
    options: [
      'How to spend a training budget',
      'Which clients to prioritize',
      'Whether to hire six new staff',
      'When to renew a software licence',
    ],
    answer: 0,
    explain:
      '« We need to decide on the training budget before Friday. We have eighteen thousand and three proposals. » Les six personnes sur site client et la plateforme sont des éléments de ce choix.',
    cefr: 'A2',
    tags: ['gist'],
  },
  {
    id: 'p3-035',
    part: 3,
    passage: 'p3-conv-12',
    stem: 'What does the second woman say about the online platform?',
    options: [
      'It is limited to a fixed number of users.',
      'Few employees completed a similar course before.',
      'It issues a recognized certificate.',
      'It costs four thousand per user.',
    ],
    answer: 1,
    explain:
      '« Only a third of the staff finished a course. » Les trois autres propositions inversent chacune un détail donné : les utilisateurs sont illimités, il n’y a PAS de certificat, et les quatre mille couvrent l’année entière.',
    cefr: 'B2',
    tags: ['detail'],
  },
  {
    id: 'p3-036',
    part: 3,
    passage: 'p3-conv-12',
    stem: 'What will the second woman do next?',
    options: [
      'Contact the external provider',
      'Survey staff about the platform',
      'Recalculate the figures and circulate them',
      'Select the six employees to certify',
    ],
    answer: 2,
    explain:
      '« I’ll redo the figures on that basis and send them round tonight. » « On that basis » renvoie à la solution combinée proposée par l’homme : il faut avoir suivi l’enchaînement des trois voix pour savoir ce qu’elle recalcule.',
    cefr: 'B2',
    tags: ['next-action'],
  },

  // ---------- Conversation 13 : malentendu sur des échantillons ----------
  {
    id: 'p3-037',
    part: 3,
    passage: 'p3-conv-13',
    stem: 'What mistake has the man made?',
    options: [
      'He sent the samples to the wrong laboratory.',
      'He sent temperature-sensitive samples by post.',
      'He discarded the wrong batch of samples.',
      'He mislabelled a box of samples.',
    ],
    answer: 1,
    explain:
      '« Those have to stay below eight degrees » après « I’ve put the samples in the post ». L’étiquette 02-114 est au contraire exacte, et c’est elle qui permet de retrouver les doublons.',
    cefr: 'B1',
    tags: ['gist', 'detail'],
  },
  {
    id: 'p3-038',
    part: 3,
    passage: 'p3-conv-13',
    stem: 'What does the woman imply when she says, “That’s on me, I should have said”?',
    options: [
      'She will pay for the replacement samples.',
      'She accepts part of the responsibility.',
      'She had already warned the man once.',
      'She will report the error to the laboratory.',
    ],
    answer: 1,
    explain:
      'Question d’INTENTION sur une tournure idiomatique : « that’s on me » = c’est ma faute. Elle reconnaît n’avoir pas précisé la contrainte dans son courriel. Comprendre « on me » comme « à mes frais » est le contresens que la proposition 1 exploite.',
    cefr: 'B2',
    tags: ['inference'],
  },
  {
    id: 'p3-039',
    part: 3,
    passage: 'p3-conv-13',
    stem: 'What will the laboratory be told to do?',
    options: [
      'Test both sets of samples',
      'Return the posted samples',
      'Discard the samples sent by post',
      'Wait until Wednesday to begin',
    ],
    answer: 2,
    explain:
      '« Tell the lab to discard whatever arrives by post, WITHOUT TESTING IT. » Analyser des échantillons dont la chaîne du froid est rompue donnerait un résultat faux : c’est la raison, et elle écarte la proposition 1.',
    cefr: 'B2',
    tags: ['next-action', 'inference'],
  },
];
