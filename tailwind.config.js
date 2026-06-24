/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        space: {
          void: "#05060d",
          deep: "#0b0e1a",
          panel: "#101426",
          border: "#222a44",
          muted: "#8a93b8",
          text: "#e8ecff",
        },
        accent: {
          DEFAULT: "#5ec8ff",
          glow: "#7af0ff",
        },
      },
      fontFamily: {
        display: ['"Sora"', "system-ui", "sans-serif"],
        body: ['"Manrope"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
