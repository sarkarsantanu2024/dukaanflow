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
         * Dark at both ends on purpose. A gradient that runs from deep green
         * to brand green looks lively in a swatch and fails in use — white
         * text and white icons at the pale end drop to about 2:1 contrast, so
         * the controls furthest right on a wide bar are the least readable
         * ones. This one only varies within the dark range: a shade of depth,
         * not a change of colour.
         */
        chrome: 'linear-gradient(160deg, #0b5a3b 0%, #0a4a33 55%, #093f2c 100%)',
        /** The ground everything sits on: tinted, never plain white. */
        app: 'linear-gradient(180deg, #f2fbf6 0%, #f4f8f6 30%, #f1f5f9 100%)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.10)',
        /** For the chrome: enough to sit above the page, not a drop shadow. */
        chrome: '0 1px 2px rgba(9,63,44,.16), 0 8px 24px -12px rgba(9,63,44,.45)',
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
