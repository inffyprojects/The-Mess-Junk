/**
 * Rebuild trigger.
 *
 * The public pages are prerendered from Neon at build time, so a content change
 * only reaches visitors once the site rebuilds. Saving in the admin panel pings
 * a Vercel Deploy Hook to start that rebuild — the editor sees their change
 * live in about a minute without touching Git or the Vercel dashboard.
 *
 * Create the hook at: Vercel -> Project -> Settings -> Git -> Deploy Hooks.
 * Put the resulting URL in DEPLOY_HOOK_URL. See README.
 */

/**
 * Fires the deploy hook. Never throws.
 *
 * A failed rebuild trigger must not fail the save — the content is already
 * committed to the database at this point, and losing the editor's work
 * because a webhook was down would be the worse outcome. The caller surfaces
 * the returned status in the UI instead.
 */
export async function triggerRebuild(): Promise<{ ok: boolean; reason?: string }> {
  const url = import.meta.env.DEPLOY_HOOK_URL ?? process.env.DEPLOY_HOOK_URL;

  if (!url) {
    return { ok: false, reason: 'DEPLOY_HOOK_URL is not configured' };
  }

  try {
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) {
      console.error('Deploy hook rejected the request:', res.status);
      return { ok: false, reason: `deploy hook returned ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error('Deploy hook request failed:', err);
    return { ok: false, reason: 'could not reach the deploy hook' };
  }
}
