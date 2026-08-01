/**
 * GET /api/auth — Vercel Edge Function.
 *
 * Redirects the browser to GitHub's OAuth authorize page. Decap CMS opens
 * this URL when the editor clicks "Login with GitHub".
 *
 * Counterpart: functions/api/auth.ts (Cloudflare Pages).
 * All logic lives in lib/oauth.ts.
 */
import { authorizeUrl, type OAuthEnv } from '../lib/oauth';

export const config = { runtime: 'edge' };

export default async function handler(): Promise<Response> {
  const env: OAuthEnv = {
    GITHUB_OAUTH_CLIENT_ID: process.env.GITHUB_OAUTH_CLIENT_ID || '',
    GITHUB_OAUTH_CLIENT_SECRET: process.env.GITHUB_OAUTH_CLIENT_SECRET || '',
  };

  if (!env.GITHUB_OAUTH_CLIENT_ID) {
    return new Response('GITHUB_OAUTH_CLIENT_ID is not set.', { status: 500 });
  }

  return Response.redirect(authorizeUrl(env), 302);
}
