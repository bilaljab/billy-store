/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0070CC',
        'primary-dark': '#005BA3',
        'primary-light': '#3A9EE8',
        accent: '#00C8FF',
        dark: '#050A14',
        'dark-card': '#0A1628',
        'dark-border': '#0D2040',
      },
      fontFamily: {
        arabic: ['Cairo', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
