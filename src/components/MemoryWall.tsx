"use client";

import type { CSSProperties } from "react";
import type { Media } from "@/lib/types";
import { PawIcon } from "./PawIcon";
import { usePhotoViewer } from "./PhotoViewer";
import { Polaroid } from "./Polaroid";
import { RevealScope } from "./RevealScope";

const SIZES = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw";

/** Masonry wall of taped-up family photos; each one opens the full-screen viewer. */
export function MemoryWall({ photos }: { photos: Media[] }) {
  const { open, viewer } = usePhotoViewer(photos, SIZES);
  return (
    <>
      <RevealScope>
        <ul className="tp-wall" aria-label="Photos from TeddyPups families">
          {photos.map((m, i) => (
            <li key={m.id} className="tp-wall__item" data-reveal style={{ "--d": `${(i % 4) * 60}ms` } as CSSProperties}>
              <button type="button" className="tp-wall__print" onClick={() => open(i)} aria-label={`Open photo ${i + 1} of ${photos.length}${m.caption ? `: ${m.caption}` : ""}`}>
                <Polaroid media={m} order={i} sizes={SIZES} priority={i < 2} />
                <PawIcon className="tp-wall__paw" />
              </button>
            </li>
          ))}
        </ul>
      </RevealScope>
      {viewer}
    </>
  );
}
