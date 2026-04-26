import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: { DEFAULT: "#0f1419", muted: "#5c6670" },
        surface: { DEFAULT: "#ffffff", soft: "#f4f6f8", border: "#e2e8f0" },
        accent: { DEFAULT: "#ff0a22", hover: "#d4081c", soft: "#ffe4e6" },
        warn: { DEFAULT: "#b45309", soft: "#fef3c7" },
      },
    },
  },
  plugins: [],
};

export default config;
