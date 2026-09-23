import type { CSSProperties } from 'react';
import { SPRITES, spriteUrl } from '@/lib/sprites';

/**
 * Affiche un sprite Tiny Swords animé (feuille de sprites en CSS, image par image).
 * `height` = hauteur affichée en px ; `crop` rogne le vide autour des personnages.
 */
export function Sprite({
  k,
  height = 96,
  run = false,
  flip = false,
  still = false,
  crop = 0,
  className = '',
  style,
}: {
  k: string;
  height?: number;
  run?: boolean;
  flip?: boolean;
  still?: boolean;
  crop?: number; // fraction (0..0.4) rognée en haut/bas/côtés
  className?: string;
  style?: CSSProperties;
}) {
  const def = SPRITES[k];
  if (!def) return null;
  const sheet = run && def.run ? def.run : { src: def.src, n: def.n };
  const scale = height / (def.fh * (1 - 2 * crop));
  const w = def.fw * scale;
  const h = def.fh * scale;
  const n = sheet.n;
  const animated = !still && n > 1;
  const fps = run ? 12 : def.fps || 8;
  const vars = {
    '--sheet-w': `${-w * n}px`,
    animation: animated ? `ts-sprite ${n / fps}s steps(${n}) infinite` : undefined,
  } as CSSProperties;
  return (
    <div
      className={className}
      style={{
        width: w * (1 - 2 * crop),
        height: h * (1 - 2 * crop),
        overflow: 'hidden',
        position: 'relative',
        transform: flip ? 'scaleX(-1)' : undefined,
        ...style,
      }}
      aria-hidden
    >
      <div
        style={{
          position: 'absolute',
          left: -w * crop,
          top: -h * crop,
          width: w,
          height: h,
          backgroundImage: `url(${spriteUrl(sheet.src)})`,
          backgroundSize: `${w * n}px ${h}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          ...vars,
        }}
      />
    </div>
  );
}
