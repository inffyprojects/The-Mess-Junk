/**
 * POST /api/newsletter — Vercel Serverless Function.
 *
 * Thin adapter over lib/enquiry.ts — see the note in api/contact.ts.
 */
import { handleNewsletter, type DeliveryEnv } from '../lib/enquiry';

/* Edge runtime: it takes the Web-standard Request/Response signature that
   lib/enquiry.ts is already written against, and needs no Node built-ins — the
   logic only uses fetch. This keeps the Vercel adapter shaped exactly like the
   Cloudflare one. Environment variables are available via process.env. */
export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', Allow: 'POST' },
    });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Malformed request.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const env: DeliveryEnv = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    SHEET_WEBHOOK_URL: process.env.SHEET_WEBHOOK_URL,
    CONTACT_TO: process.env.CONTACT_TO,
    BUTTONDOWN_API_KEY: process.env.BUTTONDOWN_API_KEY,
  };

  const { status, body } = await handleNewsletter(payload, env);
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
