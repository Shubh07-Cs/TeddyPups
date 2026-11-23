export type Media = {
  id: string;
  url: string;
  kind: "image" | "video";
  width: number;
  height: number;
  alt: string;
  caption?: string;
  focalX: number;
  focalY: number;
  color: string;
  blurDataUrl: string | null;
  durationS: number | null;
  poster: Media | null;
};

export type Breed = { slug: string; name: string; n?: number };

export type PuppyStatus = "available" | "reserved" | "rehomed" | "gone-home";

export type Puppy = {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  breed: string;
  breeds: Breed[];
  gender: "male" | "female" | "mixed";
  genderLabel: string;
  age: string;
  colour: string;
  description: string;
  status: PuppyStatus;
  origin: { slug: "local" | "imported"; name: string };
  cover: Media | null;
  media: Media[];
  collections: { slug: string; name: string }[];
};

export type Tone = { top: string; bottom: string; dark: boolean; sunset: boolean };

export type Section<D = Record<string, unknown>> = {
  key: string;
  heading: string;
  body: string;
  data: D & { ctaHref?: string; ctaLabel?: string };
  media: Media[];
};

export type Testimonial = { id: string; quote: string; author: string; location: string; media: Media | null };

export type Step = { title: string; text: string };

export type Journey = { key: "local" | "imported"; label: string; hint: string; heading: string; body: string; note?: string; steps: Step[] };

export type Faq = { id: string; question: string; answer: string };
