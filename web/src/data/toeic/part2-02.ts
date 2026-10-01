// Partie 2 — Questions-réponses. Banque n°2 : 13 items.
//
// Avec la banque n°1 (12 items), la partie 2 atteint les **25 questions du vrai examen**.
// Mêmes règles d'écriture qu'en banque n°1 (voir `part2-01.ts`) : rien n'est imprimé, les
// distracteurs accrochent un son de la question, et un tiers des bonnes réponses sont indirectes.
//
// Cette banque couvre les types de question que la n°1 laissait de côté : « how about »,
// l'impératif, la demande de permission, la question en « whose », et deux cas où la bonne réponse
// est un refus ou une ignorance assumée — « I don't know » est une réponse valide au TOEIC, et
// beaucoup de candidats l'écartent par réflexe.
import type { ToeicItem } from '../../lib/toeic';

export const PART2_BANK_02: readonly ToeicItem[] = [
  {
    id: 'p2-013',
    part: 2,
    stem: 'How about moving the team meeting to Wednesday?',
    options: ['Wednesday works for me.', 'It moved very quickly.', 'About thirty people.'],
    answer: 0,
    explain:
      '« How about + gérondif » fait une SUGGESTION, pas une question d’information : on y répond en acceptant ou en refusant. « It moved very quickly » reprend « moving » dans un sens physique, et « about thirty » s’accroche au mot « about ».',
    cefr: 'A2',
    tags: ['speech-act'],
  },
  {
    id: 'p2-014',
    part: 2,
    stem: 'Whose laptop was left in the training room?',
    options: ['It was a long training session.', 'I think it belongs to Yuki.', 'On the table near the door.'],
    answer: 1,
    explain:
      '« Whose » demande un PROPRIÉTAIRE, pas un lieu. Le distracteur « on the table near the door » est très tentant parce qu’il est vrai et pertinent — mais il répond à « where ». Ne jamais choisir une réponse juste pour une autre question.',
    cefr: 'A2',
    tags: ['detail', 'pronoun'],
  },
  {
    id: 'p2-015',
    part: 2,
    stem: 'Could you take a look at this spreadsheet before I send it?',
    options: ['I’m afraid I’m on a call in two minutes.', 'Yes, it looks like rain.', 'The spread was very generous.'],
    answer: 0,
    explain:
      'Un REFUS poli est une bonne réponse parfaitement légitime : il répond bien à la demande. Beaucoup de candidats cherchent l’acceptation et passent à côté. « It looks like rain » joue sur « look », « the spread » sur « spreadsheet ».',
    cefr: 'B1',
    tags: ['speech-act', 'inference'],
  },
  {
    id: 'p2-016',
    part: 2,
    stem: 'Don’t forget to sign in at the reception desk.',
    options: ['I signed the contract yesterday.', 'Thanks for the reminder.', 'The receptionist is very helpful.'],
    answer: 1,
    explain:
      'Un IMPÉRATIF attend un accusé de réception, pas une information. « Thanks for the reminder » est la forme la plus fréquente au TOEIC. Les deux autres reprennent « sign » et « reception » sans réagir à la consigne.',
    cefr: 'A2',
    tags: ['speech-act'],
  },
  {
    id: 'p2-017',
    part: 2,
    stem: 'When will the renovation of the lobby be finished?',
    options: ['Nobody has told me yet.', 'By the architect we used last time.', 'It looks much brighter now.'],
    answer: 0,
    explain:
      'L’IGNORANCE est une réponse valide : « personne ne me l’a dit » répond bien à la question. C’est l’un des pièges les plus rentables de la partie 2, parce que le candidat cherche une date et écarte une phrase qui n’en contient pas.',
    cefr: 'B1',
    tags: ['speech-act', 'inference'],
  },
  {
    id: 'p2-018',
    part: 2,
    stem: 'May I use the conference phone in your office?',
    options: ['Go ahead, I’m not using it.', 'I used to work in that office.', 'It’s a conference in Berlin.'],
    answer: 0,
    explain:
      '« May I » demande une PERMISSION : on accorde ou on refuse. Attention au distracteur « I used to work » — « used to » n’a rien à voir avec « use », c’est une habitude passée. Confusion classique chez les francophones.',
    cefr: 'A2',
    tags: ['speech-act', 'modal'],
  },
  {
    id: 'p2-019',
    part: 2,
    stem: 'Where should I file these completed expense reports?',
    options: ['Last Friday, I believe.', 'In the cabinet behind my desk.', 'They were completed on time.'],
    answer: 1,
    explain:
      '« Where » demande un LIEU. Les deux distracteurs reprennent « completed » et proposent une date : plausibles dans un contexte de notes de frais, muets sur l’endroit. Identifier le mot interrogatif reste la règle.',
    cefr: 'A1',
    tags: ['detail'],
  },
  {
    id: 'p2-020',
    part: 2,
    stem: 'Isn’t Mr. Tanaka supposed to lead the presentation?',
    options: ['He led us to the exit.', 'He asked Mina to cover for him.', 'Yes, it was a good presentation.'],
    answer: 1,
    explain:
      'Question NÉGATIVE : elle attend une confirmation ou une rectification. « Il a demandé à Mina de le remplacer » rectifie sans dire « no » — réponse indirecte typique. Noter le temps du distracteur 3 : « it WAS a good presentation » la place dans le passé alors que la présentation n’a pas eu lieu.',
    cefr: 'B1',
    tags: ['speech-act', 'tense'],
  },
  {
    id: 'p2-021',
    part: 2,
    stem: 'How often does the cleaning crew come to this floor?',
    options: ['Every weekday evening.', 'It took about an hour.', 'They cleaned it very well.'],
    answer: 0,
    explain:
      '« How often » demande une FRÉQUENCE. « It took about an hour » est une durée, donc « how long ». Les trois mots interrogatifs en « how » — often, long, much — sont la source d’erreur numéro un de la partie 2 chez les francophones.',
    cefr: 'A2',
    tags: ['detail'],
  },
  {
    id: 'p2-022',
    part: 2,
    stem: 'Do you want me to print the agenda or email it to everyone?',
    options: ['Email is fine, it saves paper.', 'Yes, please do.', 'The printer is out of toner.'],
    answer: 0,
    explain:
      'Question ALTERNATIVE : « yes » est mécaniquement impossible, il faut choisir. « The printer is out of toner » est très tentant parce qu’il est lié — mais il explique un problème au lieu de trancher entre les deux options.',
    cefr: 'B1',
    tags: ['speech-act'],
  },
  {
    id: 'p2-023',
    part: 2,
    stem: 'Why don’t we review the budget before the board meeting?',
    options: ['Because it was approved last month.', 'Good idea — how about Monday morning?', 'The board room seats twelve.'],
    answer: 1,
    explain:
      '« Why don’t we » n’est PAS une question en « why » : c’est une suggestion déguisée. Répondre par « because » est donc le piège, et il est redoutable parce que la forme interrogative appelle ce réflexe. La bonne réponse accepte et propose un créneau.',
    cefr: 'B1',
    tags: ['speech-act'],
  },
  {
    id: 'p2-024',
    part: 2,
    stem: 'Which of the two candidates did the panel prefer?',
    options: ['They preferred the second one.', 'The interviews lasted all morning.', 'Four people were on the panel.'],
    answer: 0,
    explain:
      '« Which of the two » exige de DÉSIGNER l’un des deux. Les deux distracteurs donnent des informations exactes sur l’entretien et le jury, mais aucun ne choisit — et une question de sélection n’accepte qu’une sélection.',
    cefr: 'A2',
    tags: ['detail', 'comparative'],
  },
  {
    id: 'p2-025',
    part: 2,
    stem: 'The delivery van hasn’t arrived yet, has it?',
    options: ['It arrived at the depot last night.', 'No, but the driver just called.', 'Yes, I delivered it myself.'],
    answer: 1,
    explain:
      'Le « tag question » négatif attend une confirmation du négatif : « no » signifie « non, elle n’est pas arrivée ». L’ajout « but the driver just called » est ce qui rend la réponse naturelle. Le distracteur 1 répond au passé sur un autre lieu, le 3 contredit la question avec « yes » puis un passé incohérent.',
    cefr: 'B1',
    tags: ['speech-act', 'tense'],
  },
];
