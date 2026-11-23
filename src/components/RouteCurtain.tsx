"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { PAW_PATH } from "@/lib/paw";
import { COLLAR, CREAM, FLOOR, FUR, FUR_SHADE, H, INK, JOINTS, LEGS, PATHS, toes, W, BLUSH } from "@/lib/pup/rig";

const line = { stroke: INK, strokeWidth: 3.4, strokeLinejoin: "round", strokeLinecap: "round" } as const;
const outline = { ...line, fill: "none" } as const;

function RunnerLeg({ cls, at, d, len, fill }: { cls: string; at: [number, number]; d: string; len: number; fill: string }) {
  return (
    <g className={`tp-runner__leg ${cls}`} style={{ transformOrigin: `${at[0]}px ${at[1]}px` }}>
      <g transform={`translate(${at[0]} ${at[1]})`}>
        <path d={`${d}Z`} fill={fill} />
        <path d={d} {...outline} />
        <path d={toes(len)} {...outline} strokeWidth={2.4} />
      </g>
    </g>
  );
}

/** Teddy mid-gallop: the same rig as PupSvg, animated purely with CSS keyframes. */
function Runner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`tp-runner ${className}`} aria-hidden focusable="false" style={{ overflow: "visible" }}>
      <ellipse cx={150} cy={FLOOR + 2} rx={86} ry={7} fill={INK} opacity={0.12} className="tp-runner__shadow" />
      <g className="tp-runner__body">
        <RunnerLeg cls="tp-runner__leg--bf" at={JOINTS.hipF} d={LEGS.backFar} len={FLOOR - 192} fill={FUR_SHADE} />
        <RunnerLeg cls="tp-runner__leg--ff" at={JOINTS.shoulderF} d={LEGS.frontFar} len={FLOOR - 192} fill={FUR_SHADE} />
        <g className="tp-runner__tail" style={{ transformOrigin: `${JOINTS.tailBase[0]}px ${JOINTS.tailBase[1]}px` }}>
          <path d={PATHS.tailStem} {...outline} strokeWidth={9} />
          <path d={PATHS.tailStem} stroke={FUR} strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d={PATHS.tail} fill={FUR} {...line} />
        </g>
        <RunnerLeg cls="tp-runner__leg--bn" at={JOINTS.hipN} d={LEGS.back} len={FLOOR - 194} fill={FUR} />
        <path d={PATHS.body} fill={FUR} {...line} />
        <path d={PATHS.chest} fill={FUR} {...line} />
        <RunnerLeg cls="tp-runner__leg--fn" at={JOINTS.shoulderN} d={LEGS.front} len={FLOOR - 194} fill={FUR} />
        <g className="tp-runner__head">
          <path d={PATHS.collar} fill={COLLAR} {...line} strokeWidth={3} />
          <path d={PATHS.tag} fill={CREAM} {...line} strokeWidth={2.4} />
          <path d={PATHS.earL} fill={FUR_SHADE} {...line} className="tp-runner__ear" style={{ transformOrigin: "174px 82px" }} />
          <path d={PATHS.earR} fill={FUR_SHADE} {...line} className="tp-runner__ear tp-runner__ear--r" style={{ transformOrigin: "250px 82px" }} />
          <path d={PATHS.head} fill={FUR} {...line} />
          <path d={PATHS.topknot} fill={FUR} {...line} strokeWidth={3} />
          <path d={PATHS.muzzle} fill={CREAM} />
          <circle cx={181} cy={116} r={7} fill={BLUSH} opacity={0.85} />
          <circle cx={243} cy={116} r={7} fill={BLUSH} opacity={0.85} />
          <path d="M186.5 101 Q194 91.5 201.5 101 M222.5 101 Q230 91.5 237.5 101" {...outline} />
          <path d={PATHS.nose} fill={INK} />
          <path d={PATHS.mouth} {...outline} strokeWidth={3} />
          <path d={PATHS.tongue} fill="#e98c8c" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}

type CurtainState = "intro" | "idle" | "covering" | "covered" | "snap" | "lifting";

/** How far (ms) the first-load intro animation has played; Infinity once it's done. */
function introElapsed() {
  const a = document
    .querySelector(".tp-curtain")
    ?.getAnimations()
    .find((x) => (x as CSSAnimation).animationName === "tp-curtain-rest");
  return a && a.playState !== "finished" && typeof a.currentTime === "number" ? a.currentTime : Infinity;
}

const PRINTS: [left: number, top: number, rot: number][] = [
  [18, 6, -76],
  [27, -4, -84],
  [36, 7, -72],
  [45, -3, -86],
  [54, 6, -74],
];

/**
 * The blanket that drops over the page between routes (and lifts on first load):
 * intercepts internal link clicks, covers, navigates, then lifts when the new route renders.
 */
export function RouteCurtain() {
  const router = useRouter();
  const pathname = usePathname();
  const el = useRef<HTMLDivElement>(null);
  const pending = useRef<string | null>(null);
  const coveredAt = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastPath = useRef(pathname);
  const keyboardNav = useRef(false);
  const lift = useRef<() => void>(() => {});

  useEffect(() => {
    const curtain = el.current!,
      root = document.documentElement;
    const set = (s: CurtainState) => {
      curtain.dataset.state = s;
      if (s === "idle") delete root.dataset.curtain;
      else root.dataset.curtain = s;
    };
    const clear = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

    const doLift = () => {
      const s = curtain.dataset.state;
      if (s === "idle" || s === "lifting") return;
      clear();
      pending.current = null;
      set("lifting");
      dispatchEvent(new Event("tp:arrived"));
      if (keyboardNav.current) {
        keyboardNav.current = false;
        document.getElementById("main")?.focus({ preventScroll: true });
      }
      later(() => set("idle"), 460);
    };
    const go = (href: string) => {
      const u = new URL(href, location.href);
      if (u.pathname === location.pathname && u.search === location.search) {
        pending.current = null;
        scrollTo({ top: 0, behavior: "instant" });
        later(doLift, 120);
        return;
      }
      router.push(u.pathname + u.search + u.hash);
      later(doLift, 6000); // safety net
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download") || a.dataset.noCurtain !== undefined) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || /^\/(admin|api|media|_next)(\/|$)/.test(u.pathname)) return;
      if (u.pathname === location.pathname && (u.hash || u.search !== location.search)) return; // in-page anchor
      if (prefersReducedMotion()) return;
      e.preventDefault();
      e.stopPropagation();
      keyboardNav.current = e.detail === 0;
      router.prefetch(u.pathname + u.search);
      dispatchEvent(new Event("tp:navigate"));
      const state = curtain.dataset.state;
      pending.current = u.href;
      if (state === "covered" || state === "snap") return go(u.href);
      if (state === "covering") return;
      clear();
      if (state === "intro" && introElapsed() < 1080) {
        set("covered");
        coveredAt.current = performance.now();
        go(u.href);
      } else {
        set("covering");
        later(() => {
          set("covered");
          coveredAt.current = performance.now();
          if (pending.current) go(pending.current);
        }, 300);
      }
    };
    const onPop = () => {
      if (prefersReducedMotion() || location.pathname === lastPath.current) return;
      clear();
      set("snap");
      coveredAt.current = performance.now();
      later(doLift, 1400);
    };
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        clear();
        set("idle");
      }
    };

    if (curtain.dataset.state === "intro") {
      const t = introElapsed();
      later(() => dispatchEvent(new Event("tp:arrived")), Math.max(0, 560 - t));
      later(() => curtain.dataset.state === "intro" && set("idle"), Math.max(0, 1080 - t));
    }
    if (prefersReducedMotion()) set("idle");
    addEventListener("click", onClick, true);
    addEventListener("popstate", onPop);
    addEventListener("pageshow", onShow);
    lift.current = doLift;
    return () => {
      clear();
      delete root.dataset.curtain;
      removeEventListener("click", onClick, true);
      removeEventListener("popstate", onPop);
      removeEventListener("pageshow", onShow);
    };
  }, [router]);

  // the new route has rendered: lift the blanket (after a minimum cover time)
  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    const s = el.current?.dataset.state;
    if (s !== "covered" && s !== "snap" && s !== "covering") return;
    const wait = Math.max(0, 140 - (performance.now() - coveredAt.current));
    const t = setTimeout(() => requestAnimationFrame(() => lift.current()), s === "covering" ? 340 : wait);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div ref={el} className="tp-curtain" data-state="intro" aria-hidden>
      <div className="tp-curtain__blanket">
        <svg className="tp-curtain__edge tp-curtain__edge--top" width="100%" height="40" preserveAspectRatio="none">
          <defs>
            <pattern id="tp-curtain-scallop" width="76" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 40V27A38 25 0 0 1 76 27V40Z" fill="#fbe3b4" />
              <path d="M0 27A38 25 0 0 1 76 27" fill="none" stroke="#2a170e" strokeWidth="3" />
              <path d="M11 33A27 19 0 0 1 65 33" fill="none" stroke="#2a170e" strokeWidth="1.6" strokeDasharray="3.5 5.5" strokeLinecap="round" opacity=".42" />
            </pattern>
          </defs>
          <rect width="100%" height="40" fill="url(#tp-curtain-scallop)" />
        </svg>
        <div className="tp-curtain__stage">
          <div className="tp-curtain__prints">
            {PRINTS.map(([left, top, r], i) => (
              <svg key={i} viewBox="0 0 64 64" className="tp-curtain__print" style={{ left: `${left}%`, top: `${top}px`, rotate: `${r + 90}deg`, animationDelay: `${0.16 + 0.12 * i}s` }}>
                <path d={PAW_PATH} />
              </svg>
            ))}
          </div>
          <div className="tp-curtain__runner">
            <Runner />
          </div>
          <p className="tp-curtain__note font-scrawl">every puppy is family</p>
        </div>
        <svg className="tp-curtain__edge tp-curtain__edge--bottom" width="100%" height="40" preserveAspectRatio="none">
          <rect width="100%" height="40" fill="url(#tp-curtain-scallop)" />
        </svg>
      </div>
    </div>
  );
}

/** True while the curtain is covering the page (scenes wait for it before animating in). */
export function curtainDown() {
  const s = document.querySelector<HTMLElement>(".tp-curtain")?.dataset.state;
  return (s === "intro" && introElapsed() < 560) || s === "covering" || s === "covered" || s === "snap";
}
