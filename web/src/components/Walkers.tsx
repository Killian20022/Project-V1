const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

type Walker = { file: string; size: number; dur: number; delay: number; dir: 1 | -1; bottom: number };

// Petits personnages Star Wars qui traversent le bas de la page (décoratif).
const DEFAULT_WALKERS: Walker[] = [
  { file: 'chip_r2d2.png', size: 42, dur: 22, delay: 0, dir: 1, bottom: 6 },
  { file: 'chip_stormtrooper.png', size: 58, dur: 30, delay: 5, dir: 1, bottom: 2 },
  { file: 'chip_bb8.png', size: 40, dur: 18, delay: 11, dir: -1, bottom: 8 },
  { file: 'chip_chewie.png', size: 62, dur: 34, delay: 16, dir: -1, bottom: 2 },
  { file: 'chip_speeder.png', size: 52, dur: 14, delay: 22, dir: 1, bottom: 6 },
];

/** Personnages qui traversent le bas du conteneur parent (qui doit être `position: relative; overflow: hidden`). */
export function Walkers({ walkers = DEFAULT_WALKERS }: { walkers?: Walker[] }) {
  return (
    <>
      {walkers.map((w, i) => (
        <div
          key={i}
          className={w.dir === 1 ? 'eq-walk-r absolute' : 'eq-walk-l absolute'}
          style={{ bottom: `${w.bottom}px`, animationDuration: `${w.dur}s`, animationDelay: `${w.delay}s` }}
        >
          <div className="eq-bob" style={{ animationDelay: `${i * 0.2}s` }}>
            <img
              src={asset(w.file)}
              alt=""
              style={{
                height: w.size,
                width: 'auto',
                imageRendering: 'pixelated',
                transform: `scaleX(${w.dir})`,
                transformOrigin: 'bottom center',
                filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.3))',
              }}
              draggable={false}
            />
          </div>
        </div>
      ))}
    </>
  );
}
