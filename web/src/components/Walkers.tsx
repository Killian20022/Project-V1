const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

type Walker = {
  file: string;
  size: number;
  dur: number; // durée de traversée (grande = lent)
  start: number; // fraction déjà écoulée au chargement (délai négatif -> pas de blocage à gauche)
  dir: 1 | -1;
  bottom: number;
  roll?: boolean; // droïde qui roule
};

// Vrais sprites Star Wars qui traversent le bas de page. R2-D2 roule (droïde),
// les troopers avancent avec un léger sautillement.
const WALKERS: Walker[] = [
  { file: 'chip_stormtrooper.png', size: 52, dur: 17, start: 0.05, dir: 1, bottom: 3 },
  { file: 'chip_r2d2.png', size: 46, dur: 13, start: 0.3, dir: 1, bottom: 6, roll: true },
  { file: 'chip_stormtrooper.png', size: 46, dur: 15, start: 0.55, dir: 1, bottom: 8 },
  { file: 'chip_boba.png', size: 52, dur: 19, start: 0.82, dir: 1, bottom: 2 },
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
          {/* wrapper = orientation ; img = sautillement (troopers) ou roulement (droïde) */}
          <div style={{ transform: `scaleX(${w.dir})`, transformOrigin: 'bottom center' }}>
            <img
              src={asset(w.file)}
              alt=""
              className={w.roll ? 'eq-roll' : 'eq-bob'}
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
