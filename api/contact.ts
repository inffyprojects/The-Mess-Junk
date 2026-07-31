/**
 * POST /api/contact — Vercel Serverless Function.
 *
 * Vercel deploys anything in this top-level `/api` directory as a function,
 * alongside Astro's static output. This is the Vercel counterpart to
 * functions/api/contact.ts (Cloudflare Pages) — both are thin adapters over
 * lib/enquiry.ts, so behaviour is identical wherever the site is hosted.
 *
 * Cloudflare reads env vars from the Worker's `env` argument; Vercel reads them
 * from `process.env`. That difference is the only reason two adapters exist.
 *
 * Set RESEND_API_KEY in the Vercel dashboard under
 * Project → Settings → Environment Variables. See README.
 */
import { handleEnquiry, type DeliveryEnv } from '../lib/enquiry';

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

  const { status, body } = await handleEnquiry(payload, env);
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
