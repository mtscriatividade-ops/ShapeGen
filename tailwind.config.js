/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#1e1e22",
        panel: "#242428",
        accent: "#5b8def",
      },
    },
  },
  plugins: [],
};
