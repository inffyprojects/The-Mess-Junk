/**
 * POST /api/newsletter — newsletter signup.
 *
 * Astro API route for the same reason as contact.ts — see the note there.
 * Behaviour lives in src/lib/enquiry.ts.
 */
import type { APIRoute } from 'astro';
import { handleNewsletter, type DeliveryEnv } from '../../lib/enquiry';

export const prerender = false;

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

  const { status, body } = await handleNewsletter(payload, readEnv());
  return json(body, status);
};
