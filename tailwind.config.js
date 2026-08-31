/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
          950: '#031726',
        },
        swim: {
          DEFAULT: '#06b6d4',
          light: '#67e8f9',
          dark: '#0891b2',
          bg: '#083344',
          glow: 'rgba(6, 182, 212, 0.25)',
        },
        bike: {
          DEFAULT: '#f59e0b',
          light: '#fcd34d',
          dark: '#d97706',
          bg: '#451a03',
          glow: 'rgba(245, 158, 11, 0.25)',
        },
        run: {
          DEFAULT: '#10b981',
          light: '#6ee7b7',
          dark: '#059669',
          bg: '#064e3b',
          glow: 'rgba(16, 185, 129, 0.25)',
        },
        brick: {
          DEFAULT: '#a855f7',
          light: '#d8b4fe',
          dark: '#9333ea',
          bg: '#3b0764',
          glow: 'rgba(168, 85, 247, 0.25)',
        },
        strength: {
          DEFAULT: '#6366f1',
          light: '#a5b4fc',
          dark: '#4f46e5',
          bg: '#1e1b4b',
          glow: 'rgba(99, 102, 241, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-swim': '0 0 20px -5px rgba(6, 182, 212, 0.3)',
        'glow-bike': '0 0 20px -5px rgba(245, 158, 11, 0.3)',
        'glow-run': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
        'glow-brick': '0 0 20px -5px rgba(168, 85, 247, 0.3)',
      },
    },
  },
  plugins: [],
}
