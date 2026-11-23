"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Media } from "@/lib/types";
import { MediaImage } from "./MediaImage";

/** Pixel width the photo will actually occupy in the full-screen viewer. */
const fitWidth = (m: Media) => Math.ceil(Math.min(innerWidth, Math.max(1, innerHeight - 150) * (m.width / m.height)));

/** Show the already-loaded page-size image instantly, then cross-fade to a sharp full-size one. */
export function SharpPhoto({ media, pageSizes, quality = 75 }: { media: Media; pageSizes: string; quality?: number }) {
  const [sharp, setSharp] = useState(false);
  return (
    <>
      <MediaImage
        media={media}
        sizes={pageSizes}
        quality={quality}
        alt=""
        eager
        className={sharp ? "tp-viewer__first tp-viewer__first--done" : "tp-viewer__first"}
        style={{ objectFit: "contain", objectPosition: "50% 50%", backgroundColor: "transparent" }}
      />
      <Image
        src={media.url}
        alt={media.alt}
        fill
        sizes={`${fitWidth(media)}px`}
        quality={quality}
        loading="eager"
        className="tp-viewer__sharp object-contain"
        data-sharp={sharp || undefined}
        onLoad={(e) => {
          e.currentTarget
            .decode()
            .catch(() => {})
            .then(() => setSharp(true));
        }}
      />
    </>
  );
}

/** Warm the browser cache with the previous and next photos. */
export function PrefetchNeighbours({ photos, at, quality = 75 }: { photos: Media[]; at: number; quality?: number }) {
  const n = photos.length;
  if (n < 2) return null;
  const around = [...new Set([(at - 1 + n) % n, (at + 1) % n])].filter((i) => photos[i].kind === "image");
  return (
    <span aria-hidden className="sr-only">
      {around.map((i) => (
        <Image key={photos[i].id} src={photos[i].url} alt="" fill sizes={`${fitWidth(photos[i])}px`} quality={quality} loading="eager" />
      ))}
    </span>
  );
}

const slide: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: 70 * dir, rotate: 5 * dir, scale: 0.92 }),
  center: { opacity: 1, x: 0, rotate: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 26 } },
  exit: (dir: number) => ({ opacity: 0, x: -70 * dir, rotate: -5 * dir, scale: 0.92, transition: { duration: 0.22 } }),
};

/** Full-screen photo viewer (native <dialog>): arrow keys, buttons or swipe to move between photos. */
export function usePhotoViewer(photos: Media[], pageSizes: string) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [at, setAt] = useState<number | null>(null);
  const [dir, setDir] = useState(1);
  const n = photos.length;
  const wrap = useCallback((i: number) => ((i % n) + n) % n, [n]);
  const go = useCallback(
    (i: number, d: number) => {
      setDir(d);
      setAt(wrap(i));
    },
    [wrap],
  );
  useEffect(() => {
    if (at === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(at + 1, 1);
      if (e.key === "ArrowLeft") go(at - 1, -1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [at, go]);
  const photo = at === null ? null : photos[at];

  const viewer = (
    <dialog
      ref={dialog}
      aria-label="Photo viewer"
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-cocoa/95 p-0 text-milk backdrop:bg-cocoa/70"
      onClose={() => setAt(null)}
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      data-lenis-prevent
    >
      {photo && at !== null && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="font-scrawl text-lg">
              {at + 1} / {n}
              {photo.caption ? ` — ${photo.caption}` : ""}
            </p>
            <button type="button" onClick={() => dialog.current?.close()} className="h-11 rounded-full bg-milk px-5 font-semibold text-cocoa">
              Close
            </button>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence initial={false} custom={dir}>
              <motion.div
                key={photo.id}
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 touch-pan-y"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) go(at + 1, 1);
                  else if (info.offset.x > 80) go(at - 1, -1);
                }}
              >
                <SharpPhoto media={photo} pageSizes={pageSizes} />
              </motion.div>
            </AnimatePresence>
            <PrefetchNeighbours photos={photos} at={at} />
          </div>
          <div className="flex justify-center gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            <button type="button" onClick={() => go(at - 1, -1)} className="h-12 rounded-full border-2 border-milk px-6 font-semibold">
              Previous
            </button>
            <button type="button" onClick={() => go(at + 1, 1)} className="h-12 rounded-full bg-honey px-6 font-semibold text-cocoa">
              Next
            </button>
          </div>
        </div>
      )}
    </dialog>
  );

  return {
    open: (i: number) => {
      setDir(1);
      setAt(i);
      dialog.current?.showModal();
    },
    viewer,
  };
}
