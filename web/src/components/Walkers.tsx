const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

type Walker = {
  file: string;
  size: number;
  dur: number; // durée de traversée (grande = lent)
  start: number; // fraction déjà écoulée au chargement (délai négatif -> pas de blocage à gauche) ; plus grand = plus en avance sur le trajet
  dir: 1 | -1;
  bottom: number;
  roll?: boolean; // droïde qui roule
  runClone?: boolean; // sprite-sheet de course (run_clone.png, 8 frames), voir .run-clone dans index.css
};

// Vrais sprites Star Wars qui traversent le bas de page. R2-D2 roule (droïde),
// les troopers avancent avec un léger sautillement.
const WALKERS: Walker[] = [
  { file: 'chip_stormtrooper.png', size: 52, dur: 17, start: 0.05, dir: 1, bottom: 3 },
  { file: 'chip_r2d2.png', size: 46, dur: 13, start: 0.3, dir: 1, bottom: 6, roll: true },
  { file: 'chip_stormtrooper.png', size: 46, dur: 15, start: 0.55, dir: 1, bottom: 8 },
  { file: 'chip_boba.png', size: 52, dur: 19, start: 0.82, dir: 1, bottom: 2 },
];

// Escouade de clones qui suit Dark Vador : même durée/direction pour rester groupés,
// des "start" espacés d'un même pas pour garder une formation régulière (Vador en tête).
const SQUAD_DUR = 22;
const SQUAD_DIR: 1 | -1 = -1;
const SQUAD_BASE = 0.15;
const SQUAD_GAP = 0.032;
const CLONE_SQUAD: Walker[] = [
  { file: 'chip_vader.png', size: 60, dur: SQUAD_DUR, start: SQUAD_BASE + SQUAD_GAP * 4, dir: SQUAD_DIR, bottom: 5 },
  ...[0, 1, 2, 3].map((i) => ({
    file: 'run_clone.png',
    size: 52,
    dur: SQUAD_DUR,
    start: SQUAD_BASE + SQUAD_GAP * (3 - i),
    dir: SQUAD_DIR,
    bottom: 3,
    runClone: true,
  })),
];
WALKERS.push(...CLONE_SQUAD);

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
            {w.runClone ? (
              <div
                className="run-clone"
                style={{
                  backgroundImage: `url(${asset(w.file)})`,
                  filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.35))',
                }}
              />
            ) : (
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
            )}
          </div>
        </div>
      ))}
    </>
  );
}
