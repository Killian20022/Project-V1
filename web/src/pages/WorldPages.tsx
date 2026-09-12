import { useRef, useState } from 'react';
import { Coins, ShoppingBag, Check, Lock, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SHOP } from '@/data/shop';
import { TROPHIES, type Trophy } from '@/lib/trophies';
import type { GameState, Page } from '../types';

const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;
const SHOP_MAP = Object.fromEntries(SHOP.map((s) => [s.id, s]));
const MAX_PER_ITEM = 5;

// Tailles de frame pour les personnages (spritesheets) — pour n'afficher qu'une image
const CHAR_FRAME: Record<string, number> = { chicken: 16, farmer: 48, cow: 32 };

// Rendu à taille uniforme (~46px de haut) pour tous les objets
function UniformSprite({ id, file }: { id: string; file: string }) {
  const frame = CHAR_FRAME[id];
  if (frame) {
    return (
      <div
        style={{
          width: frame,
          height: frame,
          backgroundImage: `url(${asset(file)})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '0 0',
          imageRendering: 'pixelated',
          transform: `scale(${46 / frame})`,
          transformOrigin: 'bottom center',
        }}
      />
    );
  }
  return <img src={asset(file)} alt="" style={{ height: 46, width: 'auto', imageRendering: 'pixelated' }} draggable={false} />;
}

export function countOwned(state: GameState, id: string) {
  return (state.placed ?? []).filter((p) => p.id === id).length;
}

// Emplacements des objets achetés, en % de la carte (posés sur les terres, hors décor)
const ISLAND_POS: [number, number][] = [
  [22, 30], [15, 40], [31, 36], [52, 20], [66, 34],
  [70, 22], [66, 64], [80, 74], [58, 82], [86, 62], [18, 76],
];

function Sprite({ id, file, size = 56 }: { id: string; file: string; size?: number }) {
  const frame = CHAR_FRAME[id];
  if (frame) {
    return (
      <div
        style={{
          width: frame,
          height: frame,
          backgroundImage: `url(${asset(file)})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '0 0',
          imageRendering: 'pixelated',
          transform: `scale(${size / frame})`,
          transformOrigin: 'bottom center',
        }}
      />
    );
  }
  return <img src={asset(file)} alt="" style={{ width: size, imageRendering: 'pixelated' }} draggable={false} />;
}

export function IslandPage({
  state,
  setState,
  navigate,
}: {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  navigate: (page: Page) => void;
}) {
  const placed = state.placed ?? [];
  const sceneRef = useRef<HTMLDivElement>(null);
  const [dragK, setDragK] = useState<string | null>(null);
  const [local, setLocal] = useState<Record<string, { x: number; y: number }>>({});

  function onMove(e: React.PointerEvent) {
    if (!dragK || !sceneRef.current) return;
    const r = sceneRef.current.getBoundingClientRect();
    const x = Math.min(96, Math.max(4, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(92, Math.max(12, ((e.clientY - r.top) / r.height) * 100));
    setLocal((p) => ({ ...p, [dragK]: { x, y } }));
  }
  function endDrag() {
    if (!dragK) return;
    const pos = local[dragK];
    if (pos) {
      setState((s) => ({
        ...s,
        placed: (s.placed ?? []).map((pl) => (pl.k === dragK ? { ...pl, x: pos.x, y: pos.y } : pl)),
      }));
    }
    setDragK(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mon île</h1>
          <p className="text-muted-foreground">Glisse tes objets pour les placer où tu veux. ✋</p>
        </div>
        <Button variant="outline" onClick={() => navigate('shop')}>
          <ShoppingBag /> Boutique
        </Button>
      </div>

      <div
        ref={sceneRef}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className="relative aspect-[8/5] w-full touch-none overflow-hidden rounded-2xl border border-border shadow-xl shadow-black/40"
      >
        {/* eau animée (fond) */}
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${asset('water_tile.png')})`, backgroundSize: '34px', imageRendering: 'pixelated' }}
        />
        <div
          className="eq-ripple-a absolute inset-0 opacity-25"
          style={{ backgroundImage: 'repeating-linear-gradient(96deg, transparent 0 22px, rgba(255,255,255,0.18) 22px 24px)' }}
        />
        <div
          className="eq-ripple-b absolute inset-0 opacity-15"
          style={{ backgroundImage: 'repeating-linear-gradient(92deg, transparent 0 34px, rgba(255,255,255,0.14) 34px 36px)' }}
        />

        {/* terre (calque transparent posé sur l'eau) */}
        <img
          src={asset('island_land.png')}
          alt="Ton île"
          className="absolute inset-0 h-full w-full select-none"
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />

        {/* nuages qui dérivent */}
        <div className="eq-walk-r absolute top-[6%] h-6 w-28 rounded-full bg-white/40 blur-md" style={{ animationDuration: '46s' }} />
        <div className="eq-walk-r absolute top-[30%] h-5 w-20 rounded-full bg-white/30 blur-md" style={{ animationDuration: '64s', animationDelay: '10s' }} />
        <div className="eq-walk-r absolute top-[70%] h-7 w-36 rounded-full bg-white/25 blur-md" style={{ animationDuration: '80s', animationDelay: '24s' }} />

        {/* oiseaux */}
        {[
          { top: 12, dur: 30, delay: 3 },
          { top: 20, dur: 38, delay: 14 },
        ].map((b, i) => (
          <div key={`bird-${i}`} className="eq-walk-r absolute" style={{ top: `${b.top}%`, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }}>
            <div className="eq-bob">
              <svg width="18" height="9" viewBox="0 0 18 9" fill="none">
                <path d="M1 7 Q4.5 1 8 7 Q11.5 1 17 7" stroke="rgba(20,30,45,0.55)" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        ))}

        {/* objets placés (déplaçables) */}
        {placed.map((pl) => {
          const item = SHOP_MAP[pl.id];
          if (!item) return null;
          const pos = local[pl.k] ?? { x: pl.x, y: pl.y };
          const dragging = dragK === pl.k;
          return (
            <div
              key={pl.k}
              onPointerDown={(e) => {
                e.preventDefault();
                setLocal((p) => ({ ...p, [pl.k]: { x: pl.x, y: pl.y } }));
                setDragK(pl.k);
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 select-none drop-shadow-lg ${
                dragging ? 'z-20 scale-110 cursor-grabbing' : 'cursor-grab'
              }`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, touchAction: 'none' }}
              title={`${item.name} — glisse pour déplacer`}
            >
              <div className={item.kind === 'char' && !dragging ? 'eq-bob' : ''}>
                <UniformSprite id={item.id} file={item.file} />
              </div>
            </div>
          );
        })}

        {/* panneau info */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 rounded-xl bg-background/70 px-4 py-2 text-sm font-semibold backdrop-blur">
          {placed.length} objet{placed.length > 1 ? 's' : ''} ·
          <Coins className="size-4 text-amber-400" /> {state.coins}
        </div>
        {placed.length === 0 && (
          <div className="absolute left-4 top-4 z-10 max-w-[240px] rounded-xl bg-background/80 p-3 text-xs font-semibold shadow-lg backdrop-blur">
            Gagne des pièces en faisant des leçons, puis achète des compagnons dans la boutique 🐣
          </div>
        )}
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
      const x = 28 + (count % 3) * 12 + Math.random() * 6;
      const y = 34 + Math.floor(count / 3) * 12 + Math.random() * 6;
      return { ...current, coins: current.coins - price, placed: [...(current.placed ?? []), { k, id, x, y }] };
    });
  }

  const groups: { title: string; kind: 'char' | 'decor' }[] = [
    { title: 'Compagnons', kind: 'char' },
    { title: 'Décors', kind: 'decor' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Boutique de l'île</h1>
          <p className="text-muted-foreground">Transforme tes progrès en compagnons et décors.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 font-semibold">
          <Coins className="text-amber-400" /> {state.coins} pièces
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
                    <div className="grid h-24 w-full place-items-center rounded-xl bg-gradient-to-b from-sky-300/10 to-transparent">
                      <div className={count > 0 && item.kind === 'char' ? 'eq-bob' : ''}>
                        <UniformSprite id={item.id} file={item.file} />
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
        <h1 className="text-2xl font-bold">Trophées</h1>
        <p className="text-muted-foreground">
          {unlockedCount}/{TROPHIES.length} débloqués — les étapes marquantes de ton aventure.
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
