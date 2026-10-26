/** @type {import('tailwindcss').Config} */
// Brand tokens mirror ousd-mseg.org (Decidim): Lexend, green #026937, gold #ffc20e.
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  // Light theme only, like ousd-mseg.org. Upstream's `dark:` classes stay inert because
  // nothing ever adds the `dark` class.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#026937',
          'green-dark': '#014d28',
          'green-tint': '#e6f1eb',
          gold: '#ffc20e',
          ink: '#020203',
          charcoal: '#242424',
          mist: '#F3F4F7',
        },
      },
      fontFamily: {
        sans: ['Lexend', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
