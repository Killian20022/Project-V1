const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

type Walker = {
  kind: 'run' | 'roll';
  file?: string; // pour 'roll'
  size?: number; // pour 'roll'
  scale?: number; // pour 'run'
  dur: number; // durée de traversée (grande = lent)
  start: number; // fraction déjà écoulée au chargement (délai négatif -> pas de blocage à gauche)
  dir: 1 | -1;
  bottom: number;
};

// Clones qui courent (vraie anim sprite-sheet, au ralenti) + R2 qui roule.
const WALKERS: Walker[] = [
  { kind: 'run', scale: 1.15, dur: 26, start: 0.05, dir: 1, bottom: 2 },
  { kind: 'roll', file: 'chip_r2d2.png', size: 44, dur: 21, start: 0.32, dir: 1, bottom: 6 },
  { kind: 'run', scale: 0.95, dur: 31, start: 0.55, dir: 1, bottom: 6 },
  { kind: 'run', scale: 1.05, dur: 24, start: 0.82, dir: 1, bottom: 3 },
];

/** Personnages qui traversent le bas du conteneur parent (`position: relative; overflow: hidden`). */
export function Walkers({ walkers = WALKERS }: { walkers?: Walker[] }) {
  return (
    <>
      {walkers.map((w, i) => (
        <div
          key={i}
          className={w.dir === 1 ? 'eq-walk-r absolute' : 'eq-walk-l absolute'}
          style={{ bottom: `${w.bottom}px`, animationDuration: `${w.dur}s`, animationDelay: `${-w.start * w.dur}s` }}
        >
          <div style={{ transform: `scaleX(${w.dir}) scale(${w.scale ?? 1})`, transformOrigin: 'bottom center' }}>
            {w.kind === 'run' ? (
              <div
                className="run-clone"
                style={{ backgroundImage: `url(${asset('run_clone.png')})`, filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.35))' }}
              />
            ) : (
              <img
                src={asset(w.file as string)}
                alt=""
                className="eq-roll"
                style={{ height: w.size, width: 'auto', imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.35))' }}
                draggable={false}
              />
            )}
          </div>
        </div>
      ))}
    </>
  );
}
