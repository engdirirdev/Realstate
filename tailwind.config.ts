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

        // ─── Theme Colors matching Reference Design ──────────────────
        brand: {
          navy: "#0F2747",
          sidebar: "#08203A",
          blue: "#1677FF",
          blueHover: "#0F5ED7",
          sky: "#38BDF8",
          emerald: "#10B981",
          success: "#22C55E",
          purple: "#8B5CF6",
          warning: "#F59E0B",
          danger: "#EF4444",
          bg: "#F5F1EA",
          beige: "#F5F1EA",
          beigeLight: "#FAF7F2",
          card: "#FFFFFF",
          border: "#E2DDD1",
          text: "#0F172A",
          muted: "#64748B",
          light: "#94A3B8",
        },

        // ─── Primary (Bright Blue #1677FF) ───────────────────────────
        primary: {
          DEFAULT: "#1677FF",
          50:  "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#1677FF",
          600: "#0F5ED7",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          foreground: "#FFFFFF",
        },

        // ─── Sidebar & Navy Shades ───────────────────────────────────
        navy: {
          DEFAULT: "#0F2747",
          sidebar: "#08203A",
          50:  "#F5F8FC",
          100: "#E8EEF5",
          200: "#DCE6F2",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#0F2747",
          900: "#08203A",
          950: "#051324",
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
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        accent: {
          DEFAULT: "#EFF6FF",
          foreground: "#1677FF",
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
