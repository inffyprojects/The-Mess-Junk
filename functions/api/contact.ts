/**
 * POST /api/contact — enquiry form handler.
 *
 * A Cloudflare Pages Function: it runs as a Worker alongside the static build,
 * on the free tier (100k requests/day), with no server to pay for or maintain.
 *
 * It sends the enquiry to the studio's inbox via Resend (free tier, 3,000
 * emails/month). The API key is read from the RESEND_API_KEY environment
 * variable configured in the Cloudflare dashboard — never committed. If that
 * variable is absent, the function falls back to a Google Sheet webhook
 * (SHEET_WEBHOOK_URL) so an enquiry is never silently dropped while the client
 * is still setting Resend up. See README for both setup paths.
 */

interface Env {
  /** Resend API key — Cloudflare Pages → Settings → Environment variables */
  RESEND_API_KEY?: string;
  /** Optional fallback: an Apps Script webhook that appends to a Sheet */
  SHEET_WEBHOOK_URL?: string;
  /** Overrides the destination inbox without a redeploy */
  CONTACT_TO?: string;
}

const DEFAULT_TO = 'themessjunk@gmail.com';

/**
 * Resend requires the From domain to be verified. Until the client's own
 * domain is verified there, `onboarding@resend.dev` is Resend's own sending
 * address and works immediately on a fresh account — swap it for
 * `hello@<their-domain>` once DNS is set up. See README.
 */
const FROM = 'The Mess Junk Website <onboarding@resend.dev>';

/** Field limits — long enough for a real enquiry, short enough to bound abuse. */
const LIMITS: Record<string, number> = {
  name: 120,
  phone: 32,
  email: 200,
  eventType: 80,
  workshop: 120,
  date: 20,
  guests: 12,
  budget: 60,
  message: 4000,
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * Strips control characters and clamps length before the value reaches an
 * email body. Bare CR/LF inside a value is how header injection starts, so
 * they are neutralised here rather than at each point of use.
 */
const clean = (value: unknown, max: number): string => {
  if (typeof value !== 'string') return '';
  return value.replace(/\p{Cc}/gu, ' ').trim().slice(0, max);
};

/** Escapes HTML so an enquiry cannot inject markup into the notification email. */
const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'Malformed request.' }, 400);
  }

  /* Honeypot: the form renders a hidden `company` field that a human never
     sees. Anything that fills it is a bot. Return 200 so the bot believes it
     succeeded and does not retry with a different strategy. */
  if (clean(payload.company, 100)) {
    return json({ ok: true }, 200);
  }

  const fields = Object.fromEntries(
    Object.entries(LIMITS).map(([key, max]) => [key, clean(payload[key], max)]),
  ) as Record<keyof typeof LIMITS, string>;

  if (!fields.name || !fields.phone) {
    return json({ ok: false, error: 'Name and phone number are required.' }, 400);
  }

  const to = env.CONTACT_TO || DEFAULT_TO;

  const rows: [string, string][] = [
    ['Name', fields.name],
    ['Phone / WhatsApp', fields.phone],
    ['Email', fields.email || '—'],
    ['Event type', fields.eventType || '—'],
    ['Workshop', fields.workshop || '—'],
    ['Preferred date', fields.date || '—'],
    ['Guests', fields.guests || '—'],
    ['Budget', fields.budget || '—'],
  ];

  const text =
    `New workshop enquiry from the website\n\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
    `\n\nMessage:\n${fields.message || '—'}\n`;

  const html = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#17173A;line-height:1.6">
      <h2 style="font-size:18px;margin:0 0 16px">New workshop enquiry</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">
        ${rows
          .map(
            ([k, v]) =>
              `<tr>
                 <td style="padding:6px 16px 6px 0;color:#5B5A78;vertical-align:top">${esc(k)}</td>
                 <td style="padding:6px 0;font-weight:600">${esc(v)}</td>
               </tr>`,
          )
          .join('')}
      </table>
      <p style="margin:20px 0 6px;color:#5B5A78;font-size:14px">Message</p>
      <p style="margin:0;white-space:pre-wrap;font-size:14px">${esc(fields.message || '—')}</p>
    </div>`;

  /* ---- Primary path: Resend ------------------------------------------- */
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,
          to: [to],
          subject: `Workshop enquiry — ${fields.name}${fields.workshop ? ` · ${fields.workshop}` : ''}`,
          /* So the studio can hit Reply and reach the enquirer directly, when
             they left an address. */
          reply_to: fields.email || undefined,
          text,
          html,
        }),
      });

      if (res.ok) return json({ ok: true }, 200);

      /* Fall through to the Sheet path rather than failing outright — a
         misconfigured key should not cost the client a booking. */
      console.error('Resend rejected the enquiry:', res.status, await res.text());
    } catch (err) {
      console.error('Resend request failed:', err);
    }
  }

  /* ---- Fallback path: Google Sheet webhook ----------------------------- */
  if (env.SHEET_WEBHOOK_URL) {
    try {
      const res = await fetch(env.SHEET_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, receivedAt: new Date().toISOString() }),
      });
      if (res.ok) return json({ ok: true, via: 'sheet' }, 200);
      console.error('Sheet webhook rejected the enquiry:', res.status);
    } catch (err) {
      console.error('Sheet webhook failed:', err);
    }
  }

  /* Neither path is configured or both failed. Tell the browser plainly — the
     form then offers the visitor a pre-filled WhatsApp link instead, so the
     enquiry still reaches the studio. */
  console.error('No delivery path configured: set RESEND_API_KEY or SHEET_WEBHOOK_URL.');
  return json({ ok: false, error: 'Enquiry could not be delivered.' }, 502);
};
