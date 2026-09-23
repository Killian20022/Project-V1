import { Lock, Check } from 'lucide-react';
import { LEVELS, LEVEL_INFO, lessonCount } from '@/lib/content';
import { uiUrl } from '@/lib/sprites';
import type { GameState, Level } from '../types';

// Chaque rang est une île de l'archipel (position en % de la carte).
const POS: Record<Level, { x: number; y: number }> = {
  A1: { x: 22, y: 30 },
  A2: { x: 14, y: 74 },
  B1: { x: 39, y: 69 },
  B2: { x: 54, y: 38 },
  C1: { x: 74, y: 14 },
  C2: { x: 85, y: 52 },
};

export function RankMap({ state, onSelect }: { state: GameState; onSelect: (level: Level) => void }) {
  const path = LEVELS.map((lv) => `${POS[lv].x},${POS[lv].y}`).join(' ');
  return (
    <div
      className="relative mt-4 overflow-hidden rounded-xl border-4 border-[#3a2412] shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
      style={{ aspectRatio: '16 / 10', minHeight: 300 }}
    >
      <img
        src={`${import.meta.env.BASE_URL}ts/map-small.jpg`}
        alt="Carte de l'archipel"
        className="pixel absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points={path} fill="none" stroke="#fff3c4" strokeOpacity="0.85" strokeWidth="0.5" strokeDasharray="1.6 1.4" />
      </svg>

      {LEVELS.map((lv, i) => {
        const total = lessonCount(lv);
        const done = Math.min(state.lessons[lv] ?? 0, total);
        const pct = total ? Math.round((done / total) * 100) : 0;
        const complete = total > 0 && done >= total;
        const locked = i > 0 && (state.lessons[LEVELS[i - 1]] ?? 0) === 0;
        const info = LEVEL_INFO[lv];
        const p = POS[lv];
        return (
          <button
            key={lv}
            type="button"
            disabled={locked}
            onClick={() => !locked && onSelect(lv)}
            title={locked ? `Termine le rang ${LEVEL_INFO[LEVELS[i - 1]].name} pour débloquer` : `${info.name} · ${info.island}`}
            className={`group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center ${
              locked ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <div className={`relative transition ${locked ? 'grayscale brightness-75' : 'group-hover:-translate-y-1 group-hover:scale-105'}`}>
              <img src={uiUrl(info.avatar)} alt="" className="pixel h-14 w-14 drop-shadow-[0_4px_4px_rgba(0,0,0,0.6)] sm:h-20 sm:w-20" />
              <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-[#3a2412] bg-[#f7c948] text-[10px] font-black text-[#3a2412]">
                {locked ? <Lock className="size-3" /> : complete ? <Check className="size-3.5" /> : lv}
              </span>
            </div>
            <div className="mt-0.5 rounded-md bg-[#2b1a0d]/85 px-2 py-0.5 text-center shadow">
              <div className="font-display text-[12px] leading-tight text-[#ffe7a6] sm:text-sm">{info.name}</div>
              <div className="h-1 w-16 overflow-hidden rounded-full bg-black/40">
                <div className="h-full bg-[#f7c948]" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[10px] text-[#f5e6c8]/80">
                {done}/{total}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
