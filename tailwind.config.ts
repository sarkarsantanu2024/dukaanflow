import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefdf4',
          100: '#d6f9e3',
          200: '#b0f1cb',
          300: '#7ae4ad',
          400: '#3fce89',
          500: '#18b26c',
          600: '#0b9057',
          700: '#0a7248',
          800: '#0b5a3b',
          900: '#0a4a33',
        },
        /**
         * The second colour, and the one the product was missing.
         *
         * Green alone on white gave every screen the same two tones, so
         * everything that was not a button was white — which is what made the
         * console read as a spreadsheet. Saffron is the colour a kirana's own
         * signage already uses, it sits opposite the green rather than beside
         * it, and it stays legible on both: `600` on white, `50`/`100` as a
         * ground under `800` text.
         *
         * Reserved for warmth and for the second rank of information —
         * counts, festival and offer things, empty states. Green still means
         * "you can act on this"; amber still means "something is wrong".
         */
        /**
         * The logo's blue, brought into the interface so the mark stops being
         * the only blue thing on the screen.
         *
         * Sampled from the artwork: the chart panel is around #004890, the
         * arrow sweeping under the shop around #0090f0. `600` is the darkest
         * that still reads as blue rather than as navy, and clears 4.5:1 on
         * white; `50`/`100` are grounds for `800` text.
         *
         * A SECOND COLOUR, NOT A SECOND BRAND COLOUR. Green still means "you
         * can act on this" and amber still means "something is wrong" —
         * azure is for the chrome, for links away from the current task, and
         * for chart ink, where a green series would read as a status.
         */
        azure: {
          50: '#eef7ff',
          100: '#d8ecff',
          200: '#b4dbff',
          300: '#7fc3ff',
          400: '#42a6fb',
          500: '#1a89ec',
          600: '#0a6ac9',
          700: '#0a54a2',
          800: '#0d4886',
          900: '#0f3d6f',
        },
        saffron: {
          50: '#fff8ed',
          100: '#ffedd0',
          200: '#fed7a0',
          300: '#fdba65',
          400: '#fb9528',
          500: '#f97a0b',
          600: '#e25c06',
          700: '#bb4209',
          800: '#95340f',
          900: '#792d10',
        },
      },
      backgroundImage: {
        /**
         * The chrome: the console's rail, the owner app's bar, the tab bars.
         *
         * NOW GREEN TO BLUE, BECAUSE THE LOGO IS. The mark sweeps from a green
         * shopfront through cyan into a deep blue chart panel, and a rail that
         * stayed green-to-green put the one blue object on the screen against a
         * ground that disagreed with it. Sampling the artwork gives #00c060,
         * #0090f0 and #004890; the rail travels the same road at the dark end
         * of each.
         *
         * STILL DARK AT BOTH ENDS, which is the older rule and the one that
         * must not be broken. A gradient running into a *bright* colour looks
         * lively in a swatch and fails in use: white text and white icons at
         * the pale end drop to about 2:1 contrast, so the controls furthest
         * along a wide bar become the least readable. Both ends here clear 8:1
         * against white — a change of colour, not of brightness.
         */
        chrome: 'linear-gradient(160deg, #0b5a3b 0%, #0a4a44 45%, #0a3f66 100%)',
        /** The ground everything sits on: tinted, never plain white. */
        app: 'linear-gradient(180deg, #f2fbf6 0%, #f4f8f6 30%, #f1f5f9 100%)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.10)',
        /** For the chrome: enough to sit above the page, not a drop shadow.
            Tinted to the rail's cool end now that the rail ends in blue. */
        chrome: '0 1px 2px rgba(10,63,102,.16), 0 8px 24px -12px rgba(10,63,102,.45)',
        sheet: '0 -8px 24px rgba(16,24,40,.12)',
      },
      keyframes: {
        'drawer-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'drawer-out': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out': { from: { opacity: '1' }, to: { opacity: '0' } },
      },
      animation: {
        // The easing is the decelerating curve panels want: quick to start,
        // settling rather than stopping. Linear would read as mechanical.
        'drawer-in': 'drawer-in 260ms cubic-bezier(0.32, 0.72, 0, 1)',
        'drawer-out': 'drawer-out 200ms cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'fade-in': 'fade-in 220ms ease-out',
        'fade-out': 'fade-out 200ms ease-in forwards',
      },
    },
  },
  plugins: [],
};

export default config;
