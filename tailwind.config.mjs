/** @type {import('tailwindcss').Config} */

// Every value below is a 1:1 map of the design document's token block
// (§3.1 colour, §3.2 type scale). The CSS custom properties in
// src/styles/global.css are the single source of truth; Tailwind reads through
// to them via var() so the two can never drift apart.
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      /**
       * Colours read the channel triplets from global.css, not the `--x`
       * aliases. The `<alpha-value>` placeholder is what makes opacity
       * modifiers work — `text-white/80` becomes `rgb(255 255 255 / 0.8)`.
       *
       * Pointing these at `var(--white)` instead looks equivalent but is not:
       * Tailwind cannot inject an alpha channel into an opaque colour, so it
       * drops the class entirely and the element silently inherits whatever it
       * would otherwise. That failure is invisible until something renders
       * dark-on-dark.
       */
      colors: {
        // Brand core — client-specified, do not alter (§3.1)
        cobalt: {
          DEFAULT: 'rgb(var(--cobalt-rgb) / <alpha-value>)',
          10: 'rgb(var(--cobalt-10-rgb) / <alpha-value>)',
          '05': 'rgb(var(--cobalt-05-rgb) / <alpha-value>)',
        },
        pink: {
          DEFAULT: 'rgb(var(--pink-rgb) / <alpha-value>)',
          10: 'rgb(var(--pink-10-rgb) / <alpha-value>)',
          '05': 'rgb(var(--pink-05-rgb) / <alpha-value>)',
        },
        white: 'rgb(var(--white-rgb) / <alpha-value>)',
        'off-white': 'rgb(var(--off-white-rgb) / <alpha-value>)',

        // Derived neutrals
        ink: {
          DEFAULT: 'rgb(var(--ink-rgb) / <alpha-value>)',
          soft: 'rgb(var(--ink-soft-rgb) / <alpha-value>)',
        },
        line: 'rgb(var(--line-rgb) / <alpha-value>)',

        // Proposed third accent (§3.1 / §11 open question 3)
        'acid-yellow': 'rgb(var(--acid-yellow-rgb) / <alpha-value>)',

        // Semantic — system use only, never brand-facing
        success: 'rgb(var(--success-rgb) / <alpha-value>)',
        error: 'rgb(var(--error-rgb) / <alpha-value>)',
      },

      fontFamily: {
        display: ['Bricolage Grotesque Variable', 'Georgia', 'serif'],
        body: ['Inter Variable', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        scribble: ['Caveat Variable', 'Bricolage Grotesque Variable', 'cursive'],
      },

      // §3.2 type scale. Mobile sizes are handled with clamp() so the two
      // columns of the doc's table collapse into one fluid token.
      fontSize: {
        'display-xl': ['clamp(3rem, 1.6rem + 6vw, 4.5rem)', { lineHeight: '0.98', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-lg': ['clamp(2.25rem, 1.5rem + 3.2vw, 3rem)', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['clamp(1.5rem, 1.2rem + 1.4vw, 2rem)', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '700' }],
        'body-lg': ['1.25rem', { lineHeight: '1.6' }],
        'body-md': ['1rem', { lineHeight: '1.65' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '500' }],
        label: ['0.8125rem', { lineHeight: '1.2', letterSpacing: '0.09em', fontWeight: '600' }],
        scribble: ['1.5rem', { lineHeight: '1.2', fontWeight: '500' }],
      },

      borderRadius: {
        // §7 card spec: 16–20px radius
        card: '1.25rem',
        'card-sm': '1rem',
        pill: '999px',
      },

      boxShadow: {
        // §7: cards are flat at rest, shadow only on hover
        lift: '0 12px 32px -12px rgba(23, 23, 58, 0.22)',
        'lift-lg': '0 20px 50px -16px rgba(23, 23, 58, 0.28)',
        focus: '0 0 0 4px var(--cobalt-10)',
      },

      maxWidth: {
        shell: '78rem',
        prose: '42rem',
      },

      transitionTimingFunction: {
        // §8: one consistent easing, no bouncy/elastic curves
        brand: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },

      transitionDuration: {
        brand: '400ms',
      },

      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'none' },
        },
        // Hero blobs only — 20–30s, barely perceptible (§8)
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(2%, -2.5%, 0) scale(1.045)' },
        },
        // Fires once on load, never loops (§7 WhatsApp float spec)
        'pulse-once': {
          '0%': { boxShadow: '0 0 0 0 rgba(42, 46, 207, 0.45)' },
          '100%': { boxShadow: '0 0 0 22px rgba(42, 46, 207, 0)' },
        },
      },

      animation: {
        'fade-up': 'fade-up 400ms cubic-bezier(0.22, 0.61, 0.36, 1) both',
        drift: 'drift 26s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-once': 'pulse-once 1.6s cubic-bezier(0.22, 0.61, 0.36, 1) 2 forwards',
      },
    },
  },
  plugins: [],
};
