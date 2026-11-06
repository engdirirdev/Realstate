import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AIDA Conversational Real Estate AI — Kiro-Maal",
  description:
    "Chat with AIDA, Somalia's first conversational real estate intelligence agent. Search verified listings, ask bilingual questions in Somali and English, and receive personalized recommendations.",
  alternates: {
    canonical: "/ai-assistant",
  },
  openGraph: {
    title: "AIDA Conversational Real Estate AI — Kiro-Maal Somalia",
    description: "Somalia's first bilingual real estate AI agent grounded in live database listings.",
    url: "/ai-assistant",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIDA Real Estate AI Assistant Somalia",
    description: "Conversational property search in Somali and English.",
  },
};

export default function AIAssistantLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
