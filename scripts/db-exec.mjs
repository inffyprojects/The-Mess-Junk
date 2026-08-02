/**
 * Runs a .sql file against the database.
 *
 *   npm run db:schema              -- applies db/schema.sql
 *   node scripts/db-exec.mjs f.sql -- applies any file
 *
 * Uses node-postgres over a normal TCP connection rather than the app's HTTP
 * driver, because Neon's HTTP endpoint takes one statement per request and a
 * schema file is many — including `DO $$ ... $$` blocks that must arrive whole.
 * `pg` is a devDependency for exactly this reason; the site itself never uses it.
 */
import { readFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Load DATABASE_URL from .env without pulling in a dotenv dependency. */
if (!process.env.DATABASE_URL) {
  try {
    const env = await readFile(join(ROOT, '.env'), 'utf8');
    for (const line of env.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
      }
    }
  } catch {
    /* no .env — fall through to the check below */
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Put it in .env or the environment.');
  process.exit(1);
}

const file = resolve(ROOT, process.argv[2] ?? 'db/schema.sql');
const sql = await readFile(file, 'utf8');

/* `channel_binding=require` is a libpq option that node-postgres does not
   understand and will reject. TLS is still enforced by sslmode=require. */
const connectionString = url.replace(/[?&]channel_binding=require/, '');

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log(`Connected. Applying ${process.argv[2] ?? 'db/schema.sql'} ...`);

try {
  await client.query(sql);
  console.log('Applied successfully.\n');

  const { rows } = await client.query(`
    SELECT table_name,
           (SELECT count(*) FROM information_schema.columns c
             WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS columns
    FROM information_schema.tables t
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  console.log('Tables now in the database:');
  for (const r of rows) console.log(`  ${r.table_name.padEnd(16)} ${r.columns} columns`);
  console.log();
} catch (err) {
  console.error('\nFailed:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
