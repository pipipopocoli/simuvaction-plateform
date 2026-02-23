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
                ivory: "#FFFBF5",
                ink: {
                    DEFAULT: "#111827",
                    blue: "#1E3A8A",
                    border: "#E5E7EB",
                },
                "alert-red": "#DC2626",
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
