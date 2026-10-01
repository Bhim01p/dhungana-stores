/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Rich Maroon brand palette — Bishnu and Dhungana Stores
        brand: {
          50:  "#fdf2f2",
          100: "#fce4e4",
          200: "#f9cccc",
          300: "#f4a8a8",
          400: "#ec7474",
          500: "#9B1C1C",  // primary rich maroon
          600: "#881818",
          700: "#721414",
          800: "#5e1111",
          900: "#4f1010",
          950: "#2d0808",
        },
        nepali: {
          red:   "#c0392b",
          green: "#27ae60",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};