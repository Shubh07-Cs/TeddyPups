import type { CSSProperties } from "react";
import { PupStop } from "@/components/pup/PupStop";
import { Scene } from "@/components/scenes/Scene";
import { TONES } from "@/lib/site";

/** "Why families trust TeddyPups", laid out as an open puppy passport with ink stamps. */
export function Passport() {
  return (
    <Scene tone={TONES.passport} className="tp-passport" aria-labelledby="trust-title">
      <div className="gutter mx-auto max-w-[96rem]">
        <div className="tp-book">
          <div className="tp-book__page tp-book__page--left">
            <p aria-hidden className="tp-book__kicker font-scrawl">puppy passport</p>
            <h2 id="trust-title" className="font-plush tp-book__title">Why families trust TeddyPups</h2>
            <PupStop pose="sit" className="tp-book__teddy" />
          </div>
          <ul className="tp-book__page tp-book__page--right">
            <li className="tp-entry" style={{ "--ink-stamp": "#a24a1a", "--tilt": "-8deg", "--i": 0 } as CSSProperties}>
              <span className="tp-stamp tp-stamp--round">
                <svg viewBox="0 0 64 64" className="tp-stamp__icon" aria-hidden>
                  <path d="M32 54C16 43 8 34 8 24c0-7 5.4-12 12-12 5 0 9 3 12 7 3-4 7-7 12-7 6.6 0 12 5 12 12 0 10-8 19-24 30z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 30h7l3-7 4 13 3-6h7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="tp-stamp__title font-plush">Vet-checked & healthy</span>
              </span>
              <p className="tp-entry__text">Every puppy comes vaccinated, dewormed, and with a verified health certificate.</p>
            </li>
            <li className="tp-entry" style={{ "--ink-stamp": "#1f6b45", "--tilt": "5deg", "--i": 1 } as CSSProperties}>
              <span className="tp-stamp tp-stamp--ticket">
                <svg viewBox="0 0 64 64" className="tp-stamp__icon" aria-hidden>
                  <path d="M6 36l22-3 12-17h6l-6 17 12-1 6-7h3l-2 10 2 10h-3l-6-7-12-1 6 17h-6L28 37 6 36z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 50c10 4 20 4 30 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 7" />
                </svg>
                <span className="tp-stamp__title font-plush">Korea to Dubai, safely</span>
              </span>
              <p className="tp-entry__text">Trusted breeders, safe travel, and premium care from start to finish.</p>
            </li>
            <li className="tp-entry" style={{ "--ink-stamp": "#5a3a28", "--tilt": "-4deg", "--i": 2 } as CSSProperties}>
              <span className="tp-stamp tp-stamp--oval">
                <svg viewBox="0 0 64 64" className="tp-stamp__icon" aria-hidden>
                  <path d="M10 14h44v28H30l-12 10v-10h-8z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 28h0M32 28h0M42 28h0" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="tp-stamp__title font-plush">Support 24/7</span>
              </span>
              <p className="tp-entry__text">Always here to help, from choosing your puppy to post-delivery support.</p>
            </li>
            <li className="tp-entry" style={{ "--ink-stamp": "#c2622b", "--tilt": "7deg", "--i": 3 } as CSSProperties}>
              <span className="tp-stamp tp-stamp--scallop">
                <svg viewBox="0 0 64 64" className="tp-stamp__icon" aria-hidden>
                  <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 32h44M32 10c-8 8-8 36 0 44M32 10c8 8 8 36 0 44" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="tp-stamp__title font-plush">Trusted by families worldwide</span>
              </span>
              <p className="tp-entry__text">Puppies delivered to loving homes all around the world.</p>
            </li>
          </ul>
        </div>
      </div>
    </Scene>
  );
}
