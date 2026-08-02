/**
 * One-time migration: src/content/ files -> Neon.
 *
 * Reads the Markdown and JSON that used to be the site's source of truth and
 * inserts it into the database. Run once, after applying db/schema.sql:
 *
 *   npm run db:migrate
 *
 * Idempotent: every insert is ON CONFLICT (slug) DO UPDATE, so re-running
 * refreshes rows rather than duplicating them. Nothing is deleted — a row you
 * created in the admin panel is never clobbered by a stale file.
 *
 * The content files are kept in the repo after migrating as a plain-text
 * backup. They are no longer read by the site.
 */
import { neon } from '@neondatabase/serverless';
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/* Content was moved out of src/ when the site switched to the database.
   These files are the migration source and remain as a plain-text backup. */
const CONTENT = join(ROOT, '_content-backup', 'content');

/* Load DATABASE_URL from .env without a dotenv dependency. */
if (!process.env.DATABASE_URL) {
  try {
    const env = await readFile(join(ROOT, '.env'), 'utf8');
    for (const line of env.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  } catch {
    /* no .env — the check below reports it */
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    'DATABASE_URL is not set.\n' +
      'Set it first, e.g.  DATABASE_URL="postgres://..." npm run db:migrate\n' +
      'or put it in a .env file (see .env.example).',
  );
  process.exit(1);
}
const sql = neon(url);

/**
 * Minimal YAML frontmatter parser.
 *
 * Only has to understand what this project's own files contain: strings,
 * numbers, booleans and single-line arrays. Pulling in a YAML dependency for a
 * script that runs once would be the wrong trade.
 */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error('no frontmatter found');

  const [, head, body] = match;
  const data = {};

  for (const line of head.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!m) continue;

    const [, key] = m;
    let value = m[2].trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((v) => v.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else if (/^['"].*['"]$/.test(value)) {
      value = value.slice(1, -1);
    } else if (value === 'true' || value === 'false') {
      value = value === 'true';
    } else if (value !== '' && !Number.isNaN(Number(value))) {
      value = Number(value);
    }

    data[key] = value;
  }

  return { data, body: body.trim() };
}

let counts = { workshops: 0, faq: 0, pricing: 0, dates: 0 };

/* ---- Workshops ---------------------------------------------------------- */
const workshopFiles = (await readdir(join(CONTENT, 'workshops'))).filter((f) => f.endsWith('.md'));

for (const file of workshopFiles) {
  const raw = await readFile(join(CONTENT, 'workshops', file), 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const slug = basename(file, '.md');

  await sql`
    INSERT INTO workshops
      (slug, title, summary, categories, price_from, age_group, duration,
       min_participants, shot, takeaway, body, sort_order, draft)
    VALUES
      (${slug}, ${data.title}, ${data.summary}, ${data.categories},
       ${data.priceFrom}, ${data.ageGroup}, ${String(data.duration)},
       ${data.minParticipants ?? null}, ${data.shot}, ${data.takeaway ?? null},
       ${body}, ${data.order ?? 50}, ${data.draft ?? false})
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title, summary = EXCLUDED.summary,
      categories = EXCLUDED.categories, price_from = EXCLUDED.price_from,
      age_group = EXCLUDED.age_group, duration = EXCLUDED.duration,
      min_participants = EXCLUDED.min_participants, shot = EXCLUDED.shot,
      takeaway = EXCLUDED.takeaway, body = EXCLUDED.body,
      sort_order = EXCLUDED.sort_order, draft = EXCLUDED.draft
  `;
  counts.workshops++;
}

/* ---- FAQ ---------------------------------------------------------------- */
const faqFiles = (await readdir(join(CONTENT, 'faq'))).filter((f) => f.endsWith('.md'));

for (const file of faqFiles) {
  const raw = await readFile(join(CONTENT, 'faq', file), 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const slug = basename(file, '.md');

  await sql`
    INSERT INTO faq (slug, question, faq_group, answer, sort_order)
    VALUES (${slug}, ${data.question}, ${data.group}, ${body}, ${data.order ?? 50})
    ON CONFLICT (slug) DO UPDATE SET
      question = EXCLUDED.question, faq_group = EXCLUDED.faq_group,
      answer = EXCLUDED.answer, sort_order = EXCLUDED.sort_order
  `;
  counts.faq++;
}

/** The JSON files may be a bare array or { key: [...] } — accept both. */
async function readJsonList(path, key) {
  const parsed = JSON.parse(await readFile(path, 'utf8'));
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.[key])) return parsed[key];
  throw new Error(`${path}: expected an array or { ${key}: [...] }`);
}

/* ---- Pricing tiers ------------------------------------------------------ */
for (const tier of await readJsonList(join(CONTENT, 'pricing', 'tiers.json'), 'tiers')) {
  await sql`
    INSERT INTO pricing_tiers
      (slug, name, price, price_note, summary, includes, enquiry_type, featured, sort_order)
    VALUES
      (${tier.id}, ${tier.name}, ${tier.price}, ${tier.priceNote ?? null},
       ${tier.summary}, ${tier.includes}, ${tier.enquiryType},
       ${tier.featured ?? false}, ${tier.order ?? 50})
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name, price = EXCLUDED.price, price_note = EXCLUDED.price_note,
      summary = EXCLUDED.summary, includes = EXCLUDED.includes,
      enquiry_type = EXCLUDED.enquiry_type, featured = EXCLUDED.featured,
      sort_order = EXCLUDED.sort_order
  `;
  counts.pricing++;
}

/* ---- Dates -------------------------------------------------------------- */
/* No natural unique key here (the old `id` was just a convention), so these are
   matched on date + workshop to keep the migration re-runnable. */
for (const d of await readJsonList(join(CONTENT, 'dates', 'upcoming.json'), 'dates')) {
  const existing = await sql`
    SELECT id FROM workshop_dates WHERE session_date = ${d.date} AND workshop = ${d.workshop}
  `;

  if (existing.length) {
    await sql`
      UPDATE workshop_dates SET
        session_time = ${d.time}, seats_total = ${d.seatsTotal},
        seats_left = ${d.seatsLeft}, price_from = ${d.priceFrom ?? null}
      WHERE id = ${existing[0].id}
    `;
  } else {
    await sql`
      INSERT INTO workshop_dates
        (session_date, session_time, workshop, seats_total, seats_left, price_from)
      VALUES (${d.date}, ${d.time}, ${d.workshop}, ${d.seatsTotal}, ${d.seatsLeft},
              ${d.priceFrom ?? null})
    `;
  }
  counts.dates++;
}

/* ---- Link dates to workshops by title where they match ------------------ */
const linked = await sql`
  UPDATE workshop_dates d SET workshop_id = w.id
  FROM workshops w WHERE d.workshop = w.title AND d.workshop_id IS NULL
  RETURNING d.id
`;

console.log('\nMigrated into Neon:');
console.log(`  workshops      ${counts.workshops}`);
console.log(`  faq            ${counts.faq}`);
console.log(`  pricing tiers  ${counts.pricing}`);
console.log(`  dates          ${counts.dates}  (${linked.length} linked to a workshop)`);
console.log('\nDone. Run `npm run build` to rebuild the site from the database.\n');
