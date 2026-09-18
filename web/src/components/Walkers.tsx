const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

type Walker = {
  file: string;
  size: number;
  dur: number;
  start: number; // fraction (0..1) de l'animation déjà écoulée au chargement
  dir: 1 | -1;
  bottom: number;
  roll?: boolean; // droïde qui roule au lieu de courir
};

// Petits clones (et un droïde) qui courent en bas de page.
// `start` -> délai NÉGATIF : ils sont déjà répartis et en mouvement dès la 1re frame
// (plus de personnages bloqués à gauche au chargement).
const WALKERS: Walker[] = [
  { file: 'chip_stormtrooper.png', size: 52, dur: 11, start: 0.05, dir: 1, bottom: 3 },
  { file: 'chip_r2d2.png', size: 44, dur: 8, start: 0.28, dir: 1, bottom: 6, roll: true },
  { file: 'chip_stormtrooper.png', size: 46, dur: 9.5, start: 0.5, dir: 1, bottom: 8 },
  { file: 'chip_boba.png', size: 52, dur: 13, start: 0.72, dir: 1, bottom: 2 },
  { file: 'chip_stormtrooper.png', size: 50, dur: 12, start: 0.88, dir: 1, bottom: 4 },
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
          {/* wrapper = orientation ; img = animation de course/roulement */}
          <div style={{ transform: `scaleX(${w.dir})` }}>
            <img
              src={asset(w.file)}
              alt=""
              className={w.roll ? 'eq-roll' : 'eq-run'}
              style={{
                height: w.size,
                width: 'auto',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.35))',
              }}
              draggable={false}
            />
          </div>
        </div>
      ))}
    </>
  );
}
