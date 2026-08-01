/**
 * GitHub OAuth token exchange for Decap CMS.
 *
 * Decap's GitHub backend needs an OAuth proxy: the CMS redirects to GitHub's
 * authorize URL, GitHub redirects back to /api/callback with a code, and the
 * proxy exchanges it for an access token and postMessages it back to the
 * Decap window.
 *
 * This module holds the exchange logic and the HTML response. The per-platform
 * adapters in /api/ and /functions/api/ do only request/env unwrapping — the
 * same pattern as lib/enquiry.ts.
 */

export interface OAuthEnv {
  GITHUB_OAUTH_CLIENT_ID: string;
  GITHUB_OAUTH_CLIENT_SECRET: string;
}

/**
 * Builds the GitHub authorization redirect URL.
 * `scope=repo` is the minimum Decap needs to read/write content and open PRs.
 */
export function authorizeUrl(env: OAuthEnv): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_OAUTH_CLIENT_ID,
    scope: 'repo',
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

/**
 * Exchanges the OAuth code for a GitHub access token and returns the HTML
 * page that postMessages the token back to the Decap CMS window.
 *
 * Returns { status, body } — body is HTML, not JSON.
 */
export async function handleCallback(
  code: string,
  env: OAuthEnv,
): Promise<{ status: number; body: string; contentType: string }> {
  if (!code) {
    return {
      status: 400,
      body: 'Missing code parameter.',
      contentType: 'text/plain',
    };
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
    }),
  });

  if (!tokenRes.ok) {
    console.error('GitHub token exchange failed:', tokenRes.status);
    return {
      status: 502,
      body: 'Token exchange failed.',
      contentType: 'text/plain',
    };
  }

  const data = (await tokenRes.json()) as Record<string, string>;

  if (data.error) {
    console.error('GitHub OAuth error:', data.error, data.error_description);
    return {
      status: 400,
      body: `OAuth error: ${data.error_description || data.error}`,
      contentType: 'text/plain',
    };
  }

  const token = data.access_token;
  const provider = 'github';

  // Decap CMS listens for this exact postMessage shape on the opener window.
  const html = `<!doctype html>
<html>
<head><title>Authorising...</title></head>
<body>
<script>
(function() {
  var token = ${JSON.stringify(token)};
  var provider = ${JSON.stringify(provider)};

  var msg = "authorization:" + provider + ":success:" + JSON.stringify({ token: token, provider: provider });

  if (window.opener) {
    window.opener.postMessage(msg, window.location.origin);
    window.close();
  }
})();
</script>
</body>
</html>`;

  return { status: 200, body: html, contentType: 'text/html' };
}
