/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kano-green': '#006838',
        'kano-green-dark': '#004d28',
        'kano-red': '#CE1126',
      },
    },
  },
  plugins: [],
}