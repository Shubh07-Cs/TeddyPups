import siteJson from "@/data/site.json";
import puppiesJson from "@/data/puppies.json";
import type { Breed, Faq, Journey, Media, Puppy, Section, Step, Testimonial, Tone } from "./types";

type SiteData = {
  business: string;
  whatsappHref: string;
  phoneDisplay: string;
  phoneHref: string;
  greeting: string;
  breeds: Breed[];
  chatBreeds: Breed[];
  enquirySuccess: { heading: string; body: string };
  home: {
    meet: { section: Section; tone: Tone };
    journey: { section: Section<{ items: Step[]; mediaIds: string[] }>; tone: Tone };
    families: { section: Section; tone: Tone; testimonial: Testimonial; photos: Media[] };
    flight: { photo: string | null; label: string };
  };
  journeys: Journey[];
  memoryWall: Media[];
  faqs: Faq[];
};

export const site = siteJson as unknown as SiteData;
export const puppies = puppiesJson as unknown as Puppy[];

export const available = puppies.filter((p) => p.status === "available");
export const goneHome = puppies.filter((p) => p.status !== "available");

export const getPuppy = (slug: string) => puppies.find((p) => p.slug === slug);

/** Previous / next puppy, wrapping around within the same list (available or gone home). */
export function neighbours(p: Puppy) {
  const list = p.status === "available" ? available : goneHome;
  const i = list.findIndex((x) => x.slug === p.slug);
  return { prev: list[(i - 1 + list.length) % list.length], next: list[(i + 1) % list.length] };
}

/** Sky colours for each homepage scene: the page goes from morning to night as you scroll. */
export const TONES = {
  hero: { top: "#fffdf8", bottom: "#fff1d8", dark: false, sunset: false },
  meet: { top: "#fff1d8", bottom: "#fbe3b4", dark: false, sunset: false },
  paths: { top: "#fbe3b4", bottom: "#f7d18d", dark: false, sunset: false },
  journey: { top: "#f7d18d", bottom: "#f0b866", dark: false, sunset: false },
  passport: { top: "#f0b866", bottom: "#a65a30", dark: false, sunset: true },
  dusk: { top: "#a65a30", bottom: "#4d2b19", dark: true, sunset: false },
  night: { top: "#4d2b19", bottom: "#2f1a10", dark: true, sunset: false },
  home: { top: "#2f1a10", bottom: "#24130b", dark: true, sunset: false },
} satisfies Record<string, Tone>;
