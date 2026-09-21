/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          green:       "#1D9E75",
          greenLight:  "#E1F5EE",
          greenDark:   "#0F6E56",
          greenBorder: "#5DCAA5",
          red:         "#D85A30",
          redLight:    "#FAECE7",
          redDark:     "#993C1D",
          redBorder:   "#F0997B",
          amber:       "#EF9F27",
          amberLight:  "#FAEEDA",
          amberBorder: "#FAC775",
          amberDark:   "#854F0B",
          blue:        "#378ADD",
          blueLight:   "#DBEEFF",
          blueDark:    "#1565C0",
        },
      },
    },
  },
  plugins: [],
};
