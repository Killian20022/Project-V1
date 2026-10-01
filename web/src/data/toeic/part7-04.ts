// Partie 7 — Compréhension écrite. Banque n°4 : 4 documents, 13 items.
//
// Elle porte la partie 7 à **54 items — le compte du vrai examen** — et avec elle les sept parties
// sont au complet : 200 questions.
//
// Elle couvre les deux derniers formats qui manquaient :
//   · un document TRIPLE dont le troisième élément invalide une conclusion tirée des deux premiers —
//     la question la plus dure de l'épreuve, et celle qui tombe quand le chrono presse ;
//   · une seconde question d'INSERTION de phrase, pour que le bilan par point faible dispose de deux
//     occurrences et puisse dire quelque chose de cette compétence (`tagBreakdown` écarte les
//     familles vues moins de deux fois).
import type { ToeicItem, ToeicPassage } from '../../lib/toeic';

export const PART7_PASSAGES_04: readonly ToeicPassage[] = [
  {
    id: 'p7-doc-14',
    kind: 'text',
    intro: 'Questions 42 to 44 refer to the following web page.',
    docs: [
      {
        label: 'Page web',
        body: `HALLOWS FIELD ALLOTMENTS — Frequently asked questions

How long is the waiting list?
— [1] — At the time of writing there are sixty-one names ahead of a new applicant, and we release between nine and fourteen plots a year. We write to everyone on the list each January to ask whether they wish to remain on it; roughly a quarter do not reply, and those names are removed.

Can I take on half a plot?
— [2] — Full plots are 250 square metres. Since 2019 we have divided any plot that falls vacant and is in poor condition, which has let us offer more tenancies without extending the site.

What can I build?
— [3] — A shed of up to six square metres and one greenhouse are permitted without permission. Anything larger, or any structure with a concrete base, must be approved by the committee in advance.

What happens if I cannot keep it up?
— [4] — Please tell us early. We would far rather hand a plot to someone on the list than send the three warning letters our rules require before a tenancy ends. Nobody has ever been removed for telling us they were struggling.`,
      },
    ],
  },
  {
    id: 'p7-doc-15',
    kind: 'text',
    intro: 'Questions 45 to 47 refer to the following report extract.',
    docs: [
      {
        label: 'Extrait de rapport',
        body: `STAFF SURVEY 2026 — Extract: remote working

Four hundred and twelve employees responded, a response rate of 68%.

Asked how many days they would prefer to work from home, respondents divided as follows: none, 14%; one or two days, 51%; three or four days, 29%; five days, 6%.

Preference varied sharply by role rather than by age, which we had expected to be the stronger factor. Among staff in client-facing roles, 71% preferred no more than two days at home; among those in analysis and development roles the same proportion preferred three or more.

A free-text question asked what would most improve home working. The most frequent answer was not equipment, as in 2024, but "clearer rules about when I am expected to be reachable" — mentioned in 183 responses.

We note one limitation. The survey was distributed by email during a week in which the Bristol office was closed for refurbishment, and Bristol staff are over-represented among those preferring five days at home. The figures for that group should be treated with caution.`,
      },
    ],
  },
  {
    id: 'p7-doc-16',
    kind: 'text',
    intro: 'Questions 48 to 51 refer to the following email, invoice, and note.',
    docs: [
      {
        label: 'Document 1 — Courriel',
        body: `To: accounts@brightwell-print.example
From: s.achterberg@kestrel-events.example
Date: 12 May
Subject: Quotation for conference materials

Good morning,

Please quote for the following, for delivery to the Harrogate Centre by 2 June:

  · 400 delegate folders, printed one colour
  · 400 lanyards with printed inserts
  · 12 roll-up banners, 850 mm wide

We are a returning customer (account KE-0094). I believe our agreed terms
are 5% off orders over 1,500 € and payment within thirty days.

Sofia Achterberg`,
      },
      {
        label: 'Document 2 — Facture',
        body: `BRIGHTWELL PRINT — Invoice BP-7741
Account: KE-0094 · Kestrel Events
Date: 18 May · Payment due: 17 June

  400 delegate folders, one colour              680.00 €
  400 lanyards with inserts                     520.00 €
  12 roll-up banners, 850 mm                    744.00 €
                                          --------------
  Subtotal                                    1,944.00 €
  Returning-customer discount 5%               − 97.20 €
                                          --------------
  Total due                                   1,846.80 €

Delivery to Harrogate Centre included. Goods remain the property of
Brightwell Print until paid in full.`,
      },
      {
        label: 'Document 3 — Note jointe à la livraison',
        body: `DELIVERY NOTE — 30 May

Delivered to Harrogate Centre, received by M. Dufour (Centre staff).

  400 delegate folders          ✓
  400 lanyards with inserts     ✓
  10 roll-up banners            ✓
  2 roll-up banners             TO FOLLOW — 4 June

The two outstanding banners were held back because the artwork supplied
for them was below our minimum resolution. Replacement artwork was
received on 29 May and the banners are now in production.

No charge will be made for the expedited delivery of the two banners.`,
      },
    ],
  },
  {
    id: 'p7-doc-17',
    kind: 'text',
    intro: 'Questions 52 to 54 refer to the following announcement.',
    docs: [
      {
        label: 'Annonce',
        body: `LANGLEY PUBLIC LIBRARY — Changes to our lending service, from 1 September

Loan periods
All adult fiction and non-fiction will move from a three-week to a four-week loan. Children's books remain at four weeks, as now.

Reservations
The charge for reserving a book held at another branch is withdrawn. Reservations will be free, and we expect this to increase demand considerably; please allow longer than the current five days for an item to reach your chosen branch.

Fines
We are ending overdue fines for borrowers under eighteen and over sixty-five. For everyone else, the daily rate is unchanged, but the maximum charge on any single item falls from 12 € to 5 €.

Why these changes
An internal review found that fines recovered less than they cost to collect, once staff time was counted, and that the three-week loan generated most of our overdue items in the first place. We would rather have the books read than the fines paid.

Members with an outstanding balance above 5 € on 1 September will have it reduced to 5 €. Balances below that are unaffected.`,
      },
    ],
  },
];

export const PART7_BANK_04: readonly ToeicItem[] = [
  // ---------- Document 14 : page de questions fréquentes ----------
  {
    id: 'p7-042',
    part: 7,
    passage: 'p7-doc-14',
    stem: 'In which of the positions marked [1], [2], [3] and [4] does the following sentence best belong? “Yes — about a third of our tenancies are now half plots.”',
    options: ['[1]', '[2]', '[3]', '[4]'],
    answer: 1,
    explain:
      'Question d’INSERTION. La phrase commence par « Yes », elle répond donc à une question fermée : seule « Can I take on half a plot ? » en est une, et la suite du paragraphe explique justement comment ces demi-parcelles sont créées. Repérer d’abord le TYPE de phrase à insérer — réponse, cause, exemple — élimine la plupart des positions.',
    cefr: 'B2',
    tags: ['text-structure'],
  },
  {
    id: 'p7-043',
    part: 7,
    passage: 'p7-doc-14',
    stem: 'Why does the waiting list shorten each year by more than the number of plots released?',
    options: [
      'Some applicants do not confirm their interest.',
      'Plots are divided into smaller units.',
      'Applicants must reapply every year.',
      'The committee removes inactive tenants.',
    ],
    answer: 0,
    explain:
      '« Roughly a quarter do not reply, and those names are removed. » La division des parcelles augmente le nombre de locations mais ne raccourcit pas la liste d’attente par elle-même, et la radiation des locataires ne concerne pas les CANDIDATS.',
    cefr: 'B2',
    tags: ['inference'],
  },
  {
    id: 'p7-044',
    part: 7,
    passage: 'p7-doc-14',
    stem: 'What requires the committee’s approval?',
    options: [
      'A greenhouse',
      'A shed of six square metres',
      'A structure built on concrete',
      'Dividing a plot in half',
    ],
    answer: 2,
    explain:
      '« Anything larger, or any structure with a concrete base, must be approved. » Une serre et un abri de six mètres carrés sont au contraire autorisés sans démarche : la règle donne d’abord les exceptions, puis le principe.',
    cefr: 'B1',
    tags: ['detail'],
  },

  // ---------- Document 15 : extrait de rapport ----------
  {
    id: 'p7-045',
    part: 7,
    passage: 'p7-doc-15',
    stem: 'What surprised the authors of the report?',
    options: [
      'The response rate was lower than expected.',
      'Role mattered more than age.',
      'Equipment was the most common request.',
      'Most staff wanted to work entirely from home.',
    ],
    answer: 1,
    explain:
      '« Preference varied sharply by role rather than by age, WHICH WE HAD EXPECTED to be the stronger factor. » La subordonnée relative porte l’attente déçue — c’est elle, et non le chiffre, qui répond à « surprised ».',
    cefr: 'B2',
    tags: ['inference'],
  },
  {
    id: 'p7-046',
    part: 7,
    passage: 'p7-doc-15',
    stem: 'What did respondents most often ask for?',
    options: [
      'Better equipment at home',
      'Clearer expectations about availability',
      'More days working from home',
      'A permanent desk in the office',
    ],
    answer: 1,
    explain:
      '« Clearer rules about when I am expected to be reachable » — 183 réponses. Le texte précise que ce n’est PLUS l’équipement, « as in 2024 » : le distracteur 1 est la bonne réponse de l’enquête précédente, piège classique sur les textes comparatifs.',
    cefr: 'B2',
    tags: ['detail'],
  },
  {
    id: 'p7-047',
    part: 7,
    passage: 'p7-doc-15',
    stem: 'Why should one group’s results be treated with caution?',
    options: [
      'Too few people in that group responded.',
      'The question was worded ambiguously.',
      'An office closure skewed who replied.',
      'Their answers contradicted the free-text comments.',
    ],
    answer: 2,
    explain:
      '« The survey was distributed […] during a week in which the Bristol office was closed […] and Bristol staff are over-represented among those preferring five days at home. » Ce n’est pas un défaut de nombre mais de COMPOSITION de l’échantillon — nuance que le distracteur 1 écrase.',
    cefr: 'B2',
    tags: ['inference', 'detail'],
  },

  // ---------- Document 16 : triple document ----------
  {
    id: 'p7-048',
    part: 7,
    passage: 'p7-doc-16',
    stem: 'What does the invoice confirm about Ms. Achterberg’s email?',
    options: [
      'The delivery date she requested was refused.',
      'The discount she mentioned was applied.',
      'The quantities she ordered were reduced.',
      'Her account number was incorrect.',
    ],
    answer: 1,
    explain:
      'RECOUPEMENT : elle annonce « 5% off orders over 1,500 € », et la facture porte « Returning-customer discount 5% − 97,20 € » sur un sous-total de 1 944 €. Le courriel pose la condition, la facture prouve qu’elle est remplie.',
    cefr: 'B2',
    tags: ['cross-reference'],
  },
  {
    id: 'p7-049',
    part: 7,
    passage: 'p7-doc-16',
    stem: 'What was NOT delivered on 30 May?',
    options: ['The delegate folders', 'The lanyards', 'Two of the banners', 'The printed inserts'],
    answer: 2,
    explain:
      '« 10 roll-up banners ✓ · 2 roll-up banners TO FOLLOW. » Sur douze commandés, dix sont livrés. Lire la ligne « 12 » de la facture et conclure que tout est arrivé est exactement l’erreur que le troisième document punit.',
    cefr: 'B1',
    tags: ['cross-reference', 'detail'],
  },
  {
    id: 'p7-050',
    part: 7,
    passage: 'p7-doc-16',
    stem: 'Why were two items held back?',
    options: [
      'They were damaged in transit.',
      'The artwork was of insufficient quality.',
      'They were out of stock.',
      'Payment had not been received.',
    ],
    answer: 1,
    explain:
      '« The artwork supplied for them was below our minimum resolution. » La facture précise bien que les biens restent la propriété de l’imprimeur jusqu’au paiement, mais ce n’est pas le motif du retard : une clause vraie n’est pas une cause.',
    cefr: 'B2',
    tags: ['detail', 'cross-reference'],
  },
  {
    id: 'p7-051',
    part: 7,
    passage: 'p7-doc-16',
    stem: 'What is suggested about the cost of the late delivery?',
    options: [
      'It will be added to the next invoice.',
      'It will be shared between the two companies.',
      'The printer will absorb it.',
      'It is covered by the 5% discount.',
    ],
    answer: 2,
    explain:
      '« No charge will be made for the expedited delivery of the two banners. » Le troisième document corrige ce qu’on aurait déduit de la facture seule, qui est close à 1 846,80 €. C’est le propre du document triple : la dernière pièce invalide une conclusion tirée des deux premières.',
    cefr: 'B2',
    tags: ['cross-reference', 'inference'],
  },

  // ---------- Document 17 : annonce de bibliothèque ----------
  {
    id: 'p7-052',
    part: 7,
    passage: 'p7-doc-17',
    stem: 'What is changing for children’s books?',
    options: [
      'The loan period becomes four weeks.',
      'Nothing is changing.',
      'Reservations become chargeable.',
      'Fines are doubled.',
    ],
    answer: 1,
    explain:
      '« Children’s books remain at four weeks, AS NOW. » Ce sont les livres pour adultes qui passent de trois à quatre semaines : la question porte sur ce qui ne change PAS, et le chiffre identique dans les deux cas rend le distracteur 1 très tentant.',
    cefr: 'B2',
    tags: ['detail'],
  },
  {
    id: 'p7-053',
    part: 7,
    passage: 'p7-doc-17',
    stem: 'What consequence of free reservations does the library expect?',
    options: [
      'Longer waits for reserved items',
      'Fewer visits to branches',
      'A fall in overdue items',
      'More books being lost',
    ],
    answer: 0,
    explain:
      '« We expect this to increase demand considerably; please allow longer than the current five days. » L’annonce anticipe elle-même l’inconvénient de sa propre mesure — repérer ce genre d’aveu vaut souvent une question.',
    cefr: 'B2',
    tags: ['inference'],
  },
  {
    id: 'p7-054',
    part: 7,
    passage: 'p7-doc-17',
    stem: 'A member aged forty owes 9 € on 1 September. What will happen?',
    options: [
      'The balance will be cancelled.',
      'The balance will be reduced to 5 €.',
      'The balance will remain at 9 €.',
      'The balance will be reduced to 12 €.',
    ],
    answer: 1,
    explain:
      'Il faut combiner trois informations : la suppression des amendes ne vise que les moins de 18 et plus de 65 ans, le plafond par document tombe à 5 €, et « members with an outstanding balance above 5 € […] will have it reduced to 5 € ». À quarante ans, il paie donc 5 €. C’est le type de question à cas particulier qui clôt la partie 7.',
    cefr: 'B2',
    tags: ['inference', 'detail'],
  },
];
