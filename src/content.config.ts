import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

/**
 * Decap CMS file collections write JSON as { "key": [...] } rather than a
 * bare array. This parser accepts both shapes so the build works whether
 * the file was edited by hand (bare array) or via the CMS (wrapped object).
 */
function jsonArrayParser(key: string) {
  return (text: string) => {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray(data[key])) return data[key];
    return data;
  };
}

/**
 * Content collections — the site's editable content.
 *
 * There is no database and no CMS. Everything the client will realistically
 * need to change after launch (workshops, prices, FAQ answers, upcoming dates)
 * is a Markdown or JSON file under src/content/, validated by the schemas
 * below. Adding a workshop is adding a file; changing a price is changing a
 * line. See README for the per-task walkthrough.
 *
 * The schemas are strict on purpose: a typo in a category or a missing price
 * fails the build with a readable error rather than shipping a broken card.
 * If Decap CMS is layered on in Phase 2, these schemas map directly onto its
 * field definitions.
 */

/** The six filter tabs on /workshops (design doc §6.3) */
export const CATEGORIES = [
  'kids',
  'teens',
  'adults',
  'corporate-colleges',
  'private-custom',
  'seasonal',
] as const;

export const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  kids: 'Kids',
  teens: 'Teens',
  adults: 'Adults',
  'corporate-colleges': 'Corporate & Colleges',
  'private-custom': 'Private / Custom',
  seasonal: 'Seasonal',
};

const workshops = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/workshops' }),
  schema: z.object({
    title: z.string(),
    /** One line. Shown on the card under the title — keep it to ~90 chars. */
    summary: z.string(),
    /** Drives the filter tabs. A workshop can sit in more than one. */
    categories: z.array(z.enum(CATEGORIES)).min(1),
    /** "From ₹—" on the card (§6.3). Rupees, number only. */
    priceFrom: z.number().int().positive(),
    /** Shown as a chip, e.g. "8+ yrs" or "All ages" */
    ageGroup: z.string(),
    /** e.g. "2 hours" */
    duration: z.string(),
    /** Only set for private formats — renders the inline 20-participant note */
    minParticipants: z.number().int().positive().optional(),
    /** Key from src/data/shots.ts */
    shot: z.string(),
    /** What the participant walks out with */
    takeaway: z.string().optional(),
    /** Lower numbers sort first */
    order: z.number().default(50),
    /** Hide without deleting the file */
    draft: z.boolean().default(false),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({
    question: z.string(),
    /** The three clusters specified in §6.6 */
    group: z.enum(['booking', 'pricing', 'expect']),
    order: z.number().default(50),
  }),
});

const pricing = defineCollection({
  loader: file('./src/content/pricing/tiers.json', { parser: jsonArrayParser('tiers') }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    /** Free text so it can read "₹499 – ₹2,500 per person" or "Custom" */
    price: z.string(),
    priceNote: z.string().optional(),
    summary: z.string(),
    includes: z.array(z.string()).min(1),
    /** Pre-fills the enquiry form's Event type when the CTA is followed (§6.5) */
    enquiryType: z.string(),
    /** Visually lifts one tier without turning this into a SaaS pricing table */
    featured: z.boolean().default(false),
    order: z.number().default(50),
  }),
});

const dates = defineCollection({
  loader: file('./src/content/dates/upcoming.json', { parser: jsonArrayParser('dates') }),
  schema: z.object({
    id: z.string(),
    /** ISO date, YYYY-MM-DD */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
    /** e.g. "11:00 AM – 1:00 PM" */
    time: z.string(),
    /** Free text — should match a workshop title where there is one */
    workshop: z.string(),
    seatsTotal: z.number().int().positive(),
    seatsLeft: z.number().int().min(0),
    priceFrom: z.number().int().positive().optional(),
  }),
});

export const collections = { workshops, faq, pricing, dates };
