import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        accent: 'var(--accent)',
        'accent-foreground': '#181A20',
        up: 'var(--up)',
        down: 'var(--down)',
        'up-subtle': 'var(--up-subtle)',
        'down-subtle': 'var(--down-subtle)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      screens: {
        xs: '390px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
      animation: {
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-up': 'flashUp 0.6s cubic-bezier(0.1, 0.9, 0.2, 1)',
        'flash-down': 'flashDown 0.6s cubic-bezier(0.1, 0.9, 0.2, 1)',
      },
      keyframes: {
        flashUp: {
          '0%': { backgroundColor: 'var(--up-subtle)' },
          '100%': { backgroundColor: 'transparent' },
        },
        flashDown: {
          '0%': { backgroundColor: 'var(--down-subtle)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
