# The Mess Junk — website

Marketing site for The Mess Junk, a creative art & craft workshop studio in
Vadodara, Gujarat.

**Astro + Tailwind CSS**, deployed as static files with two serverless functions
for the enquiry form and newsletter signup. Runs on **Cloudflare Pages** or
**Vercel** — both are wired up. There is no database and no CMS: all content is
Markdown and JSON files in this repo.

Running cost at expected traffic: **₹0/month**, plus whatever the domain costs.

> **Read [BUILD_NOTES.md](BUILD_NOTES.md) first** if you are the client. It lists
> the decisions taken during the build that need your confirmation — including
> why the site launches without photography.

---

## Contents

- [Running it locally](#running-it-locally)
- [Editing content](#editing-content) — workshops, prices, dates, FAQ
- [Deploying to Cloudflare Pages](#deploying-to-cloudflare-pages)
- [Deploying to Vercel instead](#deploying-to-vercel-instead)
- [Setting the RESEND_API_KEY](#setting-the-resend_api_key)
- [Swapping in the real logo](#swapping-in-the-real-logo)
- [Adding real photography](#adding-real-photography) — including the shot list
- [Project structure](#project-structure)

---

## Running it locally

Requires **Node 20 or newer**.

```bash
npm install
npm run dev        # http://localhost:4321
```

Other commands:

```bash
npm run build      # production build into dist/
npm run preview    # serve the built site
npm run deploy     # build, then push to Cloudflare Pages
```

To test the contact form and newsletter locally you need the Workers runtime,
because they run as Cloudflare Functions rather than as part of the Astro app:

```bash
cp .dev.vars.example .dev.vars     # then add your Resend key
npm run build
npx wrangler pages dev dist
```

`npm run dev` alone serves the pages fine — form submissions will just fail, and
the form falls back to offering a pre-filled WhatsApp link, which is the same
thing a visitor sees in production if email is misconfigured.

---

## Editing content

Everything the studio will realistically want to change lives in
`src/content/`. Edit the file, commit, push — Cloudflare rebuilds and deploys
automatically, usually within a minute.

Every field is validated on build. If you mistype a category or leave out a
price, the build stops with a readable error naming the file — it will not
deploy a broken card.

### Adding or editing a workshop

One Markdown file per workshop in **`src/content/workshops/`**. Copy an existing
file, rename it (the filename becomes the URL slug), and edit.

```markdown
---
title: Pottery & Wheel Throwing
summary: Centre your first pot on the wheel — messy hands guaranteed, no experience needed.
categories: ['teens', 'adults', 'private-custom']   # see valid values below
priceFrom: 1200          # rupees, digits only — renders as "From ₹1,200"
ageGroup: '14+ yrs'      # free text, shown as a chip
duration: '2.5 hours'    # free text, shown as a chip
minParticipants: 20      # optional — omit unless it's a private-only format
shot: 'ws-pottery'       # an id from src/data/shots.ts
takeaway: 'Two pieces, glazed and fired — collect them a fortnight later.'
order: 10                # lower numbers appear first
draft: false             # true hides it without deleting the file
---

Two or three short paragraphs of body copy go here.
```

**Valid `categories`** (these are the filter tabs on `/workshops`) —
`kids`, `teens`, `adults`, `corporate-colleges`, `private-custom`, `seasonal`.
A workshop can be in several. A tab with nothing behind it is hidden
automatically.

To **remove** a workshop, set `draft: true` rather than deleting it — that keeps
the history and lets you bring it back for next season.

### Changing prices

Two places, depending on which price you mean:

- **A workshop's "From ₹—" figure** → `priceFrom` in that workshop's Markdown
  file (above).
- **The three tiers on the Pricing page** → **`src/content/pricing/tiers.json`**.
  `price` is free text so it can read `"₹499 – ₹2,500"` or `"Custom"` or
  `"Let's talk"`. `includes` is the bulleted list. `featured: true` visually
  lifts one tier — keep it on exactly one.

The "Sessions from ₹350" line on the Home page and the Workshops page is
calculated from the cheapest `priceFrom` across all workshops. It updates itself;
do not hardcode it.

### Adding workshop dates (the availability checker)

**`src/content/dates/upcoming.json`** — this drives the "Check a date" picker on
the Contact page.

```json
{
  "id": "2026-08-08-pottery",
  "date": "2026-08-08",
  "time": "11:00 AM – 1:30 PM",
  "workshop": "Pottery & Wheel Throwing",
  "seatsTotal": 8,
  "seatsLeft": 3,
  "priceFrom": 1200
}
```

- `date` must be `YYYY-MM-DD`. **Dates in the past are hidden automatically** on
  the next build, so this list only ever shrinks — top it up regularly.
- `seatsLeft: 0` renders the session as "Full" and disables selection.
- When `seatsLeft` drops to a quarter of `seatsTotal` (minimum 2), the card
  switches to an urgent "N left" badge on its own.
- Make `workshop` match a workshop `title` exactly and selecting the date will
  pre-select that workshop in the enquiry form too. If it does not match, the
  date still works — the workshop dropdown just stays on "Not sure yet".
- `id` just has to be unique. The `date-workshop` convention keeps it readable.

**If this file empties**, the Contact page shows a designed "the next dates are
being set" state rather than an empty grid. Nothing breaks — but nobody can pick
a date, so keep it stocked.

### Editing the FAQ

One Markdown file per question in **`src/content/faq/`**. The body is the answer;
keep it to two or three sentences, per the design brief.

```markdown
---
question: 'How do I book a workshop?'
group: 'booking'    # booking | pricing | expect
order: 10
---

Send us a WhatsApp message or fill in the enquiry form…
```

The three `group` values map to the page's three sections — Booking &
availability, Pricing & group size, What to expect. Questions are also emitted as
FAQ structured data for Google, so a well-written answer here can show up
directly in search results.

### Phone numbers, email, address, social links

All in one file: **`src/data/site.ts`**. Changing `primaryPhone` and
`whatsappNumber` there updates every WhatsApp CTA on the site at once.

---

## Content management (CMS)

The site has a browser-based admin panel at **`/admin`** powered by
[Decap CMS](https://decapcms.org/). It lets the team add, edit and remove
workshops, prices, FAQ entries and upcoming dates without touching code. Changes
are committed to Git and the site rebuilds automatically.

The admin panel edits the exact same Markdown and JSON files under `src/content/`
that this README documents above. Nothing about the build or the schemas changes.

See **`Docs/CLIENT_GUIDE.md`** for the team-facing guide.

### Setting up CMS authentication

The CMS authenticates via GitHub OAuth. You need a GitHub OAuth App:

1. Go to **GitHub > Settings > Developer settings > OAuth Apps > New OAuth App**.
2. Set the **Authorization callback URL** to
   `https://yourdomain.in/api/callback` (or your Vercel/Cloudflare preview URL).
3. Copy the **Client ID** and generate a **Client Secret**.
4. Add both to your host's environment variables:

   | Name | Value |
   |---|---|
   | `GITHUB_OAUTH_CLIENT_ID` | The client ID from step 3 |
   | `GITHUB_OAUTH_CLIENT_SECRET` | The client secret from step 3 (**encrypt it**) |

5. Redeploy. Go to `/admin` and log in with a GitHub account that has write
   access to the repository.

The OAuth proxy runs as two serverless functions (`/api/auth` and
`/api/callback`), with adapters for both Cloudflare Pages and Vercel — the same
pattern as the contact form. Logic lives once in `lib/oauth.ts`.

### Architecture

```
public/admin/index.html     Decap CMS entry point (pinned to 3.3.3)
public/admin/config.yml     collection + field definitions
lib/oauth.ts                GitHub OAuth token exchange logic
api/auth.ts                 Vercel adapter — redirects to GitHub authorize
api/callback.ts             Vercel adapter — exchanges code for token
functions/api/auth.ts       Cloudflare Pages adapter
functions/api/callback.ts   Cloudflare Pages adapter
```

### Decisions

- **Preview pane disabled.** The site's design uses custom tokens, motifs and
  components that cannot be replicated in a generic preview iframe. Showing raw
  unstyled Markdown would misrepresent the design. Editors see the live site
  after each save (about a minute).

- **Editorial workflow not enabled.** `publish_mode: editorial_workflow` turns
  every save into a pull request, adding a review step before changes go live.
  For a 3-person team that has never used Git, the extra step adds confusion
  without a clear benefit — there is nobody to review the PR, and an accidental
  publish is fixed by editing again. If the team grows or if someone is training
  a new editor, enable it by adding `publish_mode: editorial_workflow` to
  `public/admin/config.yml`.

- **Media uploads go to `src/assets/photos/`.** This keeps images inside Astro's
  build pipeline (Sharp, AVIF/WebP, `srcset`), preserving the mobile performance
  budget from the design document. The alternative (`public/uploads/`) would be
  simpler for the CMS but would bypass image optimisation entirely.

---

## Deploying to Cloudflare Pages

### First-time setup (Git integration — recommended)

1. Push this repo to GitHub or GitLab.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**, and pick the repo.
3. Build settings:

   | Setting | Value |
   |---|---|
   | Framework preset | **Astro** |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | `/` (leave blank) |

4. Under **Environment variables**, add `NODE_VERSION` = `20`.
5. Deploy. Every push to the main branch redeploys automatically; pull requests
   get their own preview URL.

The `functions/` directory is picked up automatically — no extra configuration.
`wrangler.toml` in the repo root holds the same settings for CLI deploys.

### Manual deploys

```bash
npm run deploy      # = astro build && wrangler pages deploy dist
```

### Custom domain

Buy the domain (`.in` via GoDaddy or the Cloudflare registrar), then in the Pages
project → **Custom domains** → **Set up a domain**. Cloudflare handles the DNS
record and the TLS certificate.

**Nothing in this build hardcodes a domain** — every internal link is
root-relative, so the site works identically on the `*.pages.dev` URL and on the
custom domain, with no code change.

---

## Deploying to Vercel instead

The site works on Vercel too, with no code change. Import the repo — Vercel
detects Astro, builds with `npm run build` and serves `dist`.

The one thing to know: **`functions/` is Cloudflare-only and does nothing on
Vercel.** Vercel reads serverless functions from the top-level **`api/`**
directory instead. Both exist in this repo:

```
functions/api/contact.ts     Cloudflare Pages  (Workers runtime)
api/contact.ts               Vercel            (Edge runtime)
lib/enquiry.ts               the actual logic, shared by both
```

Each platform file is a ~20-line adapter; all the validation, sanitising,
email composition and delivery lives once in `lib/enquiry.ts`, so the two hosts
cannot drift apart. Whichever host you use, the front-end calls the same
`/api/contact` URL and the unused directory is simply ignored.

Set the same environment variables (below) under **Project → Settings →
Environment Variables** in the Vercel dashboard, then redeploy.

---

## Setting the RESEND_API_KEY

The enquiry form and newsletter signup send email through
[Resend](https://resend.com) (free tier: 3,000 emails/month). **Until this is
set, the form cannot deliver** — it fails gracefully and offers the visitor a
pre-filled WhatsApp link instead, but you will not get emails.

1. Create a free Resend account and verify the login.
2. **API Keys** → **Create API Key**. Sending permission is enough. Copy it —
   Resend shows it once.
3. Add the key to your host:

   **Cloudflare Pages** — dashboard → **Workers & Pages** → **the-mess-junk** →
   **Settings** → **Environment variables** → **Add variable**:

   | Name | Value | Type |
   |---|---|---|
   | `RESEND_API_KEY` | `re_...` (the key from step 2) | **Secret** (encrypt it) |

   **Vercel** — dashboard → your project → **Settings** → **Environment
   Variables** → add `RESEND_API_KEY` with the same value, scoped to
   Production (and Preview if you want preview deploys to send too).

   On either host, add it to Preview as well if preview deployments should
   send email.
4. **Redeploy.** Environment variables are read at request time, but a redeploy
   is the reliable way to be sure the change has taken.
5. Send a test enquiry through the live form and confirm it arrives at
   `themessjunk@gmail.com`.

**Never put the key in the repo.** It belongs only in the Cloudflare dashboard,
or in `.dev.vars` locally (which is gitignored).

### Optional variables

| Name | What it does |
|---|---|
| `CONTACT_TO` | Sends enquiries somewhere other than `themessjunk@gmail.com`, without a code change. |
| `SHEET_WEBHOOK_URL` | A Google Apps Script web-app URL. Used automatically if Resend is missing or failing, so enquiries land in a spreadsheet rather than being lost. |
| `BUTTONDOWN_API_KEY` | Switches newsletter signups from "email the studio" to a real Buttondown list (free to 100 subscribers). |
| `GITHUB_OAUTH_CLIENT_ID` | GitHub OAuth App client ID. Required for the Decap CMS admin panel at `/admin`. See "Content management (CMS)" below. |
| `GITHUB_OAUTH_CLIENT_SECRET` | GitHub OAuth App client secret. Required for the CMS. **Must be set as a secret (encrypted).** |

### Sending from your own domain

Emails currently send from `onboarding@resend.dev` — Resend's shared address,
which works on a fresh account with no setup. Once the domain is live, add it
under **Domains** in Resend, add the DNS records it gives you (Cloudflare makes
this a couple of clicks), then change `FROM` at the top of
`functions/api/contact.ts` and `functions/api/newsletter.ts` to
`The Mess Junk <hello@yourdomain.in>`.

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
| `founder-aditi` | Aditi Musalgaonkar |
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
├── Docs/                        the original client brief + design document
├── lib/
│   ├── enquiry.ts               validation + email delivery (the real logic)
│   └── oauth.ts                 GitHub OAuth token exchange for CMS login
├── functions/api/               Cloudflare Pages adapters (ignored by Vercel)
│   ├── contact.ts
│   ├── newsletter.ts
│   ├── auth.ts                  CMS OAuth redirect
│   └── callback.ts             CMS OAuth callback
├── api/                         Vercel adapters (ignored by Cloudflare)
│   ├── contact.ts
│   ├── newsletter.ts
│   ├── auth.ts                  CMS OAuth redirect
│   └── callback.ts             CMS OAuth callback
├── public/
│   ├── favicon.svg              splat mark on cobalt
│   └── admin/                   Decap CMS (the content management panel)
│       ├── index.html
│       └── config.yml
├── scripts/
│   └── fetch-images.mjs         stock-image sourcing (unused — see BUILD_NOTES §2)
├── src/
│   ├── components/
│   │   ├── motifs/              Blob, Grain, Sparkle, TapeCorner,
│   │   │                        MarkerUnderline, SplatDot  (design doc §3.4)
│   │   ├── Icon.astro           every icon on the site, one family (§3.5)
│   │   ├── Logo.astro           interim wordmark — swap here (§3.3)
│   │   ├── ShotPanel.astro      image slots + the "coming soon" treatment (§4)
│   │   ├── Header / Footer / WhatsAppFloat
│   │   └── WorkshopCard / PageHero / SectionHeading / CtaBand
│   ├── content/                 ← EDIT CONTENT HERE
│   │   ├── workshops/*.md
│   │   ├── faq/*.md
│   │   ├── pricing/tiers.json
│   │   └── dates/upcoming.json
│   ├── content.config.ts        schemas that validate the above
│   ├── data/
│   │   ├── site.ts              ← phone, email, address, nav
│   │   ├── shots.ts             image slot registry + shot list
│   │   └── icons.ts
│   ├── layouts/BaseLayout.astro
│   ├── pages/                   one file per route
│   └── styles/global.css        ← design tokens (§3.1) live here
├── tailwind.config.mjs          tokens mapped to Tailwind (§3.1/§3.2)
├── wrangler.toml                Cloudflare Pages config
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
