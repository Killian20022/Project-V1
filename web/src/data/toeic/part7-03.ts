// Partie 7 — Compréhension écrite. Banque n°3 : 6 documents, 20 items.
//
// Avec les banques n°1 et n°2, la partie 7 passe de 21 à 41 items. La banque n°4 apporte les
// 13 derniers pour atteindre les 54 du vrai examen.
//
// Les documents longs portent ici 4 questions et non 3, comme au vrai examen : c'est ce qui fait
// que la lecture se rentabilise, et ce qui change la stratégie du candidat (lire le texte d'abord
// plutôt que de chasser une information isolée).
//
// Genres ajoutés : lettre de réclamation, article de presse, courriel en chaîne, note interne avec
// tableau, publicité, et un double document où le second CONTREDIT partiellement le premier.
import type { ToeicItem, ToeicPassage } from '../../lib/toeic';

export const PART7_PASSAGES_03: readonly ToeicPassage[] = [
  {
    id: 'p7-doc-08',
    kind: 'text',
    intro: 'Questions 22 to 24 refer to the following letter.',
    docs: [
      {
        label: 'Lettre',
        body: `Marsden & Clay Architects
41 Bowker Street, Leeds LS2 7QN

19 September

Customer Services
Vantage Office Furniture
Unit 7, Calder Industrial Estate

Dear Sir or Madam,

I am writing about order VF-20514, delivered to our Leeds studio on 11 September.

The order was for fourteen height-adjustable desks. Twelve arrived in good condition and have been assembled. The remaining two were delivered without their control units, which are listed on the packing note as included.

I telephoned your service line on 12 and again on 15 September. On both occasions I was told the parts would be dispatched "within forty-eight hours". Nothing has arrived, and I have had no written confirmation of either call.

Two members of staff are currently working at temporary desks. I would be grateful if you would confirm, in writing and by 26 September, the date on which the control units will arrive. If you are unable to supply them, please arrange collection of the two incomplete desks and credit us for them.

I have enclosed a copy of the packing note with the relevant lines marked.

Yours faithfully,

Helena Marsden
Practice Manager`,
      },
    ],
  },
  {
    id: 'p7-doc-09',
    kind: 'text',
    intro: 'Questions 25 to 28 refer to the following article.',
    docs: [
      {
        label: 'Article de presse',
        body: `Riverside market traders to move during bridge repairs
By Tomas Grieve · 4 March

Traders at Riverside Market will relocate to Castle Square for eleven weeks from 6 April while the Victoria Bridge approach is rebuilt.

The council had originally proposed splitting the market between two smaller sites, but withdrew the plan after traders argued that customers would follow only one of them. Castle Square was chosen instead despite offering eight fewer pitches than Riverside.

"We have had to turn down four applications for the temporary period," said market manager Dolores Ferrer. "Everyone who held a pitch before the announcement keeps one. It is the newer applicants who lose out, and we have waived their registration fee for the rest of the year."

Stallholders will pay the same rent as at Riverside, although the council has agreed to cover the cost of moving equipment in and out. Castle Square has no overhead cover, and the market will run on Thursdays and Saturdays only, rather than the four days currently offered.

Ms. Ferrer said the shorter week was the condition on which nearby residents had agreed to the move. Traders voted thirty-one to nine in favour.

Work is scheduled to finish by 21 June, with the market returning the following Thursday.`,
      },
    ],
  },
  {
    id: 'p7-doc-10',
    kind: 'text',
    intro: 'Questions 29 to 31 refer to the following email chain.',
    docs: [
      {
        label: 'Chaîne de courriels',
        body: `From: Priya Raman
To: Oscar Lindgren
Date: Tuesday, 10:14
Subject: Warehouse audit — access

Oscar,

The insurers want to inspect the Didcot warehouse before they renew in November. They have offered the 23rd or the 30th of October.

The 23rd is the day we take the seasonal stock in, so the aisles will be blocked. I would rather they came on the 30th.

Priya

---

From: Oscar Lindgren
To: Priya Raman
Date: Tuesday, 11:02
Subject: RE: Warehouse audit — access

The 30th is a problem at my end — I am in Hamburg that week and the inspection has to be accompanied by a manager.

Could we do the 23rd but start at seven, before the lorries arrive? The first delivery is booked for ten.

Oscar

---

From: Priya Raman
To: Oscar Lindgren
Date: Tuesday, 11:40
Subject: RE: RE: Warehouse audit — access

Three hours should be enough, and I will ask the drivers to hold at the gate if it overruns.

I will confirm with the insurers now. One thing: they will want the sprinkler certificate, which expired in August. Can you chase Fenwick for the renewal before the 23rd?

Priya`,
      },
    ],
  },
  {
    id: 'p7-doc-11',
    kind: 'text',
    intro: 'Questions 32 to 34 refer to the following notice.',
    docs: [
      {
        label: 'Note de service',
        body: `TO ALL DEPARTMENT HEADS — Printing and copying costs

Last year our departments spent 48,000 € on printing. The figures below cover the twelve months to 31 August.

  Department          Pages printed     Cost        Colour %
  --------------------------------------------------------
  Legal                  610,000      14,200 €        9 %
  Marketing              295,000      17,800 €       71 %
  Operations             540,000      11,100 €        4 %
  Human Resources        118,000       4,900 €       22 %

Colour printing costs roughly six times as much per page as black and white, which is why Marketing appears at the top of the cost column while printing fewer than half the pages Legal does.

From 1 October, colour will require a department code at the printer. We are not restricting it — we simply want the figures attributed correctly, since at present every colour page is charged to the department that owns the machine rather than the one that printed it.

Please nominate one person per department to hold the code and send me their name by 24 September.

Ivan Petrov
Facilities`,
      },
    ],
  },
  {
    id: 'p7-doc-12',
    kind: 'text',
    intro: 'Questions 35 to 38 refer to the following advertisement and review.',
    docs: [
      {
        label: 'Document 1 — Publicité',
        body: `THE GRANARY — meeting rooms by the hour

Five minutes from Bramhall station, in a converted grain store.

  · Four rooms, seating 6 to 24
  · From 22 € per hour, minimum two hours
  · Fibre broadband, whiteboard and screen in every room
  · Unlimited tea and coffee included
  · Free on-site parking for up to eight cars

Weekday bookings only. Rooms may be booked up to six months ahead
through our website. A 20% deposit secures the date; the balance is
payable on the day.

Members of Bramhall Chamber of Commerce receive 15% off all bookings.`,
      },
      {
        label: 'Document 2 — Avis en ligne',
        body: `★★★★☆  Reviewed by K. Osei — 12 May

We used the largest room at The Granary for a client workshop, nine of us,
from nine until four.

The room itself is excellent — quiet, properly lit, and the screen is a
decent size, which is rarer than it should be. The coffee really is
unlimited and someone comes round with it rather than leaving you to find
the kitchen.

Two things to know before you book. The parking filled up by half past
eight, and three of our group had to use the station car park, which is
paid. And the website let me book the room but not the catering, which has
to be arranged by phone at least a week ahead — I found that out two days
before, so we walked into the village for lunch.

Would I book again? Yes, but I would call rather than use the website.`,
      },
    ],
  },
  {
    id: 'p7-doc-13',
    kind: 'text',
    intro: 'Questions 39 to 41 refer to the following memo and schedule.',
    docs: [
      {
        label: 'Document 1 — Note',
        body: `TO: All laboratory staff
FROM: Dr. Noor Haddadi, Laboratory Director
DATE: 2 February
RE: Equipment servicing, week of 16 February

Our two centrifuges and the autoclave will be serviced during the week of
16 February. Each machine is out of use for one full day.

Please plan work that needs a centrifuge for the days when at least one of
the two is available. Both will never be down on the same day.

The autoclave day is the one to watch: with no autoclave there is no
sterilisation, so no cell culture work at all. Anything scheduled for that
day must be moved.

The engineer has asked that benches within two metres of each machine be
cleared the evening before.`,
      },
      {
        label: 'Document 2 — Planning',
        body: `SERVICING SCHEDULE — week of 16 February

  Monday 16     Centrifuge A        09:00 – 16:00
  Tuesday 17    (no servicing)
  Wednesday 18  Autoclave           08:00 – 17:00
  Thursday 19   Centrifuge B        09:00 – 16:00
  Friday 20     (no servicing)

Engineer: R. Castellano, Meridian Technical Services
Access via the goods entrance; please sign him in at reception.`,
      },
    ],
  },
];

export const PART7_BANK_03: readonly ToeicItem[] = [
  // ---------- Document 8 : lettre de réclamation ----------
  {
    id: 'p7-022',
    part: 7,
    passage: 'p7-doc-08',
    stem: 'What is the problem with the order?',
    options: [
      'Two desks are missing entirely.',
      'Two desks arrived without a component.',
      'The wrong model of desk was delivered.',
      'The desks were delivered to the wrong address.',
    ],
    answer: 1,
    explain:
      '« The remaining two were delivered WITHOUT THEIR CONTROL UNITS. » Les bureaux sont bien arrivés — c’est une pièce qui manque. Le distracteur 1 est ce qu’on retient si l’on lit trop vite « the remaining two ».',
    cefr: 'B1',
    tags: ['detail'],
  },
  {
    id: 'p7-023',
    part: 7,
    passage: 'p7-doc-08',
    stem: 'What does Ms. Marsden say about her telephone calls?',
    options: [
      'She was unable to reach anyone.',
      'She received no written confirmation.',
      'She was promised a refund.',
      'She was transferred to another department.',
    ],
    answer: 1,
    explain:
      '« I have had no written confirmation of either call. » Elle a bien joint quelqu’un les deux fois, et on lui a promis une expédition sous 48 h — pas un remboursement. Trois nuances dans une seule phrase.',
    cefr: 'B2',
    tags: ['detail'],
  },
  {
    id: 'p7-024',
    part: 7,
    passage: 'p7-doc-08',
    stem: 'What alternative does Ms. Marsden propose?',
    options: [
      'A discount on the whole order',
      'Delivery of two replacement desks',
      'Collection of the desks and a credit',
      'An extension of the warranty',
    ],
    answer: 2,
    explain:
      '« Please arrange collection of the two incomplete desks and credit us for them. » C’est une alternative CONDITIONNELLE — « if you are unable to supply them » — et c’est bien ce que demande la question : ce qu’elle propose à défaut.',
    cefr: 'B2',
    tags: ['detail', 'conditional'],
  },

  // ---------- Document 9 : article de presse ----------
  {
    id: 'p7-025',
    part: 7,
    passage: 'p7-doc-09',
    stem: 'Why was the original plan abandoned?',
    options: [
      'Traders feared losing customers.',
      'The two sites were too expensive.',
      'Residents objected to the noise.',
      'The council ran out of time.',
    ],
    answer: 0,
    explain:
      '« Traders argued that customers would follow only one of them. » Les riverains interviennent plus loin et sur un autre point — la réduction du nombre de jours —, ce que le distracteur 3 déplace.',
    cefr: 'B2',
    tags: ['detail', 'inference'],
  },
  {
    id: 'p7-026',
    part: 7,
    passage: 'p7-doc-09',
    stem: 'What is indicated about Castle Square?',
    options: [
      'It is larger than Riverside.',
      'It has fewer pitches than Riverside.',
      'It is covered against the weather.',
      'It will host the market seven days a week.',
    ],
    answer: 1,
    explain:
      '« Despite offering eight fewer pitches than Riverside. » Le texte précise aussi « no overhead cover » et deux jours par semaine : les trois distracteurs inversent chacun une information explicite.',
    cefr: 'B1',
    tags: ['detail'],
  },
  {
    id: 'p7-027',
    part: 7,
    passage: 'p7-doc-09',
    stem: 'Who will not be given a pitch during the relocation?',
    options: [
      'Traders who voted against the move',
      'Traders who applied after the announcement',
      'Traders who sell outdoors only',
      'Traders who cannot pay the rent',
    ],
    answer: 1,
    explain:
      '« Everyone who held a pitch BEFORE the announcement keeps one. It is the newer applicants who lose out. » La réponse se déduit d’une opposition temporelle, et le vote — 31 contre 9 — n’a aucune conséquence individuelle.',
    cefr: 'B2',
    tags: ['inference'],
  },
  {
    id: 'p7-028',
    part: 7,
    passage: 'p7-doc-09',
    stem: 'What has the council agreed to pay for?',
    options: ['The traders’ rent', 'Registration fees for all traders', 'The cost of moving equipment', 'Overhead cover for the square'],
    answer: 2,
    explain:
      '« The council has agreed to cover the cost of moving equipment in and out. » Le loyer reste identique — donc dû —, et la gratuité d’inscription ne vise QUE les candidats écartés. Lire « waived their registration fee » comme une mesure générale est le piège.',
    cefr: 'B2',
    tags: ['detail', 'cross-reference'],
  },

  // ---------- Document 10 : chaîne de courriels ----------
  {
    id: 'p7-029',
    part: 7,
    passage: 'p7-doc-10',
    stem: 'Why does Mr. Lindgren reject the 30th?',
    options: [
      'The warehouse is closed that week.',
      'He will be abroad.',
      'The insurers are unavailable.',
      'Seasonal stock arrives that day.',
    ],
    answer: 1,
    explain:
      '« I am in Hamburg that week and the inspection has to be accompanied by a manager. » Le stock saisonnier est l’objection de Priya contre le 23, pas la sienne contre le 30 : la chaîne de courriels teste qui dit quoi.',
    cefr: 'B1',
    tags: ['detail', 'cross-reference'],
  },
  {
    id: 'p7-030',
    part: 7,
    passage: 'p7-doc-10',
    stem: 'What solution is agreed?',
    options: [
      'To hold the inspection early in the morning',
      'To postpone the inspection to November',
      'To let the insurers visit unaccompanied',
      'To move the stock delivery to another day',
    ],
    answer: 0,
    explain:
      '« Could we do the 23rd but start at seven, before the lorries arrive? » et Priya accepte : « Three hours should be enough. » Elle demandera aux chauffeurs d’attendre au portail, elle ne déplace pas la livraison — nuance que le distracteur 4 exploite.',
    cefr: 'B2',
    tags: ['cross-reference', 'inference'],
  },
  {
    id: 'p7-031',
    part: 7,
    passage: 'p7-doc-10',
    stem: 'What is Mr. Lindgren asked to do?',
    options: [
      'Confirm the date with the insurers',
      'Obtain a renewed certificate',
      'Meet the drivers at the gate',
      'Reschedule his trip to Hamburg',
    ],
    answer: 1,
    explain:
      '« Can you chase Fenwick for the renewal before the 23rd? » — il s’agit du certificat de sprinklers, périmé depuis août. Confirmer avec les assureurs et gérer les chauffeurs, c’est Priya qui s’en charge, dans la même phrase ou la précédente.',
    cefr: 'B2',
    tags: ['next-action'],
  },

  // ---------- Document 11 : note avec tableau ----------
  {
    id: 'p7-032',
    part: 7,
    passage: 'p7-doc-11',
    stem: 'Which department printed the most pages?',
    options: ['Legal', 'Marketing', 'Operations', 'Human Resources'],
    answer: 0,
    explain:
      'Lecture de TABLEAU : 610 000 pages pour le service juridique, contre 540 000 pour les opérations. Marketing est en tête du COÛT, pas du volume — et c’est précisément ce que la note explique juste en dessous.',
    cefr: 'B1',
    tags: ['detail'],
  },
  {
    id: 'p7-033',
    part: 7,
    passage: 'p7-doc-11',
    stem: 'Why does Marketing have the highest cost?',
    options: [
      'It prints the most pages.',
      'It uses a more expensive machine.',
      'Most of its printing is in colour.',
      'It pays for other departments’ printing.',
    ],
    answer: 2,
    explain:
      '71 % de couleur, et « colour printing costs roughly six times as much per page ». Il faut croiser une colonne du tableau avec la phrase qui la commente : ni l’une ni l’autre ne suffit seule.',
    cefr: 'B2',
    tags: ['cross-reference', 'inference'],
  },
  {
    id: 'p7-034',
    part: 7,
    passage: 'p7-doc-11',
    stem: 'What is the purpose of the new code?',
    options: [
      'To reduce the amount of colour printing',
      'To charge costs to the correct department',
      'To prevent staff from using other machines',
      'To replace the existing printers',
    ],
    answer: 1,
    explain:
      '« We are NOT restricting it — we simply want the figures attributed correctly. » La note écarte elle-même, explicitement, l’interprétation que propose le distracteur 1. Quand un texte nie une lecture, c’est presque toujours qu’elle est au menu.',
    cefr: 'B2',
    tags: ['inference'],
  },

  // ---------- Document 12 : publicité + avis ----------
  {
    id: 'p7-035',
    part: 7,
    passage: 'p7-doc-12',
    stem: 'What is included in the room price?',
    options: ['Lunch', 'Hot drinks', 'Station parking', 'Printing'],
    answer: 1,
    explain:
      '« Unlimited tea and coffee included », confirmé par l’avis. Le stationnement est gratuit mais SUR PLACE et limité à huit voitures — celui de la gare est payant, et c’est l’avis qui le précise.',
    cefr: 'A2',
    tags: ['detail'],
  },
  {
    id: 'p7-036',
    part: 7,
    passage: 'p7-doc-12',
    stem: 'Which room did Mr. Osei most likely book?',
    options: [
      'The room seating 6',
      'A room seating 24',
      'Two adjoining rooms',
      'A room booked six months ahead',
    ],
    answer: 1,
    explain:
      'RECOUPEMENT : il dit « the largest room » et la publicité annonce quatre salles « seating 6 to 24 ». La plus grande est donc celle de 24 places, bien qu’ils n’aient été que neuf.',
    cefr: 'B2',
    tags: ['cross-reference'],
  },
  {
    id: 'p7-037',
    part: 7,
    passage: 'p7-doc-12',
    stem: 'What does the review reveal that the advertisement does not mention?',
    options: [
      'The rooms have no screens.',
      'Catering must be booked by telephone.',
      'The venue is far from the station.',
      'A deposit is required.',
    ],
    answer: 1,
    explain:
      '« The website let me book the room but not the catering, which has to be arranged by phone. » La publicité ne dit rien de la restauration : la question porte sur ce qui MANQUE dans un document et apparaît dans l’autre.',
    cefr: 'B2',
    tags: ['cross-reference', 'inference'],
  },
  {
    id: 'p7-038',
    part: 7,
    passage: 'p7-doc-12',
    stem: 'How much would a Chamber of Commerce member save?',
    options: ['15% of the booking', '20% of the booking', '22 € per hour', 'The cost of the deposit'],
    answer: 0,
    explain:
      '« Members of Bramhall Chamber of Commerce receive 15% off all bookings. » Les 20 % sont l’ACOMPTE, pas une remise, et 22 € est le tarif horaire de départ : trois chiffres voisins dans un même document, dont un seul répond.',
    cefr: 'B1',
    tags: ['detail'],
  },

  // ---------- Document 13 : note + planning de maintenance ----------
  {
    id: 'p7-039',
    part: 7,
    passage: 'p7-doc-13',
    stem: 'On which day must all cell culture work be cancelled?',
    options: ['Monday 16', 'Tuesday 17', 'Wednesday 18', 'Thursday 19'],
    answer: 2,
    explain:
      'RECOUPEMENT : la note pose la règle — « with no autoclave there is no sterilisation, so no cell culture work at all » — et le planning place l’autoclave le mercredi 18. Aucun des deux documents ne donne la réponse seul.',
    cefr: 'B2',
    tags: ['cross-reference'],
  },
  {
    id: 'p7-040',
    part: 7,
    passage: 'p7-doc-13',
    stem: 'What does the schedule confirm about the centrifuges?',
    options: [
      'Both are serviced on the same day.',
      'They are serviced on separate days.',
      'Only one will be serviced this week.',
      'Neither will be available all week.',
    ],
    answer: 1,
    explain:
      'La note promet « both will never be down on the same day » ; le planning le vérifie — A le lundi 16, B le jeudi 19. La question demande ce que le planning CONFIRME, donc de recouper une promesse avec sa preuve.',
    cefr: 'B1',
    tags: ['cross-reference', 'detail'],
  },
  {
    id: 'p7-041',
    part: 7,
    passage: 'p7-doc-13',
    stem: 'When should the benches around the autoclave be cleared?',
    options: ['Monday evening', 'Tuesday evening', 'Wednesday morning', 'Thursday evening'],
    answer: 1,
    explain:
      '« Benches […] be cleared THE EVENING BEFORE », et l’autoclave est révisé le mercredi : c’est donc le mardi soir. Deux documents et un calcul d’une journée — le genre de question qui se rate en fin de chrono.',
    cefr: 'B2',
    tags: ['cross-reference', 'inference'],
  },
];
