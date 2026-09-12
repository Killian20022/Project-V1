import { Coins, ShoppingBag, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SHOP } from '@/data/shop';
import { TROPHIES, type Trophy } from '@/lib/trophies';
import type { GameState, Page } from '../types';

const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

// Tailles de frame pour les personnages (spritesheets) — pour n'afficher qu'une image
const CHAR_FRAME: Record<string, number> = { chicken: 16, farmer: 48, cow: 32 };

const ISLAND_POS: [number, number][] = [
  [14, 58], [32, 50], [50, 62], [68, 52], [85, 60],
  [22, 78], [41, 84], [59, 76], [77, 84], [90, 70], [35, 68],
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
          transformOrigin: 'center',
        }}
      />
    );
  }
  return <img src={asset(file)} alt="" style={{ width: size, imageRendering: 'pixelated' }} />;
}

export function IslandPage({ state, navigate }: { state: GameState; navigate: (page: Page) => void }) {
  const ownedItems = SHOP.filter((item) => state.island.includes(item.id));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mon île</h1>
          <p className="text-muted-foreground">Elle grandit à mesure que tu apprends.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('shop')}>
          <ShoppingBag /> Boutique
        </Button>
      </div>

      <div
        className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border shadow-xl shadow-black/30"
        style={{
          background:
            'linear-gradient(180deg, #7fc7ff 0%, #a9dbff 30%, #8ed36a 30%, #74bd4e 62%, #5da53f 100%)',
        }}
      >
        {/* soleil */}
        <div className="absolute right-6 top-4 h-12 w-12 rounded-full bg-yellow-300 shadow-[0_0_40px_12px_rgba(253,224,71,0.6)]" />
        {/* nuages */}
        <div className="absolute left-[12%] top-[10%] h-4 w-16 rounded-full bg-white/80 blur-[1px]" />
        <div className="absolute left-[55%] top-[7%] h-4 w-20 rounded-full bg-white/70 blur-[1px]" />

        {ownedItems.length === 0 && (
          <div className="absolute inset-x-0 bottom-6 grid place-items-center px-6 text-center">
            <div className="max-w-sm rounded-xl bg-background/75 p-4 text-sm font-semibold text-foreground shadow-lg backdrop-blur">
              Termine des leçons, gagne des pièces et adopte ton premier compagnon dans la boutique. 🐣
            </div>
          </div>
        )}
        {ownedItems.map((item, i) => {
          const [left, top] = ISLAND_POS[i % ISLAND_POS.length];
          return (
            <div
              key={item.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${left}%`, top: `${top}%` }}
              title={item.name}
            >
              <Sprite id={item.id} file={item.file} size={item.kind === 'char' ? 52 : 46} />
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {ownedItems.length}/{SHOP.length} objets · {state.coins} pièces disponibles
      </p>
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

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Boutique de l'île</h1>
          <p className="text-muted-foreground">Transforme tes progrès en compagnons et décors.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 font-semibold">
          <Coins className="text-amber-400" /> {state.coins} pièces
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {SHOP.map((item) => {
          const owned = state.island.includes(item.id);
          const canBuy = !owned && state.coins >= item.price;
          return (
            <Card key={item.id} className={owned ? 'border-primary/50' : ''}>
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <div className="grid h-20 w-full place-items-center rounded-lg bg-secondary/50">
                  <Sprite id={item.id} file={item.file} size={item.kind === 'char' ? 56 : 48} />
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
