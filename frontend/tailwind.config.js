/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyan-primary': '#5CF4F0',
        'cyan-secondary': '#00B8D4',
        'dark-bg': '#0A0A0A',
      },
      fontFamily: {
        'sans': ['Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

