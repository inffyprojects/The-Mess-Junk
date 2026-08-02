/**
 * Shared helpers for the admin routes.
 *
 * Every admin page is server-rendered (`prerender = false`) and calls
 * `requireSession` first. Anything that skips that check is public — so the
 * guard lives here, in one place, rather than being re-implemented per route.
 */
import type { APIContext } from 'astro';
import { verifySession, getAuthConfig, SESSION_COOKIE_NAME } from './auth';

/**
 * Returns a redirect Response if the request is not signed in, or null if it
 * is. Call it as the first statement of every admin route:
 *
 *   const denied = await requireSession(Astro);
 *   if (denied) return denied;
 */
export async function requireSession(ctx: APIContext): Promise<Response | null> {
  let config;
  try {
    config = getAuthConfig();
  } catch (err) {
    // Missing/short secrets fail closed, with the real reason in the logs
    // rather than a blank 500 for the editor.
    console.error(err);
    return new Response(
      'The admin panel is not configured. See README: ADMIN_PASSWORD_HASH and SESSION_SECRET.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  const token = ctx.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (await verifySession(token, config.sessionSecret)) return null;

  // `next` sends the editor back where they were heading after signing in.
  const next = encodeURIComponent(ctx.url.pathname + ctx.url.search);
  return ctx.redirect(`/admin/login/?next=${next}`, 302);
}

/** Trims a form value to a string, or '' when absent. */
export function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

/** Parses an integer form value, returning null when blank or invalid. */
export function int(form: FormData, key: string): number | null {
  const v = str(form, key);
  if (v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

/** Checkbox -> boolean. */
export function bool(form: FormData, key: string): boolean {
  return form.get(key) !== null;
}

/** Splits a textarea of one-item-per-line into a trimmed array. */
export function lines(form: FormData, key: string): string[] {
  return str(form, key)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * Builds a URL-safe slug. Used when creating a record so the editor never has
 * to think about slugs, while existing rows keep the slug they already have.
 */
export function slugify(input: string): string {
  // NFKD splits an accented letter into its base letter plus a combining mark;
  // dropping the marks turns "café" into "cafe" rather than "caf-". Filtered
  // by code point rather than a regex character class because the literal
  // combining characters are invisible in source and get mangled by editors.
  const stripped = Array.from(input.toLowerCase().normalize('NFKD'))
    .filter((ch) => {
      const c = ch.codePointAt(0) ?? 0;
      return c < 0x300 || c > 0x36f;
    })
    .join('');

  return (
    stripped
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || `item-${Date.now()}`
  );
}

/**
 * Turns a database error into something an editor can act on.
 *
 * The schema enforces the real invariants, so a violation surfaces here as a
 * Postgres error string. Translating the constraint names into plain language
 * is the difference between "fix your input" and "contact your developer".
 */
export function friendlyDbError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (message.includes('workshops_categories_not_empty')) {
    return 'Pick at least one category.';
  }
  if (message.includes('workshops_categories_valid')) {
    return 'One of those categories is not a real one. Use the checkboxes.';
  }
  if (message.includes('pricing_includes_not_empty')) {
    return 'Add at least one line to "What is included".';
  }
  if (message.includes('dates_seats_sane')) {
    return 'Seats left cannot be more than the total number of seats.';
  }
  if (message.includes('price_from')) {
    return 'The price needs to be a whole number above zero.';
  }
  if (message.includes('seats_total') || message.includes('seats_left')) {
    return 'Seat counts must be whole numbers, and seats left cannot be negative.';
  }
  if (message.includes('duplicate key') || message.includes('unique')) {
    return 'Something with that name already exists. Try a slightly different title.';
  }
  if (message.includes('faq_group')) {
    return 'Choose one of the three FAQ sections.';
  }
  if (message.includes('DATABASE_URL')) {
    return 'The site cannot reach the database. Check DATABASE_URL in the Vercel settings.';
  }

  console.error('Unmapped database error:', message);
  return 'That could not be saved. Check the fields and try again.';
}
