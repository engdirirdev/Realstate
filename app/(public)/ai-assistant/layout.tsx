import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Property Assistant & Concierge — Kiro-Maal Real Estate",
  description:
    "Chat with Somalia's first conversational real estate AI. Get instant recommendations, verify property amenities, and estimate valuations in English and Somali.",
  alternates: {
    canonical: "/ai-assistant",
  },
  openGraph: {
    title: "AI Property Assistant — Kiro-Maal Real Estate",
    description: "24/7 bilingual real estate AI concierge for Somali properties.",
    url: "/ai-assistant",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Property Assistant — Kiro-Maal Real Estate",
    description: "Intelligent property search and instant answers in Somalia.",
  },
};

export default function AIAssistantLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
