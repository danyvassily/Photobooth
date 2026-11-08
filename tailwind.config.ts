import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // ── Direction artistique « appareil argentique » ──────────────────
        leather: {
          DEFAULT: '#2E2118',
          deep: '#241A13',
          soft: '#3A2A1C',
        },
        line: '#4A3626',
        brass: {
          DEFAULT: '#C9A227',
          light: '#E8C97A',
          dark: '#8A6B2E',
        },
        paper: '#F4E9D3',
        ink: '#2A1F16',
        sand: '#A08A6A',
        espresso: '#14100C',
        sepia: '#A98B62',
        bakelite: '#8C3A2E',
        booth: {
          dark: '#0f172a',
          surface: '#1e293b',
          accent: '#ec4899',
          gold: '#eab308',
          korean: {
            pink: '#fbcfe8',
            lavender: '#e9d5ff',
            cream: '#fef3c7',
            blue: '#bae6fd',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        handwritten: ['var(--font-handwritten)', 'cursive'],
        retro: ['var(--font-retro)', 'monospace'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['"Courier New"', 'Courier', 'monospace'],
      },
      boxShadow: {
        brass: '0 8px 24px rgba(201, 162, 39, 0.25)',
        'brass-lg': '0 14px 40px rgba(201, 162, 39, 0.35)',
        pocket: 'inset 0 1px 0 rgba(232, 201, 122, 0.35), 0 10px 30px rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'flash': 'flash 0.5s ease-out',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        flash: {
          '0%': { opacity: '0.9', backgroundColor: '#ffffff' },
          '100%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
