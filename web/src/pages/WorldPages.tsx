import { useEffect, useRef } from 'react';
import { Coins, ShoppingBag, Check, Lock, Plus, Minus, LocateFixed, Scan } from 'lucide-react';
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
    <section aria-label="Carte d'Endor" className="relative h-[calc(100dvh-7rem)] min-h-[34rem] w-full overflow-hidden bg-[#10261d] md:h-[calc(100dvh-4rem)]">
      <div
        ref={wrapRef}
        className="absolute inset-0 touch-none overflow-hidden"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ touchAction: 'none' }} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#07130d]/85 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#07130d]/75 to-transparent" />
      <div className="pointer-events-none absolute left-4 top-4 max-w-[75%] text-[#f6edd1] md:left-8 md:top-7">
        <p className="text-[10px] font-bold uppercase tracking-[.35em] text-amber-300/85">Endor · 25 territoires</p>
        <h1 className="font-display text-2xl font-black tracking-wide drop-shadow-lg md:text-4xl">Le village des anciens</h1>
        <p className="mt-1 hidden text-xs text-[#d9e7cc] drop-shadow md:block">Glisse pour explorer · molette pour zoomer · les missions dévoilent la forêt</p>
      </div>
      <div className="absolute right-4 top-4 flex flex-col items-end gap-2 md:right-8 md:top-7">
        <Button size="sm" className="border border-amber-200/30 bg-[#15281f]/85 text-amber-100 backdrop-blur hover:bg-[#274535]" onClick={() => navigate('shop')}>
          <ShoppingBag className="size-4" /> Armurerie
        </Button>
        <span className="pointer-events-none rounded-full border border-white/15 bg-[#0b1b16]/75 px-3 py-1 text-[11px] text-[#e9e8d1] backdrop-blur">{lockLabel}</span>
      </div>
      <div className="pointer-events-none absolute bottom-5 left-4 rounded-xl border border-white/15 bg-[#0b1b16]/75 px-4 py-2 text-sm font-semibold text-[#f6edd1] shadow-xl backdrop-blur md:bottom-7 md:left-8">
        {openCount} / 25 territoires ouverts
      </div>
      <div className="absolute bottom-5 right-4 flex gap-2 md:bottom-7 md:right-8">
        {[
          { label: 'Dézoomer', icon: Minus, action: () => engineRef.current?.zoomBy(1 / 1.3) },
          { label: 'Zoomer', icon: Plus, action: () => engineRef.current?.zoomBy(1.3) },
          { label: 'Retour au village', icon: LocateFixed, action: () => engineRef.current?.goHome() },
          { label: 'Voir les 25 territoires', icon: Scan, action: () => engineRef.current?.overview() },
        ].map(({ label, icon: Icon, action }) => (
          <Button key={label} size="icon" variant="outline" aria-label={label} title={label} onClick={action}
            className="size-10 border-white/25 bg-[#0b1b16]/80 text-[#f6edd1] shadow-xl backdrop-blur hover:bg-[#34523a] hover:text-white">
            <Icon className="size-4" />
          </Button>
        ))}
      </div>
    </section>
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
