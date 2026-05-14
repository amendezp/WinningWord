import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Iowan Old Style"', '"Palatino"', '"Georgia"', "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      colors: {
        // Warm dark gray, not pure black. Matches Typora's softer body tone —
        // easier on the eye than #000 on cream paper.
        ink: "#33302c",
        paper: "#fafaf7",
      },
    },
  },
  plugins: [],
};

export default config;
