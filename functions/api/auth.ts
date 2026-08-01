/**
 * GET /api/auth — Cloudflare Pages Function.
 *
 * Redirects the browser to GitHub's OAuth authorize page. Decap CMS opens
 * this URL when the editor clicks "Login with GitHub".
 *
 * Counterpart: api/auth.ts (Vercel).
 * All logic lives in lib/oauth.ts.
 */
import { authorizeUrl, type OAuthEnv } from '../../lib/oauth';

interface Env {
  GITHUB_OAUTH_CLIENT_ID: string;
  GITHUB_OAUTH_CLIENT_SECRET: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const oauthEnv: OAuthEnv = {
    GITHUB_OAUTH_CLIENT_ID: env.GITHUB_OAUTH_CLIENT_ID || '',
    GITHUB_OAUTH_CLIENT_SECRET: env.GITHUB_OAUTH_CLIENT_SECRET || '',
  };

  if (!oauthEnv.GITHUB_OAUTH_CLIENT_ID) {
    return new Response('GITHUB_OAUTH_CLIENT_ID is not set.', { status: 500 });
  }

  return Response.redirect(authorizeUrl(oauthEnv), 302);
};
