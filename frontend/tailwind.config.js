/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        finance: {
          bg: '#0a0d14',
          surface: '#121722',
          card: '#181f2f',
          border: '#222c42',
          accent: '#38bdf8',
          green: '#10b981',
          red: '#f43f5e',
          gold: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
