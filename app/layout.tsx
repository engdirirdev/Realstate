import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Providers from "@/components/Providers";
import { Toaster } from "@/components/ui/toaster";
import LazyAIChatbot from "@/components/layout/LazyAIChatbot";
import JsonLd from "@/components/seo/JsonLd";
import { generateRealEstateAgentSchema, generateWebSiteSchema } from "@/lib/seo-schema";
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

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kiromaal.com";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Kiro-Maal Real Estate | Luxury Properties & AI Valuation in Somalia",
    template: "%s | Kiro-Maal Real Estate Somalia",
  },
  description:
    "Somalia's premier luxury real estate platform. Discover verified luxury villas, modern apartments, and prime commercial plots across Mogadishu, Hargeisa, and Kismayo with intelligent AI valuation and 360 virtual tours.",
  keywords: [
    "Kiro-Maal Real Estate",
    "Somalia Real Estate",
    "Mogadishu Luxury Villas",
    "Hargeisa Apartments",
    "Commercial Land Somalia",
    "AI Property Valuation",
    "Somali diaspora property investment",
    "Halal real estate transactions",
    "Guryo iib ah Muqdisho",
    "Dhul iib ah Soomaaliya",
  ],
  authors: [{ name: "Kiro-Maal Real Estate Intelligence Team", url: baseUrl }],
  creator: "Kiro-Maal Platform",
  publisher: "Kiro-Maal Real Estate",
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "so-SO": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["so_SO"],
    url: baseUrl,
    title: "Kiro-Maal Real Estate | Luxury Properties & AI Valuation in Somalia",
    description:
      "Explore verified luxury listings, instant market valuations, and transparent property transactions across Somalia.",
    siteName: "Kiro-Maal Luxury Real Estate",
    images: [
      {
        url: "/images/og-main.jpg",
        width: 1200,
        height: 630,
        alt: "Kiro-Maal Luxury Real Estate Somalia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kiro-Maal Real Estate | Somalia's Premier Property Platform",
    description:
      "Discover luxury villas and verified plots in Mogadishu & Hargeisa with AI valuation.",
    creator: "@kiromaal",
    site: "@kiromaal",
    images: ["/images/og-main.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

import SkipToContent from "@/components/layout/SkipToContent";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const agentSchema = generateRealEstateAgentSchema();
  const webSiteSchema = generateWebSiteSchema();

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <JsonLd data={agentSchema} />
        <JsonLd data={webSiteSchema} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  function cleanBis() {
                    var els = document.querySelectorAll('[bis_skin_checked]');
                    for (var i = 0; i < els.length; i++) {
                      els[i].removeAttribute('bis_skin_checked');
                    }
                  }
                  cleanBis();
                  if (typeof MutationObserver !== 'undefined') {
                    var observer = new MutationObserver(function(mutations) {
                      for (var i = 0; i < mutations.length; i++) {
                        var m = mutations[i];
                        if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
                          m.target.removeAttribute('bis_skin_checked');
                        }
                      }
                    });
                    observer.observe(document.documentElement, {
                      attributes: true,
                      subtree: true,
                      attributeFilter: ['bis_skin_checked']
                    });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="font-sans antialiased min-h-screen bg-white text-gray-900">
        <SkipToContent />
        <Providers>
          <div id="main-content">
            {children}
          </div>
          <Toaster />
          <LazyAIChatbot />
        </Providers>
      </body>
    </html>
  );
}
