/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-primary': '#111827',   // Deeper dark primary background
        'dark-secondary': '#1F2937',  // Deeper dark secondary background for cards
        'light-primary': '#E5E7EB',  // Softer light text color
        'accent-premium': '#4B5563',  // More refined accent color
        'highlight-premium': '#6B7280', // Subtle highlight color
        'success-premium': '#86EFAC',  // Muted success color
        'error-premium': '#FCA5A5',    // Muted error color
        'button-primary': '#374151',  // More subdued primary button
        'button-primary-hover': '#4B5563', // Hover state for primary button
        'button-secondary': '#64748B', // Secondary button color
        'button-secondary-hover': '#7E8A9B', // Hover for secondary button
      },
      fontFamily: {
        'industrial': ['"Roboto Condensed"', 'sans-serif'],
        'display': ['"Montserrat"', 'sans-serif'],
        'body': ['"Lato"', 'sans-serif'],
        'mono': ['"Roboto Mono"', 'monospace'], // Monospace font for data display
      },
      fontWeight: {
        'light': 300,
        'normal': 400,
        'semibold': 600, // Use semibold for titles and important text
        'bold': 700,
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem', // Slightly smaller xl size
        '2xl': '1.5rem',
        '3xl': '2.25rem', // Adjusted 3xl size for title
      },
      letterSpacing: {
        'tight': '-0.01em',
        'normal': '0',
        'wide': '0.025em', // Slight letter spacing for titles
      },
      spacing: {
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        'full': '9999px',
      },
      borderWidth: {
        'DEFAULT': '1px',
        '0': '0',
        '2': '2px',
        '3': '3px',
      },
      boxShadow: {
        'premium-sm': '0 2px 4px rgba(0, 0, 0, 0.2)', // Even more subtle shadow
        'premium-md': '0 4px 8px rgba(0, 0, 0, 0.25)',
        'premium-lg': '0 8px 16px rgba(0, 0, 0, 0.3)',
        'button-premium': '0 2px 4px rgba(0, 0, 0, 0.3)', // Button shadow
        'button-premium-hover': '0 3px 6px rgba(0, 0, 0, 0.35)', // Button hover shadow
      },
      transitionProperty: {
        'common': 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform',
      },
      transitionDuration: {
        'DEFAULT': '200ms',
      },
      transitionTimingFunction: {
        'DEFAULT': 'ease-in-out', // Smoother transition
      },
      keyframes: {
        'gradient-move': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'gradient-move': 'gradient-move 8s linear infinite', // Slower, smoother gradient
      },
      backgroundImage: {
        'premium-gradient': 'linear-gradient(45deg, #111827, #1F2937, #111827)', // Refined gradient
      },
    },
  },
  plugins: [],
}
