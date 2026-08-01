/**
 * GitHub OAuth proxy for Decap CMS.
 *
 * Decap's GitHub backend needs an OAuth proxy: the CMS opens a popup at
 * /api/auth, that redirects to GitHub, GitHub redirects back to /api/callback
 * with a code, and the proxy exchanges it for an access token and hands it to
 * the Decap window via postMessage.
 *
 * This module holds all the logic. The per-platform adapters in /api/ (Vercel)
 * and /functions/api/ (Cloudflare Pages) do only request/env unwrapping — the
 * same pattern as lib/enquiry.ts.
 */

export interface OAuthEnv {
  GITHUB_OAUTH_CLIENT_ID: string;
  GITHUB_OAUTH_CLIENT_SECRET: string;
}

/** Name of the short-lived cookie holding the CSRF state value. */
const STATE_COOKIE = 'mj_oauth_state';

/** Decap identifies the provider by this string in both postMessage payloads. */
const PROVIDER = 'github';

/** Cryptographically random, URL-safe state value. */
function randomState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Reads one cookie out of a raw Cookie header. */
export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}

/**
 * Builds the redirect to GitHub's authorize page, plus the Set-Cookie that
 * carries the CSRF state.
 *
 * The `state` parameter is what stops an attacker feeding a victim's browser
 * their own OAuth code (which would silently sign the editor into the
 * attacker's GitHub account). GitHub echoes state back to /api/callback, where
 * it must match this cookie or the exchange is refused.
 *
 * `scope=repo` is the minimum Decap needs to read and write content.
 */
export function buildAuthRedirect(
  env: OAuthEnv,
  isSecure: boolean,
): { location: string; setCookie: string } {
  const state = randomState();

  const params = new URLSearchParams({
    client_id: env.GITHUB_OAUTH_CLIENT_ID,
    scope: 'repo',
    state,
  });

  /* SameSite=Lax is deliberate: GitHub returns the user via a top-level GET
     navigation, which Lax permits, while still blocking cross-site POSTs.
     `Secure` is set only over HTTPS so the flow still works on http://localhost
     during development. */
  const attrs = [
    `${STATE_COOKIE}=${state}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=600',
    isSecure ? 'Secure' : '',
  ].filter(Boolean);

  return {
    location: `https://github.com/login/oauth/authorize?${params}`,
    setCookie: attrs.join('; '),
  };
}

/** Clears the state cookie once it has been used. */
export function clearStateCookie(isSecure: boolean): string {
  return [
    `${STATE_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    isSecure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

export interface CallbackResult {
  status: number;
  body: string;
  contentType: string;
}

const plain = (status: number, body: string): CallbackResult => ({
  status,
  body,
  contentType: 'text/plain; charset=utf-8',
});

/**
 * Exchanges the OAuth code for a GitHub access token and returns the HTML page
 * that hands the token back to the Decap window.
 */
export async function handleCallback(
  code: string,
  state: string,
  cookieHeader: string | null,
  env: OAuthEnv,
): Promise<CallbackResult> {
  if (!code) return plain(400, 'Missing code parameter.');

  const expected = readCookie(cookieHeader, STATE_COOKIE);
  if (!expected || !state || state !== expected) {
    console.error('OAuth state mismatch — refusing the token exchange.');
    return plain(400, 'Authorisation could not be verified. Please try signing in again.');
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
    }),
  });

  if (!tokenRes.ok) {
    console.error('GitHub token exchange failed:', tokenRes.status);
    return plain(502, 'Token exchange failed.');
  }

  const data = (await tokenRes.json()) as Record<string, string>;

  if (data.error) {
    console.error('GitHub OAuth error:', data.error, data.error_description);
    return plain(400, `OAuth error: ${data.error_description || data.error}`);
  }

  if (!data.access_token) {
    console.error('GitHub returned no access token.');
    return plain(502, 'GitHub did not return an access token.');
  }

  /*
    Decap's authenticator uses a TWO-STEP postMessage handshake, and skipping
    it is why a popup can close with the editor still sitting on the login
    screen: Decap only attaches its token listener AFTER it has seen the first
    message. The required order is
​
      1. popup  → opener :  "authorizing:github"
      2. opener → popup  :  (echo — Decap now listens for the token)
      3. popup  → opener :  "authorization:github:success:{...}"

    Posting the success message immediately, without waiting for step 2, means
    nothing is listening and the token is dropped on the floor.

    The token is injected as a JSON string literal, so it cannot break out of
    the surrounding script.
  */
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>Signing you in…</title></head>
<body>
<p style="font-family: system-ui, sans-serif; margin: 3rem; color: #17173A;">
  Signing you in… you can close this window if it does not close itself.
</p>
<script>
(function () {
  var token = ${JSON.stringify(data.access_token)};
  var provider = ${JSON.stringify(PROVIDER)};

  function receive(e) {
    if (e.data !== 'authorizing:' + provider) return;
    window.removeEventListener('message', receive, false);

    // Step 3: reply to the exact origin that completed the handshake.
    e.source.postMessage(
      'authorization:' + provider + ':success:' + JSON.stringify({ token: token, provider: provider }),
      e.origin
    );
  }

  window.addEventListener('message', receive, false);

  // Step 1. The opener's origin is not known until it answers, so this first
  // message is necessarily sent with a wildcard target. It carries no secret.
  if (window.opener) {
    window.opener.postMessage('authorizing:' + provider, '*');
  } else {
    document.body.textContent =
      'This page must be opened from the content manager sign-in button.';
  }
})();
</script>
</body>
</html>`;

  return { status: 200, body: html, contentType: 'text/html; charset=utf-8' };
}
