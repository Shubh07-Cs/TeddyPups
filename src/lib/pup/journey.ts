/**
 * Route planning for the walking Teddy (PupJourney).
 *
 * Every visible `[data-pup-stop]` on the page becomes a Stop. Scrolling moves
 * Teddy along the page: inside a stop's "hold" scroll range he sits at that
 * stop; between holds he walks a Bézier curve to the next one.
 */
import { POSES, W, type PoseName } from "./rig";

/** Teddy's feet in rig coordinates: the point we anchor to the page. */
export const FEET = { x: 150, y: 228 };
/** Default bounding box of the rig artwork [x0, y0, x1, y1]. */
const BOX: Box = [48, 30, 288, 236];
const POSE_BOX: Partial<Record<PoseName, Box>> = {
  sit: [50, 26, 284, 234],
  peek: [148, 34, 280, 163],
  snug: [148, 40, 280, 163],
  bow: [58, 56, 292, 236],
};
const boxFor = (pose: string): Box => POSE_BOX[pose as PoseName] ?? BOX;
/** How far a "peek" Teddy sinks below the screen edge in lane (mobile) mode. */
const LANE_SINK = FEET.y - 159;
/** Where in the viewport (fraction of height) a stop's centre may sit while held. */
const HOLD_BAND_MOBILE: [number, number] = [0.6, 0.86];
const HOLD_BAND: [number, number] = [0.42, 0.78];

export type Box = [number, number, number, number];
type Rect = { left: number; top: number; right: number; bottom: number };
type Pt = { x: number; y: number };

/** How a stop moves with scrolling. */
export type Track =
  | { kind: "page"; top: number } // scrolls with the page
  | { kind: "screen"; top: number } // fixed to the screen (mobile lane peeks)
  | { kind: "pin"; top: number; from: number; to: number }; // inside a sticky element

export type Stop = { x: number; track: Track; s: number; behind: boolean; sink: number; box: Box };
export type StopMeta = { scene: HTMLElement | null; pose: PoseName; facing: number; act: string; looks: Element[]; track: Element | null };
export type Plan = { lane: boolean; stops: Stop[]; meta: StopMeta[]; holds: [number, number][]; blend: number; mainTop: number };
export type Placement = { x: number; y: number; s: number; front: boolean; airborne: boolean; k: number; t: number; walked: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
export const ramp = (a: number, b: number, v: number) => (b === a ? +(v >= b) : smooth(clamp01((v - a) / (b - a))));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpBox = (a: Box, b: Box, t: number): Box => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
const bezier = (p0: Pt, c1: Pt, c2: Pt, p1: Pt, t: number): Pt => {
  const u = 1 - t,
    a = u * u * u,
    b = 3 * u * u * t,
    c = 3 * u * t * t,
    d = t * t * t;
  return { x: a * p0.x + b * c1.x + c * c2.x + d * p1.x, y: a * p0.y + b * c1.y + c * c2.y + d * p1.y };
};
/** Soft max / soft min, so clamping to the safe area never looks like hitting a wall. */
const softMax = (v: number, lo: number, k: number) => {
  const s = (v - lo) / k;
  return s > 20 ? v : lo + k * Math.log1p(Math.exp(s));
};
const softMin = (v: number, hi: number, k: number) => -softMax(-v, -hi, k);

/** Screen position of a stop's feet at scroll position `y`. */
function stopPoint(st: Stop, y: number): Pt {
  const tr = st.track;
  const top = tr.kind === "page" ? tr.top - y : tr.kind === "screen" ? tr.top : y < tr.from ? tr.top - (y - tr.from) : y > tr.to ? tr.top - (y - tr.to) : tr.top;
  return { x: st.x + FEET.x * st.s, y: top + FEET.y * st.s };
}

/** Which segment of the route a scroll position falls in: k = stop index, t = 0 while held, 0..1 while walking to k+1. */
export function segmentAt(holds: [number, number][], y: number) {
  if (!holds.length || y <= holds[0][1]) return { k: 0, t: 0 };
  for (let i = 0; i < holds.length - 1; i++) {
    const end = holds[i][1],
      next = holds[i + 1][0];
    if (y < next) return { k: i, t: clamp01((y - end) / Math.max(1, next - end)) };
    if (y <= holds[i + 1][1]) return { k: i + 1, t: 0 };
  }
  return { k: holds.length - 1, t: 0 };
}

/** Keep the whole Teddy (its box at scale s) inside the safe rect. */
function keepInside(x: number, y: number, s: number, box: Box, safe: Rect, k = 8): Pt {
  const left = (FEET.x - box[0]) * s,
    right = (box[2] - FEET.x) * s,
    up = (FEET.y - box[1]) * s,
    down = (box[3] - FEET.y) * s;
  return {
    x: safe.right - safe.left > left + right ? softMin(softMax(x, safe.left + left, k), safe.right - right, k) : (safe.left + safe.right) / 2 - (right - left) / 2,
    y: safe.bottom - safe.top > up + down ? softMin(softMax(y, safe.top + up, k), safe.bottom - down, k) : safe.bottom - down,
  };
}

function stickyAncestor(el: Element) {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) if (getComputedStyle(p).position === "sticky") return p as HTMLElement;
  return null;
}

/** Work out how a stop moves: with the page, or pinned inside a sticky container for part of the scroll. */
function trackOf(el: Element, rect: DOMRect): Track {
  const sticky = stickyAncestor(el);
  if (!sticky) return { kind: "page", top: rect.top + scrollY };
  const stickTop = parseFloat(getComputedStyle(sticky).top) || 0;
  const offset = rect.top - sticky.getBoundingClientRect().top;
  const prev = sticky.style.position;
  sticky.style.position = "relative";
  const natural = sticky.getBoundingClientRect();
  const parent = sticky.parentElement!;
  const parentBottom = parent.getBoundingClientRect().bottom - (parseFloat(getComputedStyle(parent).paddingBottom) || 0);
  sticky.style.position = prev;
  const from = natural.top + scrollY - stickTop,
    to = parentBottom + scrollY - natural.height - stickTop;
  return to <= from ? { kind: "page", top: natural.top + scrollY + offset } : { kind: "pin", top: stickTop + offset, from, to };
}

/** Scan the page and build the route. */
export function plan(probe: HTMLElement): Plan {
  const lane = matchMedia("(max-width: 767px), (pointer: coarse) and (max-height: 519px)").matches;
  const vw = document.documentElement.clientWidth;
  const vh = probe.getBoundingClientRect().height || innerHeight;
  const headerH = document.getElementById("site-header")?.offsetHeight ?? 76;
  const bar = document.querySelector("[data-whatsapp-bar]");
  const view: Rect = { left: 10, top: headerH + 10, right: vw - 10, bottom: vh - 10 - (bar?.getClientRects().length ? bar.getBoundingClientRect().height : 0) };
  const main = document.getElementById("main");
  const stops: Stop[] = [],
    meta: StopMeta[] = [],
    ranges: [number, number][] = [];

  const add = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const pose = (el.dataset.pose || "sit") as PoseName;
    const act = el.dataset.act ?? "";
    const base = r.width / W;
    const s = act === "basket" || lane ? base : 1.12 * base;
    const anchor = pose === "peek" ? { x: FEET.x, y: 159 } : FEET;
    const track = trackOf(el, r);
    if (track.kind !== "screen") track.top += anchor.y * (base - s);
    const stop: Stop = { x: r.left + anchor.x * (base - s), track, s, behind: el.dataset.behind === "true", sink: 0, box: boxFor(pose) };
    const scene = el.closest<HTMLElement>("[data-pup-scene]");
    stops.push(stop);
    meta.push({
      scene,
      pose,
      facing: el.dataset.facing === "left" ? -1 : 1,
      act,
      looks: scene ? [...scene.querySelectorAll("[data-pup-look]")] : [],
      track: act === "treadmill" ? (scene?.querySelector("[data-treadmill]") ?? null) : null,
    });
    // the scroll range during which this stop's centre sits in the hold band
    let range: [number, number];
    if (stop.track.kind === "pin") range = [stop.track.from, stop.track.to];
    else {
      const top = stop.track.top,
        y0 = top + stop.box[1] * stop.s,
        y1 = top + stop.box[3] * stop.s,
        mid = (y0 + y1) / 2,
        h = view.bottom - view.top,
        band = lane ? HOLD_BAND_MOBILE : HOLD_BAND;
      let lo = mid - (view.top + band[1] * h),
        hi = mid - (view.top + band[0] * h);
      lo = Math.max(lo, y1 - view.bottom);
      hi = Math.min(hi, y0 - view.top);
      if (lo > hi) lo = hi = mid - (view.top + h / 2);
      range = [lo, hi];
    }
    // don't hold a stop after its scene has mostly scrolled past
    if (!lane && scene && stop.track.kind === "page" && act !== "basket" && act !== "peekaboo") {
      const h = view.bottom - view.top;
      const sceneTop = scene.getBoundingClientRect().top + scrollY - view.top + 0.08 * h;
      const bottomOnScreen = stop.track.top + stop.box[3] * stop.s - view.bottom;
      if (range[1] > sceneTop) {
        const end = Math.max(sceneTop, bottomOnScreen + 0.12 * h);
        range = [Math.max(bottomOnScreen, end - Math.max(range[1] - range[0], 0.2 * h)), end];
      }
    }
    ranges.push(range);
  };

  const all = [...document.querySelectorAll<HTMLElement>("[data-pup-stop]")].filter((e) => e.getClientRects().length);
  if (lane) {
    // mobile: first & last lane stops, and Teddy peeks up from the bottom edge in every scene in between
    const laneStops = all.filter((e) => e.dataset.lane === "true");
    const first = laneStops[0],
      last = laneStops.length > 1 ? laneStops[laneStops.length - 1] : undefined;
    if (first) add(first);
    const firstScene = meta[0]?.scene ?? null;
    const scenes = [...document.querySelectorAll<HTMLElement>("#main [data-pup-scene]")].filter((e) => e !== firstScene && e.getClientRects().length);
    const s = Math.min(0.62, Math.max(0.5, vw / 650));
    const box = boxFor("peek");
    scenes.forEach((scene, i) => {
      const fromLeft = i % 2 === 0;
      stops.push({ x: fromLeft ? view.left + 2 - box[0] * s : view.right - 2 - box[2] * s, track: { kind: "screen", top: 0 }, s, behind: false, sink: LANE_SINK, box });
      meta.push({ scene, pose: "peek", facing: fromLeft ? 1 : -1, act: "lane", looks: [], track: null });
      const r = scene.getBoundingClientRect();
      const a = r.top + scrollY - 0.42 * vh,
        b = r.bottom + scrollY - 0.58 * vh;
      ranges.push(a <= b ? [a, b] : [(a + b) / 2, (a + b) / 2]);
    });
    if (last) add(last);
  } else all.forEach(add);

  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  // minimum scroll distance to walk between consecutive stops
  const gaps = stops.slice(1).map((st, i) => {
    const prev = stops[i];
    const minGap = (HOLD_BAND[1] - HOLD_BAND[0]) * vh,
      floor = (lane ? 0.32 : 0.5) * vh;
    return Math.min(1.4 * vh, Math.max(floor, 1.15 * Math.hypot(Math.abs(st.x + FEET.x * st.s - (prev.x + FEET.x * prev.s)), minGap)));
  });
  return { lane, stops, meta, holds: resolveHolds(ranges, gaps, maxScroll), blend: 0.12 * vh, mainTop: main ? main.getBoundingClientRect().top + scrollY : 0 };
}

/** Make hold ranges ordered, non-overlapping and far enough apart for the walks between them. */
function resolveHolds(ranges: [number, number][], gaps: number[] | number, maxScroll: number) {
  const gapAt = (i: number) => (typeof gaps === "number" ? gaps : (gaps[i] ?? 0));
  const h = ranges.map(([a, b]) => (a <= b ? [a, b] : [(a + b) / 2, (a + b) / 2]) as [number, number]);
  if (!h.length) return h;
  h[0][0] = -Infinity;
  const last = h[h.length - 1];
  last[1] = Infinity;
  last[0] = Math.min(last[0], maxScroll - 1);
  for (let i = 0; i < h.length - 1; i++) {
    const a = h[i],
      b = h[i + 1];
    if (b[0] < a[1]) {
      const mid = (a[1] + b[0]) / 2;
      a[1] = Math.max(a[0], mid);
      b[0] = Math.min(b[1], mid);
      if (b[0] < a[1]) b[0] = a[1];
    }
    let need = gapAt(i) - (b[0] - a[1]);
    if (need > 0) {
      const ta = Math.min(need / 2, a[1] - a[0]),
        tb = Math.min(need / 2, b[1] - b[0]);
      a[1] -= ta;
      b[0] += tb;
      need -= ta + tb;
      const more = Math.min(need, b[1] - b[0]);
      b[0] += more;
      need -= more;
      if (need > 0) a[1] -= Math.min(need, a[1] - a[0]);
    }
  }
  for (const r of h) if (r[1] < r[0]) r[1] = r[0];
  return h;
}

/** A pleasant curve from stop to stop; swings out sideways when the stops are nearly above each other. */
function curve(p0: Pt, p1: Pt, safe: Rect) {
  const dx = p1.x - p0.x,
    width = safe.right - safe.left,
    reach = Math.max(0.45 * Math.abs(dx), 0),
    dir = dx >= 0 ? 1 : -1;
  let c1 = { x: p0.x + dir * reach, y: p0.y },
    c2 = { x: p1.x - dir * reach, y: p1.y };
  const minSwing = 0.14 * width;
  if (Math.abs(dx) < minSwing) {
    const swing = ((p0.x + p1.x) / 2 < (safe.left + safe.right) / 2 ? 1 : -1) * (minSwing - Math.abs(dx)) * 0.9;
    c1 = { x: c1.x + swing, y: lerp(p0.y, p1.y, 0.2) };
    c2 = { x: c2.x + swing, y: lerp(p0.y, p1.y, 0.8) };
  }
  const inside = (p: Pt) => ({ x: Math.min(safe.right, Math.max(safe.left, p.x)), y: Math.min(safe.bottom, Math.max(safe.top, p.y)) });
  return { p0, c1: inside(c1), c2: inside(c2), p1 };
}

function arcLength(c: ReturnType<typeof curve>, t: number) {
  let len = 0,
    prev = c.p0;
  const n = Math.max(1, Math.ceil(32 * clamp01(t)));
  for (let i = 1; i <= n; i++) {
    const p = bezier(c.p0, c.c1, c.c2, c.p1, (i / n) * clamp01(t));
    len += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return len;
}

/** Where Teddy is (screen coords of his feet), how big, and whether he's mid-jump, for scroll position y. */
export function place(stops: Stop[], holds: [number, number][], y: number, opts: { safe: Rect; blend: number }): Placement {
  const { k, t } = segmentAt(holds, y);
  if (t <= 0 || k >= stops.length - 1) {
    const st = stops[k];
    const p = stopPoint(st, y);
    const q = keepInside(p.x, p.y, st.s, st.box, opts.safe);
    return { x: q.x, y: q.y, s: st.s, front: !st.behind, airborne: false, k, t: 0, walked: 0 };
  }
  const a = stops[k],
    b = stops[k + 1],
    yA = holds[k][1],
    yB = holds[k + 1][0],
    span = Math.max(1, yB - yA),
    v = clamp01((y - yA) / span);
  const pa = stopPoint(a, yA),
    pb = stopPoint(b, yB);
  const c = curve({ x: pa.x, y: pa.y - a.sink * a.s }, { x: pb.x, y: pb.y - b.sink * b.s }, opts.safe);
  const eased = v * v * v * (v * (6 * v - 15) + 10); // smootherstep
  const p = bezier(c.p0, c.c1, c.c2, c.p1, eased);
  const s = lerp(a.s, b.s, smooth(clamp01(v / 0.65)));
  // blend in the stops' own scrolling so leaving/arriving doesn't jump
  const edge = Math.min(0.3, Math.max(0.06, opts.blend / span));
  const leaving = 1 - ramp(0, edge, v),
    arriving = ramp(1 - edge, 1, v);
  let py = p.y + leaving * (stopPoint(a, y).y - pa.y) + arriving * (stopPoint(b, y).y - pb.y);
  const px = p.x;
  py += a.sink * a.s * (1 - ramp(0, 0.22, v)) + b.sink * b.s * ramp(0.78, 1, v);
  let airborne = false;
  // hop out from / into stops that sit "behind" things
  if (a.behind && v < 0.36) {
    py -= Math.sin((v / 0.36) * Math.PI) * Math.min(64 * a.s, 72);
    airborne = v < 0.32;
  }
  if (b.behind && v > 0.68) {
    py -= Math.sin(((v - 0.68) / 0.32) * Math.PI) * Math.min(56 * b.s, 60);
    airborne = true;
  }
  if (a.sink && v < 0.2) airborne = true;
  const front = !((a.behind && v < 0.12) || (b.behind && v > 0.92));
  const box = v < 0.5 ? lerpBox(a.box, BOX, ramp(0, a.sink ? 0.22 : a.behind ? 0.36 : 0.06, v)) : lerpBox(BOX, b.box, ramp(b.sink ? 0.78 : b.behind ? 0.68 : 0.94, 1, v));
  const q = keepInside(px, py, s, box, opts.safe);
  return { x: q.x, y: q.y, s, front, airborne, k, t: v, walked: arcLength(c, eased) };
}

/** While scrolling has paused, snap the scroll position used for placement to the nearest "resting" point. */
export function settle(stops: Stop[], holds: [number, number][], y: number) {
  const { k, t } = segmentAt(holds, y);
  if (t <= 0 || k >= stops.length - 1) return y;
  const a = stops[k],
    b = stops[k + 1];
  const lo = a.sink ? 0.22 : 0.36 * +!!a.behind,
    hi = b.sink ? 0.78 : b.behind ? 0.68 : 1;
  let v = t;
  if (t < lo) v = t < lo / 2 ? 0 : lo;
  else if (t > hi) v = t > (1 + hi) / 2 ? 1 : hi;
  return v === t ? y : holds[k][1] + v * (holds[k + 1][0] - holds[k][1]);
}

export const REST_POSE = POSES;
