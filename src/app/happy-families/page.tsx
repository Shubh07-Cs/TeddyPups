import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { MemoryWall } from "@/components/MemoryWall";
import { PupBuddy } from "@/components/pup/PupBuddy";
import { RevealScope } from "@/components/RevealScope";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Happy families",
  description: "Real photos shared by TeddyPups families after welcoming their new puppy home.",
};

export default function HappyFamiliesPage() {
  const photos = site.memoryWall;
  const t = site.home.families.testimonial;
  return (
    <div data-page="families" className="tp-page">
      <section aria-labelledby="families-title" className="tp-memories">
        <div className="gutter mx-auto max-w-[110rem] pb-24 pt-10 md:pt-16">
          <RevealScope className="tp-memories__head">
            <div>
              <p className="font-scrawl text-lg text-toffee-ink" data-reveal>
                our wall of happy endings
              </p>
              <h1 id="families-title" className="font-plush text-giant tp-memories__title" data-reveal>
                Happy families
                <svg viewBox="0 0 48 44" className="tp-memories__heart" aria-hidden>
                  <path d="M24 40C10 30 4 22 4 14.5 4 8.7 8.6 4 14.3 4c4.1 0 7.6 2.4 9.7 6 2.1-3.6 5.6-6 9.7-6C39.4 4 44 8.7 44 14.5 44 22 38 30 24 40z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </h1>
              <p className="text-lede mt-6 max-w-[50ch] text-cocoa-soft" data-reveal>
                Nothing makes us happier than seeing our puppies in loving homes! Here are some beautiful moments shared by our amazing clients after welcoming their furry friends.
              </p>
              <p className="font-scrawl mt-5 text-lg text-toffee-ink" data-reveal>
                {photos.length} moments and counting
              </p>
            </div>
            {t && (
              <figure className="tp-memories__note" data-reveal>
                <span aria-hidden className="tp-tape tp-tape--center" style={{ "--tape": "#cfe5f6" } as CSSProperties} />
                <blockquote className="font-plush-text">“{t.quote}”</blockquote>
                <figcaption className="font-scrawl">
                  {t.author}
                  {t.location ? `, ${t.location}` : ""}
                </figcaption>
              </figure>
            )}
          </RevealScope>
          <div className="mt-16 md:mt-20">
            <MemoryWall photos={photos} />
          </div>
          <div className="tp-memories__foot">
            <PupBuddy pose="sit" facing="left" className="w-36 md:w-44" label="Teddy, admiring the wall" />
            <p className="font-scrawl text-lg text-cocoa-soft">every one of them was a Teddy Pup once</p>
          </div>
        </div>
      </section>
    </div>
  );
}
