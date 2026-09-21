import type { Comprehension } from '../types';

// Contenu de compréhension (texte / dialogue) ajouté PAR-DESSUS le curriculum,
// sans jamais toucher au gros curriculum.ts. Clé = `${niveau}:${indexDeLaLeçon}`
// (l'index correspond à l'ordre des leçons dans CURRICULUM[niveau]).
// content.ts fusionne ces entrées dans les leçons via lessonsFor().
//
// Pour ajouter une compréhension : repère l'index de la leçon (cf. LearnPage),
// puis ajoute une entrée ici. Les questions réutilisent le format Drill.

export const COMPREHENSION: Record<string, Comprehension> = {
  // A1 · « Le verbe to be » (1re leçon — toujours accessible)
  'A1:0': {
    kind: 'dialogue',
    title: 'The new student',
    intro: 'Un dialogue simple avec le verbe « to be ». Lis puis réponds.',
    turns: [
      { speaker: 'Emma', en: 'Hi, are you the new student?', fr: 'Salut, es-tu le nouvel élève ?' },
      { speaker: 'Noah', en: "Yes, I am. I'm Noah.", fr: 'Oui. Je suis Noah.' },
      { speaker: 'Emma', en: "I'm Emma. Are you nervous?", fr: 'Je suis Emma. Es-tu stressé ?' },
      { speaker: 'Noah', en: 'A little. The school is very big!', fr: 'Un peu. L’école est très grande !' },
      { speaker: 'Emma', en: "Don't worry. The teachers are nice.", fr: 'Ne t’inquiète pas. Les profs sont gentils.' },
    ],
    questions: [
      { q: 'Who is the new student?', options: ['Noah', 'Emma', 'The teacher'], answer: 'Noah' },
      { q: 'Comment se sent Noah ?', options: ['Un peu stressé', 'Très heureux', 'En colère'], answer: 'Un peu stressé' },
      { q: 'Comment sont les profs d’après Emma ?', options: ['Nice', 'Strict', 'Boring'], answer: 'Nice' },
    ],
  },

  // A1 · « Se présenter »
  'A1:1': {
    kind: 'dialogue',
    title: 'First meeting',
    intro: 'Écoute (ou lis) ce premier échange entre deux personnes.',
    turns: [
      { speaker: 'Anna', en: "Hi! I'm Anna. What's your name?", fr: 'Salut ! Je suis Anna. Comment tu t’appelles ?' },
      { speaker: 'Tom', en: 'Hello Anna. My name is Tom. Nice to meet you.', fr: 'Bonjour Anna. Je m’appelle Tom. Enchanté.' },
      { speaker: 'Anna', en: 'Nice to meet you too. Where are you from?', fr: 'Enchantée aussi. D’où viens-tu ?' },
      { speaker: 'Tom', en: "I'm from Canada. And you?", fr: 'Je viens du Canada. Et toi ?' },
      { speaker: 'Anna', en: "I'm from France. I live in Paris.", fr: 'Je viens de France. J’habite à Paris.' },
    ],
    questions: [
      { q: 'Comment s’appelle le garçon ?', options: ['Tom', 'Anna', 'Paul'], answer: 'Tom', exp: '« My name is Tom. »' },
      { q: 'D’où vient Tom ?', options: ['Canada', 'France', 'England'], answer: 'Canada', exp: '« I’m from Canada. »' },
      { q: 'Où habite Anna ?', options: ['Paris', 'London', 'Ottawa'], answer: 'Paris', exp: '« I live in Paris. »' },
    ],
  },

  // A1 · « La famille »
  'A1:2': {
    kind: 'dialogue',
    title: 'A family photo',
    intro: 'Léa montre une photo de sa famille.',
    turns: [
      { speaker: 'Léa', en: 'This is a photo of my family.', fr: 'Voici une photo de ma famille.' },
      { speaker: 'Max', en: 'Who is this man?', fr: 'Qui est cet homme ?' },
      { speaker: 'Léa', en: 'He is my father. His name is Paul.', fr: "C'est mon père. Il s'appelle Paul." },
      { speaker: 'Max', en: 'And the woman next to him?', fr: 'Et la femme à côté de lui ?' },
      { speaker: 'Léa', en: "That's my mother, Marie. I have one brother too.", fr: "C'est ma mère, Marie. J'ai aussi un frère." },
    ],
    questions: [
      { q: 'Comment s’appelle le père de Léa ?', options: ['Paul', 'Max', 'Marie'], answer: 'Paul' },
      { q: 'Combien de frères a Léa ?', options: ['Un', 'Deux', 'Zéro'], answer: 'Un' },
      { q: 'Qui est Marie ?', options: ['Sa mère', 'Sa sœur', 'Son amie'], answer: 'Sa mère' },
    ],
  },

  // A1 · « Les possessifs »
  'A1:3': {
    kind: 'dialogue',
    title: 'Whose is it?',
    intro: 'À qui appartiennent ces objets ?',
    turns: [
      { speaker: 'Tom', en: 'Is this your bag?', fr: 'C’est ton sac ?' },
      { speaker: 'Sara', en: "No, it's not my bag. It's her bag.", fr: 'Non, ce n’est pas mon sac. C’est son sac (à elle).' },
      { speaker: 'Tom', en: 'And these keys?', fr: 'Et ces clés ?' },
      { speaker: 'Sara', en: 'They are his keys.', fr: 'Ce sont ses clés (à lui).' },
    ],
    questions: [
      { q: 'À qui est le sac ?', options: ['À elle', 'À Tom', 'À Sara'], answer: 'À elle' },
      { q: 'À qui sont les clés ?', options: ['À lui', 'À Sara', 'À personne'], answer: 'À lui' },
      { q: 'What does Tom ask about first?', options: ['A bag', 'A car', 'A phone'], answer: 'A bag' },
    ],
  },

  // A1 · « Les articles : a, an, the »
  'A1:4': {
    kind: 'text',
    title: 'My pets and my garden',
    intro: 'Lis ce court texte puis réponds.',
    text: 'I have a dog and a cat. The dog is big and the cat is small. I also have an apple tree in the garden. The tree is very old.',
    translation: "J'ai un chien et un chat. Le chien est grand et le chat est petit. J'ai aussi un pommier dans le jardin. L'arbre est très vieux.",
    questions: [
      { q: 'How many pets are mentioned?', options: ['Two', 'One', 'Three'], answer: 'Two' },
      { q: 'Comment est le chat ?', options: ['Small', 'Big', 'Old'], answer: 'Small' },
      { q: 'Qu’y a-t-il dans le jardin ?', options: ['An apple tree', 'A car', 'A pool'], answer: 'An apple tree' },
    ],
  },

  // A1 · « Le pluriel des noms »
  'A1:5': {
    kind: 'text',
    title: 'In the park',
    intro: 'Un texte plein de pluriels.',
    text: 'There are three children in the park. They have two dogs and one ball. The boxes near the bench are full of toys.',
    translation: 'Il y a trois enfants dans le parc. Ils ont deux chiens et un ballon. Les boîtes près du banc sont pleines de jouets.',
    questions: [
      { q: 'Combien d’enfants dans le parc ?', options: ['Three', 'Two', 'One'], answer: 'Three' },
      { q: 'How many dogs?', options: ['Two', 'Three', 'One'], answer: 'Two' },
      { q: 'Qu’y a-t-il dans les boîtes ?', options: ['Toys', 'Books', 'Food'], answer: 'Toys' },
    ],
  },

  // A1 · « This, that, these, those »
  'A1:6': {
    kind: 'dialogue',
    title: 'At the shop',
    intro: 'Dans un magasin de vêtements.',
    turns: [
      { speaker: 'Client', en: 'How much is this shirt?', fr: 'Combien coûte cette chemise ?' },
      { speaker: 'Seller', en: 'This one is 20 euros. Those shoes are 40.', fr: 'Celle-ci fait 20 euros. Ces chaussures-là font 40.' },
      { speaker: 'Client', en: 'And these socks?', fr: 'Et ces chaussettes-ci ?' },
      { speaker: 'Seller', en: 'They are 5 euros.', fr: 'Elles font 5 euros.' },
    ],
    questions: [
      { q: 'Combien coûte la chemise ?', options: ['20 euros', '40 euros', '5 euros'], answer: '20 euros' },
      { q: 'Prix des chaussures ?', options: ['40 euros', '20 euros', '5 euros'], answer: '40 euros' },
      { q: 'How much are the socks?', options: ['5 euros', '10 euros', '15 euros'], answer: '5 euros' },
    ],
  },

  // A1 · « Les couleurs et les objets du quotidien »
  'A1:7': {
    kind: 'dialogue',
    title: 'Favourite colours',
    intro: 'Anna et Ben parlent de leurs couleurs préférées.',
    turns: [
      { speaker: 'Anna', en: "What's your favourite colour?", fr: 'Quelle est ta couleur préférée ?' },
      { speaker: 'Ben', en: 'My favourite colour is blue. My bike is blue.', fr: 'Ma couleur préférée est le bleu. Mon vélo est bleu.' },
      { speaker: 'Anna', en: 'Mine is red. I have a red bag and a red pen.', fr: "La mienne c'est le rouge. J'ai un sac rouge et un stylo rouge." },
    ],
    questions: [
      { q: 'Quelle est la couleur préférée de Ben ?', options: ['Blue', 'Red', 'Green'], answer: 'Blue' },
      { q: 'What colour is Anna’s bag?', options: ['Red', 'Blue', 'Yellow'], answer: 'Red' },
      { q: 'What is blue?', options: ["Ben's bike", "Anna's pen", "Ben's bag"], answer: "Ben's bike" },
    ],
  },

  // A1 · « Décrire : les adjectifs courants »
  'A1:8': {
    kind: 'text',
    title: 'My new flat',
    intro: 'Un texte descriptif.',
    text: 'My new flat is small but comfortable. The living room is bright and the kitchen is modern. My neighbours are friendly and quiet.',
    translation: 'Mon nouvel appartement est petit mais confortable. Le salon est lumineux et la cuisine est moderne. Mes voisins sont sympathiques et calmes.',
    questions: [
      { q: 'Comment est l’appartement ?', options: ['Small but comfortable', 'Big and old', 'Dark'], answer: 'Small but comfortable' },
      { q: 'How is the kitchen?', options: ['Modern', 'Old', 'Dirty'], answer: 'Modern' },
      { q: 'Comment sont les voisins ?', options: ['Friendly and quiet', 'Noisy', 'Rude'], answer: 'Friendly and quiet' },
    ],
  },

  // A1 · « Les nombres & l'âge »
  'A1:9': {
    kind: 'dialogue',
    title: 'How old are you?',
    intro: 'Des enfants parlent de leur âge.',
    turns: [
      { speaker: 'Léo', en: 'How old are you?', fr: 'Quel âge as-tu ?' },
      { speaker: 'Mia', en: "I'm nine years old. And you?", fr: "J'ai neuf ans. Et toi ?" },
      { speaker: 'Léo', en: "I'm eleven. My sister is fourteen.", fr: "J'ai onze ans. Ma sœur a quatorze ans." },
    ],
    questions: [
      { q: 'Quel âge a Mia ?', options: ['9', '11', '14'], answer: '9' },
      { q: 'How old is Léo?', options: ['11', '9', '14'], answer: '11' },
      { q: 'Quel âge a la sœur de Léo ?', options: ['14', '11', '9'], answer: '14' },
    ],
  },

  // A1 · « Les nombres et l'heure »
  'A1:10': {
    kind: 'dialogue',
    title: 'What time is it?',
    intro: 'Deux amis avant le cinéma.',
    turns: [
      { speaker: 'Amir', en: 'What time is it?', fr: 'Quelle heure est-il ?' },
      { speaker: 'Zoé', en: "It's half past eight.", fr: 'Il est huit heures et demie.' },
      { speaker: 'Amir', en: 'When does the film start?', fr: 'Quand commence le film ?' },
      { speaker: 'Zoé', en: "At nine o'clock.", fr: 'À neuf heures.' },
    ],
    questions: [
      { q: 'Quelle heure est-il ?', options: ['8h30', '9h00', '7h30'], answer: '8h30' },
      { q: 'À quelle heure commence le film ?', options: ['9h00', '8h30', '10h00'], answer: '9h00' },
      { q: 'What are they going to watch?', options: ['A film', 'A match', 'A show'], answer: 'A film' },
    ],
  },

  // A1 · « Nourriture & boissons »
  'A1:11': {
    kind: 'dialogue',
    title: 'At the café',
    intro: 'Léa commande au café. Lis le dialogue puis réponds.',
    turns: [
      { speaker: 'Waiter', en: 'Good morning! What would you like?', fr: 'Bonjour ! Que désirez-vous ?' },
      { speaker: 'Léa', en: "I'd like a coffee and a croissant, please.", fr: 'Je voudrais un café et un croissant, s’il vous plaît.' },
      { speaker: 'Waiter', en: 'Would you like some water too?', fr: 'Voulez-vous aussi de l’eau ?' },
      { speaker: 'Léa', en: 'No, thank you. Just the coffee.', fr: 'Non merci. Juste le café.' },
    ],
    questions: [
      { q: 'Que commande Léa ?', options: ['Un café et un croissant', 'Un thé', 'Un jus d’orange'], answer: 'Un café et un croissant' },
      { q: 'Veut-elle de l’eau ?', options: ['Non', 'Oui', 'Elle veut du lait'], answer: 'Non', exp: '« No, thank you. »' },
      { q: 'À qui parle Léa ?', options: ['À un serveur', 'À un ami', 'À sa mère'], answer: 'À un serveur' },
    ],
  },

  // A1 · « Le présent simple »
  'A1:12': {
    kind: 'text',
    title: "Sophie's job",
    intro: 'Un texte au présent simple.',
    text: 'Sophie works in a bakery. She starts at six o’clock every morning. She makes bread and cakes. She does not work on Sundays.',
    translation: 'Sophie travaille dans une boulangerie. Elle commence à six heures chaque matin. Elle fait du pain et des gâteaux. Elle ne travaille pas le dimanche.',
    questions: [
      { q: 'Où travaille Sophie ?', options: ['In a bakery', 'In a school', 'In a shop'], answer: 'In a bakery' },
      { q: 'À quelle heure commence-t-elle ?', options: ['At six', 'At seven', 'At eight'], answer: 'At six' },
      { q: 'Does she work on Sundays?', options: ['No', 'Yes', 'Only in the morning'], answer: 'No' },
    ],
  },

  // A1 · « Have got »
  'A1:13': {
    kind: 'dialogue',
    title: 'Have you got a pet?',
    intro: 'Deux amis parlent de leurs animaux.',
    turns: [
      { speaker: 'Kim', en: 'Have you got a pet?', fr: 'As-tu un animal ?' },
      { speaker: 'Jon', en: "Yes, I've got a dog and two cats.", fr: "Oui, j'ai un chien et deux chats." },
      { speaker: 'Kim', en: 'Has your brother got a pet too?', fr: 'Ton frère a-t-il aussi un animal ?' },
      { speaker: 'Jon', en: "No, he hasn't. But he's got a bike.", fr: 'Non. Mais il a un vélo.' },
    ],
    questions: [
      { q: 'Combien de chats a Jon ?', options: ['Two', 'One', 'Three'], answer: 'Two' },
      { q: 'Le frère a-t-il un animal ?', options: ['Non', 'Oui, un chien', 'Oui, un chat'], answer: 'Non' },
      { q: 'What has the brother got?', options: ['A bike', 'A dog', 'A car'], answer: 'A bike' },
    ],
  },

  // A1 · « Les mots interrogatifs »
  'A1:14': {
    kind: 'dialogue',
    title: 'Getting to know you',
    intro: 'Un échange plein de questions (where, why, when).',
    turns: [
      { speaker: 'Eva', en: 'Where do you live?', fr: 'Où habites-tu ?' },
      { speaker: 'Sam', en: 'I live in London.', fr: "J'habite à Londres." },
      { speaker: 'Eva', en: 'Why do you like it?', fr: 'Pourquoi aimes-tu ça ?' },
      { speaker: 'Sam', en: "Because it's exciting.", fr: 'Parce que c’est passionnant.' },
      { speaker: 'Eva', en: 'When did you move there?', fr: 'Quand as-tu déménagé là-bas ?' },
      { speaker: 'Sam', en: 'Last year.', fr: "L'année dernière." },
    ],
    questions: [
      { q: 'Où habite Sam ?', options: ['London', 'Paris', 'New York'], answer: 'London' },
      { q: 'Pourquoi aime-t-il ça ?', options: ['C’est passionnant', 'C’est calme', 'C’est petit'], answer: 'C’est passionnant' },
      { q: 'When did Sam move there?', options: ['Last year', 'Last month', 'Ten years ago'], answer: 'Last year' },
    ],
  },

  // A1 · « Can / can't »
  'A1:15': {
    kind: 'dialogue',
    title: 'What can you do?',
    intro: 'On parle de ce qu’on sait faire.',
    turns: [
      { speaker: 'Nina', en: 'Can you swim?', fr: 'Sais-tu nager ?' },
      { speaker: 'Leo', en: "Yes, I can. But I can't drive.", fr: 'Oui. Mais je ne sais pas conduire.' },
      { speaker: 'Nina', en: 'Can you speak Spanish?', fr: 'Parles-tu espagnol ?' },
      { speaker: 'Leo', en: "A little. I can understand it but I can't write it well.", fr: 'Un peu. Je le comprends mais je ne l’écris pas bien.' },
    ],
    questions: [
      { q: 'Leo sait-il nager ?', options: ['Oui', 'Non', 'Un peu'], answer: 'Oui' },
      { q: 'Can Leo drive?', options: ['No', 'Yes', 'A little'], answer: 'No' },
      { q: 'Que peut faire Leo en espagnol ?', options: ['Le comprendre', 'L’écrire parfaitement', 'Rien'], answer: 'Le comprendre' },
    ],
  },

  // A2 · « Le présent continu »
  'A2:0': {
    kind: 'dialogue',
    title: 'On the phone',
    intro: 'Un appel : que font les gens en ce moment ?',
    turns: [
      { speaker: 'Mum', en: 'Hi! What are you doing?', fr: 'Salut ! Que fais-tu ?' },
      { speaker: 'Kid', en: "I'm cooking dinner. Dad is watching TV.", fr: 'Je prépare le dîner. Papa regarde la télé.' },
      { speaker: 'Mum', en: 'Are the children sleeping?', fr: 'Les enfants dorment-ils ?' },
      { speaker: 'Kid', en: "No, they're playing in the garden.", fr: 'Non, ils jouent dans le jardin.' },
    ],
    questions: [
      { q: 'Que fait l’enfant ?', options: ['Cooking dinner', 'Watching TV', 'Sleeping'], answer: 'Cooking dinner' },
      { q: 'What is Dad doing?', options: ['Watching TV', 'Cooking', 'Playing'], answer: 'Watching TV' },
      { q: 'Où sont les enfants ?', options: ['In the garden', 'In bed', 'At school'], answer: 'In the garden' },
    ],
  },

  // A2 · « La routine quotidienne »
  'A2:1': {
    kind: 'text',
    title: "Marc's day",
    intro: 'La journée type de Marc.',
    text: 'Every day, Marc gets up at seven. He has breakfast and takes the bus to work. In the evening, he goes to the gym and cooks dinner. He usually goes to bed at eleven.',
    translation: 'Chaque jour, Marc se lève à sept heures. Il prend son petit-déjeuner et prend le bus pour aller travailler. Le soir, il va à la salle de sport et prépare le dîner. Il se couche généralement à onze heures.',
    questions: [
      { q: 'À quelle heure se lève Marc ?', options: ['At seven', 'At eight', 'At six'], answer: 'At seven' },
      { q: 'How does he go to work?', options: ['By bus', 'By car', 'On foot'], answer: 'By bus' },
      { q: 'Que fait-il le soir ?', options: ['Il va à la salle de sport', 'Il travaille', 'Il dort tôt'], answer: 'Il va à la salle de sport' },
    ],
  },

  // A2 · « Les adverbes de fréquence »
  'A2:2': {
    kind: 'dialogue',
    title: 'How often?',
    intro: 'On parle d’habitudes.',
    turns: [
      { speaker: 'Ana', en: 'Do you often go to the cinema?', fr: 'Vas-tu souvent au cinéma ?' },
      { speaker: 'Ben', en: 'Not really. I usually watch films at home. I sometimes go on weekends.', fr: 'Pas vraiment. En général je regarde des films à la maison. J’y vais parfois le week-end.' },
      { speaker: 'Ana', en: 'Do you ever read books?', fr: 'Lis-tu parfois des livres ?' },
      { speaker: 'Ben', en: 'Yes, I always read before bed.', fr: 'Oui, je lis toujours avant de dormir.' },
    ],
    questions: [
      { q: 'Ben va-t-il souvent au cinéma ?', options: ['Non, pas vraiment', 'Oui, très souvent', 'Jamais'], answer: 'Non, pas vraiment' },
      { q: 'When does Ben read?', options: ['Before bed', 'In the morning', 'Never'], answer: 'Before bed' },
      { q: 'Où regarde-t-il des films en général ?', options: ['At home', 'At the cinema', 'At work'], answer: 'At home' },
    ],
  },

  // A2 · « Les prépositions de lieu : in, on, at »
  'A2:3': {
    kind: 'text',
    title: 'Where is everything?',
    intro: 'Repère chaque objet.',
    text: "The keys are on the table. Your phone is in the drawer. We will meet at the station at six o'clock. The cat is under the bed.",
    translation: 'Les clés sont sur la table. Ton téléphone est dans le tiroir. On se retrouve à la gare à six heures. Le chat est sous le lit.',
    questions: [
      { q: 'Where are the keys?', options: ['On the table', 'In the drawer', 'Under the bed'], answer: 'On the table' },
      { q: 'Où est le téléphone ?', options: ['In the drawer', 'On the table', 'At the station'], answer: 'In the drawer' },
      { q: 'Where is the cat?', options: ['Under the bed', 'On the table', 'In the drawer'], answer: 'Under the bed' },
    ],
  },

  // A2 · « Le passé simple (réguliers) »
  'A2:4': {
    kind: 'text',
    title: 'A visit to grandma',
    intro: 'Hier, Lucy a rendu visite à sa grand-mère.',
    text: 'Yesterday, Lucy visited her grandmother. They talked for hours and watched an old film. Later, they cooked pasta and cleaned the kitchen together.',
    translation: 'Hier, Lucy a rendu visite à sa grand-mère. Elles ont parlé pendant des heures et regardé un vieux film. Plus tard, elles ont cuisiné des pâtes et nettoyé la cuisine ensemble.',
    questions: [
      { q: 'Qui Lucy a-t-elle visité ?', options: ['Her grandmother', 'Her sister', 'Her friend'], answer: 'Her grandmother' },
      { q: 'What did they watch?', options: ['An old film', 'The news', 'A match'], answer: 'An old film' },
      { q: 'Qu’ont-elles cuisiné ?', options: ['Pasta', 'Pizza', 'Soup'], answer: 'Pasta' },
    ],
  },

  // A2 · « Les verbes irréguliers »
  'A2:5': {
    kind: 'text',
    title: 'Our trip to Italy',
    intro: 'Un récit au passé, plein de verbes irréguliers.',
    text: 'Last summer, we went to Italy. We saw the Colosseum and ate a lot of pizza. I bought some gifts and took many photos. We had a wonderful time.',
    translation: "L'été dernier, nous sommes allés en Italie. Nous avons vu le Colisée et mangé beaucoup de pizza. J'ai acheté des cadeaux et pris beaucoup de photos. Nous avons passé un moment merveilleux.",
    questions: [
      { q: 'Où sont-ils allés ?', options: ['To Italy', 'To Spain', 'To France'], answer: 'To Italy' },
      { q: 'What did they see?', options: ['The Colosseum', 'The Eiffel Tower', 'Big Ben'], answer: 'The Colosseum' },
      { q: 'Qu’a acheté le narrateur ?', options: ['Some gifts', 'A car', 'Nothing'], answer: 'Some gifts' },
    ],
  },

  // A2 · « Le passé continu »
  'A2:6': {
    kind: 'text',
    title: 'When the phone rang',
    intro: 'Que se passait-il à ce moment-là ?',
    text: 'While I was reading, the phone rang. My sister was cooking and my dad was sleeping. Suddenly, someone knocked at the door.',
    translation: 'Pendant que je lisais, le téléphone a sonné. Ma sœur cuisinait et mon père dormait. Soudain, quelqu’un a frappé à la porte.',
    questions: [
      { q: 'Que faisait le narrateur quand le téléphone a sonné ?', options: ['Reading', 'Cooking', 'Sleeping'], answer: 'Reading' },
      { q: 'What was the sister doing?', options: ['Cooking', 'Reading', 'Sleeping'], answer: 'Cooking' },
      { q: 'Qui dormait ?', options: ['Dad', 'The sister', 'The narrator'], answer: 'Dad' },
    ],
  },

  // A2 · « Le futur "going to" »
  'A2:7': {
    kind: 'dialogue',
    title: 'Weekend plans',
    intro: 'Des projets pour le week-end.',
    turns: [
      { speaker: 'Kai', en: 'What are you going to do this weekend?', fr: 'Que vas-tu faire ce week-end ?' },
      { speaker: 'Mia', en: "I'm going to visit my cousins. We're going to have a barbecue.", fr: 'Je vais rendre visite à mes cousins. On va faire un barbecue.' },
      { speaker: 'Kai', en: 'Is it going to rain?', fr: 'Va-t-il pleuvoir ?' },
      { speaker: 'Mia', en: 'No, the weather is going to be sunny.', fr: 'Non, il va faire beau.' },
    ],
    questions: [
      { q: 'Que va faire Mia ce week-end ?', options: ['Visiter ses cousins', 'Travailler', 'Rester chez elle'], answer: 'Visiter ses cousins' },
      { q: 'What are they going to do?', options: ['Have a barbecue', 'Go shopping', 'Watch a film'], answer: 'Have a barbecue' },
      { q: 'Quel temps va-t-il faire ?', options: ['Sunny', 'Rainy', 'Cold'], answer: 'Sunny' },
    ],
  },

  // A2 · « Voyages & transports »
  'A2:8': {
    kind: 'dialogue',
    title: 'At the station',
    intro: 'Un voyageur achète un billet.',
    turns: [
      { speaker: 'Traveller', en: 'Excuse me, when is the next train to Lyon?', fr: 'Excusez-moi, quand part le prochain train pour Lyon ?' },
      { speaker: 'Clerk', en: 'At 10:15, from platform 4.', fr: 'À 10h15, quai 4.' },
      { speaker: 'Traveller', en: 'How much is a return ticket?', fr: 'Combien coûte un aller-retour ?' },
      { speaker: 'Clerk', en: 'Thirty euros.', fr: 'Trente euros.' },
    ],
    questions: [
      { q: 'À quelle heure part le train ?', options: ['10h15', '10h50', '11h15'], answer: '10h15' },
      { q: 'From which platform?', options: ['Platform 4', 'Platform 2', 'Platform 6'], answer: 'Platform 4' },
      { q: 'Prix d’un aller-retour ?', options: ['30 euros', '13 euros', '40 euros'], answer: '30 euros' },
    ],
  },

  // A2 · « La météo & les saisons »
  'A2:9': {
    kind: 'text',
    title: 'The four seasons',
    intro: 'Le temps au fil des saisons.',
    text: 'In winter, it is cold and it often snows in the mountains. Spring is mild and rainy. In summer, the weather is hot and sunny. Autumn is windy and the leaves fall.',
    translation: 'En hiver, il fait froid et il neige souvent en montagne. Le printemps est doux et pluvieux. En été, il fait chaud et ensoleillé. L’automne est venteux et les feuilles tombent.',
    questions: [
      { q: 'Comment est le temps en été ?', options: ['Hot and sunny', 'Cold', 'Rainy'], answer: 'Hot and sunny' },
      { q: 'What often happens in the mountains in winter?', options: ['It snows', 'It rains', 'It is hot'], answer: 'It snows' },
      { q: 'Comment est l’automne ?', options: ['Windy', 'Hot', 'Snowy'], answer: 'Windy' },
    ],
  },

  // A2 · « Au restaurant »
  'A2:10': {
    kind: 'dialogue',
    title: 'Ordering dinner',
    intro: 'Sam commande au restaurant.',
    turns: [
      { speaker: 'Waiter', en: 'Are you ready to order?', fr: 'Êtes-vous prêt à commander ?' },
      { speaker: 'Sam', en: "Yes. I'll have the grilled chicken with rice.", fr: 'Oui. Je prendrai le poulet grillé avec du riz.' },
      { speaker: 'Waiter', en: 'And to drink?', fr: 'Et comme boisson ?' },
      { speaker: 'Sam', en: 'A glass of orange juice, please.', fr: 'Un verre de jus d’orange, s’il vous plaît.' },
      { speaker: 'Waiter', en: 'Would you like a dessert?', fr: 'Voulez-vous un dessert ?' },
      { speaker: 'Sam', en: 'Maybe later, thank you.', fr: 'Peut-être plus tard, merci.' },
    ],
    questions: [
      { q: 'Que commande Sam à manger ?', options: ['Grilled chicken with rice', 'A pizza', 'A salad'], answer: 'Grilled chicken with rice' },
      { q: 'Que boit-il ?', options: ['Orange juice', 'Water', 'Coffee'], answer: 'Orange juice' },
      { q: 'Prend-il un dessert tout de suite ?', options: ['Non, peut-être plus tard', 'Oui', 'Il ne veut rien'], answer: 'Non, peut-être plus tard' },
    ],
  },

  // A2 · « La ville et les directions »
  'A2:11': {
    kind: 'dialogue',
    title: 'Finding the museum',
    intro: 'Un touriste demande son chemin.',
    turns: [
      { speaker: 'Tourist', en: 'Excuse me, how do I get to the museum?', fr: 'Excusez-moi, comment aller au musée ?' },
      { speaker: 'Local', en: "Go straight ahead, then turn left at the bank. It's next to the park.", fr: 'Allez tout droit, puis tournez à gauche à la banque. C’est à côté du parc.' },
      { speaker: 'Tourist', en: 'Is it far?', fr: 'C’est loin ?' },
      { speaker: 'Local', en: 'No, about five minutes on foot.', fr: 'Non, environ cinq minutes à pied.' },
    ],
    questions: [
      { q: 'Où faut-il tourner à gauche ?', options: ['À la banque', 'Au parc', 'Au musée'], answer: 'À la banque' },
      { q: 'What is next to the museum?', options: ['The park', 'The bank', 'The station'], answer: 'The park' },
      { q: 'C’est à combien de minutes à pied ?', options: ['About five', 'About fifteen', 'About fifty'], answer: 'About five' },
    ],
  },

  // A2 · « Les comparatifs »
  'A2:12': {
    kind: 'text',
    title: 'My new phone',
    intro: 'Comparaison entre deux téléphones.',
    text: 'My new phone is faster than my old one. It is also more expensive, but the battery is better. However, it is bigger and heavier, so it is less comfortable in my pocket.',
    translation: 'Mon nouveau téléphone est plus rapide que l’ancien. Il est aussi plus cher, mais la batterie est meilleure. Cependant, il est plus grand et plus lourd, donc moins confortable dans ma poche.',
    questions: [
      { q: 'Le nouveau téléphone est-il plus rapide ?', options: ['Oui', 'Non', 'Aussi rapide'], answer: 'Oui' },
      { q: 'What is better?', options: ['The battery', 'The price', 'The size'], answer: 'The battery' },
      { q: 'Pourquoi est-il moins confortable ?', options: ['Il est plus grand et lourd', 'Il est plus petit', 'Il est moins cher'], answer: 'Il est plus grand et lourd' },
    ],
  },

  // A2 · « La maison »
  'A2:13': {
    kind: 'text',
    title: 'Our house',
    intro: 'Description d’une maison.',
    text: 'Our house has three bedrooms and a big kitchen. There is a small garden behind the house. My favourite room is the living room because it is bright and cosy.',
    translation: 'Notre maison a trois chambres et une grande cuisine. Il y a un petit jardin derrière la maison. Ma pièce préférée est le salon car il est lumineux et douillet.',
    questions: [
      { q: 'Combien de chambres ?', options: ['Three', 'Two', 'Four'], answer: 'Three' },
      { q: 'Where is the garden?', options: ['Behind the house', 'In front', 'On the roof'], answer: 'Behind the house' },
      { q: 'Quelle est la pièce préférée ?', options: ['The living room', 'The kitchen', 'The bedroom'], answer: 'The living room' },
    ],
  },

  // A2 · « There is / There are »
  'A2:14': {
    kind: 'text',
    title: 'My town',
    intro: 'Ce qu’il y a (et ce qu’il n’y a pas) dans la ville.',
    text: "There is a supermarket near my house. There are two schools and a hospital in my town. There isn't a cinema, but there is a nice library.",
    translation: 'Il y a un supermarché près de chez moi. Il y a deux écoles et un hôpital dans ma ville. Il n’y a pas de cinéma, mais il y a une belle bibliothèque.',
    questions: [
      { q: 'Y a-t-il un cinéma ?', options: ['Non', 'Oui', 'Deux cinémas'], answer: 'Non' },
      { q: 'How many schools are there?', options: ['Two', 'One', 'Three'], answer: 'Two' },
      { q: 'Qu’y a-t-il près de la maison ?', options: ['A supermarket', 'A cinema', 'A beach'], answer: 'A supermarket' },
    ],
  },

  // A2 · « Quantité : some, any, much, many »
  'A2:15': {
    kind: 'dialogue',
    title: 'In the kitchen',
    intro: 'On vérifie ce qu’il reste.',
    turns: [
      { speaker: 'Sam', en: 'Is there any milk?', fr: 'Y a-t-il du lait ?' },
      { speaker: 'Joy', en: "Yes, there is some milk, but there isn't any sugar.", fr: 'Oui, il y a du lait, mais il n’y a pas de sucre.' },
      { speaker: 'Sam', en: 'How many eggs do we have?', fr: 'Combien d’œufs avons-nous ?' },
      { speaker: 'Joy', en: 'We have six eggs, but not much butter.', fr: 'On a six œufs, mais pas beaucoup de beurre.' },
    ],
    questions: [
      { q: 'Y a-t-il du sucre ?', options: ['Non', 'Oui', 'Beaucoup'], answer: 'Non' },
      { q: 'How many eggs are there?', options: ['Six', 'Two', 'Ten'], answer: 'Six' },
      { q: 'Y a-t-il beaucoup de beurre ?', options: ['Non', 'Oui', 'Énormément'], answer: 'Non' },
    ],
  },

  // B1 · « Le present perfect »
  'B1:0': {
    kind: 'text',
    title: 'A young writer',
    intro: 'Lis puis réponds (present perfect).',
    text: "Sarah has just finished her first novel. She has written three books so far, but this is her best one. She hasn't found a publisher yet, but she has already received good feedback from readers.",
    translation: "Sarah vient de terminer son premier roman. Elle a écrit trois livres jusqu'ici, mais c'est son meilleur. Elle n'a pas encore trouvé d'éditeur, mais elle a déjà reçu de bons retours de lecteurs.",
    questions: [
      { q: 'How many books has Sarah written?', options: ['Three', 'One', 'Five'], answer: 'Three' },
      { q: 'A-t-elle trouvé un éditeur ?', options: ['Pas encore', 'Oui', 'Elle n’en cherche pas'], answer: 'Pas encore' },
      { q: 'What has she received?', options: ['Good feedback', 'A prize', 'Money'], answer: 'Good feedback' },
    ],
  },

  // B1 · « Present perfect vs prétérit »
  'B1:1': {
    kind: 'text',
    title: 'Living abroad',
    intro: 'Attention aux temps du passé.',
    text: 'I have lived in Paris for ten years. I moved here in 2014 after I finished university. Last year, I visited Rome for the first time, and I have wanted to go back ever since.',
    translation: "Je vis à Paris depuis dix ans. J'ai déménagé ici en 2014 après avoir fini l'université. L'an dernier, j'ai visité Rome pour la première fois, et j'ai envie d'y retourner depuis.",
    questions: [
      { q: 'Depuis combien de temps vit-il à Paris ?', options: ['Ten years', 'Two years', 'Since 2020'], answer: 'Ten years' },
      { q: 'When did he move to Paris?', options: ['In 2014', 'In 2004', 'Last year'], answer: 'In 2014' },
      { q: 'Qu’a-t-il visité l’an dernier ?', options: ['Rome', 'Paris', 'London'], answer: 'Rome' },
    ],
  },

  // B1 · « for, since, already, yet, just »
  'B1:2': {
    kind: 'dialogue',
    title: 'The report',
    intro: 'Au bureau, à propos d’un rapport.',
    turns: [
      { speaker: 'Boss', en: 'Have you finished the report yet?', fr: 'As-tu déjà fini le rapport ?' },
      { speaker: 'Alex', en: "Not yet, but I've just started the last part.", fr: 'Pas encore, mais je viens de commencer la dernière partie.' },
      { speaker: 'Boss', en: 'How long have you worked on it?', fr: 'Depuis combien de temps travailles-tu dessus ?' },
      { speaker: 'Alex', en: "Since Monday. I've already spent hours on it.", fr: 'Depuis lundi. J’y ai déjà passé des heures.' },
    ],
    questions: [
      { q: 'Alex a-t-il fini le rapport ?', options: ['Pas encore', 'Oui', 'Il n’a pas commencé'], answer: 'Pas encore' },
      { q: 'Since when has Alex worked on it?', options: ['Since Monday', 'Since Friday', 'For a year'], answer: 'Since Monday' },
      { q: 'Que vient de faire Alex ?', options: ['Commencer la dernière partie', 'Finir', 'Envoyer le rapport'], answer: 'Commencer la dernière partie' },
    ],
  },

  // B1 · « Le travail & les métiers »
  'B1:3': {
    kind: 'dialogue',
    title: 'Talking about work',
    intro: 'Maya parle de son métier.',
    turns: [
      { speaker: 'Léo', en: 'So, what do you do for a living?', fr: 'Alors, que fais-tu dans la vie ?' },
      { speaker: 'Maya', en: 'I work as a nurse in a big hospital.', fr: 'Je travaille comme infirmière dans un grand hôpital.' },
      { speaker: 'Léo', en: 'How long have you worked there?', fr: 'Depuis combien de temps y travailles-tu ?' },
      { speaker: 'Maya', en: "I've worked there for five years.", fr: 'J’y travaille depuis cinq ans.' },
      { speaker: 'Léo', en: 'What do you like about your job?', fr: 'Qu’aimes-tu dans ton travail ?' },
      { speaker: 'Maya', en: 'I like helping people every day.', fr: 'J’aime aider les gens chaque jour.' },
    ],
    questions: [
      { q: 'Quel est le métier de Maya ?', options: ['Nurse', 'Doctor', 'Teacher'], answer: 'Nurse' },
      { q: 'Depuis combien de temps travaille-t-elle à l’hôpital ?', options: ['Five years', 'Two years', 'Ten years'], answer: 'Five years' },
      { q: 'Qu’aime-t-elle dans son travail ?', options: ['Aider les gens', 'Le salaire', 'Les horaires'], answer: 'Aider les gens' },
    ],
  },

  // B1 · « Le futur "will" »
  'B1:4': {
    kind: 'dialogue',
    title: 'Weather predictions',
    intro: 'Des prédictions avec « will ».',
    turns: [
      { speaker: 'Rob', en: 'Do you think it will rain tomorrow?', fr: 'Penses-tu qu’il pleuvra demain ?' },
      { speaker: 'Ivy', en: "Maybe. If it does, we'll stay home.", fr: 'Peut-être. Si oui, on restera à la maison.' },
      { speaker: 'Rob', en: 'I’m sure the weekend will be sunny.', fr: 'Je suis sûr que le week-end sera ensoleillé.' },
      { speaker: 'Ivy', en: "I hope so. I'll book a table for lunch.", fr: 'Je l’espère. Je réserverai une table pour le déjeuner.' },
    ],
    questions: [
      { q: 'Que feront-ils s’il pleut ?', options: ['Rester à la maison', 'Sortir', 'Aller à la plage'], answer: 'Rester à la maison' },
      { q: 'What will Ivy book?', options: ['A table for lunch', 'A hotel', 'A flight'], answer: 'A table for lunch' },
      { q: 'Comment sera le week-end d’après Rob ?', options: ['Sunny', 'Rainy', 'Cold'], answer: 'Sunny' },
    ],
  },

  // B1 · « Le premier conditionnel »
  'B1:5': {
    kind: 'text',
    title: 'If...',
    intro: 'Des phrases au premier conditionnel.',
    text: "If you study hard, you will pass the exam. If it rains, the match will be cancelled. We won't go on holiday unless we save enough money.",
    translation: "Si tu travailles dur, tu réussiras l'examen. S'il pleut, le match sera annulé. Nous ne partirons pas en vacances à moins d'économiser assez d'argent.",
    questions: [
      { q: 'Que se passera-t-il si tu étudies dur ?', options: ['Tu réussiras l’examen', 'Tu échoueras', 'Rien'], answer: 'Tu réussiras l’examen' },
      { q: 'What happens to the match if it rains?', options: ['It will be cancelled', 'It will start early', 'Nothing'], answer: 'It will be cancelled' },
      { q: 'Quelle condition pour partir en vacances ?', options: ['Économiser assez d’argent', 'Le beau temps', 'Aucune'], answer: 'Économiser assez d’argent' },
    ],
  },

  // B1 · « La technologie »
  'B1:6': {
    kind: 'text',
    title: 'Life with smartphones',
    intro: 'Un texte sur la technologie.',
    text: 'Smartphones have changed the way we live. We use them to work, to shop and to stay in touch. However, many people spend too much time online and feel tired. Experts recommend taking regular breaks from screens.',
    translation: 'Les smartphones ont changé notre façon de vivre. On les utilise pour travailler, faire des achats et rester en contact. Cependant, beaucoup de gens passent trop de temps en ligne et se sentent fatigués. Les experts recommandent de faire des pauses régulières loin des écrans.',
    questions: [
      { q: 'À quoi servent les smartphones d’après le texte ?', options: ['Travailler, acheter et rester en contact', 'Uniquement jouer', 'Rien d’utile'], answer: 'Travailler, acheter et rester en contact' },
      { q: 'What problem is mentioned?', options: ['People spend too much time online', 'Phones are too cheap', 'There is no internet'], answer: 'People spend too much time online' },
      { q: 'Que recommandent les experts ?', options: ['Faire des pauses d’écran régulières', 'Acheter plus de téléphones', 'Ne jamais s’arrêter'], answer: 'Faire des pauses d’écran régulières' },
    ],
  },

  // B1 · « Le superlatif »
  'B1:7': {
    kind: 'text',
    title: 'Records of nature',
    intro: 'Des superlatifs sur la nature.',
    text: 'The Nile is the longest river in the world. Everest is the highest mountain, and the Pacific is the largest ocean. Some say the cheetah is the fastest animal on land.',
    translation: 'Le Nil est le plus long fleuve du monde. L’Everest est la plus haute montagne, et le Pacifique est le plus grand océan. Certains disent que le guépard est l’animal terrestre le plus rapide.',
    questions: [
      { q: 'Quel est le plus long fleuve ?', options: ['The Nile', 'The Amazon', 'The Thames'], answer: 'The Nile' },
      { q: 'What is the highest mountain?', options: ['Everest', 'Mont Blanc', 'K2'], answer: 'Everest' },
      { q: 'Quel est l’animal terrestre le plus rapide ?', options: ['The cheetah', 'The lion', 'The horse'], answer: 'The cheetah' },
    ],
  },

  // B1 · « Les pronoms relatifs »
  'B1:8': {
    kind: 'text',
    title: 'People and places',
    intro: 'Repère les pronoms relatifs (who, that, where).',
    text: 'The woman who lives next door is a doctor. The book that I lent you is very old. This is the town where I grew up.',
    translation: 'La femme qui habite à côté est médecin. Le livre que je t’ai prêté est très vieux. Voici la ville où j’ai grandi.',
    questions: [
      { q: 'Qui est la voisine ?', options: ['A doctor', 'A teacher', 'A nurse'], answer: 'A doctor' },
      { q: 'What is old?', options: ['The book', 'The town', 'The woman'], answer: 'The book' },
      { q: 'Que représente cette ville ?', options: ['Là où il a grandi', 'Où il travaille', 'Où il est né hier'], answer: 'Là où il a grandi' },
    ],
  },

  // B1 · « Le passif (présent) »
  'B1:9': {
    kind: 'text',
    title: 'How things are made',
    intro: 'Des phrases au passif.',
    text: 'Millions of cars are produced every year. The factory is cleaned every night, and the products are checked carefully. English is spoken in many countries around the world.',
    translation: 'Des millions de voitures sont produites chaque année. L’usine est nettoyée chaque nuit, et les produits sont contrôlés avec soin. L’anglais est parlé dans de nombreux pays du monde.',
    questions: [
      { q: 'Combien de voitures sont produites chaque année ?', options: ['Des millions', 'Des centaines', 'Aucune'], answer: 'Des millions' },
      { q: 'When is the factory cleaned?', options: ['Every night', 'Every week', 'Never'], answer: 'Every night' },
      { q: 'Where is English spoken?', options: ['In many countries', 'Only in England', 'Nowhere'], answer: 'In many countries' },
    ],
  },

  // B1 · « Émotions & sentiments »
  'B1:10': {
    kind: 'dialogue',
    title: 'Before the interview',
    intro: 'Un ami rassure l’autre.',
    turns: [
      { speaker: 'Max', en: "You look worried. What's wrong?", fr: 'Tu as l’air inquiet. Qu’est-ce qui ne va pas ?' },
      { speaker: 'Tom', en: "I'm nervous about my job interview tomorrow.", fr: 'Je suis stressé pour mon entretien d’embauche demain.' },
      { speaker: 'Max', en: "Don't worry, you'll be great. Are you excited too?", fr: 'Ne t’inquiète pas, tu seras super. Es-tu aussi impatient ?' },
      { speaker: 'Tom', en: "Yes, a bit. It's a great opportunity.", fr: 'Oui, un peu. C’est une belle opportunité.' },
    ],
    questions: [
      { q: 'Pourquoi Tom est-il stressé ?', options: ['À cause d’un entretien d’embauche', 'D’un examen', 'D’un voyage'], answer: 'À cause d’un entretien d’embauche' },
      { q: 'When is the interview?', options: ['Tomorrow', 'Today', 'Next week'], answer: 'Tomorrow' },
      { q: 'Tom est-il aussi impatient ?', options: ['Oui, un peu', 'Non, pas du tout', 'Il est triste'], answer: 'Oui, un peu' },
    ],
  },

  // B1 · « Les modaux : can, must, should »
  'B1:11': {
    kind: 'dialogue',
    title: 'A headache',
    intro: 'Des conseils avec les modaux.',
    turns: [
      { speaker: 'Lea', en: 'I have a terrible headache.', fr: 'J’ai un mal de tête terrible.' },
      { speaker: 'Sam', en: 'You should drink water and rest. You must see a doctor if it continues.', fr: 'Tu devrais boire de l’eau et te reposer. Tu dois voir un médecin si ça continue.' },
      { speaker: 'Lea', en: 'Can I take a painkiller?', fr: 'Puis-je prendre un antidouleur ?' },
      { speaker: 'Sam', en: "Yes, but you shouldn't take too many.", fr: 'Oui, mais tu ne devrais pas en prendre trop.' },
    ],
    questions: [
      { q: 'Que devrait faire Lea ?', options: ['Boire de l’eau et se reposer', 'Courir', 'Travailler plus'], answer: 'Boire de l’eau et se reposer' },
      { q: 'What must Lea do if it continues?', options: ['See a doctor', 'Nothing', 'Sleep all day'], answer: 'See a doctor' },
      { q: 'Peut-elle prendre beaucoup d’antidouleurs ?', options: ['Non', 'Oui, autant qu’elle veut', 'Jamais'], answer: 'Non' },
    ],
  },

  // B1 · « Would, used to et les habitudes passées »
  'B1:12': {
    kind: 'text',
    title: 'Childhood memories',
    intro: 'Des habitudes du passé (used to / would).',
    text: "When I was a child, I used to live in the countryside. Every summer, we would swim in the river and climb trees. I didn't use to like vegetables, but now I love them.",
    translation: "Quand j'étais enfant, je vivais à la campagne. Chaque été, on nageait dans la rivière et on grimpait aux arbres. Je n'aimais pas les légumes, mais maintenant je les adore.",
    questions: [
      { q: 'Où vivait-il enfant ?', options: ['In the countryside', 'In a city', 'By the sea'], answer: 'In the countryside' },
      { q: 'What did they do every summer?', options: ['Swim in the river', 'Go to school', 'Travel abroad'], answer: 'Swim in the river' },
      { q: 'Aimait-il les légumes avant ?', options: ['Non', 'Oui, beaucoup', 'Il ne le dit pas'], answer: 'Non' },
    ],
  },

  // B1 · « Les verbes à particule courants »
  'B1:13': {
    kind: 'dialogue',
    title: 'Giving up coffee',
    intro: 'Des phrasal verbs dans la conversation.',
    turns: [
      { speaker: 'Joy', en: "I'm looking forward to the weekend.", fr: 'J’ai hâte d’être au week-end.' },
      { speaker: 'Dan', en: 'Me too. But I need to give up coffee; it keeps me awake.', fr: 'Moi aussi. Mais je dois arrêter le café ; ça m’empêche de dormir.' },
      { speaker: 'Joy', en: "Don't give up! Just cut down a little.", fr: 'N’abandonne pas ! Réduis juste un peu.' },
    ],
    questions: [
      { q: 'Que veut arrêter Dan ?', options: ['Le café', 'Le sport', 'Le travail'], answer: 'Le café' },
      { q: 'Why?', options: ['It keeps him awake', "It's expensive", 'He hates it'], answer: 'It keeps him awake' },
      { q: 'Que conseille Joy ?', options: ['Réduire un peu', 'Tout arrêter', 'Boire plus'], answer: 'Réduire un peu' },
    ],
  },

  // B1 · « La santé & le corps »
  'B1:14': {
    kind: 'dialogue',
    title: 'At the doctor',
    intro: 'Une consultation médicale.',
    turns: [
      { speaker: 'Doctor', en: 'What seems to be the problem?', fr: 'Quel est le problème ?' },
      { speaker: 'Patient', en: 'I have a sore throat and a high fever.', fr: 'J’ai mal à la gorge et beaucoup de fièvre.' },
      { speaker: 'Doctor', en: 'How long have you had these symptoms?', fr: 'Depuis combien de temps avez-vous ces symptômes ?' },
      { speaker: 'Patient', en: 'For three days.', fr: 'Depuis trois jours.' },
      { speaker: 'Doctor', en: 'You have the flu. Stay in bed and drink plenty of fluids.', fr: 'Vous avez la grippe. Restez au lit et buvez beaucoup.' },
    ],
    questions: [
      { q: 'Quels sont les symptômes ?', options: ['Mal de gorge et fièvre', 'Mal de dos', 'Mal aux yeux'], answer: 'Mal de gorge et fièvre' },
      { q: 'How long has the patient had them?', options: ['For three days', 'For a week', 'Since morning'], answer: 'For three days' },
      { q: 'Quel est le diagnostic ?', options: ['The flu', 'A cold', 'Nothing serious'], answer: 'The flu' },
    ],
  },

  // B1 · « Le voyage & les vacances »
  'B1:15': {
    kind: 'text',
    title: 'A week in Spain',
    intro: 'Un récit de vacances.',
    text: 'Last month, we spent a week in Spain. We stayed in a small hotel near the beach. During the day, we explored old towns, and in the evening we tried delicious local food. It was the best holiday we have ever had.',
    translation: 'Le mois dernier, nous avons passé une semaine en Espagne. Nous avons logé dans un petit hôtel près de la plage. La journée, nous explorions de vieilles villes, et le soir nous goûtions de délicieux plats locaux. Ce sont les meilleures vacances que nous ayons jamais eues.',
    questions: [
      { q: 'Où sont-ils allés le mois dernier ?', options: ['In Spain', 'In Italy', 'In Greece'], answer: 'In Spain' },
      { q: 'Where did they stay?', options: ['In a small hotel near the beach', 'In a big city hotel', 'With friends'], answer: 'In a small hotel near the beach' },
      { q: 'Que faisaient-ils le soir ?', options: ['Ils goûtaient la cuisine locale', 'Ils dormaient tôt', 'Ils travaillaient'], answer: 'Ils goûtaient la cuisine locale' },
    ],
  },

  // B2 · « Le deuxième conditionnel »
  'B2:0': {
    kind: 'text',
    title: 'What if?',
    intro: 'Des hypothèses au deuxième conditionnel.',
    text: 'If I had more free time, I would learn to play the piano. If she were the manager, she would change the whole strategy. What would you do if you won the lottery?',
    translation: 'Si j’avais plus de temps libre, j’apprendrais à jouer du piano. Si elle était la manager, elle changerait toute la stratégie. Que ferais-tu si tu gagnais à la loterie ?',
    questions: [
      { q: 'Que ferait le narrateur avec plus de temps libre ?', options: ['Apprendre le piano', 'Voyager', 'Dormir'], answer: 'Apprendre le piano' },
      { q: 'What would she change if she were the manager?', options: ['The whole strategy', 'Nothing', 'The office'], answer: 'The whole strategy' },
      { q: 'La dernière phrase parle de…', options: ['Gagner à la loterie', 'Perdre un emploi', 'Acheter une maison'], answer: 'Gagner à la loterie' },
    ],
  },

  // B2 · « wish & if only »
  'B2:1': {
    kind: 'text',
    title: 'Regrets',
    intro: 'Des regrets et des souhaits.',
    text: "I wish I had studied harder at school. If only it weren't raining, we could go for a walk. She wishes she could speak Japanese fluently.",
    translation: 'Je regrette de ne pas avoir travaillé plus dur à l’école. Si seulement il ne pleuvait pas, on pourrait se promener. Elle aimerait pouvoir parler japonais couramment.',
    questions: [
      { q: 'What does the narrator regret?', options: ['Not studying harder', 'Studying too much', 'Nothing'], answer: 'Not studying harder' },
      { q: 'Pourquoi ne peuvent-ils pas se promener ?', options: ['Il pleut', 'Il fait nuit', 'Ils sont fatigués'], answer: 'Il pleut' },
      { q: 'What does she wish she could do?', options: ['Speak Japanese fluently', 'Travel more', 'Sing'], answer: 'Speak Japanese fluently' },
    ],
  },

  // B2 · « Les modaux de déduction »
  'B2:2': {
    kind: 'dialogue',
    title: 'Whose umbrella?',
    intro: 'On déduit à qui appartient un objet.',
    turns: [
      { speaker: 'Amy', en: 'Whose umbrella is this?', fr: 'À qui est ce parapluie ?' },
      { speaker: 'Ben', en: "It must be Sarah's; she was here earlier.", fr: 'Ça doit être celui de Sarah ; elle était là plus tôt.' },
      { speaker: 'Amy', en: "It can't be hers, she has a red one.", fr: 'Ça ne peut pas être le sien, elle en a un rouge.' },
      { speaker: 'Ben', en: 'Then it might belong to the new intern.', fr: 'Alors il appartient peut-être au nouveau stagiaire.' },
    ],
    questions: [
      { q: 'Why does Ben first think it’s Sarah’s?', options: ['She was here earlier', 'It is red', 'She said so'], answer: 'She was here earlier' },
      { q: 'Pourquoi ça ne peut pas être celui de Sarah ?', options: ['Le sien est rouge', 'Elle est partie', 'Elle n’en a pas'], answer: 'Le sien est rouge' },
      { q: 'Whose might it be?', options: ["The new intern's", "The boss's", "Nobody's"], answer: "The new intern's" },
    ],
  },

  // B2 · « Le present perfect continu »
  'B2:3': {
    kind: 'text',
    title: 'Ongoing efforts',
    intro: 'Des actions qui durent (present perfect continu).',
    text: "She has been working on this project for six months. They have been arguing all morning, and everyone is tired. I've been learning Spanish, but I still can't hold a conversation.",
    translation: "Elle travaille sur ce projet depuis six mois. Ils se disputent depuis ce matin, et tout le monde est fatigué. J'apprends l'espagnol, mais je ne peux toujours pas tenir une conversation.",
    questions: [
      { q: 'Depuis combien de temps travaille-t-elle sur le projet ?', options: ['Six months', 'Six weeks', 'A year'], answer: 'Six months' },
      { q: 'Why is everyone tired?', options: ['They have been arguing all morning', 'They worked all night', 'It is hot'], answer: 'They have been arguing all morning' },
      { q: 'Can the narrator hold a conversation in Spanish?', options: ['Not yet', 'Yes, fluently', 'He never tried'], answer: 'Not yet' },
    ],
  },

  // B2 · « Le past perfect et les temps du récit »
  'B2:4': {
    kind: 'text',
    title: 'Missed flight',
    intro: 'Un récit au passé (past perfect).',
    text: 'By the time we arrived at the airport, the plane had already left. We had forgotten to check the departure time. Luckily, we found another flight that evening.',
    translation: 'Quand nous sommes arrivés à l’aéroport, l’avion était déjà parti. Nous avions oublié de vérifier l’heure de départ. Heureusement, nous avons trouvé un autre vol ce soir-là.',
    questions: [
      { q: 'What had happened when they arrived?', options: ['The plane had left', 'The plane was late', 'The airport was closed'], answer: 'The plane had left' },
      { q: 'Pourquoi ont-ils raté l’avion ?', options: ['Ils avaient oublié de vérifier l’heure', 'Ils s’étaient perdus', 'Le train était en retard'], answer: 'Ils avaient oublié de vérifier l’heure' },
      { q: 'What did they find?', options: ['Another flight that evening', 'A hotel', 'Nothing'], answer: 'Another flight that evening' },
    ],
  },

  // B2 · « Le discours rapporté »
  'B2:5': {
    kind: 'text',
    title: 'Reported words',
    intro: 'Du discours rapporté.',
    text: 'Tom said he was tired and asked if we could leave early. Maria told me she had finished the report. The manager announced that the meeting would be postponed.',
    translation: 'Tom a dit qu’il était fatigué et a demandé si nous pouvions partir tôt. Maria m’a dit qu’elle avait fini le rapport. Le manager a annoncé que la réunion serait reportée.',
    questions: [
      { q: 'What did Tom ask?', options: ['If they could leave early', 'To stay late', 'For a coffee'], answer: 'If they could leave early' },
      { q: 'Qu’a dit Maria ?', options: ['Qu’elle avait fini le rapport', 'Qu’elle allait partir', 'Rien'], answer: 'Qu’elle avait fini le rapport' },
      { q: 'What did the manager announce?', options: ['The meeting would be postponed', 'A pay rise', 'A new hire'], answer: 'The meeting would be postponed' },
    ],
  },

  // B2 · « Le passif (tous les temps) »
  'B2:6': {
    kind: 'text',
    title: 'Around the city',
    intro: 'Le passif à différents temps.',
    text: 'The bridge was built in 1890. A new library is being constructed downtown. The results will be announced next week, and by then all the tests will have been completed.',
    translation: 'Le pont a été construit en 1890. Une nouvelle bibliothèque est en cours de construction au centre-ville. Les résultats seront annoncés la semaine prochaine, et d’ici là tous les tests auront été terminés.',
    questions: [
      { q: 'When was the bridge built?', options: ['In 1890', 'In 1990', 'Last year'], answer: 'In 1890' },
      { q: 'Qu’est-ce qui est en construction ?', options: ['Une nouvelle bibliothèque', 'Un pont', 'Une école'], answer: 'Une nouvelle bibliothèque' },
      { q: 'When will the results be announced?', options: ['Next week', 'Today', 'Never'], answer: 'Next week' },
    ],
  },

  // B2 · « Gérondif & infinitif »
  'B2:7': {
    kind: 'text',
    title: 'Habits and plans',
    intro: 'Gérondif ou infinitif ?',
    text: 'I enjoy reading before bed, but I need to sleep more. She stopped smoking last year and decided to start running. Remember to lock the door before leaving.',
    translation: "J'aime lire avant de dormir, mais j'ai besoin de dormir plus. Elle a arrêté de fumer l'an dernier et a décidé de se mettre à la course. N'oublie pas de fermer la porte à clé avant de partir.",
    questions: [
      { q: 'What does the narrator enjoy?', options: ['Reading before bed', 'Running', 'Smoking'], answer: 'Reading before bed' },
      { q: 'Qu’a-t-elle arrêté ?', options: ['De fumer', 'De courir', 'De lire'], answer: 'De fumer' },
      { q: 'What should you remember?', options: ['To lock the door', 'To open the window', 'To call'], answer: 'To lock the door' },
    ],
  },

  // B2 · « Les propositions relatives »
  'B2:8': {
    kind: 'text',
    title: 'People and things',
    intro: 'Des relatives (who, which, whose).',
    text: 'My brother, who lives in Berlin, is visiting next week. The car, which was very expensive, broke down after a month. Students whose grades are excellent will receive a scholarship.',
    translation: 'Mon frère, qui vit à Berlin, vient nous voir la semaine prochaine. La voiture, qui était très chère, est tombée en panne après un mois. Les étudiants dont les notes sont excellentes recevront une bourse.',
    questions: [
      { q: 'Where does the brother live?', options: ['In Berlin', 'In Munich', 'In Paris'], answer: 'In Berlin' },
      { q: 'Qu’est-il arrivé à la voiture ?', options: ['Elle est tombée en panne', 'Elle a été volée', 'Rien'], answer: 'Elle est tombée en panne' },
      { q: 'Who will get a scholarship?', options: ['Students whose grades are excellent', 'All students', 'Nobody'], answer: 'Students whose grades are excellent' },
    ],
  },

  // B2 · « so, such, enough, too »
  'B2:9': {
    kind: 'dialogue',
    title: 'A bad café',
    intro: 'so / such / enough / too en contexte.',
    turns: [
      { speaker: 'Ada', en: 'This coffee is too hot to drink.', fr: 'Ce café est trop chaud pour être bu.' },
      { speaker: 'Ben', en: "And it's so bitter! It was such a bad idea to come here.", fr: 'Et il est si amer ! C’était une si mauvaise idée de venir ici.' },
      { speaker: 'Ada', en: "We don't have enough time to find another café.", fr: 'On n’a pas assez de temps pour trouver un autre café.' },
    ],
    questions: [
      { q: 'Why can’t Ada drink the coffee?', options: ['It is too hot', 'It is cold', 'It is empty'], answer: 'It is too hot' },
      { q: 'Comment est le café d’après Ben ?', options: ['Trop amer', 'Parfait', 'Sucré'], answer: 'Trop amer' },
      { q: 'Do they have time to find another café?', options: ['No', 'Yes, plenty', 'Just enough'], answer: 'No' },
    ],
  },

  // B2 · « Connecteurs : contraste & cause »
  'B2:10': {
    kind: 'text',
    title: 'The concert',
    intro: 'Des connecteurs de contraste et de cause.',
    text: 'Although the weather was terrible, the concert went ahead. We stayed indoors because of the storm. The event was a success; however, ticket sales were lower than expected.',
    translation: 'Bien que le temps ait été terrible, le concert a eu lieu. Nous sommes restés à l’intérieur à cause de la tempête. L’événement fut un succès ; cependant, les ventes de billets ont été plus faibles que prévu.',
    questions: [
      { q: 'Did the concert happen despite the weather?', options: ['Yes', 'No', 'It was cancelled'], answer: 'Yes' },
      { q: 'Pourquoi sont-ils restés à l’intérieur ?', options: ['À cause de la tempête', 'À cause du bruit', 'Par choix'], answer: 'À cause de la tempête' },
      { q: 'What was lower than expected?', options: ['Ticket sales', 'The temperature', 'The noise'], answer: 'Ticket sales' },
    ],
  },

  // B2 · « L'environnement »
  'B2:11': {
    kind: 'text',
    title: 'A warming planet',
    intro: 'Un texte sur l’environnement.',
    text: 'Climate change is one of the biggest challenges of our time. Rising temperatures are melting glaciers and causing extreme weather. Many governments are now investing in renewable energy to reduce carbon emissions.',
    translation: 'Le changement climatique est l’un des plus grands défis de notre époque. La hausse des températures fait fondre les glaciers et provoque des phénomènes météorologiques extrêmes. De nombreux gouvernements investissent désormais dans les énergies renouvelables pour réduire les émissions de carbone.',
    questions: [
      { q: 'What is described as a big challenge?', options: ['Climate change', 'Traffic', 'Unemployment'], answer: 'Climate change' },
      { q: 'Quel est un effet de la hausse des températures ?', options: ['La fonte des glaciers', 'Plus de pluie partout', 'Rien'], answer: 'La fonte des glaciers' },
      { q: 'What are governments investing in?', options: ['Renewable energy', 'More cars', 'Coal'], answer: 'Renewable energy' },
    ],
  },

  // B2 · « Médias & actualité »
  'B2:12': {
    kind: 'text',
    title: 'News in the digital age',
    intro: 'Un texte sur les médias.',
    text: 'News spreads faster than ever thanks to social media. However, not all information is reliable, and false stories can go viral in minutes. It is important to check sources before sharing an article.',
    translation: 'Les informations se propagent plus vite que jamais grâce aux réseaux sociaux. Cependant, toutes les informations ne sont pas fiables, et de fausses histoires peuvent devenir virales en quelques minutes. Il est important de vérifier ses sources avant de partager un article.',
    questions: [
      { q: 'Why does news spread so fast?', options: ['Thanks to social media', 'Because of newspapers', 'Because of TV only'], answer: 'Thanks to social media' },
      { q: 'Quel est le problème mentionné ?', options: ['Certaines infos ne sont pas fiables', 'Il n’y a plus de journaux', 'Trop de publicité'], answer: 'Certaines infos ne sont pas fiables' },
      { q: 'What should you do before sharing?', options: ['Check the sources', 'Add a comment', 'Nothing'], answer: 'Check the sources' },
    ],
  },

  // B2 · « L'éducation »
  'B2:13': {
    kind: 'dialogue',
    title: 'Going to university',
    intro: 'Deux amis parlent d’études supérieures.',
    turns: [
      { speaker: 'Eli', en: 'Are you thinking of going to university?', fr: 'Penses-tu aller à l’université ?' },
      { speaker: 'Noa', en: "Yes, I'd like to study engineering. But the tuition fees are high.", fr: 'Oui, j’aimerais étudier l’ingénierie. Mais les frais de scolarité sont élevés.' },
      { speaker: 'Eli', en: 'You could apply for a scholarship.', fr: 'Tu pourrais demander une bourse.' },
      { speaker: 'Noa', en: "That's a good idea. I'll look into it.", fr: 'Bonne idée. Je vais me renseigner.' },
    ],
    questions: [
      { q: 'What does Noa want to study?', options: ['Engineering', 'Medicine', 'Law'], answer: 'Engineering' },
      { q: 'Quel est le problème ?', options: ['Les frais de scolarité élevés', 'Les notes', 'La distance'], answer: 'Les frais de scolarité élevés' },
      { q: 'What does Eli suggest?', options: ['Applying for a scholarship', 'Giving up', 'Working instead'], answer: 'Applying for a scholarship' },
    ],
  },

  // B2 · « Les affaires & l'économie »
  'B2:14': {
    kind: 'text',
    title: 'Small businesses',
    intro: 'Lis ce court texte sur les petites entreprises, puis réponds.',
    text:
      'Small businesses are the backbone of the economy. When someone starts a company, they take a financial risk, hoping that customers will buy their products or services. In the first year, many start-ups struggle to make a profit because their costs are high and their reputation is still small. Those that survive often grow slowly, reinvesting their earnings instead of spending them. Over time, a successful business can create jobs, pay taxes, and help the local community thrive.',
    translation:
      'Les petites entreprises sont la colonne vertébrale de l’économie. Quand quelqu’un crée une entreprise, il prend un risque financier, en espérant que les clients achèteront ses produits ou services. La première année, beaucoup de start-ups peinent à faire des bénéfices car leurs coûts sont élevés et leur réputation encore faible. Celles qui survivent grandissent souvent lentement, en réinvestissant leurs gains au lieu de les dépenser. Avec le temps, une entreprise prospère peut créer des emplois, payer des impôts et aider la communauté locale à prospérer.',
    questions: [
      {
        q: 'Pourquoi beaucoup de start-ups peinent-elles la première année ?',
        options: ['Coûts élevés et faible réputation', 'Trop d’employés', 'Pas assez d’idées'],
        answer: 'Coûts élevés et faible réputation',
      },
      {
        q: 'Que font souvent les entreprises qui survivent avec leurs bénéfices ?',
        options: ['Elles les réinvestissent', 'Elles les dépensent aussitôt', 'Elles ferment'],
        answer: 'Elles les réinvestissent',
      },
      {
        q: 'What can a successful business do over time?',
        options: ['Create jobs and pay taxes', 'Avoid all taxes', 'Stop hiring people'],
        answer: 'Create jobs and pay taxes',
      },
    ],
  },

  // B2 · « Les collocations courantes »
  'B2:15': {
    kind: 'text',
    title: 'Getting things done',
    intro: 'Un texte riche en collocations.',
    text: 'She made a big decision to take a gap year. He did his best to meet the deadline, but he still had to pay attention to every detail. They finally reached an agreement after long negotiations.',
    translation: 'Elle a pris une grande décision : faire une année de césure. Il a fait de son mieux pour respecter le délai, mais il devait quand même prêter attention à chaque détail. Ils sont finalement parvenus à un accord après de longues négociations.',
    questions: [
      { q: 'What decision did she make?', options: ['To take a gap year', 'To quit', 'To move'], answer: 'To take a gap year' },
      { q: 'Qu’a-t-il dû faire pour respecter le délai ?', options: ['Faire de son mieux', 'Abandonner', 'Déléguer'], answer: 'Faire de son mieux' },
      { q: 'What did they reach?', options: ['An agreement', 'A city', 'A conclusion by luck'], answer: 'An agreement' },
    ],
  },

  // C1 · « Le troisième conditionnel »
  'C1:0': {
    kind: 'text',
    title: 'Missed opportunities',
    intro: 'Des regrets au troisième conditionnel.',
    text: "If we had left earlier, we wouldn't have missed the train. She would have accepted the job if they had offered more money. Had I known about the meeting, I would have prepared.",
    translation: "Si nous étions partis plus tôt, nous n'aurions pas raté le train. Elle aurait accepté le poste s'ils avaient proposé plus d'argent. Si j'avais su pour la réunion, je me serais préparé.",
    questions: [
      { q: 'Why did they miss the train?', options: ["They didn't leave early enough", 'The train was cancelled', 'They overslept'], answer: "They didn't leave early enough" },
      { q: 'Sous quelle condition aurait-elle accepté l’emploi ?', options: ['Un meilleur salaire', 'De meilleurs horaires', 'Rien'], answer: 'Un meilleur salaire' },
      { q: 'What is the regret in the last sentence?', options: ['Not knowing about the meeting', 'Missing the train', 'Losing the job'], answer: 'Not knowing about the meeting' },
    ],
  },

  // C1 · « Les conditionnels mixtes »
  'C1:1': {
    kind: 'text',
    title: 'What could have been',
    intro: 'Des conditionnels mixtes (passé → présent).',
    text: "If I had taken that job, I would be living in Tokyo now. She wouldn't be so tired today if she had slept last night. If he were more organised, he wouldn't have missed the deadline.",
    translation: "Si j'avais pris ce poste, je vivrais à Tokyo aujourd'hui. Elle ne serait pas si fatiguée aujourd'hui si elle avait dormi la nuit dernière. S'il était plus organisé, il n'aurait pas manqué le délai.",
    questions: [
      { q: 'Where would the narrator be living now?', options: ['In Tokyo', 'In London', 'In Paris'], answer: 'In Tokyo' },
      { q: 'Pourquoi est-elle fatiguée aujourd’hui ?', options: ['Elle n’a pas dormi la nuit dernière', 'Elle a trop travaillé', 'Elle est malade'], answer: 'Elle n’a pas dormi la nuit dernière' },
      { q: 'Why did he miss the deadline?', options: ["He isn't organised enough", 'The task was too hard', 'He was ill'], answer: "He isn't organised enough" },
    ],
  },

  // C1 · « Les inversions »
  'C1:2': {
    kind: 'text',
    title: 'For emphasis',
    intro: 'Des inversions à valeur emphatique.',
    text: 'Never had I seen such a beautiful sunset. Not only did she win the race, but she also broke the record. Rarely do we get the chance to meet our heroes.',
    translation: "Jamais je n'avais vu un coucher de soleil aussi beau. Non seulement elle a gagné la course, mais elle a aussi battu le record. Rarement avons-nous l'occasion de rencontrer nos héros.",
    questions: [
      { q: 'What had the narrator never seen before?', options: ['Such a beautiful sunset', 'A race', 'A record'], answer: 'Such a beautiful sunset' },
      { q: 'Qu’a fait la coureuse ?', options: ['Gagner et battre le record', 'Seulement gagner', 'Abandonner'], answer: 'Gagner et battre le record' },
      { q: 'How often do we meet our heroes?', options: ['Rarely', 'Often', 'Never'], answer: 'Rarely' },
    ],
  },

  // C1 · « La mise en relief (cleft) »
  'C1:3': {
    kind: 'text',
    title: 'What matters',
    intro: 'Des structures clivées (cleft sentences).',
    text: "It was her determination that impressed everyone. What I really need is a proper holiday. It's the customers, not the shareholders, who matter most to us.",
    translation: "C'est sa détermination qui a impressionné tout le monde. Ce dont j'ai vraiment besoin, ce sont de vraies vacances. Ce sont les clients, pas les actionnaires, qui comptent le plus pour nous.",
    questions: [
      { q: 'What impressed everyone?', options: ['Her determination', 'Her money', 'Her looks'], answer: 'Her determination' },
      { q: 'De quoi a réellement besoin le narrateur ?', options: ['De vraies vacances', 'D’argent', 'D’un nouvel emploi'], answer: 'De vraies vacances' },
      { q: 'Who matters most according to the text?', options: ['The customers', 'The shareholders', 'The managers'], answer: 'The customers' },
    ],
  },

  // C1 · « Nuances des modaux passés »
  'C1:4': {
    kind: 'dialogue',
    title: 'Where is Sam?',
    intro: 'On spécule sur l’absence de Sam.',
    turns: [
      { speaker: 'Ana', en: "Sam isn't answering. He might have forgotten the meeting.", fr: 'Sam ne répond pas. Il a peut-être oublié la réunion.' },
      { speaker: 'Ben', en: "He can't have forgotten; I reminded him this morning.", fr: 'Il ne peut pas avoir oublié ; je le lui ai rappelé ce matin.' },
      { speaker: 'Ana', en: 'Then he must have been held up in traffic.', fr: 'Alors il a dû être bloqué dans les embouteillages.' },
      { speaker: 'Ben', en: 'He should have called us, at least.', fr: 'Il aurait au moins dû nous appeler.' },
    ],
    questions: [
      { q: 'Why is Ben sure Sam didn’t forget?', options: ['He reminded him this morning', 'Sam never forgets', 'Sam called'], answer: 'He reminded him this morning' },
      { q: 'Quelle est l’explication probable d’après Ana ?', options: ['Il a été bloqué dans les embouteillages', 'Il dort', 'Il est malade'], answer: 'Il a été bloqué dans les embouteillages' },
      { q: 'What does Ben think Sam should have done?', options: ['Called them', 'Left earlier', 'Cancelled'], answer: 'Called them' },
    ],
  },

  // C1 · « Les connecteurs logiques »
  'C1:5': {
    kind: 'text',
    title: 'The delayed project',
    intro: 'Des connecteurs logiques soutenus.',
    text: 'The project was delayed; consequently, the budget increased. Moreover, several team members left. Nevertheless, the company managed to deliver the product, albeit later than planned.',
    translation: "Le projet a été retardé ; par conséquent, le budget a augmenté. De plus, plusieurs membres de l'équipe sont partis. Néanmoins, l'entreprise a réussi à livrer le produit, quoique plus tard que prévu.",
    questions: [
      { q: 'What happened because of the delay?', options: ['The budget increased', 'The team grew', 'Nothing'], answer: 'The budget increased' },
      { q: 'Qu’est-il aussi arrivé à l’équipe ?', options: ['Plusieurs membres sont partis', 'Elle a doublé', 'Rien'], answer: 'Plusieurs membres sont partis' },
      { q: 'Did the company deliver the product?', options: ['Yes, but later than planned', 'No', 'Never'], answer: 'Yes, but later than planned' },
    ],
  },

  // C1 · « La nominalisation & le style formel »
  'C1:6': {
    kind: 'text',
    title: 'A formal report',
    intro: 'Style formel et nominalisation.',
    text: "The implementation of the new policy led to a significant reduction in costs. The committee's recommendation was the closure of the underperforming branch. Analysis of the data revealed several inconsistencies.",
    translation: "La mise en œuvre de la nouvelle politique a entraîné une réduction significative des coûts. La recommandation du comité était la fermeture de la branche peu performante. L'analyse des données a révélé plusieurs incohérences.",
    questions: [
      { q: 'What did the new policy lead to?', options: ['A reduction in costs', 'Higher costs', 'No change'], answer: 'A reduction in costs' },
      { q: 'Que recommandait le comité ?', options: ['La fermeture de la branche peu performante', 'Une expansion', 'Une fusion'], answer: 'La fermeture de la branche peu performante' },
      { q: 'What did the analysis reveal?', options: ['Several inconsistencies', 'Perfect results', 'Nothing'], answer: 'Several inconsistencies' },
    ],
  },

  // C1 · « Hedging : nuancer et atténuer »
  'C1:7': {
    kind: 'text',
    title: 'Cautious conclusions',
    intro: 'Le hedging : nuancer un propos scientifique.',
    text: 'The results seem to suggest that the treatment may be effective, although further research is needed. It could be argued that the sample was too small. To some extent, the conclusions remain tentative.',
    translation: "Les résultats semblent suggérer que le traitement pourrait être efficace, bien que des recherches supplémentaires soient nécessaires. On pourrait avancer que l'échantillon était trop petit. Dans une certaine mesure, les conclusions restent provisoires.",
    questions: [
      { q: 'Are the researchers certain the treatment works?', options: ['No, they use cautious language', 'Yes, completely', 'They say it fails'], answer: 'No, they use cautious language' },
      { q: 'Quel reproche pourrait-on faire à l’étude ?', options: ['L’échantillon était trop petit', 'Trop de participants', 'Aucune donnée'], answer: 'L’échantillon était trop petit' },
      { q: 'How are the conclusions described?', options: ['Tentative', 'Definitive', 'Wrong'], answer: 'Tentative' },
    ],
  },

  // C1 · « Politique & société »
  'C1:8': {
    kind: 'text',
    title: 'Declining trust',
    intro: 'Un texte sur la société et la politique.',
    text: 'Voter turnout has declined steadily over the past decades. Many citizens feel that politicians no longer represent their interests. Some experts argue that greater transparency could restore public trust.',
    translation: "La participation électorale n'a cessé de baisser au cours des dernières décennies. De nombreux citoyens estiment que les politiciens ne représentent plus leurs intérêts. Certains experts soutiennent qu'une plus grande transparence pourrait restaurer la confiance du public.",
    questions: [
      { q: 'What has declined over recent decades?', options: ['Voter turnout', 'Taxes', 'Population'], answer: 'Voter turnout' },
      { q: 'Que ressentent de nombreux citoyens ?', options: ['Que les politiciens ne les représentent plus', 'Que tout va bien', 'Qu’il faut voter plus'], answer: 'Que les politiciens ne les représentent plus' },
      { q: 'What could restore public trust, according to experts?', options: ['Greater transparency', 'More taxes', 'Fewer elections'], answer: 'Greater transparency' },
    ],
  },

  // C1 · « L'art & la culture »
  'C1:9': {
    kind: 'text',
    title: 'A bold exhibition',
    intro: 'Un texte sur l’art contemporain.',
    text: 'The exhibition challenges conventional ideas about modern art. Rather than displaying finished works, it focuses on the creative process itself. Critics have praised its bold and thought-provoking approach.',
    translation: "L'exposition remet en question les idées conventionnelles sur l'art moderne. Plutôt que de présenter des œuvres achevées, elle se concentre sur le processus créatif lui-même. Les critiques ont salué son approche audacieuse et stimulante.",
    questions: [
      { q: 'What does the exhibition challenge?', options: ['Conventional ideas about modern art', 'The price of art', 'Museum rules'], answer: 'Conventional ideas about modern art' },
      { q: 'Sur quoi se concentre-t-elle ?', options: ['Le processus créatif', 'Les œuvres finies uniquement', 'Les artistes célèbres'], answer: 'Le processus créatif' },
      { q: 'How did critics react?', options: ['They praised it', 'They ignored it', 'They hated it'], answer: 'They praised it' },
    ],
  },

  // C1 · « La science »
  'C1:10': {
    kind: 'text',
    title: 'A promising vaccine',
    intro: 'Un texte de vulgarisation scientifique.',
    text: 'Researchers have developed a vaccine that could prevent the disease in most cases. The findings, published last week, are based on a decade of study. However, mass production will take several more months.',
    translation: "Des chercheurs ont mis au point un vaccin qui pourrait prévenir la maladie dans la plupart des cas. Les résultats, publiés la semaine dernière, reposent sur une décennie d'étude. Cependant, la production de masse prendra encore plusieurs mois.",
    questions: [
      { q: 'What have researchers developed?', options: ['A vaccine', 'A new phone', 'A theory'], answer: 'A vaccine' },
      { q: 'Sur combien de temps d’étude reposent les résultats ?', options: ['Une décennie', 'Un an', 'Un mois'], answer: 'Une décennie' },
      { q: 'What will take several more months?', options: ['Mass production', 'The study', 'The publication'], answer: 'Mass production' },
    ],
  },

  // C1 · « Le monde de l'entreprise »
  'C1:11': {
    kind: 'dialogue',
    title: 'A team meeting',
    intro: 'Extrait d’une réunion d’équipe en entreprise.',
    turns: [
      { speaker: 'Chair', en: "Let's get started. Thanks for joining today's meeting.", fr: 'Commençons. Merci de participer à la réunion d’aujourd’hui.' },
      { speaker: 'David', en: 'Before we begin, could I add a point to the agenda?', fr: 'Avant de commencer, puis-je ajouter un point à l’ordre du jour ?' },
      { speaker: 'Chair', en: 'Of course, go ahead.', fr: 'Bien sûr, allez-y.' },
      { speaker: 'David', en: 'I think we should postpone the product launch until next quarter.', fr: 'Je pense que nous devrions reporter le lancement du produit au trimestre prochain.' },
      { speaker: 'Sara', en: 'I see your point, but a delay could cost us market share.', fr: 'Je comprends, mais un retard pourrait nous coûter des parts de marché.' },
      { speaker: 'Chair', en: "Let's put it to a vote after we've heard both sides.", fr: 'Mettons cela au vote après avoir entendu les deux parties.' },
    ],
    questions: [
      { q: 'Que propose David ?', options: ['Reporter le lancement du produit', 'Annuler la réunion', 'Augmenter le budget'], answer: 'Reporter le lancement du produit' },
      { q: 'Quelle est l’inquiétude de Sara ?', options: ['Perdre des parts de marché', 'Le coût du marketing', 'Le manque de personnel'], answer: 'Perdre des parts de marché' },
      { q: 'How will the decision be made?', options: ['By a vote', 'By the chair alone', 'By David'], answer: 'By a vote' },
    ],
  },

  // C1 · « Les expressions idiomatiques »
  'C1:12': {
    kind: 'dialogue',
    title: 'After the presentation',
    intro: 'Un dialogue plein d’expressions idiomatiques.',
    turns: [
      { speaker: 'Mia', en: 'How did the presentation go?', fr: 'Comment s’est passée la présentation ?' },
      { speaker: 'Leo', en: 'It was a piece of cake, honestly.', fr: 'C’était du gâteau, franchement.' },
      { speaker: 'Mia', en: 'Really? I thought you were on the fence about it.', fr: 'Vraiment ? Je croyais que tu hésitais.' },
      { speaker: 'Leo', en: 'I was, but in the end I decided to bite the bullet.', fr: 'C’était le cas, mais au final j’ai décidé de me lancer.' },
    ],
    questions: [
      { q: 'What does "a piece of cake" mean here?', options: ['It was very easy', 'It was delicious', 'It was hard'], answer: 'It was very easy' },
      { q: 'Que signifie « on the fence » ?', options: ['Hésiter', 'Être en colère', 'Être confiant'], answer: 'Hésiter' },
      { q: 'What did Leo finally decide to do?', options: ['To bite the bullet (go for it)', 'To give up', 'To postpone'], answer: 'To bite the bullet (go for it)' },
    ],
  },

  // C1 · « Registres de langue »
  'C1:13': {
    kind: 'text',
    title: 'Formal or casual?',
    intro: 'Le même message, deux registres.',
    text: "In formal writing, we might say 'I would like to request assistance.' In casual speech, the same idea becomes 'Can you give me a hand?' Choosing the right register is essential for effective communication.",
    translation: "À l'écrit formel, on pourrait dire « I would like to request assistance ». À l'oral familier, la même idée devient « Can you give me a hand? ». Choisir le bon registre est essentiel pour une communication efficace.",
    questions: [
      { q: 'Which is the formal version?', options: ['I would like to request assistance', 'Can you give me a hand?', 'Help!'], answer: 'I would like to request assistance' },
      { q: 'Que veut dire l’expression informelle ?', options: ['Demander de l’aide', 'Donner de l’argent', 'Partir'], answer: 'Demander de l’aide' },
      { q: 'Why is choosing the right register important?', options: ['For effective communication', 'To sound clever', "It isn't"], answer: 'For effective communication' },
    ],
  },

  // C1 · « Phrasal verbs avancés »
  'C1:14': {
    kind: 'text',
    title: 'A tough deal',
    intro: 'Un texte riche en phrasal verbs.',
    text: 'The negotiations fell through at the last minute. We had to come up with a new plan quickly. Despite the setback, the team refused to back down and eventually pulled it off.',
    translation: "Les négociations ont échoué à la dernière minute. Nous avons dû trouver un nouveau plan rapidement. Malgré ce revers, l'équipe a refusé de reculer et a fini par y arriver.",
    questions: [
      { q: 'What happened to the negotiations?', options: ['They fell through', 'They succeeded easily', 'They were delayed'], answer: 'They fell through' },
      { q: 'Qu’a dû faire l’équipe ?', options: ['Trouver un nouveau plan', 'Abandonner', 'Attendre'], answer: 'Trouver un nouveau plan' },
      { q: 'Did the team give up?', options: ['No, they pulled it off', 'Yes', 'They postponed'], answer: 'No, they pulled it off' },
    ],
  },

  // C1 · « Ellipse & substitution »
  'C1:15': {
    kind: 'dialogue',
    title: 'The party',
    intro: 'Ellipse et substitution dans la conversation.',
    turns: [
      { speaker: 'Zoe', en: 'Are you coming to the party?', fr: 'Tu viens à la fête ?' },
      { speaker: 'Ian', en: "I'd love to, but I can't.", fr: 'J’adorerais, mais je ne peux pas.' },
      { speaker: 'Zoe', en: 'My brother is, and so is Anna.', fr: 'Mon frère vient, et Anna aussi.' },
      { speaker: 'Ian', en: 'Maybe next time, then.', fr: 'La prochaine fois, alors.' },
    ],
    questions: [
      { q: 'Can Ian come to the party?', options: ['No', 'Yes', 'Only later'], answer: 'No' },
      { q: 'Qui d’autre vient d’après Zoe ?', options: ['Son frère et Anna', 'Personne', 'Seulement Anna'], answer: 'Son frère et Anna' },
      { q: 'What does "I\'d love to" refer to?', options: ['Coming to the party', 'Leaving', 'Helping'], answer: 'Coming to the party' },
    ],
  },

  // C2 · « Le subjonctif »
  'C2:0': {
    kind: 'text',
    title: 'Formal demands',
    intro: 'Le subjonctif dans un registre soutenu.',
    text: 'The board insisted that the report be submitted by Friday. It is essential that every member be present at the vote. Were she to resign, the whole project would collapse.',
    translation: "Le conseil a insisté pour que le rapport soit remis vendredi. Il est essentiel que chaque membre soit présent au vote. Si elle venait à démissionner, tout le projet s'effondrerait.",
    questions: [
      { q: 'What did the board insist on?', options: ['That the report be submitted by Friday', 'That the report be cancelled', 'Nothing'], answer: 'That the report be submitted by Friday' },
      { q: 'Qu’est-il essentiel ?', options: ['Que chaque membre soit présent au vote', 'Que personne ne vote', 'Que le vote soit reporté'], answer: 'Que chaque membre soit présent au vote' },
      { q: 'What would happen if she resigned?', options: ['The project would collapse', 'Nothing', 'It would improve'], answer: 'The project would collapse' },
    ],
  },

  // C2 · « L'article zéro »
  'C2:1': {
    kind: 'text',
    title: 'General truths',
    intro: 'L’article zéro devant les notions générales.',
    text: 'Life is short. Happiness cannot be bought. Nature has its own rhythm, and history teaches us many lessons. In general, honesty is valued in most cultures.',
    translation: "La vie est courte. Le bonheur ne s'achète pas. La nature a son propre rythme, et l'histoire nous enseigne de nombreuses leçons. En général, l'honnêteté est valorisée dans la plupart des cultures.",
    questions: [
      { q: 'What cannot be bought, according to the text?', options: ['Happiness', 'Cars', 'Time'], answer: 'Happiness' },
      { q: 'Que nous enseigne l’Histoire d’après le texte ?', options: ['De nombreuses leçons', 'Rien', 'Une seule chose'], answer: 'De nombreuses leçons' },
      { q: 'What is valued in most cultures?', options: ['Honesty', 'Wealth', 'Fame'], answer: 'Honesty' },
    ],
  },

  // C2 · « Les structures emphatiques »
  'C2:2': {
    kind: 'text',
    title: 'For emphasis',
    intro: 'Des structures emphatiques soutenues.',
    text: 'I do believe you are mistaken. It was only after the meeting that she realised her error. Little did they know what awaited them.',
    translation: "Je crois bel et bien que vous vous trompez. Ce n'est qu'après la réunion qu'elle a réalisé son erreur. Ils étaient loin de se douter de ce qui les attendait.",
    questions: [
      { q: 'Does the narrator believe the other person is right?', options: ["No, they think they're mistaken", 'Yes', "They're unsure"], answer: "No, they think they're mistaken" },
      { q: 'Quand a-t-elle réalisé son erreur ?', options: ['Seulement après la réunion', 'Avant la réunion', 'Jamais'], answer: 'Seulement après la réunion' },
      { q: 'What does "Little did they know" suggest?', options: ['They were unaware of what was coming', 'They knew everything', 'They planned it'], answer: 'They were unaware of what was coming' },
    ],
  },

  // C2 · « Temps rares & style littéraire »
  'C2:3': {
    kind: 'text',
    title: 'The old house',
    intro: 'Un passage littéraire.',
    text: 'She had been walking for hours when, at last, the old house came into view. The rain had stopped, and a pale sun was breaking through the clouds. Never before had the world seemed so still.',
    translation: "Elle marchait depuis des heures lorsque, enfin, la vieille maison apparut. La pluie s'était arrêtée, et un pâle soleil perçait à travers les nuages. Jamais le monde n'avait semblé aussi immobile.",
    questions: [
      { q: 'What came into view?', options: ['The old house', 'A car', 'A river'], answer: 'The old house' },
      { q: 'Quel temps faisait-il ?', options: ['La pluie s’était arrêtée', 'Il neigeait', 'Il faisait nuit noire'], answer: 'La pluie s’était arrêtée' },
      { q: 'How did the world seem?', options: ['Very still', 'Very loud', 'Frightening'], answer: 'Very still' },
    ],
  },

  // C2 · « Les idiomes natifs »
  'C2:4': {
    kind: 'dialogue',
    title: 'The deal is off',
    intro: 'Un échange truffé d’idiomes natifs.',
    turns: [
      { speaker: 'Ray', en: "I'm afraid the deal is off. The client got cold feet.", fr: 'J’ai peur que l’accord tombe à l’eau. Le client s’est dégonflé.' },
      { speaker: 'Sue', en: "You're kidding! We were so close to sealing it.", fr: 'Tu plaisantes ! On était si près de le conclure.' },
      { speaker: 'Ray', en: 'I know. Back to the drawing board, I guess.', fr: 'Je sais. On repart de zéro, j’imagine.' },
    ],
    questions: [
      { q: 'What does "got cold feet" mean?', options: ['Became nervous and backed out', 'Was cold', 'Was excited'], answer: 'Became nervous and backed out' },
      { q: 'Que signifie « back to the drawing board » ?', options: ['Repartir de zéro', 'Finir le travail', 'Célébrer'], answer: 'Repartir de zéro' },
      { q: 'How does Sue feel about the news?', options: ['Surprised and disappointed', 'Happy', 'Indifferent'], answer: 'Surprised and disappointed' },
    ],
  },

  // C2 · « Le vocabulaire académique »
  'C2:5': {
    kind: 'text',
    title: 'A research paper',
    intro: 'Un extrait au style académique.',
    text: 'This paper examines the extent to which economic factors influence migration. The methodology comprises both quantitative surveys and qualitative interviews. The findings corroborate previous studies while highlighting notable exceptions.',
    translation: "Cet article examine dans quelle mesure les facteurs économiques influencent la migration. La méthodologie comprend à la fois des enquêtes quantitatives et des entretiens qualitatifs. Les résultats corroborent des études antérieures tout en mettant en évidence des exceptions notables.",
    questions: [
      { q: 'What does the paper examine?', options: ['How economic factors influence migration', 'The weather', 'Population growth'], answer: 'How economic factors influence migration' },
      { q: 'Quelle méthodologie est utilisée ?', options: ['Enquêtes quantitatives et entretiens qualitatifs', 'Uniquement des sondages', 'Aucune'], answer: 'Enquêtes quantitatives et entretiens qualitatifs' },
      { q: 'What do the findings do?', options: ['Corroborate previous studies', 'Contradict everything', 'Prove nothing'], answer: 'Corroborate previous studies' },
    ],
  },

  // C2 · « Les nuances de sens »
  'C2:6': {
    kind: 'text',
    title: 'Fine distinctions',
    intro: 'Des nuances subtiles entre mots proches.',
    text: "There is a subtle difference between 'assertive' and 'aggressive.' The former implies confidence; the latter suggests hostility. Likewise, being 'frugal' is not the same as being 'stingy.'",
    translation: "Il existe une différence subtile entre « assertive » et « aggressive ». Le premier implique la confiance ; le second suggère l'hostilité. De même, être « frugal » n'est pas la même chose qu'être « stingy » (radin).",
    questions: [
      { q: 'What does "assertive" imply?', options: ['Confidence', 'Hostility', 'Fear'], answer: 'Confidence' },
      { q: 'Que suggère « aggressive » ?', options: ['De l’hostilité', 'De la confiance', 'De la générosité'], answer: 'De l’hostilité' },
      { q: 'Is "frugal" the same as "stingy"?', options: ['No', 'Yes', 'They are opposites entirely'], answer: 'No' },
    ],
  },

  // C2 · « Collocations avancées & mots savants »
  'C2:7': {
    kind: 'text',
    title: 'A delicate matter',
    intro: 'Collocations avancées et registre soutenu.',
    text: 'The proposal raised profound questions and sparked heated debate. Despite mounting pressure, the minister remained resolutely non-committal. Ultimately, a tacit consensus emerged.',
    translation: "La proposition a soulevé des questions profondes et déclenché un débat animé. Malgré une pression croissante, le ministre est resté résolument évasif. Finalement, un consensus tacite a émergé.",
    questions: [
      { q: 'What did the proposal spark?', options: ['Heated debate', 'Applause', 'Silence'], answer: 'Heated debate' },
      { q: 'Comment est resté le ministre ?', options: ['Résolument évasif', 'Très clair', 'Absent'], answer: 'Résolument évasif' },
      { q: 'What emerged in the end?', options: ['A tacit consensus', 'A fight', 'Nothing'], answer: 'A tacit consensus' },
    ],
  },

  // C2 · « Humour & understatement »
  'C2:8': {
    kind: 'dialogue',
    title: 'The long flight',
    intro: 'L’art de l’understatement (litote).',
    turns: [
      { speaker: 'Kim', en: 'How was the twelve-hour flight?', fr: 'Comment s’est passé le vol de douze heures ?' },
      { speaker: 'Jo', en: 'Oh, it was not exactly a picnic.', fr: 'Oh, ce n’était pas vraiment une partie de plaisir.' },
      { speaker: 'Kim', en: 'And the food?', fr: 'Et la nourriture ?' },
      { speaker: 'Jo', en: "Let's just say I've had better.", fr: 'Disons que j’ai connu mieux.' },
    ],
    questions: [
      { q: 'What does "not exactly a picnic" really mean?', options: ['It was quite unpleasant', 'It was fun', 'It was a picnic'], answer: 'It was quite unpleasant' },
      { q: 'Que pense Jo de la nourriture ?', options: ['Elle n’était pas bonne', 'Elle était excellente', 'Il n’a pas mangé'], answer: 'Elle n’était pas bonne' },
      { q: 'What technique is Jo using?', options: ['Understatement', 'Exaggeration', 'Lying'], answer: 'Understatement' },
    ],
  },

  // C2 · « Ponctuation & rythme »
  'C2:9': {
    kind: 'text',
    title: 'The rhythm of prose',
    intro: 'La ponctuation au service du rythme.',
    text: 'Good writing relies on rhythm. A short sentence adds impact. Longer, flowing sentences, punctuated with care, can carry the reader along; a well-placed dash — like this — creates a pause for emphasis.',
    translation: "Une bonne écriture repose sur le rythme. Une phrase courte ajoute de l'impact. Des phrases plus longues et fluides, ponctuées avec soin, peuvent entraîner le lecteur ; un tiret bien placé — comme ceci — crée une pause pour insister.",
    questions: [
      { q: 'What does good writing rely on, according to the text?', options: ['Rhythm', 'Length', 'Big words'], answer: 'Rhythm' },
      { q: 'Qu’ajoute une phrase courte ?', options: ['De l’impact', 'De la confusion', 'Rien'], answer: 'De l’impact' },
      { q: 'What does a well-placed dash create?', options: ['A pause for emphasis', 'A mistake', 'A new paragraph'], answer: 'A pause for emphasis' },
    ],
  },

  // C2 · « Le style natif »
  'C2:10': {
    kind: 'text',
    title: 'Sounding native',
    intro: 'Le flou volontaire du langage natif.',
    text: "Native speakers often use vague language on purpose: 'sort of,' 'kind of,' 'you know.' Far from being lazy, these expressions soften statements and make speech sound natural. Mastering them is a hallmark of fluency.",
    translation: "Les locuteurs natifs utilisent souvent un langage vague à dessein : « sort of », « kind of », « you know ». Loin d'être de la paresse, ces expressions atténuent les propos et rendent le discours naturel. Les maîtriser est une marque d'aisance.",
    questions: [
      { q: 'Why do native speakers use vague language?', options: ['To soften statements and sound natural', 'Because they are lazy', 'By mistake'], answer: 'To soften statements and sound natural' },
      { q: 'Ces expressions sont-elles un signe de paresse ?', options: ['Non', 'Oui', 'Toujours'], answer: 'Non' },
      { q: 'What is mastering them a hallmark of?', options: ['Fluency', 'Rudeness', 'Weakness'], answer: 'Fluency' },
    ],
  },

  // C2 · « Les connecteurs logiques avancés »
  'C2:11': {
    kind: 'text',
    title: 'Weighing the evidence',
    intro: 'Des connecteurs logiques nuancés.',
    text: 'The results were, on the whole, encouraging. That said, certain limitations must be acknowledged. Insofar as the data allows, we can draw preliminary conclusions; nonetheless, caution is warranted.',
    translation: "Les résultats étaient, dans l'ensemble, encourageants. Cela dit, certaines limites doivent être reconnues. Dans la mesure où les données le permettent, nous pouvons tirer des conclusions préliminaires ; néanmoins, la prudence est de mise.",
    questions: [
      { q: 'How were the results on the whole?', options: ['Encouraging', 'Disastrous', 'Irrelevant'], answer: 'Encouraging' },
      { q: 'Que faut-il reconnaître ?', options: ['Certaines limites', 'Aucune limite', 'Une erreur totale'], answer: 'Certaines limites' },
      { q: 'What word signals caution at the end?', options: ['Nonetheless', 'Therefore', 'Because'], answer: 'Nonetheless' },
    ],
  },

  // C2 · « La littérature et les arts »
  'C2:12': {
    kind: 'text',
    title: 'A modern masterpiece',
    intro: 'Une critique littéraire.',
    text: 'The novel, widely regarded as a masterpiece, explores themes of memory and loss. Its non-linear narrative demands patience, but rewards the attentive reader with striking imagery and profound insight.',
    translation: "Le roman, largement considéré comme un chef-d'œuvre, explore les thèmes de la mémoire et de la perte. Sa narration non linéaire exige de la patience, mais récompense le lecteur attentif par des images saisissantes et une profondeur remarquable.",
    questions: [
      { q: 'How is the novel regarded?', options: ['As a masterpiece', 'As a failure', 'As average'], answer: 'As a masterpiece' },
      { q: 'Quels thèmes explore-t-il ?', options: ['La mémoire et la perte', 'La guerre', 'L’amour uniquement'], answer: 'La mémoire et la perte' },
      { q: 'What does its narrative demand?', options: ['Patience', 'Money', 'Nothing'], answer: 'Patience' },
    ],
  },

  // C2 · « Cohésion & cohérence du discours »
  'C2:13': {
    kind: 'text',
    title: 'A coherent argument',
    intro: 'La cohésion du discours.',
    text: 'A well-structured argument flows logically from one point to the next. Each paragraph builds on the previous one, and transitions guide the reader smoothly. Without such cohesion, even brilliant ideas can seem disjointed.',
    translation: "Un argument bien structuré s'enchaîne logiquement d'un point à l'autre. Chaque paragraphe s'appuie sur le précédent, et les transitions guident le lecteur en douceur. Sans une telle cohésion, même des idées brillantes peuvent paraître décousues.",
    questions: [
      { q: 'How does a well-structured argument flow?', options: ['Logically from one point to the next', 'Randomly', 'Backwards'], answer: 'Logically from one point to the next' },
      { q: 'Que font les transitions ?', options: ['Elles guident le lecteur en douceur', 'Elles compliquent le texte', 'Rien'], answer: 'Elles guident le lecteur en douceur' },
      { q: 'Without cohesion, how can brilliant ideas seem?', options: ['Disjointed', 'Perfect', 'Simple'], answer: 'Disjointed' },
    ],
  },

  // C2 · « Le langage figuré (métaphores & idiomes) »
  'C2:14': {
    kind: 'text',
    title: 'Figures of speech',
    intro: 'Métaphores et personnifications.',
    text: 'Time is a thief that steals our moments unnoticed. Her words were daggers, sharp and cruel. The city never sleeps, its heartbeat echoing through crowded streets.',
    translation: "Le temps est un voleur qui dérobe nos instants sans qu'on s'en aperçoive. Ses mots étaient des poignards, tranchants et cruels. La ville ne dort jamais, son battement de cœur résonnant dans les rues bondées.",
    questions: [
      { q: 'What is time compared to?', options: ['A thief', 'A river', 'A friend'], answer: 'A thief' },
      { q: 'À quoi ses mots sont-ils comparés ?', options: ['Des poignards', 'Des fleurs', 'De la musique'], answer: 'Des poignards' },
      { q: 'What figure of speech is "The city never sleeps"?', options: ['Personification', 'Simile', 'Understatement'], answer: 'Personification' },
    ],
  },
};
