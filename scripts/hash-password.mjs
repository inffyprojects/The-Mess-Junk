/**
 * Generates the value for ADMIN_PASSWORD_HASH.
 *
 *   npm run admin:hash -- "the password you want"
 *
 * Prints a PBKDF2 hash to paste into your environment variables. The password
 * itself is never written to disk by this script — but note it will be in your
 * shell history, so pick the password here and change it if that bothers you.
 *
 * Deliberately duplicates the hashing from src/lib/auth.ts rather than
 * importing it: this runs as a plain Node script with no Astro/Vite pipeline to
 * resolve `import.meta.env`. The two must stay in step — if you change the
 * iteration count or algorithm in auth.ts, change it here too.
 */
import { webcrypto as crypto } from 'node:crypto';

const PBKDF2_ITERATIONS = 210_000;

const password = process.argv[2];

if (!password) {
  console.error('\nUsage: npm run admin:hash -- "your-password-here"\n');
  process.exit(1);
}

if (password.length < 12) {
  console.error(
    `\nThat password is ${password.length} characters. Use at least 12 — this is the only ` +
      'thing standing between the internet and your content.\n',
  );
  process.exit(1);
}

const toHex = (buf) =>
  Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');

const salt = crypto.getRandomValues(new Uint8Array(16));

const key = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(password),
  'PBKDF2',
  false,
  ['deriveBits'],
);

const bits = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
  key,
  256,
);

const sessionSecret = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

console.log('\nAdd these to your environment (Vercel: Settings -> Environment Variables):\n');
console.log(`ADMIN_PASSWORD_HASH=${PBKDF2_ITERATIONS}:${toHex(salt.buffer)}:${toHex(bits)}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log('\nKeep both secret. Mark them as sensitive/encrypted in the dashboard.\n');
