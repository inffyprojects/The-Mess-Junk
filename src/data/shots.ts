/**
 * Shot registry — the site's image slots.
 *
 * Every place a photograph will eventually go is declared here once, with the
 * aspect ratio and shot type it expects. Two things read from this file:
 *
 *   1. <ShotPanel> renders the designed "coming soon" composition for the slot
 *      (see design doc §4 — the client has opted to launch with no stock
 *      photography at all, so this treatment covers every slot, not just
 *      portfolio and testimonials).
 *   2. The README's shot list, which is what the client shoots against.
 *
 * Ratios are fixed now precisely so real photography drops in later with zero
 * layout rework (§4, Phase 2). To swap a slot to a real photo: add the file to
 * src/assets/photos/, set `photo` on the entry below, and <ShotPanel> renders
 * the image with the §4 duotone/grain treatment instead of the composition.
 */

export type Ratio = '16/9' | '4/3' | '1/1' | '4/5' | '3/2';

export interface Shot {
  /** Stable id — also the deterministic seed for the composition */
  id: string;
  ratio: Ratio;
  /** The photograph that belongs here. Doubles as the client's shot brief. */
  brief: string;
  /**
   * Alt text to use once a real photo is in place. Written now so whoever
   * swaps the image in does not have to invent it (§10 — describe the shot,
   * never the filename).
   */
  alt: string;
}

export const SHOTS = {
  // ---- Full-bleed heroes — 16:9 candid workshop-in-progress (§4) ----------
  'hero-home': {
    id: 'hero-home',
    ratio: '16/9',
    brief:
      'Wide candid of a workshop in progress — hands mid-craft in the foreground, the room and other makers soft behind. Shot at table height, not from above.',
    alt: 'A Mess Junk workshop in progress: hands working clay in the foreground with other makers at the table behind.',
  },
  'hero-about': {
    id: 'hero-about',
    ratio: '16/9',
    brief:
      'The studio itself, empty or nearly so — worktable, stools, shelves of materials, daylight. The room as a character.',
    alt: 'The Mess Junk studio in Vadodara: a long worktable set with materials, stools pulled in, shelves of supplies along the wall.',
  },
  'hero-workshops': {
    id: 'hero-workshops',
    ratio: '16/9',
    brief:
      'Overhead flat-lay of mixed materials across a worktable — clay, brushes, yarn, paper, resin. Everything the studio runs, in one frame.',
    alt: 'An overhead view of mixed workshop materials laid across a table: clay tools, brushes, yarn, paper and pots of colour.',
  },
  'hero-portfolio': {
    id: 'hero-portfolio',
    ratio: '16/9',
    brief:
      'A wall or shelf of finished pieces from past workshops, grouped tight. This is the "proof" shot.',
    alt: 'A shelf of finished pieces made by workshop participants, grouped together after a session.',
  },

  // ---- About ------------------------------------------------------------
  'about-story': {
    id: 'about-story',
    ratio: '4/3',
    brief:
      'Close crop of mess made well — a paint-spattered surface, a clay-dusted bench, a palette worked over many sessions.',
    alt: 'A close view of a well-used studio surface, layers of dried paint and clay dust built up over many sessions.',
  },

  // ---- Founder portraits — 4:5, natural light, in the studio (§4) --------
  'founder-aditi': {
    id: 'founder-aditi',
    ratio: '4/5',
    brief:
      'Portrait, 4:5, natural light, in the studio and mid-task — not a headshot backdrop. Hands doing something.',
    alt: 'Gini, Founder and Creative Director, at work in the Mess Junk studio.',
  },
  'founder-abhinav': {
    id: 'founder-abhinav',
    ratio: '4/5',
    brief: 'Portrait, 4:5, natural light, in the studio. Same treatment as the others.',
    alt: 'Abhinav Singh Rajput, Co-founder and Operations Lead, in the Mess Junk studio.',
  },
  'founder-khadija': {
    id: 'founder-khadija',
    ratio: '4/5',
    brief: 'Portrait, 4:5, natural light, in the studio. Same treatment as the others.',
    alt: 'Khadija Sulaimani, Co-founder and Creative Director, in the Mess Junk studio.',
  },

  // ---- Workshop category cards — 4:3, one hero material each (§4) --------
  'cat-kids': {
    id: 'cat-kids',
    ratio: '4/3',
    brief: 'Kids mid-workshop, hands and materials, candid — no posed group shot, no forced smiles.',
    alt: 'Children at a Mess Junk workshop table, absorbed in painting with pots of colour between them.',
  },
  'cat-teens': {
    id: 'cat-teens',
    ratio: '4/3',
    brief: 'A teen concentrating on their own piece. Crop in close on the work.',
    alt: 'A teenager at a Mess Junk workshop, concentrating on the piece in front of them.',
  },
  'cat-adults': {
    id: 'cat-adults',
    ratio: '4/3',
    brief: 'Adults at the table, relaxed, each on their own piece. Evening light if possible.',
    alt: 'Adults at a Mess Junk workshop, each working on their own piece at their own pace.',
  },
  'cat-corporate': {
    id: 'cat-corporate',
    ratio: '4/3',
    brief:
      'A team session — people genuinely working, sleeves up. Avoid anything that reads as a corporate stock photo.',
    alt: 'A company team at a Mess Junk team-building workshop, sleeves up and working with materials together.',
  },
  'cat-college': {
    id: 'cat-college',
    ratio: '4/3',
    brief: 'A college session, larger group, energy in the room. Wide enough to show scale.',
    alt: 'A college group at a Mess Junk workshop, a full table of students working on their pieces.',
  },
  'cat-private': {
    id: 'cat-private',
    ratio: '4/3',
    brief: 'A private booking — a birthday, a team, a family. The room set up for one group.',
    alt: 'A private Mess Junk workshop set up for one group, places laid out around the table.',
  },
  'cat-seasonal': {
    id: 'cat-seasonal',
    ratio: '4/3',
    brief: 'A festive/seasonal session — Diwali lanterns, holiday pieces, whatever the season brought.',
    alt: 'A seasonal Mess Junk workshop, festive pieces in progress across the table.',
  },

  // ---- Individual workshop cards — 4:3 ----------------------------------
  'ws-pottery': {
    id: 'ws-pottery',
    ratio: '4/3',
    brief: 'Hands on the wheel, clay rising. The single most recognisable craft shot you own.',
    alt: 'Clay-covered hands closing around a pot rising on the wheel at a Mess Junk pottery session.',
  },
  'ws-canvas': {
    id: 'ws-canvas',
    ratio: '4/3',
    brief: 'A canvas mid-painting, brush in frame, palette visible at the edge.',
    alt: 'A canvas part-way through a Mess Junk painting session, brush and loaded palette in frame.',
  },
  'ws-resin': {
    id: 'ws-resin',
    ratio: '4/3',
    brief: 'Tinted resin being poured, colours marbling. Shoot the pour, not the finished piece.',
    alt: 'Tinted resin being poured across a panel at a Mess Junk workshop, the colours marbling into one another.',
  },
  'ws-textile': {
    id: 'ws-textile',
    ratio: '4/3',
    brief: 'Yarn, cord or fabric close up — texture filling the frame.',
    alt: 'Yarn and cord in saturated colours filling the frame at a Mess Junk textile workshop.',
  },
  'ws-journal': {
    id: 'ws-journal',
    ratio: '4/3',
    brief: 'An open handmade journal surrounded by tape, cut paper and pens, mid-project.',
    alt: 'An open handmade journal surrounded by washi tape, cut paper and pens at a Mess Junk journaling session.',
  },
  'ws-candle': {
    id: 'ws-candle',
    ratio: '4/3',
    brief: 'Candles setting in their containers, wicks held straight, wax jug beside them.',
    alt: 'Freshly poured candles setting in their containers beside a jug of melted wax at a Mess Junk workshop.',
  },
  'ws-print': {
    id: 'ws-print',
    ratio: '4/3',
    brief: 'A carved block pressed onto fabric, the repeat starting to build across the cloth.',
    alt: 'A carved wooden block being pressed onto fabric at a Mess Junk block-printing workshop, the repeating motif building across the cloth.',
  },
  'ws-tufting': {
    id: 'ws-tufting',
    ratio: '4/3',
    brief: 'A tufting gun against the frame, yarn pile building on the backing.',
    alt: 'A tufting gun working yarn into a stretched backing at a Mess Junk rug-tufting workshop.',
  },

  // ---- Gallery / portfolio sneak-peek — 1:1 (§4) -------------------------
  'peek-1': {
    id: 'peek-1',
    ratio: '1/1',
    brief: 'Studio detail, square: brushes in a jar, tools on a bench, the shelf of glazes.',
    alt: 'A studio detail at Mess Junk: brushes standing in a jar of water on the bench.',
  },
  'peek-2': {
    id: 'peek-2',
    ratio: '1/1',
    brief: 'Studio detail, square: the material wall — clay, cord, paper, pigment.',
    alt: 'The materials shelf at the Mess Junk studio: clay, cord, paper and pigment stacked and ready.',
  },
  'peek-3': {
    id: 'peek-3',
    ratio: '1/1',
    brief: 'Studio detail, square: a palette or work surface worked over many sessions.',
    alt: 'A palette at the Mess Junk studio, colours mixed into one another over many sessions.',
  },
} as const satisfies Record<string, Shot>;

export type ShotId = keyof typeof SHOTS;

export const shotList = Object.values(SHOTS) as Shot[];
