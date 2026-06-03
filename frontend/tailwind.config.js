/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FAF8F5',
          100: '#F5EFE6',
          200: '#EBE3D5',
          300: '#E5A894',
          400: '#DC8163',
          500: '#D25C37',
          600: '#B84A26', // Brand Terracotta
          700: '#9C3B1D',
          800: '#812F16',
          900: '#61220F',
          950: '#36302E',
        },
        rose: {
          50: '#FAF8F5',
          100: '#F5EFE6',
          200: '#EBE3D5',
          300: '#E5A894',
          400: '#DC8163',
          500: '#D25C37',
          600: '#B84A26', // Override rose palette to match Brand Terracotta
          700: '#9C3B1D',
          800: '#812F16',
          900: '#61220F',
          950: '#36302E',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
