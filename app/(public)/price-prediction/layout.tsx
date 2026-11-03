import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Property Price Prediction & Valuation — Kiro-Maal Real Estate",
  description:
    "Estimate property market value in Somalia with machine learning intelligence. Get data-backed price predictions, confidence intervals, and neighborhood market benchmarks for Mogadishu & Hargeisa.",
  alternates: {
    canonical: "/price-prediction",
  },
  openGraph: {
    title: "AI Property Price Prediction & Valuation — Kiro-Maal Real Estate",
    description:
      "Instant machine learning property valuation for villas, apartments, and land across Somalia.",
    url: "/price-prediction",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Property Valuation — Kiro-Maal Real Estate Somalia",
    description: "Instant data-backed real estate valuations in Somalia.",
  },
};

export default function PricePredictionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
