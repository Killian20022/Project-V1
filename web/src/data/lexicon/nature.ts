// La nature & l’environnement — 9 mots.
// Dédoublonné par `bun dedupe-lexicon.ts` : un mot ne vit que dans un seul thème.
import type { Theme } from '../../lib/lexicon';

export const THEME_NATURE: Theme = {
  key: 'nature',
  domain: 'monde',
  label: 'La nature & l’environnement',
  blurb: 'Le climat, l’écologie, les ressources.',
  target: 160,
  words: [
    { w: 'climate', pos: 'n', fr: 'climat', cefr: 'B2', ex: { en: 'Climate change is real.', fr: 'Le changement climatique est réel.' } },
    { w: 'pollution', pos: 'n', fr: 'pollution', cefr: 'B2', ex: { en: 'Pollution is a serious problem.', fr: 'La pollution est un problème grave.' } },
    { w: 'nature', pos: 'n', fr: 'nature', cefr: 'B2', ex: { en: 'We need to protect nature.', fr: 'Nous devons protéger la nature.' } },
    { w: 'planet', pos: 'n', fr: 'planète', cefr: 'B2', ex: { en: 'We must protect the planet.', fr: 'Nous devons protéger la planète.' } },
    { w: 'waste', pos: 'n', fr: 'déchets', cefr: 'B2', ex: { en: 'They recycle their waste.', fr: 'Ils recyclent leurs déchets.' } },
    { w: 'energy', pos: 'n', fr: 'énergie', cefr: 'B2', ex: { en: 'We should save energy.', fr: 'Nous devrions économiser l\'énergie.' } },
    { w: 'recycle', pos: 'n', fr: 'recycler', cefr: 'B2', ex: { en: 'They recycle their waste.', fr: 'Ils recyclent leurs déchets.' } },
    { w: 'protect', pos: 'v', fr: 'protéger', cefr: 'B2', ex: { en: 'We must protect the planet.', fr: 'Nous devons protéger la planète.' } },
    { w: 'global warming', pos: 'phr', fr: 'réchauffement climatique', cefr: 'B2', ex: { en: 'Global warming affects everyone.', fr: 'Le réchauffement affecte tout le monde.' } },
  ],
};
