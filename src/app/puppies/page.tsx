import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PuppyBrowser } from "@/components/puppies/PuppyBrowser";
import { SketchbookHead } from "@/components/puppies/SketchbookHead";
import { CARD_SIZES, SketchCard } from "@/components/puppies/SketchCard";
import { available, goneHome, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Available puppies",
  description: "Teacup and teddy bear puppies available now in Dubai and imported from trusted breeders — every listing shows real photos of the puppy.",
};

export default function PuppiesPage() {
  return (
    <div data-page="pups" className="tp-page">
      <section aria-labelledby="pups-title" className="tp-sketchbook">
        <div className="gutter mx-auto max-w-[110rem] pb-24 pt-10 md:pt-16">
          <SketchbookHead
            kicker="from Teddy's sketchbook"
            title="Available puppies"
            titleId="pups-title"
            lede="Every listing shows real photos of the actual puppy. Open a profile to see them all, then ask us about them on WhatsApp."
          />
          <div className="mt-12">
            {/* filters read the URL, so they render on the client; the plain grid is the server fallback */}
            <Suspense
              fallback={
                <ul className="tp-sketches mt-20">
                  {available.map((p, i) => (
                    <li key={p.id}>
                      <SketchCard pup={p} index={i} sizes={CARD_SIZES} preload={i < 3} />
                    </li>
                  ))}
                </ul>
              }
            >
              <PuppyBrowser puppies={available} breeds={site.breeds} whatsappHref={site.whatsappHref} />
            </Suspense>
          </div>
        </div>
      </section>
      {goneHome.length > 0 && (
        <section aria-labelledby="gone-title" className="tp-gone-strip">
          <div className="gutter mx-auto flex max-w-[110rem] flex-col gap-10 md:flex-row md:items-center">
            <div className="md:w-1/3" data-reveal>
              <h2 id="gone-title" className="font-plush text-big">
                Already gone home
              </h2>
              <p className="mt-3 text-cocoa-soft">These puppies have found their families.</p>
              <Link className="btn btn-primary mt-6" href="/gone-home">
                See the puppies who&apos;ve gone home
              </Link>
            </div>
            <ul className="tp-gone-strip__row" aria-label="Some puppies who have gone home">
              {goneHome.slice(0, 5).map((p, i) => (
                <li key={p.id}>
                  <SketchCard pup={p} index={i} sizes="10rem" small />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
