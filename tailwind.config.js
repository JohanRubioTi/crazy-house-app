/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#ff3c3c', // Vibrant Red
        'secondary': '#3cff99', // Bright Green
        'accent': '#f5a623', // Graffiti Orange
        'dark-bg': '#1a1a1a', // Dark Background
        'light-text': '#f0f0f0', // Light Text
      },
      fontFamily: {
        'graffiti': ['YourGraffitiFont', 'sans-serif'], // Replace 'YourGraffitiFont'
      },
    },
  },
  plugins: [],
}
