const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

// Décor spatial de fond : planètes pixel art + nébuleuse + étoiles.
// Placé derrière le combat X-Wing/TIE pour donner de la profondeur.
const PLANETS: { f: string; size: number; style: React.CSSProperties; dur: number }[] = [
  { f: 'planet_saturn.png', size: 168, style: { top: '9%', left: '3%' }, dur: 26 },
  { f: 'planet_gas.png', size: 96, style: { top: '60%', left: '1%' }, dur: 30 },
  { f: 'planet_death.png', size: 76, style: { top: '13%', right: '22%' }, dur: 34 },
  { f: 'planet_mars.png', size: 72, style: { top: '38%', right: '4%' }, dur: 24 },
  { f: 'planet_teal.png', size: 120, style: { bottom: '7%', right: '8%' }, dur: 28 },
  { f: 'planet_moon.png', size: 48, style: { top: '74%', left: '24%' }, dur: 20 },
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
