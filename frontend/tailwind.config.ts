import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        tf: {
          purple: "#534AB7",
          "purple-light": "#EEEDFE",
          "teal-bg": "#E1F5EE",
          "teal-text": "#0F6E56",
          "coral-bg": "#FAECE7",
          "coral-text": "#993C1D",
          "amber-bg": "#FAEEDA",
          "amber-text": "#854F0B",
          "bg-page": "#F9FAFB",
          "bg-sidebar": "#FFFFFF",
          "bg-card": "#FFFFFF",
          border: "#E5E7EB",
          "border-light": "#F3F4F6",
          "text-primary": "#111827",
          "text-muted": "#6B7280",
          "text-faint": "#9CA3AF",
          "dark-bg-page": "#0F1117",
          "dark-bg-sidebar": "#1A1D27",
          "dark-bg-card": "#1E2130",
          "dark-border": "#2D3148",
          "dark-border-light": "#252840",
          "dark-text-primary": "#F1F1F5",
          "dark-text-muted": "#9DA3B4",
          "dark-text-faint": "#5C6280",
          "dark-purple-light": "#2A2750"
        },
        taskflow: {
          primary: "#534AB7",
          soft: "#EEEDFE",
          border: "#E5E7EB"
        }
      },
      boxShadow: {
        soft: "0 12px 40px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
