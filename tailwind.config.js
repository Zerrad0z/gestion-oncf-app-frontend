/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}"
  ],
  theme: {
    extend: {
      colors: {
        // Keep your existing orange palette
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
        // Add ONCF orange palette to match your CSS variables
        'oncf-orange': {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        primary: {
          DEFAULT: '#f97316', // Use ONCF Orange 500
          dark: '#ea580c',    // ONCF Orange 600
          light: '#fb923c',   // ONCF Orange 400
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