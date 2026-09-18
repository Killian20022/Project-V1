import { useEffect, useRef } from 'react';

const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

// Combat spatial de fond : X-Wing (tirs rouges) chassent des TIE (tirs verts).
// Pilotage fluide : poursuite/évasion avec anticipation, inclinaison dans les
// virages (banking), tonneaux (barrel roll) et profondeur (échelle) pour le relief.
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

    type Ship = {
      team: 'x' | 't';
      x: number;
      y: number;
      heading: number;
      spd: number;
      size: number;
      z: number;
      zv: number;
      bank: number;
      rollT: number; // >=0 : tonneau en cours ; -1 sinon
      rollCd: number;
      cd: number;
    };
    type Bolt = { x: number; y: number; vx: number; vy: number; life: number; team: 'x' | 't'; z: number };
    const ships: Ship[] = [];
    const bolts: Bolt[] = [];
    const SPD_X = 118;
    const SPD_T = 98;
    const TURN = 2.9; // rad/s max
    const RANGE = 340;
    const BULLET = 560;
    const ROLL_DUR = 0.7;

    function mkShip(team: 'x' | 't'): Ship {
      return {
        team,
        x: Math.random() * W,
        y: Math.random() * H,
        heading: Math.random() * Math.PI * 2,
        spd: team === 'x' ? SPD_X : SPD_T,
        size: team === 'x' ? 42 : 34,
        z: 0.75 + Math.random() * 0.5,
        zv: (Math.random() < 0.5 ? -1 : 1) * (0.03 + Math.random() * 0.05),
        bank: 0,
        rollT: -1,
        rollCd: 2 + Math.random() * 4,
        cd: Math.random(),
      };
    }
    function reset() {
      ships.length = 0;
      for (let i = 0; i < 3; i++) {
        ships.push(mkShip('x'));
        ships.push(mkShip('t'));
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
    const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

    let last = performance.now();
    let raf = 0;

    function step(dt: number) {
      for (const s of ships) {
        const foe = s.team === 'x' ? nearest(s, 't') : nearest(s, 'x');
        let desx = Math.cos(s.heading);
        let desy = Math.sin(s.heading);
        if (foe) {
          const fvx = Math.cos(foe.heading) * foe.spd;
          const fvy = Math.sin(foe.heading) * foe.spd;
          const dist = Math.hypot(foe.x - s.x, foe.y - s.y);
          if (s.team === 'x') {
            // poursuite avec anticipation (lead)
            const lead = Math.min(0.9, dist / BULLET);
            desx = foe.x + fvx * lead - s.x;
            desy = foe.y + fvy * lead - s.y;
          } else {
            // évasion
            desx = s.x - foe.x;
            desy = s.y - foe.y;
          }
        }
        // recentrage progressif près des bords
        const dcx = W / 2 - s.x;
        const dcy = H / 2 - s.y;
        const dcl = Math.hypot(dcx, dcy) || 1;
        const wc = Math.min(0.9, Math.max(0, (dcl - Math.min(W, H) * 0.42) / (Math.min(W, H) * 0.26)));
        const dl = Math.hypot(desx, desy) || 1;
        desx = desx / dl + (dcx / dcl) * wc;
        desy = desy / dl + (dcy / dcl) * wc;
        const desired = Math.atan2(desy, desx);
        // rotation douce du cap (limitée) -> arcs fluides
        const da = wrapAngle(desired - s.heading);
        const turn = Math.max(-TURN * dt, Math.min(TURN * dt, da));
        s.heading += turn;
        const turnRate = turn / dt;

        // banking : incline dans le virage
        const targetBank = Math.max(-1.1, Math.min(1.1, turnRate * 0.22));
        s.bank += (targetBank - s.bank) * Math.min(1, 6 * dt);

        // tonneaux (barrel roll) quand le vol est stable
        if (s.rollT >= 0) {
          s.rollT += dt;
          if (s.rollT > ROLL_DUR) {
            s.rollT = -1;
            s.rollCd = 3 + Math.random() * 5;
          }
        } else {
          s.rollCd -= dt;
          if (s.rollCd <= 0 && Math.abs(s.bank) < 0.3 && Math.random() < 0.4) s.rollT = 0;
        }

        // profondeur (relief) : z oscille
        s.z += s.zv * dt;
        if (s.z < 0.72) {
          s.z = 0.72;
          s.zv *= -1;
        }
        if (s.z > 1.28) {
          s.z = 1.28;
          s.zv *= -1;
        }

        // avance
        s.x += Math.cos(s.heading) * s.spd * dt;
        s.y += Math.sin(s.heading) * s.spd * dt;
        const m = 70;
        if (s.x < -m) s.x = W + m;
        if (s.x > W + m) s.x = -m;
        if (s.y < -m) s.y = H + m;
        if (s.y > H + m) s.y = -m;

        // tir
        if (foe) {
          s.cd -= dt;
          const toFoe = Math.atan2(foe.y - s.y, foe.x - s.x);
          const aligned = Math.abs(wrapAngle(toFoe - s.heading)) < 0.5;
          const dist = Math.hypot(foe.x - s.x, foe.y - s.y);
          const canFire = s.team === 'x' ? aligned && dist < RANGE && s.rollT < 0 : dist < RANGE && Math.random() < 0.55;
          if (s.cd <= 0 && canFire) {
            s.cd = s.team === 'x' ? 0.3 + Math.random() * 0.4 : 0.55 + Math.random() * 0.7;
            const ba = s.team === 'x' ? s.heading : toFoe;
            bolts.push({
              x: s.x + Math.cos(s.heading) * s.size * 0.55 * s.z,
              y: s.y + Math.sin(s.heading) * s.size * 0.55 * s.z,
              vx: Math.cos(ba) * BULLET,
              vy: Math.sin(ba) * BULLET,
              life: 0.9,
              team: s.team,
              z: s.z,
            });
          }
        }
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
      // tirs
      ctx.lineCap = 'round';
      for (const b of bolts) {
        const col = b.team === 'x' ? '#ff5a3c' : '#8bff5a';
        ctx.strokeStyle = col;
        ctx.lineWidth = 3 * b.z;
        ctx.shadowColor = col;
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      // vaisseaux, du plus lointain au plus proche (relief)
      const ordered = [...ships].sort((a, b) => a.z - b.z);
      for (const s of ordered) {
        const im = s.team === 'x' ? imgX : imgT;
        if (!im.complete || !im.naturalWidth) continue;
        const size = s.size * s.z;
        const w = size * (im.width / im.height);
        const dx = Math.cos(s.heading);
        const dy = Math.sin(s.heading);
        // réacteur derrière
        const glow = s.team === 'x' ? 'rgba(255,120,40,.8)' : 'rgba(90,190,255,.8)';
        const rx = s.x - dx * size * 0.5;
        const ry = s.y - dy * size * 0.5;
        const rg = ctx.createRadialGradient(rx, ry, 1, rx, ry, size * 0.5);
        rg.addColorStop(0, glow);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.6 + (s.z - 0.72) * 0.7;
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(rx, ry, size * 0.5, 0, 7);
        ctx.fill();
        // orientation + banking/tonneau (foreshortening de l'envergure)
        const noseAngle = s.team === 'x' ? Math.PI / 2 : -Math.PI / 2;
        const rollPhase = s.rollT >= 0 ? (s.rollT / ROLL_DUR) * Math.PI * 2 : 0;
        const wingScale = Math.cos(s.bank + rollPhase);
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.heading - noseAngle);
        ctx.scale(wingScale, 1);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(im, -w / 2, -size / 2, w, size);
        ctx.restore();
        ctx.globalAlpha = 1;
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
    <div ref={wrapRef} className="pointer-events-none fixed inset-0 -z-[5]" style={{ opacity: 0.78 }}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
