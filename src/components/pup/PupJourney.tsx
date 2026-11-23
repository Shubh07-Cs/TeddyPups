"use client";

import { useEffect, useRef } from "react";
import { cancelFrame, onFrame, prefersReducedMotion } from "@/lib/motion";
import { PAW_PATH } from "@/lib/paw";
import { PupDriver } from "@/lib/pup/driver";
import { FEET, place, plan, settle, type Plan, type Placement, type StopMeta } from "@/lib/pup/journey";
import { POSES, W } from "@/lib/pup/rig";
import { burstHearts, nextTrick, TRICKS, type Cue, type TrickCtx, type TrickName } from "@/lib/pup/tricks";
import { PupSvg } from "./PupSvg";

export type PupCue = { look?: Element; secs?: number; say?: string };

/** Ask the walking Teddy to glance at something (and maybe say a word) — only heard by the scene he's in. */
export function cuePup(detail: PupCue) {
  dispatchEvent(new CustomEvent<PupCue>("pup:cue", { detail }));
}

const set = (el: HTMLElement, key: string, value: string) => {
  if (el.dataset[key] !== value) el.dataset[key] = value;
};
const pick = <T,>(list: T[], not: T | null) => {
  const pool = list.filter((x) => x !== not);
  return pool[Math.floor(Math.random() * pool.length)];
};
type WalkTrick = "jump" | "woof" | "love" | "sneeze";
const WALK_TRICKS: WalkTrick[] = ["jump", "woof", "love", "sneeze"];

let disposeActive: (() => void) | null = null;

/**
 * Teddy walks the homepage with you: he sits at each [data-pup-stop], and as
 * you scroll he trots (or hops) along a curve to the next one, leaving paw prints.
 */
export function PupJourney() {
  const layer = useRef<HTMLDivElement>(null);
  const actor = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const bubbleAt = useRef<HTMLSpanElement>(null);
  const prints = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLDivElement>(null);

  useEffect(() => {
    disposeActive?.();
    const layerEl = layer.current!,
      actorEl = actor.current!,
      bodyEl = body.current!,
      bubbleEl = bubble.current!,
      bubbleAtEl = bubbleAt.current!,
      printsEl = prints.current!,
      probeEl = probe.current!;
    const svg = bodyEl.querySelector("svg")!;
    const root = document.documentElement;
    const header = document.getElementById("site-header");
    const printEls = [...printsEl.children] as HTMLElement[];

    let route: Plan | null = null,
      d: PupDriver | null = null,
      active = false,
      replanTimer: ReturnType<typeof setTimeout> | undefined;
    let printIdx = 0,
      bubbleUntil = 0;
    let mouse: { x: number; y: number; t: number } | null = null;
    let lookAt: { el: Element; until: number } | null = null;
    let lastT = performance.now() / 1e3,
      lastScroll = scrollY;
    let prev: { x: number; y: number } | null = null; // last drawn position
    let now: Placement | null = null; // current placement (with smoothing applied)
    const drift = { x: 0, y: 0, s: 0 }; // decaying offset that smooths over re-plans / settling
    let stillFor = 0,
      held = -1,
      heldSince = 0,
      lastActivity = 0,
      queue: Cue[] = [],
      lastLook = 0,
      lookIdx = -1;
    let treadLeft: number | null = null,
      treadStill = 0,
      lastSeg = -1,
      lastStep = 0,
      nextFidget = 0,
      lastScrollAt = performance.now() / 1e3,
      scrollDir = 1,
      wasSettled = false;
    let laneFollow: { x: number; y: number } | null = null,
      lastBarTop = 0,
      laneWalked = 0,
      anchorOffset = 0;
    let clicks = 0,
      lastClick = 0,
      lastTrick: string | null = null;

    const say = (text: string, t: number, secs = 1.4) => {
      bubbleEl.textContent = text;
      bubbleEl.dataset.show = "true";
      bubbleUntil = t + secs;
    };
    const barTop = () => {
      const bar = document.querySelector("[data-whatsapp-bar]");
      const r = bar?.getClientRects().length ? bar.getBoundingClientRect() : null;
      return r && r.height ? r.top : innerHeight - 6;
    };
    const safeArea = (p: Plan) => {
      const w = root.clientWidth,
        top = (header?.offsetHeight ?? 76) + 10;
      if (p.lane) return { left: 10, top, right: w - 10, bottom: barTop() + 40 };
      const bar = document.querySelector("[data-whatsapp-bar]");
      const b = bar?.getClientRects().length ? bar.getBoundingClientRect().top : innerHeight;
      return { left: 10, top, right: w - 10, bottom: Math.min(innerHeight, b) - 10 };
    };
    const placeAt = (p: Plan, y: number) => {
      if (p.lane) {
        const t = barTop();
        for (const st of p.stops) if (st.track.kind === "screen") st.track.top = t - 159 * st.s;
      }
      return place(p.stops, p.holds, y, { safe: safeArea(p), blend: p.blend });
    };
    const ctxFor = (m: StopMeta): TrickCtx => ({
      d: d!,
      rest: POSES[m.pose],
      facing: m.facing,
      say: (text, secs) => say(text, performance.now() / 1e3, secs),
      hearts: () => now && burstHearts(layerEl, now.x - FEET.x * now.s + (d!.facingDir > 0 ? 212 : W - 212) * now.s, now.y - (FEET.y - 40) * now.s - anchorOffset),
    });

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") mouse = { x: e.clientX, y: e.clientY, t: performance.now() / 1e3 };
    };
    const onCue = (e: Event) => {
      const cue = (e as CustomEvent<PupCue>).detail;
      const scene = held >= 0 ? route?.meta[held]?.scene : null;
      if (!scene || (cue.look && !scene.contains(cue.look))) return;
      const t = performance.now() / 1e3;
      if (cue.look) lookAt = { el: cue.look, until: t + (cue.secs ?? 1.6) };
      if (cue.say) say(cue.say, t);
    };
    const onFocus = (e: FocusEvent) => {
      const t = e.target;
      if (t instanceof HTMLElement && t.matches("a, button, input, textarea, select, summary")) lookAt = { el: t, until: performance.now() / 1e3 + 1.4 };
    };

    const tick = () => {
      if (!route || !d) return;
      const t = performance.now() / 1e3,
        dt = Math.min(0.05, t - lastT);
      lastT = t;
      const y = scrollY,
        dy = y - lastScroll;
      lastScroll = y;
      if (Math.abs(dy) > 0.5) {
        lastScrollAt = t;
        scrollDir = dy > 0 ? 1 : -1;
      }
      const dog = d;
      while (queue.length && queue[0][0] <= t) queue.shift()![1](t);

      const y2 = t - lastScrollAt > 0.25 ? settle(route.stops, route.holds, y) : y;
      const pl = placeAt(route, y2);
      const inLane = route.lane && (() => {
        const a = route.stops[pl.k],
          b = pl.t > 0 ? route.stops[pl.k + 1] : a;
        return a.track.kind === "screen" && b?.track.kind === "screen";
      })();
      const decay = Math.exp(-dt / 0.28);
      drift.x *= decay;
      drift.y *= decay;
      drift.s *= decay;
      if (Math.abs(drift.x) < 0.05 && Math.abs(drift.y) < 0.05) drift.x = drift.y = 0;
      const settled = y2 !== y;
      if (settled !== wasSettled && prev && !inLane) {
        drift.x = prev.x - pl.x;
        drift.y = prev.y - pl.y;
      }
      wasSettled = settled;
      const s = pl.s + drift.s;
      let x = pl.x + drift.x,
        fy = pl.y + drift.y;
      const bar = route.lane ? barTop() : 0;
      let arrived = true;
      if (inLane) {
        laneFollow ||= prev ? { x: prev.x, y: prev.y - lastBarTop } : { x, y: fy - bar };
        const k = 1 - Math.exp(-dt / 0.14);
        laneFollow.x += (x - laneFollow.x) * k;
        laneFollow.y += (fy - bar - laneFollow.y) * k;
        arrived = Math.hypot(x - laneFollow.x, fy - bar - laneFollow.y) < 1.5;
        x = laneFollow.x;
        fy = bar + laneFollow.y;
      } else if (laneFollow) {
        drift.x = (prev?.x ?? x) - pl.x;
        drift.y = (prev?.y ?? fy) - pl.y;
        x = pl.x + drift.x;
        fy = pl.y + drift.y;
        laneFollow = null;
      }
      lastBarTop = bar;
      now = { ...pl, x, y: fy, s };
      set(layerEl, "anchor", inLane ? "bottom" : "top");
      anchorOffset = inLane ? layerEl.getBoundingClientRect().top : 0;

      const holding = pl.t === 0 && arrived,
        k = pl.k;
      if (holding) {
        if (held !== k) {
          // just arrived at a stop: settle into its pose
          const m = route.meta[k];
          queue = [];
          lookAt = null;
          held = k;
          heldSince = t;
          lastActivity = t;
          treadLeft = null;
          dog.reset();
          dog.setPose(m.pose);
          dog.face(m.facing, 0.14);
          dog.stride(0);
          dog.wag(m.act === "basket" ? 0.3 : 0.7);
          dog.jolt(0.4);
          nextFidget = t + 2.4;
        }
        const m = route.meta[k];
        if (m.track && !queue.length) {
          // treadmill: walk in place while the puppy doors slide past
          const left = m.track.getBoundingClientRect().left,
            moved = treadLeft === null ? 0 : left - treadLeft;
          treadLeft = left;
          dog.walkedTo(-left / s);
          if (Math.abs(moved) > 0.15) {
            treadStill = 0;
            dog.setPose("walk");
            dog.stride(1);
            dog.face(moved < 0 ? 1 : -1, 0.16);
          } else if ((treadStill += dt) > 0.25) {
            dog.setPose("stand");
            dog.stride(0);
          }
        }
        if (m.act === "tilt" && !queue.length && t - heldSince > 1.2) {
          const w = Math.sin(0.9 * t);
          dog.cock(w > 0.35 ? 13 : w < -0.35 ? -10 : 0);
        }
        if (m.act === "basket" && !queue.length && t > nextFidget) {
          nextFidget = t + 4.5 + 3 * Math.random();
          if (Math.random() < 0.7) dog.jolt(0.55);
          else dog.yawn(t, 0.7);
        }
        const busyLooking = (lookAt && lookAt.until > t) || (mouse && t - mouse.t < 2.5);
        if (m.looks.length && !busyLooking && t - heldSince > 0.8 && t - lastLook > 1.7) {
          lastLook = t;
          lookIdx = (lookIdx + 1) % (m.looks.length + 1);
          if (lookIdx < m.looks.length) lookAt = { el: m.looks[lookIdx], until: t + 1.4 };
        }
        if (Math.abs(dy) > 0.5) lastActivity = t;
        if (!queue.length && !m.track && m.act !== "basket" && t - lastActivity > 9) {
          lastActivity = t;
          queue = Math.random() < 0.55 ? TRICKS.tilt(ctxFor(m), t) : [[t, () => dog.wag(1)], [t + 2.4, () => dog.wag(0.7)]];
        }
      } else {
        if (held !== -1) {
          held = -1;
          queue = [];
          d?.reset();
        }
        const moved = prev ? Math.hypot(x - prev.x, fy - prev.y) : 0;
        stillFor = moved > 0.25 ? 0 : stillFor + dt;
        let airborne = pl.airborne;
        if (route.lane && pl.t > 0) {
          const a = route.stops[k],
            b = route.stops[k + 1];
          if (a.sink && pl.t < 0.22) airborne = scrollDir > 0;
          else if (b?.sink && pl.t > 0.78) airborne = scrollDir < 0;
        }
        if (airborne) {
          dog.setPose("hop");
          dog.stride(0);
        } else if (stillFor > 0.3) {
          dog.setPose("stand");
          dog.stride(0);
          if (stillFor > 2.6 && stillFor - dt <= 2.6) say("coming?", t);
        } else {
          dog.setPose("walk");
          dog.stride(1);
        }
        dog.walkedTo((inLane ? (laneWalked += moved) : pl.walked) / Math.max(0.05, s));
        if (prev) {
          const dx = x - prev.x;
          if (Math.abs(dx) > 0.6 && Math.abs(dx) > 0.35 * Math.abs(fy - prev.y)) dog.face(dx > 0 ? 1 : -1, 0.16);
        }
        if (!route.lane) {
          // a paw print every 34 rig-px walked, alternating front/back paws
          const step = Math.floor(pl.walked / (34 * s));
          if (lastSeg === k && step !== lastStep && !pl.airborne && prev) {
            const odd = step & 1,
              pawX = odd ? 186 : 110;
            const ox = x - FEET.x * s,
              oy = fy - FEET.y * s;
            const px = ox + (dog.facingDir > 0 ? pawX : W - pawX) * s;
            const py = oy + 226 * s + y - route.mainTop + (odd ? -4 : 4) * s;
            const angle = Math.atan2(fy - prev.y + dy, x - prev.x) + Math.PI / 2;
            const size = 14 * Math.max(0.75, 1.5 * s);
            const print = printEls[printIdx++ % printEls.length];
            print.style.transform = `translate(${(px - size / 2).toFixed(1)}px, ${(py - size / 2).toFixed(1)}px) rotate(${angle.toFixed(3)}rad)`;
            print.style.width = print.style.height = `${size.toFixed(1)}px`;
            print.animate([{ opacity: 0 }, { opacity: 0.45, offset: 0.08 }, { opacity: 0.45, offset: 0.5 }, { opacity: 0 }], { duration: 2600, easing: "ease-out" });
          }
          lastSeg = k;
          lastStep = step;
        }
      }
      prev = { x, y: fy };
      const progress = pl.t;
      route.meta.forEach((m, i) => {
        if (!m.scene) return;
        set(m.scene, "here", String(holding && i === k));
        set(m.scene, "visited", String(i <= k || (i === k + 1 && progress > 0.92)));
      });
      if (lookAt && lookAt.until > t) {
        const r = lookAt.el.getBoundingClientRect();
        dog.lookAt({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      } else dog.lookAt(mouse && t - mouse.t < 2.5 ? mouse : null);
      actorEl.style.transform = `translate3d(${(x - FEET.x * s).toFixed(2)}px, ${(fy - FEET.y * s - anchorOffset).toFixed(2)}px, 0)`;
      bodyEl.style.transform = `scale(${s.toFixed(4)})`;
      set(layerEl, "front", String(pl.front));
      set(actorEl, "holding", String(holding));
      if (bubbleEl.dataset.show === "true") {
        if (t > bubbleUntil) bubbleEl.dataset.show = "false";
        const bx = (dog.facingDir > 0 ? 214 : W - 214) * s;
        bubbleAtEl.style.transform = `translate(${bx.toFixed(1)}px, ${(30 * s).toFixed(1)}px)`;
      }
      dog.tick(dt, t);
    };

    const onClick = () => {
      if (!d || !route) return;
      const dog = d,
        t = performance.now() / 1e3;
      clicks = t - lastClick < 0.7 ? clicks + 1 : 1;
      lastClick = t;
      lastActivity = t;
      if (held < 0) {
        // mid-walk tricks
        const m = route.meta[Math.max(0, now?.k ?? 0)];
        const trick = pick(WALK_TRICKS, lastTrick as WalkTrick | null);
        lastTrick = trick;
        const c = ctxFor(m);
        queue =
          trick === "jump"
            ? [[t, () => (dog.hop(1.35), c.say(pick(["wheee!", "boing!", "yip!"], null)))], [t + 0.5, () => dog.hop(0.7)]]
            : trick === "woof"
              ? [[t, (n) => (dog.woof(n), c.say("woof!"))], [t + 0.4, (n) => dog.woof(n)]]
              : trick === "love"
                ? [[t, () => (dog.wag(1), dog.hop(0.5), c.hearts?.(), c.say("I like you!"))]]
                : [[t, (n) => (dog.jolt(1.4), dog.hop(0.4), dog.yawn(n, 0.22), c.say("achoo!"))]];
        return;
      }
      const m = route.meta[held];
      let trick: TrickName;
      if (m.track) trick = pick<TrickName>(["woof", "hop", "love"], lastTrick as TrickName);
      else if (m.act === "basket") trick = pick<TrickName>(["tilt", "love", "sneeze", "woof"], lastTrick as TrickName);
      else if (m.pose === "peek") trick = pick<TrickName>(["peekaboo", "woof", "tilt", "sneeze"], lastTrick as TrickName);
      else {
        trick = nextTrick(lastTrick as TrickName | null, clicks);
        if (trick === "zoomies") trick = "spin"; // no room to zoom on a walk
      }
      if (trick === "peekaboo" && queue.length) return;
      lastTrick = trick;
      dog.reset();
      queue = TRICKS[trick](ctxFor(m), t);
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && d && held >= 0) {
        d.petting(true);
        d.wag(1);
      }
    };
    const onLeave = () => {
      if (!d) return;
      d.petting(false);
      if (held >= 0) d.wag(route?.meta[held]?.act === "basket" ? 0.3 : 0.7);
    };

    const start = () => {
      if (active || prefersReducedMotion()) return;
      const p = plan(probeEl);
      if (p.stops.length < 2) return;
      route = p;
      active = true;
      root.dataset.pup = p.lane ? "lane" : "live";
      layerEl.hidden = false;
      const first = p.meta[0];
      d = new PupDriver(svg, first.pose, first.facing);
      lastScroll = scrollY;
      prev = null;
      lastScrollAt = lastT = performance.now() / 1e3;
      wasSettled = false;
      laneFollow = null;
      const t0 = lastT;
      const pl = placeAt(p, scrollY);
      if (pl.k === 0 && pl.t === 0 && first.act === "peekaboo") {
        // opening act: pop up between the hero puppies and look at the first & last one
        held = 0;
        heldSince = t0;
        const dog = d;
        const friends = first.scene?.querySelectorAll("[data-pup-friend]") ?? [];
        const a = friends[0],
          b = friends[friends.length - 1];
        queue = [
          [t0 + 0.1, () => dog.setPose({ ...POSES.peek, headY: 120 })],
          [t0 + 0.7, (n) => (dog.setPose("peek"), dog.jolt(1.2), say("peekaboo!", n, 1.6))],
          [t0 + 1.5, (n) => a && (lookAt = { el: a, until: n + 0.8 })],
          [t0 + 2.3, (n) => b && (lookAt = { el: b, until: n + 0.8 })],
          [t0 + 3.1, () => ((lookAt = null), dog.wag(1))],
        ];
      } else held = -1;
      addEventListener("pointermove", onMove, { passive: true });
      addEventListener("pup:cue", onCue);
      addEventListener("focusin", onFocus);
      actorEl.addEventListener("click", onClick);
      actorEl.addEventListener("pointerenter", onEnter);
      actorEl.addEventListener("pointerleave", onLeave);
      onFrame(tick);
    };
    const stop = () => {
      if (!active) return;
      active = false;
      cancelFrame(tick);
      delete root.dataset.pup;
      layerEl.hidden = true;
      delete layerEl.dataset.anchor;
      anchorOffset = 0;
      route?.meta.forEach((m) => {
        if (m.scene) {
          delete m.scene.dataset.here;
          delete m.scene.dataset.visited;
        }
      });
      route = null;
      d = null;
      held = -1;
      removeEventListener("pointermove", onMove);
      removeEventListener("pup:cue", onCue);
      removeEventListener("focusin", onFocus);
      actorEl.removeEventListener("click", onClick);
      actorEl.removeEventListener("pointerenter", onEnter);
      actorEl.removeEventListener("pointerleave", onLeave);
    };
    const replan = () => {
      clearTimeout(replanTimer);
      replanTimer = setTimeout(() => {
        if (!active || !route) return;
        const p = plan(probeEl);
        if (p.stops.length < 2) return stop();
        const was = now,
          laneChanged = p.lane !== route.lane;
        route = p;
        root.dataset.pup = p.lane ? "lane" : "live";
        if (laneChanged) held = -1;
        if (was) {
          const q = placeAt(p, scrollY);
          drift.x = was.x - q.x;
          drift.y = was.y - q.y;
          drift.s = was.s - q.s;
        }
      }, 120);
    };

    const ro = new ResizeObserver(replan);
    ro.observe(document.body);
    addEventListener("resize", replan);
    addEventListener("load", replan);
    const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionPref = () => (prefersReducedMotion() ? stop() : start());
    motionQuery.addEventListener("change", onMotionPref);
    start();
    document.fonts?.ready.then(replan);

    const dispose = () => {
      stop();
      clearTimeout(replanTimer);
      ro.disconnect();
      removeEventListener("resize", replan);
      removeEventListener("load", replan);
      motionQuery.removeEventListener("change", onMotionPref);
      if (disposeActive === dispose) disposeActive = null;
    };
    disposeActive = dispose;
    return dispose;
  }, []);

  return (
    <>
      <div ref={probe} aria-hidden className="pup-probe" />
      <div ref={prints} aria-hidden className="pup-prints">
        {Array.from({ length: 24 }, (_, i) => (
          <svg key={i} viewBox="0 0 64 64">
            <path d={PAW_PATH} />
          </svg>
        ))}
      </div>
      <div ref={layer} aria-hidden className="pup-layer" hidden data-front="true">
        <div ref={actor} className="pup-actor">
          <div ref={body} className="pup-actor__body">
            <PupSvg pose="peek" />
          </div>
          <span ref={bubbleAt} className="pup-bubble-at">
            <span ref={bubble} className="pup-bubble" data-show="false" />
          </span>
        </div>
      </div>
    </>
  );
}
