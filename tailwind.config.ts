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
          DEFAULT: '#2A1519',
          deep: '#190E11',
          soft: '#3B1E20',
        },
        line: '#4A2A2B',
        brass: {
          DEFAULT: '#FFB020',
          light: '#FFD27A',
          dark: '#E2542C',
        },
        paper: '#FFF3E0',
        ink: '#241009',
        sand: '#C89B84',
        espresso: '#120A0C',
        sepia: '#E8A45C',
        bakelite: '#E2542C',
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
