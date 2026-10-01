// Partie 7 — Compréhension écrite. Banque n°1 : 3 documents, 9 items.
//
// Trois genres, choisis parce qu'ils couvrent les trois compétences que la partie 7 note vraiment :
//   · une annonce d'emploi → repérage d'information explicite et question de SYNONYME en contexte ;
//   · une chaîne de messages → question d'INTENTION (« what does the writer mean when… »), arrivée
//     avec la refonte de 2016 et là où les francophones perdent le plus de points ;
//   · un document DOUBLE (courriel + planning) → la réponse n'est dans aucun des deux documents
//     pris isolément, il faut les recouper. C'est la marque de fabrique de la fin d'épreuve.
//
// Aucun texte n'est repris d'une annale : ils sont écrits pour l'occasion, au registre de l'examen.
import type { ToeicItem, ToeicPassage } from '../../lib/toeic';

export const PART7_PASSAGES_01: readonly ToeicPassage[] = [
  {
    id: 'p7-doc-01',
    kind: 'text',
    intro: 'Questions 1 to 3 refer to the following job advertisement.',
    docs: [
      {
        label: 'Offre d’emploi',
        body: `KESTREL LOGISTICS — Warehouse Operations Coordinator (Bristol)

Kestrel Logistics is seeking a Warehouse Operations Coordinator to join our Bristol distribution centre. Reporting to the Site Manager, the successful candidate will oversee the daily movement of goods across two adjoining warehouses and supervise a team of eleven.

Responsibilities
· Plan shift rotas and ensure adequate cover during peak periods
· Monitor stock accuracy and investigate discrepancies
· Liaise with carriers to resolve delivery exceptions
· Maintain health and safety records to audit standard

Requirements
· At least three years in a warehouse or distribution environment
· Confident handling of inventory management software
· A forklift licence is desirable but not essential; training can be provided

What we offer
Salary from £34,000 depending on experience, 25 days' holiday, and a company pension. This is a permanent, full-time position working Monday to Friday, 7 a.m. to 3 p.m.

To apply, send a CV and a short covering letter to careers@kestrel-logistics.co.uk by 24 October. Interviews will be held during the first week of November. Candidates who have not heard from us by 15 November should assume their application has been unsuccessful.`,
      },
    ],
  },
  {
    id: 'p7-doc-02',
    kind: 'text',
    intro: 'Questions 4 to 6 refer to the following text-message chain.',
    docs: [
      {
        label: 'Messages',
        body: `Tomas Reiner (8:42 a.m.)
Morning — I'm at the Eastgate site but the main gate is padlocked. Was anyone expecting us today?

Ingrid Haas (8:44 a.m.)
You're kidding. I confirmed Tuesday with their facilities manager on Friday.

Tomas Reiner (8:45 a.m.)
Well, the padlock disagrees. There's a notice saying the site is closed for resurfacing until the 9th.

Ingrid Haas (8:47 a.m.)
Let me call him. Don't go anywhere yet — if he can send someone with a key we can still do the inspection this morning.

Tomas Reiner (8:52 a.m.)
Any luck? I've got the Marlow survey at eleven and it's forty minutes from here.

Ingrid Haas (8:55 a.m.)
Voicemail twice. Go to Marlow. I'll rebook Eastgate for the 10th and this time I'll get it in writing.`,
      },
    ],
  },
  {
    id: 'p7-doc-03',
    kind: 'text',
    intro: 'Questions 7 to 9 refer to the following email and schedule.',
    docs: [
      {
        label: 'Document 1 — Courriel',
        body: `To: Rafael Moreno
From: Dounia Lahmar, Training Office
Subject: Your place on the certification course

Dear Rafael,

You have been enrolled on the Advanced Quality Systems certification, which runs as four half-day modules at our Nantes training centre.

Because you completed the Internal Auditing workshop in March, you are exempt from the introductory module and should join the programme from the second session onward. Your manager has approved your absence for those dates.

One point to note: the examination at the end of the programme is only open to participants who have attended every session they were enrolled in. If you cannot make a date, tell me at least five working days in advance so I can move you to the January cohort.

Lunch is provided on full-day sessions only.

Kind regards,
Dounia Lahmar`,
      },
      {
        label: 'Document 2 — Planning',
        body: `ADVANCED QUALITY SYSTEMS — Autumn cohort, Nantes

Module 1 · Foundations of Quality Management
   Tuesday 4 November, 9:00–12:30

Module 2 · Process Mapping and Control
   Tuesday 11 November, 9:00–12:30

Module 3 · Non-conformity and Corrective Action
   Tuesday 18 November, 9:00–12:30

Module 4 · Audit Preparation and Certification Exam
   Tuesday 25 November, 9:00–16:30 (lunch provided)

All sessions take place in Room B2. Participants must register at reception on arrival.`,
      },
    ],
  },
];

export const PART7_BANK_01: readonly ToeicItem[] = [
  // ---------- Document 1 : annonce d'emploi ----------
  {
    id: 'p7-001',
    part: 7,
    passage: 'p7-doc-01',
    stem: 'What is indicated about the position?',
    options: [
      'It involves managing a team.',
      'It requires weekend availability.',
      'It is a six-month contract.',
      'It is based at two separate sites.',
    ],
    answer: 0,
    explain:
      '« Supervise a team of eleven ». Le poste est « permanent » et « Monday to Friday », ce qui écarte les propositions 2 et 3. La 4 est le piège fin : les deux entrepôts sont « adjoining », donc un seul site — un mot suffit à faire basculer la réponse.',
    cefr: 'B1',
    tags: ['detail'],
  },
  {
    id: 'p7-002',
    part: 7,
    passage: 'p7-doc-01',
    stem: 'The word “desirable” in the Requirements section is closest in meaning to',
    options: ['attractive', 'preferred', 'required', 'affordable'],
    answer: 1,
    explain:
      'Question de SYNONYME EN CONTEXTE : le sens courant de « desirable » (séduisant) n’est pas celui-ci. La suite le précise — « desirable but not essential » —, donc « souhaité sans être exigé » : « preferred ». « Required » dirait exactement le contraire de « not essential ».',
    cefr: 'B2',
    tags: ['synonym', 'vocabulary'],
  },
  {
    id: 'p7-003',
    part: 7,
    passage: 'p7-doc-01',
    stem: 'What should applicants do if they receive no reply by 15 November?',
    options: [
      'Contact the Site Manager directly',
      'Submit a second application',
      'Consider that they were not selected',
      'Wait for the interviews to be rescheduled',
    ],
    answer: 2,
    explain:
      '« Should assume their application has been unsuccessful ». L’énoncé reformule « assume […] unsuccessful » en « consider that they were not selected » : en partie 7, la bonne réponse PARAPHRASE presque toujours le texte au lieu de le recopier.',
    cefr: 'B1',
    tags: ['detail', 'inference'],
  },

  // ---------- Document 2 : chaîne de messages ----------
  {
    id: 'p7-004',
    part: 7,
    passage: 'p7-doc-02',
    stem: 'Why is Mr. Reiner unable to carry out his task?',
    options: [
      'He arrived at the wrong address.',
      'The site is closed for roadworks.',
      'His colleague forgot to book the visit.',
      'He does not have the correct equipment.',
    ],
    answer: 1,
    explain:
      '« A notice saying the site is closed for resurfacing until the 9th » — « resurfacing » = réfection du revêtement. Ingrid affirme avoir bien confirmé la visite le vendredi : le distracteur 3 impute une faute que le texte dément.',
    cefr: 'B1',
    tags: ['detail'],
  },
  {
    id: 'p7-005',
    part: 7,
    passage: 'p7-doc-02',
    stem: 'At 8:45 a.m., what does Mr. Reiner most likely mean when he writes, “the padlock disagrees”?',
    options: [
      'He thinks the lock is broken.',
      'He cannot reach the facilities manager.',
      'The site is shut despite the confirmation.',
      'He would rather postpone the inspection.',
    ],
    answer: 2,
    explain:
      'Question d’INTENTION. Ingrid vient de dire qu’elle avait confirmé la visite ; répondre que « le cadenas n’est pas d’accord » est une façon ironique de dire : peu importe ce qui a été convenu, c’est fermé. Prendre la phrase au pied de la lettre (« le cadenas est cassé ») est exactement le piège.',
    cefr: 'B2',
    tags: ['inference'],
  },
  {
    id: 'p7-006',
    part: 7,
    passage: 'p7-doc-02',
    stem: 'What does Ms. Haas decide to do?',
    options: [
      'Drive to the Eastgate site herself',
      'Arrange a new date for the inspection',
      'Cancel the Marlow survey',
      'Send a key to Mr. Reiner',
    ],
    answer: 1,
    explain:
      '« I’ll rebook Eastgate for the 10th ». Elle renonce justement à faire venir quelqu’un avec une clé après deux messageries vocales, et c’est au contraire le relevé de Marlow qu’elle lui demande d’aller faire.',
    cefr: 'B1',
    tags: ['next-action'],
  },

  // ---------- Document 3 : double document ----------
  {
    id: 'p7-007',
    part: 7,
    passage: 'p7-doc-03',
    stem: 'On what date will Mr. Moreno attend his first session?',
    options: ['4 November', '11 November', '18 November', '25 November'],
    answer: 1,
    explain:
      'RECOUPEMENT : le courriel dit qu’il est dispensé du module d’introduction et commence « from the second session onward » ; le planning date le module 2 du 11 novembre. Ni l’un ni l’autre document ne donne la réponse seul — c’est le principe du document double.',
    cefr: 'B2',
    tags: ['cross-reference'],
  },
  {
    id: 'p7-008',
    part: 7,
    passage: 'p7-doc-03',
    stem: 'On which date will Mr. Moreno be given lunch?',
    options: ['4 November', '11 November', '18 November', '25 November'],
    answer: 3,
    explain:
      'Second RECOUPEMENT : le courriel pose la règle (« lunch is provided on full-day sessions only ») et le planning désigne la seule session longue, le module 4 du 25 novembre, de 9 h à 16 h 30. Les trois autres se terminent à 12 h 30.',
    cefr: 'B2',
    tags: ['cross-reference', 'detail'],
  },
  {
    id: 'p7-009',
    part: 7,
    passage: 'p7-doc-03',
    stem: 'What is stated about the certification examination?',
    options: [
      'It takes place at a separate centre.',
      'It is restricted to those with full attendance.',
      'It may be retaken in January.',
      'It lasts half a day.',
    ],
    answer: 1,
    explain:
      '« Only open to participants who have attended every session they were enrolled in ». Attention à la 3 : janvier concerne un CHANGEMENT DE SESSION demandé à l’avance, pas un rattrapage d’examen — la partie 7 recycle volontiers un mot du texte dans un distracteur pour lui faire dire autre chose.',
    cefr: 'B2',
    tags: ['detail', 'inference'],
  },
];
