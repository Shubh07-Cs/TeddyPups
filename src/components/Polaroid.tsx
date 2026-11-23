import type { CSSProperties } from "react";
import type { Media } from "@/lib/types";
import { MediaImage } from "./MediaImage";

const TILTS = [-2.2, 1.6, -0.9, 2.4, -1.5, 0.8, -2.6, 1.2];
const TAPE_SPOTS = ["center", "left", "right", "corners", "center", "right", "left", "center"];
const TAPE_COLOURS = ["#f6d79a", "#f9cdbf", "#cfe5f6", "#f6d79a", "#e9dcc4"];

/** A taped-up instant photo; tilt, tape position and tape colour cycle with `order`. */
export function Polaroid({ media, order, sizes, caption, priority = false }: { media: Media; order: number; sizes: string; caption?: string; priority?: boolean }) {
  const spot = TAPE_SPOTS[order % TAPE_SPOTS.length];
  return (
    <span className="tp-polaroid" style={{ "--tilt": `${TILTS[order % TILTS.length]}deg`, "--tape": TAPE_COLOURS[order % TAPE_COLOURS.length], "--i": order } as CSSProperties}>
      {spot === "corners" ? (
        <>
          <span aria-hidden className="tp-tape tp-tape--tl" />
          <span aria-hidden className="tp-tape tp-tape--tr" />
        </>
      ) : (
        <span aria-hidden className={`tp-tape tp-tape--${spot}`} />
      )}
      <span className="tp-polaroid__photo">
        <MediaImage media={media} layout="natural" sizes={sizes} preload={priority} />
      </span>
      <span className="tp-polaroid__caption font-scrawl">{caption ?? media.caption}</span>
    </span>
  );
}
