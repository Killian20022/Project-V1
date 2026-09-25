import { useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingBag, Check, Lock, Plus, Minus, LocateFixed, Scan, Trash2, MapPin, X, Move, RotateCcw, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sprite } from '@/components/Sprite';
import {
  CATEGORIES,
  FACTIONS,
  SHOP,
  SHOP_MAP,
  popMaxOf,
  popUsedOf,
  ownsBuilding,
  needsLabel,
  applyFaction,
  storageCaps,
  type Faction,
  type ShopCategory,
} from '@/data/shop';
import { TROPHIES, type Trophy } from '@/lib/trophies';
import { createWorld, findSpot, nextUnlock, unlockedIslands, WORLD } from '@/lib/world';
import { LEVELS, lessonCount } from '@/lib/content';
import { SPRITES, uiUrl } from '@/lib/sprites';
import type { GameState, Page } from '../types';
import { useIsDev } from '@/lib/dev';
import { TOTAL_LESSONS } from '@/lib/content';

type SetState = React.Dispatch<React.SetStateAction<GameState>>;

// Clé de l'objet fraîchement acheté au Marché, à poser à la main dès l'arrivée sur la carte.
let pendingPlace: string | null = null;

export function countOwned(state: GameState, id: string) {
  return (state.placed ?? []).filter((p) => p.id === id).length;
}

export function questsDone(state: GameState) {
  return LEVELS.reduce((s, lv) => s + Math.min(state.lessons[lv] ?? 0, lessonCount(lv)), 0);
}

const BIG_ISLANDS = WORLD.islands.filter((i) => i.size > 12).length;

// ======================= Carte du royaume =======================
export function IslandPage({ state, setState, navigate }: { state: GameState; setState: SetState; navigate: (page: Page) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReturnType<typeof createWorld> | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [selInfo, setSelInfo] = useState<{ id: string; bought: boolean } | null>(null);
  const [moving, setMoving] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [mapVersion, setMapVersion] = useState(0); // bump = recréer le moteur (reset / changement de couleur)
  const [confirmReset, setConfirmReset] = useState(false);
  const faction = state.faction ?? 'bleu';

  const isDev = useIsDev();
  const done = isDev ? TOTAL_LESSONS : questsDone(state);
  const unlocked = useMemo(() => unlockedIslands(done), [done]);
  const openBig = WORLD.islands.filter((isl, i) => isl.size > 12 && unlocked.has(i)).length;
  const next = nextUnlock(done);
  const caps = useMemo(() => storageCaps(state.placed ?? []), [state.placed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const eng = createWorld(canvas, {
      placed: state.placed ?? [],
      unlocked,
      missionsDone: done,
      playerFaction: state.faction ?? 'bleu',
      onMove: (k, x, y) =>
        setState((current) => ({
          ...current,
          placed: (current.placed ?? []).map((p) => (p.k === k ? { ...p, x, y } : p)),
        })),
      onVariant: (k, id) =>
        setState((current) => ({
          ...current,
          placed: (current.placed ?? []).map((p) => (p.k === k ? { ...p, id } : p)),
        })),
      onSelect: (k, info) => {
        setSelected(k);
        setSelInfo(info ?? null);
        setConfirmDel(false);
      },
      onMoveMode: setMoving,
      onOrderMode: setOrdering,
      stock: { gold: state.coins, wood: state.resources?.wood ?? 0, food: state.resources?.food ?? 0 },
      decorPos: state.decorPos ?? {},
      decorRemoved: state.decorRemoved ?? [],
      onDecorMove: (id, x, y) =>
        setState((current) => ({ ...current, decorPos: { ...(current.decorPos ?? {}), [id]: [x, y] } })),
      onUnitLost: (k) =>
        setState((current) => ({ ...current, placed: (current.placed ?? []).filter((p) => p.k !== k) })),
      onHarvest: (kind, amount) =>
        setState((current) =>
          kind === 'gold'
            ? { ...current, coins: current.coins + amount }
            : {
                ...current,
                resources: {
                  wood: (current.resources?.wood ?? 0) + (kind === 'wood' ? amount : 0),
                  food: (current.resources?.food ?? 0) + (kind === 'food' ? amount : 0),
                },
              },
        ),
    });
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
    // Objet tout juste acheté : on centre dessus et on lance la pose manuelle.
    if (pendingPlace) {
      const k = pendingPlace;
      pendingPlace = null;
      eng.focusItem(k);
      eng.startMove(k);
    }
    return () => {
      ro.disconnect();
      eng.stop();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapVersion]);

  useEffect(() => {
    engineRef.current?.setPlaced(state.placed ?? []);
  }, [state.placed]);

  useEffect(() => {
    engineRef.current?.setUnlocked(unlocked, done);
  }, [unlocked, done]);

  // Tient le moteur informé des réserves (pour savoir quand le stockage est plein).
  useEffect(() => {
    engineRef.current?.setStock({ gold: state.coins, wood: state.resources?.wood ?? 0, food: state.resources?.food ?? 0 });
  }, [state.coins, state.resources]);

  // Filet de sécurité : à la fermeture de l'onglet, on reverse le dernier lot récolté avant que la page parte.
  useEffect(() => {
    const flush = () => engineRef.current?.flush();
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flush);
    };
  }, []);

  // Ressources de départ : dépose une fois 2 filons d'or sur l'île (elle n'en a pas), en objets
  // possédés — donc déplaçables, exploitables et sauvegardés. Re-déposés après une réinitialisation.
  useEffect(() => {
    if (state.starters) return;
    setState((c) => {
      if (c.starters) return c;
      const placed = c.placed ?? [];
      const add: GameState['placed'] = [];
      for (const id of ['or', 'or']) {
        const { x, y } = findSpot(unlocked, [...placed, ...add], id, c.decorPos ?? {}, c.decorRemoved ?? []);
        add.push({ k: `${id}-start-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, id, x: Math.round(x), y: Math.round(y) });
      }
      return { ...c, starters: true, placed: [...placed, ...add] };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.starters]);

  const sel = selected && selInfo?.bought ? (state.placed ?? []).find((p) => p.k === selected) : null;
  const selItem = selInfo ? SHOP_MAP[selInfo.id] : null;
  const selName = selItem?.name ?? (selInfo ? SPRITES[selInfo.id]?.name ?? 'Habitant' : '');
  const refund = sel && selItem ? Math.floor(selItem.price / 2) : 0;
  const isUnit = selInfo ? !!SPRITES[selInfo.id]?.run || selItem?.category === 'soldats' || selItem?.category === 'animaux' : false;
  const role = selInfo
    ? /^villageois/.test(selInfo.id)
      ? 'Ouvrier · récolte le bois et l’or'
      : /^(guerrier|lancier)/.test(selInfo.id)
        ? 'Soldat · s’entraîne avec ses compagnons'
        : /^archer/.test(selInfo.id)
          ? 'Archer · veille sur l’île'
          : /^moine/.test(selInfo.id)
            ? 'Moine · soigne les blessés'
            : /^mouton/.test(selInfo.id)
              ? 'Animal · donne de la nourriture'
              : null
    : null;

  function startMove() {
    if (selected && engineRef.current?.startMove(selected)) setConfirmDel(false);
  }

  function remove() {
    if (!selected || !selInfo) return;
    if (sel) {
      setState((current) => ({
        ...current,
        coins: current.coins + refund,
        placed: (current.placed ?? []).filter((p) => p.k !== sel.k),
      }));
      engineRef.current?.deselect();
    } else if (selected.startsWith('decor:')) {
      const id = selected.slice(6);
      engineRef.current?.removeDecor(id);
      setState((current) => ({ ...current, decorRemoved: [...new Set([...(current.decorRemoved ?? []), id])] }));
    }
    setSelected(null);
    setSelInfo(null);
    setConfirmDel(false);
  }

  function closePanel() {
    engineRef.current?.cancelMove();
    engineRef.current?.deselect();
  }

  // Change la couleur du royaume : recolore les unités/bâtiments possédés et recrée la carte.
  function chooseFaction(f: Faction) {
    if (f === faction) return;
    setState((current) => ({
      ...current,
      faction: f,
      placed: (current.placed ?? []).map((p) => ({ ...p, id: applyFaction(p.id, f) })),
    }));
    setSelected(null);
    setSelInfo(null);
    setMapVersion((v) => v + 1);
  }

  // Réinitialise la carte : retire tout ce qui a été placé/récolté et restaure le décor d'origine.
  function resetMap() {
    setState((current) => ({ ...current, coins: 0, placed: [], decorPos: {}, decorRemoved: [], resources: { wood: 0, food: 0 }, starters: false }));
    setSelected(null);
    setSelInfo(null);
    setConfirmReset(false);
    setMapVersion((v) => v + 1);
  }

  return (
    <section aria-label="Carte du royaume" className="relative h-full min-h-[28rem] w-full overflow-hidden bg-[#47aba9]">
      <div ref={wrapRef} className="absolute inset-0 touch-none overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ touchAction: 'none' }} />
      </div>

      <div className="pointer-events-none absolute left-3 top-3 hidden sm:block md:left-6 md:top-5">
        <h1 className="ribbon text-xl md:text-2xl">L’archipel de Scriptoria</h1>
        <p className="mt-1 hidden max-w-sm rounded-md bg-[#2b1a0d]/75 px-3 py-1.5 text-xs text-[#ffeccc] md:block">
          Glisse pour explorer · molette pour zoomer · touche un personnage ou un bâtiment pour le déplacer ou le supprimer
        </p>
      </div>

      {/* Réserves : récoltées en temps réel par les villageois (x / capacité de stockage) */}
      <div className="pointer-events-none absolute left-1/2 top-3 flex -translate-x-1/2 gap-2 md:top-5">
        {([
          { k: 'or', v: state.coins, cap: caps.gold },
          { k: 'bois', v: state.resources?.wood ?? 0, cap: caps.wood },
          { k: 'mouton', v: state.resources?.food ?? 0, cap: caps.food },
        ] as const).map(({ k, v, cap }) => {
          const full = v >= cap;
          return (
            <span
              key={k}
              title={full ? 'Stockage plein — construis pour agrandir' : undefined}
              className={`flex items-center gap-1 rounded-md bg-[#2b1a0d]/85 px-2 py-1 text-sm font-bold shadow-lg ${
                full ? 'text-[#ff9a8a]' : 'text-[#ffe7a6]'
              }`}
            >
              <Sprite k={k} still height={22} crop={0.15} /> {v}
              <span className="text-[10px] font-semibold opacity-70">/ {cap}</span>
            </span>
          );
        })}
      </div>

      <div className="absolute right-3 top-3 flex w-[min(11rem,44vw)] flex-col items-stretch gap-2 md:right-6 md:top-5">
        <Button size="sm" onClick={() => navigate('shop')}>
          <ShoppingBag /> Marché
        </Button>
        {/* Bannière du royaume : la couleur que tu incarnes tout le jeu */}
        <div className="rounded-md bg-[#2b1a0d]/85 px-2 py-1.5 shadow-lg">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#ffeccc]/70">Ton royaume</div>
          <div className="flex justify-between gap-1">
            {FACTIONS.map((f) => (
              <button
                key={f.id}
                title={`Royaume ${f.label}`}
                onClick={() => chooseFaction(f.id)}
                className={`h-6 w-6 rounded-full border-2 transition ${faction === f.id ? 'scale-110 border-[#ffe7a6]' : 'border-black/40 opacity-70 hover:opacity-100'}`}
                style={{ background: f.color }}
              />
            ))}
          </div>
        </div>
        <span className="pointer-events-none rounded-md bg-[#2b1a0d]/80 px-3 py-1 text-[11px] font-semibold text-[#ffeccc]">
          {next ? `Prochaine île : ${next.name} dans ${next.remaining} quête${next.remaining > 1 ? 's' : ''}` : 'Tout l’archipel est libéré !'}
        </span>
        <Button
          size="sm"
          variant={ordering ? 'destructive' : 'default'}
          onClick={() => (ordering ? engineRef.current?.cancelOrder() : engineRef.current?.startOrder())}
        >
          <Swords /> {ordering ? 'Annuler l’ordre' : 'Envoyer les troupes'}
        </Button>
        {confirmReset ? (
          <div className="rounded-md bg-[#2b1a0d]/90 p-2 text-[11px] text-[#ffeccc] shadow-lg">
            <div className="mb-1.5">Tout effacer et repartir de zéro ?</div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="destructive" className="flex-1" onClick={resetMap}>
                Oui
              </Button>
              <Button size="sm" variant="secondary" className="flex-1" onClick={() => setConfirmReset(false)}>
                Non
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setConfirmReset(true)}>
            <RotateCcw /> Réinitialiser
          </Button>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-3 flex items-center gap-2 rounded-md bg-[#2b1a0d]/85 px-3 py-2 text-sm font-bold text-[#ffe7a6] shadow-xl md:bottom-6 md:left-6">
        <MapPin className="size-4" /> {openBig} / {BIG_ISLANDS} îles libérées
      </div>

      {moving && (
        <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2 md:top-5">
          <div className="flex items-center gap-3 rounded-lg border-2 border-[#8cff9e] bg-[#1d2b14]/90 px-4 py-2 text-sm font-bold text-[#d8ffdc] shadow-[0_0_24px_rgba(120,255,150,0.45)]">
            <Move className="size-4 animate-pulse" /> Touche une case verte pour y poser : {selName}
            <Button size="sm" variant="secondary" onClick={() => engineRef.current?.cancelMove()}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {ordering && (
        <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2 md:top-5">
          <div className="flex items-center gap-3 rounded-lg border-2 border-[#ffcf6b] bg-[#2b1a0d]/90 px-4 py-2 text-sm font-bold text-[#ffe7a6] shadow-[0_0_24px_rgba(255,200,90,0.45)]">
            <Swords className="size-4 animate-pulse" /> Touche un point (ou un ennemi) pour y envoyer tes troupes
            <Button size="sm" variant="secondary" onClick={() => engineRef.current?.cancelOrder()}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {selected && selInfo && !moving && (
        <div className="absolute bottom-20 left-1/2 z-10 w-[min(94vw,400px)] -translate-x-1/2 md:bottom-6">
          <div className="paper-dark p-1">
            <div className="flex items-center gap-3">
              <Sprite k={selInfo.id} height={56} crop={isUnit ? 0.2 : 0} />
              <div className="min-w-0 flex-1">
                <div className="font-display truncate text-[#ffe7a6]">{selName}</div>
                <div className="text-[11px] text-[#e8dcc2]/80">
                  {role ?? (isUnit ? 'Habitant de l’archipel' : 'Élément de l’archipel')} · glisse-le ou « Déplacer »
                </div>
              </div>
              <button className="grid h-8 w-8 shrink-0 place-items-center text-[#ffeccc]" onClick={closePanel} aria-label="Fermer">
                <X className="size-4" />
              </button>
            </div>
            {confirmDel ? (
              <div className="mt-2 flex items-center gap-2 rounded-md bg-[#2b1a0d]/60 p-2">
                <span className="flex-1 text-xs text-[#ffeccc]">
                  {sel ? `Vendre pour ${refund} or ?` : isUnit ? 'Renvoyer ce personnage pour de bon ?' : 'Retirer cet élément pour de bon ?'}
                </span>
                <Button size="sm" variant="destructive" onClick={remove}>
                  <Trash2 /> Oui
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setConfirmDel(false)}>
                  Non
                </Button>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button size="sm" onClick={startMove}>
                  <Move /> Déplacer
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setConfirmDel(true)}>
                  <Trash2 /> {sel ? `Vendre (+${refund})` : 'Supprimer'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-3 flex gap-2 md:bottom-6 md:right-6">
        {[
          { label: 'Dézoomer', icon: Minus, action: () => engineRef.current?.zoomBy(1 / 1.3) },
          { label: 'Zoomer', icon: Plus, action: () => engineRef.current?.zoomBy(1.3) },
          { label: 'Retour au château', icon: LocateFixed, action: () => engineRef.current?.goHome() },
          { label: 'Voir tout l’archipel', icon: Scan, action: () => engineRef.current?.overview() },
        ].map(({ label, icon: Icon, action }) => (
          <Button key={label} size="icon" variant="secondary" aria-label={label} title={label} onClick={action}>
            <Icon />
          </Button>
        ))}
      </div>
    </section>
  );
}

// ======================= Marché =======================
export function ShopPage({ state, setState, navigate }: { state: GameState; setState: SetState; navigate?: (page: Page) => void }) {
  const [cat, setCat] = useState<ShopCategory>('soldats');
  const [bought, setBought] = useState<string | null>(null);
  const isDev = useIsDev();
  const unlocked = useMemo(() => unlockedIslands(isDev ? TOTAL_LESSONS : questsDone(state)), [state, isDev]);
  const placedItems = state.placed ?? [];
  const wood = state.resources?.wood ?? 0;
  const food = state.resources?.food ?? 0;
  const caps = storageCaps(placedItems);
  const popMax = popMaxOf(placedItems);
  const popUsed = popUsedOf(placedItems);
  const faction = state.faction ?? 'bleu';
  const factionInfo = FACTIONS.find((f) => f.id === faction)!;

  function buy(id: string) {
    const item = SHOP_MAP[id];
    if (!item) return;
    const placed = state.placed ?? [];
    const ids = item.variants ?? [id];
    const count = placed.filter((p) => ids.includes(p.id)).length;
    const res = state.resources ?? { wood: 0, food: 0 };
    const woodCost = item.wood ?? 0;
    const foodCost = item.food ?? 0;
    // Vérifs (or, ressources, bâtiment requis, population) — si ça ne passe pas, on ne fait rien.
    if (count >= item.max) return;
    if (state.coins < item.price || res.wood < woodCost || res.food < foodCost) return;
    if (item.needs && !ownsBuilding(placed, item.needs)) return;
    if ((item.pop ?? 0) > 0 && popUsed + (item.pop ?? 0) > popMax) return;
    const k = `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const { x, y } = findSpot(unlocked, placed, id, state.decorPos ?? {}, state.decorRemoved ?? []);
    setState((current) => ({
      ...current,
      coins: current.coins - item.price,
      resources: {
        wood: (current.resources?.wood ?? 0) - woodCost,
        food: (current.resources?.food ?? 0) - foodCost,
      },
      placed: [...(current.placed ?? []), { k, id, x: Math.round(x), y: Math.round(y) }],
      stats: { ...current.stats, bought: (current.stats.bought ?? 0) + 1 },
    }));
    setBought(id);
    window.setTimeout(() => setBought((b) => (b === id ? null : b)), 1400);
    // On file sur la carte pour poser l'objet soi-même (mode « pose »).
    pendingPlace = k;
    navigate?.('island');
  }

  // Le joueur ne recrute/bâtit que dans sa couleur (les autres couleurs sont des rivaux).
  const hasFactions = cat === 'soldats' || cat === 'batiments';
  const items = SHOP.filter((i) => i.category === cat && !i.hidden && (!hasFactions || i.faction === faction));
  const info = CATEGORIES.find((c) => c.id === cat)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="ribbon ribbon-yellow text-2xl">Le marché du royaume</h1>
          <p className="mt-2 text-muted-foreground">
            Recrute avec ton or et tes ressources récoltées. Les soldats exigent le bon bâtiment ; chaque unité coûte 1 place de population.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-3 rounded-full bg-[#2b1a0d]/80 px-4 py-1.5 font-bold text-[#ffe7a6]">
            <span className="flex items-center gap-1" title="Or / capacité de stockage">
              <img src={uiUrl('icon_03.png')} alt="" className="pixel h-5 w-5" /> {state.coins}
              <span className="text-[11px] opacity-70">/ {caps.gold}</span>
            </span>
            <span className={`flex items-center gap-1 ${wood >= caps.wood ? 'text-[#ff9a8a]' : ''}`} title="Bois / capacité">
              🪵 {wood}
              <span className="text-[11px] opacity-70">/ {caps.wood}</span>
            </span>
            <span className={`flex items-center gap-1 ${food >= caps.food ? 'text-[#ff9a8a]' : ''}`} title="Nourriture / capacité">
              🍖 {food}
              <span className="text-[11px] opacity-70">/ {caps.food}</span>
            </span>
            <span className={`flex items-center gap-1 ${popUsed >= popMax ? 'text-[#ff9a8a]' : ''}`}>
              👥 {popUsed}/{popMax}
            </span>
          </div>
          {navigate && (
            <Button variant="secondary" onClick={() => navigate('island')}>
              <MapPin /> Voir mon royaume
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`font-display rounded-md border-2 px-3 py-1.5 text-[15px] transition ${
              cat === c.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-card-foreground hover:bg-secondary'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {hasFactions && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="h-3 w-3 rounded-full border border-black/40" style={{ background: factionInfo.color }} />
          Tu diriges le <span className="font-semibold" style={{ color: factionInfo.color }}>Royaume {factionInfo.label}</span> — les autres couleurs sont des rivaux (change ta couleur sur la carte).
        </p>
      )}

      <p className="text-sm text-muted-foreground">{info.hint}</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const count = item.variants
            ? item.variants.reduce((sum, v) => sum + countOwned(state, v), 0)
            : countOwned(state, item.id);
          const maxed = count >= item.max;
          const person = item.category === 'soldats' || item.category === 'animaux';
          const needBld = item.needs && !ownsBuilding(placedItems, item.needs);
          const popFull = (item.pop ?? 0) > 0 && popUsed + (item.pop ?? 0) > popMax;
          const afford = state.coins >= item.price && wood >= (item.wood ?? 0) && food >= (item.food ?? 0);
          const canBuy = !maxed && afford && !needBld && !popFull;
          const verb = item.category === 'batiments' ? 'Construire' : item.category === 'soldats' ? 'Recruter' : 'Acheter';
          const reason = needBld ? `Nécessite ${needsLabel(item.needs!)}` : popFull ? 'Population pleine' : null;
          return (
            <Card key={item.id}>
              <CardContent className="flex flex-col items-center gap-1.5 p-2 text-center">
                <div className="grid h-28 w-full place-items-end justify-center overflow-hidden">
                  <Sprite k={item.id} height={item.category === 'batiments' ? 108 : person ? 100 : 84} crop={person ? (item.id.startsWith('lancier') ? 0.3 : 0.26) : 0} />
                </div>
                <div className="font-display leading-tight">{item.name}</div>
                {item.blurb && <div className="text-[11px] text-[hsl(var(--accent))]">{item.blurb}</div>}
                {/* Coûts : or + bois + nourriture (rouge si insuffisant) */}
                <div className="flex flex-wrap items-center justify-center gap-x-2 text-[11px] font-semibold">
                  <span className={state.coins >= item.price ? 'text-[#ffe7a6]' : 'text-[#ff9a8a]'}>💰 {item.price}</span>
                  {!!item.wood && <span className={wood >= item.wood ? 'text-[#ffe7a6]' : 'text-[#ff9a8a]'}>🪵 {item.wood}</span>}
                  {!!item.food && <span className={food >= item.food ? 'text-[#ffe7a6]' : 'text-[#ff9a8a]'}>🍖 {item.food}</span>}
                  {!!item.pop && <span className="text-muted-foreground">👥 {item.pop}</span>}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {count}/{item.max} possédé{item.max > 1 ? 's' : ''}
                </div>
                {maxed ? (
                  <div className="flex items-center gap-1 text-sm font-bold text-[hsl(var(--primary))]">
                    <Check className="size-4" /> Maximum atteint
                  </div>
                ) : (
                  <Button size="sm" className="w-full" disabled={!canBuy} onClick={() => buy(item.id)}>
                    {bought === item.id ? (
                      <>
                        <Check /> {item.category === 'batiments' ? 'Construit !' : 'Recruté !'}
                      </>
                    ) : canBuy ? (
                      verb
                    ) : (
                      <>
                        <Lock /> {reason ?? 'Ressources'}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {unlocked.size === 0 && <p className="text-sm text-muted-foreground">Aucune île libérée pour l’instant.</p>}
    </div>
  );
}

// ======================= Hauts faits =======================
const TIER_BADGE: Record<Trophy['tier'], string> = {
  bronze: 'bg-[#b87333]/25',
  silver: 'bg-[#9aa4b1]/30',
  gold: 'bg-[#f7c948]/35',
};

export function TrophiesPage({ state }: { state: GameState }) {
  const categories = [...new Set(TROPHIES.map((t) => t.category))];
  const unlockedCount = TROPHIES.filter((t) => t.progress(state) >= t.goal).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ribbon ribbon-purple text-2xl">Hauts faits</h1>
        <p className="mt-2 text-muted-foreground">
          {unlockedCount}/{TROPHIES.length} débloqués — tes exploits gravés dans les chroniques du royaume.
        </p>
      </div>

      {categories.map((category) => (
        <div key={category}>
          <h2 className="mb-3 text-2xl text-foreground">{category}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TROPHIES.filter((t) => t.category === category).map((trophy) => {
              const progress = trophy.progress(state);
              const unlocked = progress >= trophy.goal;
              const pct = Math.min(100, Math.round((progress / trophy.goal) * 100));
              return (
                <Card key={trophy.id} className={unlocked ? '' : 'opacity-80 saturate-50'}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-2xl ${
                        unlocked ? TIER_BADGE[trophy.tier] : 'bg-secondary grayscale'
                      }`}
                    >
                      {trophy.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display flex items-center gap-2">
                        {trophy.name}
                        {unlocked && <Check className="size-4 text-[hsl(var(--primary))]" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{trophy.desc}</div>
                      {!unlocked && (
                        <div className="mt-2">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-[hsl(var(--primary)/0.75)]" style={{ width: `${pct}%` }} />
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
