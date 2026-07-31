# The Mess Junk — Website Design & Art Direction Document

**Companion to:** `Event_Management_Website_Requirements.docx`
**Purpose:** Hand this file to Claude Code alongside the requirements questionnaire. Together they are the complete brief — the questionnaire is *what* the client needs, this is *how it should look, feel, and be built* so the result reads as a considered, premium creative-studio site rather than a generic AI-generated template.
**Prepared:** 30 July 2026

> **Rule zero for the build:** no emoji used as content (🎨🖌️✨ etc.), no generic "AI clip-art" illustration packs, no purple-gradient-and-rocket-ship SaaS template look. Every visual either comes from real/curated photography or from custom-built SVG shapes drawn in this doc's motif language. If a section has no real content yet (portfolio, testimonials), it gets an intentionally designed "coming soon" state — never a placeholder image.

---

## 1. Brand Snapshot

| | |
|---|---|
| **Name** | The Mess Junk |
| **Tagline** | "Where making a Mess makes sense" |
| **What it is** | A creative workshop studio in Vadodara, Gujarat — hands-on art & craft sessions for kids, teens, adults, colleges, and corporates |
| **Founders** | Aditi Musalgaonkar (Founder & Creative Director), Abhinav Singh Rajput (Co-founder & Operations Lead), Khadija Sulaimani (Co-founder & Creative Director) |
| **Stage** | Pre-launch / brand-new (2026) — no logo yet, no portfolio photos yet, no testimonials yet |
| **Brand mood (client's own words)** | Playful, creative, nostalgic, bold, modern, artistic, colourful, community-focused, "slightly messy in a curated way," clean and premium UX |
| **Client likes** | Apple (clean layout, minimal, immersive visuals), Pinterest (visual discovery, browsing) |
| **Client dislikes** | Overcrowded pages, too much text, generic stock photos, outdated layouts, dull colour, confusing nav |
| **Primary CTA** | Book a workshop / WhatsApp enquiry |
| **Colours given** | Cobalt Blue `#2A2ECF` · White `#FFFFFF` · Bubblegum Pink `#E86FC4` · Off-White `#F8F5F0` |

This is the tension the whole design has to resolve: **"messy" as a brand word, but "clean and premium" as the actual UX requirement.** The answer is not a messy-*looking* site — it's a very clean, very confident layout (Apple's discipline) that contains bursts of colour, texture and craft-materials imagery (the "mess"), the way a well-organised art studio has paint everywhere but the shelving is immaculate.

---

## 2. Design Concept: "Curated Chaos"

Three reference points, translated into concrete site decisions:

| Inspiration | What we borrow | What we deliberately avoid |
|---|---|---|
| **Apple** | Huge confident whitespace, one idea per section, large type-led hero moments, generous full-bleed imagery, restrained motion | Apple's cold minimalism / greyscale — we keep it warm and colour-forward |
| **Pinterest** | Masonry/asymmetric grids for the gallery, a "discovery" browsing feel, image-first cards | Pinterest's infinite, cluttered feed — our grids stay curated and finite per page |
| **Y2K revival** (the brand's own "nostalgic" cue, and it happens to match the exact palette: cobalt + bubblegum + white is a classic late-90s/Y2K combo) | Glossy blob shapes, chunky rounded type, sparkle/star accents, grainy texture overlays, chrome-highlight buttons | Y2K clip-art (dolphins, flames, MSN-messenger icons), low-poly 3D renders, anything that reads "meme" rather than "studio" |
| **Fevicreate / kids-craft-kit sites** (competitor) | Nothing visually — flagged only as the look to *avoid*: cartoon mascots, primary-colour clip art, "kids app" energy | This is the #1 differentiator: Mess Junk must look like an adult-run design studio that kids also love, not a children's toy e-commerce site |
| **BookMyShow-style listing UX** (competitor reference) | The *pattern* of a clean card grid with date/price chips for browsing workshops | Its ticketing-app density — our version stays editorial and spacious |

**One-line creative direction:** *A design studio's website that happens to be covered in paint — not a paint company's website trying to look designed.*

---

## 3. Visual Identity System

### 3.1 Colour system

The four brand colours aren't quite enough to build a full interface (no neutral for body text, no tint/shade range, no room for a third "pop" accent). Extend them like this — flag the additions to the client for a quick sign-off, everything else is directly theirs:

```css
:root {
  /* Brand core — client-specified, do not alter */
  --cobalt:        #2A2ECF;
  --pink:           #E86FC4;
  --white:          #FFFFFF;
  --off-white:      #F8F5F0;

  /* Derived neutrals — for text/borders, keeps everything legible */
  --ink:            #17173A;  /* body text, headlines on light bg — NOT pure black, stays in the cobalt family */
  --ink-soft:       #5B5A78;  /* secondary text, captions */
  --line:           #E7E2D8;  /* dividers, card borders, on off-white */

  /* Tints — for section backgrounds, badges, hover states */
  --cobalt-10:      #E9E9FB;
  --cobalt-05:      #F4F4FD;
  --pink-10:        #FCE7F5;
  --pink-05:        #FDF3FA;

  /* Proposed third accent — CONFIRM WITH CLIENT before build.
     Needed for "sparkle"/highlight moments (badges, active states, the
     stray Y2K accent) so cobalt+pink aren't doing 100% of the work. */
  --acid-yellow:    #F5D949;  /* "paint-splatter yellow" — Y2K-appropriate, warm against cobalt/pink */

  /* Semantic (system use only, never brand-facing) */
  --success:        #2E9E6B;
  --error:           #D6455B;
}
```

**Usage rules (important for the build):**
- Pink (`#E86FC4`) is a **background/accent colour only** — it fails contrast for body text on white and for white text at small sizes. Use it for: section backgrounds, blobs, hover fills, badge backgrounds, card highlights.
- Cobalt is the **workhorse**: primary buttons, links, headline highlight-words, active nav state, icon strokes.
- Ink (`#17173A`), not pure black, is body copy — pure black would fight the warm off-white and feel cold/corporate.
- Off-white `#F8F5F0` is the default page background, not pure white — pure white is reserved for cards/panels that need to visually lift off the page.
- 60/30/10 balance: **60% off-white/white space, 30% cobalt, 10% pink+yellow accents.** This is what keeps "colourful" from tipping into "loud" — matches the Apple-restraint the client asked for.

### 3.2 Typography

No fonts exist in the brand yet, so this doc specifies them. Both are free, variable, and license-clear (Google Fonts):

- **Display / Headings — [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque)**
  A geometric grotesque with quirky, slightly bouncy letterforms — reads as modern *and* has just enough personality to carry "playful/nostalgic" without becoming a novelty font. Use the variable weight axis: 800 for hero headlines, 600 for section headers.
- **Body / UI — [Inter](https://fonts.google.com/specimen/Inter)**
  Does the "clean typography, premium UX" work the client explicitly asked for. Weights 400/500/600 only.
- **Accent / handwritten touch (used sparingly — labels, stamps, workshop tags, not paragraphs) — [Caveat](https://fonts.google.com/specimen/Caveat)**
  A marker-pen feel for small callouts like "Est. 2026," date-stamps on gallery cards, or a scribbled underline SVG beneath a headline word. This is the one deliberate "handmade" texture in an otherwise clean system — use it in under 5% of the page.

**Type scale (rem, 1rem = 16px):**

| Token | Size | Weight | Font | Use |
|---|---|---|---|---|
| `display-xl` | 4.5rem / 3rem mobile | 800 | Bricolage | Hero headline |
| `display-lg` | 3rem / 2.25rem mobile | 700 | Bricolage | Section titles |
| `display-md` | 2rem | 700 | Bricolage | Card/workshop titles |
| `body-lg` | 1.25rem | 400 | Inter | Intro paragraphs |
| `body-md` | 1rem | 400 | Inter | Default body |
| `body-sm` | 0.875rem | 500 | Inter | Captions, meta |
| `label` | 0.8125rem | 600, uppercase, tracked | Inter | Eyebrow labels, nav |
| `scribble` | 1.5rem | 500 | Caveat | Hand-tag accents only |

### 3.3 Logo (interim treatment)

Client's real logo is "in development" — do not wait on it or build a placeholder box/emoji. Build a **type-based interim wordmark** now that upgrades cleanly later:

- "the mess junk" set in Bricolage Grotesque 800, lowercase (matches the brand's casual voice), with the word "mess" rendered in `--pink` and the rest in `--ink`/`--white` depending on background.
- Optional: a small hand-drawn paint-splat SVG dot above the "j" in "junk" as the one custom mark — simple enough that swapping in the real logo later is a one-line change, not a rebuild.
- Favicon: the same splat mark alone, on cobalt.

### 3.4 Texture & motif library (the "mess," made premium)

Everything below is built as inline SVG or CSS — never raster clip-art, never emoji:

1. **Blob shapes** — 3–4 organic, hand-drawn-feel blob SVGs (like a paint puddle) in cobalt/pink/yellow at low opacity, used as background accents behind headlines and section breaks. Keep them large, soft-edged, and few — one or two per page max, not confetti.
2. **Grain overlay** — a subtle SVG turbulence-filter noise texture at ~3–4% opacity over colour blocks. This single move does more for "premium, not flat-vector" than anything else — it's what separates a Y2K-inspired site from a cheap Canva template.
3. **Sparkle/star accent** — one simple 4-point star SVG, used only next to CTAs or as a tiny "new" indicator. One shape, reused consistently, not a variety pack.
4. **Tape/torn-edge motif** — a washi-tape SVG corner accent on gallery/portfolio image cards, reinforcing "workshop wall" without literal clip-art scissors-and-glue icons.
5. **Marker underline** — a hand-drawn SVG squiggle underline (pairs with the Caveat accent font) beneath 1 keyword per hero headline.

Build all five as a small shared SVG component library (`/components/motifs/`) so they're reused consistently site-wide, not redrawn ad hoc per page.

### 3.5 Iconography

Use a single consistent line-icon set — **[Phosphor Icons](https://phosphoricons.com/)** (duotone or regular weight, stroke width 1.5–2px, colour = `--cobalt`) or **[Lucide](https://lucide.dev/)**. Never mix icon families, never use emoji as functional icons (no 📞 for phone, no 📍for location) — every icon in the same clean line style as Phosphor/Lucide.

---

## 4. Imagery Strategy — the core of "not vibe-coded"

This is the section that most determines whether the finished site looks real or looks like a template. The client has **zero photos today** ("launching soon," portfolio to be added post-workshop). That's a real constraint — plan around it in two phases.

### Phase 1 — Launch (no real photos yet)

**Do not use icon-emoji, cartoon illustration, or AI-generated "people painting" stock-photo-style renders as the primary imagery.** Instead:

- **Curated real photography from Unsplash/Pexels (free, high-res, commercially licensed).** Claude Code should pull actual photos via the Unsplash Source/API or Pexels API (both have free tiers, no cost) using tightly specific search terms so results feel intentional, not generic. Search terms to use per section:
  - Hero / general: `"hands painting ceramic"`, `"paint splatter close up"`, `"art studio workshop table"`, `"colorful pottery hands"`, `"macrame workshop hands"`, `"clay pottery hands wheel"`
  - Kids workshops: `"kids painting table craft"`, `"children art class candid"`
  - Corporate/team: `"team building creative workshop"`, `"adults painting class group"`
  - Materials/textures: `"paint tubes flatlay"`, `"craft supplies top view"`, `"colorful yarn texture"`
  - **Avoid:** any result that's obviously a staged corporate-stock-photo (forced smiles, lanyards, boardroom energy) — the filter is "would this look believable on a real indie studio's Instagram." Prioritise candid, cropped-in, hands-and-materials shots over posed group shots.
- **Consistent treatment so mismatched stock photos still feel like one brand:** apply a uniform subtle duotone/colour-grade overlay (cobalt shadows, warm off-white highlights) and the same crop ratio and corner-radius across every photo. This single technique is what makes curated stock read as "art directed" instead of "random images from the internet."
- Every photo gets a **grain overlay** (see 3.4) at low opacity to match the texture system, so photography and illustration sit in the same visual world.

### Phase 2 — Post-launch (real photography, once workshops run)

Design every image slot to a **fixed aspect ratio and shot-type** now, so the client's real photos drop in later with zero layout rework. Hand the client this shot list (include it in the site's admin/README, not on the public site):
- Hero: wide 16:9 candid workshop-in-progress shot
- Gallery cards: square 1:1, hands/materials/close detail, not posed group shots
- Founder photos: 4:5 portrait, natural light, in the studio (not a headshot-studio backdrop)
- Workshop category cards: 4:3, one clear "hero material" per category (clay, paint, resin, etc.)

### Custom illustration (where photography can't work — e.g., "how it works" steps)

Build simple **flat, geometric, brand-colour icon illustrations** (not cartoon figures, not emoji) using the same blob/motif shapes from §3.4 — e.g., a 3-step "how it works" strip uses three small abstract blob-with-icon compositions, not clip-art of a paintbrush emoji or a stock "3 steps" icon pack.

### "Coming soon" content states (portfolio & testimonials)

Since there's no portfolio or testimonials yet, design an honest, on-brand empty state instead of faking content or leaving a broken-looking gap:
- **Portfolio/Gallery:** a styled "First workshop drops [Month] — this wall is about to get messy" card with the blob/grain motif, sitting where the grid will populate. Not a grey placeholder box.
- **Testimonials:** skip the section entirely at launch rather than showing a placeholder — re-introduce it once 3–5 real quotes exist. Design the Home page section order (§8) so it degrades gracefully with testimonials absent.

---

## 5. Sitemap & Navigation

Based on the requirements doc, with one naming change flagged below.

```
Home
About Us
Workshops        ← renamed from "Services" to match brand voice/vocabulary
Portfolio         (Coming Soon state at launch)
Pricing
FAQ
Contact
```

**Assumption made:** the brief's "Services" page is renamed **"Workshops"** in nav and URL (`/workshops` not `/services`) — the client's entire questionnaire uses "workshop" as their operative word, never "service." Same page, better-fitting label; flag for client confirmation but proceed with it.

**Not included at launch** (per client's own notes in the brief): Blog/News (marked "No"), a standalone Testimonials page (marked "no" — folded into Home once content exists instead), Careers page (left ambiguous — see §11 Open Questions).

**Header:** logo left · nav center-right · "Book a Workshop" cobalt button + WhatsApp icon, always visible, right-aligned. Sticky on scroll, condenses to a slim bar after 80px scroll (Apple-style behaviour).

**Footer:** logo/tagline · quick links · contact (address, phone numbers, email) · social icons (Instagram primary, since a craft studio's real growth channel is Instagram — flag adding the Instagram feed integration ticked in the brief) · WhatsApp CTA repeated.

---

## 6. Page-by-Page Design Spec

### 6.1 Home

Goal: convert a first-time visitor into a WhatsApp enquiry or booking within one scroll-through — this is the site's hardest-working page.

1. **Hero** — full-bleed, one strong curated photo (hands mid-craft) with grain/duotone treatment, blob accent behind headline. Headline: the tagline itself, large, in Bricolage 800, with "Mess" underlined in the marker-squiggle motif. Subhead: one line on what Mess Junk is. Two CTAs: `Book a Workshop` (cobalt, primary) and `Chat on WhatsApp` (outline/ghost, pink accent on hover).
2. **What we do (workshop categories strip)** — 4–6 cards (Kids / Teens / Adults / Corporate / College / Private events), each a 4:3 photo + label, Pinterest-card style, linking into `/workshops`.
3. **Why Mess Junk (USP)** — the six USPs from the brief, but edited down to 3–4 punchy ones with a small custom motif icon each (not a 6-item wall of text — client explicitly dislikes "too much text").
4. **How it works** — 3-step strip (Pick a workshop → Check a date → Book via WhatsApp), custom flat illustration per step.
5. **Meet the founders** — 3 small portrait cards (once real photos exist; use the "coming soon" duotone placeholder treatment from §4 until then), one line of bio each.
6. **Community/social proof band** — Instagram feed embed (ticked in brief) once the account has content; until then, skip this band entirely rather than showing an empty grid.
7. **Final CTA band** — full-width cobalt block, white type, "Ready to make a mess?" + WhatsApp/Book buttons.

### 6.2 About Us

- Hero band: short brand story (2–3 lines from the brief) set large, editorial — lots of whitespace, one supporting photo, not a wall of text.
- Mission/vision statement as a pull-quote treatment (large Bricolage type, blob behind it).
- Founders section: 3 portrait cards with name, role, one-line bio (from brief section 2, Q15).
- "What makes us different" — the USP list, presented as a short numbered list with icons, not paragraphs.

### 6.3 Workshops (Services)

- Filter/category tabs at top: Kids · Teens · Adults · Corporate & Colleges · Private/Custom · Seasonal — mirrors the event types listed in the brief.
- Card grid below (BookMyShow-pattern, Mess-Junk-styled): each workshop card = image, title, short one-line description, age-group chip, "From ₹—" price tag, `Enquire` button. Cards are the interactive discovery layer — this is the Pinterest-browsing feeling the client asked for.
- Note on pricing display per the brief (Q24 + Q25 together): show a **starting-from price** on every card (they explicitly want "starting from ₹350" visible), but the CTA is always **"Request a Custom Quote"**, never a fixed checkout — matches their stated preference.
- Minimum-participant note (20 for private workshops) shown as a small inline note on relevant cards, not a scary disclaimer block.

### 6.4 Portfolio / Gallery

- Masonry grid (Pinterest-pattern), filterable by workshop type once populated.
- **Launch state:** the "coming soon" card described in §4, styled on-brand, sitting alone or paired with 2–3 "sneak peek" behind-the-scenes curated stock shots clearly framed as "the studio, pre-launch" rather than pretending to be finished work.

### 6.5 Pricing

- Not a rigid SaaS-style 3-tier pricing table (wrong tone for this business) — instead, a range-based, honest layout:
  - Public workshops: ₹499–₹2,500 per person (from the brief)
  - Private/group workshops: minimum 20 participants, custom pricing
  - Corporate/college: fully custom, "let's talk" framing
- Every tier ends in `Get a Custom Quote` → opens the enquiry form pre-filled with that category.
- Small FAQ-style clarifiers inline (what's included — premium materials, refreshments add-on, etc. from the brief's add-on list) rather than a separate dense table.

### 6.6 FAQ

- Accordion, grouped into 3 short clusters: Booking & Availability / Pricing & Group Size / What to Expect. Keep each answer 2–3 sentences max (matches the "not too much text" preference).

### 6.7 Contact

- Split layout: left = enquiry form (name, phone, event type, preferred date, guest count, budget, message — exactly per brief §9), right = contact details, WhatsApp button, and an embedded Google Map (Vadodara — ticked in brief).
- **Availability checker (brief §6, Q40 — "yes"):** build as a lightweight **date picker showing upcoming workshop dates with seats-left status**, sourced from a simple structured content file (JSON/CMS entry per workshop date) — not a live real-time booking-engine build in v1. Selecting a date pre-fills the enquiry form / WhatsApp message. This gets the "check availability" experience live without needing a backend booking system the client hasn't asked for or budgeted (see §9 tech notes).

---

## 7. Core Components

| Component | Spec |
|---|---|
| **Primary button** | Cobalt fill, white text, full pill radius, subtle glossy top-highlight gradient (Y2K "chrome button" cue, kept subtle), scales up 2–3% + shadow lift on hover |
| **Secondary/ghost button** | 1.5px cobalt or pink border, transparent fill, fills solid on hover |
| **Card** | White surface on off-white page bg, 16–20px radius, 1px `--line` border, soft shadow only on hover (flat/resting by default — avoid the "everything has a drop shadow" template look) |
| **Nav** | See §5. Mobile: full-screen overlay menu, large type, blob motif in background |
| **WhatsApp float button** | Bottom-right, fixed, cobalt circle (not the generic green WhatsApp badge — keep it on-brand, use the WhatsApp glyph in white on cobalt), gentle pulse animation on load only, not looping forever |
| **Form fields** | Off-white fill, 1px line border, cobalt border + subtle glow on focus, generous 48px min height for touch targets |
| **Badges/chips** | Pink-10 or yellow fill, ink text, pill shape, used for age-group/category tags |
| **Section divider** | Occasional blob shape bleeding across the seam between two sections instead of a hard straight line — a cheap, effective way to make the layout feel less "template-grid" |

---

## 8. Motion & Micro-interactions

Keep it restrained — Apple-influenced, not a motion showcase:
- Fade-up on scroll for section content (one consistent easing, ~400ms, staggered 60–80ms per card in a grid) — no bouncy/elastic easing, it'll fight the "premium" requirement.
- Image hover: slight scale (1.03–1.05) + duotone-to-full-colour crossfade — a nice reveal that reinforces the "curated mess" concept (colour bursts through on interaction).
- Button hover: lift + shadow, per §7.
- Blob shapes: very slow (20–30s loop) subtle drift/morph in the background of hero sections only — barely perceptible, adds life without being distracting.
- No: page-load spinners with logos, confetti bursts, parallax scroll gimmicks, typewriter-effect headlines. All of these read as "template effects library," the opposite of what's being asked for.

---

## 9. Technical Notes for the Build

- **Recommended stack:** Next.js (App Router) + Tailwind CSS. Reasoning: content here (workshops, pricing, gallery items) is structured and will grow — component-based React makes the card grids/filters in §6.3–6.4 straightforward, and Tailwind maps cleanly onto the token system in §3.1/3.2 as `tailwind.config` extensions (`colors.cobalt`, `fontFamily.display`, etc.). A plain static HTML/CSS/JS build is also viable if Claude Code prefers it for a faster v1 — the design tokens in this doc translate 1:1 to CSS custom properties either way.
- **Lightweight "CMS" for a pre-launch small business:** rather than standing up a full headless CMS, structure all editable content (workshops, prices, upcoming dates, FAQ) as JSON/MDX files in a `/content` folder with clear field names. This gives the client an update path later (via a simple admin, or a proper CMS swap-in) without over-building for a 3-person startup's day-one budget.
- **Forms/WhatsApp:** enquiry form submits to email (business address from brief) and generates a `wa.me` deep link with a pre-filled message for the WhatsApp CTA — no paid form-backend service needed for v1.
- **Images:** use Next.js `<Image>` (or equivalent lazy-loading/responsive `srcset`) for every photo — non-negotiable for a photography-forward design like this one, or performance will suffer badly on mobile.
- **Performance budget:** hero image ≤ 200KB (WebP/AVIF), Lighthouse performance ≥ 90 on mobile. A studio site that's slow to load undercuts the "premium" positioning immediately.

---

## 10. Responsive & Accessibility

- **Breakpoints:** mobile 375–767px (single column, stacked cards) · tablet 768–1023px (2-col grids) · desktop 1024px+ (3–4-col grids, full nav).
- Text contrast: body copy always `--ink` on `--off-white`/`--white`, never pink-on-white or cobalt-on-cobalt-tint for body text (see §3.1 rules).
- Touch targets ≥ 44px, form fields ≥ 48px height.
- All decorative SVG motifs get `aria-hidden="true"`; all real content images get descriptive alt text (not "image1.jpg" or "art workshop photo" — actually describe what's shown, since this is also what will carry the site's SEO given there's no blog).

---

## 11. Open Questions — confirm with client before/while building

1. **Careers page** — brief leaves this ambiguous (unchecked box, no note). Recommend leaving it out of v1 given a 3-person team; easy to add later.
2. **Blog/News** — brief's page-list says "No" but the features list separately ticks "blog/news section" with no note. Recommend: no blog at launch (matches the clearer "No" answer + client's own dislike of text-heavy sites); revisit once there's content to sustain it.
3. **Third accent colour** (`--acid-yellow` proposed in §3.1) — quick client sign-off needed, it's the one addition to their exact palette.
4. **Which phone number is the primary WhatsApp CTA** — three numbers are listed in the brief; pick one lead number for the floating WhatsApp button (others can live in the Contact page footer).
5. **Availability checker scope** — confirm the client's happy with the "static date list, not live booking engine" MVP described in §6.7 for v1.

---

## 12. Handoff Checklist for Claude Code

- [ ] Set up design tokens (colours, type scale, spacing, radius) as CSS variables / Tailwind config exactly per §3.1–3.2 before building any page.
- [ ] Build the shared motif SVG library (§3.4) as reusable components first — every page draws from it.
- [ ] Source Phase 1 imagery per the search terms in §4 before building page layouts, so components are built around real image dimensions, not lorem-picsum boxes.
- [ ] Build pages in this order: Home → Workshops → Pricing → Contact → About → FAQ → Portfolio (matches funnel priority — booking-path pages first).
- [ ] Implement the "coming soon" states (§4) for Portfolio and Testimonials — do not ship placeholder/lorem content in their place.
- [ ] Confirm the 5 open questions in §11 with the client where possible; where not possible, proceed with the stated recommendation and flag it clearly in a build README.
