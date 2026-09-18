const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

// Décor spatial de fond : planètes pixel art + nébuleuse + étoiles.
// Placé derrière le combat X-Wing/TIE pour donner de la profondeur.
const PLANETS: { f: string; size: number; style: React.CSSProperties; dur: number }[] = [
  { f: 'planet_saturn.png', size: 150, style: { top: '6%', left: '2%' }, dur: 26 },
  { f: 'planet_jupiter.png', size: 124, style: { bottom: '6%', left: '2%' }, dur: 30 },
  { f: 'planet_neptune.png', size: 104, style: { top: '5%', right: '3%' }, dur: 32 },
  { f: 'planet_earth.png', size: 92, style: { top: '46%', right: '2%' }, dur: 24 },
  { f: 'planet_death.png', size: 92, style: { top: '54%', left: '43%' }, dur: 36 },
  { f: 'planet_mars.png', size: 74, style: { bottom: '20%', right: '24%' }, dur: 22 },
  { f: 'planet_moon.png', size: 46, style: { top: '72%', left: '20%' }, dur: 18 },
];

export function SpaceBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-[8] overflow-hidden">
      <div className="sb-nebula" />
      <div className="sb-stars" />
      {PLANETS.map((p, i) => (
        <img
          key={i}
          src={asset(p.f)}
          alt=""
          className="sb-planet"
          style={{ ...p.style, height: p.size, animationDuration: `${p.dur}s`, animationDelay: `${-i * 2.5}s` }}
          draggable={false}
        />
      ))}
    </div>
  );
}
