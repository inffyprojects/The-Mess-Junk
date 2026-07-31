/**
 * Enquiry + newsletter delivery logic, shared by both hosting targets.
 *
 * The site can be deployed to Cloudflare Pages or to Vercel. Each platform has
 * its own function signature and its own directory convention:
 *
 *   Cloudflare Pages  →  /functions/api/contact.ts   (Workers runtime)
 *   Vercel            →  /api/contact.ts             (Node runtime)
 *
 * Both are thin wrappers that unwrap the request, call into this file, and
 * write the response back in their platform's idiom. All the actual behaviour —
 * validation, sanitising, email composition, the Resend call and the Google
 * Sheet fallback — lives here exactly once, so the two hosts cannot drift
 * apart.
 *
 * This module depends only on `fetch`, which both runtimes provide natively.
 */

export interface DeliveryEnv {
  /** Resend API key. Set in the host's dashboard — never committed. */
  RESEND_API_KEY?: string;
  /** Optional fallback: an Apps Script webhook that appends to a Sheet. */
  SHEET_WEBHOOK_URL?: string;
  /** Overrides the destination inbox without a redeploy. */
  CONTACT_TO?: string;
  /** Optional: switches newsletter signups to a Buttondown list. */
  BUTTONDOWN_API_KEY?: string;
}

export interface Result {
  status: number;
  body: Record<string, unknown>;
}

const DEFAULT_TO = 'themessjunk@gmail.com';

/**
 * Resend requires the From domain to be verified. `onboarding@resend.dev` is
 * Resend's own address and works immediately on a fresh account — swap it for
 * `hello@<their-domain>` once DNS is set up. See README.
 */
const FROM = 'The Mess Junk Website <onboarding@resend.dev>';

/** Field limits — long enough for a real enquiry, short enough to bound abuse. */
const LIMITS = {
  name: 120,
  phone: 32,
  email: 200,
  eventType: 80,
  workshop: 120,
  date: 20,
  guests: 12,
  budget: 60,
  message: 4000,
} as const;

type Field = keyof typeof LIMITS;

/**
 * Strips control characters and clamps length before a value reaches an email
 * body. Bare CR/LF inside a value is how header injection starts, so they are
 * neutralised here rather than at each point of use.
 */
export const clean = (value: unknown, max: number): string => {
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

/**
 * Deliberately permissive. The goal is to reject obvious junk, not to
 * adjudicate RFC 5322 — over-strict validation turns away real subscribers
 * with unusual but valid addresses.
 */
export const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

async function sendViaResend(
  env: DeliveryEnv,
  subject: string,
  text: string,
  html?: string,
  replyTo?: string,
): Promise<boolean> {
  if (!env.RESEND_API_KEY) return false;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [env.CONTACT_TO || DEFAULT_TO],
        subject,
        reply_to: replyTo || undefined,
        text,
        html,
      }),
    });

    if (res.ok) return true;
    console.error('Resend rejected the request:', res.status, await res.text());
  } catch (err) {
    console.error('Resend request failed:', err);
  }
  return false;
}

async function sendViaSheet(env: DeliveryEnv, payload: Record<string, unknown>): Promise<boolean> {
  if (!env.SHEET_WEBHOOK_URL) return false;

  try {
    const res = await fetch(env.SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, receivedAt: new Date().toISOString() }),
    });
    if (res.ok) return true;
    console.error('Sheet webhook rejected the request:', res.status);
  } catch (err) {
    console.error('Sheet webhook failed:', err);
  }
  return false;
}

/**
 * Handles an enquiry-form submission.
 *
 * Returns a status and a JSON body; it never throws. A 502 means nothing was
 * delivered, which the front-end turns into a pre-filled WhatsApp link so the
 * enquiry still reaches the studio.
 */
export async function handleEnquiry(
  payload: Record<string, unknown>,
  env: DeliveryEnv,
): Promise<Result> {
  /* Honeypot: the form renders a hidden `company` field that a human never
     sees. Anything that fills it is a bot. Return 200 so the bot believes it
     succeeded and does not retry with a different strategy. */
  if (clean(payload.company, 100)) {
    return { status: 200, body: { ok: true } };
  }

  const fields = Object.fromEntries(
    (Object.keys(LIMITS) as Field[]).map((key) => [key, clean(payload[key], LIMITS[key])]),
  ) as Record<Field, string>;

  if (!fields.name || !fields.phone) {
    return { status: 400, body: { ok: false, error: 'Name and phone number are required.' } };
  }

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
    'New workshop enquiry from the website\n\n' +
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

  const subject = `Workshop enquiry — ${fields.name}${fields.workshop ? ` · ${fields.workshop}` : ''}`;

  if (await sendViaResend(env, subject, text, html, fields.email)) {
    return { status: 200, body: { ok: true } };
  }

  /* Fall through rather than failing outright — a misconfigured key should not
     cost the client a booking. */
  if (await sendViaSheet(env, fields)) {
    return { status: 200, body: { ok: true, via: 'sheet' } };
  }

  console.error('No delivery path configured: set RESEND_API_KEY or SHEET_WEBHOOK_URL.');
  return { status: 502, body: { ok: false, error: 'Enquiry could not be delivered.' } };
}

/** Handles a newsletter signup. Same contract as handleEnquiry. */
export async function handleNewsletter(
  payload: Record<string, unknown>,
  env: DeliveryEnv,
): Promise<Result> {
  const email = clean(payload.email, 200);

  if (!looksLikeEmail(email)) {
    return { status: 400, body: { ok: false, error: 'That does not look like an email address.' } };
  }

  if (env.BUTTONDOWN_API_KEY) {
    try {
      const res = await fetch('https://api.buttondown.email/v1/subscribers', {
        method: 'POST',
        headers: {
          Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email_address: email }),
      });

      /* 201 created, or 409 when already subscribed — both are a success from
         the visitor's point of view, and "you're already on the list" is not
         information they need. */
      if (res.ok || res.status === 409) return { status: 200, body: { ok: true } };
      console.error('Buttondown rejected the signup:', res.status, await res.text());
    } catch (err) {
      console.error('Buttondown request failed:', err);
    }
  }

  const sent = await sendViaResend(
    env,
    `Newsletter signup — ${email}`,
    `${email} signed up for workshop updates on ${new Date().toISOString()}.`,
  );
  if (sent) return { status: 200, body: { ok: true } };

  if (await sendViaSheet(env, { type: 'newsletter', email })) {
    return { status: 200, body: { ok: true, via: 'sheet' } };
  }

  console.error('No delivery path configured: set RESEND_API_KEY or SHEET_WEBHOOK_URL.');
  return { status: 502, body: { ok: false, error: 'Signup could not be recorded.' } };
}
