import type {Config} from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                signal: {
                    bg: "#050505",
                    panel: "#0f0f0f",
                    panel2: "#171717",
                    red: "#ef4444",
                    rose: "#fb7185",
                    amber: "#f59e0b",
                },
            },
            fontFamily: {
                sans: ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
                mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
            },
            boxShadow: {
                glow: "0 0 0 1px rgba(239, 68, 68, 0.16), 0 24px 80px rgba(0, 0, 0, 0.42)",
            },
        },
    },
    plugins: [],
};

export default config;
