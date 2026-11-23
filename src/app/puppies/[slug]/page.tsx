import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { MediaImage } from "@/components/MediaImage";
import { PawIcon } from "@/components/PawIcon";
import { PupBuddy } from "@/components/pup/PupBuddy";
import { PuppyGallery } from "@/components/puppy/PuppyGallery";
import { StoryRibbon } from "@/components/puppy/StoryRibbon";
import { RevealScope } from "@/components/RevealScope";
import { getPuppy, neighbours, puppies, site } from "@/lib/site";
import type { Puppy } from "@/lib/types";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return puppies.map((p) => ({ slug: p.slug }));
}

const isHome = (p: Puppy) => p.status !== "available";
const whereLabel = (p: Puppy) => (p.origin.slug === "local" ? "In Dubai" : "Imported for you");

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = getPuppy((await params).slug);
  if (!p) return {};
  const hasVideo = p.media.some((m) => m.kind === "video");
  const title = p.name ? `${p.displayName}, ${p.breed} puppy` : `${p.displayName} puppy (${p.genderLabel.toLowerCase()})`;
  const who = p.name ? p.displayName : `this ${p.displayName}`;
  const description = `Meet ${who}: ${p.breed}, ${p.genderLabel.toLowerCase()}, ${p.age} old, ${p.origin.slug === "local" ? "in Dubai" : "imported"}. Real photos${hasVideo ? " and video" : ""} from ${site.business}.`;
  const image = p.cover?.url;
  return { title, description, openGraph: { title, description, images: image ? [image] : undefined }, twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined } };
}

const PROMISES = ["Vaccinated", "Dewormed", "Verified health certificate from licensed vets", "Thoroughly checked before joining your family"];
const WAY_HOME = {
  imported: {
    heading: "Coming home from abroad",
    steps: [
      { title: "Reserve your puppy", text: "Tell us which puppy has captured your heart." },
      { title: "Personalized consultation", text: "We finalize details with you and share updates on your puppy's journey." },
      { title: "Import and arrival", text: "We manage health checks, travel arrangements, and documentation." },
      { title: "Welcome home", text: "We help your new puppy settle in and ensure a smooth transition into your home." },
    ],
  },
  local: {
    heading: "Coming home from our showroom",
    steps: [
      { title: "Choose your puppy", text: "Open their profile or message us with any questions." },
      { title: "Meet before you choose", text: "Spend time bonding in our Downtown Dubai showroom." },
      { title: "Pick-up or delivery", text: "Take your puppy home the same day, or we deliver within Dubai." },
      { title: "Welcome home", text: "We're here for anything you need as your puppy settles in." },
    ],
  },
};

function Chapter({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="tp-chapter">
      <span aria-hidden className="tp-chapter__n font-plush">
        {n}
      </span>
      <span className="font-scrawl">{children}</span>
    </p>
  );
}

/** A puppy's own little storybook: gallery, name tag, what's included, the way home, an enquiry letter. */
export default async function PuppyPage({ params }: { params: Params }) {
  const p = getPuppy((await params).slug);
  if (!p) notFound();
  const home = isHome(p);
  const { prev, next } = neighbours(p);
  const label = p.name ? `${p.displayName} (${p.breed})` : p.displayName;
  const way = WAY_HOME[p.origin.slug];
  let chapter = 0;
  const fields: [string, string][] = [
    ["Breed", p.breed],
    ["Boy or girl", p.genderLabel],
    ["Age", p.age],
    ...(p.colour ? [["Colour", p.colour] as [string, string]] : []),
    ["Where", whereLabel(p)],
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Puppies", item: "/puppies" },
      { "@type": "ListItem", position: 2, name: p.displayName, item: `/puppies/${p.slug}` },
    ],
  };

  return (
    <div data-page="pup" className="tp-page">
      <article className="tp-storybook" style={{ background: `linear-gradient(180deg, color-mix(in oklab, ${p.cover?.color ?? "#fbe3b4"} 24%, var(--color-milk)) 0, var(--color-milk) 85%)` }}>
        <StoryRibbon />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <RevealScope className="gutter mx-auto max-w-[110rem] pb-20 pt-8 md:pt-12">
          <nav aria-label="Breadcrumb" className="text-[0.95rem] font-semibold text-cocoa-soft">
            <Link className="link-ink" href={home ? "/gone-home" : "/puppies"}>
              {home ? "Gone home" : "Available puppies"}
            </Link>
            <span aria-hidden>{" / "}</span>
            <span aria-current="page">{p.displayName}</span>
          </nav>
          <Chapter n={++chapter}>{home ? "the day they went home" : "hello, it's me"}</Chapter>
          <div className="mt-4 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="min-w-0 lg:col-span-7">
              <PuppyGallery name={p.displayName} media={p.media} />
            </div>
            <div className="min-w-0 lg:col-span-5">
              <div className="lg:sticky lg:top-[calc(var(--header-h)+5.5rem)]">
                <div className="tp-tag tp-board mt-16 !rounded-[2.2rem_2.2rem_2.2rem_0.6rem] !p-7 md:!p-9 lg:mt-20" data-reveal>
                  <span aria-hidden className="tp-tag__ring" />
                  <PupBuddy pose="peek" className="absolute -top-[4.8rem] right-6 w-[9.5rem]" label={`Teddy, peeking over ${p.displayName}'s tag`} />
                  {home ? (
                    <span className="inline-grid place-items-center rounded-full border-[3px] border-current px-3 py-1 font-scrawl text-sm uppercase tracking-wide -rotate-6 text-toffee-deep">Gone home ♥</span>
                  ) : (
                    <span className="chip">
                      <PawIcon className="size-4 text-toffee" />
                      Available
                    </span>
                  )}
                  <h1 className="font-plush mt-4 text-[clamp(2.6rem,5vw,4.6rem)]">{p.displayName}</h1>
                  {p.name && <p className="mt-2 text-lg font-semibold text-cocoa-soft">{p.breed}</p>}
                  <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4">
                    {fields.map(([k, v]) => (
                      <div key={k}>
                        <dt className="font-scrawl text-sm text-cocoa-soft">{k}</dt>
                        <dd className="mt-0.5 text-[1.05rem] font-semibold">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {p.description && <p className="mt-6 whitespace-pre-line text-cocoa-soft">{p.description}</p>}
                  <div className="mt-8 flex flex-col gap-3">
                    <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                      {home ? "Ask about a puppy like this" : p.name ? `Ask about ${p.displayName} on WhatsApp` : "Ask about this puppy on WhatsApp"}
                    </a>
                    <a href={`#enquire-${p.slug}`} className="btn btn-ghost">
                      Send an enquiry
                    </a>
                  </div>
                </div>
                <div className="tp-paper mt-8 -rotate-1">
                  <Chapter n={++chapter}>what comes with {p.name ? p.displayName : `this ${p.displayName}`}</Chapter>
                  <h2 className="font-plush mt-1 text-[1.9rem]">Every Teddy Pup comes</h2>
                  <ul className="mt-4 space-y-2.5">
                    {PROMISES.map((t) => (
                      <li key={t} className="flex items-start gap-3 font-semibold">
                        <svg viewBox="0 0 32 32" className="mt-0.5 size-6 shrink-0 text-toffee-deep" aria-hidden>
                          <path d="M5 17l7 7L27 8" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          {!home && (
            <section aria-labelledby={`home-steps-${p.slug}`} className="mt-20">
              <Chapter n={++chapter}>the way home</Chapter>
              <h2 id={`home-steps-${p.slug}`} className="font-plush text-big mt-3">
                {way.heading}
              </h2>
              <ol className="tp-trail tp-trail--row tp-trail--paws mt-10">
                {way.steps.map((s, i) => (
                  <li key={s.title}>
                    <span aria-hidden className="tp-trail__num font-plush">
                      {i + 1}
                    </span>
                    <h3 className="font-plush-text text-xl font-bold leading-tight">{s.title}</h3>
                    <p className="mt-2 max-w-[38ch] text-cocoa-soft">{s.text}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <section id={`enquire-${p.slug}`} aria-labelledby={`enquire-title-${p.slug}`} className="tp-letter mt-20 grid gap-10 lg:grid-cols-12">
            <span aria-hidden className="tp-letter__stamp">
              <PawIcon className="size-9" />
            </span>
            <div className="lg:col-span-4">
              <Chapter n={++chapter}>dear TeddyPups…</Chapter>
              <h2 id={`enquire-title-${p.slug}`} className="font-plush text-big mt-2">
                {home ? "Looking for a puppy like this?" : p.name ? `Ask about ${p.displayName}` : "Ask about this puppy"}
              </h2>
              <p className="mt-4 text-cocoa-soft">Leave your details and our team will get back to you promptly — or message us on WhatsApp for the quickest reply.</p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <EnquiryForm puppy={{ id: p.id, label }} success={site.enquirySuccess} whatsappHref={site.whatsappHref} />
            </div>
          </section>
          <nav aria-label="More puppies" className="mt-16 grid gap-4 sm:grid-cols-2">
            {[
              ["Previous pup", prev],
              ["Next pup", next],
            ].map(([kicker, q]) => {
              const pup = q as Puppy;
              return (
                <Link
                  key={kicker as string}
                  className="group flex items-center gap-5 rounded-[2rem] border-[3px] border-cocoa bg-milk p-4 transition-transform duration-500 hover:-rotate-1 sm:last:flex-row-reverse sm:last:text-right"
                  href={`/puppies/${pup.slug}`}
                >
                  <span className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[999px_999px_0.6rem_0.6rem] border-[3px] border-cocoa bg-honey-soft">{pup.cover && <MediaImage media={pup.cover} sizes="80px" />}</span>
                  <span>
                    <span className="font-scrawl block text-sm text-cocoa-soft">{kicker as string}</span>
                    <span className="font-plush text-[1.6rem]">{pup.displayName}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </RevealScope>
      </article>
    </div>
  );
}
