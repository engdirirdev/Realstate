import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Property Valuation & Price Estimator — Kiro-Maal",
  description:
    "Instant, data-driven real estate valuations across Somalia. Our calibrated machine learning model calculates market fair value, confidence intervals, and spatial comps for villas, apartments, and land.",
  alternates: {
    canonical: "/price-prediction",
  },
  openGraph: {
    title: "AI Property Valuation & Price Estimator — Kiro-Maal Somalia",
    description:
      "Instant machine learning property valuations and confidence intervals across Mogadishu, Hargeisa, and Somalia.",
    url: "/price-prediction",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Real Estate Price Estimator Somalia",
    description: "Instant data-driven property valuations and market comps.",
  },
};

export default function PricePredictionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
