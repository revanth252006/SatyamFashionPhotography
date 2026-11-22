/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        champagne: {
          50: '#fdfbf7',
          100: '#f9f5ec',
          200: '#f2e8d3',
          300: '#e8d7b3',
          400: '#dbc08c',
          500: '#c59b27',
          600: '#b0841f',
          700: '#8c641b',
        },
        rosewood: {
          50: '#fdf9f8',
          100: '#fbf1ef',
          200: '#f5deda',
          300: '#ecc4bc',
          400: '#dfa094',
          500: '#cb7b6d',
          600: '#b45d4e',
          700: '#95493d',
        }
      }
    },
  },
  plugins: [],
}
