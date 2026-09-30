// Le numérique & Internet — 8 mots.
// Dédoublonné par `bun dedupe-lexicon.ts` : un mot ne vit que dans un seul thème.
import type { Theme } from '../../lib/lexicon';

export const THEME_NUMERIQUE: Theme = {
  key: 'numerique',
  domain: 'debrouille',
  label: 'Le numérique & Internet',
  blurb: 'Les appareils, les comptes, les pannes.',
  target: 180,
  words: [
    { w: 'computer', pos: 'n', fr: 'ordinateur', cefr: 'B1', ex: { en: 'I use my computer every day.', fr: 'J\'utilise mon ordinateur tous les jours.' } },
    { w: 'internet', pos: 'n', fr: 'internet', cefr: 'B1', ex: { en: 'The internet is down again.', fr: 'Internet est encore en panne.' } },
    { w: 'website', pos: 'n', fr: 'site web', cefr: 'B1', ex: { en: 'The website is not working.', fr: 'Le site web ne fonctionne pas.' } },
    { w: 'message', pos: 'n', fr: 'message', cefr: 'B1', ex: { en: 'I left you a message this morning.', fr: 'Je t’ai laissé un message ce matin.' } },
    { w: 'screen', pos: 'n', fr: 'écran', cefr: 'B1', ex: { en: 'The screen is too bright.', fr: 'L\'écran est trop lumineux.' } },
    { w: 'app', pos: 'n', fr: 'application', cefr: 'B1', ex: { en: 'Download the app first.', fr: 'Télécharge d\'abord l\'application.' } },
    { w: 'password', pos: 'n', fr: 'mot de passe', cefr: 'B1', ex: { en: 'I forgot my password.', fr: 'J\'ai oublié mon mot de passe.' } },
    { w: 'file', pos: 'n', fr: 'fichier', cefr: 'B1', ex: { en: 'Save the file before you leave.', fr: 'Enregistre le fichier avant de partir.' } },
  ],
};
