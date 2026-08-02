/**
 * POST /admin/logout — clears the session cookie.
 *
 * POST rather than GET on purpose: a GET logout can be triggered by any image
 * or link on another site, which is a petty but real annoyance.
 */
import type { APIRoute } from 'astro';
import { SESSION_COOKIE_NAME } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = ({ cookies, redirect }) => {
  /* cookies.delete, not a Set-Cookie header — a header appended to the response
     would be dropped by redirect(). Same reason as the login route. */
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
  return redirect('/admin/login/', 302);
};
