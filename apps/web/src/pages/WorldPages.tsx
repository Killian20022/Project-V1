import type { GameState } from '../types';

const ITEMS = [
  { id: 'chicken', name: 'Poule', price: 30, asset: 'chicken.png' },
  { id: 'cow', name: 'Vache', price: 80, asset: 'cow.png' },
  { id: 'character', name: 'Explorateur', price: 120, asset: 'character.png' },
  { id: 'tree', name: 'Pommier', price: 40, asset: 'tree_apple.png' },
  { id: 'house', name: 'Maison', price: 150, asset: 'Wooden House.png' },
  { id: 'bridge', name: 'Pont', price: 90, asset: 'bridge.png' },
];

export function ShopPage({ state, update }: { state: GameState; update: (state: GameState) => void }) {
  return <section><h2 className="title">Boutique de l’île</h2><p className="sub">Transforme tes progrès en compagnons et décors.</p><div className="shop-head">Solde : <span className="coin-ic" /> <b>{state.coins}</b> pièces</div><div className="shop-grid">{ITEMS.map(item => {
    const owned = state.island.includes(item.id);
    return <div className={`shop-card ${owned ? 'owned' : ''}`} key={item.id}><img className="shop-image" src={`${import.meta.env.BASE_URL}assets/${item.asset}`} alt="" /><div className="shop-name">{item.name}</div>{owned ? <div className="shop-owned">Possédé</div> : <button className="btn btn-primary shop-buy" disabled={state.coins < item.price} onClick={() => update({ ...state, coins: state.coins - item.price, island: [...state.island, item.id] })}><span className="coin-ic" /> {item.price}</button>}</div>;
  })}</div></section>;
}

export function IslandPage({ state }: { state: GameState }) {
  const owned = ITEMS.filter(item => state.island.includes(item.id));
  return <section><h2 className="title">Mon île</h2><p className="sub">Elle grandit à mesure que tu apprends.</p><div className="island-scene"><img className="island-ground" src={`${import.meta.env.BASE_URL}assets/Grass.png`} alt="Île" />{owned.map((item, index) => <img key={item.id} className={`island-object island-object-${index}`} src={`${import.meta.env.BASE_URL}assets/${item.asset}`} alt={item.name} />)}{!owned.length && <div className="empty-island">Termine des leçons, gagne des pièces et adopte ton premier compagnon.</div>}</div></section>;
}

const TROPHIES = [
  { id: 'first', name: 'Premier pas', description: 'Terminer une leçon', target: 1 },
  { id: 'ten', name: 'En route', description: 'Terminer 10 leçons', target: 10 },
  { id: 'xp100', name: 'Centurion', description: 'Gagner 100 XP', target: 100 },
  { id: 'collector', name: 'Collectionneur', description: 'Posséder 3 objets', target: 3 },
];

export function TrophiesPage({ state }: { state: GameState }) {
  const lessonCount = Object.values(state.lessons).reduce((sum, value) => sum + (value ?? 0), 0);
  return <section><h2 className="title">Trophées</h2><p className="sub">Les étapes marquantes de ton aventure.</p><div className="grid cols">{TROPHIES.map(trophy => {
    const progress = trophy.id === 'xp100' ? state.points : trophy.id === 'collector' ? state.island.length : lessonCount;
    const unlocked = progress >= trophy.target || state.trophies.includes(trophy.id);
    return <div className={`card badge ${unlocked ? 'on' : ''}`} key={trophy.id}><div className="badge-ic">★</div><div className="badge-nm">{trophy.name}</div><div className="badge-ds">{trophy.description}</div><div className="level-prog"><div className="level-prog-fill" style={{ width: `${Math.min(100, progress / trophy.target * 100)}%` }} /></div></div>;
  })}</div></section>;
}
