# Phase 2 handoff prompt — Decap CMS

Copy everything between the `---BEGIN---` and `---END---` markers into a fresh
Claude Code session opened in `d:\The Mess Junk`.

---BEGIN---

You are continuing work on an existing, already-deployed website. Do not
scaffold a new project and do not restructure what is there.

## The project

`The Mess Junk` — a creative art & craft workshop studio in Vadodara, Gujarat.
Marketing site, already built and live.

- **Stack:** Astro 5.12.9 (pinned) + Tailwind CSS **v3.4.17** (v3, not v4 —
  config lives in `tailwind.config.mjs`). Static output (`output: 'static'`),
  zero JS by default.
- **Repo:** https://github.com/inffyprojects/The-Mess-Junk — branch `main`.
- **Hosting:** currently **Vercel**. Cloudflare Pages is also fully wired up.
- **Local Node is v20.9.0.** `create-astro` and Wrangler v4 require Node 22 and
  will fail. Do not upgrade Node or the pinned deps without being asked.
- Two source-of-truth docs are in `Docs/`: the client's requirements
  questionnaire (`.docx`) and `TheMessJunk_Website_Design_Document.md` (the art
  direction). **The design document is authoritative for anything visual.**
- `BUILD_NOTES.md` at the repo root records decisions taken and open questions.
  `README.md` documents content editing, deployment and env vars. Read both
  before starting — they will answer most context questions.

## Your task

Build **Phase 2: a Git-based CMS (Decap CMS) at `/admin`**, so the client —
three non-technical people running a workshop studio — can add, edit and remove
workshops, prices, FAQ entries and upcoming workshop dates **without touching
Git or a code editor**.

Right now all content is Markdown and JSON files under `src/content/`, edited by
hand. That is a developer workflow. This phase puts a form-based admin panel on
top of the exact same files, so nothing about the build or the schemas changes —
Decap simply commits to the repo, and the host rebuilds.

Do not migrate content to a database or a hosted CMS. Git-based, free tier,
zero recurring cost is the whole point.

## What already exists (mirror these exactly — do not redesign the schemas)

Collections are defined and validated in `src/content.config.ts`. The CMS config
must match these field-for-field, or the build will start failing on content the
CMS produces.

**1. `workshops` — one Markdown file per workshop, `src/content/workshops/*.md`**

| Field | Type | Notes |
|---|---|---|
| `title` | string | required |
| `summary` | string | one line, ~90 chars, shown on the card |
| `categories` | array of enum | one or more of: `kids`, `teens`, `adults`, `corporate-colleges`, `private-custom`, `seasonal` |
| `priceFrom` | positive integer | rupees, digits only |
| `ageGroup` | string | e.g. `8+ yrs`, shown as a chip |
| `duration` | string | e.g. `2 hours` |
| `minParticipants` | positive integer | **optional** — only for private formats |
| `shot` | string | an id from `src/data/shots.ts` |
| `takeaway` | string | optional |
| `order` | number | default 50, lower sorts first |
| `draft` | boolean | default false, hides without deleting |
| *body* | Markdown | 2–3 short paragraphs |

**2. `faq` — one Markdown file per question, `src/content/faq/*.md`**
`question` (string), `group` (enum: `booking` \| `pricing` \| `expect`),
`order` (number, default 50), body = the answer.

**3. `pricing` — a single JSON array, `src/content/pricing/tiers.json`**
Objects with: `id`, `name`, `price` (free text, e.g. `"₹499 – ₹2,500"`),
`priceNote` (optional), `summary`, `includes` (array of strings, min 1),
`enquiryType` (string), `featured` (boolean, default false), `order` (number).

**4. `dates` — a single JSON array, `src/content/dates/upcoming.json`**
Objects with: `id`, `date` (`YYYY-MM-DD`, regex-validated), `time` (free text),
`workshop` (string, should match a workshop `title`), `seatsTotal` (positive
int), `seatsLeft` (int ≥ 0), `priceFrom` (positive int, optional).

Collections 3 and 4 are single files containing arrays, so in Decap they are
**file collections** using a `list` widget — not folder collections.

## Requirements

1. **Decap CMS at `/admin`** — `public/admin/index.html` + `public/admin/config.yml`.
   Pin the Decap version rather than floating on `^`.

2. **Authentication.** Decap's `git-gateway` backend is Netlify-only and will
   not work here. Use the **GitHub backend** with an OAuth proxy you implement
   as two endpoints in this repo:
   - `GET /api/auth` → redirects to GitHub's authorize URL
   - `GET /api/callback` → exchanges `?code` for an access token and
     `postMessage`s it back to the Decap window in the format Decap expects
   Read `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` from environment
   variables. **Never hardcode or commit them.** Follow the existing pattern in
   this repo: `lib/enquiry.ts` holds shared logic, with thin per-platform
   adapters in `api/` (Vercel, Edge runtime) and `functions/api/` (Cloudflare
   Pages). Do the same here so the CMS works on either host.

3. **Field-level help.** These users are not developers. Every field needs a
   `hint` written in plain language, and widgets should prevent mistakes rather
   than rely on the build failing: `select` with the fixed options for
   `categories` and `group`, `number` with `value_type: int` and a `min` for
   prices and seats, `date` with the correct format for `date`, `boolean` for
   `draft`/`featured`. Set sensible `default`s so a new entry starts valid.

4. **Previews.** Configure `collection.preview_path` where it makes sense so an
   editor can see the live page. Decap's default preview pane renders raw and
   off-brand; either register a minimal styled preview or disable the pane
   (`editor: { preview: false }`) rather than shipping something that
   misrepresents the design. Your call — say which you chose and why.

5. **Editorial workflow.** Consider enabling `publish_mode: editorial_workflow`
   (drafts become PRs). Recommend for or against it for a 3-person team that has
   never used Git, and explain the trade-off — it is safer but adds a step they
   may not understand.

6. **Images — decide and justify.** The site currently ships **no photography**
   by deliberate client decision (see `BUILD_NOTES.md` §2). Every image slot
   renders a designed motif panel via `src/components/ShotPanel.astro`, built to
   the exact aspect ratio the real photo will occupy. Real photos are coming from
   the client soon.
   There is a real tension to resolve: Astro only optimises images imported from
   `src/assets/`, but Decap uploads most naturally to `public/`. Pick one:
   - `media_folder: src/assets/photos` (keeps Astro's AVIF/WebP + `srcset`
     pipeline and the §4 duotone treatment, but needs the relative
     `public_folder` path to be exactly right), or
   - `media_folder: public/uploads` (simpler for the CMS, loses build-time
     optimisation and the mobile performance budget in the design doc §9).
   State the trade-off, pick the one that protects the performance budget if you
   can make it work, and update `ShotPanel` if needed.

7. **Documentation.** Add a **`Docs/CLIENT_GUIDE.md`** written for Aditi and the
   team — not for a developer. Cover: how to log in, how to add a workshop, how
   to change a price, how to add upcoming dates and update seats left, how to
   remove something for the season (`draft`), and what to expect after saving
   (a rebuild takes about a minute). Short sentences, no jargon, no emoji.
   Also update `README.md` (a Phase 2 / CMS section, and the new env vars) and
   `BUILD_NOTES.md`.

## Non-negotiable house rules

These are carried over from the original build. Breaking them is a regression.

- **No emoji anywhere in the UI** — not as icons, bullets or decoration.
  Icons come from `src/components/Icon.astro` (Lucide, one family) and nowhere
  else. Verify with a scan before you finish.
- **Design tokens are defined once** in `src/styles/global.css`, as RGB channel
  triplets (`--cobalt-rgb: 42 46 207`) with derived aliases (`--cobalt`).
  `tailwind.config.mjs` reads the triplets via `rgb(var(--x-rgb) / <alpha-value>)`.
  **Do not point Tailwind colours at the `var(--x)` aliases** — Tailwind v3
  cannot apply an alpha modifier to an opaque `var()` colour and silently drops
  the entire class, which previously caused dark-on-dark text across the footer,
  header and hero. If you add a colour, follow the triplet pattern.
- **Utilities referenced only inside a `<script>` are fragile** — Tailwind's
  scanner has to find them as bare strings. Prefer a semantic class in
  `global.css` toggled by JS, as `.header-scrolled` does.
- Do not add a client-side framework. The site ships ~4 KB of JS total; keep the
  admin panel's cost confined to `/admin`, which must not affect the public
  pages' bundle.
- Keep the existing code-comment style: explain *why*, especially where a
  non-obvious choice was made.

## Verify before you report done

Do not rely on the build succeeding as proof — several real bugs in this project
built cleanly and still shipped broken.

1. `npx astro build` completes, and `/admin` is present in `dist/`.
2. **Confirm the public pages did not regress.** Screenshot at least the home
   page and one interior page. Chrome is at
   `C:\Program Files\Google\Chrome\Application\chrome.exe`; use
   `--headless=new --screenshot`. Note: headless Chrome clamps its layout width
   to ~500px minimum, so to test true mobile (375–390px) render the page inside
   a fixed-width `<iframe>` in a wrapper HTML file — screenshotting at
   `--window-size=390` gives a misleading cropped result.
3. Confirm the CMS config parses and every collection resolves — an invalid
   `config.yml` fails silently in the browser with an unhelpful message.
4. Round-trip test the schemas: hand-write an entry in the exact shape Decap
   would produce for each of the four collections and confirm `astro build`
   still validates it. This is the highest-risk part of the task.
5. Confirm no secret is committed (`git status`, and check `.gitignore` covers
   any new local env file).

## Working style

Read `BUILD_NOTES.md` and `README.md` first. If something is genuinely
ambiguous — particularly the images decision in requirement 6, or editorial
workflow in requirement 5 — make the sensible call, state the assumption
clearly, and keep going rather than stopping to ask. Flag anything you could not
verify.

Known outstanding items unrelated to this task, for context only — do not fix
unless asked: the Resend email path has never been tested with a live API key;
the workshop names, prices and dates currently in `src/content/` are a
reconstruction from the client's brief and still need the client's review.

---END---
