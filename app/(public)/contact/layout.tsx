import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Concierge & Private Advisory — Kiro-Maal Real Estate",
  description:
    "Get in touch with Kiro-Maal's luxury property concierge in Mogadishu, Somalia. Inquire about private villas, prime commercial investments, or schedule a confidential advisory.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Concierge & Private Advisory — Kiro-Maal Real Estate",
    description:
      "Direct advisory, private villa acquisitions, and diaspora property investments across Somalia.",
    url: "/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Concierge — Kiro-Maal Real Estate Somalia",
    description:
      "Inquire about luxury villas, commercial land, and AI valuation in Mogadishu & Hargeisa.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
