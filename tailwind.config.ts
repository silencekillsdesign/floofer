import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default <Partial<Config>>{
  content: [
    "./components/**/*.vue",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./app.vue",
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: v("brand"), deep: v("brand-deep"), soft: v("brand-soft") },
        pink: { DEFAULT: v("pink"), deep: v("pink-deep") },
        grape: v("grape"),
        navy: v("navy"),
        ink: { DEFAULT: v("ink"), soft: v("ink-soft"), faint: v("ink-faint") },
        paper: { DEFAULT: v("paper"), warm: v("paper-warm") },
        card: v("card"),
        risk: { DEFAULT: v("risk"), soft: v("risk-soft") },
        safe: { DEFAULT: v("safe"), soft: v("safe-soft") },
        you: { DEFAULT: v("you"), soft: v("you-soft") },
        line: v("line"),
      },
      fontFamily: {
        display: ["Fredoka", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "var(--sh-card)",
        pop: "var(--sh-pop)",
        deck: "var(--sh-deck)",
        glow: "var(--sh-glow)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
};
