// A small, cached depth map; only visible wavelets are animated. No extra RAF.
export function createOcean(width: number, height: number, tile: number, shores: [number, number][], levels: string[]) {
  const depth = document.createElement('canvas');
  depth.width = Math.ceil(width / 8);
  depth.height = Math.ceil(height / 8);
  const paint = depth.getContext('2d')!;
  paint.fillStyle = '#328eaa';
  paint.fillRect(0, 0, depth.width, depth.height);
  const light = paint.createLinearGradient(0, 0, depth.width, depth.height);
  light.addColorStop(0, '#329cae');
  light.addColorStop(0.5, '#267e9e');
  light.addColorStop(1, '#205d86');
  paint.fillStyle = light;
  paint.fillRect(0, 0, depth.width, depth.height);
  // Build a translucent shallow-water shelf from the actual coastline.
  for (const [cx, cy] of shores) {
    const x = (cx + 0.5) * tile / 8;
    const y = (cy + 0.5) * tile / 8;
    const radius = tile * 2.6 / 8;
    const shelf = paint.createRadialGradient(x, y, 0, x, y, radius);
    shelf.addColorStop(0, 'rgba(104,211,180,0.22)');
    shelf.addColorStop(0.45, 'rgba(86,194,177,0.12)');
    shelf.addColorStop(1, 'rgba(86,194,177,0)');
    paint.fillStyle = shelf;
    paint.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Two reusable light textures, generated once at pixel-art resolution.
  const shimmer = document.createElement('canvas');
  shimmer.width = shimmer.height = 768;
  const shine = shimmer.getContext('2d')!;
  for (let y = 0; y < 768; y += 4) for (let x = 0; x < 768; x += 4) {
    const u = x * Math.PI * 2 / 768;
    const v = y * Math.PI * 2 / 768;
    const field = Math.sin(u * 4 + Math.sin(v * 3)) + Math.sin(v * 5 + Math.cos(u * 3));
    const ridge = Math.max(0, 1 - Math.abs(field) * 7);
    if (ridge < 0.1) continue;
    shine.fillStyle = `rgba(152,239,214,${ridge * 0.24})`;
    shine.fillRect(x, y, 4, 4);
  }
  let shimmerPattern: CanvasPattern | null = null;
  const hash = (x: number, y: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  // Coast segments are computed once, not searched on every animation frame.
  const coast: { x: number; y: number; nx: number; ny: number; seed: number }[] = [];
  for (let cy = 0; cy < levels.length; cy++) {
    for (let cx = 0; cx < levels[cy].length; cx++) {
      if (+levels[cy][cx] === 0) continue;
      for (const [nx, ny] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (levels[cy + ny]?.[cx + nx] !== '0') continue;
        coast.push({ x: (cx + 0.5 + nx * 0.5) * tile, y: (cy + 0.5 + ny * 0.5) * tile, nx, ny, seed: hash(cx, cy) });
      }
    }
  }
  return (ctx: CanvasRenderingContext2D, time: number, zoom: number, x0: number, y0: number, x1: number, y1: number) => {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(depth, 0, 0, width, height);
    ctx.imageSmoothingEnabled = false;
    const t = motion.matches ? 0 : time;
    shimmerPattern ??= ctx.createPattern(shimmer, 'repeat');
    if (shimmerPattern) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.translate(Math.sin(t * 0.12) * 14, t * 1.4 % 768);
      ctx.fillStyle = shimmerPattern;
      ctx.fillRect(x0 - 32, y0 - 800, x1 - x0 + 64, y1 - y0 + 1600);
      ctx.restore();
    }
    // Larger cells at overview zoom keep the number of draw calls bounded.
    const step = 144 * Math.max(1, Math.pow(2, Math.ceil(Math.log2(0.65 / zoom))));
    for (let gy = Math.floor(y0 / step); gy <= Math.ceil(y1 / step); gy++) {
      for (let gx = Math.floor(x0 / step); gx <= Math.ceil(x1 / step); gx++) {
        const seed = hash(gx, gy);
        const phase = t * (0.55 + seed * 0.25) + seed * Math.PI * 2;
        const swell = Math.sin(phase);
        const x = Math.round((gx * step + seed * step * 0.7 + Math.sin(phase * 0.7) * 7) / 2) * 2;
        const y = Math.round((gy * step + hash(gy, gx + 19) * step * 0.8 + swell * 3) / 2) * 2;
        const length = (28 + seed * 46) * Math.min(2, step / 144);
        // Broken curved crests: stepped pixels follow a travelling swell.
        // A dark trough and translucent turquoise body give each wave depth.
        const envelope = 0.5 + 0.5 * Math.sin(phase);
        for (let k = 0; k < 12; k++) {
          const u = k / 11;
          const fade = Math.sin(u * Math.PI);
          const wx = Math.round((x + u * length) / 2) * 2;
          const wy = Math.round((y + Math.sin(u * Math.PI * 1.7 + phase * 0.35) * 6) / 2) * 2;
          const segment = Math.ceil(length / 12 / 2) * 2;
          ctx.fillStyle = '#083e6b';
          ctx.globalAlpha = fade * envelope * 0.11;
          ctx.fillRect(wx + 2, wy + 7, segment, 4);
          ctx.fillStyle = '#6bdbce';
          ctx.globalAlpha = fade * envelope * 0.1;
          ctx.fillRect(wx, wy + 2, segment, 5);
          ctx.fillStyle = '#b9f3e6';
          ctx.globalAlpha = fade * (0.05 + envelope * 0.19);
          if (k !== 3 || seed < 0.5) ctx.fillRect(wx, wy, segment, 2);
        }
        ctx.globalAlpha = 0.08 + (swell + 1) * 0.045;
        ctx.fillStyle = '#b5efe0';
        ctx.fillRect(x + length * 0.3, y + 24, length * 0.4, 2);
        ctx.globalAlpha *= 0.45;
        ctx.fillRect(x - 8, y + 7, length * 0.6, 2);
        ctx.fillStyle = '#175d83';
        ctx.fillRect(x + 5, y + 12, length * 1.3, 2);
        // Sparse, soft sun glints, staggered so the sea never flashes in unison.
        if (seed > 0.74 && zoom > 0.35) {
          const glint = Math.pow(Math.max(0, Math.sin(phase * 0.73)), 10);
          ctx.globalAlpha = glint * 0.42;
          ctx.fillStyle = '#e2fff0';
          ctx.fillRect(x + 10, y - 16, 10, 2);
          ctx.fillRect(x + 14, y - 18, 2, 6);
        }
      }
    }
    // Slow, staggered wash travels towards the shore and fades into the foam.
    // Everything remains underneath the original terrain and foam sprites.
    if (zoom > 0.28) for (const edge of coast) {
      if (edge.x < x0 - 96 || edge.x > x1 + 96 || edge.y < y0 - 96 || edge.y > y1 + 96) continue;
      const phase = (t * 0.13 + edge.seed * 0.35) % 1;
      const distance = 10 + (1 - phase) * 34;
      const alpha = Math.sin(phase * Math.PI) * 0.19;
      const tangentX = -edge.ny;
      const tangentY = edge.nx;
      ctx.fillStyle = '#c6f7e5';
      for (let k = -3; k <= 3; k++) {
        const offset = k * tile / 8;
        const bend = Math.cos(k * 0.5 + edge.seed * 2) * 3;
        const px = Math.round((edge.x + edge.nx * (distance + bend) + tangentX * offset) / 2) * 2;
        const py = Math.round((edge.y + edge.ny * (distance + bend) + tangentY * offset) / 2) * 2;
        ctx.globalAlpha = alpha * (1 - Math.abs(k) * 0.18);
        ctx.fillRect(px, py, edge.nx ? 2 : tile / 8, edge.ny ? 2 : tile / 8);
      }
    }
    ctx.restore();
  };
}
