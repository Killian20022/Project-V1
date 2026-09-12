import { useEffect, useRef, useState } from 'react';
import { Coins, ShoppingBag, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SHOP } from '@/data/shop';
import { TROPHIES, type Trophy } from '@/lib/trophies';
import landMask from '@/data/landMask.json';
import type { GameState, Page } from '../types';

const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;
const SHOP_MAP = Object.fromEntries(SHOP.map((s) => [s.id, s]));
const MAX_PER_ITEM = 5;
const ITEM_H = 44; // hauteur d'affichage IDENTIQUE pour tous les objets
const CHAR_IDS = new Set(['chicken', 'farmer', 'cow']); // se déplacent tout seuls

const MASK = landMask as { cols: number; rows: number; cells: string[] };

// Une position en % (0-100) est-elle sur la terre ferme ?
function isLand(xPct: number, yPct: number) {
  const col = Math.floor((xPct / 100) * MASK.cols);
  const row = Math.floor((yPct / 100) * MASK.rows);
  if (row < 0 || row >= MASK.rows || col < 0 || col >= MASK.cols) return false;
  return MASK.cells[row]?.[col] === '1';
}

// Toutes les cases de terre (en %), pour réapparaître au hasard sur l'île
const LAND_SPOTS: { x: number; y: number }[] = [];
for (let r = 0; r < MASK.rows; r++)
  for (let c = 0; c < MASK.cols; c++)
    if (MASK.cells[r][c] === '1')
      LAND_SPOTS.push({ x: ((c + 0.5) / MASK.cols) * 100, y: ((r + 0.5) / MASK.rows) * 100 });

function randomLand(): { x: number; y: number } {
  return LAND_SPOTS[Math.floor(Math.random() * LAND_SPOTS.length)] ?? { x: 50, y: 50 };
}

// Rendu STRICTEMENT uniforme : chips pré-détourés, même hauteur pour TOUS
function Chip({ id }: { id: string }) {
  return (
    <img
      src={asset(`chip_${id}.png`)}
      alt=""
      style={{ height: ITEM_H, width: 'auto', imageRendering: 'pixelated' }}
      draggable={false}
    />
  );
}

export function countOwned(state: GameState, id: string) {
  return (state.placed ?? []).filter((p) => p.id === id).length;
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

  // position d'affichage vivante : prioritaire sur la position enregistrée
  const [live, setLive] = useState<Record<string, { x: number; y: number }>>({});
  const [dragK, setDragK] = useState<string | null>(null);
  const [drowning, setDrowning] = useState<Record<string, boolean>>({});
  const [appearing, setAppearing] = useState<Record<string, boolean>>({});

  // refs pour l'intervalle de déplacement autonome (évite les closures périmées)
  const dragRef = useRef<string | null>(null);
  const drownRef = useRef<Record<string, boolean>>({});
  const placedRef = useRef(placed);
  dragRef.current = dragK;
  drownRef.current = drowning;
  placedRef.current = placed;

  const posOf = (pl: { k: string; x: number; y: number }) => live[pl.k] ?? { x: pl.x, y: pl.y };

  // Déplacement autonome des animaux (uniquement sur la terre)
  useEffect(() => {
    const timer = window.setInterval(() => {
      setLive((prev) => {
        const next = { ...prev };
        for (const pl of placedRef.current) {
          if (!CHAR_IDS.has(pl.id)) continue;
          if (pl.k === dragRef.current || drownRef.current[pl.k]) continue;
          if (Math.random() < 0.45) continue; // pause parfois
          const base = next[pl.k] ?? { x: pl.x, y: pl.y };
          for (let tries = 0; tries < 10; tries++) {
            const nx = Math.min(94, Math.max(6, base.x + (Math.random() * 2 - 1) * 11));
            const ny = Math.min(90, Math.max(14, base.y + (Math.random() * 2 - 1) * 9));
            if (isLand(nx, ny)) {
              next[pl.k] = { x: nx, y: ny };
              break;
            }
          }
        }
        return next;
      });
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  function onMove(e: React.PointerEvent) {
    if (!dragK || !sceneRef.current) return;
    const r = sceneRef.current.getBoundingClientRect();
    const x = Math.min(96, Math.max(4, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(94, Math.max(8, ((e.clientY - r.top) / r.height) * 100));
    setLive((p) => ({ ...p, [dragK]: { x, y } }));
  }

  function endDrag() {
    const k = dragK;
    setDragK(null);
    if (!k) return;
    const pos = live[k] ?? placed.find((p) => p.k === k);
    if (!pos) return;
    if (isLand(pos.x, pos.y)) {
      // posé sur la terre : on enregistre
      setState((s) => ({
        ...s,
        placed: (s.placed ?? []).map((pl) => (pl.k === k ? { ...pl, x: pos.x, y: pos.y } : pl)),
      }));
    } else {
      // tombé dans l'eau : noyade → réapparition sur l'île
      setDrowning((d) => ({ ...d, [k]: true }));
      window.setTimeout(() => {
        const dest = randomLand();
        setLive((p) => ({ ...p, [k]: dest }));
        setDrowning((d) => {
          const n = { ...d };
          delete n[k];
          return n;
        });
        setAppearing((a) => ({ ...a, [k]: true }));
        setState((s) => ({
          ...s,
          placed: (s.placed ?? []).map((pl) => (pl.k === k ? { ...pl, x: dest.x, y: dest.y } : pl)),
        }));
        window.setTimeout(
          () =>
            setAppearing((a) => {
              const n = { ...a };
              delete n[k];
              return n;
            }),
          650,
        );
      }, 900);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mon île</h1>
          <p className="text-muted-foreground">Glisse tes objets pour les placer où tu veux. Les animaux se promènent tout seuls 🐾</p>
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
          const pos = posOf(pl);
          const isDragging = dragK === pl.k;
          const isDrowning = !!drowning[pl.k];
          const isAppearing = !!appearing[pl.k];
          const isChar = CHAR_IDS.has(pl.id);
          const smooth = isChar && !isDragging && !isDrowning && !isAppearing;
          return (
            <div
              key={pl.k}
              onPointerDown={(e) => {
                if (isDrowning) return;
                e.preventDefault();
                setLive((p) => ({ ...p, [pl.k]: posOf(pl) }));
                setDragK(pl.k);
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 select-none drop-shadow-lg ${
                isDragging ? 'z-30 scale-110 cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                touchAction: 'none',
                transition: smooth ? 'left 2.4s ease-in-out, top 2.4s ease-in-out' : 'none',
                zIndex: isDrowning ? 5 : undefined,
              }}
              title={`${item.name} — glisse pour déplacer`}
            >
              {isDrowning && (
                <div className="eq-splash pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 rounded-full border-2 border-sky-100/70" />
              )}
              <div className={`${isDrowning ? 'eq-drown' : isAppearing ? 'eq-appear' : isChar && !isDragging ? 'eq-bob' : ''}`}>
                <Chip id={pl.id} />
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
      const { x, y } = randomLand(); // apparait toujours sur la terre ferme
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
                        <Chip id={item.id} />
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
