import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

// Hybrid rendering.
//
// `output: 'static'` keeps every public page prerendered — the workshop,
// pricing, FAQ and contact pages are built from Neon at BUILD time and served
// as plain HTML off Vercel's CDN. Visitors never touch the database, so there
// are no cold starts and no query on the critical path.
//
// The admin panel opts out per-route with `export const prerender = false`,
// which is what the adapter is here for. Those routes are server-rendered and
// read/write Neon live.
//
// Content edits therefore reach the public site via a rebuild: saving in the
// admin pings a Vercel Deploy Hook and the site is live again in about a
// minute. See src/lib/deploy.ts.
//
// Deliberately no `site:` value — a hardcoded origin would bake absolute URLs
// into the build and break under a custom domain. Every internal link is
// root-relative.
export default defineConfig({
  output: 'static',
  adapter: vercel(),
  integrations: [
    tailwind({
      // We own the base layer in src/styles/global.css (tokens, font faces,
      // element defaults), so Tailwind must not inject its own stylesheet.
      applyBaseStyles: false,
    }),
  ],
  image: {
    // Sharp runs at build time: photos are emitted as pre-sized AVIF/WebP with
    // srcset, which is what carries the mobile Lighthouse score.
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  build: {
    // Emit `/about/index.html` rather than `/about.html` for clean URLs.
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  vite: {
    // The admin panel is the only place that touches these, and it is
    // server-rendered — this keeps them out of any client bundle.
    envPrefix: ['PUBLIC_'],
  },
});
