/**
 * Site-wide constants — business details, contact points, navigation.
 *
 * Everything here comes from the client's requirements questionnaire
 * (Event_Management_Website_Requirements.docx). One file so a phone number or
 * an address changes in exactly one place.
 *
 * No absolute origin is stored anywhere in this project — the client buys the
 * domain separately and points DNS at the Cloudflare Pages project, so every
 * internal link is root-relative and nothing here assumes a hostname.
 */

export const site = {
  name: 'The Mess Junk',
  tagline: 'Where making a Mess makes sense',
  /** Questionnaire Q14 */
  description:
    'A creative workshop studio in Vadodara welcoming all ages to come together, make a mess and create without fear.',
  established: 2026,
  city: 'Vadodara',
  region: 'Gujarat',
  country: 'India',
  addressLine: 'Vadodara, Gujarat, India',
  email: 'themessjunk@gmail.com',

  /**
   * Q10/Q11 list three numbers. The floating WhatsApp button and every CTA use
   * `primaryPhone`; the other two are listed on the Contact page.
   * See BUILD_NOTES.md, open question 4 — confirm this is the right lead line.
   */
  primaryPhone: '9601602885',
  otherPhones: ['8320415348', '9157383650'],

  /** India country code, no plus — the format wa.me expects */
  whatsappNumber: '919601602885',

  social: {
    instagram: 'https://instagram.com/themessjunk',
  },

  /** Q13 — the client has not fixed opening hours yet */
  hours: 'Workshop timings vary — message us for the current schedule',

  /**
   * UPI payment details.
   *
   * The site shows a QR so someone can pay a confirmed booking from any UPI
   * app. It is deliberately NOT a checkout: there is no amount baked in, no
   * order, and nothing is captured on the site. That matches the client's own
   * answer (Q24 — "request a custom quote") and the design document's rule
   * that the CTA is never a fixed checkout. The amount is agreed on WhatsApp
   * first and typed in by the payer.
   */
  upi: {
    /** Virtual Payment Address the money goes to */
    id: 'abhinavsingh2674@okhdfcbank',
    /** Name UPI apps display on the confirmation screen */
    payeeName: 'ABHINAV SINGH',
  },
} as const;

/**
 * Builds the UPI deep link that the QR encodes.
 *
 * `am` (amount) is intentionally omitted so the payer enters the agreed figure
 * — workshop prices vary per session and per group size, and a wrong
 * pre-filled amount is worse than none. `cu=INR` keeps apps from guessing.
 *
 * On a phone this same string works as an `href`, opening the UPI app directly,
 * which is why the QR panel also renders it as a tap-to-pay link.
 */
export function upiLink(note?: string): string {
  /*
    Built by hand rather than with URLSearchParams, which serialises a space as
    `+` (form encoding, not URI encoding). UPI apps read `pn` literally, so a
    URLSearchParams link shows the payee as "ABHINAV+SINGH" on the confirmation
    screen. encodeURIComponent gives %20, which every app decodes correctly.

    `pa` is left unencoded: a VPA is only ever alphanumerics, dots, hyphens,
    underscores and `@`, all legal in a query string, and this is the form real
    UPI QRs use.
  */
  const parts = [
    `pa=${site.upi.id}`,
    `pn=${encodeURIComponent(site.upi.payeeName)}`,
    'cu=INR',
  ];
  if (note) parts.push(`tn=${encodeURIComponent(note)}`);
  return `upi://pay?${parts.join('&')}`;
}

/**
 * Primary navigation — design doc §5.
 * "Services" is deliberately "Workshops": the client's questionnaire uses
 * "workshop" throughout and never once says "service" (see BUILD_NOTES.md).
 */
export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Workshops', href: '/workshops/' },
  { label: 'Pricing', href: '/pricing/' },
  { label: 'Portfolio', href: '/portfolio/' },
  { label: 'About', href: '/about/' },
  { label: 'FAQ', href: '/faq/' },
  { label: 'Contact', href: '/contact/' },
] as const;

/**
 * Builds a wa.me deep link with a pre-filled message.
 *
 * Used by every WhatsApp CTA on the site, including the availability checker,
 * which passes the selected date through so the client receives the enquiry
 * already knowing which session the visitor wants (§6.7).
 */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${site.whatsappNumber}`;
  const text =
    message ??
    `Hi The Mess Junk! I'd like to know more about your workshops.`;
  return `${base}?text=${encodeURIComponent(text)}`;
}

/** Formats an ISO date as e.g. "Sat, 15 Aug" */
export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...opts,
  });
}

/** ₹1,200 — Indian digit grouping */
export function formatPrice(rupees: number): string {
  return `₹${rupees.toLocaleString('en-IN')}`;
}
