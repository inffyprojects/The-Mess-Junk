/**
 * GET /api/callback — Cloudflare Pages Function.
 *
 * GitHub redirects here after the editor authorises. Exchanges the code for an
 * access token and hands it to the Decap CMS window.
 *
 * Counterpart: api/callback.ts (Vercel). All logic lives in lib/oauth.ts.
 */
import { handleCallback, clearStateCookie, type OAuthEnv } from '../../lib/oauth';

export const onRequestGet: PagesFunction<OAuthEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';

  const oauthEnv: OAuthEnv = {
    GITHUB_OAUTH_CLIENT_ID: env.GITHUB_OAUTH_CLIENT_ID || '',
    GITHUB_OAUTH_CLIENT_SECRET: env.GITHUB_OAUTH_CLIENT_SECRET || '',
  };

  if (!oauthEnv.GITHUB_OAUTH_CLIENT_ID || !oauthEnv.GITHUB_OAUTH_CLIENT_SECRET) {
    return new Response('OAuth credentials are not configured.', { status: 500 });
  }

  const isSecure = url.protocol === 'https:';
  const result = await handleCallback(code, state, request.headers.get('Cookie'), oauthEnv);

  return new Response(result.body, {
    status: result.status,
    headers: {
      'Content-Type': result.contentType,
      // The state cookie is single-use — expire it however this turned out.
      'Set-Cookie': clearStateCookie(isSecure),
    },
  });
};
