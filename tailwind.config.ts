import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neon: "#39FF14",
        electric: "#2E9BFF",
        hotpink: "#FF2D8A",
        gold: "#FFC53D",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        hand: ["Caveat", "Segoe Script", "cursive"],
      },
      boxShadow: {
        card: "0 2px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        cardHover: "0 12px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        neonGlow: "0 0 24px rgba(57,255,20,0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
