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
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        float: {'0%,100%': {transform:'translateY(0)'},'50%': {transform:'translateY(-10px)'}},
        glow: {'0%,100%': {boxShadow:'0 0 20px rgba(0,112,204,0.4)'},'50%': {boxShadow:'0 0 40px rgba(0,200,255,0.6)'}},
        slideUp: {'from': {opacity:'0',transform:'translateY(30px)'},'to': {opacity:'1',transform:'translateY(0)'}},
        fadeIn: {'from': {opacity:'0'},'to': {opacity:'1'}},
      },
    },
  },
  plugins: [],
}
