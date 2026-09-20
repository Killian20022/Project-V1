import { Lock, Check } from 'lucide-react';
import { LEVELS, LEVEL_INFO, lessonCount } from '@/lib/content';
import type { GameState, Level } from '../types';

// Position de chaque grade sur la carte (en % du conteneur), en zig-zag.
const POS: { x: number; y: number }[] = [
  { x: 12, y: 74 },
  { x: 27, y: 34 },
  { x: 43, y: 70 },
  { x: 58, y: 30 },
  { x: 74, y: 66 },
  { x: 88, y: 28 },
];

export function GalaxyMap({ state, onSelect }: { state: GameState; onSelect: (level: Level) => void }) {
  return (
    <div
      className="relative mt-4 overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0a1022] to-[#05070f]"
      style={{ minHeight: 340 }}
    >
      <div className="sb-stars absolute inset-0 opacity-70" />

      {/* Route entre les planètes */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={POS.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="hsl(var(--brand-gold) / 0.35)"
          strokeWidth="0.4"
          strokeDasharray="1.4 1.6"
        />
      </svg>

      {LEVELS.map((lv, i) => {
        const total = lessonCount(lv);
        const done = Math.min(state.lessons[lv] ?? 0, total);
        const pct = total ? Math.round((done / total) * 100) : 0;
        const complete = total > 0 && done >= total;
        const locked = i > 0 && (state.lessons[LEVELS[i - 1]] ?? 0) === 0;
        const p = POS[i];
        return (
          <button
            key={lv}
            type="button"
            disabled={locked}
            onClick={() => !locked && onSelect(lv)}
            title={locked ? `Termine ${LEVEL_INFO[LEVELS[i - 1]].name} pour débloquer` : LEVEL_INFO[lv].name}
            className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center ${
              locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <div className="relative grid h-16 w-16 place-items-center sm:h-20 sm:w-20">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 100.5} 100.5`}
                />
              </svg>
              <div
                className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${LEVEL_INFO[lv].gradient} text-sm font-black text-white shadow-lg transition sm:h-14 sm:w-14 sm:text-base ${
                  locked ? '' : 'hover:scale-110'
                }`}
              >
                {locked ? <Lock className="size-4" /> : complete ? <Check className="size-5" /> : lv}
              </div>
            </div>
            <div className="mt-1 max-w-[88px] text-center">
              <div className="truncate text-[11px] font-bold leading-tight">{LEVEL_INFO[lv].name}</div>
              <div className="text-[10px] text-muted-foreground">
                {done}/{total}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
