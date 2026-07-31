/**
 * POST /api/newsletter — Cloudflare Pages Function.
 *
 * Thin adapter over lib/enquiry.ts — see the note in contact.ts.
 */
import { handleNewsletter, type DeliveryEnv } from '../../lib/enquiry';

export const onRequestPost: PagesFunction<DeliveryEnv> = async ({ request, env }) => {
  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: 'Malformed request.' }, { status: 400 });
  }

  const { status, body } = await handleNewsletter(payload, env);
  return Response.json(body, { status });
};
