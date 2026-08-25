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
          bg: '#C8DFDB',       // 60% - Very light background
          primary: '#1B2CC1',  // 30% - Primary brand blue
          highlight: '#7692FF' // 10% - Highlight blue
        }
      }
    },
  },
  plugins: [],
}
