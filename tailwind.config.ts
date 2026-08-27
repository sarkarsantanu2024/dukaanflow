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
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.10)',
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
