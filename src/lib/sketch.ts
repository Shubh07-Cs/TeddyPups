/**
 * Hand-drawn look for puppy cards: every puppy gets its own wobbly blob
 * outline, watercolour wash and doodles — generated from a seed (its slug)
 * so the same puppy always looks the same, on the server and in the browser.
 */
const f2 = (n: number) => n.toFixed(2);

/** FNV-1a hash of the seed feeding a mulberry32 PRNG. */
function rng(seed: string) {
  let h = 0x811c9dc5;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 0x1000193);
  let a = h >>> 0;
  return () => {
    let t = (a = (a + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

/** Points around a slightly irregular circle centred on (50, 50). */
function blob(rand: () => number, r: number, wobble: number, n = 40, start = 0, sweep = 2 * Math.PI) {
  const ph = [6.28 * rand(), 6.28 * rand(), 6.28 * rand()];
  const squash = 1 + (rand() - 0.5) * 0.05;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = start + (i / (sweep >= 2 * Math.PI ? n : n - 1)) * sweep;
    const rr = r + wobble * (0.55 * Math.sin(2 * a + ph[0]) + 0.3 * Math.sin(3 * a + ph[1]) + 0.15 * Math.sin(5 * a + ph[2]));
    pts.push([50 + Math.cos(a) * rr * squash, 50 + (Math.sin(a) * rr) / squash]);
  }
  return pts;
}

/** Smooth Catmull-Rom spline through the points, as cubic Béziers. */
function spline(pts: [number, number][], closed: boolean) {
  const n = pts.length;
  const at = (i: number) => pts[closed ? (i + n) % n : Math.min(n - 1, Math.max(0, i))];
  let d = `M${f2(pts[0][0])} ${f2(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1),
      p1 = at(i),
      p2 = at(i + 1),
      p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
      c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f2(c1[0])} ${f2(c1[1])} ${f2(c2[0])} ${f2(c2[1])} ${f2(p2[0])} ${f2(p2[1])}`;
  }
  return closed ? `${d}Z` : d;
}

const WASHES = ["#f2be6b", "#f9cdbf", "#bfddf5", "#fbe3b4", "#e8c39a"];
const INKS = ["#c2622b", "#a24a1a", "#2a170e", "#d4893f"];
export const DOODLES = ["sparkle", "heart", "dashes", "swirl", "dots", "paw"] as const;
export type Doodle = { kind: (typeof DOODLES)[number]; x: number; y: number; rot: number; size: number; ink: string };

export function sketchFor(seed: string) {
  const rand = rng(seed);
  const mask = spline(blob(rand, 45.5, 2.6), true);
  const outline = spline(blob(rand, 47.8, 3.1), true);
  const start = rand() * Math.PI * 2;
  const retrace = spline(blob(rand, 49, 3.4, 30, start, Math.PI * (1.15 + 0.5 * rand())), false);
  const wash = { d: spline(blob(rand, 46.5, 3.6), true), dx: (rand() - 0.5) * 9, dy: 3 + 4 * rand(), color: WASHES[Math.floor(rand() * WASHES.length)] };
  const tilt = (rand() - 0.5) * 5;
  // doodles sit in up to three arcs around the frame (bottom-right, bottom-left, right), in random order
  const arcs = [
    [0.86, 1.08],
    [1.16, 1.42],
    [-0.08, 0.16],
  ]
    .map((z) => ({ z, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .map((a) => a.z);
  const count = 2 + Math.floor(2 * rand());
  const doodles: Doodle[] = [];
  const used = new Set<string>();
  for (let i = 0; i < count; i++) {
    let kind = DOODLES[Math.floor(rand() * DOODLES.length)];
    if (used.has(kind)) kind = DOODLES.find((k) => !used.has(k))!;
    used.add(kind);
    const [lo, hi] = arcs[i];
    const a = Math.PI * (lo + rand() * (hi - lo)),
      r = 55 + 4 * rand();
    doodles.push({ kind, x: 50 + Math.cos(a) * r, y: 50 + Math.sin(a) * r, rot: (rand() - 0.5) * 50, size: 0.85 + 0.35 * rand(), ink: INKS[Math.floor(rand() * INKS.length)] });
  }
  return { mask, outline, retrace, wash, tilt, doodles };
}

/** A path as a CSS mask image. */
export function maskUrl(d: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${d}" fill="#000"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
