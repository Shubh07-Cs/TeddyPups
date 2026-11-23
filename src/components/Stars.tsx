const STAR = "M20 3c1.6 9.4 7.6 15.4 17 17-9.4 1.6-15.4 7.6-17 17-1.6-9.4-7.6-15.4-17-17 9.4-1.6 15.4-7.6 17-17z";

export type StarSpot = [left: number, top: number, scale: number];

/** A field of twinkling four-point stars; each one starts 0.4s after the previous. */
export function Stars({ stars, size, className = "pointer-events-none absolute inset-0" }: { stars: StarSpot[]; size: number; className?: string }) {
  return (
    <div aria-hidden className={className}>
      {stars.map(([left, top, k], i) => (
        <svg key={i} viewBox="0 0 40 40" className="tp-twinkle absolute text-honey" style={{ left: `${left}%`, top: `${top}%`, width: `${k * size}px`, animationDelay: `${(0.4 * i).toFixed(2)}s` }} aria-hidden>
          <path d={STAR} fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}

export const FOOTER_STARS: StarSpot[] = [[6, 18, 1.8], [14, 42, 1.2], [23, 12, 1.4], [31, 30, 1], [44, 9, 1.6], [52, 36, 1.1], [63, 15, 1.5], [71, 40, 1], [92, 33, 1.2]];
export const NIGHT_STARS: StarSpot[] = [[8, 12, 1.8], [22, 30, 1], [41, 8, 1.4], [57, 22, 0.9], [72, 6, 1.6], [88, 18, 1.2], [95, 42, 1], [4, 58, 1.2], [34, 70, 0.8], [63, 84, 1.1], [83, 66, 1.4]];
