import { useEffect, useRef } from 'react';
import { Coins, ShoppingBag, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SHOP } from '@/data/shop';
import { TROPHIES, type Trophy } from '@/lib/trophies';
import { createGalaxy } from '@/lib/galaxy';
import { LEVELS, lessonCount } from '@/lib/content';
import type { GameState, Page } from '../types';

const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;
const SHOP_MAP = Object.fromEntries(SHOP.map((s) => [s.id, s]));
const MAX_PER_ITEM = 5;
const ITEM_H = 46;

// Taille d'affichage par article dans l'armurerie.
const SIZE: Record<string, number> = {
  atat: 96, xwing: 60, tie: 58, bantha: 70, rancor: 54, chewie: 56, boba: 52, stormtrooper: 52,
};
const sizeOf = (id: string) => SIZE[id] ?? ITEM_H;

// ---- Déblocage progressif des zones selon les missions d'anglais réussies ----
const INITIAL = [6, 7, 8, 11, 12, 13, 16, 17, 18];
const EXPAND = [1, 2, 3, 9, 14, 19, 23, 22, 21, 15, 10, 5, 0, 4, 24, 20];
const MISSIONS_PER_ZONE = 2;
function computeUnlock(totalDone: number) {
  const extra = Math.floor(totalDone / MISSIONS_PER_ZONE);
  const unlocked = new Set<number>(INITIAL);
  for (let i = 0; i < Math.min(extra, EXPAND.length); i++) unlocked.add(EXPAND[i]);
  const allOpen = unlocked.size >= 25;
  const nextIn = MISSIONS_PER_ZONE - (totalDone % MISSIONS_PER_ZONE);
  const lockLabel = allOpen ? 'Zone légendaire' : `Termine ${nextIn} mission${nextIn > 1 ? 's' : ''} pour débloquer`;
  return { unlocked, lockLabel };
}

function randomSpot(): { x: number; y: number } {
  return { x: 10 + Math.random() * 80, y: 20 + Math.random() * 68 };
}

// Vignette d'article (armurerie), image pré-détourée à hauteur fixe.
function Chip({ id, size = ITEM_H }: { id: string; size?: number }) {
  return (
    <img
      src={asset(`chip_${id}.png`)}
      alt=""
      style={{ height: size, width: 'auto', imageRendering: 'pixelated' }}
      draggable={false}
    />
  );
}

export function countOwned(state: GameState, id: string) {
  return (state.placed ?? []).filter((p) => p.id === id).length;
}

export function IslandPage({ state, navigate }: { state: GameState; navigate: (page: Page) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReturnType<typeof createGalaxy> | null>(null);

  const totalDone = LEVELS.reduce((s, lv) => s + Math.min(state.lessons[lv] ?? 0, lessonCount(lv)), 0);
  const { unlocked, lockLabel } = computeUnlock(totalDone);
  const openCount = unlocked.size;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const owned = (state.placed ?? []).map((p) => p.id);
    const eng = createGalaxy(canvas, { baseUrl: import.meta.env.BASE_URL, unlocked, lockLabel, owned });
    engineRef.current = eng;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const measure = () => {
      const r = wrap.getBoundingClientRect();
      eng.resize(dpr, Math.max(1, r.width), Math.max(1, r.height));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    const r = wrap.getBoundingClientRect();
    eng.start(dpr, Math.max(1, r.width), Math.max(1, r.height));
    return () => {
      ro.disconnect();
      eng.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const next = computeUnlock(totalDone);
    engineRef.current?.setUnlocked(next.unlocked, next.lockLabel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalDone]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ton monde Endor</h1>
          <p className="text-muted-foreground">
            Explore la galaxie — glisse pour te déplacer, molette pour zoomer. Chaque mission d'anglais réussie débloque de nouveaux territoires 🌌
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('shop')}>
          <ShoppingBag /> Armurerie
        </Button>
      </div>

      <div
        ref={wrapRef}
        className="relative aspect-square w-full touch-none overflow-hidden rounded-2xl border border-border bg-[#061a24] shadow-xl shadow-black/40"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ touchAction: 'none' }} />
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl bg-background/70 px-4 py-2 text-sm font-semibold backdrop-blur">
          {openCount} / 25 territoires ouverts
        </div>
        <div className="pointer-events-none absolute right-4 top-4 rounded-xl bg-background/70 px-3 py-1.5 text-xs font-semibold backdrop-blur">
          {lockLabel}
        </div>
      </div>
    </div>
  );
}

export function ShopPage({
  state,
  setState,
}: {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
}) {
  function buy(id: string, price: number) {
    setState((current) => {
      const count = (current.placed ?? []).filter((p) => p.id === id).length;
      if (count >= MAX_PER_ITEM || current.coins < price) return current;
      const k = `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const { x, y } = randomSpot();
      return { ...current, coins: current.coins - price, placed: [...(current.placed ?? []), { k, id, x, y }] };
    });
  }

  const groups: { title: string; kind: 'char' | 'decor' }[] = [
    { title: 'Escouade', kind: 'char' },
    { title: 'Véhicules & créatures', kind: 'decor' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Armurerie</h1>
          <p className="text-muted-foreground">Transforme tes victoires en escouade et en véhicules pour ta base Endor.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 font-semibold">
          <Coins className="text-amber-400" /> {state.coins} crédits
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.kind}>
          <h2 className="mb-3 text-lg font-semibold">{group.title}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {SHOP.filter((item) => item.kind === group.kind).map((item) => {
              const count = countOwned(state, item.id);
              const maxed = count >= MAX_PER_ITEM;
              const canBuy = !maxed && state.coins >= item.price;
              return (
                <Card key={item.id} className={count > 0 ? 'border-primary/50' : ''}>
                  <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                    <div className="grid h-24 w-full place-items-center rounded-xl bg-gradient-to-b from-[#f5c518]/10 to-transparent">
                      <div className={count > 0 && item.kind === 'char' ? 'eq-bob' : ''}>
                        <Chip id={item.id} size={sizeOf(item.id)} />
                      </div>
                    </div>
                    <div className="font-semibold">{item.name}</div>
                    {item.blurb && <div className="text-[11px] text-primary">{item.blurb}</div>}
                    <div className="text-[11px] text-muted-foreground">
                      {count}/{MAX_PER_ITEM} possédés
                    </div>
                    {maxed ? (
                      <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                        <Check className="size-4" /> Max atteint
                      </div>
                    ) : (
                      <Button size="sm" className="w-full" disabled={!canBuy} onClick={() => buy(item.id, item.price)}>
                        {canBuy ? <Coins /> : <Lock />} {item.price}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const TIER_RING: Record<Trophy['tier'], string> = {
  bronze: 'ring-amber-700/50',
  silver: 'ring-slate-400/50',
  gold: 'ring-yellow-400/60',
};

export function TrophiesPage({ state }: { state: GameState }) {
  const categories = [...new Set(TROPHIES.map((t) => t.category))];
  const unlockedCount = TROPHIES.filter((t) => t.progress(state) >= t.goal).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Médailles</h1>
        <p className="text-muted-foreground">
          {unlockedCount}/{TROPHIES.length} débloquées — tes hauts faits à travers la galaxie.
        </p>
      </div>

      {categories.map((category) => (
        <div key={category}>
          <h2 className="mb-3 text-lg font-semibold">{category}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TROPHIES.filter((t) => t.category === category).map((trophy) => {
              const progress = trophy.progress(state);
              const unlocked = progress >= trophy.goal;
              const pct = Math.min(100, Math.round((progress / trophy.goal) * 100));
              return (
                <Card key={trophy.id} className={unlocked ? `ring-1 ${TIER_RING[trophy.tier]}` : 'opacity-80'}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-2xl ${
                        unlocked ? 'bg-primary/15' : 'bg-secondary grayscale'
                      }`}
                    >
                      {trophy.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 font-semibold">
                        {trophy.name}
                        {unlocked && <Check className="size-4 text-primary" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{trophy.desc}</div>
                      {!unlocked && (
                        <div className="mt-2">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            {Math.min(progress, trophy.goal)}/{trophy.goal}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
