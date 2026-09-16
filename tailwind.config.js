/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--color-brand, #0066ff)",
          dark: "var(--color-brand-dark, #0052cc)",
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#0066ff",
          600: "#0052cc",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#172554",
        },
        ink: {
          DEFAULT: "var(--color-ink, #16181b)",
          soft: "var(--color-ink-soft, #4b4f54)",
          light: "#71767d",
        },
        paper: "var(--color-paper, #ffffff)",
        surface: "var(--color-surface, #f7f7f8)",
        border: "var(--color-border, #e7e7e9)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Montserrat", "sans-serif"],
        serif: ["var(--font-serif)", "Playfair Display", "serif"],
        devanagari: ["var(--font-devanagari)", "Noto Sans Devanagari", "serif"],
        body: ["var(--font-body)", "var(--font-sans)", "Montserrat", "sans-serif"],
        heading: ["var(--font-display)", "var(--font-serif)", "Playfair Display", "serif"],
      },
      borderRadius: {
        sm: "var(--radius-sm, 6px)",
        md: "var(--radius-md, 10px)",
        lg: "var(--radius-lg, 18px)",
      },
    },
  },
  plugins: [],
};
