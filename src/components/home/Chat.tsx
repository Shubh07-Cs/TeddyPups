"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MediaImage } from "@/components/MediaImage";
import { cuePup } from "@/components/pup/PupJourney";
import { PupStop } from "@/components/pup/PupStop";
import { Scene } from "@/components/scenes/Scene";
import { useMediaQuery, useReducedMotion } from "@/lib/motion";
import { PAW_PATH } from "@/lib/paw";
import type { Breed, Media, Section, Step, Tone } from "@/lib/types";

function VideoBubble({ media }: { media: Media }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  return (
    <div className="tp-msg tp-msg--them tp-msg--media">
      <div className="tp-clip">
        <video ref={video} src={media.url} poster={media.poster?.url} muted loop playsInline preload="none" aria-label={media.alt || "A puppy video"} onEnded={() => setPlaying(false)} />
        <button
          type="button"
          className="tp-clip__play"
          onClick={() => {
            const v = video.current;
            if (!v) return;
            if (v.paused)
              v.play()
                .then(() => setPlaying(true))
                .catch(() => {});
            else {
              v.pause();
              setPlaying(false);
            }
          }}
          aria-pressed={playing}
          aria-label={playing ? "Pause video" : "Play video"}
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            {playing ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : <path d="M8 5v14l11-7z" />}
          </svg>
        </button>
      </div>
    </div>
  );
}

type Props = { section: Section<{ items: Step[] }>; tone: Tone; business: string; greeting: string; whatsappHref: string; breeds: Breed[] };

/**
 * "Your puppy journey": three steps on the left; on the right a phone where a
 * WhatsApp conversation types itself out as each step scrolls into focus.
 */
export function Chat({ section, tone, business, greeting, whatsappHref, breeds }: Props) {
  const steps = section.data.items ?? [];
  const photos = section.media.filter((m) => m.kind === "image").slice(0, 4);
  const video = section.media.find((m) => m.kind === "video") ?? null;
  const wide = useMediaQuery("(min-width: 1024px)");
  const still = useReducedMotion() || !wide; // no scroll-telling: show the whole chat
  const [step, setStep] = useState(-1);
  const [typing, setTyping] = useState(false);
  const list = useRef<HTMLOListElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const current = still ? steps.length - 1 : step;

  useEffect(() => {
    if (still || !list.current) return;
    const items = [...list.current.children];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setStep(items.indexOf(e.target));
      },
      { rootMargin: "-28% 0px -62% 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [still, steps.length]);

  const last = useRef(-1);
  useEffect(() => {
    if (still) return;
    const forward = step > last.current;
    last.current = step;
    if (!forward || step < 0) return;
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      const group = screen.current?.querySelector(`[data-step="${step}"]`);
      if (group) cuePup({ look: group, secs: 1.4, say: step === 1 ? "ooh, photos!" : step === 2 ? "home soon!" : undefined });
    }, 750);
    return () => clearTimeout(t);
  }, [step, still]);

  return (
    <Scene tone={tone} aria-labelledby="journey-title" className="tp-chat">
      <div className="tp-chat__grid gutter" data-pin-range>
        <div className="tp-chat__story">
          <h2 id="journey-title" className="font-plush text-huge">
            {section.heading}
          </h2>
          {section.body && <p className="text-lede mt-5 max-w-[42ch] text-[var(--ink-soft)]">{section.body}</p>}
          <ol ref={list} className="tp-chat__steps">
            {steps.map((s, i) => (
              <li key={s.title} className="tp-chat__step" data-active={i === current || undefined} data-done={i < current || undefined}>
                <span className="tp-chat__num font-plush" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="font-plush tp-chat__title">{s.title}</h3>
                <p className="tp-chat__text">{s.text}</p>
              </li>
            ))}
          </ol>
          {section.data.ctaLabel && (
            <Link href={section.data.ctaHref ?? "/how-it-works"} className="btn btn-ghost tp-chat__cta">
              {section.data.ctaLabel}
            </Link>
          )}
        </div>
        <div className="tp-chat__side">
          <div className="tp-phone" aria-label={`A WhatsApp conversation with ${business}`} role="group">
            <div className="tp-phone__bar">
              <Image src="/brand/logo.png" alt="" width={40} height={40} className="tp-phone__avatar" />
              <span>
                <span className="tp-phone__name">{business}</span>
                <span className="tp-phone__status">{typing ? "typing…" : "online"}</span>
              </span>
            </div>
            <div ref={screen} className="tp-phone__screen">
              <p className="tp-msg tp-msg--me">{greeting}</p>
              {steps.map((s, i) => (
                <div key={s.title} className="tp-msg-group" data-step={i} data-show={i < current || (i === current && !typing) ? "true" : "false"}>
                  {i === 0 && breeds.length > 0 && (
                    <div className="tp-msg tp-msg--them">
                      <p>{s.text}</p>
                      <ul className="tp-chips" aria-label="Breeds we have now">
                        {breeds.slice(0, 6).map((b) => (
                          <li key={b.slug}>
                            <Link href={`/puppies?breed=${b.slug}`}>{b.name}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {i === 1 && (
                    <>
                      {photos.length > 0 && (
                        <div className="tp-msg tp-msg--them tp-msg--media">
                          <div className="tp-snaps">
                            {photos.map((m) => (
                              <span key={m.id} className="tp-snaps__one">
                                <MediaImage media={m} sizes="9rem" />
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {video && <VideoBubble media={video} />}
                      <p className="tp-msg tp-msg--them">{s.text}</p>
                    </>
                  )}
                  {i === 2 && (
                    <div className="tp-msg tp-msg--them">
                      <p>{s.text}</p>
                      <svg viewBox="0 0 220 70" className="tp-route" aria-hidden>
                        <path d="M14 52 C 60 6, 120 70, 170 28" className="tp-route__line" />
                        <circle cx="14" cy="52" r="5" className="tp-route__dot" />
                        <path d="M164 32 l12 -12 l12 12 v14 h-24 z" className="tp-route__home" />
                        <path d="M176 42 c-2-3-7-2-6 2c1 3 6 5 6 5s5-2 6-5c1-4-4-5-6-2z" className="tp-route__heart" />
                        <path d={PAW_PATH} transform="translate(70 22) scale(.3) rotate(70 32 32)" className="tp-route__paw" />
                        <path d={PAW_PATH} transform="translate(104 38) scale(.3) rotate(100 32 32)" className="tp-route__paw" />
                      </svg>
                    </div>
                  )}
                  {i > 2 && <p className="tp-msg tp-msg--them">{s.text}</p>}
                  {i === 0 && breeds.length === 0 && <p className="tp-msg tp-msg--them">{s.text}</p>}
                </div>
              ))}
              <p className="tp-typing" data-show={typing ? "true" : "false"} aria-hidden>
                <span />
                <span />
                <span />
              </p>
            </div>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="tp-phone__compose">
              <span>Say hello on WhatsApp</span>
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M3 20l18-8L3 4v6l12 2-12 2z" />
              </svg>
            </a>
          </div>
          <PupStop pose="sit" className="tp-chat__teddy" />
        </div>
      </div>
    </Scene>
  );
}
