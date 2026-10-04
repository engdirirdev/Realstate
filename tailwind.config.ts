/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // ─── Theme Colors matching Kiro-Maal Master Design System ───
        brand: {
          navy: "#07111F",
          sidebar: "#0B1523",
          gold: "#C89B3C",
          goldBright: "#D9B45B",
          goldDark: "#A97918",
          bg: "#F7F3EA",
          cream: "#F7F3EA",
          ivory: "#FCFBF7",
          border: "#E8E1D4",
          text: "#07111F",
          muted: "#6B7280",
        },
        gold: {
          DEFAULT: "#C89B3C",
          50:  "#FAF7EE",
          100: "#F5EFDD",
          200: "#EBDDBA",
          300: "#E0CA97",
          400: "#D9B45B",
          500: "#C89B3C",
          600: "#B88924",
          700: "#A97918",
          800: "#8C6518",
          900: "#6B4D12",
        },

        // ─── Emerald & Cyan Accents ──────────────────────────────────
        emerald: {
          DEFAULT: "#10B981",
          50:  "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        cyan: {
          DEFAULT: "#06B6D4",
          50:  "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
        },
        purple: {
          DEFAULT: "#8B5CF6",
          50:  "#FAF5FF",
          100: "#F3E8FF",
          200: "#E9D5FF",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
        },

        // ─── shadcn/ui system tokens ─────────────────────────────────
        secondary: {
          DEFAULT: "#F1F5F9",
          foreground: "#0F172A",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#F7F3EA",
          foreground: "#6B7280",
        },
        accent: {
          DEFAULT: "#07111F",
          foreground: "#C89B3C",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      fontFamily: {
        sans:    ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to:   { transform: "translateX(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 0.35s ease-out",
        "slide-in":       "slide-in 0.3s ease-out",
        shimmer:          "shimmer 2s linear infinite",
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-pattern":    "linear-gradient(135deg, #0F2747 0%, #08203A 100%)",
        shimmer:           "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
      },

      boxShadow: {
        card:       "0 1px 3px rgba(15,39,71,0.05), 0 4px 12px rgba(15,39,71,0.03)",
        "card-hover":"0 12px 28px rgba(15,39,71,0.08), 0 4px 8px rgba(15,39,71,0.04)",
        glow:       "0 0 0 3px rgba(22,119,255,0.20)",
        "blue-glow":"0 0 0 3px rgba(22,119,255,0.25)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
