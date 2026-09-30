import { useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingBag, Check, Lock, Plus, Minus, LocateFixed, Scan, Trash2, MapPin, X, Move, RotateCcw, Swords, ScrollText, Hammer } from 'lucide-react';
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
  rebuildCost,
  RANK_MAX,
  TRAININGS,
  jobOf,
  trainedRank,
  upgradeCost,
  type Faction,
  type ShopCategory,
} from '@/data/shop';
import { TROPHIES, type Trophy } from '@/lib/trophies';
import { capsWith, createWorld, findSpot, nextUnlock, repairCost, unlockedIslands, WORLD, type PortalMenu, type ResKind } from '@/lib/world';
import { breakYoke, levyTribute, ransomLeft } from '@/lib/vassal';
import { BAN_UNITS, banAvailable, levy } from '@/lib/ban';
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

/**
 * Icônes de ressource, tirées du pack (pièce, bûche, steak, pépite, population). Remplacent les
 * emojis 🪵🍖🪙 : toutes les polices ne les ont pas et ils s'affichaient alors en carré « tofu ».
 *
 * Le pack ne cadre pas ses images de la même façon : la pépite ne remplit que 24×26 px de sa
 * planche de 128, la bûche 47×28 de sa planche de 64, la pièce 55×52. Posées telles quelles dans
 * un carré de 20 px, la pièce et la bûche n'avaient donc pas du tout la même taille à l'écran.
 * `box` = [x, y, largeur, hauteur] du DESSIN dans sa planche, mesuré une fois pour toutes : on
 * recadre dessus, et toutes les icônes pèsent enfin le même poids.
 */
const RES_ICON = {
  gold: { file: 'res_gold.png', label: 'or', w: 128, h: 128, box: [51, 49, 24, 26] },
  wood: { file: 'res_wood.png', label: 'bois', w: 64, h: 64, box: [9, 18, 47, 28] },
  food: { file: 'res_food.png', label: 'nourriture', w: 64, h: 64, box: [9, 16, 47, 36] },
  coin: { file: 'icon_03.png', label: 'or', w: 64, h: 64, box: [4, 4, 55, 52] },
  pop: { file: 'icon_01.png', label: 'population', w: 64, h: 64, box: [5, 3, 57, 57] },
} as const;

function Res({ kind, size = 20, className = '' }: { kind: keyof typeof RES_ICON; size?: number; className?: string }) {
  const ic = RES_ICON[kind];
  const [bx, by, bw, bh] = ic.box;
  const s = size / Math.max(bw, bh); // le dessin remplit le carré dans sa plus grande dimension
  return (
    <span
      role="img"
      aria-label={ic.label}
      title={ic.label}
      className={`relative inline-block overflow-hidden align-[-4px] ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={uiUrl(ic.file)}
        alt=""
        className="pixel absolute max-w-none"
        style={{
          width: ic.w * s,
          height: ic.h * s,
          left: (size - bw * s) / 2 - bx * s,
          top: (size - bh * s) / 2 - by * s,
        }}
      />
    </span>
  );
}

/**
 * Rognage à appliquer à un personnage pour qu'il s'affiche à la MÊME échelle que les autres.
 *
 * Tous les sprites du pack sont dessinés au même grossissement ; seul le CADRE change de taille —
 * 320 px pour le lancier, à cause de sa lance, contre 192 px pour tout le monde. Rogner d'une
 * fraction fixe revenait donc à afficher le lancier ~28 % plus petit que ses camarades. On repart
 * de la référence (un cadre de 192 rogné de `ref`) et on en déduit le rognage du cadre réel.
 */
function unitCrop(id: string, ref = 0.26) {
  const fh = SPRITES[id]?.fh;
  return fh ? (1 - (192 * (1 - 2 * ref)) / fh) / 2 : ref;
}

// Ton royaume est menacé ('war'), tu marques un point ('win'), ou le monde bouge sans toi ('news').
type AlertTone = 'war' | 'win' | 'news';

// ======================= Carte du royaume =======================
export function IslandPage({ state, setState, navigate }: { state: GameState; setState: SetState; navigate: (page: Page) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReturnType<typeof createWorld> | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [selInfo, setSelInfo] = useState<{
    id: string;
    bought: boolean;
    hp?: number;
    maxHp?: number;
    mine?: boolean;
    rank?: number; // grade du soldat (1 → 3) ; absent pour tout ce qui ne se bat pas
    xp?: number; // ennemis abattus par cette unité
    ruin?: string;
  } | null>(null);
  const [moving, setMoving] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [troop, setTroop] = useState(0); // unités retenues au lasso (0 = l'ordre part à toute l'île)
  // Clic droit sur un portail. `openedAt` : instant d'ouverture, pour ne pas refermer le menu sur
  // la queue d'évènements du clic qui vient tout juste de l'ouvrir.
  const [portalMenu, setPortalMenu] = useState<(PortalMenu & { openedAt: number }) | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [mapVersion, setMapVersion] = useState(0); // bump = recréer le moteur (reset / changement de couleur)
  const [confirmReset, setConfirmReset] = useState(false);
  const [alert, setAlert] = useState<{ text: string; tone: AlertTone } | null>(null);
  const alertT = useRef<number | null>(null);
  const faction = state.faction ?? 'bleu';

  // Bandeau d'alerte éphémère (débarquement, château tombé) : le dernier message chasse le précédent.
  // 'news' = chronique du monde (deux rivaux s'étripent) : ni menace pour toi, ni victoire.
  const raiseAlert = (text: string, tone: AlertTone = 'war') => {
    setAlert({ text, tone });
    if (alertT.current) window.clearTimeout(alertT.current);
    alertT.current = window.setTimeout(() => setAlert(null), 7000);
  };
  useEffect(() => () => void (alertT.current && window.clearTimeout(alertT.current)), []);

  // Le moteur garde les callbacks de sa création : on lui donne la vassalité via une référence vivante.
  const vassalRef = useRef(state.vassal ?? null);
  vassalRef.current = state.vassal ?? null;
  const tributeCarry = useRef<Record<ResKind, number>>({ gold: 0, wood: 0, food: 0 });

  // Fin du vassalage (rançon payée ou suzerain rasé) : le tribut accumulé revient d'un bloc.
  const liberate = (how: 'armes' | 'rançon') => {
    if (!vassalRef.current) return;
    setState(breakYoke);
    raiseAlert(
      how === 'armes'
        ? 'Le château de ton suzerain est tombé — le joug est brisé ! Le tribut t’est rendu.'
        : 'Rançon payée : tes mots ont racheté ta couronne. Le tribut t’est rendu !',
      'win',
    );
  };

  // Libération par les mots : la rançon se paie en quêtes d'anglais terminées.
  useEffect(() => {
    // On compte les VRAIES quêtes : sinon le compte dev (tout débloqué) paierait la rançon d'office.
    if (state.vassal && ransomLeft(state, questsDone(state)) === 0) liberate('rançon');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.lessons, state.vassal]);

  const isDev = useIsDev();
  const done = isDev ? TOTAL_LESSONS : questsDone(state);
  const unlocked = useMemo(() => unlockedIslands(done), [done]);
  const openBig = WORLD.islands.filter((isl, i) => isl.size > 12 && unlocked.has(i)).length;
  const next = nextUnlock(done);
  const levies = banAvailable(state, done); // soldats que l'anglais déjà fait te permet de lever
  const caps = useMemo(() => capsWith(state.placed ?? [], state.decorRemoved), [state.placed, state.decorRemoved]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const eng = createWorld(canvas, {
      placed: state.placed ?? [],
      unlocked,
      missionsDone: done,
      ruins: state.ruins ?? [],
      playerFaction: state.faction ?? 'bleu',
      onMove: (k, x, y) =>
        setState((current) => ({
          ...current,
          placed: (current.placed ?? []).map((p) => (p.k === k ? { ...p, x, y } : p)),
        })),
      onVariant: (k, id, flip) =>
        setState((current) => ({
          ...current,
          placed: (current.placed ?? []).map((p) => (p.k === k ? { ...p, id, flip } : p)),
        })),
      onSelect: (k, info) => {
        setSelected(k);
        setSelInfo(info ?? null);
        setConfirmDel(false);
      },
      onMoveMode: setMoving,
      onOrderMode: setOrdering,
      onTroop: setTroop,
      // Menu du portail : on le recale dans le cadre, sinon un clic droit près du bord droit ou
      // du bas ouvrirait la liste hors de l'écran.
      onPortalMenu: (m) => {
        if (!m) return setPortalMenu(null);
        const r = wrap.getBoundingClientRect();
        const w = 244;
        const h = 92 + m.dests.length * 40;
        setPortalMenu({
          ...m,
          openedAt: Date.now(),
          at: { x: Math.max(8, Math.min(m.at.x, r.width - w - 8)), y: Math.max(8, Math.min(m.at.y, r.height - h - 8)) },
        });
      },
      onNotice: (text) => raiseAlert(text, 'news'),
      // Un bâtiment vient d'être rasé : on garde sa ruine sur place, relevable à moitié prix.
      onRuin: (id, x, y) =>
        setState((current) => ({
          ...current,
          ruins: [...(current.ruins ?? []), { k: `ruine-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, id, x, y }],
        })),
      stock: { gold: state.coins, wood: state.resources?.wood ?? 0, food: state.resources?.food ?? 0 },
      decorPos: state.decorPos ?? {},
      decorRemoved: state.decorRemoved ?? [],
      damage: state.damage ?? {},
      // PV des bâtiments et unités abîmés : la carte reprend dans l'état où tu l'as quittée.
      onDamage: (batch) =>
        setState((current) => {
          const next = { ...(current.damage ?? {}) };
          for (const [k, hp] of Object.entries(batch)) {
            if (hp > 0) next[k] = hp;
            else delete next[k]; // entité disparue : on oublie la clé (sinon l'état enflerait sans fin)
          }
          return { ...current, damage: next };
        }),
      upgrades: state.upgrades ?? {},
      // Vétérance gagnée au combat, batchée ~1/s : elle voyage sur l'entrée `placed` du soldat, qui
      // disparaît avec lui (`onUnitLost`) — pas d'état orphelin à nettoyer.
      onXp: (batch) =>
        setState((current) => ({
          ...current,
          placed: (current.placed ?? []).map((p) => (batch[p.k] !== undefined ? { ...p, xp: batch[p.k] } : p)),
        })),
      onDecorMove: (id, x, y) =>
        setState((current) => ({ ...current, decorPos: { ...(current.decorPos ?? {}), [id]: [x, y] } })),
      onUnitLost: (k) =>
        setState((current) => ({ ...current, placed: (current.placed ?? []).filter((p) => p.k !== k) })),
      // Un bâtiment du décor rasé ne doit pas réapparaître au rechargement : la conquête est définitive.
      onDecorRemove: (id) =>
        setState((current) => ({ ...current, decorRemoved: [...new Set([...(current.decorRemoved ?? []), id])] })),
      onInvasion: (fac, island, n) => raiseAlert(`Le royaume ${fac} débarque sur « ${island} » — ${n} soldats !`),
      // Deux royaumes rivaux se font la guerre : le monde tourne sans toi, on te le raconte.
      onWar: (attacker, defender, island, n) =>
        raiseAlert(`Chronique : le royaume ${attacker} jette ${n} soldats sur « ${island} », tenue par le ${defender}.`, 'news'),
      // `fac` = le camp qui PERD le château, `winner` = celui qui s'en empare.
      onCastle: (kind, fac, winner) => {
        if (kind === 'perdu') return raiseAlert('Un de tes châteaux est tombé ! Défends les autres.');
        if (kind === 'rival')
          return raiseAlert(`Chronique : un château ${fac} est tombé aux mains du royaume ${winner}.`, 'news');
        if (kind === 'pris') {
          // Le DERNIER château d'un rival : si c'était ton suzerain, le joug se brise — même si c'est
          // un autre rival qui l'a abattu pour toi.
          if (vassalRef.current?.of === fac) return liberate('armes');
          return winner === faction
            ? raiseAlert(`Le royaume ${fac} n’a plus de château — son île se libère !`, 'win')
            : raiseAlert(`Chronique : le royaume ${fac} s’effondre, abattu par le ${winner}.`, 'news');
        }
        // 'soumis' : ton dernier château est tombé, tu passes sous la tutelle du vainqueur.
        const lord = winner ?? fac;
        setState((current) =>
          current.vassal
            ? current
            : { ...current, vassal: { of: lord, atQuests: questsDone(current), tribute: { gold: 0, wood: 0, food: 0 } } },
        );
        raiseAlert(`Ton dernier château est tombé. Le royaume ${lord} plante sa bannière : tu lui dois tribut.`);
      },
      // Objet de l'inventaire posé sur la carte : on le retire de l'inventaire et on l'ajoute aux objets placés.
      onPlaceNew: (k, id, x, y, flip) =>
        setState((current) => ({
          ...current,
          inventory: (current.inventory ?? []).filter((it) => it.k !== k),
          placed: [...(current.placed ?? []), { k, id, x, y, flip }],
        })),
      onHarvest: (kind, amount) => {
        // Sous tutelle, le suzerain prélève sa part au passage (calculée hors du setState, qui doit rester pur).
        const levy = vassalRef.current ? levyTribute(kind, amount, tributeCarry.current) : 0;
        const net = amount - levy;
        setState((current) => {
          const v = current.vassal;
          const owed = v && levy ? { ...v, tribute: { ...v.tribute, [kind]: v.tribute[kind] + levy } } : v;
          return kind === 'gold'
            ? { ...current, coins: current.coins + net, vassal: owed }
            : {
                ...current,
                vassal: owed,
                resources: {
                  wood: (current.resources?.wood ?? 0) + (kind === 'wood' ? net : 0),
                  food: (current.resources?.food ?? 0) + (kind === 'food' ? net : 0),
                },
              };
        });
      },
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
    engineRef.current?.setRuins(state.ruins ?? []);
  }, [state.ruins]);

  useEffect(() => {
    engineRef.current?.setUnlocked(unlocked, done);
  }, [unlocked, done]);

  // Menu du portail ouvert : Échap le referme, comme n'importe quel menu contextuel.
  useEffect(() => {
    if (!portalMenu) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && engineRef.current?.closePortalMenu();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [portalMenu]);

  // Tient le moteur informé des réserves (pour savoir quand le stockage est plein).
  useEffect(() => {
    engineRef.current?.setStock({ gold: state.coins, wood: state.resources?.wood ?? 0, food: state.resources?.food ?? 0 });
  }, [state.coins, state.resources]);

  // Nouvel entraînement payé au Marché : les soldats déjà sur la carte montent en grade sur-le-champ,
  // sans recréer le moteur (ce qui ferait repartir tout le monde de sa position d'origine).
  useEffect(() => {
    engineRef.current?.setUpgrades(state.upgrades ?? {});
  }, [state.upgrades]);

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

  // Ressources de départ : dépose une fois 4 filons d'or sur l'île (elle n'en a pas), en objets
  // possédés — donc déplaçables, exploitables et sauvegardés. Re-déposés après une réinitialisation.
  // Deux ne suffisaient pas : un filon ne se laisse exploiter que par UN mineur à la fois, si bien
  // qu'au-delà de deux mineurs les autres n'avaient littéralement rien à faire.
  // Les parties déjà commencées n'ont reçu que 2 filons : on les complète une seule fois (`goldTopUp`),
  // sinon leurs mineurs resteraient deux fois moins occupés que ceux d'une partie neuve.
  useEffect(() => {
    if (state.starters && state.goldTopUp) return;
    setState((c) => {
      if (c.starters && c.goldTopUp) return c;
      const placed = c.placed ?? [];
      const have = c.starters ? placed.filter((p) => /^or(-|$)/.test(p.id)).length : 0;
      const add: GameState['placed'] = [];
      for (let i = have; i < 4; i++) {
        const id = 'or';
        const { x, y } = findSpot(unlocked, [...placed, ...add], id, c.decorPos ?? {}, c.decorRemoved ?? []);
        add.push({ k: `${id}-start-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, id, x: Math.round(x), y: Math.round(y) });
      }
      return { ...c, starters: true, goldTopUp: true, placed: [...placed, ...add] };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.starters, state.goldTopUp]);

  const sel = selected && selInfo?.bought ? (state.placed ?? []).find((p) => p.k === selected) : null;
  const selItem = selInfo ? SHOP_MAP[selInfo.id] : null;
  const baseName = selItem?.name ?? (selInfo ? SPRITES[selInfo.id]?.name ?? 'Habitant' : '');
  const selName = selInfo?.ruin ? `Ruine — ${baseName}` : baseName;
  const refund = sel && selItem ? Math.floor(selItem.price / 2) : 0;
  const isUnit = selInfo ? !!SPRITES[selInfo.id]?.run || selItem?.category === 'soldats' || selItem?.category === 'animaux' : false;
  const role = selInfo?.ruin
    ? 'Vestige · relève-le pour moitié prix'
    : selInfo
    ? jobOf(selInfo.id)
      ? `${jobOf(selInfo.id)!.name} · ${jobOf(selInfo.id)!.blurb}`
      : /^villageois/.test(selInfo.id)
      ? 'Ouvrier · récolte le bois, l’or et la nourriture'
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

  // ---- Relever une ruine : moitié prix, à l'emplacement exact du bâtiment rasé, et dans TA couleur.
  const ruinCost = selInfo?.ruin ? rebuildCost(selInfo.id, faction) : null;
  const canRebuild =
    !!ruinCost &&
    (isDev ||
      (state.coins >= ruinCost.price &&
        (state.resources?.wood ?? 0) >= ruinCost.wood &&
        (state.resources?.food ?? 0) >= ruinCost.food));
  function rebuild() {
    const k = selInfo?.ruin;
    if (!k || !ruinCost || !canRebuild) return;
    const spot = (state.ruins ?? []).find((r) => r.k === k);
    if (!spot) return;
    setState((current) => ({
      ...current,
      ruins: (current.ruins ?? []).filter((r) => r.k !== k),
      // Le bâtiment reparaît directement posé : la ruine tenait déjà la place, pas de re-pose à la main.
      placed: [...(current.placed ?? []), { k: `${ruinCost.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, id: ruinCost.id, x: spot.x, y: spot.y }],
      coins: isDev ? current.coins : current.coins - ruinCost.price,
      resources: isDev
        ? (current.resources ?? { wood: 0, food: 0 })
        : { wood: (current.resources?.wood ?? 0) - ruinCost.wood, food: (current.resources?.food ?? 0) - ruinCost.food },
      stats: { ...current.stats, rebuilt: (current.stats.rebuilt ?? 0) + 1 },
    }));
    engineRef.current?.deselect();
  }

  // Réparation : un bâtiment abîmé se relève d'un coup contre du bois, au prorata des dégâts.
  // (Les murs ne se régénèrent quasiment plus tout seuls — attendre n'est plus une option.)
  const fixCost =
    selInfo?.mine && selInfo.hp !== undefined && selInfo.maxHp !== undefined ? repairCost(selInfo.id, selInfo.hp, selInfo.maxHp) : 0;
  const canFix = fixCost > 0 && (isDev || (state.resources?.wood ?? 0) >= fixCost);
  function repair() {
    if (!selected || !fixCost || !canFix) return;
    const paid = engineRef.current?.repair(selected) ?? 0;
    if (!paid || isDev) return;
    setState((current) => ({
      ...current,
      resources: { wood: (current.resources?.wood ?? 0) - paid, food: current.resources?.food ?? 0 },
    }));
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

  // Inventaire d'achats en attente de pose.
  const invItems = state.inventory ?? [];
  // Pose un objet de l'inventaire : on entre en mode « pose » (fantôme déplaçable). Il quitte
  // l'inventaire seulement une fois réellement posé (via onPlaceNew).
  function placeFromInv(k: string, id: string) {
    setSelInfo({ id, bought: true }); // pour afficher le nom dans la bannière de pose
    setSelected(null);
    engineRef.current?.placeNew(k, id);
  }
  // Annule un achat tant qu'il n'est pas posé : rembourse (hors compte dev, qui n'a rien payé).
  function cancelInv(k: string, id: string) {
    const item = SHOP_MAP[id];
    setState((current) => ({
      ...current,
      coins: isDev || !item ? current.coins : current.coins + item.price,
      resources:
        isDev || !item
          ? current.resources ?? { wood: 0, food: 0 }
          : {
              wood: (current.resources?.wood ?? 0) + (item.wood ?? 0),
              food: (current.resources?.food ?? 0) + (item.food ?? 0),
            },
      inventory: (current.inventory ?? []).filter((it) => it.k !== k),
    }));
  }

  // Réinitialise la carte : retire tout ce qui a été placé/récolté et restaure le décor d'origine.
  function resetMap() {
    setState((current) => ({ ...current, coins: 0, placed: [], inventory: [], decorPos: {}, decorRemoved: [], damage: {}, resources: { wood: 0, food: 0 }, starters: false, goldTopUp: false, vassal: null }));
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
          Glisser : explorer la carte, ou déplacer ce qu’on saisit · double-clic maintenu : encadrer une troupe ·
          clic droit : l’envoyer, ou sur un portail : choisir l’île de sortie · molette : zoomer
        </p>
      </div>

      {/* Réserves : récoltées en temps réel par les villageois (x / capacité de stockage) */}
      <div className="pointer-events-none absolute left-1/2 top-3 flex -translate-x-1/2 gap-2 md:top-5">
        {/* Mêmes icônes qu'au Marché (pièce, bûche, pièce de viande) : les deux barres de réserves du
            jeu se lisent pareil. Le mouton n'avait rien à faire ici — c'est la BÊTE, pas la
            ressource ; ce que le villageois rapporte et qu'on stocke, c'est de la viande. */}
        {/* L'or n'affiche pas de capacité : c'est le trésor, il n'est pas plafonné (cf. `roomFor`). */}
        {([
          { k: 'gold', v: state.coins, cap: null },
          { k: 'wood', v: state.resources?.wood ?? 0, cap: caps.wood },
          { k: 'food', v: state.resources?.food ?? 0, cap: caps.food },
        ] as const).map(({ k, v, cap }) => {
          const full = cap !== null && v >= cap;
          return (
            <span
              key={k}
              title={full ? 'Stockage plein — construis pour agrandir' : undefined}
              className={`flex items-center gap-1.5 rounded-md bg-[#2b1a0d]/85 px-2.5 py-1 text-base font-bold shadow-lg ${
                full ? 'text-[#ff9a8a]' : 'text-[#ffe7a6]'
              }`}
            >
              {/* Plus grosses qu'au Marché : ici elles sont posées sur la carte, en plein décor —
                  à 20 px on ne distinguait plus la bûche de la viande. */}
              <Res kind={k === 'gold' ? 'coin' : k} size={28} />{' '}
              {v}
              {cap !== null && <span className="text-[11px] font-semibold opacity-70">/ {cap}</span>}
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
        {/* Le ban qui t'attend : l'anglais déjà fait te doit des soldats, va les lever au Marché. */}
        {levies > 0 && (
          <button
            onClick={() => navigate('shop')}
            title="Lever des soldats au Marché, sans or ni caserne"
            className="rounded-md border border-[#c9a24a] bg-[#2b1a0d]/80 px-3 py-1 text-[11px] font-semibold text-[#ffe7a6] transition hover:bg-[#3a2513]"
          >
            ⚜ Ban royal : {levies} levée{levies > 1 ? 's' : ''}
          </button>
        )}
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

      {/* Sous tutelle : le suzerain prélève un tiers de chaque récolte tant que le joug n'est pas brisé. */}
      {state.vassal && (
        <div className="pointer-events-none absolute bottom-16 left-3 max-w-[17rem] rounded-md border-l-4 border-[#ff8a6b] bg-[#2b0d0d]/90 px-3 py-2 shadow-xl md:bottom-[4.75rem] md:left-6">
          <div className="flex items-center gap-2 text-sm font-bold text-[#ffd9cc]">
            <Swords className="size-4" /> Vassal du royaume {state.vassal.of}
          </div>
          <div className="mt-0.5 text-[11px] leading-snug text-[#ffd9cc]/80">
            Un tiers de tes récoltes part au tribut ({state.vassal.tribute.gold} or prélevé).
            <br />
            Rançon : encore {ransomLeft(state, questsDone(state))} quête
            {ransomLeft(state, questsDone(state)) > 1 ? 's' : ''} — ou rase son dernier château.
          </div>
        </div>
      )}

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
            <Swords className="size-4 animate-pulse" />
            <span>
              {troop > 0
                ? `${troop} soldat${troop > 1 ? 's' : ''} retenu${troop > 1 ? 's' : ''} — touche un point pour les y envoyer`
                : 'Touche un point (ou un ennemi) pour y envoyer tes troupes'}
              <small className="ml-2 block font-normal opacity-70 md:ml-0">Double-clic maintenu pour n’encadrer qu’une partie de ton armée</small>
            </span>
            <Button size="sm" variant="secondary" onClick={() => engineRef.current?.cancelOrder()}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Clic droit sur un portail, troupe retenue : la liste des portails d'arrivée. Choisir un
          nom envoie la troupe s'y engouffrer. Le voile derrière attrape le clic « à côté ». */}
      {portalMenu && (
        <>
          {/* Le voile ne se referme QUE sur un nouvel appui, et jamais sur `contextmenu` : sous
              Windows cet évènement part au RELÂCHÉ du clic droit, donc après que React a monté le
              voile — il atterrissait dessus et refermait le menu dans la foulée de son ouverture
              (le menu « clignotait »). Le garde-temps couvre les navigateurs qui ordonnent encore
              autrement les évènements d'un même clic. */}
          <div
            className="absolute inset-0 z-30"
            onPointerDown={() => Date.now() - portalMenu.openedAt > 250 && engineRef.current?.closePortalMenu()}
            onContextMenu={(e) => e.preventDefault()}
          />
          <div
            className="absolute z-40 w-[244px] overflow-hidden rounded-lg border-2 border-[#c9a24a] bg-[#2b1a0d]/95 shadow-[0_0_28px_rgba(0,0,0,0.6)]"
            style={{ left: portalMenu.at.x, top: portalMenu.at.y }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="border-b border-[#6b552a] px-3 py-2">
              <div className="font-display text-sm text-[#ffe7a6]">Portail de {portalMenu.fromName}</div>
              <div className="text-[11px] text-[#e8dcc2]/80">
                {portalMenu.n} soldat{portalMenu.n > 1 ? 's' : ''} — où les faire ressortir ?
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {portalMenu.dests.map((d) => (
                <button
                  key={d.k}
                  onClick={() => engineRef.current?.warpTroop(portalMenu.from, d.k)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#ffeccc] transition hover:bg-[#3a2513]"
                >
                  <MapPin className="size-4 shrink-0 text-[#ffcf6b]" />
                  <span className="truncate">{d.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => engineRef.current?.closePortalMenu()}
              className="w-full border-t border-[#6b552a] px-3 py-1.5 text-[11px] font-semibold text-[#e8dcc2]/70 transition hover:bg-[#3a2513]"
            >
              Annuler
            </button>
          </div>
        </>
      )}

      {/* Alerte de guerre : débarquement ennemi, château perdu ou pris, ou chronique du monde.
          Disparaît toute seule. */}
      {alert && !moving && !ordering && (
        <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 md:top-5">
          <div
            className={`flex items-center gap-3 rounded-lg border-2 px-4 py-2 text-sm font-bold shadow-[0_0_24px_rgba(0,0,0,0.5)] ${
              alert.tone === 'win'
                ? 'border-[#8cff9e] bg-[#1d2b14]/90 text-[#d8ffdc]'
                : alert.tone === 'news'
                  ? 'border-[#c9a24a] bg-[#211a10]/90 text-[#f0dfb8]'
                  : 'border-[#ff8a6b] bg-[#2b0d0d]/90 text-[#ffd9cc]'
            }`}
          >
            {alert.tone === 'news' ? <ScrollText className="size-4" /> : <Swords className="size-4 animate-pulse" />} {alert.text}
          </div>
        </div>
      )}

      {/* Inventaire : achats en attente de pose (case blanche transparente). Cliquer = poser, × = annuler (remboursé). */}
      {invItems.length > 0 && !moving && !ordering && (
        <div className="absolute left-2 top-1/2 z-10 flex max-h-[68vh] -translate-y-1/2 flex-col gap-2 overflow-y-auto rounded-xl border border-white/40 bg-white/15 p-2 shadow-lg backdrop-blur-sm md:left-4">
          <div className="px-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-white/85">
            À poser ({invItems.length})
          </div>
          {invItems.map(({ k, id }) => (
            <div key={k} className="relative">
              <button
                onClick={() => placeFromInv(k, id)}
                title={`Poser ${SHOP_MAP[id]?.name ?? SPRITES[id]?.name ?? id}`}
                className="grid h-14 w-14 place-items-center overflow-hidden rounded-lg border-2 border-white/50 bg-white/20 transition hover:border-[#ffe7a6] hover:bg-white/30"
              >
                <Sprite k={id} act={jobOf(id)?.tool} height={46} crop={0.12} />
              </button>
              <button
                onClick={() => cancelInv(k, id)}
                title="Annuler l’achat (remboursé)"
                aria-label="Annuler l’achat"
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-white/40 bg-[#7a1616] text-white shadow hover:bg-[#a11d1d]"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && selInfo && !moving && (
        <div className="absolute bottom-20 left-1/2 z-10 w-[min(94vw,400px)] -translate-x-1/2 md:bottom-6">
          <div className="paper-dark p-1">
            <div className="flex items-center gap-3">
              <Sprite k={selInfo.id} act={jobOf(selInfo.id)?.tool} height={56} crop={isUnit ? unitCrop(selInfo.id, 0.2) : 0} />
              <div className="min-w-0 flex-1">
                <div className="font-display truncate text-[#ffe7a6]">{selName}</div>
                <div className="text-[11px] text-[#e8dcc2]/80">
                  {/* Le glissement trace le lasso : c'est « Déplacer » qui sert à repositionner. */}
                  {role ?? (isUnit ? 'Habitant de l’archipel' : 'Élément de l’archipel')} · « Déplacer » pour le repositionner
                </div>
                {/* Grade du soldat : entraînement payé + vétérance gagnée au combat. */}
                {!!selInfo.rank && selInfo.rank > 1 && (
                  <div className="text-[11px] font-semibold" style={{ color: selInfo.rank >= RANK_MAX ? '#ffd35c' : '#e6e6dc' }}>
                    {'⌃'.repeat(selInfo.rank - 1)} Niveau {selInfo.rank}
                    {!!selInfo.xp && <span className="ml-1 font-normal text-[#e8dcc2]/70">· {selInfo.xp} ennemi{selInfo.xp > 1 ? 's' : ''} abattu{selInfo.xp > 1 ? 's' : ''}</span>}
                  </div>
                )}
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
              <div className="mt-2 space-y-2">
                {ruinCost && (
                  <Button size="sm" className="w-full" disabled={!canRebuild} onClick={rebuild}>
                    <Hammer />
                    <span className="flex items-center gap-2">
                      Relever
                      <span className={state.coins >= ruinCost.price ? 'text-[#ffe7a6]' : 'text-[#ff9a8a]'}><Res kind="gold" /> {ruinCost.price}</span>
                      {ruinCost.wood > 0 && (
                        <span className={(state.resources?.wood ?? 0) >= ruinCost.wood ? 'text-[#ffe7a6]' : 'text-[#ff9a8a]'}><Res kind="wood" /> {ruinCost.wood}</span>
                      )}
                      {ruinCost.food > 0 && (
                        <span className={(state.resources?.food ?? 0) >= ruinCost.food ? 'text-[#ffe7a6]' : 'text-[#ff9a8a]'}><Res kind="food" /> {ruinCost.food}</span>
                      )}
                      <small className="opacity-70">moitié prix</small>
                    </span>
                  </Button>
                )}
                {fixCost > 0 && (
                  <Button size="sm" variant="secondary" className="w-full" disabled={!canFix} onClick={repair}>
                    <Hammer />
                    <span>
                      Réparer <span className={canFix ? 'text-[#ffe7a6]' : 'text-[#ff9a8a]'}><Res kind="wood" /> {fixCost}</span>
                    </span>
                  </Button>
                )}
                {/* Une ruine ne se déplace ni ne se vend : on la relève, ou on la laisse. */}
                {!selInfo.ruin && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" onClick={startMove}>
                      <Move /> Déplacer
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setConfirmDel(true)}>
                      <Trash2 /> {sel ? `Vendre (+${refund})` : 'Supprimer'}
                    </Button>
                  </div>
                )}
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
  const done = isDev ? TOTAL_LESSONS : questsDone(state);
  const unlocked = useMemo(() => unlockedIslands(done), [done]);
  const placedItems = state.placed ?? [];
  const inv = state.inventory ?? [];
  const wood = state.resources?.wood ?? 0;
  const food = state.resources?.food ?? 0;
  const caps = capsWith(placedItems, state.decorRemoved);
  const popMax = popMaxOf(placedItems);
  // La population « utilisée » compte aussi les soldats en attente dans l'inventaire (pas encore posés).
  const invPop = inv.filter((it) => SHOP_MAP[it.id]?.category === 'soldats').length;
  const popUsed = popUsedOf(placedItems) + invPop;
  const faction = state.faction ?? 'bleu';
  const factionInfo = FACTIONS.find((f) => f.id === faction)!;
  // Combien d'un article possède-t-on déjà (posé + en attente dans l'inventaire) ?
  const ownedOf = (item: (typeof SHOP)[number]) => {
    const ids = item.variants ?? [item.id];
    return placedItems.filter((p) => ids.includes(p.id)).length + inv.filter((it) => ids.includes(it.id)).length;
  };

  function buy(id: string) {
    const item = SHOP_MAP[id];
    if (!item) return;
    const placed = state.placed ?? [];
    const count = ownedOf(item);
    const res = state.resources ?? { wood: 0, food: 0 };
    const woodCost = item.wood ?? 0;
    const foodCost = item.food ?? 0;
    // Vérifs (or, ressources, bâtiment requis, population) — ignorées sur le compte dev (achat libre pour tout tester).
    if (count >= item.max) return;
    if (!isDev) {
      if (state.coins < item.price || res.wood < woodCost || res.food < foodCost) return;
      if (item.needs && !ownsBuilding(placed, item.needs)) return;
      if ((item.pop ?? 0) > 0 && popUsed + (item.pop ?? 0) > popMax) return;
    }
    const k = `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    // L'achat va dans l'inventaire (case à poser) au lieu d'être posé d'office : plus d'allers-retours,
    // et on peut annuler tant que ce n'est pas posé. On reste au marché pour continuer à acheter.
    setState((current) => ({
      ...current,
      // Dev : rien n'est débité (ressources illimitées, seulement sur ton compte).
      coins: isDev ? current.coins : current.coins - item.price,
      resources: isDev
        ? current.resources ?? { wood: 0, food: 0 }
        : {
            wood: (current.resources?.wood ?? 0) - woodCost,
            food: (current.resources?.food ?? 0) - foodCost,
          },
      inventory: [...(current.inventory ?? []), { k, id }],
      stats: { ...current.stats, bought: (current.stats.bought ?? 0) + 1 },
    }));
    setBought(id);
    window.setTimeout(() => setBought((b) => (b === id ? null : b)), 1400);
  }

  // ---- L'Entraînement : un palier payé une fois, valable pour TOUT un corps de troupe.
  function train(base: string) {
    const to = trainedRank(state.upgrades, base) + 1;
    const cost = upgradeCost(base, to);
    if (!cost) return;
    if (!isDev && (state.coins < cost.gold || wood < cost.wood)) return;
    setState((current) => ({
      ...current,
      coins: isDev ? current.coins : current.coins - cost.gold,
      resources: isDev
        ? current.resources ?? { wood: 0, food: 0 }
        : { wood: (current.resources?.wood ?? 0) - cost.wood, food: current.resources?.food ?? 0 },
      upgrades: { ...(current.upgrades ?? {}), [base]: to },
      stats: { ...current.stats, trained: (current.stats.trained ?? 0) + 1 },
    }));
    setBought(base);
    window.setTimeout(() => setBought((b) => (b === base ? null : b)), 1400);
  }

  // ---- Le Ban royal : une quête d'anglais = une levée, une levée = un soldat sans or ni caserne.
  const levies = banAvailable(state, done);
  // Le compte créateur ignore la population, comme il ignore déjà les coûts dans `buy` : sinon on
  // pouvait acheter un soldat sans limite mais pas le lever, ce qui n'a aucun sens.
  const banFull = !isDev && popUsed >= popMax;
  function callBan(base: string) {
    if (levies < 1 || banFull) return;
    const id = applyFaction(base, faction);
    // Le décompte est refait sur `current` : c'est lui qui fait foi au moment d'écrire l'état.
    setState((current) => levy(current, base, faction, isDev ? TOTAL_LESSONS : questsDone(current)));
    setBought(id);
    window.setTimeout(() => setBought((b) => (b === id ? null : b)), 1400);
  }

  // Le joueur ne recrute/bâtit que dans sa couleur (les autres couleurs sont des rivaux).
  const hasFactions = cat === 'soldats' || cat === 'batiments';
  // `!i.faction` : le Portail n'appartient à aucun royaume — sans cette exception il disparaissait
  // de la grille, filtré comme un bâtiment d'une autre couleur.
  const items = SHOP.filter((i) => i.category === cat && !i.hidden && (!hasFactions || !i.faction || i.faction === faction));
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
            {/* Le trésor n'a pas de capacité : seuls le bois et la nourriture se stockent. */}
            <span className="flex items-center gap-1" title="Trésor du royaume">
              <img src={uiUrl('icon_03.png')} alt="" className="pixel h-5 w-5" /> {state.coins}
            </span>
            <span className={`flex items-center gap-1 ${wood >= caps.wood ? 'text-[#ff9a8a]' : ''}`} title="Bois / capacité">
              <Res kind="wood" /> {wood}
              <span className="text-[11px] opacity-70">/ {caps.wood}</span>
            </span>
            <span className={`flex items-center gap-1 ${food >= caps.food ? 'text-[#ff9a8a]' : ''}`} title="Nourriture / capacité">
              <Res kind="food" /> {food}
              <span className="text-[11px] opacity-70">/ {caps.food}</span>
            </span>
            <span className={`flex items-center gap-1 ${popUsed >= popMax ? 'text-[#ff9a8a]' : ''}`}>
              <img src={uiUrl('icon_01.png')} alt="population" className="pixel inline-block h-5 w-5 align-[-4px]" /> {popUsed}/{popMax}
            </span>
          </div>
          {navigate && (
            <Button variant="secondary" onClick={() => navigate('island')}>
              <MapPin /> {inv.length ? `Poser (${inv.length})` : 'Voir mon royaume'}
            </Button>
          )}
        </div>
      </div>

      {/* Le Ban royal : le pont entre l'anglais et la guerre. Une quête = une levée = un soldat
          gratuit, sans le bâtiment normalement requis. Seule la population reste une limite. */}
      <Card className="border-2 border-[#c9a24a] bg-[#211a10]/70">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg text-[#ffe7a6]">⚜ Le Ban royal</h2>
            <span className={`text-sm font-bold ${levies > 0 ? 'text-[#ffe7a6]' : 'text-[#ff9a8a]'}`}>
              {levies} levée{levies > 1 ? 's' : ''} disponible{levies > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Chaque quête d’anglais terminée te donne une levée. Une levée lève un soldat <b>sans or et sans caserne</b> — ton étude arme le
            royaume plus vite que ton trésor.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {BAN_UNITS.map((u) => {
              const id = applyFaction(u.base, faction);
              const can = levies > 0 && !banFull;
              return (
                <div key={u.base} className="flex items-center gap-3 rounded-md border border-[#6b552a] bg-[#1a140c]/60 p-2">
                  <Sprite k={id} height={46} crop={unitCrop(id)} />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[15px] text-[#ffe7a6]">{u.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{u.blurb}</div>
                  </div>
                  <Button size="sm" disabled={!can} onClick={() => callBan(u.base)}>
                    {bought === id ? (
                      <>
                        <Check /> Levé !
                      </>
                    ) : can ? (
                      'Lever'
                    ) : (
                      <>
                        <Lock /> {banFull ? 'Population' : 'Anglais'}
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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

      {/* Entraînement : une carte par corps de troupe, pas un article à poser sur la carte. */}
      {cat === 'entrainement' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {TRAININGS.map((tr) => {
            const id = applyFaction(tr.base, faction);
            const rank = trainedRank(state.upgrades, tr.base);
            const maxed = rank >= RANK_MAX;
            const next = rank + 1;
            const cost = upgradeCost(tr.base, next);
            const needBld = tr.needs && !ownsBuilding(placedItems, tr.needs);
            const afford = !!cost && state.coins >= cost.gold && wood >= cost.wood;
            const canBuy = !maxed && (isDev || (afford && !needBld));
            return (
              <Card key={tr.base}>
                <CardContent className="flex flex-col items-center gap-1.5 p-2 text-center">
                  <div className="grid h-28 w-full place-items-end justify-center overflow-hidden">
                    <Sprite k={id} height={100} crop={unitCrop(id)} />
                  </div>
                  <div className="font-display leading-tight">{tr.name}</div>
                  <div className="text-[11px] text-[hsl(var(--accent))]">{tr.blurb}</div>
                  {/* Chevrons : autant que de niveaux acquis au-delà du premier. */}
                  <div className="text-sm font-bold tracking-widest" style={{ color: maxed ? '#ffd35c' : '#e6e6dc' }}>
                    {'★'.repeat(rank)}
                    <span className="opacity-30">{'★'.repeat(RANK_MAX - rank)}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">Niveau {rank} — +35 % PV et +30 % dégâts par palier</div>
                  {cost && !maxed && (
                    <div className="flex flex-wrap items-center justify-center gap-x-2 text-[11px] font-semibold">
                      <span className={state.coins >= cost.gold ? 'text-[#ffe7a6]' : 'text-[#ff9a8a]'}><Res kind="gold" /> {cost.gold}</span>
                      <span className={wood >= cost.wood ? 'text-[#ffe7a6]' : 'text-[#ff9a8a]'}><Res kind="wood" /> {cost.wood}</span>
                    </div>
                  )}
                  {maxed ? (
                    <div className="flex items-center gap-1 text-sm font-bold text-[hsl(var(--primary))]">
                      <Check className="size-4" /> Élite
                    </div>
                  ) : (
                    <Button size="sm" className="w-full" disabled={!canBuy} onClick={() => train(tr.base)}>
                      {bought === tr.base ? (
                        <>
                          <Check /> Entraîné !
                        </>
                      ) : canBuy ? (
                        `Entraîner — niveau ${next}`
                      ) : (
                        <>
                          <Lock /> {needBld ? `Nécessite ${needsLabel(tr.needs!)}` : 'Ressources'}
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const count = ownedOf(item);
          const maxed = count >= item.max;
          const person = item.category === 'soldats' || item.category === 'animaux';
          const needBld = item.needs && !ownsBuilding(placedItems, item.needs);
          const popFull = (item.pop ?? 0) > 0 && popUsed + (item.pop ?? 0) > popMax;
          const afford = state.coins >= item.price && wood >= (item.wood ?? 0) && food >= (item.food ?? 0);
          const canBuy = isDev ? !maxed : !maxed && afford && !needBld && !popFull;
          const verb = item.category === 'batiments' ? 'Construire' : item.category === 'soldats' ? 'Recruter' : 'Acheter';
          const reason = needBld ? `Nécessite ${needsLabel(item.needs!)}` : popFull ? 'Population pleine' : null;
          return (
            <Card key={item.id}>
              <CardContent className="flex flex-col items-center gap-1.5 p-2 text-center">
                <div className="grid h-28 w-full place-items-end justify-center overflow-hidden">
                  {/* Un homme de métier se montre outil en main : c'est ce qui distingue les trois
                      cartes bien avant leur nom. */}
                  <Sprite
                    k={item.id}
                    act={jobOf(item.id)?.tool}
                    height={item.category === 'batiments' ? 108 : person ? 100 : 84}
                    crop={person ? unitCrop(item.id) : 0}
                  />
                </div>
                <div className="font-display leading-tight">{item.name}</div>
                {item.blurb && <div className="text-[11px] text-[hsl(var(--accent))]">{item.blurb}</div>}
                {/* Coûts : or + bois + nourriture (rouge si insuffisant) */}
                <div className="flex flex-wrap items-center justify-center gap-x-2 text-[11px] font-semibold">
                  <span className={state.coins >= item.price ? 'text-[#ffe7a6]' : 'text-[#ff9a8a]'}><Res kind="gold" /> {item.price}</span>
                  {!!item.wood && (<span className={wood >= item.wood ? 'text-[#ffe7a6]' : 'text-[#ff9a8a]'}><Res kind="wood" /> {item.wood}</span>)}
                  {!!item.food && (<span className={food >= item.food ? 'text-[#ffe7a6]' : 'text-[#ff9a8a]'}><Res kind="food" /> {item.food}</span>)}
                  {!!item.pop && (<span className="text-muted-foreground"><Res kind="pop" size={16} /> {item.pop}</span>)}
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
