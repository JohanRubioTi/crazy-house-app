/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#ff3c3c',
        'secondary': '#3cff99',
        'accent': '#f5a623',
        'dark-bg': '#1a1a1a',
        'darker-bg': '#282828',
        'light-text': '#f0f0f0',
        'secondary-text': '#d1d5db',
        'muted-text': '#737373',
        'light-accent': '#e0e7ff',
        'dark-overlay': 'rgba(0, 0, 0, 0.6)',
        'street-black': '#121212',
        'street-yellow': '#fde047',
        'transparent-black': 'rgba(0,0,0,0.3)',
      },
      fontFamily: {
        'graffiti': ['Bangers', 'cursive', 'sans-serif'],
        'stylish-sans': ['Oswald', 'sans-serif'],
        'sans': ['Roboto', 'sans-serif'],
      },
      boxShadow: {
        'md-dark': '0 4px 6px rgba(0, 0, 0, 0.5)',
        'lg-dark': '0 8px 12px rgba(0, 0, 0, 0.6)',
      },
      backgroundImage: {
        'street-gradient': 'linear-gradient(135deg, #1a1a1a 40%, #333333 100%)', // More subtle dark gradient
      },
      blur: {
        'sm': '2px',
        'md': '4px',
      },
    },
  },
  plugins: [],
};
