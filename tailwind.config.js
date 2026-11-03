/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },

    extend: {
      colors: {
        background: "#0A100D",
        foreground: "#EEE5E9",
        accent: "#294237",
        primary: "#3ECF8E",
        secondary: "#7828C8",
        tertiary: "#FFD700",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
