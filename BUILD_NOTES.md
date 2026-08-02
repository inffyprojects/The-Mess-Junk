# Build Notes — The Mess Junk

Decisions taken during the build that the client should confirm or override.
Nothing here blocks launch; everything here is a one-line change if you disagree.

Built against `Docs/Event_Management_Website_Requirements (1).docx` (the client's
answers) and `Docs/TheMessJunk_Website_Design_Document.md` (the art direction).
The design document was treated as authoritative for everything visual and
structural — deviations from it are listed under **Deviations** below.

---

## 1. The five open questions (design doc §11) — decisions taken

The design doc left five items unresolved. Each was built with its recommended
default. **Please confirm or override.**

| # | Question | Decision taken | How to change it |
|---|---|---|---|
| 1 | **Careers page** — brief left it ambiguous | **Not built.** The doc recommends leaving it out of v1 for a 3-person team. | Add `src/pages/careers.astro` and one line to `nav` in `src/data/site.ts`. |
| 2 | **Blog / News** — brief says "No" on the page list but ticks it in features | **Not built.** The doc recommends no blog at launch; it also matches the client's stated dislike of text-heavy sites. | Would need a new content collection + index/detail routes. A real decision, not a quick toggle — worth a conversation first. |
| 3 | **Third accent colour** `--acid-yellow` `#F5D949` | **In use.** Applied sparingly — sparkle motifs, the "N left" seat badge, the "Most people start here" pricing tag, and the hero's marker underline. Nothing structural depends on it. | Change the value in `src/styles/global.css` (one line), or set it to `var(--pink)` to remove it from the palette entirely. |
| 4 | **Which WhatsApp number is primary** — three were listed | **9601602885** (the first listed) drives the floating button and every CTA. The other two (8320415348, 9157383650) appear on the Contact page and in the footer. | `primaryPhone` and `whatsappNumber` in `src/data/site.ts`. |
| 5 | **Availability checker scope** | **Static date list, not a live booking engine**, exactly as §6.7 recommends. Reads `src/content/dates/upcoming.json`; selecting a date pre-fills the enquiry form and the WhatsApp message. | See README, "Adding workshop dates". |

---

## 2. The one thing that changed the design: no photography

**This is the most significant decision in the build and it was made by the client mid-build.**

Design doc §4 calls imagery "the core of not vibe-coded" and specifies sourcing
curated photography from the Unsplash or Pexels API using named search terms.
That turned out not to be possible as written:

- **Unsplash** and **Pexels** now require a registered API key on every request.
  No key was supplied with the build brief. Unsplash returns a bot challenge to
  unauthenticated requests; Pexels returns `401`.
- **Openverse** (the one keyless, commercially-licensed image API reachable) was
  trialled against the exact §4 search terms. Its free corpus is dominated by
  museum catalogues and historical archives — "hands painting ceramic" returned a
  photograph of a medieval Persian bowl on a white background. That fails §4's own
  filter ("would this look believable on a real indie studio's Instagram").

Presented with the options, **the client chose to launch with no stock
photography at all**, extending §4's designed "coming soon" state across every
image slot rather than only portfolio and testimonials.

**What that means in practice**

Every image slot on the site renders a `<ShotPanel>` — a composition in the §3.4
motif language (brand colour field, two blobs, the shared grain texture, one
sparkle) built to the **exact aspect ratio and corner radius** the real
photograph will occupy. These are not placeholders: there is no grey box, no
broken-image affordance, and no "image missing" state anywhere.

This is consistent with the doc's rule zero — *"If a section has no real content
yet, it gets an intentionally designed 'coming soon' state — never a placeholder
image"* — and it is arguably more honest than launching a pre-launch studio's
site with stock photos of someone else's studio. The Portfolio page says so
explicitly.

**Swapping real photos in is drop-in.** Every slot is declared once in
`src/data/shots.ts` with its ratio, a shot brief and pre-written alt text.
Adding a photo is two lines and changes no layout. See the README's
"Adding real photography" section, which also contains the full shot list to
hand the photographer.

**If you would rather have stock photography for launch:** get a free Unsplash
or Pexels API key (about two minutes) and say so. `scripts/fetch-images.mjs` is
in the repo, already written against the §4 search terms verbatim — it needs its
search function pointed at the keyed API and it will populate every slot.

---

## 3. Other decisions worth flagging

**"Services" renamed to "Workshops"** — as §5 instructs, at `/workshops` rather
than `/services`. The client's questionnaire uses "workshop" throughout and never
says "service". Flagged in the doc for confirmation; proceeding as recommended.

**Testimonials section: not built.** §4 says to skip it entirely at launch rather
than show a placeholder, and the client has none yet (Q36). The Home page section
order degrades cleanly without it.

**Instagram feed band: not built.** §6.1.6 says to skip the band entirely until
the account has content rather than render an empty grid. The Home page has a
commented marker where it goes. Once the account is active, an embed drops in
between the founders section and the final CTA.

**Newsletter goes to your inbox, not a mailing-list service.** The brief ticks
"newsletter signup" without naming a provider. Signups email the studio via the
same Resend path as the enquiry form, and you add them to a list by hand. For a
pre-launch studio expecting a handful of signups a month this is the right size
and costs nothing. When it outgrows that, set `BUTTONDOWN_API_KEY` in the
Vercel dashboard and signups switch to Buttondown automatically — no code
change, no front-end change. (`src/pages/api/newsletter.ts`.)

**Contact form delivery path: Resend.** As specified. The function also has a
Google Sheet webhook fallback (`SHEET_WEBHOOK_URL`) which is used automatically
if Resend is missing or erroring, so an enquiry is never silently dropped while
you are still setting Resend up. **Neither is configured yet** — until
`RESEND_API_KEY` is set in Vercel, the form fails gracefully and hands the
visitor a pre-filled WhatsApp link containing everything they typed. Setup steps
are in the README.

**Online payment: not built.** The brief ticks it, but it conflicts directly
with Q24 ("request a custom quote") and §6.3's rule that the CTA is never a fixed
checkout. Taking payment also means a payment gateway, a merchant account and
recurring fees — the opposite of this build's near-zero-cost brief. Payment
details are shared on WhatsApp once a booking is confirmed, which is what the FAQ
says. Worth revisiting once booking volume justifies it.

**Workshop content is illustrative.** The twelve workshops in
`src/content/workshops/` are built from the client's own service list (Q21/Q22)
and the ₹350–₹2,500 range (Q25/Q29), but the specific session names, durations
and prices are our reasonable reconstruction — **please review and correct them**.
Same for the nine dates in `src/content/dates/upcoming.json`, which are
placeholders for a real schedule.

---

## 3b. Hosting and architecture: Vercel + Neon

The site was originally built for Cloudflare Pages with content as Markdown and
JSON files. It has since moved twice, both at the client's direction:

1. Deployed to **Vercel** instead of Cloudflare Pages.
2. Content moved out of files into a **Neon Postgres** database, with a custom
   admin panel at `/admin`, replacing the Decap CMS attempt.

Cloudflare support has been removed rather than left half-working — the
`functions/` directory, `wrangler.toml` and the wrangler dependency are gone,
because with the Vercel adapter configured a Cloudflare deploy could not have
worked anyway.

**One thing worth recording, because it is not obvious.** Adding
`@astrojs/vercel` switches the build to Vercel's Build Output API
(`.vercel/output/`). Vercel then serves *only* what that output declares, and
**ignores the legacy top-level `/api` directory**. The enquiry form and
newsletter originally lived in `/api/*.ts` and were silently falling through to
the catch-all 404 — a broken form looks identical to a form nobody submitted, so
this would not have shown up until someone complained about missing enquiries.
They now live at `src/pages/api/*.ts`, which the adapter compiles and routes
properly. If an endpoint ever needs adding, put it there, not in a root `/api`.

Rendering is hybrid: public pages prerender from Neon at build time and ship as
static HTML; `/admin/*` sets `prerender = false` and is server-rendered. Saving
in the admin pings a Vercel Deploy Hook to rebuild the public pages, so an edit
is live in about a minute. Visitors never touch the database.

---

## 4. Deviations from the design document

Only three, all minor:

1. **Tech stack** — Next.js (§9) replaced with **Astro + Tailwind**, as
   instructed by the build brief. Everything else in §9 still holds: tokens map
   onto `tailwind.config.mjs`, content lives as files rather than in a CMS, and
   images use responsive lazy-loading. Astro ships zero JavaScript by default,
   which suits a mostly-static content site and the free-tier hosting target.
   JavaScript is loaded on exactly three interactions: the mobile nav, the
   workshop filter, and the availability picker.

2. **Type scale is fluid, not two fixed values.** §3.2 gives desktop and mobile
   sizes for `display-xl` and `display-lg`. Implemented as `clamp()` between
   exactly those two values rather than a breakpoint switch, so headlines scale
   smoothly across the tablet range instead of jumping. Endpoints are unchanged.

3. **The duotone treatment is CSS, not baked into image files.** §4 asks for a
   uniform duotone over photography; §8 asks for a duotone-to-full-colour
   crossfade on hover. The second requires the first to be a live layer, so
   `.photo` in `global.css` applies it at runtime. Currently dormant — it
   activates the moment real photos are added.

Everything else — colour tokens, type scale, motif library, component specs,
page order, section order, motion rules, breakpoints — is implemented as written.

---

## Phase 2: Decap CMS at `/admin`

A browser-based admin panel has been added so the team can manage content without
touching Git or code. It edits the same files documented above — nothing about
the build or the schemas has changed.

### What was built

- **Decap CMS** (pinned to 3.3.3) at `/admin`, with the GitHub backend.
- **OAuth proxy** at `/api/auth` and `/api/callback`, with adapters for both
  Cloudflare Pages and Vercel (same pattern as the enquiry form).
- **Four collections**: Workshops (folder), FAQ (folder), Pricing Tiers (file),
  Upcoming Dates (file). Every field matches `src/content.config.ts` exactly,
  with hints written for non-technical editors.
- **`Docs/CLIENT_GUIDE.md`** — a plain-language guide for the team.

### Decisions taken

1. **Preview pane: disabled.** The site's visual language (motifs, tokens,
   components) cannot be replicated in Decap's generic preview iframe. Showing
   raw unstyled Markdown would misrepresent the design and confuse editors.
   The live site is the preview — saves take about a minute to go live.

2. **Editorial workflow: not enabled.** `editorial_workflow` turns every save
   into a pull request. For a 3-person team with no Git experience, this adds
   an opaque step ("why is my change not live?") without a matching benefit —
   there is nobody to review the PR. An accidental publish is fixed by editing
   again. **Recommendation: leave it off for now.** Enable it later if the team
   grows or a new editor is being trained — it is one line in `config.yml`.

3. **Media folder: `src/assets/photos/`.** This keeps uploads inside Astro's
   image pipeline (Sharp, AVIF/WebP, responsive `srcset`), which is what the
   design document's performance budget (§9) requires. The simpler alternative
   (`public/uploads/`) would bypass optimisation, break the duotone treatment
   (§4), and inflate mobile page weight. The `public_folder` in the CMS config
   is set to `/src/assets/photos` so Markdown references resolve correctly.

4. **JSON file collections.** Decap writes single-file JSON collections as
   `{ "key": [...] }` rather than a bare array. The Astro content config now
   accepts both shapes via a custom parser, so files edited by hand (bare array)
   and files edited via the CMS (wrapped) both build correctly.

### New environment variables

| Name | Required | Where |
|---|---|---|
| `GITHUB_OAUTH_CLIENT_ID` | Yes, for CMS login | Host dashboard |
| `GITHUB_OAUTH_CLIENT_SECRET` | Yes, for CMS login | Host dashboard (**encrypt**) |

Setup: create a GitHub OAuth App with the callback URL pointing at
`/api/callback` on your domain, then add the two values. See README.

---

## 5. Known limitations

- **Workshop dates go stale.** `upcoming.json` is filtered at build time against
  the build date, so past sessions disappear on the next deploy — but the list
  only shrinks. It needs topping up. If it empties, the Contact page shows a
  designed empty state rather than a blank grid.
- **The map points at Vadodara, not the studio.** A precise address was not in
  the brief. `mapSrc` in `src/pages/contact.astro` — change the `q=` value.
- **Resend sends from `onboarding@resend.dev`** until a domain is verified.
  Works immediately; looks better once swapped. See README.
- **The interim wordmark is type-based**, per §3.3, pending the real logo.
  Swapping it is a single component (`src/components/Logo.astro`).
- **No analytics.** Nothing was specified. Cloudflare Web Analytics is free,
  cookie-less and one dashboard toggle if you want it.
