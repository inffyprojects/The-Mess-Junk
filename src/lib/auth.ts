/**
 * Admin authentication — one shared password, signed session cookie.
 *
 * Deliberately small. Three trusted people share one password; there are no
 * user accounts, no password reset flow and no roles, because none of that
 * would be used. If an audit trail is ever needed, that is the point to add a
 * users table rather than to grow this file.
 *
 * The password is never stored anywhere, in any form the site can read back.
 * `ADMIN_PASSWORD_HASH` holds a PBKDF2 hash; generate it with:
 *
 *   npm run admin:hash -- "your-password-here"
 *
 * Everything here uses Web Crypto so it runs unchanged in Node and on Vercel's
 * Edge runtime.
 */

const SESSION_COOKIE = 'mj_admin';

/** How long a sign-in lasts before the editor has to authenticate again. */
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

/** PBKDF2 work factor. High enough to make offline guessing expensive. */
const PBKDF2_ITERATIONS = 210_000;

const encoder = new TextEncoder();

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');

const fromHex = (hex: string) =>
  new Uint8Array((hex.match(/.{1,2}/g) ?? []).map((b) => parseInt(b, 16)));

/**
 * Compares two strings in time independent of how many leading characters
 * match. A plain `===` leaks that information through its timing, which is
 * enough to recover a signature byte by byte.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ---------------------------------------------------------------------------
   Password hashing
   --------------------------------------------------------------------------- */

/** Produces the `iterations:salt:hash` string stored in ADMIN_PASSWORD_HASH. */
export async function hashPassword(password: string, salt?: Uint8Array): Promise<string> {
  const s = salt ?? crypto.getRandomValues(new Uint8Array(16));

  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);

  const bits = await crypto.subtle.deriveBits(
    // `as BufferSource`: TypeScript types Uint8Array as possibly backed by a
    // SharedArrayBuffer, which BufferSource excludes. It never is here — the
    // array comes from getRandomValues or fromHex.
    { name: 'PBKDF2', salt: s as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );

  return `${PBKDF2_ITERATIONS}:${toHex(s.buffer as ArrayBuffer)}:${toHex(bits)}`;
}

/** Verifies a submitted password against a stored `iterations:salt:hash`. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [iterStr, saltHex, hashHex] = stored.split(':');
  if (!iterStr || !saltHex || !hashHex) return false;

  const iterations = Number(iterStr);
  if (!Number.isFinite(iterations) || iterations < 1) return false;

  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromHex(saltHex) as BufferSource, iterations, hash: 'SHA-256' },
    key,
    256,
  );

  return timingSafeEqual(toHex(bits), hashHex);
}

/* ---------------------------------------------------------------------------
   Session cookie
   --------------------------------------------------------------------------- */

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

/**
 * Builds a signed session token: `expiry.signature`.
 *
 * The cookie carries no identity because there is none to carry — a valid
 * signature *is* the authorisation. The expiry is inside the signed payload
 * rather than relying on the cookie's own Max-Age, which the client controls.
 */
export async function createSession(secret: string): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const signature = await sign(String(expiresAt), secret);
  return `${expiresAt}.${signature}`;
}

export async function verifySession(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false;

  const [expiresAt, signature] = token.split('.');
  if (!expiresAt || !signature) return false;

  const expected = await sign(expiresAt, secret);
  if (!timingSafeEqual(signature, expected)) return false;

  // Signature checked first, so an expired-but-valid token and a forged one are
  // indistinguishable in timing.
  return Number(expiresAt) > Math.floor(Date.now() / 1000);
}

/**
 * Options for `Astro.cookies.set()`.
 *
 * Returned as an options object rather than a `Set-Cookie` string on purpose:
 * a raw header appended to `Astro.response.headers` is LOST when the route
 * returns `Astro.redirect()`, because redirect() builds a fresh Response and
 * does not copy those headers across. Since signing in always ends in a
 * redirect, that silently dropped the session and made login impossible.
 * `Astro.cookies` is merged into whatever response the route returns.
 *
 * `SameSite=Lax` still sends the cookie on top-level navigation, which is all
 * the admin panel does. `Secure` is set only over HTTPS so local development
 * over plain HTTP keeps working.
 */
export function sessionCookieOptions(isSecure: boolean) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS,
    secure: isSecure,
  } as const;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

/* ---------------------------------------------------------------------------
   Config
   --------------------------------------------------------------------------- */

export interface AuthConfig {
  passwordHash: string;
  sessionSecret: string;
}

/**
 * Reads auth config, refusing to run in an insecure half-configured state.
 *
 * Missing config throws rather than defaulting to "allow": a deploy where
 * ADMIN_PASSWORD_HASH was forgotten must fail closed, not publish an admin
 * panel that anyone can walk into.
 */
export function getAuthConfig(): AuthConfig {
  const passwordHash = import.meta.env.ADMIN_PASSWORD_HASH ?? process.env.ADMIN_PASSWORD_HASH;
  const sessionSecret = import.meta.env.SESSION_SECRET ?? process.env.SESSION_SECRET;

  if (!passwordHash) {
    throw new Error(
      'ADMIN_PASSWORD_HASH is not set. Generate one with `npm run admin:hash -- "your-password"` ' +
        'and add it to your environment. See README.',
    );
  }
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error(
      'SESSION_SECRET is missing or too short (needs 32+ characters). Generate one with ' +
        '`node -e "console.log(crypto.randomUUID()+crypto.randomUUID())"`. See README.',
    );
  }

  return { passwordHash, sessionSecret };
}
