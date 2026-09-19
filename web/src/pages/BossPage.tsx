import { useEffect, useRef, useState } from 'react';
import { Swords, Heart, Timer, X, Trophy, Skull, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LEVELS, LEVEL_INFO, sentencesFor } from '@/lib/content';
import { shuffle } from '@/lib/exercises';
import type { Level } from '../types';

const QUESTION_TIME = 15; // secondes par question
const BOSS_MAX = 100;
const PLAYER_MAX = 100;
const PLAYER_HIT = 16; // dégâts subis sur mauvaise réponse / temps écoulé

// Le boss dépend du grade affronté.
const BOSSES: Record<Level, { name: string; img: string; taunt: string }> = {
  A1: { name: 'Stormtrooper', img: 'chip_stormtrooper.png', taunt: 'Halte ! On ne passe pas.' },
  A2: { name: 'Boba Fett', img: 'chip_boba.png', taunt: 'Une prime, rien de personnel.' },
  B1: { name: 'Le Rancor', img: 'chip_rancor.png', taunt: 'GROAAAR !' },
  B2: { name: 'AT-AT', img: 'chip_atat.png', taunt: 'Cible verrouillée.' },
  C1: { name: 'Dark Vador', img: 'chip_vader.png', taunt: 'Ton manque de vocabulaire me déçoit.' },
  C2: { name: "L'Empereur", img: 'chip_vader.png', taunt: 'Tout se déroule comme je l’avais prévu.' },
};

type BossQ = { prompt: string; sub: string; options: string[]; answer: string };

function buildBossQuestion(level: Level): BossQ {
  const all = sentencesFor(level);
  const s = all[Math.floor(Math.random() * all.length)];
  const enToFr = Math.random() < 0.5;
  const others = shuffle(all.filter((x) => x.en !== s.en));

  if (enToFr) {
    const distractors: string[] = [];
    for (const o of others) {
      if (distractors.length >= 3) break;
      if (o.fr !== s.fr && !distractors.includes(o.fr)) distractors.push(o.fr);
    }
    return { prompt: s.en, sub: 'Traduis en français', options: shuffle([s.fr, ...distractors]), answer: s.fr };
  }

  const distractors: string[] = [];
  for (const o of others) {
    if (distractors.length >= 3) break;
    if (o.en !== s.en && !distractors.includes(o.en)) distractors.push(o.en);
  }
  return { prompt: s.fr, sub: 'Traduis en anglais', options: shuffle([s.en, ...distractors]), answer: s.en };
}

const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

export function BossPage({
  level,
  onExit,
  onVictory,
}: {
  level: Level;
  onExit: () => void;
  onVictory: (reward: { xp: number; coins: number }) => void;
}) {
  const boss = BOSSES[level];
  const levelIdx = Math.max(0, LEVELS.indexOf(level));
  const reward = { xp: 60 + levelIdx * 20, coins: 50 + levelIdx * 15 };

  const [q, setQ] = useState<BossQ>(() => buildBossQuestion(level));
  const [bossHp, setBossHp] = useState(BOSS_MAX);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX);
  const [picked, setPicked] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [phase, setPhase] = useState<'fight' | 'win' | 'lose'>('fight');
  const [hitFlash, setHitFlash] = useState<null | 'boss' | 'player'>(null);

  const bossRef = useRef(BOSS_MAX);
  const playerRef = useRef(PLAYER_MAX);
  const rewarded = useRef(false);

  // Décompte du temps ; à 0, la question est perdue.
  useEffect(() => {
    if (phase !== 'fight' || picked !== null) return;
    if (timeLeft <= 0) {
      resolve(null);
      return;
    }
    const id = window.setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, picked]);

  function resolve(choice: string | null) {
    if (picked !== null || phase !== 'fight') return;
    const correct = choice !== null && choice === q.answer;
    setPicked(choice ?? '__timeout__');

    if (correct) {
      const dmg = 12 + Math.round((timeLeft / QUESTION_TIME) * 8); // réponse rapide = plus de dégâts
      bossRef.current = Math.max(0, bossRef.current - dmg);
      setBossHp(bossRef.current);
      setHitFlash('boss');
    } else {
      playerRef.current = Math.max(0, playerRef.current - PLAYER_HIT);
      setPlayerHp(playerRef.current);
      setHitFlash('player');
    }

    window.setTimeout(() => {
      setHitFlash(null);
      if (bossRef.current <= 0) {
        if (!rewarded.current) {
          rewarded.current = true;
          onVictory(reward);
        }
        setPhase('win');
      } else if (playerRef.current <= 0) {
        setPhase('lose');
      } else {
        setQ(buildBossQuestion(level));
        setPicked(null);
        setTimeLeft(QUESTION_TIME);
      }
    }, 1150);
  }

  function retry() {
    bossRef.current = BOSS_MAX;
    playerRef.current = PLAYER_MAX;
    rewarded.current = false;
    setBossHp(BOSS_MAX);
    setPlayerHp(PLAYER_MAX);
    setQ(buildBossQuestion(level));
    setPicked(null);
    setTimeLeft(QUESTION_TIME);
    setPhase('fight');
  }

  if (phase === 'win' || phase === 'lose') {
    const won = phase === 'win';
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="p-8">
          <div className={`mx-auto grid h-20 w-20 place-items-center rounded-2xl ${won ? 'bg-primary/20 text-primary' : 'bg-rose-500/20 text-rose-400'}`}>
            {won ? <Trophy className="size-10" /> : <Skull className="size-10" />}
          </div>
          <h2 className="mt-4 text-2xl font-black">
            {won ? `${boss.name} est vaincu !` : `${boss.name} t'a eu...`}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {won
              ? `Beau duel, ${LEVEL_INFO[level].name}. La Force de l'anglais est avec toi.`
              : 'La prochaine fois sera la bonne. Révise et reviens plus fort.'}
          </p>
          {won && (
            <div className="mt-4 inline-flex items-center gap-4 rounded-xl bg-secondary px-5 py-3 text-sm font-semibold">
              <span className="text-primary">+{reward.xp} XP</span>
              <span className="text-accent">+{reward.coins} 🪙</span>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-2">
            {!won && (
              <Button size="lg" onClick={retry}>
                <RotateCcw /> Réessayer le duel
              </Button>
            )}
            <Button size="lg" variant={won ? 'default' : 'outline'} onClick={onExit}>
              Retour à l'accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bossPct = Math.round((bossHp / BOSS_MAX) * 100);
  const playerPct = Math.round((playerHp / PLAYER_MAX) * 100);
  const timePct = Math.round((timeLeft / QUESTION_TIME) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <Swords className="size-4" /> Duel · {LEVEL_INFO[level].name}
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          <X /> Abandonner
        </Button>
      </div>

      {/* Boss */}
      <Card className="overflow-hidden">
        <CardContent className="flex items-center gap-4 p-5">
          <img
            src={asset(boss.img)}
            alt=""
            className={`h-20 w-20 shrink-0 object-contain transition-transform ${hitFlash === 'boss' ? '-translate-y-1 scale-110' : ''}`}
            style={{ imageRendering: 'pixelated', filter: hitFlash === 'boss' ? 'brightness(1.8) drop-shadow(0 0 10px #ff5a4a)' : undefined }}
            draggable={false}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-black">{boss.name}</span>
              <span className="text-xs text-muted-foreground">{bossHp} / {BOSS_MAX}</span>
            </div>
            <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300" style={{ width: `${bossPct}%` }} />
            </div>
            <p className="mt-1 truncate text-xs italic text-muted-foreground">« {boss.taunt} »</p>
          </div>
        </CardContent>
      </Card>

      {/* Toi + timer */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-semibold"><Heart className="size-3.5 text-rose-400" /> Toi</span>
            <span className="text-muted-foreground">{playerHp} / {PLAYER_MAX}</span>
          </div>
          <div className={`mt-1 h-3 w-full overflow-hidden rounded-full bg-secondary ${hitFlash === 'player' ? 'ring-2 ring-rose-500' : ''}`}>
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-300" style={{ width: `${playerPct}%` }} />
          </div>
        </div>
        <div className="grid w-16 shrink-0 place-items-center">
          <div className="inline-flex items-center gap-1 text-sm font-bold tabular-nums">
            <Timer className="size-4 text-primary" /> {timeLeft}s
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className={`h-full rounded-full transition-all duration-500 ${timeLeft <= 5 ? 'bg-rose-500' : 'bg-primary'}`} style={{ width: `${timePct}%` }} />
          </div>
        </div>
      </div>

      {/* Question */}
      <Card>
        <CardContent className="p-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{q.sub}</div>
          <div className="mt-1 text-xl font-bold">{q.prompt}</div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {q.options.map((opt) => {
              const isAnswer = opt === q.answer;
              const isPicked = picked === opt;
              const answered = picked !== null;
              let cls = 'border-border hover:border-primary/60';
              if (answered && isAnswer) cls = 'border-emerald-500 bg-emerald-500/15';
              else if (answered && isPicked) cls = 'border-rose-500 bg-rose-500/15';
              else if (answered) cls = 'border-border opacity-60';
              return (
                <button
                  key={opt}
                  disabled={answered}
                  onClick={() => resolve(opt)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${cls}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
