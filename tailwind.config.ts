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
