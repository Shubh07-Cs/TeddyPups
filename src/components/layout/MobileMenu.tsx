"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { PawIcon } from "../PawIcon";
import { NavLink } from "./NavLink";
import { NAV } from "./nav";

const linkClass = "tp-menu-link font-plush block py-2 text-[clamp(2.4rem,11vw,3.4rem)]";

/** Full-screen honey-coloured menu (a native <dialog>) with an animated close. */
export function MobileMenu({ whatsappHref, phoneDisplay }: { whatsappHref: string; phoneDisplay: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => {
    const d = dialog.current;
    if (!d?.open || d.dataset.closing) return;
    if (prefersReducedMotion()) return d.close();
    d.dataset.closing = "true";
    const done = () => {
      clearTimeout(fallback);
      d.removeEventListener("animationend", onEnd);
      if (d.dataset.closing) d.close();
    };
    const onEnd = (e: AnimationEvent) => e.target === d && done();
    const fallback = setTimeout(done, 600);
    d.addEventListener("animationend", onEnd);
  };
  useEffect(() => {
    const shut = () => dialog.current?.close();
    addEventListener("tp:navigate", shut);
    return () => removeEventListener("tp:navigate", shut);
  }, []);
  return (
    <>
      <button type="button" className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-cocoa bg-milk px-4 text-[0.95rem] font-semibold lg:hidden" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
        <PawIcon className="size-4" />
        Menu
      </button>
      <dialog
        ref={dialog}
        aria-label="Site menu"
        className="tp-menu m-0 h-dvh max-h-none w-screen max-w-none bg-honey p-0 text-cocoa backdrop:bg-cocoa/40"
        onClick={(e) => e.target === dialog.current && close()}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClose={(e) => delete e.currentTarget.dataset.closing}
      >
        <div className="flex h-full flex-col gutter pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5">
          <div className="flex items-center justify-between">
            <span className="font-scrawl text-lg">where to, friend?</span>
            <button type="button" onClick={close} className="h-11 rounded-full bg-cocoa px-5 font-semibold text-milk">
              Close
            </button>
          </div>
          <nav aria-label="Mobile" className="mt-10 flex-1">
            <ul className="space-y-1">
              {NAV.map((l) => (
                <li key={l.href}>
                  <NavLink href={l.href} label={l.label} onNavigate={close} className={linkClass} />
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-3">
            <a href={whatsappHref} className="btn btn-whatsapp w-full" target="_blank" rel="noopener noreferrer">
              WhatsApp us
            </a>
            <p className="text-center text-sm font-medium">{phoneDisplay}</p>
          </div>
        </div>
      </dialog>
    </>
  );
}
