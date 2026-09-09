import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#182420",
        inkpanel: "#1F2E28",
        inkline: "#2A3B34",
        paper: "#F1E9D2",
        paperdim: "#E7DDC1",
        rule: "#C9BC97",
        textdark: "#1C2620",
        textmuted: "#5B6A5E",
        muted2: "#8A9990",
        low: "#6B8F71",
        medium: "#4A6FA5",
        high: "#C98A3D",
        urgent: "#B5482B",
        done: "#3C6E47",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-plex)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
