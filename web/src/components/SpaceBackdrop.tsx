import type { CSSProperties } from 'react';

type World = {
  name: string;
  kind: string;
  size: number;
  position: CSSProperties;
  duration: number;
  mobile?: boolean;
};

// Une petite carte de la galaxie, placée sur les bords de l'écran.
const WORLDS: World[] = [
  { name: 'Tatooine', kind: 'tatooine', size: 106, position: { top: '13%', left: '6%' }, duration: 27, mobile: true },
  { name: 'Coruscant', kind: 'coruscant', size: 98, position: { top: '10%', right: '9%' }, duration: 33, mobile: true },
  { name: 'Hoth', kind: 'hoth', size: 86, position: { top: '39%', right: '4%' }, duration: 29, mobile: true },
  { name: 'Naboo', kind: 'naboo', size: 94, position: { top: '47%', left: '3%' }, duration: 35 },
  { name: 'Endor', kind: 'endor', size: 88, position: { bottom: '15%', left: '10%' }, duration: 31, mobile: true },
  { name: 'Mustafar', kind: 'mustafar', size: 90, position: { bottom: '18%', right: '9%' }, duration: 25 },
  { name: 'Dagobah', kind: 'dagobah', size: 72, position: { bottom: '7%', right: '37%' }, duration: 37 },
];

export function SpaceBackdrop() {
  return (
    <div className="sb-scene pointer-events-none fixed inset-0 -z-[8] overflow-hidden" aria-hidden="true">
      <div className="sb-nebula" />
      <div className="sb-stars sb-stars-far" />
      <div className="sb-stars sb-stars-near" />
      <div className="sb-horizon" />
      <div className="sb-orbit sb-orbit-one" />
      <div className="sb-orbit sb-orbit-two" />
      <div className="sb-shooting-star sb-shooting-star-one" />
      <div className="sb-shooting-star sb-shooting-star-two" />
      {WORLDS.map((world, index) => (
        <div
          key={world.name}
          className={`sb-world sb-world-${world.kind}${world.mobile ? ' sb-world-mobile' : ''}`}
          style={{
            ...world.position,
            width: world.size,
            height: world.size,
            animationDuration: `${world.duration}s`,
            animationDelay: `${-index * 3}s`,
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}assets/world_${world.kind}.webp`}
            alt=""
            className="sb-world-image"
            draggable={false}
          />
          <span className="sb-world-name">{world.name}</span>
        </div>
      ))}
    </div>
  );
}
