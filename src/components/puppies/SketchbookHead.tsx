import type { ReactNode } from "react";
import { PupBuddy } from "@/components/pup/PupBuddy";

/** Page heading styled as a page from Teddy's sketchbook, with his "self-portrait". */
export function SketchbookHead({ kicker, title, titleId, lede }: { kicker: string; title: string; titleId: string; lede: ReactNode }) {
  return (
    <div className="tp-sketchbook__head">
      <div className="tp-sketchbook__words">
        <p className="font-scrawl text-lg text-toffee-ink" data-reveal>
          {kicker}
        </p>
        <h1 id={titleId} className="font-plush text-giant tp-sketchbook__title" data-reveal>
          {title}
          <svg aria-hidden viewBox="0 0 400 24" preserveAspectRatio="none" className="tp-sketchbook__underline">
            <path d="M4 15c40-9 70 5 112-2s70-9 112 0 74 8 116-1 38-4 52 1" pathLength={1} />
          </svg>
        </h1>
        <p className="tp-sketchbook__lede text-lede mt-6 max-w-[46ch] text-cocoa-soft" data-reveal>
          {lede}
        </p>
      </div>
      <div className="tp-sketchbook__self" data-reveal>
        <PupBuddy pose="sit" facing="left" label="Teddy, the TeddyPups puppy" />
        <span className="font-scrawl tp-sketchbook__caption">self-portrait</span>
      </div>
    </div>
  );
}
