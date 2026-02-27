import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "var(--color-ivory)",
        ink: {
          DEFAULT: "var(--color-ink)",
          muted: "var(--color-ink-muted)",
          blue: "var(--color-ink-blue)",
          border: "var(--color-border)",
        },
        "alert-red": "var(--color-alert-red)",
      },
      borderRadius: {
        sm: "0.35rem",
        md: "0.7rem",
        lg: "0.95rem",
      },
      boxShadow: {
        commonsSm: "0 8px 18px rgba(15, 23, 42, 0.06)",
        commonsMd: "0 14px 32px rgba(15, 23, 42, 0.08)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-lora)", "ui-serif", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
