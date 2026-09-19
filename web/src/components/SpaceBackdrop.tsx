import type { CSSProperties } from 'react';

const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

// Les planètes restent aux bords pour laisser le contenu au premier plan.
const PLANETS: { file: string; size: number; position: CSSProperties; duration: number }[] = [
  { file: 'planet_saturn.png', size: 154, position: { top: '7%', left: '3%' }, duration: 28 },
  { file: 'planet_neptune.png', size: 102, position: { top: '8%', right: '4%' }, duration: 34 },
  { file: 'planet_earth.png', size: 88, position: { top: '48%', right: '3%' }, duration: 26 },
  { file: 'planet_jupiter.png', size: 120, position: { bottom: '5%', left: '3%' }, duration: 32 },
  { file: 'planet_death.png', size: 82, position: { top: '58%', left: '43%' }, duration: 38 },
  { file: 'planet_mars.png', size: 68, position: { bottom: '16%', right: '22%' }, duration: 24 },
  { file: 'planet_moon.png', size: 42, position: { top: '74%', left: '20%' }, duration: 20 },
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
      {PLANETS.map((planet, index) => (
        <img
          key={planet.file}
          src={asset(planet.file)}
          alt=""
          className="sb-planet"
          style={{
            ...planet.position,
            height: planet.size,
            animationDuration: `${planet.duration}s`,
            animationDelay: `${-index * 3}s`,
          }}
          draggable={false}
        />
      ))}
    </div>
  );
}
