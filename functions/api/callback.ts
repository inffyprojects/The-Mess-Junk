/**
 * GET /api/callback — Cloudflare Pages Function.
 *
 * GitHub redirects here after the user authorises. Exchanges the code for an
 * access token and postMessages it back to the Decap CMS window.
 *
 * Counterpart: api/callback.ts (Vercel).
 * All logic lives in lib/oauth.ts.
 */
import { handleCallback, type OAuthEnv } from '../../lib/oauth';

interface Env {
  GITHUB_OAUTH_CLIENT_ID: string;
  GITHUB_OAUTH_CLIENT_SECRET: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';

  const oauthEnv: OAuthEnv = {
    GITHUB_OAUTH_CLIENT_ID: env.GITHUB_OAUTH_CLIENT_ID || '',
    GITHUB_OAUTH_CLIENT_SECRET: env.GITHUB_OAUTH_CLIENT_SECRET || '',
  };

  if (!oauthEnv.GITHUB_OAUTH_CLIENT_ID || !oauthEnv.GITHUB_OAUTH_CLIENT_SECRET) {
    return new Response('OAuth credentials are not configured.', { status: 500 });
  }

  const result = await handleCallback(code, oauthEnv);
  return new Response(result.body, {
    status: result.status,
    headers: { 'Content-Type': result.contentType },
  });
};
