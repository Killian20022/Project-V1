// Partie 7 — Compréhension écrite. Banque n°2 : 4 documents, 12 items.
//
// Porte la partie 7 de 9 à 21 items (le vrai examen en compte 54).
// La banque n°1 couvrait l'annonce, la chaîne de messages et le document double. Celle-ci ajoute :
//   · un avis avec une question « où insérer cette phrase ? », exclusive à la partie 7 ;
//   · un formulaire de réclamation, où la réponse se lit dans un CHAMP et non dans une phrase ;
//   · un document TRIPLE (annonce + courriel + reçu), le format le plus exigeant de l'épreuve :
//     une question y croise les trois sources, et c'est là que se joue la fin du chrono.
import type { ToeicItem, ToeicPassage } from '../../lib/toeic';

export const PART7_PASSAGES_02: readonly ToeicPassage[] = [
  {
    id: 'p7-doc-04',
    kind: 'text',
    intro: 'Questions 10 to 12 refer to the following notice.',
    docs: [
      {
        label: 'Avis aux résidents',
        body: `NOTICE TO RESIDENTS — Lift modernisation, Marchmont Court

Work to replace both passenger lifts will begin on Monday 6 May and is expected to last nine weeks.

— [1] — The two lifts will be taken out of service one at a time, so a working lift will be available throughout, apart from two half-days when the controller is switched over. Those dates will be posted in the entrance hall at least a week beforehand.

— [2] — Residents on the upper floors who have difficulty using the stairs should contact the building manager, Mr. Oyelaran, before 26 April. A limited assisted-shopping service will operate on the two half-days concerned.

— [3] — Deliveries of large items should be arranged for a Tuesday or Thursday, when the goods hoist at the rear of the building is staffed.

— [4] — We appreciate that nine weeks is a long disruption, and we have scheduled the work to finish before the summer holiday period rather than during it.

The Management Committee`,
      },
    ],
  },
  {
    id: 'p7-doc-05',
    kind: 'text',
    intro: 'Questions 13 to 15 refer to the following form.',
    docs: [
      {
        label: 'Formulaire de réclamation',
        body: `NORTHGATE OFFICE SUPPLIES — Returns and Claims Form

Customer account:      BR-4417  (Brennan & Lowe Solicitors)
Contact:               Fiona Brennan
Date of claim:         14 June
Original order number: NO-88219, placed 2 June, delivered 6 June

Item claimed
  12 × A4 archive boxes, product code AB-220        Invoiced: 86.40 €
  Reason: 9 of the 12 boxes arrived crushed along one edge.

Action requested   [ ] Refund   [X] Replacement   [ ] Credit note

Customer comments
  The outer packaging was intact, so the damage appears to have occurred
  before dispatch. We have kept all 12 boxes and the packaging for inspection.
  We need the replacements before 28 June, when our archiving contractor
  is on site.

FOR OFFICE USE ONLY
  Received by: J. Mbeki        Claim ref: C-2291
  Decision: Approved in full. Replacement dispatched 16 June, tracking TN-6640.
  Note: Damage consistent with two other claims against batch AB-220/April.
        Batch withdrawn from sale pending supplier review.`,
      },
    ],
  },
  {
    id: 'p7-doc-06',
    kind: 'text',
    intro: 'Questions 16 to 18 refer to the following advertisement, email, and receipt.',
    docs: [
      {
        label: 'Document 1 — Annonce',
        body: `HARBOURLIGHT CONFERENCE CENTRE — Winter rates

Room hire, Monday to Thursday:

  The Anchor Room      up to 20 people     180 € per day
  The Beacon Room      up to 45 people     310 € per day
  The Mariner Suite    up to 90 people     540 € per day

All rooms include projector, screen and wifi.

Catering is charged separately. Bookings of three consecutive days or more
receive a 10% reduction on room hire. Friday bookings are charged at the
weekend rate and are not eligible for the reduction.`,
      },
      {
        label: 'Document 2 — Courriel',
        body: `To: bookings@harbourlight-cc.example
From: t.okonjo@merridew-partners.example
Subject: Booking enquiry — February

Hello,

We would like to book a room for our winter planning meetings on Tuesday 10,
Wednesday 11 and Thursday 12 February. We expect thirty-eight people on the
Tuesday and Wednesday, and about fifteen on the Thursday.

Rather than move rooms halfway through, we would prefer to keep the same room
for all three days. Please confirm the total and let me know whether we need
to pay a deposit.

Best regards,
Tunde Okonjo`,
      },
      {
        label: 'Document 3 — Reçu',
        body: `HARBOURLIGHT CONFERENCE CENTRE
Receipt — booking HL-3318

Client:   Merridew Partners
Dates:    10, 11 and 12 February

Room hire, 3 days                             930.00 €
Multi-day reduction                           − 93.00 €
Catering (lunch, 38 covers × 2 days)          684.00 €
Catering (lunch, 15 covers × 1 day)           135.00 €
                                        ----------------
Total paid                                   1,656.00 €

Paid in full by bank transfer, 20 January. No deposit required for
bookings under 2,000 €.`,
      },
    ],
  },
  {
    id: 'p7-doc-07',
    kind: 'text',
    intro: 'Questions 19 to 21 refer to the following online review and response.',
    docs: [
      {
        label: 'Document 1 — Avis en ligne',
        body: `★★☆☆☆  Posted by D. Ferreira — 3 August

Stayed three nights at the Linden Park Hotel for a work trip.

The room itself was spotless and the bed was genuinely comfortable, so I want
to be fair about that. My problem was everything around it. The lift was out
of order for the whole stay with no notice at booking, and I was given a room
on the sixth floor. Nobody offered to move me lower until I asked on the second
evening, and by then only a smaller room was free.

Breakfast finishes at 9:00, which is early for a city hotel, and on the Friday
the hot food had run out by 8:30 and was not replaced.

I travel to this city monthly and I won't be back.`,
      },
      {
        label: 'Document 2 — Réponse de l’hôtel',
        body: `Response from Linden Park Hotel — 5 August

Dear Mr. Ferreira,

Thank you for taking the time to write, and I am sorry your stay fell short.

You are right that we should have told you about the lift at the time of
booking, and that we should have offered you a lower floor on arrival rather
than waiting for you to ask. The lift returned to service on 4 August.

On breakfast: our hot service is replenished until thirty minutes before
closing, so what you describe on the Friday should not have happened. I have
raised it with the kitchen team directly.

As you travel here regularly, I would like to offer you a complimentary night
on your next visit. Please contact me directly and I will arrange it.

Mariam Haddad
General Manager`,
      },
    ],
  },
];

export const PART7_BANK_02: readonly ToeicItem[] = [
  // ---------- Document 4 : avis aux résidents ----------
  {
    id: 'p7-010',
    part: 7,
    passage: 'p7-doc-04',
    stem: 'What is indicated about the lift service during the work?',
    options: [
      'Both lifts will be unavailable throughout.',
      'One lift will usually remain in service.',
      'The lifts will run only on weekdays.',
      'Residents must book the lift in advance.',
    ],
    answer: 1,
    explain:
      '« The two lifts will be taken out of service ONE AT A TIME, so a working lift will be available throughout, APART FROM two half-days. » La bonne réponse doit porter la nuance « usually » : une proposition absolue serait fausse à cause de ces deux demi-journées.',
    cefr: 'B2',
    tags: ['detail', 'inference'],
  },
  {
    id: 'p7-011',
    part: 7,
    passage: 'p7-doc-04',
    stem: 'In which of the positions marked [1], [2], [3] and [4] does the following sentence best belong? “The goods hoist cannot be used by residents at other times for insurance reasons.”',
    options: ['[1]', '[2]', '[3]', '[4]'],
    answer: 2,
    explain:
      'Question d’INSERTION, propre à la partie 7. La phrase parle du monte-charge : elle ne peut aller que dans le paragraphe qui l’introduit, le [3], dont elle complète la restriction (« staffed on Tuesday or Thursday » → pas utilisable les autres jours). Méthode : repérer le mot-clé de la phrase à insérer, puis le paragraphe qui le porte déjà.',
    cefr: 'B2',
    tags: ['text-structure'],
  },
  {
    id: 'p7-012',
    part: 7,
    passage: 'p7-doc-04',
    stem: 'What should residents who cannot use the stairs do?',
    options: [
      'Arrange deliveries for a Tuesday',
      'Wait for the dates to be posted',
      'Contact the building manager by 26 April',
      'Apply for the assisted-shopping service in May',
    ],
    answer: 2,
    explain:
      '« Should contact the building manager, Mr. Oyelaran, before 26 April. » Le service d’aide aux courses existe bien, mais il DÉCOULE de cette prise de contact : la question demande l’action à faire, pas le bénéfice qu’on en tire.',
    cefr: 'B1',
    tags: ['detail'],
  },

  // ---------- Document 5 : formulaire de réclamation ----------
  {
    id: 'p7-013',
    part: 7,
    passage: 'p7-doc-05',
    stem: 'What does Ms. Brennan request?',
    options: ['A refund', 'A replacement', 'A credit note', 'A discount on her next order'],
    answer: 1,
    explain:
      'La réponse est dans une CASE COCHÉE, pas dans une phrase : « [X] Replacement ». Lire un formulaire demande de balayer les champs, pas de lire en continu — c’est une compétence que la partie 7 teste explicitement.',
    cefr: 'A2',
    tags: ['detail'],
  },
  {
    id: 'p7-014',
    part: 7,
    passage: 'p7-doc-05',
    stem: 'Why does Ms. Brennan believe the damage happened before dispatch?',
    options: [
      'The delivery driver confirmed it.',
      'The outer packaging was undamaged.',
      'Other customers reported the same problem.',
      'The boxes were already opened.',
    ],
    answer: 1,
    explain:
      '« The outer packaging was intact, SO the damage appears to have occurred before dispatch. » Les autres réclamations sur le même lot existent, mais elles figurent dans la partie réservée au service — elle ne pouvait pas les connaître. Qui sait quoi, et où c’est écrit : c’est la question.',
    cefr: 'B2',
    tags: ['inference', 'cross-reference'],
  },
  {
    id: 'p7-015',
    part: 7,
    passage: 'p7-doc-05',
    stem: 'What is suggested about product AB-220?',
    options: [
      'It has been discontinued permanently.',
      'It is no longer being sold for now.',
      'It is manufactured by Northgate.',
      'Its price has recently increased.',
    ],
    answer: 1,
    explain:
      '« Batch withdrawn from sale PENDING supplier review » : c’est une suspension, pas un arrêt définitif. « Pending » est le mot qui fait toute la différence entre les propositions 1 et 2 — et il est dans la partie du formulaire que beaucoup de candidats ne lisent pas.',
    cefr: 'B2',
    tags: ['detail', 'synonym'],
  },

  // ---------- Document 6 : triple document ----------
  {
    id: 'p7-016',
    part: 7,
    passage: 'p7-doc-06',
    stem: 'Which room did Merridew Partners book?',
    options: ['The Anchor Room', 'The Beacon Room', 'The Mariner Suite', 'A different room each day'],
    answer: 1,
    explain:
      'RECOUPEMENT sur trois sources : 38 personnes exigent plus de 20 places, donc pas l’Anchor ; ils veulent la MÊME salle les trois jours ; et le reçu indique 930 € pour trois jours, soit 310 € par jour — le tarif de la Beacon. Chaque document seul laisse plusieurs possibilités.',
    cefr: 'B2',
    tags: ['cross-reference'],
  },
  {
    id: 'p7-017',
    part: 7,
    passage: 'p7-doc-06',
    stem: 'Why did the booking qualify for the reduction?',
    options: [
      'It was paid in advance.',
      'It covered three consecutive days.',
      'It was made during the winter season.',
      'It included catering on every day.',
    ],
    answer: 1,
    explain:
      '« Bookings of three consecutive days or more receive a 10% reduction. » Les 10, 11 et 12 février sont mardi, mercredi et jeudi — consécutifs, et aucun vendredi, qui aurait disqualifié la remise. Le reçu confirme : −93 € sur 930 €.',
    cefr: 'B2',
    tags: ['cross-reference', 'detail'],
  },
  {
    id: 'p7-018',
    part: 7,
    passage: 'p7-doc-06',
    stem: 'What does the receipt indicate about Mr. Okonjo’s question?',
    options: [
      'A deposit of ten percent was required.',
      'No deposit was needed for this booking.',
      'The deposit was refunded after the event.',
      'The deposit is due thirty days in advance.',
    ],
    answer: 1,
    explain:
      'Le courriel pose la question (« whether we need to pay a deposit »), le reçu y répond (« No deposit required for bookings under 2,000 € ») — et le total, 1 656 €, est bien sous ce seuil. La réponse n’existe que par l’enchaînement des deux documents.',
    cefr: 'B2',
    tags: ['cross-reference'],
  },

  // ---------- Document 7 : avis et réponse ----------
  {
    id: 'p7-019',
    part: 7,
    passage: 'p7-doc-07',
    stem: 'What did Mr. Ferreira praise?',
    options: ['The breakfast service', 'The location of the hotel', 'The cleanliness of the room', 'The hotel staff'],
    answer: 2,
    explain:
      '« The room itself was spotless and the bed was genuinely comfortable. » Un avis négatif contient presque toujours un point positif, et la partie 7 le demande précisément parce qu’un lecteur rapide ne retient que les reproches.',
    cefr: 'B1',
    tags: ['detail'],
  },
  {
    id: 'p7-020',
    part: 7,
    passage: 'p7-doc-07',
    stem: 'Which of Mr. Ferreira’s complaints does the manager dispute?',
    options: [
      'That the lift was out of service',
      'That he was not offered a lower floor',
      'That the hot breakfast was not replaced',
      'That breakfast finishes at 9:00',
    ],
    answer: 2,
    explain:
      '« Our hot service is replenished until thirty minutes before closing, so what you describe SHOULD NOT have happened. » Elle ne nie pas le fait : elle dit qu’il contrevient à la règle, et le traite comme un incident. Pour les deux premiers reproches elle donne raison au client (« you are right »).',
    cefr: 'B2',
    tags: ['inference'],
  },
  {
    id: 'p7-021',
    part: 7,
    passage: 'p7-doc-07',
    stem: 'Why does the manager offer a free night?',
    options: [
      'Because the guest stayed three nights',
      'Because the guest visits the city regularly',
      'Because the room was downgraded',
      'Because the hotel policy requires it',
    ],
    answer: 1,
    explain:
      '« AS YOU TRAVEL HERE REGULARLY, I would like to offer you a complimentary night. » La raison est donnée par la subordonnée en tête de phrase, et elle répond à la dernière ligne de l’avis (« I travel to this city monthly and I won’t be back ») : le geste vise à récupérer un client récurrent.',
    cefr: 'B2',
    tags: ['inference', 'cross-reference'],
  },
];
