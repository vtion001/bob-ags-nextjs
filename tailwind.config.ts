import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#050D18',
          900: '#0A1628',
          800: '#0F1F33',
          700: '#1A2E47',
          600: '#2A4A6B',
          500: '#3D5A80',
        },
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '6px',
        xs: '4px',
      },
      spacing: {
        gutter: '24px',
      },
    },
  },
  plugins: [],
}

export default config