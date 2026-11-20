/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        science: {
          bg: "#080c14",
          surface: "#0e1524",
          elevated: "#141e33",
          border: "#1f2d4a",
          highlight: "#2d3f66",
          text: "#e2e8f0",
          muted: "#8899ac",
          particle: "#38bdf8", // Cyan
          tracker: "#10b981", // Emerald
          trackerTrue: "#14b8a6", // Teal
          track: "#f59e0b", // Amber
          ecal: "#a855f7", // Purple
          hcal: "#f43f5e", // Rose
          vertex: "#eab308", // Yellow
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
