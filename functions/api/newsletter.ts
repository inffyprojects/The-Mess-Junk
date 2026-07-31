/**
 * POST /api/newsletter — newsletter signup.
 *
 * The questionnaire ticks "Newsletter / email signup" (§9) without naming a
 * provider. Rather than commit the client to a mailing-list account before
 * they have anyone to mail, this reuses the same Pages Function + Resend
 * pattern as the enquiry form: a signup is emailed to the studio inbox and
 * added to a list by hand.
 *
 * That is the right call for a pre-launch studio expecting a handful of
 * signups a month, and it costs nothing. When the list outgrows it, point
 * BUTTONDOWN_API_KEY at a Buttondown account (free to 100 subscribers) and the
 * branch below starts using it instead — no front-end change required.
 * See BUILD_NOTES.md.
 */

interface Env {
  RESEND_API_KEY?: string;
  SHEET_WEBHOOK_URL?: string;
  CONTACT_TO?: string;
  /** Optional: switches signups to Buttondown once the client has an account */
  BUTTONDOWN_API_KEY?: string;
}

const DEFAULT_TO = 'themessjunk@gmail.com';
const FROM = 'The Mess Junk Website <onboarding@resend.dev>';

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * Deliberately permissive. The goal is to reject obvious junk, not to
 * adjudicate RFC 5322 — over-strict client-side email validation turns away
 * real subscribers with unusual but valid addresses.
 */
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let email = '';

  try {
    const body = (await request.json()) as { email?: unknown };
    email = typeof body.email === 'string' ? body.email.trim().slice(0, 200) : '';
  } catch {
    return json({ ok: false, error: 'Malformed request.' }, 400);
  }

  if (!looksLikeEmail(email)) {
    return json({ ok: false, error: 'That does not look like an email address.' }, 400);
  }

  /* ---- Preferred path once configured: Buttondown --------------------- */
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

      /* 201 created, or 409 when they are already subscribed — both are a
         success from the visitor's point of view, and telling someone they
         are "already on the list" is not information they need. */
      if (res.ok || res.status === 409) return json({ ok: true }, 200);
      console.error('Buttondown rejected the signup:', res.status, await res.text());
    } catch (err) {
      console.error('Buttondown request failed:', err);
    }
  }

  /* ---- Default path: notify the studio inbox via Resend ---------------- */
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
          to: [env.CONTACT_TO || DEFAULT_TO],
          subject: `Newsletter signup — ${email}`,
          text: `${email} signed up for workshop updates on ${new Date().toISOString()}.`,
        }),
      });
      if (res.ok) return json({ ok: true }, 200);
      console.error('Resend rejected the signup:', res.status, await res.text());
    } catch (err) {
      console.error('Resend request failed:', err);
    }
  }

  /* ---- Fallback: append to the Google Sheet --------------------------- */
  if (env.SHEET_WEBHOOK_URL) {
    try {
      const res = await fetch(env.SHEET_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'newsletter', email, receivedAt: new Date().toISOString() }),
      });
      if (res.ok) return json({ ok: true, via: 'sheet' }, 200);
    } catch (err) {
      console.error('Sheet webhook failed:', err);
    }
  }

  console.error('No delivery path configured: set RESEND_API_KEY or SHEET_WEBHOOK_URL.');
  return json({ ok: false, error: 'Signup could not be recorded.' }, 502);
};
