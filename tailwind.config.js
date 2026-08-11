/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: 'rgb(var(--brand-rgb) / <alpha-value>)', ink: 'rgb(var(--brand-ink-rgb) / <alpha-value>)' },
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
        muted: 'rgb(var(--muted-rgb) / <alpha-value>)',
        canvas: { a: 'rgb(var(--canvas-a-rgb) / <alpha-value>)', b: 'rgb(var(--canvas-b-rgb) / <alpha-value>)' },
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        chip: 'rgb(var(--chip-bg-rgb) / <alpha-value>)',
        gold: 'rgb(var(--gold-bg-rgb) / <alpha-value>)',
        sale: 'rgb(var(--sale-rgb) / <alpha-value>)',
      },
      borderRadius: {
        card: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        float: 'var(--shadow-float)',
        soft: 'var(--shadow-soft)',
      },
      fontFamily: {
        sans: ['var(--font-stc)', 'Tahoma', 'sans-serif'],
        display: ['var(--font-stc)', 'Tahoma', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
