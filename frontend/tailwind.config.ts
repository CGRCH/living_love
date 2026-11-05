import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        onix: "#0B0B0B",
        grafito: "#1A1A1A",
        marfil: "#F7F3EC",
        blanco: "#FFFFFF",
        champ: "#C9A96E",
        arena: "#D9CFC1",
        taupe: "#8A8178",
        whatsapp: "#25D366",
      },
      fontFamily: {
        serif: ["var(--font-bodoni)", "Georgia", "serif"],
        sans: ["var(--font-jost)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        label: ".22em",
      },
    },
  },
  plugins: [],
};
export default config;
