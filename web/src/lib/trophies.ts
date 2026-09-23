import { SHOP_MAP } from '../data/shop';
import { lessonCount, TOTAL_LESSONS } from './content';
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
const placedOf = (s: GameState) => (s.placed ?? []).filter((p) => SHOP_MAP[p.id]);
const countCat = (s: GameState, cat: string) => placedOf(s).filter((p) => SHOP_MAP[p.id].category === cat).length;
const factionsOwned = (s: GameState) =>
  new Set(placedOf(s).filter((p) => SHOP_MAP[p.id].category === 'soldats').map((p) => SHOP_MAP[p.id].faction)).size;

export const TROPHIES: Trophy[] = [
  { id: 'first', category: 'Progression', tier: 'bronze', icon: '🎓', name: 'Premiers pas', desc: 'Terminer ta 1re leçon', goal: 1, progress: lessonsDone },
  { id: 'vol10', category: 'Progression', tier: 'bronze', icon: '⭐', name: 'Sur la lancée', desc: 'Terminer 10 leçons', goal: 10, progress: lessonsDone },
  { id: 'vol25', category: 'Progression', tier: 'silver', icon: '⭐', name: 'Marathonien', desc: 'Terminer 25 leçons', goal: 25, progress: lessonsDone },
  { id: 'a1', category: 'Progression', tier: 'bronze', icon: '🏅', name: 'A1 en poche', desc: 'Terminer le niveau A1', goal: lessonCount('A1'), progress: (s) => s.lessons.A1 ?? 0 },
  { id: 'a2', category: 'Progression', tier: 'silver', icon: '🏅', name: 'A2 en poche', desc: 'Terminer le niveau A2', goal: lessonCount('A2'), progress: (s) => s.lessons.A2 ?? 0 },
  { id: 'b1', category: 'Progression', tier: 'silver', icon: '🏅', name: 'B1 en poche', desc: 'Terminer le niveau B1', goal: lessonCount('B1'), progress: (s) => s.lessons.B1 ?? 0 },
  { id: 'b2', category: 'Progression', tier: 'gold', icon: '🏅', name: 'B2 en poche', desc: 'Terminer le niveau B2', goal: lessonCount('B2'), progress: (s) => s.lessons.B2 ?? 0 },
  { id: 'c1', category: 'Progression', tier: 'gold', icon: '🏅', name: 'C1 en poche', desc: 'Terminer le niveau C1', goal: lessonCount('C1'), progress: (s) => s.lessons.C1 ?? 0 },
  { id: 'c2', category: 'Progression', tier: 'gold', icon: '👑', name: 'Maîtrise C2', desc: 'Terminer le niveau C2', goal: lessonCount('C2'), progress: (s) => s.lessons.C2 ?? 0 },
  { id: 'grad', category: 'Progression', tier: 'gold', icon: '🏆', name: 'Diplômé', desc: `Terminer les ${TOTAL_LESSONS} leçons`, goal: TOTAL_LESSONS, progress: lessonsDone },
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
  { id: 'buy1', category: 'Royaume & Marché', tier: 'bronze', icon: '🛒', name: 'Premier achat', desc: 'Acheter 1 objet au marché', goal: 1, progress: (s) => placedOf(s).length },
  { id: 'army10', category: 'Royaume & Marché', tier: 'silver', icon: '⚔️', name: 'Petite armée', desc: 'Recruter 10 soldats', goal: 10, progress: (s) => countCat(s, 'soldats') },
  { id: 'army25', category: 'Royaume & Marché', tier: 'gold', icon: '🛡️', name: 'Grande armée', desc: 'Recruter 25 soldats', goal: 25, progress: (s) => countCat(s, 'soldats') },
  { id: 'banners', category: 'Royaume & Marché', tier: 'gold', icon: '🚩', name: 'Cinq bannières', desc: 'Avoir des soldats des 5 couleurs', goal: 5, progress: factionsOwned },
  { id: 'village', category: 'Royaume & Marché', tier: 'silver', icon: '🏘️', name: 'Bâtisseur', desc: 'Construire 5 bâtiments', goal: 5, progress: (s) => countCat(s, 'batiments') },
  { id: 'castle', category: 'Royaume & Marché', tier: 'gold', icon: '🏰', name: 'Seigneur du château', desc: 'Construire un château', goal: 1, progress: (s) => placedOf(s).filter((p) => p.id.startsWith('chateau')).length },
  { id: 'forest', category: 'Royaume & Marché', tier: 'bronze', icon: '🌲', name: 'Forestier', desc: 'Planter 10 arbres ou buissons', goal: 10, progress: (s) => countCat(s, 'nature') },
  { id: 'flock', category: 'Royaume & Marché', tier: 'bronze', icon: '🐑', name: 'Berger', desc: 'Élever 5 moutons', goal: 5, progress: (s) => countCat(s, 'animaux') },
  { id: 'coin2k', category: 'Royaume & Marché', tier: 'silver', icon: '💰', name: 'Économe', desc: 'Gagner 2 000 pièces', goal: 2000, progress: (s) => stat(s, 'coinsEarned') },
  { id: 'coin10k', category: 'Royaume & Marché', tier: 'gold', icon: '💰', name: 'Fortune', desc: 'Gagner 10 000 pièces', goal: 10000, progress: (s) => stat(s, 'coinsEarned') },
];
