import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "#f6f2ea",
        ink: {
          DEFAULT: "#111827",
          muted: "#475569",
          blue: "#1d4ed8",
          border: "#d9dce4",
        },
        "alert-red": "#dc2626",
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
