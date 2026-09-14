/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a4bcfd',
          400: '#7d99f9',
          500: '#536df3',
          600: '#3d4ee7',
          700: '#313ccb',
          800: '#2a33a3',
          900: '#272f81',
          950: '#181c4c',
        }
      }
    },
  },
  plugins: [],
}
