const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

type Walker = { file: string; frame: number; size: number; dur: number; delay: number; dir: 1 | -1; bottom: number };

const DEFAULT_WALKERS: Walker[] = [
  { file: 'chicken.png', frame: 16, size: 40, dur: 20, delay: 0, dir: 1, bottom: 6 },
  { file: 'cow.png', frame: 32, size: 56, dur: 30, delay: 4, dir: 1, bottom: 2 },
  { file: 'character.png', frame: 48, size: 58, dur: 26, delay: 9, dir: -1, bottom: 4 },
  { file: 'chicken.png', frame: 16, size: 34, dur: 16, delay: 13, dir: -1, bottom: 10 },
  { file: 'cow.png', frame: 32, size: 48, dur: 34, delay: 18, dir: 1, bottom: 8 },
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
            <div
              style={{
                width: w.frame,
                height: w.frame,
                backgroundImage: `url(${asset(w.file)})`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: '0 0',
                imageRendering: 'pixelated',
                transform: `scale(${w.size / w.frame}) scaleX(${w.dir})`,
                transformOrigin: 'bottom center',
                filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.25))',
              }}
            />
          </div>
        </div>
      ))}
    </>
  );
}
