import { useEffect, useRef } from 'react';

const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

// Combat spatial de fond : des X-Wing (tirs laser rouges) poursuivent des TIE
// (tirs verts) qui les fuient. Décoratif, sans interaction.
export function Dogfight() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 1;
    let H = 1;

    const imgX = new Image();
    imgX.src = asset('chip_xwing.png');
    const imgT = new Image();
    imgT.src = asset('chip_tie.png');

    type Ship = { team: 'x' | 't'; x: number; y: number; vx: number; vy: number; cd: number; size: number; spd: number };
    type Bolt = { x: number; y: number; vx: number; vy: number; life: number; team: 'x' | 't' };
    const ships: Ship[] = [];
    const bolts: Bolt[] = [];
    const TURN = 2.6;
    const RANGE = 340;
    const SPD_X = 112; // X-Wing un peu plus rapides -> ils rattrapent et tirent
    const SPD_T = 94;

    function reset() {
      ships.length = 0;
      for (let i = 0; i < 3; i++) {
        ships.push({ team: 'x', x: Math.random() * W, y: Math.random() * H, vx: SPD_X, vy: 0, cd: Math.random(), size: 40, spd: SPD_X });
        ships.push({ team: 't', x: Math.random() * W, y: Math.random() * H, vx: -SPD_T, vy: 0, cd: Math.random(), size: 34, spd: SPD_T });
      }
    }
    function measure() {
      const r = wrap.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      if (!ships.length) reset();
    }
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    measure();

    function nearest(s: Ship, team: 'x' | 't') {
      let best: Ship | null = null;
      let bd = 1e9;
      for (const o of ships) {
        if (o.team !== team) continue;
        const d = (o.x - s.x) ** 2 + (o.y - s.y) ** 2;
        if (d < bd) {
          bd = d;
          best = o;
        }
      }
      return best;
    }

    let last = performance.now();
    let raf = 0;

    function step(dt: number) {
      for (const s of ships) {
        const foe = s.team === 'x' ? nearest(s, 't') : nearest(s, 'x');
        if (foe) {
          let tx = s.team === 'x' ? foe.x - s.x : s.x - foe.x;
          let ty = s.team === 'x' ? foe.y - s.y : s.y - foe.y;
          const tl = Math.hypot(tx, ty) || 1;
          tx /= tl;
          ty /= tl;
          // recentrage : plus fort près des bords -> le combat reste dans le cadre
          const dcx = W / 2 - s.x;
          const dcy = H / 2 - s.y;
          const dcl = Math.hypot(dcx, dcy) || 1;
          const wc = Math.min(0.85, Math.max(0, (dcl - Math.min(W, H) * 0.4) / (Math.min(W, H) * 0.28)));
          let desx = tx + (dcx / dcl) * wc;
          let desy = ty + (dcy / dcl) * wc;
          const dl = Math.hypot(desx, desy) || 1;
          desx /= dl;
          desy /= dl;
          const vl = Math.hypot(s.vx, s.vy) || 1;
          let hx = s.vx / vl;
          let hy = s.vy / vl;
          hx += (desx - hx) * Math.min(1, TURN * dt);
          hy += (desy - hy) * Math.min(1, TURN * dt);
          const hl = Math.hypot(hx, hy) || 1;
          s.vx = (hx / hl) * s.spd;
          s.vy = (hy / hl) * s.spd;

          s.cd -= dt;
          const heading = Math.atan2(s.vy, s.vx);
          const toFoe = Math.atan2(foe.y - s.y, foe.x - s.x);
          const aligned = Math.abs(((toFoe - heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.6;
          const dist = Math.hypot(foe.x - s.x, foe.y - s.y);
          const canFire = s.team === 'x' ? aligned && dist < RANGE : dist < RANGE && Math.random() < 0.6;
          if (s.cd <= 0 && canFire) {
            s.cd = s.team === 'x' ? 0.3 + Math.random() * 0.4 : 0.5 + Math.random() * 0.7;
            const bs = 540;
            const ba = s.team === 'x' ? heading : toFoe;
            bolts.push({
              x: s.x + Math.cos(heading) * s.size * 0.6,
              y: s.y + Math.sin(heading) * s.size * 0.6,
              vx: Math.cos(ba) * bs,
              vy: Math.sin(ba) * bs,
              life: 0.9,
              team: s.team,
            });
          }
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const m = 60;
        if (s.x < -m) s.x = W + m;
        if (s.x > W + m) s.x = -m;
        if (s.y < -m) s.y = H + m;
        if (s.y > H + m) s.y = -m;
      }
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        if (b.life <= 0 || b.x < -40 || b.x > W + 40 || b.y < -40 || b.y > H + 40) bolts.splice(i, 1);
      }
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // tirs laser
      ctx.lineCap = 'round';
      for (const b of bolts) {
        const col = b.team === 'x' ? '#ff5a3c' : '#8bff5a';
        ctx.strokeStyle = col;
        ctx.lineWidth = 3;
        ctx.shadowColor = col;
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      // vaisseaux
      for (const s of ships) {
        const im = s.team === 'x' ? imgX : imgT;
        if (!im.complete || !im.naturalWidth) continue;
        const heading = Math.atan2(s.vy, s.vx);
        const size = s.size;
        const w = size * (im.width / im.height);
        const dx = Math.cos(heading);
        const dy = Math.sin(heading);
        const glow = s.team === 'x' ? 'rgba(255,120,40,.8)' : 'rgba(90,190,255,.8)';
        const rx = s.x - dx * size * 0.5;
        const ry = s.y - dy * size * 0.5;
        const rg = ctx.createRadialGradient(rx, ry, 1, rx, ry, size * 0.5);
        rg.addColorStop(0, glow);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(rx, ry, size * 0.5, 0, 7);
        ctx.fill();
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(heading + Math.PI / 2);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(im, -w / 2, -size / 2, w, size);
        ctx.restore();
      }
    }

    function loop(now: number) {
      const dt = Math.min((now - last) / 1000 || 0, 0.05);
      last = now;
      step(dt);
      draw();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
