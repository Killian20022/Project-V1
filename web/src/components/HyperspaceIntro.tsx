import { useEffect, useRef, useState } from 'react';

// Entrée « vitesse lumière » : brève phase calme (étoiles), coup d'accélérateur en
// hyperespace (étoiles étirées) + éclat central, flash blanc, puis arrivée sur l'accueil.
// Joué une fois par ouverture d'onglet (sessionStorage).
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
    const N = 380;
    const PUNCH = 0.55; // instant du « saut »
    type Star = { ang: number; r: number; speed: number };
    const mk = (): Star => ({ ang: Math.random() * Math.PI * 2, r: Math.random() * 70, speed: 0.8 + Math.random() * 2.4 });
    const stars: Star[] = Array.from({ length: N }, mk);
    const t0 = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      const punching = t > PUNCH;
      const cx = w / 2;
      const cy = h / 2;
      // traînée : nette avant le saut (points), longue pendant (streaks)
      ctx.fillStyle = punching ? 'rgba(2,4,10,0.22)' : 'rgba(2,4,10,0.5)';
      ctx.fillRect(0, 0, w, h);
      const speed = punching ? 0.5 + Math.pow(t - PUNCH, 2) * 15 : 0.12;
      ctx.lineCap = 'round';
      const maxR = Math.hypot(cx, cy) + 60;
      for (const s of stars) {
        const pr = s.r;
        s.r += s.speed * speed * (1.4 + s.r * 0.035);
        const c = Math.cos(s.ang);
        const sn = Math.sin(s.ang);
        const x0 = cx + c * pr;
        const y0 = cy + sn * pr;
        const x1 = cx + c * s.r;
        const y1 = cy + sn * s.r;
        const len = Math.hypot(x1 - x0, y1 - y0);
        const b = Math.min(1, len / 70);
        ctx.strokeStyle = `rgba(${(190 + 65 * b) | 0},${(210 + 45 * b) | 0},255,${0.3 + 0.7 * b})`;
        ctx.lineWidth = 1 + 2.4 * b;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        if (s.r > maxR) Object.assign(s, mk(), { r: Math.random() * 18 });
      }
      // éclat central bleuté qui monte puis éclate
      const glowA = punching ? Math.min(1, (t - PUNCH) * 1.5) : (t / PUNCH) * 0.35;
      const glowR = punching ? 60 + (t - PUNCH) * Math.max(w, h) * 0.9 : 50;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(70, glowR));
      g.addColorStop(0, `rgba(224,238,255,${0.55 * glowA})`);
      g.addColorStop(0.45, `rgba(120,180,255,${0.28 * glowA})`);
      g.addColorStop(1, 'rgba(80,140,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const tFlash = window.setTimeout(() => setPhase('flash'), 1800);
    const tOut = window.setTimeout(() => setPhase('out'), 2100);
    const tDone = window.setTimeout(() => {
      try {
        sessionStorage.setItem('ew_jumped', '1');
      } catch {
        /* ignore */
      }
      setShow(false);
    }, 2750);

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
