/**
 * GET /api/callback — Vercel Edge Function.
 *
 * GitHub redirects here after the editor authorises. Exchanges the code for an
 * access token and hands it to the Decap CMS window.
 *
 * Counterpart: functions/api/callback.ts (Cloudflare Pages).
 * All logic lives in lib/oauth.ts.
 */
import { handleCallback, clearStateCookie, type OAuthEnv } from '../lib/oauth';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';

  const env: OAuthEnv = {
    GITHUB_OAUTH_CLIENT_ID: process.env.GITHUB_OAUTH_CLIENT_ID || '',
    GITHUB_OAUTH_CLIENT_SECRET: process.env.GITHUB_OAUTH_CLIENT_SECRET || '',
  };

  if (!env.GITHUB_OAUTH_CLIENT_ID || !env.GITHUB_OAUTH_CLIENT_SECRET) {
    return new Response('OAuth credentials are not configured.', { status: 500 });
  }

  const isSecure = url.protocol === 'https:';
  const result = await handleCallback(code, state, req.headers.get('Cookie'), env);

  return new Response(result.body, {
    status: result.status,
    headers: {
      'Content-Type': result.contentType,
      // The state cookie is single-use — expire it however this turned out.
      'Set-Cookie': clearStateCookie(isSecure),
    },
  });
}
