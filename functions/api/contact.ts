/**
 * POST /api/contact — Cloudflare Pages Function.
 *
 * Runs as a Worker alongside the static build on the Pages free tier
 * (100k requests/day). This file is a thin adapter: all behaviour lives in
 * lib/enquiry.ts, which the Vercel handler at /api/contact.ts also uses, so the
 * two hosts can never drift apart.
 *
 * Environment variables are set in the Cloudflare dashboard under
 * Settings → Environment variables. See README.
 */
import { handleEnquiry, type DeliveryEnv } from '../../lib/enquiry';

export const onRequestPost: PagesFunction<DeliveryEnv> = async ({ request, env }) => {
  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: 'Malformed request.' }, { status: 400 });
  }

  const { status, body } = await handleEnquiry(payload, env);
  return Response.json(body, { status });
};
