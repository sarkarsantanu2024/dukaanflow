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
        /**
         * ONE COLOUR. Green, and then neutrals.
         *
         * The product briefly carried three hues — this green, a saffron for
         * second-rank information and a blue sampled from the logo. On a
         * console an operator reads all day that is three things competing to
         * be noticed, and the eye stops trusting any of them. Everything that
         * was saffron is now slate: green means "you can act on this", amber
         * still means "something is wrong", and neutral means "here is a
         * number".
         *
         * DESATURATED FROM THE OLD SCALE, deliberately. The previous green ran
         * hot — #0b9057 at 600 — and a saturated green in large fields is the
         * colour that tires an eye fastest: it sits where the eye is most
         * sensitive and gives it nowhere to relax. This scale keeps the hue and
         * drops the chroma, which is what makes a screen restful rather than
         * grey.
         *
         * IT IS ALSO THE ACCESSIBLE ONE, which the old scale was not. White
         * text on #0b9057 measured 4.1:1 and failed AA on every primary button
         * in the product. `600` here is 5.2:1, and `700` is 7.2:1 on white for
         * text. Do not brighten either without re-measuring.
         */
        brand: {
          50: '#f2f9f5',
          100: '#e0f1e8',
          200: '#c2e2d2',
          300: '#97ccb2',
          400: '#66b08f',
          500: '#429472',
          600: '#2f7a5e',
          700: '#26624c',
          800: '#204f3e',
          900: '#1b4134',
        },
      },
      backgroundImage: {
        /**
         * The chrome: the console's rail, the owner app's bar, the tab bars.
         *
         * FLAT, AND ONE COLOUR. It has been a green-to-green gradient and
         * briefly a green-to-blue one; both were movement for its own sake in
         * the largest single field of colour on the screen, and a gradient
         * there is exactly where banding shows on the cheap panels this is
         * operated on. A rail is a ground. It should recede.
         *
         * Still stated as a gradient so every `bg-chrome` call site is
         * unchanged — Tailwind has no "flat backgroundImage".
         *
         * brand-800, measured at 9.3:1 against white, so an icon at the far end
         * of a wide bar is as readable as the one nearest the corner.
         */
        chrome: 'linear-gradient(#204f3e, #204f3e)',
        /**
         * The ground everything sits on: one soft tint, never plain white and
         * never a wash that changes colour as the page scrolls. Paper, with a
         * trace of the brand in it.
         */
        app: 'linear-gradient(#f5f8f6, #f5f8f6)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.10)',
        /** For the chrome: enough to sit above the page, not a drop shadow. */
        chrome: '0 1px 2px rgba(32,79,62,.16), 0 8px 24px -12px rgba(32,79,62,.45)',
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
