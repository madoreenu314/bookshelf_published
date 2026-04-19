import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      boxShadow: {
        soft: "0 12px 40px rgba(0,0,0,0.10)",
        softDark: "0 18px 56px rgba(0,0,0,0.45)",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(.16, 1, .3, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;

