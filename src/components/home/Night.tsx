import Link from "next/link";
import { PupStop } from "@/components/pup/PupStop";
import { Scene } from "@/components/scenes/Scene";
import { NIGHT_STARS, Stars } from "@/components/Stars";
import { TONES } from "@/lib/site";

/** Night falls: three common questions under the stars, with Teddy wondering along. */
export function Night() {
  return (
    <Scene tone={TONES.night} className="tp-night" aria-labelledby="questions-title">
      <Stars stars={NIGHT_STARS} size={9} className="pointer-events-none tp-night__stars" />
      <div className="tp-night__grid gutter">
        <div className="tp-night__intro">
          <h2 id="questions-title" className="font-plush text-huge">Questions, answered</h2>
          <Link className="btn btn-ghost tp-night__cta" href="/faq">Read all questions</Link>
          <div className="tp-night__pup">
            <span aria-hidden className="tp-night__wonder font-plush">?</span>
            <PupStop pose="sit" act="tilt" className="tp-night__teddy" />
          </div>
        </div>
        <dl className="tp-night__list">
          <div className="tp-qa" data-pup-look>
            <dt className="font-plush tp-qa__q">
              <svg viewBox="0 0 40 40" className="tp-qa__star" aria-hidden>
                <path d="M20 3c1.6 9.4 7.6 15.4 17 17-9.4 1.6-15.4 7.6-17 17-1.6-9.4-7.6-15.4-17-17 9.4-1.6 15.4-7.6 17-17z" fill="currentColor" />
              </svg>
              Are your puppies vaccinated and health-checked?
            </dt>
            <dd className="tp-qa__a">Yes. All our puppies come with a verified health certificate from licensed vets. Every puppy is vaccinated, dewormed, and thoroughly checked before joining your family.</dd>
          </div>
          <div className="tp-qa" data-pup-look>
            <dt className="font-plush tp-qa__q">
              <svg viewBox="0 0 40 40" className="tp-qa__star" aria-hidden>
                <path d="M20 3c1.6 9.4 7.6 15.4 17 17-9.4 1.6-15.4 7.6-17 17-1.6-9.4-7.6-15.4-17-17 9.4-1.6 15.4-7.6 17-17z" fill="currentColor" />
              </svg>
              Can I meet a puppy before I decide?
            </dt>
            <dd className="tp-qa__a">Yes. Come meet our locally available puppies in our Downtown Dubai showroom and spend time bonding before making your decision.</dd>
          </div>
          <div className="tp-qa">
            <dt className="font-plush tp-qa__q">
              <svg viewBox="0 0 40 40" className="tp-qa__star" aria-hidden>
                <path d="M20 3c1.6 9.4 7.6 15.4 17 17-9.4 1.6-15.4 7.6-17 17-1.6-9.4-7.6-15.4-17-17 9.4-1.6 15.4-7.6 17-17z" fill="currentColor" />
              </svg>
              Can I take my puppy home the same day?
            </dt>
            <dd className="tp-qa__a">Local puppies are available immediately, so you can take your puppy home the same day.</dd>
          </div>
        </dl>
      </div>
    </Scene>
  );
}
