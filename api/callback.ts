/**
 * GET /api/callback — Vercel Edge Function.
 *
 * GitHub redirects here after the user authorises. Exchanges the code for an
 * access token and postMessages it back to the Decap CMS window.
 *
 * Counterpart: functions/api/callback.ts (Cloudflare Pages).
 * All logic lives in lib/oauth.ts.
 */
import { handleCallback, type OAuthEnv } from '../lib/oauth';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get('code') || '';

  const env: OAuthEnv = {
    GITHUB_OAUTH_CLIENT_ID: process.env.GITHUB_OAUTH_CLIENT_ID || '',
    GITHUB_OAUTH_CLIENT_SECRET: process.env.GITHUB_OAUTH_CLIENT_SECRET || '',
  };

  if (!env.GITHUB_OAUTH_CLIENT_ID || !env.GITHUB_OAUTH_CLIENT_SECRET) {
    return new Response('OAuth credentials are not configured.', { status: 500 });
  }

  const result = await handleCallback(code, env);
  return new Response(result.body, {
    status: result.status,
    headers: { 'Content-Type': result.contentType },
  });
}
