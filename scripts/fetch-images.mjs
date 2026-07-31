/**
 * Phase 1 imagery sourcing — design document §4.
 *
 * Pulls real, commercially-licensed photography for every image slot on the
 * site, crops each one to the fixed aspect ratio its slot expects (§4 Phase 2
 * shot list), and writes it into src/assets/photos/ where Astro's build
 * pipeline converts it to responsive AVIF/WebP.
 *
 * WHY OPENVERSE AND NOT UNSPLASH/PEXELS
 * The design doc names Unsplash/Pexels. Both now hard-require a registered API
 * key on every request (Unsplash returns 401/bot-challenge, Pexels returns 401),
 * and no key was supplied with this build. Openverse (openverse.org, run by
 * WordPress.org) needs no key, and filtering to `license=cc0,pdm` returns
 * public-domain-equivalent photos — no attribution obligation, commercial use
 * cleared. The images it serves for these queries come from StockSnap and
 * Rawpixel, i.e. the same class of stock library the doc was pointing at.
 *
 * TO SWITCH TO UNSPLASH LATER: replace `searchOpenverse()` below with a call to
 * https://api.unsplash.com/search/photos using the same SLOTS table. Every
 * search term in SLOTS is quoted verbatim from §4, so the queries carry over
 * unchanged. See README "Replacing Phase 1 stock imagery".
 *
 * The duotone/grain treatment described in §4 is deliberately NOT baked into
 * these files — it is applied in CSS (`.photo` in src/styles/global.css) so
 * that §8's duotone-to-full-colour hover crossfade is possible. These files
 * stay clean, correctly-cropped originals.
 *
 * Run:  npm run images:fetch
 * Safe to re-run; already-downloaded slots are skipped unless --force.
 */

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'src', 'assets', 'photos');
const MANIFEST = join(OUT_DIR, 'credits.json');
const FORCE = process.argv.includes('--force');

const API = 'https://api.openverse.org/v1/images/';

/**
 * Every image slot on the site.
 *
 * `query`  — search term, quoted verbatim from design doc §4 where possible
 * `ratio`  — fixed aspect ratio for the slot (§4 Phase 2: hero 16:9,
 *            gallery 1:1, founders 4:5, category cards 4:3)
 * `width`  — largest rendered width; Astro downscales from here
 * `alt`    — descriptive alt text (§10: describe what is shown, never a filename)
 */
const SLOTS = [
  // ---- Hero / general -----------------------------------------------------
  {
    name: 'hero-home',
    query: 'hands painting ceramic',
    ratio: [16, 9],
    width: 2000,
    alt: 'A pair of hands steadying a ceramic bowl on a workbench while painting a pattern onto its rim with a fine brush.',
  },
  {
    name: 'hero-about',
    query: 'art studio workshop table',
    fallbacks: ['artist studio interior', 'craft workshop studio', 'artist workbench tools'],
    ratio: [16, 9],
    width: 1800,
    alt: 'A long studio worktable strewn with brushes, jars and half-finished pieces, lit by daylight from a window at the far end.',
  },
  {
    name: 'hero-workshops',
    query: 'craft supplies top view',
    fallbacks: [
      'craft supplies flat lay',
      'art supplies table',
      'sewing craft materials',
      'art materials overhead',
      'craft table tools',
    ],
    ratio: [16, 9],
    // Deliberately below the 1800 "full-bleed" floor: this is a short banner
    // strip, not a full-viewport hero, so a 1600px source is plenty.
    width: 1600,
    alt: 'Craft materials laid out from above across a worktable — spools of thread, scissors, paper offcuts and pots of colour.',
  },
  {
    name: 'about-story',
    query: 'paint splatter close up',
    ratio: [4, 3],
    width: 1200,
    alt: 'A close crop of a paint-spattered work surface, layers of dried colour built up over many sessions.',
  },

  // ---- Workshop category cards (4:3) --------------------------------------
  {
    name: 'cat-kids',
    query: 'kids painting table craft',
    fallbacks: ['children painting', 'kids craft activity', 'child drawing colours'],
    ratio: [4, 3],
    width: 1000,
    alt: 'Children leaning over a shared craft table, absorbed in painting, with pots of colour and brushes between them.',
  },
  {
    name: 'cat-teens',
    query: 'children art class candid',
    ratio: [4, 3],
    width: 1000,
    alt: 'A candid moment in an art class — a young maker mid-brushstroke, concentrating on the work in front of them.',
  },
  {
    name: 'cat-adults',
    query: 'adults painting class group',
    fallbacks: ['painting class', 'art class easel', 'woman painting canvas'],
    ratio: [4, 3],
    width: 1000,
    alt: 'Adults seated around a table in a painting class, each working on their own canvas at their own pace.',
  },
  {
    name: 'cat-corporate',
    query: 'team building creative workshop',
    fallbacks: ['workshop group table', 'people crafting together', 'collaborative workshop'],
    ratio: [4, 3],
    width: 1000,
    alt: 'A team gathered around a table in a creative workshop, hands busy with materials as they work through a task together.',
  },
  {
    name: 'cat-college',
    query: 'macrame workshop hands',
    fallbacks: ['macrame knotting', 'weaving loom hands', 'students art workshop'],
    ratio: [4, 3],
    width: 1000,
    alt: 'Hands knotting cord into a macrame pattern, the half-finished piece hanging from a wooden dowel.',
  },
  {
    name: 'cat-private',
    query: 'clay pottery hands wheel',
    ratio: [4, 3],
    width: 1000,
    alt: 'Two clay-covered hands closing around a spinning pot on a potter’s wheel, water pooling at the base.',
  },

  // ---- Workshop cards (4:3) ----------------------------------------------
  {
    name: 'ws-pottery',
    query: 'pottery hands wheel',
    ratio: [4, 3],
    width: 1000,
    alt: 'A pot rising between wet hands on a turning wheel, clay ridges spiralling up the wall of the form.',
  },
  {
    name: 'ws-canvas',
    query: 'colorful pottery hands',
    ratio: [4, 3],
    width: 1000,
    alt: 'Freshly glazed ceramic pieces in bright colours being handled on a studio bench.',
  },
  {
    name: 'ws-resin',
    query: 'resin art pouring',
    fallbacks: ['resin art', 'epoxy pouring colours', 'acrylic pour painting'],
    ratio: [4, 3],
    width: 1000,
    alt: 'Tinted resin being poured across a flat panel, the colours spreading and marbling into one another.',
  },
  {
    name: 'ws-textile',
    query: 'colorful yarn texture',
    ratio: [4, 3],
    width: 1000,
    alt: 'A dense stack of yarn in saturated colours, fibres catching the light across the pile.',
  },
  {
    name: 'ws-paint',
    query: 'paint tubes flatlay',
    fallbacks: ['paint tubes', 'acrylic paint tubes', 'oil paint tube colours'],
    ratio: [4, 3],
    width: 1000,
    alt: 'Used paint tubes arranged flat on a surface, caps off and colour crusted around the openings.',
  },
  {
    name: 'ws-journal',
    query: 'scrapbook journal craft',
    fallbacks: ['scrapbooking', 'journal washi tape', 'paper craft collage'],
    ratio: [4, 3],
    width: 1000,
    alt: 'An open handmade journal surrounded by washi tape, cut paper and pens mid-project.',
  },
  {
    name: 'ws-candle',
    query: 'candle making workshop',
    ratio: [4, 3],
    width: 1000,
    alt: 'Poured candles setting in their containers beside a jug of melted wax and lengths of wick.',
  },
  {
    name: 'ws-print',
    query: 'block printing fabric',
    ratio: [4, 3],
    width: 1000,
    alt: 'A carved wooden block being pressed onto stretched fabric, leaving a repeating inked motif.',
  },

  // ---- Gallery / portfolio sneak-peek (1:1) -------------------------------
  {
    name: 'peek-1',
    query: 'paint brushes jar studio',
    fallbacks: ['paint brushes', 'brushes in jar', 'artist brushes close up'],
    ratio: [1, 1],
    width: 900,
    alt: 'Brushes standing in a jar of cloudy water on a studio shelf, handles stained from use.',
  },
  {
    name: 'peek-2',
    query: 'clay tools workbench',
    fallbacks: ['pottery tools', 'clay workbench', 'ceramic studio tools'],
    ratio: [1, 1],
    width: 900,
    alt: 'Pottery tools and wire cutters laid out on a workbench dusted with dried clay.',
  },
  {
    name: 'peek-3',
    query: 'colorful paint palette',
    ratio: [1, 1],
    width: 900,
    alt: 'A palette mid-session, colours mixed into one another and the surface worked over many times.',
  },
];

const ratioOf = ([w, h]) => w / h;

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Search Openverse for one query at one licence tier.
 *
 * Licence tiers are tried in order (see gatherCandidates): CC0/public-domain
 * first because it carries no obligations at all, then CC-BY, which is still
 * cleared for commercial use but needs a visible credit — those land on
 * /credits, linked from the footer. Nothing more restrictive than CC-BY is
 * ever requested, so no ShareAlike or NonCommercial image can enter the build.
 */
async function searchOpenverse(query, license) {
  const url = new URL(API);
  url.searchParams.set('q', query);
  url.searchParams.set('license', license);
  url.searchParams.set('page_size', '20');
  url.searchParams.set('mature', 'false');

  const res = await fetch(url, {
    headers: { 'User-Agent': 'the-mess-junk-site/1.0 (build-time image sourcing)' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Openverse ${res.status} for "${query}"`);
  const data = await res.json();
  return data.results ?? [];
}

const LICENSE_TIERS = ['cc0,pdm', 'by'];

/**
 * Widen outwards until the slot is filled: the §4 search term at the cleanest
 * licence tier first, then the slot's fallback phrasings, then the same ladder
 * again at the attribution tier. The §4 term always gets first refusal, so the
 * doc's art direction still drives what we end up with.
 */
async function gatherCandidates(slot) {
  const queries = [slot.query, ...(slot.fallbacks ?? [])];
  const out = [];
  const seen = new Set();

  for (const license of LICENSE_TIERS) {
    for (const q of queries) {
      let results = [];
      try {
        results = await searchOpenverse(q, license);
      } catch {
        continue;
      }
      for (const r of results) {
        if (!r.url || seen.has(r.url)) continue;
        seen.add(r.url);
        out.push(r);
      }
      // Enough to work with — stop widening and start downloading.
      if (out.length >= 12) return out;
    }
  }
  return out;
}

/**
 * Try candidates in rank order until one actually downloads and is big enough
 * to crop to the slot's ratio without upscaling. Stock CDNs 404 often enough
 * that a single-candidate fetch is not reliable.
 */
async function downloadBest(candidates, minWidth) {
  for (const c of candidates) {
    const src = c.url;
    if (!src) continue;
    try {
      const res = await fetch(src, {
        headers: { 'User-Agent': 'the-mess-junk-site/1.0' },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buf).metadata();
      // Full-bleed slots need real pixels; card slots can accept less rather
      // than go unfilled. Never accept something we'd have to upscale badly.
      const floor = minWidth >= 1800 ? 1400 : 800;
      if (!meta.width || meta.width < floor) continue;
      return { buf, meta, credit: c };
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let credits = {};
  if (await exists(MANIFEST)) {
    credits = JSON.parse(await readFile(MANIFEST, 'utf8'));
  }

  const failures = [];

  for (const slot of SLOTS) {
    const outPath = join(OUT_DIR, `${slot.name}.jpg`);

    if (!FORCE && (await exists(outPath)) && credits[slot.name]) {
      console.log(`  skip  ${slot.name} (already downloaded)`);
      continue;
    }

    process.stdout.write(`  fetch ${slot.name.padEnd(16)} "${slot.query}" ... `);

    try {
      const results = await gatherCandidates(slot);
      const found = await downloadBest(results, slot.width);

      if (!found) {
        console.log('NO USABLE RESULT');
        failures.push(slot.name);
        continue;
      }

      const target = ratioOf(slot.ratio);
      const outW = Math.min(slot.width, found.meta.width);
      const outH = Math.round(outW / target);

      // `attention` picks the crop window with the most visual interest, which
      // for hands-and-materials shots keeps the subject rather than the
      // tabletop. Quality 82 mozjpeg is the source of truth; Astro re-encodes
      // to AVIF/WebP from here, so this file never ships to a browser.
      await sharp(found.buf)
        .rotate()
        .resize(outW, outH, { fit: 'cover', position: sharp.strategy.attention })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(outPath);

      credits[slot.name] = {
        query: slot.query,
        ratio: slot.ratio.join(':'),
        alt: slot.alt,
        title: found.credit.title ?? null,
        creator: found.credit.creator ?? null,
        license: found.credit.license ?? null,
        license_url: found.credit.license_url ?? null,
        source: found.credit.source ?? null,
        foreign_landing_url: found.credit.foreign_landing_url ?? null,
      };

      console.log(`ok (${outW}x${outH}, ${found.credit.license})`);
    } catch (err) {
      console.log(`FAILED — ${err.message}`);
      failures.push(slot.name);
    }
  }

  await writeFile(MANIFEST, JSON.stringify(credits, null, 2) + '\n', 'utf8');

  console.log(`\nManifest written to ${MANIFEST}`);
  if (failures.length) {
    console.log(`\nSlots still missing: ${failures.join(', ')}`);
    console.log('Re-run to retry, or drop a hand-picked JPG in at the same filename.');
    process.exitCode = 1;
  }
}

main();
