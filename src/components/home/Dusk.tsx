"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { usePhotoViewer } from "@/components/PhotoViewer";
import { Polaroid } from "@/components/Polaroid";
import { PupStop } from "@/components/pup/PupStop";
import { RevealScope } from "@/components/RevealScope";
import { Scene } from "@/components/scenes/Scene";
import type { Media, Section, Testimonial, Tone } from "@/lib/types";

const SIZES = "(min-width: 1024px) 18vw, (min-width: 640px) 28vw, 42vw";
/** The order photos get pinned up (each one 110ms after the previous). */
const PIN_ORDER = [3, 0, 5, 1, 6, 2, 7, 4];

function Note({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="tp-dusk__note">
      <blockquote className="font-plush-text">“{testimonial.quote}”</blockquote>
      <figcaption className="font-scrawl">
        {testimonial.author}
        {testimonial.location ? `, ${testimonial.location}` : ""}
      </figcaption>
    </figure>
  );
}

/** Dusk: a testimonial on a speech bubble and a shop-front wall of family photos (tap to open the viewer). */
export function Dusk({ section, photos, testimonial, tone }: { section: Section; photos: Media[]; testimonial: Testimonial | null; tone: Tone }) {
  const pinned = photos.slice(0, 8);
  const { open, viewer } = usePhotoViewer(photos, SIZES);
  if (!photos.length) return null;
  return (
    <Scene tone={tone} aria-labelledby="dusk-title" className="tp-dusk">
      <div className="tp-dusk__sky gutter">
        <div className="tp-dusk__head">
          <h2 id="dusk-title" className="font-plush text-huge">
            {section.heading}
          </h2>
          {section.body && <p className="text-lede mt-5 max-w-[50ch] text-[var(--ink-soft)]">{section.body}</p>}
        </div>
        {testimonial && <Note testimonial={testimonial} />}
      </div>
      <div className="tp-photowall">
        <RevealScope className="tp-photowall__wall">
          <ul className="tp-photowall__prints" aria-label="Photos from TeddyPups families">
            {pinned.map((m, i) => (
              <li key={m.id} data-reveal data-pup-look={i === 1 || i === 4 ? "" : undefined} style={{ "--d": `${110 * PIN_ORDER[i]}ms` } as CSSProperties}>
                <button type="button" className="tp-photowall__print" onClick={() => open(i)} aria-label={`Open photo ${i + 1} of ${photos.length}${m.caption ? `: ${m.caption}` : ""}`}>
                  <Polaroid media={m} order={i} sizes={SIZES} />
                </button>
              </li>
            ))}
          </ul>
          <div className="tp-facade__ground">
            <span aria-hidden className="tp-facade__door" />
            <span aria-hidden className="tp-lamp">
              <span className="tp-lamp__light" />
            </span>
            {section.data.ctaLabel && (
              <Link href={section.data.ctaHref ?? "/happy-families"} className="btn btn-primary tp-facade__cta">
                {section.data.ctaLabel}
              </Link>
            )}
            <PupStop pose="sit" className="tp-dusk__teddy" />
          </div>
        </RevealScope>
        <div aria-hidden className="tp-street__pavement" />
      </div>
      {viewer}
    </Scene>
  );
}
