import { Coins, ShoppingBag, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SHOP } from '@/data/shop';
import { TROPHIES, type Trophy } from '@/lib/trophies';
import { Walkers } from '@/components/Walkers';
import type { GameState, Page } from '../types';

const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

// Tailles de frame pour les personnages (spritesheets) — pour n'afficher qu'une image
const CHAR_FRAME: Record<string, number> = { chicken: 16, farmer: 48, cow: 32 };

// Décor d'ambiance toujours présent (fichiers hors boutique) pour une île vivante
const AMBIENT: { file: string; left: number; top: number; size: number; sway?: boolean }[] = [
  { file: 'tree_big.png', left: 6, top: 46, size: 96, sway: true },
  { file: 'tree_small.png', left: 92, top: 40, size: 64, sway: true },
  { file: 'tree_big.png', left: 78, top: 32, size: 80, sway: true },
  { file: 'house.png', left: 24, top: 30, size: 92 },
  { file: 'tree_small.png', left: 44, top: 26, size: 54, sway: true },
];

// Emplacements des objets achetés (zone herbe, premier plan)
const ISLAND_POS: [number, number][] = [
  [16, 62], [34, 54], [52, 66], [66, 56], [84, 64],
  [24, 80], [42, 86], [60, 78], [78, 86], [90, 72], [37, 70],
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

export function IslandPage({ state, navigate }: { state: GameState; navigate: (page: Page) => void }) {
  const ownedItems = SHOP.filter((item) => state.island.includes(item.id));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mon île</h1>
          <p className="text-muted-foreground">Elle grandit et s'anime à mesure que tu apprends.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('shop')}>
          <ShoppingBag /> Boutique
        </Button>
      </div>

      <div
        className="relative min-h-[460px] w-full overflow-hidden rounded-2xl border border-border shadow-xl shadow-black/40 sm:min-h-[560px]"
        style={{
          background:
            'linear-gradient(180deg, #79c4ff 0%, #a8dcff 26%, #cdeeff 33%, #8fd36a 33%, #77bd50 66%, #5fa63e 100%)',
        }}
      >
        {/* soleil */}
        <div className="absolute right-8 top-6 h-14 w-14 rounded-full bg-yellow-200 shadow-[0_0_50px_16px_rgba(254,240,138,0.7)]" />
        {/* nuages qui dérivent */}
        <div className="eq-drift absolute left-[10%] top-[8%] h-5 w-24 rounded-full bg-white/85 blur-[1px]" />
        <div className="eq-drift absolute left-[52%] top-[5%] h-4 w-20 rounded-full bg-white/70 blur-[1px]" style={{ animationDelay: '3s' }} />
        <div className="eq-drift absolute left-[30%] top-[14%] h-4 w-16 rounded-full bg-white/60 blur-[1px]" style={{ animationDelay: '6s' }} />

        {/* étang */}
        <div className="eq-shimmer absolute bottom-[8%] right-[8%] h-20 w-40 rounded-[50%] bg-sky-300/80 shadow-inner" />

        {/* décor d'ambiance */}
        {AMBIENT.map((d, i) => (
          <div
            key={`amb-${i}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${d.left}%`, top: `${d.top}%` }}
          >
            <div className={d.sway ? 'eq-sway' : ''} style={{ animationDelay: `${i * 0.5}s` }}>
              <img src={asset(d.file)} alt="" style={{ width: d.size, imageRendering: 'pixelated' }} draggable={false} />
            </div>
          </div>
        ))}

        {/* objets achetés */}
        {ownedItems.map((item, i) => {
          const [left, top] = ISLAND_POS[i % ISLAND_POS.length];
          const animate = item.kind === 'char' ? 'eq-bob' : 'eq-sway';
          return (
            <div
              key={item.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 drop-shadow-lg"
              style={{ left: `${left}%`, top: `${top}%` }}
              title={item.name}
            >
              <div className={animate} style={{ animationDelay: `${i * 0.3}s` }}>
                <Sprite id={item.id} file={item.file} size={item.kind === 'char' ? 56 : 48} />
              </div>
            </div>
          );
        })}

        {/* personnages qui se promènent en bas */}
        <Walkers />

        {/* panneau info */}
        <div className="absolute bottom-4 left-4 z-10 rounded-xl bg-background/70 px-4 py-2 text-sm font-semibold backdrop-blur">
          {ownedItems.length}/{SHOP.length} objets · {state.coins} 🪙
        </div>
        {ownedItems.length === 0 && (
          <div className="absolute bottom-4 right-4 max-w-[240px] rounded-xl bg-background/80 p-3 text-right text-xs font-semibold backdrop-blur">
            Gagne des pièces en faisant des leçons, puis adopte ton premier compagnon dans la boutique 🐣
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
      if (current.island.includes(id) || current.coins < price) return current;
      return { ...current, coins: current.coins - price, island: [...current.island, id] };
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
              const owned = state.island.includes(item.id);
              const canBuy = !owned && state.coins >= item.price;
              return (
                <Card key={item.id} className={owned ? 'border-primary/50' : ''}>
                  <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                    <div className="grid h-24 w-full place-items-center rounded-xl bg-gradient-to-b from-sky-300/10 to-transparent">
                      <div className={owned && item.kind === 'char' ? 'eq-bob' : ''}>
                        <Sprite id={item.id} file={item.file} size={item.kind === 'char' ? 60 : 52} />
                      </div>
                    </div>
                    <div className="font-semibold">{item.name}</div>
                    {item.blurb && <div className="text-[11px] text-primary">{item.blurb}</div>}
                    {owned ? (
                      <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                        <Check className="size-4" /> Possédé
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
