import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { HeaderBehavior } from "./HeaderBehavior";
import { MobileMenu } from "./MobileMenu";
import { NAV } from "./nav";
import { NavLink } from "./NavLink";

export function SiteHeader() {
  return (
    <HeaderBehavior>
      <div className="tp-header__bar gutter">
        <Link className="tp-header__brand" aria-label={`${site.business} — home`} href="/">
          <Image src="/brand/logo.png" alt="" width={56} height={56} className="tp-header__logo" preload />
          <span className="font-plush tp-header__name">TeddyPups</span>
        </Link>
        <nav aria-label="Main" className="tp-header__nav">
          <ul>
            {NAV.map((l) => (
              <li key={l.href}>
                <NavLink href={l.href} label={l.label} className="tp-nav-link" />
              </li>
            ))}
          </ul>
        </nav>
        <div className="tp-header__end">
          <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp tp-header__wa">
            WhatsApp us
          </a>
          <MobileMenu whatsappHref={site.whatsappHref} phoneDisplay={site.phoneDisplay} />
        </div>
      </div>
      {/* the stitched, scalloped hem along the bottom edge */}
      <svg aria-hidden className="tp-header__hem" width="100%" height="14" preserveAspectRatio="none">
        <defs>
          <pattern id="tp-hem" width="44" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 0H44V2A22 11 0 0 1 0 2Z" className="tp-header__hem-fill" />
            <path d="M0 2A22 11 0 0 0 44 2" className="tp-header__hem-line" />
          </pattern>
        </defs>
        <rect width="100%" height="14" fill="url(#tp-hem)" />
      </svg>
    </HeaderBehavior>
  );
}
