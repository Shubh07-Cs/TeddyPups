# Loom talking points — TeddyPups clone

## 1. What I built
A complete clone of puppy.instabizweb.com: every page (home, puppies, 42 puppy pages, gone home, happy families,
how it works, FAQ, contact, 404), the original photos/videos, and all of the interactions and animations.

## 2. Development process
1. **Analysis.** Opened the site in a browser and read the computed styles, fonts, colours and section structure.
   Found it is Next.js + Tailwind v4 with an unusually rich motion layer (a walking SVG puppy, scroll scenes, page curtain).
2. **Reference capture.** Wrote `scripts/mirror.mjs` to download every page's HTML, the CSS/JS bundles and all media into
   `_reference/` (git-ignored), and `scripts/fetch-missing.mjs` for the videos the first pass missed.
3. **Design system.** Converted the compiled CSS back into source: `@theme` tokens (toffee/honey/cocoa/milk palette,
   display/hand fonts, custom easings), base styles, components (`.btn`, `.chip`…), custom utilities
   (`font-plush`, `text-huge`, `gutter`…) and the scene styles — keeping cascade order.
4. **Content data.** Extracted the structured data embedded in the pages (React Server Component payloads) into
   `src/data/*.json`: 42 puppies with media (dimensions, focal points, blur placeholders, video posters), section copy, FAQs, 64 family photos.
5. **Markup.** Wrote a small HTML→JSX converter to turn the static illustrated scenes into React components (no hand-retyping
   of hundreds of SVG paths), then refactored them into typed, data-driven components.
6. **Behaviour.** Read the original client code and re-implemented each interactive piece as a typed React component:
   Teddy's rig & tricks, the PupJourney walker, curtain transitions, hero lineup swaps, pinned "Meet the pups" hallway,
   the self-typing WhatsApp chat, photo walls + viewer, sketch-card filters, notice-board FAQ, letter/enquiry forms.
7. **Pages & SEO.** Static generation for all 42 puppy pages, per-page metadata, JSON-LD (PetStore, FAQPage, BreadcrumbList).

## 3. Technologies
Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript, Tailwind CSS v4, Motion (motion/react),
Lenis, next/image, next/font. Deployed on Vercel from GitHub.

## 4. AI tools used and the prompts
- **Claude (Anthropic)** — analysis, reference capture scripts, CSS/JS reverse-engineering, component implementation, docs.
- Prompts I gave (verbatim):
  1. *"Assignment: Clone the Complete Website … https://puppy.instabizweb.com/ … i got this task, analyze the website"*
  2. *"u have to make it, what things i need to prepare, also do u need figma support or any other things i need to prepare for u so that u spend lesser credits"*
  3. *"how far take animation, copy it as it is, keep original photos, keep all pages, go as similar u can as possible, and no need to run npm run dev, i will check and inform u as needed"*
  4. *(follow-ups: "done", the mirror script output, and build/visual feedback)*

## 5. Implementation decisions
- **Same stack as the original** (Next 16 + Tailwind v4) so the CSS and component boundaries map 1:1.
- **Data-driven**: content lives in JSON with types; pages are server components, only interactive islands ship JS.
- **One shared frame loop** (`lib/motion.ts`) for smooth scroll + all puppies; animation writes SVG attributes directly
  and only when values change — no per-frame React renders.
- **Seeded randomness** for sketch cards so server and client render identical "hand-drawn" shapes (no hydration mismatch).
- **Server Action** for enquiries with server-side validation and a honeypot field (ready to connect to email/CRM).
- **Reduced-motion first**: SSR renders the calm state; motion is layered on only when allowed.

## 6. Challenges
- The walking puppy: planning a route between "stops", mapping scroll position to hold/walk segments, Bézier paths that
  avoid the header and mobile bar, hops over things he sits "behind", pinned (sticky) sections, and a separate mobile "lane" mode.
- Reproducing a procedural SVG rig (poses, walk cycle, ear/bounce springs, blink, gaze tracking) exactly.
- Page-transition curtain that intercepts link clicks, covers, navigates and lifts once the new route has rendered.
- Pinned horizontal "hallway" of doors driven by scroll with a spring, while Teddy walks on a treadmill.
- Capturing data that only exists inside streamed RSC payloads.

## 7. Testing & deployment
- `npm run build` (type-checks + statically generates all routes), manual side-by-side comparison with the original at
  desktop / tablet / mobile widths, reduced-motion check, keyboard-only navigation, form validation states.
- Pushed to GitHub, imported into Vercel (zero config), every push redeploys.
