import { SHOP } from '../data/shop';
import type { GameState } from '../types';

export type Trophy = {
  id: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold';
  icon: string;
  name: string;
  desc: string;
  goal: number;
  progress: (s: GameState) => number;
};

const lessonsDone = (s: GameState) => Object.values(s.lessons).reduce((a, b) => a + (b ?? 0), 0);
const stat = (s: GameState, k: string) => s.stats[k] ?? 0;
const owned = (s: GameState) => {
  const ids = s.placed?.length ? s.placed.map((p) => p.id) : (s.island ?? []);
  return [...new Set(ids)];
};

export const TROPHIES: Trophy[] = [
  { id: 'first', category: 'Progression', tier: 'bronze', icon: '🎓', name: 'Premiers pas', desc: 'Terminer ta 1re leçon', goal: 1, progress: lessonsDone },
  { id: 'vol10', category: 'Progression', tier: 'bronze', icon: '⭐', name: 'Sur la lancée', desc: 'Terminer 10 leçons', goal: 10, progress: lessonsDone },
  { id: 'vol25', category: 'Progression', tier: 'silver', icon: '⭐', name: 'Marathonien', desc: 'Terminer 25 leçons', goal: 25, progress: lessonsDone },
  { id: 'a1', category: 'Progression', tier: 'bronze', icon: '🏅', name: 'A1 en poche', desc: 'Terminer le niveau A1', goal: 10, progress: (s) => s.lessons.A1 ?? 0 },
  { id: 'a2', category: 'Progression', tier: 'silver', icon: '🏅', name: 'A2 en poche', desc: 'Terminer le niveau A2', goal: 10, progress: (s) => s.lessons.A2 ?? 0 },
  { id: 'b1', category: 'Progression', tier: 'silver', icon: '🏅', name: 'B1 en poche', desc: 'Terminer le niveau B1', goal: 10, progress: (s) => s.lessons.B1 ?? 0 },
  { id: 'b2', category: 'Progression', tier: 'gold', icon: '🏅', name: 'B2 en poche', desc: 'Terminer le niveau B2', goal: 10, progress: (s) => s.lessons.B2 ?? 0 },
  { id: 'c1', category: 'Progression', tier: 'gold', icon: '🏅', name: 'C1 en poche', desc: 'Terminer le niveau C1', goal: 10, progress: (s) => s.lessons.C1 ?? 0 },
  { id: 'c2', category: 'Progression', tier: 'gold', icon: '👑', name: 'Maîtrise C2', desc: 'Terminer le niveau C2', goal: 10, progress: (s) => s.lessons.C2 ?? 0 },
  { id: 'grad', category: 'Progression', tier: 'gold', icon: '🏆', name: 'Diplômé', desc: 'Terminer les 60 leçons', goal: 60, progress: lessonsDone },
  { id: 'st3', category: 'Assiduité', tier: 'bronze', icon: '🔥', name: 'Régulier', desc: '3 jours de série', goal: 3, progress: (s) => s.streak ?? 0 },
  { id: 'st7', category: 'Assiduité', tier: 'silver', icon: '🔥', name: 'Sérieux', desc: '7 jours de série', goal: 7, progress: (s) => s.streak ?? 0 },
  { id: 'st14', category: 'Assiduité', tier: 'silver', icon: '🔥', name: 'Dévoué', desc: '14 jours de série', goal: 14, progress: (s) => s.streak ?? 0 },
  { id: 'st30', category: 'Assiduité', tier: 'gold', icon: '🔥', name: 'Inarrêtable', desc: '30 jours de série', goal: 30, progress: (s) => s.streak ?? 0 },
  { id: 'st100', category: 'Assiduité', tier: 'gold', icon: '⭐', name: 'Légende', desc: '100 jours de série', goal: 100, progress: (s) => s.streak ?? 0 },
  { id: 'xp100', category: 'Expérience', tier: 'bronze', icon: '✨', name: 'Débutant', desc: 'Atteindre 100 XP', goal: 100, progress: (s) => s.points ?? 0 },
  { id: 'xp500', category: 'Expérience', tier: 'silver', icon: '✨', name: 'Appliqué', desc: 'Atteindre 500 XP', goal: 500, progress: (s) => s.points ?? 0 },
  { id: 'xp1000', category: 'Expérience', tier: 'silver', icon: '💫', name: 'Assidu', desc: 'Atteindre 1 000 XP', goal: 1000, progress: (s) => s.points ?? 0 },
  { id: 'xp5000', category: 'Expérience', tier: 'gold', icon: '💎', name: 'Expert', desc: 'Atteindre 5 000 XP', goal: 5000, progress: (s) => s.points ?? 0 },
  { id: 'xp10000', category: 'Expérience', tier: 'gold', icon: '👑', name: 'Virtuose', desc: 'Atteindre 10 000 XP', goal: 10000, progress: (s) => s.points ?? 0 },
  { id: 'perf1', category: 'Performance', tier: 'bronze', icon: '🎯', name: 'Sans faute', desc: '1 leçon parfaite (100%)', goal: 1, progress: (s) => stat(s, 'perfect') },
  { id: 'perf10', category: 'Performance', tier: 'gold', icon: '🎯', name: 'Perfectionniste', desc: '10 leçons parfaites', goal: 10, progress: (s) => stat(s, 'perfect') },
  { id: 'cb5', category: 'Performance', tier: 'bronze', icon: '⚡', name: 'Combo x5', desc: 'Enchaîner 5 bonnes réponses', goal: 5, progress: (s) => stat(s, 'bestCombo') },
  { id: 'cb10', category: 'Performance', tier: 'silver', icon: '⚡', name: 'Combo x10', desc: 'Enchaîner 10 bonnes réponses', goal: 10, progress: (s) => stat(s, 'bestCombo') },
  { id: 'cb20', category: 'Performance', tier: 'gold', icon: '⚡', name: 'Combo x20', desc: 'Enchaîner 20 bonnes réponses', goal: 20, progress: (s) => stat(s, 'bestCombo') },
  { id: 'cor100', category: 'Performance', tier: 'silver', icon: '📚', name: 'Studieux', desc: '100 bonnes réponses', goal: 100, progress: (s) => stat(s, 'correct') },
  { id: 'cor1000', category: 'Performance', tier: 'gold', icon: '📖', name: 'Érudit', desc: '1 000 bonnes réponses', goal: 1000, progress: (s) => stat(s, 'correct') },
  { id: 'buy1', category: 'Île & Boutique', tier: 'bronze', icon: '🛒', name: 'Premier achat', desc: 'Acheter 1 objet', goal: 1, progress: (s) => owned(s).length },
  { id: 'farm', category: 'Île & Boutique', tier: 'silver', icon: '🐔', name: 'Basse-cour', desc: 'Posséder poule + vache', goal: 2, progress: (s) => ['chicken', 'cow'].filter((x) => owned(s).includes(x)).length },
  { id: 'collec', category: 'Île & Boutique', tier: 'gold', icon: '🐄', name: 'Collectionneur', desc: 'Posséder les 3 personnages', goal: 3, progress: (s) => ['chicken', 'cow', 'farmer'].filter((x) => owned(s).includes(x)).length },
  { id: 'island', category: 'Île & Boutique', tier: 'gold', icon: '🏆', name: 'Île complète', desc: 'Posséder tous les objets', goal: SHOP.length, progress: (s) => owned(s).length },
  { id: 'coin2k', category: 'Île & Boutique', tier: 'silver', icon: '💰', name: 'Économe', desc: 'Gagner 2 000 pièces', goal: 2000, progress: (s) => stat(s, 'coinsEarned') },
  { id: 'coin10k', category: 'Île & Boutique', tier: 'gold', icon: '💰', name: 'Fortune', desc: 'Gagner 10 000 pièces', goal: 10000, progress: (s) => stat(s, 'coinsEarned') },
];
