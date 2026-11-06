import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Concierge & Advisory — Kiro-Maal Luxury Real Estate",
  description:
    "Connect with Kiro-Maal's luxury real estate concierge in Mogadishu and Hargeisa. Schedule private villa viewings, consult on diaspora property acquisitions, or request institutional advisory.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Concierge & Advisory — Kiro-Maal Real Estate",
    description:
      "Schedule private luxury viewings or consult on verified real estate acquisitions in Somalia.",
    url: "/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Kiro-Maal Real Estate Concierge",
    description: "Private real estate viewings and acquisition advisory across Somalia.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
