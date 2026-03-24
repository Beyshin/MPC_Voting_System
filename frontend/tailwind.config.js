/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: "var(--sand)",
        clay: "var(--clay)",
        ink: "var(--ink)",
      },
    },
  },
  plugins: [],
};
