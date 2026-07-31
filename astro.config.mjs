import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// Static output only — every route is pre-rendered to HTML at build time and
// served straight off Cloudflare Pages' CDN. Dynamic behaviour (the enquiry
// form, newsletter signup) lives in `/functions`, which Pages runs as Workers
// alongside the static assets. No adapter, no SSR, no server bill.
//
// Deliberately no `site:` value — a hardcoded origin would bake absolute URLs
// into the build and break the moment the client points a custom domain at the
// Pages project. Every internal link in this project is root-relative.
export default defineConfig({
  output: 'static',
  integrations: [
    tailwind({
      // We own the base layer in src/styles/global.css (tokens, font faces,
      // element defaults), so Tailwind must not inject its own stylesheet.
      applyBaseStyles: false,
    }),
  ],
  image: {
    // Sharp runs at build time: photos are emitted as pre-sized AVIF/WebP with
    // srcset, which is what carries the mobile Lighthouse score for an
    // image-forward design.
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  build: {
    // Emit `/about/index.html` rather than `/about.html` so Pages serves clean
    // URLs without a _redirects rule.
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
