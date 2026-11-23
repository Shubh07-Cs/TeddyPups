"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { cancelFrame, onFrame, prefersReducedMotion, useReducedMotion } from "@/lib/motion";

let lenis: Lenis | null = null;

/** Lenis smooth scrolling on desktop pointers, plus smooth in-page #anchor links everywhere. */
export function SmoothScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.detail === 0 || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self")) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.pathname !== location.pathname || u.search !== location.search || u.hash.length < 2) return;
      const id = decodeURIComponent(u.hash.slice(1));
      const target = [...document.querySelectorAll<HTMLElement>(`[id="${CSS.escape(id)}"]`)].find((el) => el.getClientRects().length);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target);
      else target.scrollIntoView({ behavior: prefersReducedMotion() ? "instant" : "smooth" });
      history.pushState(null, "", u.hash);
    };
    addEventListener("click", onClick);
    return () => removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (reduced || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const root = document.documentElement;
    const l = new Lenis({
      autoRaf: false,
      lerp: 0.1,
      wheelMultiplier: 0.85,
      prevent: (node) => !!node.closest?.("dialog, [data-lenis-prevent]"),
      virtualScroll: () => getComputedStyle(root).overflowY !== "hidden",
    });
    lenis = l;
    const jump = () => l.scrollTo(l.actualScroll, { immediate: true });
    addEventListener("tp:navigate", jump);
    addEventListener("popstate", jump);
    const raf = (ts: number) => l.raf(ts);
    onFrame(raf, "read");
    return () => {
      cancelFrame(raf);
      removeEventListener("tp:navigate", jump);
      removeEventListener("popstate", jump);
      l.destroy();
      lenis = null;
    };
  }, [reduced]);

  return null;
}
