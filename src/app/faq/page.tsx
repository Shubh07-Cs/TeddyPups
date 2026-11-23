import type { Metadata } from "next";
import { NoticeBoard } from "@/components/NoticeBoard";
import { Scene } from "@/components/scenes/Scene";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Questions & answers",
  description: "Answers about TeddyPups puppies: health checks and vaccinations, meeting local puppies, imported teacup breeds and delivery.",
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: site.faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
  return (
    <div data-page="faq" className="tp-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Scene tone={{ top: "#a95e32", bottom: "#331c11", dark: true, sunset: false }} className="tp-faqroom overflow-hidden" aria-labelledby="faq-title">
        <div className="gutter relative mx-auto max-w-[110rem] pb-24 pt-10 md:pt-16">
          <header className="max-w-4xl">
            <h1 id="faq-title" className="font-plush text-giant">
              Questions &amp; answers
            </h1>
            <p className="text-lede mt-6 max-w-[52ch] text-[var(--ink-soft)]">Can&apos;t find what you&apos;re looking for? Message us on WhatsApp — our team is available 24/7.</p>
          </header>
          <div className="mt-12 md:mt-16">
            <NoticeBoard faqs={site.faqs} askHref={site.whatsappHref} />
          </div>
        </div>
      </Scene>
    </div>
  );
}
