"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cancelFrame, onFrame, useReducedMotion } from "@/lib/motion";
import { PupDriver } from "@/lib/pup/driver";
import { POSES, type PoseName } from "@/lib/pup/rig";
import { burstHearts, nextTrick, TRICKS, type Cue, type TrickCtx, type TrickName } from "@/lib/pup/tricks";
import { PupSvg } from "./PupSvg";

const PEEK_TRICKS: TrickName[] = ["peekaboo", "woof", "tilt", "sneeze"];
const SNUG_TRICKS: TrickName[] = ["tilt", "love", "sneeze", "woof"];

type Props = {
  pose?: PoseName;
  facing?: "left" | "right";
  /** "tilt": keep cocking the head every so often. */
  act?: "tilt";
  label?: string;
  className?: string;
  style?: CSSProperties;
  /** A spot the walking Teddy (PupJourney) can stop at; while he's out walking this one stays still. */
  asStop?: boolean;
};

/** A living Teddy: blinks, follows the mouse, loves being petted and does a trick when clicked. */
export function PupBuddy({ pose = "sit", facing = "right", act, label, className = "", style, asStop = false }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = host.current!,
      say = bubble.current!;
    const dir = facing === "left" ? -1 : 1;
    const d = new PupDriver(el.querySelector("svg")!, pose, dir);
    d.wag(0.6);

    let queue: Cue[] = [];
    let last = performance.now() / 1e3,
      idleSince = last,
      bubbleUntil = 0,
      mouse: { x: number; y: number; t: number } | null = null,
      lastTrick: TrickName | null = null,
      clicks = 0,
      lastClick = 0,
      playing = false,
      playUntil = 0;

    const ctx: TrickCtx = {
      d,
      rest: POSES[pose],
      facing: dir,
      say: (text, secs = 1.4) => {
        say.textContent = text;
        say.dataset.show = "true";
        bubbleUntil = performance.now() / 1e3 + secs;
      },
      hearts: () => burstHearts(el, el.clientWidth * (dir > 0 ? 0.7 : 0.3), 0.25 * el.clientHeight),
    };

    const frame = () => {
      const t = performance.now() / 1e3,
        dt = Math.min(0.05, t - last);
      last = t;
      while (queue.length && queue[0][0] <= t) queue.shift()![1](t);
      if (playing !== t < playUntil) {
        playing = !playing;
        el.toggleAttribute("data-playing", playing);
      }
      d.lookAt(mouse && t - mouse.t < 3 ? mouse : null);
      if (act === "tilt" && !queue.length) {
        const s = Math.sin(0.9 * t);
        d.cock(s > 0.35 ? 13 : s < -0.35 ? -10 : 0);
      }
      // every ~9s of idling: a curious head tilt or a happy wag
      if (!queue.length && t - idleSince > 9) {
        idleSince = t;
        queue = Math.random() < 0.5 ? TRICKS.tilt(ctx, t) : [[t, () => d.wag(1)], [t + 2.2, () => d.wag(0.6)]];
      }
      if (say.dataset.show === "true" && t > bubbleUntil) say.dataset.show = "false";
      d.tick(dt, t);
    };

    let running = false;
    const run = (on: boolean) => {
      if (asStop && document.documentElement.dataset.pup) on = false; // the walker is here
      if (on === running) return;
      running = on;
      if (on) {
        last = performance.now() / 1e3;
        onFrame(frame);
      } else cancelFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => run(e.isIntersecting));
    io.observe(el);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") mouse = { x: e.clientX, y: e.clientY, t: performance.now() / 1e3 };
    };
    const onClick = () => {
      const t = performance.now() / 1e3;
      clicks = t - lastClick < 0.7 ? clicks + 1 : 1;
      lastClick = t;
      const pool = pose === "peek" ? PEEK_TRICKS : pose === "snug" ? SNUG_TRICKS : null;
      const options = pool?.filter((x) => x !== lastTrick) ?? [];
      const trick = pool ? options[Math.floor(Math.random() * options.length)] : nextTrick(lastTrick, clicks);
      lastTrick = trick;
      d.reset();
      queue = TRICKS[trick](ctx, t);
      playUntil = queue[queue.length - 1][0] + 0.4;
      idleSince = t;
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        d.petting(true);
        d.wag(1);
      }
    };
    const onLeave = () => {
      d.petting(false);
      d.wag(0.6);
    };
    addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("click", onClick);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      run(false);
      el.removeAttribute("data-playing");
      io.disconnect();
      removeEventListener("pointermove", onMove);
      el.removeEventListener("click", onClick);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced, pose, facing, act, asStop]);

  return (
    <div ref={host} className={`pup-buddy ${className}`} style={style} data-live={reduced ? undefined : ""} data-facing={facing}>
      <PupSvg key={String(reduced)} pose={pose} facing={facing} label={label} />
      <span ref={bubble} aria-hidden className="pup-bubble" data-show="false" />
    </div>
  );
}
