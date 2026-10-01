// Partie 4 — Exposés courts. Banque n°3 : 4 exposés, 12 items.
//
// Avec les banques n°1 et n°2, la partie 4 atteint les **30 questions du vrai examen**
// (10 exposés de 3 questions). Chaque exposé garde son CHANGEMENT DE CAP en milieu de texte, la
// marque de fabrique de la partie 4 : l'information finale corrige celle du début, et qui répond
// trop tôt se trompe.
//
// Quatre genres encore absents : la consigne de sécurité avant une visite, le message d'accueil
// téléphonique automatisé, la présentation d'un intervenant, et le bulletin de circulation.
import type { ToeicItem, ToeicPassage } from '../../lib/toeic';

export const PART4_PASSAGES_03: readonly ToeicPassage[] = [
  {
    id: 'p4-talk-07',
    kind: 'talk',
    intro: 'Questions 19 to 21 refer to the following instructions.',
    turns: [
      {
        speaker: 'Homme',
        voice: 'B',
        text:
          'Before we go onto the production floor, three things. First, safety glasses are compulsory past the yellow line, even if you wear prescription glasses — we have overglasses in the basket by the door. ' +
          'Second, you’ll see our automated guided vehicles moving pallets. They stop on their own if anything crosses their path, so please don’t jump out of the way; just keep walking normally and they will handle it. ' +
          'Third — and this is the one people forget — the floor markings. Green is for pedestrians, yellow for vehicles. Stay inside the green at all times. ' +
          'Photographs are fine today, except in the packing hall at the far end, where we are running a trial for a client who has asked us not to publish anything.',
      },
    ],
  },
  {
    id: 'p4-talk-08',
    kind: 'talk',
    intro: 'Questions 22 to 24 refer to the following recorded message.',
    turns: [
      {
        speaker: 'Femme',
        voice: 'A',
        text:
          'Thank you for calling Ferndale Veterinary Practice. Our surgery is open Monday to Friday from eight until six-thirty, and Saturday mornings until noon. ' +
          'Please note that from the first of April our Saturday clinic moves to the Oakhill site; the Ferndale building will be closed at weekends while the kennels are rebuilt. ' +
          'If this is an emergency outside opening hours, hang up and call the out-of-hours service on 0-1-7-3, 5-5-5, 2-0-9-0 — do not leave a message on this line, as it is only checked during the working day. ' +
          'To order repeat prescriptions, press one. To book, change or cancel an appointment, press two. For all other enquiries, please hold and a receptionist will answer shortly.',
      },
    ],
  },
  {
    id: 'p4-talk-09',
    kind: 'talk',
    intro: 'Questions 25 to 27 refer to the following introduction.',
    turns: [
      {
        speaker: 'Homme',
        voice: 'C',
        text:
          'It’s my pleasure to introduce this evening’s speaker. Dr. Amara Sen trained as a civil engineer before moving into urban planning, and she has spent the last twelve years advising cities on flood defences — most recently Rotterdam and Dhaka. ' +
          'Many of you will know her from the book she published last year, though I should say she has asked me not to spend the evening on it; tonight she wants to talk about something she has not written up yet, which is why we agreed there would be no recording. ' +
          'She will speak for about forty minutes and then take questions. There are index cards on your seats — please write your question down and pass it to the aisle, rather than queuing at the microphone. ' +
          'Dr. Sen, the floor is yours.',
      },
    ],
  },
  {
    id: 'p4-talk-10',
    kind: 'talk',
    intro: 'Questions 28 to 30 refer to the following traffic report.',
    turns: [
      {
        speaker: 'Femme',
        voice: 'A',
        text:
          'Here’s your travel update at half past seven. The eastbound carriageway of the ring road is down to one lane between junctions four and five after an overnight resurfacing crew overran. ' +
          'Highways say they expect to reopen the second lane by nine, but I’d allow an extra twenty-five minutes if you’re heading for the airport. ' +
          'Rail services are running normally this morning, despite yesterday’s signalling fault — that’s now fixed. ' +
          'One change for cyclists: the towpath between Mill Bridge and the lock is shut until Thursday for tree work, and the signed diversion adds about a kilometre. ' +
          'Next update at eight.',
      },
    ],
  },
];

export const PART4_BANK_03: readonly ToeicItem[] = [
  // ---------- Exposé 7 : consignes de sécurité ----------
  {
    id: 'p4-019',
    part: 4,
    passage: 'p4-talk-07',
    stem: 'Who most likely are the listeners?',
    options: ['Visitors to a factory', 'New production employees', 'Safety inspectors', 'Delivery drivers'],
    answer: 0,
    explain:
      'Déduction : « before we go onto the production floor », des surlunettes prêtées à la porte, et l’autorisation de photographier. On n’explique pas à des employés où sont les surlunettes, et on n’autorise pas des inspecteurs à photographier — ce sont des visiteurs.',
    cefr: 'B2',
    tags: ['gist', 'inference'],
  },
  {
    id: 'p4-020',
    part: 4,
    passage: 'p4-talk-07',
    stem: 'What does the speaker say about the automated vehicles?',
    options: [
      'They must be given right of way.',
      'They stop by themselves when obstructed.',
      'They only operate in the packing hall.',
      'They are being tested for the first time.',
    ],
    answer: 1,
    explain:
      '« They stop on their own if anything crosses their path, so please DON’T jump out of the way. » La consigne est contre-intuitive, et c’est pour ça qu’elle est interrogée : le réflexe serait de leur céder le passage, ce que le distracteur 1 propose.',
    cefr: 'B2',
    tags: ['detail'],
  },
  {
    id: 'p4-021',
    part: 4,
    passage: 'p4-talk-07',
    stem: 'Where are photographs not permitted?',
    options: ['Past the yellow line', 'On the green walkways', 'In the packing hall', 'Near the pallet vehicles'],
    answer: 2,
    explain:
      '« Photographs are fine today, EXCEPT in the packing hall. » La ligne jaune et les marquages verts concernent les lunettes et la circulation : trois consignes voisines, trois objets différents, et la partie 4 compte précisément sur la confusion.',
    cefr: 'B1',
    tags: ['detail'],
  },

  // ---------- Exposé 8 : message téléphonique ----------
  {
    id: 'p4-022',
    part: 4,
    passage: 'p4-talk-08',
    stem: 'What change is announced?',
    options: [
      'The practice will close permanently.',
      'Saturday clinics will move to another site.',
      'Opening hours will be extended.',
      'The emergency number will change.',
    ],
    answer: 1,
    explain:
      '« From the first of April our Saturday clinic moves to the Oakhill site. » C’est le changement de cap : seuls les samedis sont concernés, et seulement le temps des travaux de chenil — une fermeture définitive serait une lecture bien plus large que le texte.',
    cefr: 'B1',
    tags: ['detail'],
  },
  {
    id: 'p4-023',
    part: 4,
    passage: 'p4-talk-08',
    stem: 'What should callers with an emergency do outside opening hours?',
    options: [
      'Leave a message on this line',
      'Press one for a prescription',
      'Call a separate number',
      'Hold for a receptionist',
    ],
    answer: 2,
    explain:
      '« Hang up and call the out-of-hours service » — et le message interdit explicitement l’autre option : « do not leave a message on this line, as it is only checked during the working day ». La raison donnée est ce qui rend la consigne mémorable.',
    cefr: 'A2',
    tags: ['detail', 'next-action'],
  },
  {
    id: 'p4-024',
    part: 4,
    passage: 'p4-talk-08',
    stem: 'Why is the Ferndale building closing at weekends?',
    options: [
      'Building work is being carried out.',
      'There are not enough staff.',
      'The lease has expired.',
      'Demand has fallen.',
    ],
    answer: 0,
    explain:
      '« While the kennels are rebuilt. » La cause est glissée dans une subordonnée en fin de phrase, après l’information principale — placement typique de la partie 4, et c’est pourquoi on écoute la phrase jusqu’au bout.',
    cefr: 'B1',
    tags: ['detail'],
  },

  // ---------- Exposé 9 : présentation d'un intervenant ----------
  {
    id: 'p4-025',
    part: 4,
    passage: 'p4-talk-09',
    stem: 'What is Dr. Sen’s current field of work?',
    options: ['Civil engineering', 'Urban planning', 'Publishing', 'Architecture'],
    answer: 1,
    explain:
      '« Trained as a civil engineer BEFORE MOVING INTO urban planning. » La question porte sur le présent : le génie civil est sa formation d’origine, et c’est le distracteur que l’ordre des mots rend tentant.',
    cefr: 'B1',
    tags: ['detail'],
  },
  {
    id: 'p4-026',
    part: 4,
    passage: 'p4-talk-09',
    stem: 'Why will the talk not be recorded?',
    options: [
      'The venue has no equipment.',
      'The content is not yet published.',
      'The audience objected.',
      'The speaker’s publisher forbade it.',
    ],
    answer: 1,
    explain:
      '« Something she has not written up yet, WHICH IS WHY we agreed there would be no recording. » Le livre est mentionné juste avant, mais justement pour dire qu’on n’en parlera pas : l’éditeur n’apparaît nulle part.',
    cefr: 'B2',
    tags: ['inference', 'detail'],
  },
  {
    id: 'p4-027',
    part: 4,
    passage: 'p4-talk-09',
    stem: 'How should the audience ask questions?',
    options: [
      'By queuing at a microphone',
      'By writing on a card',
      'By emailing afterwards',
      'By raising a hand during the talk',
    ],
    answer: 1,
    explain:
      '« Please write your question down and pass it to the aisle, RATHER THAN queuing at the microphone. » La structure « rather than » donne la bonne réponse ET le distracteur dans la même phrase — repérer l’opposition suffit.',
    cefr: 'B1',
    tags: ['next-action'],
  },

  // ---------- Exposé 10 : bulletin de circulation ----------
  {
    id: 'p4-028',
    part: 4,
    passage: 'p4-talk-10',
    stem: 'What has caused the delay on the ring road?',
    options: [
      'An accident between two junctions',
      'Roadworks that lasted longer than planned',
      'Heavy airport traffic',
      'A signalling fault',
    ],
    answer: 1,
    explain:
      '« An overnight resurfacing crew overran » — « overran » = a dépassé son horaire. Le défaut de signalisation concerne le RAIL et il est déjà réparé : le distracteur 4 déplace une information d’un mode de transport à l’autre.',
    cefr: 'B2',
    tags: ['detail', 'vocabulary'],
  },
  {
    id: 'p4-029',
    part: 4,
    passage: 'p4-talk-10',
    stem: 'What does the speaker advise airport travellers to do?',
    options: [
      'Take the train instead',
      'Allow extra travel time',
      'Leave before nine o’clock',
      'Use the towpath diversion',
    ],
    answer: 1,
    explain:
      '« I’d allow an extra twenty-five minutes if you’re heading for the airport. » Noter la nuance sur neuf heures : c’est l’heure à laquelle la voie doit ROUVRIR, pas une heure avant laquelle il faudrait partir — le distracteur 3 retourne l’information.',
    cefr: 'B2',
    tags: ['detail', 'inference'],
  },
  {
    id: 'p4-030',
    part: 4,
    passage: 'p4-talk-10',
    stem: 'What is said about the towpath?',
    options: [
      'It is closed until Thursday.',
      'It has been widened for cyclists.',
      'It is the recommended diversion.',
      'It reopens at nine o’clock.',
    ],
    answer: 0,
    explain:
      '« The towpath between Mill Bridge and the lock is SHUT until Thursday for tree work. » Le chemin de halage n’est pas la déviation, il est ce qui est fermé — la déviation, elle, est balisée ailleurs et rallonge d’un kilomètre.',
    cefr: 'B1',
    tags: ['detail'],
  },
];
