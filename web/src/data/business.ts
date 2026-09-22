import type { BusinessModule } from '../types';

// Parcours Business English (formation pro / B2B).
// Contenu 100 % statique, additif, zéro coût à l'exécution (synthèse vocale
// navigateur pour l'écoute). On ne touche JAMAIS curriculum.ts : ces modules
// vivent à part et sont exposés par content.ts → businessModules().
//
// Chaque module réutilise le type Lesson (forms / examples / practice / drills /
// comprehension) donc tout le moteur d'exercices marche sans modification.
// `practice` alimente aussi le SRS (via le `level` nominal du module).

export const BUSINESS_MODULES: readonly BusinessModule[] = [
  // ───────────────────────────────────────────────────────── Relationnel
  {
    id: 'introductions',
    level: 'B1',
    category: 'Relationnel',
    t: 'V',
    title: 'Se présenter & réseauter',
    goal: 'Faire une première impression pro et engager la conversation.',
    intro:
      'Les premières secondes comptent. Apprends à te présenter, présenter ton entreprise et échanger tes coordonnées avec assurance.',
    formsTitle: 'Formules clés',
    forms: [
      ['I work as a…', 'Je travaille comme…'],
      ['I’m in charge of…', 'Je suis responsable de…'],
      ['I’m with [company].', 'Je travaille chez [entreprise].'],
      ['Could I have your business card?', 'Puis-je avoir votre carte de visite ?'],
      ['Let’s keep in touch.', 'Restons en contact.'],
    ],
    examples: [
      ['Hi, I don’t think we’ve met. I’m Sarah from Marketing.', 'Bonjour, je ne crois pas qu’on se connaisse. Je suis Sarah, du Marketing.'],
      ['Nice to put a face to the name.', 'Content de mettre un visage sur le nom.'],
      ['What line of business are you in?', 'Dans quel secteur travaillez-vous ?'],
    ],
    practice: [
      { en: 'I’m in charge of the sales team.', fr: 'Je suis responsable de l’équipe commerciale.', hint: 'charge' },
      { en: 'I work as a project manager.', fr: 'Je travaille comme chef de projet.', hint: 'project' },
      { en: 'Could I have your business card?', fr: 'Puis-je avoir votre carte de visite ?', hint: 'card' },
      { en: 'Let me introduce my colleague.', fr: 'Laissez-moi vous présenter mon collègue.', hint: 'introduce' },
      { en: 'We should keep in touch.', fr: 'Nous devrions rester en contact.', hint: 'touch' },
      { en: 'What line of business are you in?', fr: 'Dans quel secteur travaillez-vous ?', hint: 'business' },
      { en: 'It was a pleasure meeting you.', fr: 'Ce fut un plaisir de vous rencontrer.', hint: 'pleasure' },
    ],
    drills: [
      {
        q: 'Formule la plus naturelle pour demander une carte de visite ?',
        options: ['Could I have your business card?', 'Give me your paper.', 'Where is your card?'],
        answer: 'Could I have your business card?',
      },
      {
        q: '« Je suis responsable de… » se dit :',
        options: ['I’m in charge of…', 'I’m the chief from…', 'I have the charge of…'],
        answer: 'I’m in charge of…',
      },
    ],
    comprehension: {
      kind: 'dialogue',
      title: 'At a conference',
      intro: 'Deux professionnels se rencontrent à une conférence.',
      turns: [
        { speaker: 'Mark', en: 'Hi, I don’t think we’ve met. I’m Mark, from DataCorp.', fr: 'Bonjour, je ne crois pas qu’on se connaisse. Je suis Mark, de DataCorp.' },
        { speaker: 'Léa', en: 'Nice to meet you, Mark. I’m Léa, I work in HR at Nexa.', fr: 'Enchantée, Mark. Je suis Léa, je travaille aux RH chez Nexa.' },
        { speaker: 'Mark', en: 'Great talk earlier. Could I have your business card?', fr: 'Belle intervention tout à l’heure. Puis-je avoir votre carte ?' },
        { speaker: 'Léa', en: 'Of course. Let’s keep in touch — I’ll email you.', fr: 'Bien sûr. Restons en contact, je vous écris un mail.' },
      ],
      questions: [
        { q: 'Where does Mark work?', options: ['DataCorp', 'Nexa', 'HR Ltd'], answer: 'DataCorp' },
        { q: 'What is Léa’s field?', options: ['HR', 'Sales', 'Finance'], answer: 'HR', exp: '« I work in HR at Nexa. »' },
        { q: 'What does Mark ask for?', options: ['A business card', 'A meeting room', 'A phone'], answer: 'A business card' },
      ],
    },
  },

  // ───────────────────────────────────────────────────────── Écrit
  {
    id: 'emails',
    level: 'B1',
    category: 'Écrit',
    t: 'V',
    title: 'Emails professionnels',
    goal: 'Écrire des emails clairs, polis et efficaces.',
    intro:
      'Un bon email va droit au but tout en restant courtois. Maîtrise les ouvertures, les demandes et les formules de clôture.',
    formsTitle: 'Structure d’un email',
    forms: [
      ['I’m writing to…', 'Je vous écris pour…'],
      ['Could you please…?', 'Pourriez-vous… ?'],
      ['Please find attached…', 'Veuillez trouver ci-joint…'],
      ['I look forward to hearing from you.', 'Dans l’attente de votre retour.'],
      ['Best regards,', 'Cordialement,'],
    ],
    examples: [
      ['I’m writing to follow up on our meeting.', 'Je vous écris pour faire suite à notre réunion.'],
      ['Could you please send me the report by Friday?', 'Pourriez-vous m’envoyer le rapport avant vendredi ?'],
      ['Please find attached the updated invoice.', 'Veuillez trouver ci-joint la facture mise à jour.'],
    ],
    practice: [
      { en: 'I’m writing to confirm our appointment.', fr: 'Je vous écris pour confirmer notre rendez-vous.', hint: 'confirm' },
      { en: 'Could you please send me the file?', fr: 'Pourriez-vous m’envoyer le fichier ?', hint: 'send' },
      { en: 'Please find attached the report.', fr: 'Veuillez trouver ci-joint le rapport.', hint: 'attached' },
      { en: 'Thank you for your quick reply.', fr: 'Merci pour votre réponse rapide.', hint: 'reply' },
      { en: 'I look forward to hearing from you.', fr: 'Dans l’attente de votre retour.', hint: 'forward' },
      { en: 'Let me know if you have any questions.', fr: 'N’hésitez pas si vous avez des questions.', hint: 'questions' },
      { en: 'Sorry for the late reply.', fr: 'Désolé pour la réponse tardive.', hint: 'late' },
    ],
    drills: [
      {
        q: 'Clôture la plus adaptée à un email formel ?',
        options: ['Best regards,', 'See ya,', 'Bye now,'],
        answer: 'Best regards,',
      },
      {
        q: '« Veuillez trouver ci-joint… » se dit :',
        options: ['Please find attached…', 'Please see the join…', 'Find here joined…'],
        answer: 'Please find attached…',
      },
    ],
    comprehension: {
      kind: 'text',
      title: 'A follow-up email',
      intro: 'Lis cet email de relance, puis réponds.',
      text:
        'Dear Mr. Chen,\n\nI’m writing to follow up on the quote I sent last week. Could you please let me know if the pricing works for your team? Please find attached a revised version with a 5% discount.\n\nI look forward to hearing from you.\n\nBest regards,\nJulia',
      translation:
        'Cher M. Chen, je vous écris pour faire suite au devis envoyé la semaine dernière. Pourriez-vous me dire si le tarif convient à votre équipe ? Veuillez trouver ci-joint une version révisée avec 5 % de remise. Dans l’attente de votre retour. Cordialement, Julia.',
      questions: [
        { q: 'Why is Julia writing?', options: ['To follow up on a quote', 'To apply for a job', 'To cancel a meeting'], answer: 'To follow up on a quote' },
        { q: 'What is attached?', options: ['A revised quote', 'A contract', 'An invoice'], answer: 'A revised quote', exp: '« a revised version with a 5% discount »' },
        { q: 'What discount is offered?', options: ['5%', '10%', '15%'], answer: '5%' },
      ],
    },
  },

  // ───────────────────────────────────────────────────────── Réunions
  {
    id: 'meetings',
    level: 'B2',
    category: 'Réunions',
    t: 'V',
    title: 'Réunions & prises de parole',
    goal: 'Participer, donner son avis et gérer une réunion.',
    intro:
      'En réunion, savoir ouvrir, interrompre poliment, donner son avis et conclure fait toute la différence.',
    formsTitle: 'Boîte à outils de réunion',
    forms: [
      ['Let’s get started.', 'Commençons.'],
      ['Can I just add something?', 'Puis-je ajouter quelque chose ?'],
      ['I see your point, but…', 'Je comprends votre point de vue, mais…'],
      ['Let’s move on to the next point.', 'Passons au point suivant.'],
      ['To sum up,…', 'Pour résumer,…'],
    ],
    examples: [
      ['Shall we get started? We have a lot to cover.', 'On commence ? Nous avons beaucoup à voir.'],
      ['Sorry to interrupt, but can I just add something?', 'Désolé de vous couper, mais puis-je ajouter un point ?'],
      ['I see your point, but I’m not sure it’s realistic.', 'Je comprends, mais je ne suis pas sûr que ce soit réaliste.'],
    ],
    practice: [
      { en: 'Let’s get started, we have a lot to cover.', fr: 'Commençons, nous avons beaucoup à voir.', hint: 'started' },
      { en: 'Can I just add something here?', fr: 'Puis-je ajouter quelque chose ici ?', hint: 'add' },
      { en: 'I see your point, but I disagree.', fr: 'Je comprends votre avis, mais je ne suis pas d’accord.', hint: 'point' },
      { en: 'Let’s move on to the next point.', fr: 'Passons au point suivant.', hint: 'move' },
      { en: 'Could you clarify what you mean?', fr: 'Pourriez-vous préciser ce que vous voulez dire ?', hint: 'clarify' },
      { en: 'To sum up, we agree on the deadline.', fr: 'Pour résumer, nous sommes d’accord sur l’échéance.', hint: 'sum' },
      { en: 'Let’s take that offline.', fr: 'Voyons cela en dehors de la réunion.', hint: 'offline' },
    ],
    drills: [
      {
        q: 'Comment interrompre poliment ?',
        options: ['Sorry to interrupt, but…', 'Stop, listen to me.', 'Be quiet, my turn.'],
        answer: 'Sorry to interrupt, but…',
      },
      {
        q: '« Passons au point suivant » se dit :',
        options: ['Let’s move on to the next point.', 'Let’s go the other point.', 'Next the point please.'],
        answer: 'Let’s move on to the next point.',
      },
    ],
    comprehension: {
      kind: 'dialogue',
      title: 'The weekly stand-up',
      intro: 'Extrait d’une réunion d’équipe hebdomadaire.',
      turns: [
        { speaker: 'Nadia', en: 'Let’s get started. Where are we on the launch?', fr: 'Commençons. Où en est-on sur le lancement ?' },
        { speaker: 'Tom', en: 'We’re on track, but design needs two more days.', fr: 'On est dans les temps, mais le design a besoin de deux jours de plus.' },
        { speaker: 'Nadia', en: 'I see your point, but the client expects Friday.', fr: 'Je comprends, mais le client attend vendredi.' },
        { speaker: 'Tom', en: 'Understood. Let’s take that offline and find a plan.', fr: 'Compris. Voyons ça à part pour trouver une solution.' },
      ],
      questions: [
        { q: 'What are they discussing?', options: ['A product launch', 'A holiday', 'A hiring'], answer: 'A product launch' },
        { q: 'What does design need?', options: ['Two more days', 'A new tool', 'More budget'], answer: 'Two more days' },
        { q: 'When does the client expect it?', options: ['Friday', 'Monday', 'Next month'], answer: 'Friday' },
      ],
    },
  },

  // ───────────────────────────────────────────────────────── Communication
  {
    id: 'telephoning',
    level: 'B1',
    category: 'Communication',
    t: 'V',
    title: 'Téléphone & visio',
    goal: 'Gérer un appel pro : accueillir, transférer, laisser un message.',
    intro:
      'Au téléphone, on ne voit pas son interlocuteur : les formules types rassurent et évitent les malentendus.',
    formsTitle: 'Au téléphone',
    forms: [
      ['Could I speak to…, please?', 'Pourrais-je parler à…, s’il vous plaît ?'],
      ['Who’s calling, please?', 'Qui est à l’appareil ?'],
      ['I’ll put you through.', 'Je vous mets en relation.'],
      ['Could you speak up, please?', 'Pourriez-vous parler plus fort ?'],
      ['Can I take a message?', 'Puis-je prendre un message ?'],
    ],
    examples: [
      ['Hello, this is Anna from Accounting.', 'Bonjour, Anna du service comptabilité à l’appareil.'],
      ['I’m afraid she’s in a meeting right now.', 'Je crains qu’elle soit en réunion pour le moment.'],
      ['Sorry, you’re breaking up. Could you repeat that?', 'Désolé, ça coupe. Pouvez-vous répéter ?'],
    ],
    practice: [
      { en: 'Could I speak to the manager, please?', fr: 'Pourrais-je parler au responsable, s’il vous plaît ?', hint: 'speak' },
      { en: 'Who’s calling, please?', fr: 'Qui est à l’appareil ?', hint: 'calling' },
      { en: 'I’ll put you through now.', fr: 'Je vous mets en relation.', hint: 'through' },
      { en: 'Can I take a message?', fr: 'Puis-je prendre un message ?', hint: 'message' },
      { en: 'Could you speak up, please?', fr: 'Pourriez-vous parler plus fort ?', hint: 'up' },
      { en: 'Sorry, you’re breaking up.', fr: 'Désolé, ça coupe.', hint: 'breaking' },
      { en: 'I’ll call you back in five minutes.', fr: 'Je vous rappelle dans cinq minutes.', hint: 'back' },
    ],
    drills: [
      {
        q: 'Pour demander qui appelle :',
        options: ['Who’s calling, please?', 'Who are you here?', 'What is your call?'],
        answer: 'Who’s calling, please?',
      },
      {
        q: '« Je vous mets en relation » se dit :',
        options: ['I’ll put you through.', 'I put you the line.', 'I connect you inside.'],
        answer: 'I’ll put you through.',
      },
    ],
    comprehension: {
      kind: 'dialogue',
      title: 'A phone call',
      intro: 'Un appel entrant à l’accueil.',
      turns: [
        { speaker: 'Receptionist', en: 'Good morning, Nexa, how can I help?', fr: 'Bonjour, Nexa, en quoi puis-je vous aider ?' },
        { speaker: 'Caller', en: 'Hello, could I speak to Mr. Diaz, please?', fr: 'Bonjour, pourrais-je parler à M. Diaz ?' },
        { speaker: 'Receptionist', en: 'I’m afraid he’s in a meeting. Can I take a message?', fr: 'Je crains qu’il soit en réunion. Puis-je prendre un message ?' },
        { speaker: 'Caller', en: 'Yes, please ask him to call me back this afternoon.', fr: 'Oui, demandez-lui de me rappeler cet après-midi.' },
      ],
      questions: [
        { q: 'Who does the caller want?', options: ['Mr. Diaz', 'The receptionist', 'Ms. Nexa'], answer: 'Mr. Diaz' },
        { q: 'Why can’t he take the call?', options: ['He’s in a meeting', 'He’s on holiday', 'He left the company'], answer: 'He’s in a meeting' },
        { q: 'What does the caller ask for?', options: ['A call back', 'An email', 'A meeting'], answer: 'A call back' },
      ],
    },
  },

  // ───────────────────────────────────────────────────────── Prise de parole
  {
    id: 'presentations',
    level: 'B2',
    category: 'Prise de parole',
    t: 'V',
    title: 'Présentations',
    goal: 'Structurer un exposé : intro, transitions, données, conclusion.',
    intro:
      'Une présentation efficace guide l’auditoire : annonce le plan, relie les idées et met en avant les chiffres clés.',
    formsTitle: 'Structurer un exposé',
    forms: [
      ['Today I’d like to talk about…', 'Aujourd’hui, j’aimerais parler de…'],
      ['First… then… finally…', 'D’abord… ensuite… enfin…'],
      ['As you can see on this slide…', 'Comme vous le voyez sur cette diapo…'],
      ['This brings me to my next point.', 'Cela m’amène à mon point suivant.'],
      ['To conclude,…', 'Pour conclure,…'],
    ],
    examples: [
      ['Today I’d like to walk you through our Q3 results.', 'Aujourd’hui, je vais vous présenter nos résultats du T3.'],
      ['As you can see, sales rose by 12%.', 'Comme vous le voyez, les ventes ont augmenté de 12 %.'],
      ['To conclude, I’d recommend we invest in this market.', 'Pour conclure, je recommande d’investir sur ce marché.'],
    ],
    practice: [
      { en: 'Today I’d like to talk about our results.', fr: 'Aujourd’hui, j’aimerais parler de nos résultats.', hint: 'talk' },
      { en: 'As you can see on this slide, sales rose.', fr: 'Comme vous le voyez sur cette diapo, les ventes ont augmenté.', hint: 'slide' },
      { en: 'This brings me to my next point.', fr: 'Cela m’amène à mon point suivant.', hint: 'brings' },
      { en: 'Let me give you an example.', fr: 'Laissez-moi vous donner un exemple.', hint: 'example' },
      { en: 'Sales increased by twelve percent.', fr: 'Les ventes ont augmenté de douze pour cent.', hint: 'increased' },
      { en: 'To conclude, I have three recommendations.', fr: 'Pour conclure, j’ai trois recommandations.', hint: 'conclude' },
      { en: 'Are there any questions?', fr: 'Y a-t-il des questions ?', hint: 'questions' },
    ],
    drills: [
      {
        q: 'Pour annoncer le sujet :',
        options: ['Today I’d like to talk about…', 'Now I say you about…', 'The subject is going…'],
        answer: 'Today I’d like to talk about…',
      },
      {
        q: '« Les ventes ont augmenté de 12 % » se dit :',
        options: ['Sales rose by 12%.', 'Sales are up of 12%.', 'Sales grow to 12 percents.'],
        answer: 'Sales rose by 12%.',
      },
    ],
    comprehension: {
      kind: 'text',
      title: 'Opening a presentation',
      intro: 'Le début d’une présentation de résultats.',
      text:
        'Good morning, everyone, and thank you for coming. Today I’d like to walk you through our third-quarter results. First, I’ll cover our sales figures, then our main challenges, and finally my recommendations for next year. As you can see on this first slide, revenue grew by 12% compared to last quarter.',
      translation:
        'Bonjour à tous, merci d’être venus. Aujourd’hui je vais vous présenter nos résultats du troisième trimestre. D’abord les chiffres de vente, puis nos principaux défis, et enfin mes recommandations pour l’an prochain. Comme vous le voyez sur cette première diapo, le chiffre d’affaires a progressé de 12 % par rapport au trimestre précédent.',
      questions: [
        { q: 'What is the presentation about?', options: ['Q3 results', 'A new hire', 'An office move'], answer: 'Q3 results' },
        { q: 'What comes last in the plan?', options: ['Recommendations', 'Sales figures', 'Challenges'], answer: 'Recommendations' },
        { q: 'How much did revenue grow?', options: ['12%', '20%', '2%'], answer: '12%' },
      ],
    },
  },

  // ───────────────────────────────────────────────────────── Négociation
  {
    id: 'negotiation',
    level: 'C1',
    category: 'Négociation',
    t: 'V',
    title: 'Négociation',
    goal: 'Proposer, nuancer, faire des concessions et conclure un accord.',
    intro:
      'Négocier en anglais demande du tact : formuler des conditions, proposer des compromis et savoir dire non poliment.',
    formsTitle: 'Langage de la négociation',
    forms: [
      ['We’d be willing to… if…', 'Nous serions prêts à… si…'],
      ['That’s a bit too high for us.', 'C’est un peu trop élevé pour nous.'],
      ['Could we meet halfway?', 'Pourrions-nous couper la poire en deux ?'],
      ['On one condition…', 'À une condition…'],
      ['I think we have a deal.', 'Je crois que nous avons un accord.'],
    ],
    examples: [
      ['We’d be willing to lower the price if you order more.', 'Nous baisserions le prix si vous commandez davantage.'],
      ['I’m afraid that’s a bit too high for us.', 'Je crains que ce soit un peu trop élevé pour nous.'],
      ['Could we meet halfway at 8%?', 'Pourrions-nous couper la poire en deux à 8 % ?'],
    ],
    practice: [
      { en: 'We’d be willing to lower the price.', fr: 'Nous serions prêts à baisser le prix.', hint: 'lower' },
      { en: 'That’s a bit too high for us.', fr: 'C’est un peu trop élevé pour nous.', hint: 'high' },
      { en: 'Could we meet halfway?', fr: 'Pourrions-nous couper la poire en deux ?', hint: 'halfway' },
      { en: 'We can agree on one condition.', fr: 'Nous pouvons accepter à une condition.', hint: 'condition' },
      { en: 'Let me make you a counter-offer.', fr: 'Laissez-moi vous faire une contre-proposition.', hint: 'counter-offer' },
      { en: 'I think we have a deal.', fr: 'Je crois que nous avons un accord.', hint: 'deal' },
      { en: 'Let’s put that in writing.', fr: 'Mettons cela par écrit.', hint: 'writing' },
    ],
    drills: [
      {
        q: 'Pour proposer un compromis :',
        options: ['Could we meet halfway?', 'Give me the half now.', 'We cut the pear.'],
        answer: 'Could we meet halfway?',
      },
      {
        q: '« C’est un peu trop élevé pour nous » se dit :',
        options: ['That’s a bit too high for us.', 'That is a big high to us.', 'It’s too much high for we.'],
        answer: 'That’s a bit too high for us.',
      },
    ],
    comprehension: {
      kind: 'dialogue',
      title: 'Closing a deal',
      intro: 'Fin d’une négociation entre un acheteur et un fournisseur.',
      turns: [
        { speaker: 'Buyer', en: 'Your quote is a bit too high for our budget.', fr: 'Votre devis est un peu trop élevé pour notre budget.' },
        { speaker: 'Supplier', en: 'We’d be willing to give 8% off if you sign a two-year contract.', fr: 'Nous accorderions 8 % de remise si vous signez sur deux ans.' },
        { speaker: 'Buyer', en: 'Could we meet halfway — 10% off for two years?', fr: 'Pourrions-nous couper la poire en deux — 10 % sur deux ans ?' },
        { speaker: 'Supplier', en: 'Let’s say 9%. I think we have a deal.', fr: 'Disons 9 %. Je crois que nous avons un accord.' },
      ],
      questions: [
        { q: 'What is the problem for the buyer?', options: ['The price is too high', 'The delivery is late', 'The quality is low'], answer: 'The price is too high' },
        { q: 'What does the supplier ask in return?', options: ['A two-year contract', 'A bigger team', 'An advance payment'], answer: 'A two-year contract' },
        { q: 'What discount do they agree on?', options: ['9%', '8%', '10%'], answer: '9%' },
      ],
    },
  },

  // ───────────────────────────────────────────────────────── Relationnel
  {
    id: 'small-talk',
    level: 'B1',
    category: 'Relationnel',
    t: 'V',
    title: 'Small talk',
    goal: 'Briser la glace avant/après une réunion, sans faux pas.',
    intro:
      'Le small talk crée du lien : parler du voyage, de la météo, du week-end. On reste léger et positif, sans sujets sensibles.',
    formsTitle: 'Amorces de conversation',
    forms: [
      ['How was your trip?', 'Comment s’est passé votre voyage ?'],
      ['How’s it going?', 'Comment ça va ?'],
      ['Did you have a good weekend?', 'Vous avez passé un bon week-end ?'],
      ['I’ve heard a lot about you.', 'On m’a beaucoup parlé de vous.'],
      ['Anyway, we should get down to business.', 'Bref, passons aux choses sérieuses.'],
    ],
    examples: [
      ['How was your trip? No delays, I hope.', 'Comment s’est passé votre voyage ? Pas de retard, j’espère.'],
      ['The weather’s been lovely lately, hasn’t it?', 'Le temps est agréable ces derniers jours, non ?'],
      ['Anyway, shall we get down to business?', 'Bref, on passe aux choses sérieuses ?'],
    ],
    practice: [
      { en: 'How was your trip?', fr: 'Comment s’est passé votre voyage ?', hint: 'trip' },
      { en: 'Did you have a good weekend?', fr: 'Vous avez passé un bon week-end ?', hint: 'weekend' },
      { en: 'The weather is lovely today.', fr: 'Le temps est agréable aujourd’hui.', hint: 'weather' },
      { en: 'I’ve heard a lot about you.', fr: 'On m’a beaucoup parlé de vous.', hint: 'heard' },
      { en: 'How’s the new office?', fr: 'Comment sont les nouveaux bureaux ?', hint: 'office' },
      { en: 'Anyway, let’s get down to business.', fr: 'Bref, passons aux choses sérieuses.', hint: 'business' },
      { en: 'It was great catching up.', fr: 'Ça faisait plaisir de se revoir.', hint: 'catching' },
    ],
    drills: [
      {
        q: 'Pour lancer une conversation légère :',
        options: ['Did you have a good weekend?', 'What is your salary?', 'Why are you late?'],
        answer: 'Did you have a good weekend?',
      },
      {
        q: 'Pour passer du small talk au sujet sérieux :',
        options: ['Anyway, let’s get down to business.', 'Stop talking, work now.', 'Enough, the business.'],
        answer: 'Anyway, let’s get down to business.',
      },
    ],
    comprehension: {
      kind: 'dialogue',
      title: 'Before the meeting',
      intro: 'Quelques mots échangés avant le début d’une réunion.',
      turns: [
        { speaker: 'Sam', en: 'Hi Priya, how was your trip to Berlin?', fr: 'Salut Priya, comment s’est passé ton voyage à Berlin ?' },
        { speaker: 'Priya', en: 'Great, thanks! The conference was really useful.', fr: 'Super, merci ! La conférence était vraiment utile.' },
        { speaker: 'Sam', en: 'Glad to hear it. Did you have time to explore the city?', fr: 'Content de l’entendre. Tu as eu le temps de visiter ?' },
        { speaker: 'Priya', en: 'A little. Anyway, shall we get down to business?', fr: 'Un peu. Bref, on passe aux choses sérieuses ?' },
      ],
      questions: [
        { q: 'Where did Priya travel?', options: ['Berlin', 'Paris', 'Madrid'], answer: 'Berlin' },
        { q: 'How was the conference?', options: ['Useful', 'Boring', 'Cancelled'], answer: 'Useful' },
        { q: 'What does Priya suggest at the end?', options: ['Start the meeting', 'Take a break', 'Go home'], answer: 'Start the meeting' },
      ],
    },
  },

  // ───────────────────────────────────────────────────────── Carrière
  {
    id: 'interviews',
    level: 'B2',
    category: 'Carrière',
    t: 'V',
    title: 'Entretien d’embauche',
    goal: 'Se vendre : parcours, forces, motivation, questions à poser.',
    intro:
      'En entretien, mets en valeur ton expérience avec des exemples concrets et montre ta motivation pour le poste.',
    formsTitle: 'Réussir l’entretien',
    forms: [
      ['I have five years of experience in…', 'J’ai cinq ans d’expérience en…'],
      ['My greatest strength is…', 'Ma plus grande force est…'],
      ['In my previous role, I…', 'Dans mon poste précédent, j’ai…'],
      ['I’m really motivated by…', 'Je suis vraiment motivé par…'],
      ['What would a typical day look like?', 'À quoi ressemble une journée type ?'],
    ],
    examples: [
      ['In my previous role, I led a team of eight.', 'Dans mon poste précédent, j’ai dirigé une équipe de huit personnes.'],
      ['My greatest strength is problem-solving.', 'Ma plus grande force est la résolution de problèmes.'],
      ['I’m really motivated by working in a fast-paced team.', 'Je suis motivé par le travail dans une équipe dynamique.'],
    ],
    practice: [
      { en: 'I have five years of experience in marketing.', fr: 'J’ai cinq ans d’expérience en marketing.', hint: 'experience' },
      { en: 'My greatest strength is problem-solving.', fr: 'Ma plus grande force est la résolution de problèmes.', hint: 'strength' },
      { en: 'In my previous role, I led a small team.', fr: 'Dans mon poste précédent, j’ai dirigé une petite équipe.', hint: 'role' },
      { en: 'I’m really motivated by this position.', fr: 'Je suis vraiment motivé par ce poste.', hint: 'motivated' },
      { en: 'I work well under pressure.', fr: 'Je travaille bien sous pression.', hint: 'pressure' },
      { en: 'What would a typical day look like?', fr: 'À quoi ressemble une journée type ?', hint: 'typical' },
      { en: 'When can I expect to hear back?', fr: 'Quand puis-je espérer un retour ?', hint: 'back' },
    ],
    drills: [
      {
        q: 'Pour parler d’une expérience passée :',
        options: ['In my previous role, I…', 'In my old work I do…', 'Before, I am doing…'],
        answer: 'In my previous role, I…',
      },
      {
        q: 'Bonne question à poser au recruteur :',
        options: ['What would a typical day look like?', 'How much holiday first?', 'Can I leave early always?'],
        answer: 'What would a typical day look like?',
      },
    ],
    comprehension: {
      kind: 'dialogue',
      title: 'The interview',
      intro: 'Un extrait d’entretien d’embauche.',
      turns: [
        { speaker: 'Recruiter', en: 'Tell me about your experience.', fr: 'Parlez-moi de votre expérience.' },
        { speaker: 'Candidate', en: 'I have five years in project management. In my previous role, I led a team of six.', fr: 'J’ai cinq ans en gestion de projet. Dans mon poste précédent, j’ai dirigé une équipe de six.' },
        { speaker: 'Recruiter', en: 'What’s your greatest strength?', fr: 'Quelle est votre plus grande force ?' },
        { speaker: 'Candidate', en: 'Staying calm under pressure and keeping the team focused.', fr: 'Rester calme sous pression et garder l’équipe concentrée.' },
      ],
      questions: [
        { q: 'How many years of experience does the candidate have?', options: ['Five', 'Six', 'Two'], answer: 'Five' },
        { q: 'How big was the team they led?', options: ['Six', 'Five', 'Sixteen'], answer: 'Six' },
        { q: 'What is their greatest strength?', options: ['Staying calm under pressure', 'Writing code', 'Public speaking'], answer: 'Staying calm under pressure' },
      ],
    },
  },
];

// Catégories dans l'ordre d'apparition (pour regrouper l'affichage).
export const BUSINESS_CATEGORIES: readonly string[] = [...new Set(BUSINESS_MODULES.map((m) => m.category))];
