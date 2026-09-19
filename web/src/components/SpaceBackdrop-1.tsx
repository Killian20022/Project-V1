import type { CSSProperties } from 'react';

// Décor de l'accueil : étoiles + nébuleuse + planètes Star Wars.
// Les planètes sont dessinées ENTIÈREMENT en CSS (voir les classes .sw-* dans index.css) :
// aucune image, pas de halo carré. Elles flottent doucement et sont placées vers les bords
// pour garder le centre lisible.
type Planet = {
  key: string;
  cls: string;
  size: number;
  pos: CSSProperties;
  dur: number;
  delay: number;
};

const PLANETS: Planet[] = [
  { key: 'tatooine', cls: 'sw-tatooine', size: 148, pos: { top: '5%', left: '2%' }, dur: 27, delay: 0 },
  { key: 'coruscant', cls: 'sw-coruscant', size: 112, pos: { top: '7%', right: '3%' }, dur: 31, delay: -4 },
  { key: 'hoth', cls: 'sw-hoth', size: 100, pos: { bottom: '6%', left: '3%' }, dur: 29, delay: -8 },
  { key: 'mustafar', cls: 'sw-mustafar', size: 86, pos: { bottom: '11%', right: '5%' }, dur: 24, delay: -2 },
  { key: 'endor', cls: 'sw-endor', size: 72, pos: { top: '44%', right: '2%' }, dur: 33, delay: -12 },
  { key: 'deathstar', cls: 'sw-deathstar', size: 66, pos: { top: '68%', left: '20%' }, dur: 34, delay: -6 },
];

export function SpaceBackdrop() {
  return (
    <div className="sb-scene pointer-events-none fixed inset-0 -z-[8] overflow-hidden" aria-hidden="true">
      <div className="sb-nebula" />
      <div className="sb-stars sb-stars-far" />
      <div className="sb-stars sb-stars-near" />
      <div className="sb-shooting-star sb-shooting-star-one" />
      <div className="sb-shooting-star sb-shooting-star-two" />
      {PLANETS.map((p) => (
        <div
          key={p.key}
          className={`sw-planet ${p.cls}`}
          style={{
            ...p.pos,
            width: p.size,
            height: p.size,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
