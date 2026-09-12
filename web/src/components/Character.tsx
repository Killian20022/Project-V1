const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;

const FRAME: Record<string, number> = { 'chicken.png': 16, 'cow.png': 32, 'character.png': 48 };

/** Un grand personnage décoratif (sprite recadré sur sa 1re image), avec un léger sautillement. */
export function Character({
  file,
  size = 120,
  flip = false,
  bob = true,
}: {
  file: string;
  size?: number;
  flip?: boolean;
  bob?: boolean;
}) {
  const frame = FRAME[file];
  return (
    <div style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}>
      <div className={bob ? 'eq-bob' : ''} style={{ display: 'grid', placeItems: 'center' }}>
        {frame ? (
          <div
            style={{
              width: frame,
              height: frame,
              backgroundImage: `url(${asset(file)})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: '0 0',
              imageRendering: 'pixelated',
              transform: `scale(${size / frame}) scaleX(${flip ? -1 : 1})`,
              filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.35))',
            }}
          />
        ) : (
          <img src={asset(file)} alt="" style={{ width: size, imageRendering: 'pixelated' }} draggable={false} />
        )}
      </div>
    </div>
  );
}
