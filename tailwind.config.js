/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:        '#0A0A0A',
        surface:   '#111111',
        surface2:  '#1A1A1A',
        border:    '#2A2A2A',
        accent:    '#FF8C00',
        'accent-dim': 'rgba(255,140,0,0.12)',
        'accent-glow': 'rgba(255,140,0,0.35)',
        text:      '#F5F5F5',
        muted:     '#888888',
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        sans:    ['DM Sans', 'sans-serif'],
      },
      fontSize: {
        hero: 'clamp(72px, 11vw, 150px)',
      },
      boxShadow: {
        'accent-glow': '0 0 32px rgba(255,140,0,0.35)',
        'accent-sm':   '0 0 16px rgba(255,140,0,0.25)',
      },
      borderColor: {
        DEFAULT: '#2A2A2A',
      },
      backgroundColor: {
        DEFAULT: '#0A0A0A',
      },
    },
  },
  plugins: [],
}
