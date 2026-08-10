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
    },
  },
  plugins: [],
};

export default config;
