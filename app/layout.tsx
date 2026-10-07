import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Providers from "@/components/Providers";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  title: {
    default: "AI Real Estate | Smart Property Search in Somalia",
    template: "%s | AI Real Estate",
  },
  description:
    "Somalia's first AI-powered real estate platform. Get intelligent property recommendations, price predictions powered by ML, and a 24/7 AI assistant.",
  keywords: ["real estate", "Somalia", "property", "AI", "recommendations", "price prediction", "Mogadishu", "Hargeisa"],
  authors: [{ name: "AI Real Estate Team" }],
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "http://localhost:3000",
    title: "AI Real Estate | Smart Property Search in Somalia",
    description: "Find your perfect property with AI-powered recommendations and price predictions.",
    siteName: "AI Real Estate",
  },
};

import AIChatbot from "@/components/AIChatbot";
import NavigationProgressBar from "@/components/layout/NavigationProgressBar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased min-h-screen bg-white text-gray-900">
        <Providers>
          <NavigationProgressBar />
          {children}
          <Toaster />
          <AIChatbot />
        </Providers>
      </body>
    </html>
  );
}
