// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1A73E8",
        secondary: "#F4F4F5",
        accent: "#FF7F50",
      },
      fontFamily: {
        rubik: ["'Rubik Spray Paint'", "cursive"],
      },
    },
  },
  plugins: [],
}
