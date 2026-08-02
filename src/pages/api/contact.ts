/**
 * POST /api/contact — enquiry form handler.
 *
 * An Astro API route, NOT a file in a top-level /api directory.
 *
 * That distinction matters: once the project gained the Vercel adapter it
 * started emitting the Build Output API (.vercel/output), and Vercel then
 * serves ONLY what that output declares. The legacy top-level /api convention
 * is ignored, so endpoints written there fall through to the catch-all 404 —
 * silently, because a 404 on a form POST just looks like "the form is broken".
 * Routes under src/pages/api are compiled into the adapter's function and
 * routed properly.
 *
 * All the actual behaviour lives in src/lib/enquiry.ts.
 */
import type { APIRoute } from 'astro';
import { handleEnquiry, type DeliveryEnv } from '../../lib/enquiry';

export const prerender = false;

/**
 * Vercel exposes environment variables on process.env at runtime; Astro also
 * surfaces them on import.meta.env. Reading both keeps this working in
 * `astro dev`, in `astro preview` and on Vercel without special-casing.
 */
function readEnv(): DeliveryEnv {
  const env = import.meta.env as Record<string, string | undefined>;
  const proc = typeof process !== 'undefined' ? process.env : {};
  return {
    RESEND_API_KEY: env.RESEND_API_KEY ?? proc.RESEND_API_KEY,
    SHEET_WEBHOOK_URL: env.SHEET_WEBHOOK_URL ?? proc.SHEET_WEBHOOK_URL,
    CONTACT_TO: env.CONTACT_TO ?? proc.CONTACT_TO,
    BUTTONDOWN_API_KEY: env.BUTTONDOWN_API_KEY ?? proc.BUTTONDOWN_API_KEY,
  };
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'Malformed request.' }, 400);
  }

  const { status, body } = await handleEnquiry(payload, readEnv());
  return json(body, status);
};
