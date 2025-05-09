/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}"
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#fff8f1',
          100: '#feecdc',
          200: '#fcd9bd',
          300: '#fdba8c',
          400: '#ff8a4c',
          500: '#ff5a1f',
          600: '#d03801',
          700: '#b43403',
          800: '#8a2c0d',
          900: '#771d1d',
        },
        primary: {
          DEFAULT: '#ff5a1f', // Orange 500
          dark: '#d03801',    // Orange 600
          light: '#ff8a4c',   // Orange 400
        },
        secondary: {
          DEFAULT: '#3b82f6', // Blue 500
          dark: '#2563eb',    // Blue 600
        }
      }
    },
  },
  plugins: [],
}
