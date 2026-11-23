"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MediaImage } from "@/components/MediaImage";
import { prefersReducedMotion } from "@/lib/motion";
import type { Puppy } from "@/lib/types";

type Friend = Pick<Puppy, "id" | "slug" | "displayName" | "breed" | "cover">;

/** Seat layout: [x %, width rem, how far they peek up, tilt deg]. Teddy sits in the gap in the middle. */
const SEATS: [number, number, number, number][] = [
  [9, 8.6, 0.62, -5],
  [22.5, 10.4, 0.8, 3],
  [35, 9.2, 0.7, -2],
  [65, 9.4, 0.74, 3],
  [77.5, 10.6, 0.82, -3],
  [91, 8.4, 0.6, 4],
];
/** Pause between swaps (ms), cycled. */
const BEATS = [1900, 2500, 1700, 2300, 2000, 2800, 1800];

const shuffle = <T,>(list: T[]) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const seatStyle = (i: number) => {
  const [x, w, peek, tilt] = SEATS[i];
  return { "--x": `${x}%`, "--w": `${w}rem`, "--peek": peek, "--tilt": `${tilt}deg`, "--i": i } as CSSProperties;
};

/**
 * The row of puppies peeking over the quilt. Every couple of seconds one ducks
 * down and a different puppy pops up in its seat (the next one is pre-loaded
 * off-screen "in the wings" so the swap never shows a blank photo).
 */
export function HeroLineup({ friends }: { friends: Friend[] }) {
  const seats = Math.min(SEATS.length, friends.length);
  const [order, setOrder] = useState(() => friends.slice(0, seats).map((_, i) => i));
  const [states, setStates] = useState<Record<number, "duck" | "pop" | undefined>>({});
  const [tagged, setTagged] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [wings, setWings] = useState<number | null>(friends.length > seats ? seats : null);
  const list = useRef<HTMLUListElement>(null);
  const wingsRef = useRef<HTMLSpanElement>(null);
  const current = useRef(order);
  useEffect(() => {
    current.current = order;
  }, [order]);

  useEffect(() => {
    const ul = list.current;
    if (!ul || !seats || prefersReducedMotion()) return;
    const canSwap = friends.length > seats;
    const scene = ul.closest<HTMLElement>("[data-pup-scene]");
    let visible = true,
      busyUntil = 0,
      alive = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.35 });
    io.observe(ul);
    const busy = () => (busyUntil = performance.now() + 1200);
    addEventListener("scroll", busy, { passive: true });
    addEventListener("pointerdown", busy, { passive: true });
    ul.addEventListener("pointerover", busy, { passive: true });

    const benched = friends.map((_, i) => i).filter((i) => !current.current.includes(i));
    let queue = benched.includes(seats) ? [seats, ...shuffle(benched.filter((i) => i !== seats))] : shuffle(benched);
    let seatOrder: number[] = [],
      lastSeat = -1,
      beat = 0,
      tries = 0;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));

    const next = () => {
      // wait while hidden, off-screen, being interacted with, or while Teddy is elsewhere
      if (document.hidden || !visible || performance.now() <= busyUntil || scene?.dataset.here === "false") return later(next, 900);
      if (!canSwap) return swap();
      if (!queue.length) queue = shuffle(friends.map((_, i) => i).filter((i) => !current.current.includes(i)));
      const img = wingsRef.current?.dataset.for === String(queue[0]) ? wingsRef.current.querySelector("img") : null;
      if (!img || !img.complete || !img.naturalWidth) {
        if (++tries < 15) return later(next, 400);
        queue.push(queue.shift()!); // that photo is slow: skip it for now
        setWings(queue[0] ?? null);
        tries = 0;
        return later(next, 800);
      }
      tries = 0;
      img.decode().then(swap, swap);
    };
    const swap = () => {
      if (!seatOrder.length)
        seatOrder = shuffle([...ul.children].map((el, i) => (el.getClientRects().length ? i : -1)).filter((i) => i >= 0)).filter((s, i, a) => !(i === 0 && s === lastSeat && a.length > 1));
      const seat = seatOrder.shift();
      if (seat === undefined) return later(next, 2000);
      lastSeat = seat;
      const incoming = canSwap ? queue.shift()! : current.current[seat];
      setStates((s) => ({ ...s, [seat]: "duck" }));
      later(() => {
        if (canSwap) {
          const outgoing = current.current[seat];
          setOrder((o) => o.map((f, i) => (i === seat ? incoming : f)));
          queue.push(outgoing);
          setWings(queue[0] ?? null);
        }
        setStates((s) => ({ ...s, [seat]: "pop" }));
        setTagged(seat);
        later(() => setTagged((t) => (t === seat ? null : t)), 1800);
        later(() => setStates((s) => ({ ...s, [seat]: undefined })), 700);
      }, 360);
      later(next, BEATS[beat++ % BEATS.length]);
    };
    if (canSwap) setWings(queue[0] ?? null);
    // start once the entrance "peek" animations have finished
    const peeks = [...ul.querySelectorAll(".tp-lineup__pup")].flatMap((el) => el.getAnimations()).filter((a) => (a as CSSAnimation).animationName === "tp-peek");
    const begin = () => alive && later(next, 250);
    Promise.all(peeks.map((a) => a.finished)).then(begin, begin);
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      timers = [];
      io.disconnect();
      removeEventListener("scroll", busy);
      removeEventListener("pointerdown", busy);
      ul.removeEventListener("pointerover", busy);
    };
  }, [friends, seats]);

  if (!seats) return null;
  const unhover = (i: number) => () => setHovered((h) => (h === i ? null : h));
  return (
    <>
      <ul ref={list} className="tp-lineup" aria-label="Some of the puppies in our showroom">
        {order.map((f, i) => {
          const p = friends[f];
          return (
            <li key={i} className="tp-lineup__seat" style={seatStyle(i)}>
              <Link
                href={`/puppies/${p.slug}`}
                className="tp-lineup__pup"
                data-pup-friend
                data-state={states[i]}
                aria-label={`Meet ${p.displayName}, ${p.breed}`}
                onPointerEnter={() => setHovered(i)}
                onPointerLeave={unhover(i)}
                onFocus={() => setHovered(i)}
                onBlur={unhover(i)}
              >
                <span className="tp-lineup__photo">{p.cover && <MediaImage key={p.id} media={p.cover} sizes="11rem" preload={i < 2} eager />}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <ul aria-hidden className="tp-lineup tp-lineup--tags">
        {order.map((f, i) => (
          <li key={i} className="tp-lineup__seat" style={seatStyle(i)}>
            <span className="tp-lineup__ghost" data-state={states[i]} data-tag={tagged === i || hovered === i ? "show" : undefined}>
              <span className="tp-lineup__name font-scrawl">{friends[f].displayName}</span>
            </span>
          </li>
        ))}
      </ul>
      {wings !== null && friends[wings].cover && (
        <span ref={wingsRef} aria-hidden className="tp-lineup__wings" data-for={wings}>
          <MediaImage media={friends[wings].cover!} sizes="11rem" alt="" eager />
        </span>
      )}
    </>
  );
}
