/**
 * GET /api/auth — Cloudflare Pages Function.
 *
 * Redirects the browser to GitHub's OAuth authorize page. Decap CMS opens this
 * URL in a popup when the editor clicks "Login with GitHub".
 *
 * Counterpart: api/auth.ts (Vercel). All logic lives in lib/oauth.ts.
 */
import { buildAuthRedirect, type OAuthEnv } from '../../lib/oauth';

export const onRequestGet: PagesFunction<OAuthEnv> = async ({ request, env }) => {
  const oauthEnv: OAuthEnv = {
    GITHUB_OAUTH_CLIENT_ID: env.GITHUB_OAUTH_CLIENT_ID || '',
    GITHUB_OAUTH_CLIENT_SECRET: env.GITHUB_OAUTH_CLIENT_SECRET || '',
  };

  if (!oauthEnv.GITHUB_OAUTH_CLIENT_ID) {
    return new Response('GITHUB_OAUTH_CLIENT_ID is not set.', { status: 500 });
  }

  const { location, setCookie } = buildAuthRedirect(
    oauthEnv,
    new URL(request.url).protocol === 'https:',
  );

  /* Built by hand rather than with Response.redirect(), which does not allow
     extra headers — the CSRF state cookie has to ride along with the redirect. */
  return new Response(null, {
    status: 302,
    headers: { Location: location, 'Set-Cookie': setCookie },
  });
};
