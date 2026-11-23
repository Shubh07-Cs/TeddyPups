import { Chat } from "@/components/home/Chat";
import { Dusk } from "@/components/home/Dusk";
import { Hero } from "@/components/home/Hero";
import { HomeCta } from "@/components/home/HomeCta";
import { Meet } from "@/components/home/Meet";
import { Night } from "@/components/home/Night";
import { Passport } from "@/components/home/Passport";
import { Paths } from "@/components/home/Paths";
import { PupJourney } from "@/components/pup/PupJourney";
import { available, site } from "@/lib/site";

/** Each scene sits in its own wrapper div, matching the original page structure (the walker measures them). */
const storeJsonLd = {
  "@context": "https://schema.org",
  "@type": "PetStore",
  name: site.business,
  description: "TeddyPups U.A.E. is a Dubai-based brand specializing in miniature puppies, offering premium services and worldwide shipping.",
  logo: "/brand/logo.png",
  telephone: site.phoneDisplay,
  email: "info@instabizweb.com",
  address: { "@type": "PostalAddress", streetAddress: "Downtown Dubai, United Arab Emirates", addressLocality: "Dubai", addressCountry: "AE" },
};

export default function HomePage() {
  const { meet, journey, families } = site.home;
  return (
    <>
    <div className="tp-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }} />
      <div data-section="hero">
        <Hero />
      </div>
      <div data-section="meet">
        <Meet section={meet.section} tone={meet.tone} puppies={available} />
      </div>
      <div data-section="paths">
        <Paths />
      </div>
      <div data-section="journey">
        <Chat section={journey.section} tone={journey.tone} business={site.business} greeting={site.greeting} whatsappHref={site.whatsappHref} breeds={site.chatBreeds} />
      </div>
      <div data-section="trust">
        <Passport />
      </div>
      <div data-section="families">
        <Dusk section={families.section} tone={families.tone} photos={families.photos} testimonial={families.testimonial} />
      </div>
      <div data-section="questions">
        <Night />
      </div>
      <div data-section="cta">
        <HomeCta />
      </div>
    </div>
    <PupJourney />
    </>
  );
}
