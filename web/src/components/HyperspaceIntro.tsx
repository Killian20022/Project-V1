import { useEffect, useRef, useState } from 'react';

// Entrée « vitesse lumière » : les étoiles s'étirent en hyperespace, flash blanc, puis on
// arrive sur l'accueil. Joué une fois par ouverture d'onglet (sessionStorage).
export function HyperspaceIntro() {
  const [show, setShow] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('ew_jumped') !== '1';
    } catch {
      return true;
    }
  });
  const [phase, setPhase] = useState<'run' | 'flash' | 'out'>('run');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!show) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const N = 340;
    type Star = { ang: number; r: number; speed: number };
    const mk = (): Star => ({ ang: Math.random() * Math.PI * 2, r: Math.random() * 60, speed: 0.8 + Math.random() * 2.2 });
    const stars: Star[] = Array.from({ length: N }, mk);
    const t0 = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      const accel = 1 + t * t * 7;
      const cx = w / 2;
      const cy = h / 2;
      ctx.fillStyle = 'rgba(2,4,10,0.30)';
      ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round';
      const maxR = Math.hypot(cx, cy) + 60;
      for (const s of stars) {
        const pr = s.r;
        s.r += s.speed * accel * (1.5 + s.r * 0.03);
        const c = Math.cos(s.ang);
        const sn = Math.sin(s.ang);
        const x0 = cx + c * pr;
        const y0 = cy + sn * pr;
        const x1 = cx + c * s.r;
        const y1 = cy + sn * s.r;
        const len = Math.hypot(x1 - x0, y1 - y0);
        const b = Math.min(1, len / 70);
        ctx.strokeStyle = `rgba(${(190 + 65 * b) | 0},${(210 + 45 * b) | 0},255,${0.28 + 0.72 * b})`;
        ctx.lineWidth = 1 + 2.2 * b;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        if (s.r > maxR) Object.assign(s, mk(), { r: Math.random() * 20 });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const tFlash = window.setTimeout(() => setPhase('flash'), 1650);
    const tOut = window.setTimeout(() => setPhase('out'), 1950);
    const tDone = window.setTimeout(() => {
      try {
        sessionStorage.setItem('ew_jumped', '1');
      } catch {
        /* ignore */
      }
      setShow(false);
    }, 2550);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(tFlash);
      window.clearTimeout(tOut);
      window.clearTimeout(tDone);
    };
  }, [show]);

  if (!show) return null;
  return (
    <div className={`ew-intro ${phase === 'out' ? 'ew-intro-out' : ''}`} aria-hidden>
      <canvas ref={canvasRef} className="ew-intro-canvas" />
      <div className={`ew-intro-flash ${phase === 'flash' || phase === 'out' ? 'on' : ''}`} />
    </div>
  );
}
