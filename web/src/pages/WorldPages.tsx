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
const ITEM_H = 46; // hauteur d'affichage par défaut
const CHAR_IDS = new Set(['r2d2', 'bb8', 'stormtrooper', 'boba', 'chewie', 'yoda']); // compagnons qui se promènent
const BRIDGE_IDS = new Set<string>(); // (héritage) — plus d'eau sur Endor, rien ne flotte
const BRIDGE_H = 72;

// Hauteur d'affichage par objet. Les véhicules et grosses créatures sont plus imposants.
const SIZE: Record<string, number> = {
  atat: 96, xwing: 60, tie: 58, speeder: 56, bantha: 70, rancor: 54,
  chewie: 56, boba: 52, stormtrooper: 52,
};
const sizeOf = (id: string) => SIZE[id] ?? ITEM_H;

// Demi-dimensions (en % de la scène) de l'empreinte d'un pont, selon sa rotation.
// Sert à savoir si un point tombe « sur » un pont (zone marchable au-dessus de l'eau).
const BRIDGE_W_RATIO = 16 / 43; // ratio largeur/hauteur du chip du pont
function bridgeHalfExtentsPct(rot: number, rect: { width: number; height: number }) {
  const wpx = BRIDGE_H * BRIDGE_W_RATIO;
  const vertical = rot % 180 === 0;
  const halfWpx = (vertical ? wpx : BRIDGE_H) / 2;
  const halfHpx = (vertical ? BRIDGE_H : wpx) / 2;
  return { hx: (halfWpx / rect.width) * 100, hy: (halfHpx / rect.height) * 100 };
}

const MASK = landMask as { cols: number; rows: number; cells: string[] };

// Sur Endor, toute la scène est un sol forestier praticable : plus d'eau, donc
// tout est « terre ferme » (on garde la signature pour ne rien casser).
function isLand(_xPct: number, _yPct: number) {
  return true;
}

// Apparition / déplacement : n'importe où dans la clairière (marges évitées).
function randomLand(): { x: number; y: number } {
  return { x: 10 + Math.random() * 80, y: 20 + Math.random() * 68 };
}
// Référence conservée pour éviter un import inutilisé (masque hérité).
void MASK;

// Rendu STRICTEMENT uniforme : chips pré-détourés, même hauteur pour TOUS.
// `rot` (degrés) permet de tourner un objet (molette sur un objet sélectionné).
function Chip({ id, rot = 0, size = ITEM_H }: { id: string; rot?: number; size?: number }) {
  return (
    <img
      src={asset(`chip_${id}.png`)}
      alt=""
      style={{
        height: size,
        width: 'auto',
        imageRendering: 'pixelated',
        transform: rot ? `rotate(${rot}deg)` : undefined,
        transition: 'transform 0.15s ease',
      }}
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
  const [selectedK, setSelectedK] = useState<string | null>(null);
  const [drowning, setDrowning] = useState<Record<string, boolean>>({});
  const [appearing, setAppearing] = useState<Record<string, boolean>>({});

  // refs pour l'intervalle de déplacement autonome (évite les closures périmées)
  const dragRef = useRef<string | null>(null);
  const drownRef = useRef<Record<string, boolean>>({});
  const placedRef = useRef(placed);
  const selRef = useRef<string | null>(null);
  dragRef.current = dragK;
  drownRef.current = drowning;
  placedRef.current = placed;
  selRef.current = selectedK;

  const posOf = (pl: { k: string; x: number; y: number }) => live[pl.k] ?? { x: pl.x, y: pl.y };

  // Déplacement autonome des animaux : sur la terre OU sur un pont (les ponts
  // enjambent l'eau, donc les animaux peuvent les traverser).
  useEffect(() => {
    const timer = window.setInterval(() => {
      const rect = sceneRef.current?.getBoundingClientRect();
      setLive((prev) => {
        const next = { ...prev };
        // empreinte actuelle de chaque pont (position vivante prioritaire)
        const bridges =
          rect && rect.width && rect.height
            ? placedRef.current
                .filter((p) => BRIDGE_IDS.has(p.id))
                .map((b) => {
                  const bp = prev[b.k] ?? { x: b.x, y: b.y };
                  const { hx, hy } = bridgeHalfExtentsPct(b.rot ?? 0, rect);
                  return { x: bp.x, y: bp.y, hx, hy };
                })
            : [];
        const onBridge = (x: number, y: number) =>
          bridges.some((b) => Math.abs(x - b.x) <= b.hx && Math.abs(y - b.y) <= b.hy);
        const walkable = (x: number, y: number) => isLand(x, y) || onBridge(x, y);
        for (const pl of placedRef.current) {
          if (!CHAR_IDS.has(pl.id)) continue;
          if (pl.k === dragRef.current || drownRef.current[pl.k]) continue;
          if (Math.random() < 0.45) continue; // pause parfois
          const base = next[pl.k] ?? { x: pl.x, y: pl.y };
          for (let tries = 0; tries < 10; tries++) {
            const nx = Math.min(94, Math.max(6, base.x + (Math.random() * 2 - 1) * 11));
            const ny = Math.min(90, Math.max(14, base.y + (Math.random() * 2 - 1) * 9));
            if (walkable(nx, ny)) {
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

  // Rotation à la molette de l'objet sélectionné (décors uniquement).
  // Chaque cran = 90° → passe du vertical à l'horizontal et inversement.
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const k = selRef.current;
      if (!k) return;
      const pl = placedRef.current.find((p) => p.k === k);
      if (!pl || CHAR_IDS.has(pl.id)) return; // les animaux ne tournent pas
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      setState((s) => ({
        ...s,
        placed: (s.placed ?? []).map((p) =>
          p.k === k ? { ...p, rot: ((((p.rot ?? 0) + dir * 90) % 360) + 360) % 360 } : p,
        ),
      }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onMove(e: React.PointerEvent) {
    if (!dragK || !sceneRef.current) return;
    const r = sceneRef.current.getBoundingClientRect();
    const x = Math.min(96, Math.max(4, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(94, Math.max(8, ((e.clientY - r.top) / r.height) * 100));
    setLive((p) => ({ ...p, [dragK]: { x, y } }));
  }

  // Un point tombe-t-il sur un pont déjà posé ? (zone marchable au-dessus de l'eau)
  function onABridge(x: number, y: number, excludeK?: string) {
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return false;
    return placed.some((b) => {
      if (!BRIDGE_IDS.has(b.id) || b.k === excludeK) return false;
      const bp = live[b.k] ?? { x: b.x, y: b.y };
      const { hx, hy } = bridgeHalfExtentsPct(b.rot ?? 0, rect);
      return Math.abs(x - bp.x) <= hx && Math.abs(y - bp.y) <= hy;
    });
  }

  function endDrag() {
    const k = dragK;
    setDragK(null);
    if (!k) return;
    const plItem = placed.find((p) => p.k === k);
    const pos = live[k] ?? plItem;
    if (!pos) return;
    const canFloat = plItem ? BRIDGE_IDS.has(plItem.id) : false;
    if (isLand(pos.x, pos.y) || canFloat || onABridge(pos.x, pos.y, k)) {
      // posé sur la terre, sur un pont, ou pont lui-même (qui tient sur l'eau) : on enregistre
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
          <h1 className="text-2xl font-bold">Ta base sur Endor</h1>
          <p className="text-muted-foreground">
            Glisse tes unités pour les déployer. Clique un véhicule ou une créature puis tourne-le avec la molette 🔄. Les compagnons (droïdes, Wookiee…) patrouillent tout seuls 🤖
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('shop')}>
          <ShoppingBag /> Armurerie
        </Button>
      </div>

      <div
        ref={sceneRef}
        onPointerDown={() => setSelectedK(null)}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className="relative aspect-[8/5] w-full touch-none overflow-hidden rounded-2xl border border-border shadow-xl shadow-black/40"
      >
        {/* fond : la forêt d'Endor */}
        <img
          src={asset('endor_bg.jpg')}
          alt="La lune forestière d'Endor"
          className="absolute inset-0 h-full w-full select-none object-cover"
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />

        {/* brume qui dérive */}
        <div className="eq-walk-r absolute top-[10%] h-6 w-28 rounded-full bg-white/10 blur-md" style={{ animationDuration: '60s' }} />
        <div className="eq-walk-r absolute top-[40%] h-5 w-20 rounded-full bg-white/10 blur-md" style={{ animationDuration: '78s', animationDelay: '12s' }} />
        <div className="eq-walk-r absolute top-[66%] h-8 w-40 rounded-full bg-white/[0.08] blur-lg" style={{ animationDuration: '96s', animationDelay: '26s' }} />

        {/* vaisseau qui traverse le ciel */}
        <div className="eq-walk-r absolute top-[8%]" style={{ animationDuration: '34s', animationDelay: '6s' }}>
          <div className="eq-bob">
            <img
              src={asset('chip_xwing.png')}
              alt=""
              style={{ height: 26, width: 'auto', imageRendering: 'pixelated', transform: 'rotate(90deg)', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.4))' }}
              draggable={false}
            />
          </div>
        </div>

        {/* objets placés (déplaçables) */}
        {placed.map((pl) => {
          const item = SHOP_MAP[pl.id];
          if (!item) return null;
          const pos = posOf(pl);
          const isDragging = dragK === pl.k;
          const isSelected = selectedK === pl.k;
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
                e.stopPropagation();
                setSelectedK(pl.k);
                setLive((p) => ({ ...p, [pl.k]: posOf(pl) }));
                setDragK(pl.k);
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 select-none drop-shadow-lg ${
                isDragging ? 'z-30 scale-110 cursor-grabbing' : 'cursor-grab'
              } ${isSelected ? 'z-40 rounded-md ring-2 ring-[#f5c518]' : ''}`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                touchAction: 'none',
                transition: smooth ? 'left 2.4s ease-in-out, top 2.4s ease-in-out' : 'none',
                zIndex: isDrowning ? 5 : undefined,
              }}
              title={`${item.name} — glisse pour déplacer${!isChar ? ' · molette pour tourner' : ''}`}
            >
              {isDrowning && (
                <div className="eq-splash pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 rounded-full border-2 border-[#a6b4ff]/70" />
              )}
              <div className={`${isDrowning ? 'eq-drown' : isAppearing ? 'eq-appear' : isChar && !isDragging ? 'eq-bob' : ''}`}>
                <Chip id={pl.id} rot={pl.rot} size={sizeOf(pl.id)} />
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
            Gagne des crédits en accomplissant des missions, puis recrute ton escouade à l'armurerie ⚔️
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
