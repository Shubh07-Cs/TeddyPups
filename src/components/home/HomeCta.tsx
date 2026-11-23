import Link from "next/link";
import { MediaImage } from "@/components/MediaImage";
import { PupStop } from "@/components/pup/PupStop";
import { Scene } from "@/components/scenes/Scene";
import { available, site, TONES } from "@/lib/site";

/** The last scene: a little house, a puppy waiting behind the door, and the final call to action. */
export function HomeCta() {
  const max = available[0];
  return (
    <Scene tone={TONES.home} className="tp-home" aria-labelledby="cta-title">
      <div className="tp-home__copy gutter">
        <h2 id="cta-title" className="font-plush text-huge">Ready to meet your new best friend?</h2>
        <p className="tp-home__lede">Bring home a healthy, happy teacup or designer puppy with expert guidance every step of the way. We help you find the right match and ensure a smooth, safe delivery across the UAE.</p>
      </div>
      <div className="tp-house">
        <span aria-hidden className="tp-house__plant tp-house__plant--left" />
        <span aria-hidden className="tp-house__lamp" />
        <div className="tp-house__doorway">
          <span className="tp-house__inside">
            <MediaImage media={max.cover!} alt={`${max.displayName}, waiting inside`} sizes="16rem" />
          </span>
          <span aria-hidden className="tp-house__door">
            <span className="tp-house__peep" />
            <span className="tp-house__knob" />
          </span>
        </div>
        <span aria-hidden className="tp-house__plant tp-house__plant--right" />
        <span aria-hidden className="tp-house__mat font-scrawl">welcome home</span>
        <PupStop pose="bow" className="tp-house__teddy" />
      </div>
      <div className="tp-home__actions gutter">
        <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">Enquire on WhatsApp</a>
        <Link className="btn btn-ghost tp-home__ghost" href="/contact">Visit & contact</Link>
      </div>
    </Scene>
  );
}
