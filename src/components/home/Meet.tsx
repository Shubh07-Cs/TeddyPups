"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { MediaImage } from "@/components/MediaImage";
import { PawIcon } from "@/components/PawIcon";
import { cuePup } from "@/components/pup/PupJourney";
import { PupStop } from "@/components/pup/PupStop";
import { Scene } from "@/components/scenes/Scene";
import { useReducedMotion } from "@/lib/motion";
import type { Puppy, Section, Tone } from "@/lib/types";

const STATUS: Record<string, string> = { available: "Available", reserved: "Reserved", rehomed: "Gone home", "gone-home": "Gone home" };
const DOOR_COLOURS = ["#a24a1a", "#5a3a28", "#d4893f", "#b8644a", "#7a4a2e"];

/** One puppy as a front door: name plate above, the puppy inside, a door that swings open. */
function Door({ pup, index, sizes, preload = false }: { pup: Puppy; index: number; sizes: string; preload?: boolean }) {
  const hasVideo = pup.media.some((m) => m.kind === "video");
  return (
    <Link href={`/puppies/${pup.slug}`} className="tp-door__link" style={{ "--door": DOOR_COLOURS[index % DOOR_COLOURS.length] } as CSSProperties}>
      <span className="tp-door__plate">
        <span className="font-plush tp-door__name">{pup.displayName}</span>
        <span className="tp-door__meta">
          {pup.name ? `${pup.breed}, ` : ""}
          {pup.genderLabel.toLowerCase()}
          {pup.age ? `, ${pup.age}` : ""}
          {hasVideo ? ", with video" : ""}
        </span>
      </span>
      <span className="tp-door__frame">
        <span className="tp-door__room">{pup.cover && <MediaImage media={pup.cover} sizes={sizes} preload={preload} />}</span>
        <span aria-hidden className="tp-door__way">
          <span className="tp-door__leaf">
            <PawIcon className="tp-door__peephole" />
            <span className="tp-door__knob" />
          </span>
        </span>
        <span className="tp-door__tag font-scrawl">{STATUS[pup.status]}</span>
      </span>
    </Link>
  );
}

/**
 * "Meet the pups". On large screens the section pins and scrolling slides a
 * hallway of doors past Teddy, who walks on the spot; each door swings open as
 * it reaches him. Elsewhere it's a simple grid of open doors.
 */
export function Meet({ section, puppies, tone }: { section: Section; puppies: Puppy[]; tone: Tone }) {
  const range = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const hall = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [travel, setTravel] = useState(0);
  const [pinned, setPinned] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      const wide = matchMedia("(min-width: 1024px)").matches;
      setPinned(wide && !reduced);
      const t = track.current,
        h = hall.current;
      if (h && t && wide && !reduced) {
        // size the doors so the whole hallway fits the pinned viewport
        const stage = h.parentElement!,
          head = stage.querySelector<HTMLElement>(".tp-meet__head");
        const plate = Math.max(64, ...[...t.querySelectorAll<HTMLElement>(".tp-door__plate")].map((p) => p.offsetHeight));
        const floor = h.querySelector<HTMLElement>(".tp-meet__floor")?.offsetHeight ?? 0;
        const room = stage.clientHeight - (head ? head.offsetTop + head.offsetHeight : 0) - floor - plate - 40;
        const w = Math.max(128, Math.min(256, 0.15 * innerWidth, room / 1.3));
        h.style.setProperty("--door-w", `${w.toFixed(0)}px`);
      } else h?.style.removeProperty("--door-w");
      setTravel(t ? Math.max(0, t.scrollWidth - innerWidth) : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    if (hall.current?.parentElement) ro.observe(hall.current.parentElement);
    addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      removeEventListener("resize", measure);
    };
  }, [reduced]);

  const { scrollYProgress } = useScroll({ target: range, offset: ["start start", "end end"] });
  const eased = useSpring(scrollYProgress, { stiffness: 170, damping: 32, mass: 0.35 });
  const x = useTransform(eased, [0, 1], [0, -travel]);

  useLayoutEffect(() => {
    const t = track.current;
    if (!pinned || !t) return;
    const update = (offset: number, cue: boolean) => {
      hall.current?.style.setProperty("--floor-x", `${offset.toFixed(1)}px`);
      const teddyX = 0.36 * innerWidth;
      for (const li of t.children as HTMLCollectionOf<HTMLElement>) {
        const open = li.offsetLeft + offset < teddyX;
        if ((li.dataset.open === "true") !== open) {
          li.dataset.open = String(open);
          if (open && cue) cuePup({ look: li, secs: 0.9 });
        }
      }
    };
    update(x.get(), false);
    return x.on("change", (v) => update(v, true));
  }, [pinned, x]);

  if (!puppies.length) return null;
  const cta = section.data.ctaHref ?? "/puppies";
  return (
    <Scene tone={tone} aria-labelledby="meet-title" className="tp-meet" data-pinned={pinned || undefined}>
      <div ref={range} data-pin-range style={{ height: pinned ? `calc(100vh + ${Math.round(0.8 * travel)}px)` : undefined, "--pinned": +!!pinned } as CSSProperties}>
        <div className="tp-meet__stage">
          <header className="tp-meet__head gutter">
            <div>
              <h2 id="meet-title" className="font-plush text-huge">
                {section.heading}
              </h2>
              {section.body && <p className="text-lede mt-3 max-w-[44ch] text-[var(--ink-soft)]">{section.body}</p>}
            </div>
            {section.data.ctaLabel && (
              <Link href={cta} className="btn btn-primary shrink-0">
                {section.data.ctaLabel}
              </Link>
            )}
          </header>
          <div ref={hall} className="tp-meet__hall">
            <motion.ol ref={track} style={pinned ? { x } : undefined} className="tp-meet__track" data-treadmill aria-label="Puppies looking for a family">
              {puppies.map((p, i) => (
                <li key={p.id} className="tp-door" data-open={pinned ? "false" : "true"}>
                  <Door pup={p} index={i} sizes="(min-width: 1024px) 15rem, 44vw" />
                </li>
              ))}
              <li className="tp-door tp-door--all" data-open="true">
                <Link href={cta} className="tp-door__link">
                  <span className="tp-door__frame tp-door__frame--all">
                    <span className="font-plush tp-door__all">Meet them all</span>
                  </span>
                </Link>
              </li>
            </motion.ol>
            <div aria-hidden className="tp-meet__floor" />
            <PupStop pose={pinned ? "walk" : "sit"} act={pinned ? "treadmill" : undefined} className="tp-meet__teddy" />
          </div>
        </div>
      </div>
    </Scene>
  );
}
