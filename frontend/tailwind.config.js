/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        obsidian: {
          950: '#06070a',
          900: '#090b10',
          850: '#0d1017',
          800: '#121620',
          750: '#171c29',
          700: '#1e2434',
        },
        terminal: {
          border: 'rgba(255, 255, 255, 0.08)',
          borderSubtle: 'rgba(255, 255, 255, 0.04)',
          borderActive: 'rgba(56, 189, 248, 0.4)',
          textDim: '#71788e',
          textMuted: '#9aa2b6',
          textLight: '#f1f5f9',
          cyan: '#38bdf8',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
          indigo: '#6366f1',
        }
      }
    },
  },
  plugins: [],
}
