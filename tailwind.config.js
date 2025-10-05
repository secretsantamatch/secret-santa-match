/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Montserrat"', 'sans-serif'],
        elegant: ['"Great Vibes"', 'cursive'],
        modern: ['"Oswald"', 'sans-serif'],
        whimsical: ['"Pacifico"', 'cursive'],
      },
    },
  },
  plugins: [],
}
