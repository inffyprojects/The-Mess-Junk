/**
 * Schema + query verification, run against a real Postgres engine.
 *
 * Uses PGlite — the actual Postgres source compiled to WASM — so the schema,
 * the constraints and every query in src/lib/db.ts are exercised for real,
 * without needing a live Neon instance or network access. If this passes, the
 * SQL is valid Postgres; what it cannot prove is that the Neon *connection*
 * works, which needs a real DATABASE_URL.
 *
 * Run: npm run db:verify
 */
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let pass = 0;
let fail = 0;

function check(name, ok, detail = '') {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`);
  }
}

/** Asserts a statement is rejected by the database. */
async function mustReject(db, name, sql) {
  try {
    await db.exec(sql);
    check(name, false, 'was accepted but should have been rejected');
  } catch {
    check(name, true);
  }
}

const db = new PGlite();

console.log('\n=== schema ===');
const schema = await readFile(join(ROOT, 'db', 'schema.sql'), 'utf8');
await db.exec(schema);
check('db/schema.sql applies cleanly', true);

// Idempotency matters: the README tells the client they can re-run this.
await db.exec(schema);
check('schema is safe to re-run', true);

const tables = await db.query(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY table_name
`);
const names = tables.rows.map((r) => r.table_name);
check(
  'all four tables created',
  ['faq', 'pricing_tiers', 'workshop_dates', 'workshops'].every((t) => names.includes(t)),
  names.join(', '),
);

console.log('\n=== constraints ===');

await db.exec(`
  INSERT INTO workshops (slug, title, summary, categories, price_from, age_group, duration, shot, body)
  VALUES ('pottery', 'Pottery', 'Throw a pot.', ARRAY['adults','teens'], 1200, '14+ yrs', '2.5 hours', 'ws-pottery', 'Body text.');
`);
check('valid workshop inserts', true);

await mustReject(
  db,
  'rejects an unknown category',
  `INSERT INTO workshops (slug, title, summary, categories, price_from, age_group, duration, shot)
   VALUES ('bad', 'Bad', 'x', ARRAY['grown-ups'], 100, 'a', 'b', 'c')`,
);

await mustReject(
  db,
  'rejects empty categories',
  `INSERT INTO workshops (slug, title, summary, categories, price_from, age_group, duration, shot)
   VALUES ('bad2', 'Bad', 'x', ARRAY[]::TEXT[], 100, 'a', 'b', 'c')`,
);

await mustReject(
  db,
  'rejects a zero/negative price',
  `INSERT INTO workshops (slug, title, summary, categories, price_from, age_group, duration, shot)
   VALUES ('bad3', 'Bad', 'x', ARRAY['kids'], 0, 'a', 'b', 'c')`,
);

await mustReject(
  db,
  'rejects a duplicate slug',
  `INSERT INTO workshops (slug, title, summary, categories, price_from, age_group, duration, shot)
   VALUES ('pottery', 'Dup', 'x', ARRAY['kids'], 100, 'a', 'b', 'c')`,
);

await mustReject(
  db,
  'rejects an invalid FAQ group',
  `INSERT INTO faq (slug, question, faq_group, answer) VALUES ('q', 'Q?', 'nonsense', 'A')`,
);

await db.exec(`
  INSERT INTO workshop_dates (session_date, session_time, workshop, seats_total, seats_left)
  VALUES ('2026-08-08', '11:00 AM – 1:30 PM', 'Pottery', 8, 3);
`);
check('valid date inserts', true);

await mustReject(
  db,
  'rejects seats_left greater than seats_total',
  `INSERT INTO workshop_dates (session_date, session_time, workshop, seats_total, seats_left)
   VALUES ('2026-08-09', '10:00', 'Pottery', 5, 9)`,
);

await mustReject(
  db,
  'rejects an impossible calendar date',
  `INSERT INTO workshop_dates (session_date, session_time, workshop, seats_total, seats_left)
   VALUES ('2026-02-31', '10:00', 'Pottery', 5, 1)`,
);

console.log('\n=== updated_at trigger ===');
const before = await db.query(`SELECT updated_at FROM workshops WHERE slug = 'pottery'`);
await new Promise((r) => setTimeout(r, 25));
await db.exec(`UPDATE workshops SET title = 'Pottery & Wheel' WHERE slug = 'pottery'`);
const after = await db.query(`SELECT updated_at FROM workshops WHERE slug = 'pottery'`);
check(
  'updated_at advances on UPDATE',
  new Date(after.rows[0].updated_at) > new Date(before.rows[0].updated_at),
);

console.log('\n=== queries used by the site ===');

await db.exec(`
  INSERT INTO workshops (slug, title, summary, categories, price_from, age_group, duration, shot, sort_order, draft)
  VALUES ('hidden', 'Hidden', 'x', ARRAY['kids'], 500, 'a', 'b', 'c', 10, TRUE);

  INSERT INTO faq (slug, question, faq_group, answer, sort_order)
  VALUES ('how', 'How do I book?', 'booking', 'Message us.', 10);

  INSERT INTO pricing_tiers (slug, name, price, summary, includes, enquiry_type, featured, sort_order)
  VALUES ('public', 'Public Workshops', '₹499 – ₹2,500', 'Book a seat.',
          ARRAY['Materials','An artist'], 'Public workshop', TRUE, 10);

  INSERT INTO workshop_dates (session_date, session_time, workshop, seats_total, seats_left)
  VALUES (CURRENT_DATE - 30, 'past', 'Old session', 10, 0);
`);

const live = await db.query(`
  SELECT id, slug, title, categories, price_from AS "priceFrom",
         min_participants AS "minParticipants", sort_order AS "order", draft
  FROM workshops WHERE draft = FALSE ORDER BY sort_order ASC, id ASC
`);
check('getWorkshops excludes drafts', live.rows.length === 1 && live.rows[0].slug === 'pottery');
check(
  'categories round-trip as a JS array',
  Array.isArray(live.rows[0].categories) && live.rows[0].categories.includes('adults'),
  JSON.stringify(live.rows[0].categories),
);
check('NULL min_participants stays null', live.rows[0].minParticipants === null);
check('column aliases produce camelCase', live.rows[0].priceFrom === 1200);

const upcoming = await db.query(`
  SELECT id, to_char(session_date, 'YYYY-MM-DD') AS date, session_time AS time,
         workshop, seats_total AS "seatsTotal", seats_left AS "seatsLeft"
  FROM workshop_dates WHERE session_date >= CURRENT_DATE ORDER BY session_date ASC, id ASC
`);
check('getUpcomingDates hides past sessions', upcoming.rows.length === 1);
check(
  'date is a plain YYYY-MM-DD string, not a Date',
  typeof upcoming.rows[0].date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(upcoming.rows[0].date),
  String(upcoming.rows[0].date),
);

const tiers = await db.query(`
  SELECT slug, price_note AS "priceNote", includes, featured FROM pricing_tiers
`);
check('includes[] round-trips', Array.isArray(tiers.rows[0].includes) && tiers.rows[0].includes.length === 2);
check('optional price_note stays null', tiers.rows[0].priceNote === null);
check('booleans round-trip', tiers.rows[0].featured === true);

const faq = await db.query(`SELECT faq_group AS "group" FROM faq`);
check('faq group aliases correctly', faq.rows[0].group === 'booking');

console.log('\n=== cascade behaviour ===');
await db.exec(`
  INSERT INTO workshop_dates (session_date, session_time, workshop, workshop_id, seats_total, seats_left)
  VALUES ('2026-12-01', '10:00', 'Pottery', (SELECT id FROM workshops WHERE slug='pottery'), 5, 5);
`);
await db.exec(`DELETE FROM workshops WHERE slug = 'pottery'`);
const orphan = await db.query(`SELECT workshop_id, workshop FROM workshop_dates WHERE session_date = '2026-12-01'`);
check(
  'deleting a workshop nulls the link but keeps the date',
  orphan.rows.length === 1 && orphan.rows[0].workshop_id === null,
);

console.log(`\n${pass} passed, ${fail} failed\n`);
await db.close();
process.exit(fail === 0 ? 0 : 1);
