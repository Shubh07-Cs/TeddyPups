"use client";

import { useSyncExternalStore } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

/** Imperative check, safe to call in event handlers / effects. */
export const prefersReducedMotion = () => matchMedia(REDUCED).matches;

/** Reactive reduced-motion flag. Renders "reduced" on the server so SSR markup is the calm, static state. */
export function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(REDUCED);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => matchMedia(REDUCED).matches,
    () => true,
  );
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

/* ── Shared frame loop ──────────────────────────────────────────────
 * Every animated thing (smooth scroll, puppy rigs, scroll scenes) ticks from
 * one requestAnimationFrame. "read" callbacks (Lenis) run before "update"
 * callbacks, so anything reading scrollY sees this frame's value. */
type FrameFn = (timestamp: number) => void;
const phases = { read: new Set<FrameFn>(), update: new Set<FrameFn>() };
let rafId = 0;
const loop = (ts: number) => {
  rafId = 0;
  for (const fn of [...phases.read]) fn(ts);
  for (const fn of [...phases.update]) fn(ts);
  if (phases.read.size || phases.update.size) rafId = requestAnimationFrame(loop);
};
export function onFrame(fn: FrameFn, phase: keyof typeof phases = "update") {
  phases[phase].add(fn);
  if (!rafId) rafId = requestAnimationFrame(loop);
}
export function cancelFrame(fn: FrameFn) {
  phases.read.delete(fn);
  phases.update.delete(fn);
}
