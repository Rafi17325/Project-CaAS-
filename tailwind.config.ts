import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#588B8B',   // Teal ocean
          accent: '#FFD5C2',    // Peach cream
          light: '#FFF5F0',     // Peach tint bg
          dark: '#3A6363',      // Deep teal
          muted: '#8AADAD',     // Muted teal
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        }
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out forwards',
        'pulse-ring': 'pulse-ring 1.2s ease-out infinite',
      }
    },
  },
  plugins: [],
}
export default config
