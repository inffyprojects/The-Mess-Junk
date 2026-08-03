# The Mess Junk — website

Marketing site for The Mess Junk, a creative art & craft workshop studio in
Vadodara, Gujarat.

**Astro + Tailwind CSS** on **Vercel**, with content in a **Neon Postgres**
database and a built-in admin panel at `/admin`.

The public pages are prerendered from the database at build time, so visitors
get static HTML off the CDN and never touch Postgres — no cold starts, no query
on the critical path. Saving in the admin panel triggers a rebuild, and the
change is live in about a minute.

> **New to this project? Start with [SETUP.md](SETUP.md)** — the one-time steps
> to create the database, migrate the content and set the admin password.
>
> [BUILD_NOTES.md](BUILD_NOTES.md) records the design decisions that still need
> the client's confirmation, including why the site launches without photography.

---

## Contents

- [Running it locally](#running-it-locally)
- [Editing content](#editing-content) — via the admin panel
- [How the pieces fit together](#how-the-pieces-fit-together)
- [Environment variables](#environment-variables)
- [Swapping in the real logo](#swapping-in-the-real-logo)
- [Adding real photography](#adding-real-photography) — including the shot list
- [Project structure](#project-structure)

---

## Running it locally

Requires **Node 20 or newer** and a `DATABASE_URL` (see [SETUP.md](SETUP.md)).

> **Node version matters for deploys.** `package.json` pins
> `engines.node` to `22.x`. The Vercel adapter reads the *build machine's*
> `process.version` to decide the serverless runtime, so without that pin Vercel
> built on Node 18 and emitted `nodejs18.x` — a runtime Vercel no longer accepts,
> which fails the deploy outright. Do not remove the pin, and keep it on a
> version Vercel still supports.

```bash
npm install
cp .env.example .env     # then fill in at least DATABASE_URL
npm run dev              # http://localhost:4321
```

The dev server reads the same Neon database as production, so be aware that
edits you make through a local `/admin` are real.

Other commands:

```bash
npm run build        # production build (needs DATABASE_URL)
npm run preview      # serve the built site
npm run db:verify    # run the schema + queries against a real Postgres engine
npm run db:migrate   # copy _content-backup/ files into Neon (one-time)
npm run admin:hash   # generate ADMIN_PASSWORD_HASH + SESSION_SECRET
```

`npm run db:verify` is worth knowing about: it applies `db/schema.sql` to an
in-process Postgres (PGlite) and exercises every constraint and query. It needs
no database and no network, so it is the fastest way to check a schema change
before touching Neon.

---

## Editing content

Everything is at **`/admin`** — workshops, upcoming dates, pricing tiers and the
FAQ. Sign in with the shared password (see [SETUP.md](SETUP.md) step 4).

Each save writes to Neon and then pings a Vercel Deploy Hook, so the public site
rebuilds itself. Expect about a minute between saving and seeing the change.

| Section | What it controls |
|---|---|
| **Workshops** | The cards on `/workshops` and the category strip on the home page. "Hide from the website" takes one off the site without deleting it — use that for seasonal sessions. |
| **Upcoming dates** | The "Check a date" picker on `/contact`. Update *seats left* as bookings come in; set it to 0 to show a session as Full. Past dates disappear on their own. |
| **Pricing** | The cards on `/pricing`. Mark exactly one tier as featured. |
| **FAQ** | Grouped into the three sections the page renders. Answers are also emitted as FAQ structured data, so a good answer can appear directly in Google results. |

The database enforces the rules that used to be checked at build time — a
workshop must have at least one valid category, seats left cannot exceed seats
total, prices must be positive. If a save is rejected, the panel explains why in
plain language rather than showing a database error.

### Things that are still in code, not the database

Deliberately, because they change once a year at most:

- **Phone numbers, email, address, social links** → `src/data/site.ts`
- **Image slots and the shot list** → `src/data/shots.ts`
- **Page copy** (headlines, About page, the "how it works" steps) → the relevant
  file in `src/pages/`

---

## How the pieces fit together

```
Editor saves in /admin
      |
      v
  Neon Postgres  <--- read at build time by the public pages
      |
      v
Deploy Hook -> Vercel rebuild -> static HTML on the CDN -> visitor
```

- **Public pages** (`/`, `/workshops`, `/pricing`, `/contact`, `/faq`, `/about`,
  `/portfolio`) are prerendered. They query Neon during `astro build` and ship as
  plain HTML.
- **Admin pages** (`/admin/*`) set `export const prerender = false`, so they are
  server-rendered on Vercel and read and write Neon per request.
- **The enquiry form and newsletter** (`src/pages/api/contact.ts`,
  `src/pages/api/newsletter.ts`) are Astro API routes, server-rendered by the
  same function; their logic lives in `src/lib/enquiry.ts`. They must stay under
  `src/pages/api` — a top-level `/api` directory is ignored once the Vercel
  adapter is in use.

This is why a content change needs a rebuild: visitors are served files, not
database rows. That is the trade for zero cold starts and no database on the
critical path.

---

## Environment variables

Set these in Vercel → Settings → Environment Variables, and in a local `.env`
for development. `.env.example` lists them all with comments.

| Name | Required | What it does |
|---|---|---|
| `DATABASE_URL` | yes | Neon **pooled** connection string. Builds and the admin panel both need it. |
| `ADMIN_PASSWORD_HASH` | yes | From `npm run admin:hash`. Without it the admin panel refuses to load rather than opening up. |
| `SESSION_SECRET` | yes | Signs the admin session cookie. 32+ characters. |
| `DEPLOY_HOOK_URL` | for auto-publish | Vercel Deploy Hook. Without it, saves still work but the site will not rebuild by itself. |
| `RESEND_API_KEY` | for the contact form | [Resend](https://resend.com), free to 3,000 emails/month. |
| `CONTACT_TO` | no | Overrides the enquiry inbox. |
| `SHEET_WEBHOOK_URL` | no | Google Apps Script fallback if Resend fails. |
| `BUTTONDOWN_API_KEY` | no | Sends newsletter signups to a list instead of an inbox. |

Never commit any of these. `.env` is gitignored.

---

## Swapping in the real logo

The site currently uses the interim type-based wordmark specified in the design
document §3.3 — "the mess junk" in Bricolage Grotesque 800, with "mess" in pink
and a paint-splat dot over the "j".

It is deliberately isolated in **one component**, so replacing it is a single
edit and not a rebuild:

1. Put the logo file in `public/` (e.g. `public/logo.svg`). **SVG is strongly
   preferred** — it stays sharp at every size and weighs almost nothing.
2. Open **`src/components/Logo.astro`** and replace everything inside the
   outermost `<span>` with:

   ```astro
   <img
     src="/logo.svg"
     alt="The Mess Junk"
     class="h-[1.4em] w-auto"
   />
   ```

   Keep the `class:list` on the wrapper — the header and footer size the logo
   through it.
3. If the logo needs to be a different colour on the dark footer, the component
   already receives `tone="dark"` there; branch on it.
4. Replace **`public/favicon.svg`** with the logo mark on a cobalt square
   (32×32 viewBox, `rx="7"`).

Nothing else in the project references the wordmark's internals.

---

## Adding real photography

This is the highest-impact improvement available to the site — see BUILD_NOTES §2
for why it launched without photos.

### How the image slots work

Every image slot is declared once in **`src/data/shots.ts`** with a fixed aspect
ratio, a shot brief and pre-written alt text. Right now each renders a designed
graphic panel. Adding a photo swaps it for the real thing **at the identical
ratio, with no layout change anywhere**.

### To add a photo

1. Save the image into `src/assets/photos/` (create the folder if needed). Any
   size — the build resizes it. Bigger is better; 2000px on the long edge is
   plenty.
2. In the page that uses the slot, import it and pass it to `<ShotPanel>`:

   ```astro
   ---
   import heroPhoto from '../assets/photos/hero-home.jpg';
   ---
   <ShotPanel shot="hero-home" photo={heroPhoto} eager />
   ```

3. That is it. Astro generates AVIF and WebP at several widths, adds `srcset`
   and `sizes`, lazy-loads it, and applies the design document's duotone-and-grain
   treatment — including the hover reveal where colour bursts through.

   Pass `eager` **only** on the home page hero (the largest image above the
   fold); everything else should stay lazy.

4. Alt text comes from `src/data/shots.ts` automatically. If the photo you shot
   differs from the brief, update `alt` there — it should describe what is
   actually in the frame, not the filename.

### The shot list

Hand this to whoever is shooting. Ratios are fixed; shoot a little wider than
you need so there is room to crop.

**Wide, 16:9**
| Slot | What to shoot |
|---|---|
| `hero-home` | Wide candid of a workshop in progress — hands mid-craft in front, other makers soft behind. Shot at table height, not from above. **This is the most important photo on the site.** |
| `hero-about` | The studio itself, empty or nearly so. Worktable, stools, shelves, daylight. The room as a character. |
| `hero-workshops` | Overhead flat-lay of mixed materials — clay, brushes, yarn, paper, resin. Everything you run, in one frame. |
| `hero-portfolio` | A wall or shelf of finished pieces, grouped tight. The "proof" shot. |

**Portrait, 4:5 — natural light, in the studio, mid-task. Not a headshot backdrop.**
| Slot | Who |
|---|---|
| `founder-aditi` | Gini |
| `founder-abhinav` | Abhinav Singh Rajput |
| `founder-khadija` | Khadija Sulaimani |

**Category cards, 4:3 — one clear hero material or moment each**
`cat-kids` · `cat-teens` · `cat-adults` · `cat-corporate` · `cat-college` ·
`cat-private` · `cat-seasonal`

**Workshop cards, 4:3 — the craft in progress, not the finished object**
`ws-pottery` · `ws-canvas` · `ws-resin` · `ws-textile` · `ws-journal` ·
`ws-candle` · `ws-print` · `ws-tufting`

**Gallery details, square 1:1 — studio close-ups**
`peek-1` · `peek-2` · `peek-3` — brushes in a jar, the materials shelf, a
worked-over palette. Plus `about-story` (4:3): a close crop of mess made well.

The full brief for each slot is the `brief` field in `src/data/shots.ts`.

### Shooting guidance, from the design brief

- **Candid over posed.** Hands and materials, cropped in close. Avoid forced
  smiles and group line-ups — the filter is "would this look believable on a real
  indie studio's Instagram".
- **Consistency matters more than perfection.** The site applies a uniform
  duotone and grain over every photo, which is what makes a mixed set read as one
  art-directed brand. Shoot in similar light where you can.
- **Get permission** before using photographs of participants, especially
  children.

### Populating the gallery

The Portfolio page shows its designed launch state because the `pieces` array in
`src/pages/portfolio.astro` is empty. Add entries and the Pinterest-style masonry
grid takes over automatically:

```ts
const pieces = [
  { shot: 'ws-pottery', caption: 'First pots, August intake', category: 'Pottery' },
];
```

---

## Project structure

```
├── db/schema.sql                the Neon schema — run once, safe to re-run
├── scripts/
│   ├── verify-db.mjs            schema + query tests (PGlite, no network)
│   ├── migrate-content.mjs      one-time: content files -> Neon
│   └── hash-password.mjs        generates ADMIN_PASSWORD_HASH
├── src/
│   ├── lib/
│   │   ├── db.ts                ← every database query lives here
│   │   ├── auth.ts              admin password hashing + session cookie
│   │   ├── admin.ts             session guard + form helpers
│   │   └── deploy.ts            rebuild trigger
│   ├── pages/
│   │   ├── admin/               ← the admin panel (server-rendered)
│   │   │   ├── login.astro
│   │   │   ├── index.astro      dashboard
│   │   │   ├── workshops/       list + create/edit
│   │   │   ├── dates/
│   │   │   ├── pricing/
│   │   │   └── faq/
│   │   ├── api/                 contact + newsletter endpoints
│   │   └── *.astro              public pages (prerendered from the database)
│   ├── components/
│   │   ├── motifs/              Blob, Grain, Sparkle, TapeCorner,
│   │   │                        MarkerUnderline, SplatDot  (design doc §3.4)
│   │   ├── Icon.astro           every icon on the site, one family (§3.5)
│   │   ├── Logo.astro           interim wordmark — swap here (§3.3)
│   │   └── ShotPanel.astro      image slots + "coming soon" treatment (§4)
│   ├── data/
│   │   ├── site.ts              ← phone, email, address, nav
│   │   └── shots.ts             image slot registry + shot list
│   ├── layouts/
│   └── styles/global.css        ← design tokens (§3.1) live here
├── _content-backup/             the old Markdown/JSON, kept as a backup
├── SETUP.md                     one-time database + admin setup
└── BUILD_NOTES.md               decisions needing client sign-off
```

### A note on the design system

Colour and type tokens are defined **once**, as CSS custom properties in
`src/styles/global.css`, exactly as given in design document §3.1. Tailwind reads
through to them via `var()` rather than duplicating the hex values, so the two
cannot drift apart. Change a colour in `global.css` and it changes everywhere.

The rules worth preserving:

- **Pink is a background and accent colour only.** It fails contrast for body
  text. Use it for fills, blobs, badges and hover states.
- **Cobalt is the workhorse** — buttons, links, active states, icons.
- **Body text is `--ink` (#17173A), never pure black.**
- **The page background is off-white (#F8F5F0), not white.** White is reserved
  for cards that need to lift off the page.
- **Roughly 60% neutral, 30% cobalt, 10% pink and yellow.** That balance is what
  keeps "colourful" from tipping into "loud".
- **No emoji anywhere in the UI.** Icons come from `Icon.astro` and nowhere else.
