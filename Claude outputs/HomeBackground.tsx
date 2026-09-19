// src/components/HomeBackground.tsx
// Fond animé "glacier" pour la page d'accueil d'EnglishQuest.
// Couche fixe placée derrière tout le contenu. 100% CSS (léger), respecte prefers-reduced-motion.

const PARTICLES = Array.from({ length: 28 }, (_, i) => {
  // valeurs déterministes (pas de Math.random au render) pour éviter le flicker
  const left = (i * 37) % 100;              // position horizontale en %
  const size = 2 + ((i * 13) % 5);          // 2 à 6 px
  const duration = 14 + ((i * 7) % 16);     // 14 à 30 s
  const delay = (i * 5) % 18;               // 0 à 18 s
  const drift = ((i % 2 === 0 ? 1 : -1) * (10 + (i * 3) % 40)); // dérive horizontale px
  return { left, size, duration, delay, drift };
});

export default function HomeBackground() {
  return (
    <div className="eq-home-bg" aria-hidden="true">
      {/* halo glacier + aurores */}
      <div className="eq-home-bg__glow" />
      <div className="eq-home-bg__aurora" />
      {/* particules de glace / neige */}
      <div className="eq-home-bg__particles">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              // @ts-expect-error variable CSS custom
              "--drift": `${p.drift}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
