/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#090817',
        violetglow: '#9b7bff',
        warmgold: '#e8c77a',
      },
      fontFamily: {
        arabic: ['Tahoma', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
