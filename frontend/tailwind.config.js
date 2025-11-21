/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#dcecff',
          200: '#bcd9ff',
          300: '#8bbcff',
          400: '#589bff',
          500: '#327dff',
          600: '#1f60f0',
          700: '#1648cc',
          800: '#183ca0',
          900: '#192f7a',
        },
      },
    },
  },
  plugins: [],
};
