/**
 * GET /api/auth — Vercel Edge Function.
 *
 * Redirects the browser to GitHub's OAuth authorize page. Decap CMS opens this
 * URL in a popup when the editor clicks "Login with GitHub".
 *
 * Counterpart: functions/api/auth.ts (Cloudflare Pages).
 * All logic lives in lib/oauth.ts.
 */
import { buildAuthRedirect, type OAuthEnv } from '../lib/oauth';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const env: OAuthEnv = {
    GITHUB_OAUTH_CLIENT_ID: process.env.GITHUB_OAUTH_CLIENT_ID || '',
    GITHUB_OAUTH_CLIENT_SECRET: process.env.GITHUB_OAUTH_CLIENT_SECRET || '',
  };

  if (!env.GITHUB_OAUTH_CLIENT_ID) {
    return new Response('GITHUB_OAUTH_CLIENT_ID is not set.', { status: 500 });
  }

  const { location, setCookie } = buildAuthRedirect(env, new URL(req.url).protocol === 'https:');

  /* Built by hand rather than with Response.redirect() because that helper
     does not allow additional headers, and the CSRF state cookie has to ride
     along with the redirect. */
  return new Response(null, {
    status: 302,
    headers: { Location: location, 'Set-Cookie': setCookie },
  });
}
