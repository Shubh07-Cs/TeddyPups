# TeddyPups U.A.E.

<p>
  A playful, story-driven puppy discovery experience for Dubai — rebuilt with Next.js and React.
</p>

> Follow Teddy through a day in the life, meet 42 puppies, explore breeds, and find a new best friend.

## Highlights

- **Teddy, the page companion** — A fully rigged SVG puppy with a walk cycle, blinking, gaze tracking, poses, and interactive tricks.
- **A scroll journey** — Eight illustrated scenes guide visitors from first hello to finding a home.
- **42 detailed profiles** — Server-generated puppy pages with galleries, status, origin, health details, and enquiries.
- **Filterable puppy browser** — Search by origin, breed, gender, and collection using shareable URL parameters.
- **Thoughtful motion** — Smooth scrolling, reveal effects, route transitions, paw trails, and complete reduced-motion support.
- **Accessible by design** — Skip navigation, keyboard-friendly controls, native dialogs, focus management, and semantic markup.

## Pages

| Route | Description |
|---|---|
| `/` | The full eight-scene Teddy journey |
| `/puppies` | Filterable collection of 42 puppies |
| `/puppies/[slug]` | Individual puppy story and enquiry |
| `/gone-home` | Puppies that have found their families |
| `/happy-families` | Customer stories and photos |
| `/how-it-works` | Adoption journey and visiting information |
| `/faq` | Searchable frequently asked questions |
| `/contact` | Contact and enquiry form |
| `*` | Custom illustrated not-found page |

Example puppy filters:

```text
/puppies?origin=local
/puppies?origin=imported&breed=pomeranian
/puppies?gender=male&collection=korean-teacup
```

## Tech stack

- **Next.js 16** with the App Router and React Server Components
- **React 19** and **TypeScript**
- **Tailwind CSS v4** plus project-specific scene styles
- **Motion** and a custom `requestAnimationFrame` loop
- **Lenis** smooth scrolling
- **Next Image** with focal-point cropping and blur placeholders
- Fraunces, Figtree, and Shantell Sans through `next/font/google`

## Getting started

### Requirements

- Node.js 20 or newer
- npm

### Install and run

```bash
npm install
npm run dev
```

Open [https://teddypups-iota.vercel.app/](https://teddypups-iota.vercel.app/).

Some puppy videos may not be included in an existing clone. Download the remaining media once if needed:

```bash
node scripts/fetch-missing.mjs
```

### Production build

```bash
npm run build
npm start
```

Set `NEXT_PUBLIC_SITE_URL` to the deployed URL for canonical metadata and Open Graph URLs.

## Project structure

```text
src/
├── app/                  App Router pages and enquiry server action
├── components/
│   ├── home/             Illustrated homepage scenes
│   ├── layout/           Header, navigation, footer, and page effects
│   ├── pup/              Teddy SVG, rig controls, stops, and journey
│   ├── puppies/          Listing, filters, and sketch cards
│   ├── puppy/            Puppy gallery and story ribbon
│   └── forms/            Contact and puppy enquiry forms
├── data/                 Puppy catalogue and site content
├── lib/
│   ├── pup/              Teddy skeleton, animation, tricks, and routing
│   ├── motion.ts         Shared animation and reduced-motion helpers
│   └── site.ts           Typed content access
└── styles/scenes.css     Scene and illustration styles

public/
├── brand/                Logo and brand assets
├── media/                Puppy images and videos
└── cursor/               Custom paw cursor assets

scripts/                  Media mirroring and download utilities
```

## Content and forms

Puppy and website content is stored in:

- `src/data/puppies.json`
- `src/data/site.json`

Enquiries are handled by `src/app/actions.ts`. The action validates fields on the server, rejects obvious honeypot submissions, and currently logs leads to the server console. Connect it to email or a CRM before using the site in production.

## Accessibility and performance

- Reduced-motion preferences disable the puppy journey, route curtain, smooth scroll, reveals, and paw canvas.
- The page uses server-rendered content while frame-based animation updates SVG and DOM attributes without React rerenders.
- Native dialogs and keyboard controls support galleries, tabs, navigation, and forms.
- Images use preload-safe placeholders and content-aware focal points.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Create an optimized production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | Run TypeScript validation |

## License

This repository is provided as a custom website implementation. Review and add appropriate licensing before redistribution.