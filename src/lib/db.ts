/**
 * Neon data layer — every database read and write on the site.
 *
 * Pages never write SQL inline; they call the typed functions below. That keeps
 * the query surface small enough to actually review, and means the shape of a
 * row is defined in exactly one place.
 *
 * WHY THE HTTP DRIVER
 * `@neondatabase/serverless`'s `neon()` helper talks to Neon over HTTP rather
 * than holding a TCP connection. In a serverless setup there is no long-lived
 * process to own a connection pool, and a pool-per-invocation exhausts Neon's
 * connection limit under any real traffic. HTTP has no such problem and works
 * unchanged in Node and Edge runtimes.
 *
 * WHERE THIS RUNS
 * Public pages are prerendered, so these queries run at BUILD time on Vercel's
 * builder and their results are baked into static HTML — visitors never touch
 * the database. The admin pages are server-rendered and call the same functions
 * at request time. See astro.config.mjs.
 */
import { neon } from '@neondatabase/serverless';

/* ---------------------------------------------------------------------------
   Row types. Column names are snake_case in Postgres and camelCase here — the
   mapping happens in the SELECT aliases so the rest of the codebase never sees
   snake_case.
   --------------------------------------------------------------------------- */

export const CATEGORIES = [
  'kids',
  'teens',
  'adults',
  'corporate-colleges',
  'private-custom',
  'seasonal',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  kids: 'Kids',
  teens: 'Teens',
  adults: 'Adults',
  'corporate-colleges': 'Corporate & Colleges',
  'private-custom': 'Private / Custom',
  seasonal: 'Seasonal',
};

export const FAQ_GROUPS = ['booking', 'pricing', 'expect'] as const;
export type FaqGroup = (typeof FAQ_GROUPS)[number];

export interface Workshop {
  id: number;
  slug: string;
  title: string;
  summary: string;
  categories: Category[];
  priceFrom: number;
  ageGroup: string;
  duration: string;
  minParticipants: number | null;
  shot: string;
  takeaway: string | null;
  body: string;
  order: number;
  draft: boolean;
}

export interface FaqEntry {
  id: number;
  slug: string;
  question: string;
  group: FaqGroup;
  answer: string;
  order: number;
}

export interface PricingTier {
  id: number;
  slug: string;
  name: string;
  price: string;
  priceNote: string | null;
  summary: string;
  includes: string[];
  enquiryType: string;
  featured: boolean;
  order: number;
}

export interface WorkshopDate {
  id: number;
  /** ISO YYYY-MM-DD */
  date: string;
  time: string;
  workshop: string;
  seatsTotal: number;
  seatsLeft: number;
  priceFrom: number | null;
}

/* ---------------------------------------------------------------------------
   Connection
   --------------------------------------------------------------------------- */

/**
 * Resolved lazily rather than at module load. Astro imports this module while
 * collecting routes, and throwing at import time turns a missing env var into
 * an unreadable stack trace instead of the plain message below.
 */
function sql() {
  const url = import.meta.env.DATABASE_URL ?? process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add your Neon connection string to .env for local ' +
        'development, and to the Vercel dashboard for deploys. See README.',
    );
  }

  return neon(url);
}

/* ---------------------------------------------------------------------------
   Reads
   --------------------------------------------------------------------------- */

/** Live workshops in display order. Drafts are excluded. */
export async function getWorkshops(): Promise<Workshop[]> {
  const rows = await sql()`
    SELECT id, slug, title, summary, categories,
           price_from AS "priceFrom", age_group AS "ageGroup", duration,
           min_participants AS "minParticipants", shot, takeaway, body,
           sort_order AS "order", draft
    FROM workshops
    WHERE draft = FALSE
    ORDER BY sort_order ASC, id ASC
  `;
  return rows as Workshop[];
}

/** Every workshop including drafts — admin listings only. */
export async function getAllWorkshops(): Promise<Workshop[]> {
  const rows = await sql()`
    SELECT id, slug, title, summary, categories,
           price_from AS "priceFrom", age_group AS "ageGroup", duration,
           min_participants AS "minParticipants", shot, takeaway, body,
           sort_order AS "order", draft
    FROM workshops
    ORDER BY sort_order ASC, id ASC
  `;
  return rows as Workshop[];
}

export async function getWorkshop(id: number): Promise<Workshop | null> {
  const rows = await sql()`
    SELECT id, slug, title, summary, categories,
           price_from AS "priceFrom", age_group AS "ageGroup", duration,
           min_participants AS "minParticipants", shot, takeaway, body,
           sort_order AS "order", draft
    FROM workshops WHERE id = ${id}
  `;
  return (rows[0] as Workshop) ?? null;
}

export async function getFaq(): Promise<FaqEntry[]> {
  const rows = await sql()`
    SELECT id, slug, question, faq_group AS "group", answer, sort_order AS "order"
    FROM faq
    ORDER BY sort_order ASC, id ASC
  `;
  return rows as FaqEntry[];
}

export async function getFaqEntry(id: number): Promise<FaqEntry | null> {
  const rows = await sql()`
    SELECT id, slug, question, faq_group AS "group", answer, sort_order AS "order"
    FROM faq WHERE id = ${id}
  `;
  return (rows[0] as FaqEntry) ?? null;
}

export async function getPricingTiers(): Promise<PricingTier[]> {
  const rows = await sql()`
    SELECT id, slug, name, price, price_note AS "priceNote", summary, includes,
           enquiry_type AS "enquiryType", featured, sort_order AS "order"
    FROM pricing_tiers
    ORDER BY sort_order ASC, id ASC
  `;
  return rows as PricingTier[];
}

export async function getPricingTier(id: number): Promise<PricingTier | null> {
  const rows = await sql()`
    SELECT id, slug, name, price, price_note AS "priceNote", summary, includes,
           enquiry_type AS "enquiryType", featured, sort_order AS "order"
    FROM pricing_tiers WHERE id = ${id}
  `;
  return (rows[0] as PricingTier) ?? null;
}

/**
 * Upcoming sessions only.
 *
 * Filtered in SQL against the database's own clock rather than in JavaScript,
 * so a past session cannot appear because a build machine's timezone differs.
 * `to_char` keeps the value a plain YYYY-MM-DD string — the driver would
 * otherwise hand back a JS Date in the server's timezone, which can shift the
 * calendar day either side of midnight.
 */
export async function getUpcomingDates(): Promise<WorkshopDate[]> {
  const rows = await sql()`
    SELECT id, to_char(session_date, 'YYYY-MM-DD') AS date,
           session_time AS time, workshop,
           seats_total AS "seatsTotal", seats_left AS "seatsLeft",
           price_from AS "priceFrom"
    FROM workshop_dates
    WHERE session_date >= CURRENT_DATE
    ORDER BY session_date ASC, id ASC
  `;
  return rows as WorkshopDate[];
}

/** Every date including past ones — admin listings only. */
export async function getAllDates(): Promise<WorkshopDate[]> {
  const rows = await sql()`
    SELECT id, to_char(session_date, 'YYYY-MM-DD') AS date,
           session_time AS time, workshop,
           seats_total AS "seatsTotal", seats_left AS "seatsLeft",
           price_from AS "priceFrom"
    FROM workshop_dates
    ORDER BY session_date DESC, id ASC
  `;
  return rows as WorkshopDate[];
}

export async function getDate(id: number): Promise<WorkshopDate | null> {
  const rows = await sql()`
    SELECT id, to_char(session_date, 'YYYY-MM-DD') AS date,
           session_time AS time, workshop,
           seats_total AS "seatsTotal", seats_left AS "seatsLeft",
           price_from AS "priceFrom"
    FROM workshop_dates WHERE id = ${id}
  `;
  return (rows[0] as WorkshopDate) ?? null;
}

/* ---------------------------------------------------------------------------
   Writes — admin panel only
   --------------------------------------------------------------------------- */

export type WorkshopInput = Omit<Workshop, 'id'>;

export async function createWorkshop(w: WorkshopInput): Promise<number> {
  const rows = await sql()`
    INSERT INTO workshops
      (slug, title, summary, categories, price_from, age_group, duration,
       min_participants, shot, takeaway, body, sort_order, draft)
    VALUES
      (${w.slug}, ${w.title}, ${w.summary}, ${w.categories as unknown as string[]},
       ${w.priceFrom}, ${w.ageGroup}, ${w.duration}, ${w.minParticipants},
       ${w.shot}, ${w.takeaway}, ${w.body}, ${w.order}, ${w.draft})
    RETURNING id
  `;
  return rows[0].id as number;
}

export async function updateWorkshop(id: number, w: WorkshopInput): Promise<void> {
  await sql()`
    UPDATE workshops SET
      slug = ${w.slug}, title = ${w.title}, summary = ${w.summary},
      categories = ${w.categories as unknown as string[]},
      price_from = ${w.priceFrom}, age_group = ${w.ageGroup}, duration = ${w.duration},
      min_participants = ${w.minParticipants}, shot = ${w.shot},
      takeaway = ${w.takeaway}, body = ${w.body},
      sort_order = ${w.order}, draft = ${w.draft}
    WHERE id = ${id}
  `;
}

export async function deleteWorkshop(id: number): Promise<void> {
  await sql()`DELETE FROM workshops WHERE id = ${id}`;
}

export type FaqInput = Omit<FaqEntry, 'id'>;

export async function createFaq(f: FaqInput): Promise<number> {
  const rows = await sql()`
    INSERT INTO faq (slug, question, faq_group, answer, sort_order)
    VALUES (${f.slug}, ${f.question}, ${f.group}, ${f.answer}, ${f.order})
    RETURNING id
  `;
  return rows[0].id as number;
}

export async function updateFaq(id: number, f: FaqInput): Promise<void> {
  await sql()`
    UPDATE faq SET
      slug = ${f.slug}, question = ${f.question}, faq_group = ${f.group},
      answer = ${f.answer}, sort_order = ${f.order}
    WHERE id = ${id}
  `;
}

export async function deleteFaq(id: number): Promise<void> {
  await sql()`DELETE FROM faq WHERE id = ${id}`;
}

export type PricingInput = Omit<PricingTier, 'id'>;

export async function createPricingTier(t: PricingInput): Promise<number> {
  const rows = await sql()`
    INSERT INTO pricing_tiers
      (slug, name, price, price_note, summary, includes, enquiry_type, featured, sort_order)
    VALUES
      (${t.slug}, ${t.name}, ${t.price}, ${t.priceNote}, ${t.summary},
       ${t.includes}, ${t.enquiryType}, ${t.featured}, ${t.order})
    RETURNING id
  `;
  return rows[0].id as number;
}

export async function updatePricingTier(id: number, t: PricingInput): Promise<void> {
  await sql()`
    UPDATE pricing_tiers SET
      slug = ${t.slug}, name = ${t.name}, price = ${t.price},
      price_note = ${t.priceNote}, summary = ${t.summary}, includes = ${t.includes},
      enquiry_type = ${t.enquiryType}, featured = ${t.featured}, sort_order = ${t.order}
    WHERE id = ${id}
  `;
}

export async function deletePricingTier(id: number): Promise<void> {
  await sql()`DELETE FROM pricing_tiers WHERE id = ${id}`;
}

export type DateInput = Omit<WorkshopDate, 'id'>;

export async function createDate(d: DateInput): Promise<number> {
  const rows = await sql()`
    INSERT INTO workshop_dates
      (session_date, session_time, workshop, seats_total, seats_left, price_from)
    VALUES (${d.date}, ${d.time}, ${d.workshop}, ${d.seatsTotal}, ${d.seatsLeft}, ${d.priceFrom})
    RETURNING id
  `;
  return rows[0].id as number;
}

export async function updateDate(id: number, d: DateInput): Promise<void> {
  await sql()`
    UPDATE workshop_dates SET
      session_date = ${d.date}, session_time = ${d.time}, workshop = ${d.workshop},
      seats_total = ${d.seatsTotal}, seats_left = ${d.seatsLeft}, price_from = ${d.priceFrom}
    WHERE id = ${id}
  `;
}

export async function deleteDate(id: number): Promise<void> {
  await sql()`DELETE FROM workshop_dates WHERE id = ${id}`;
}
