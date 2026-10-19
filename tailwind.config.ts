import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── StudentOS Color Tokens ──────────────────────────────────────────
      colors: {
        // Brand
        forest: {
          DEFAULT: "#0E5C2F",
          50:  "#EAF4EE",
          100: "#C9E6D3",
          200: "#93CDA8",
          300: "#5DB37D",
          400: "#2E9955",
          500: "#0E5C2F",
          600: "#0B4A26",
          700: "#08371C",
          800: "#052513",
          900: "#021209",
        },
        gold: {
          DEFAULT: "#D4980A",
          light:  "#FDF5DC",
          muted:  "#ECC84A",
          dark:   "#A87400",
        },
        // Neutrals (green-tinted, not pure grey)
        canvas:  "#F7F8F4",
        ink:     "#111A14",
        sage:    "#E8EDE5",
        border:  "#D4DAD0",
        // Text hierarchy
        muted: {
          DEFAULT: "#6B7D6E",
          foreground: "#6B7D6E",
        },

        // ── shadcn/ui CSS variable mappings ──────────────────────────────
        background:    "hsl(var(--background))",
        foreground:    "hsl(var(--foreground))",
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },

      // ── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        display: ["Georgia", "serif"],
        sans:    ["Arial", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Display scale (used sparingly in heroes/headings)
        "display-2xl": ["4.5rem",  { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "display-xl":  ["3.75rem", { lineHeight: "1.08", letterSpacing: "-0.025em" }],
        "display-lg":  ["3rem",    { lineHeight: "1.1",  letterSpacing: "-0.02em" }],
        "display-md":  ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        "display-sm":  ["1.875rem",{ lineHeight: "1.2",  letterSpacing: "-0.01em" }],
      },

      // ── Spacing ──────────────────────────────────────────────────────────
      maxWidth: {
        site: "1280px",
        prose: "68ch",
      },

      // ── Border radius ────────────────────────────────────────────────────
      borderRadius: {
        lg:  "var(--radius)",
        md:  "calc(var(--radius) - 2px)",
        sm:  "calc(var(--radius) - 4px)",
        xl:  "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },

      // ── Animations ───────────────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "word-cycle": {
          "0%, 18%":  { opacity: "1",   transform: "translateY(0)" },
          "22%, 98%": { opacity: "0",   transform: "translateY(-12px)" },
          "100%":     { opacity: "0",   transform: "translateY(-12px)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.4" },
        },
      },
      animation: {
        "fade-in":    "fade-in 0.4s ease-out both",
        "fade-up":    "fade-up 0.5s ease-out both",
        "word-cycle": "word-cycle 3s ease-in-out infinite",
        "pulse-slow": "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
