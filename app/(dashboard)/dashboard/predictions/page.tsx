// ================================================================
// PAGE NAME  : Manager Dashboard — Price Prediction & Valuation
// ROUTE      : /dashboard/predictions
// DESCRIPTION: Live interactive AI price prediction engine and history
//              archive inside the manager dashboard layout
//              Kiro-Maal Real Estate Master Design System
// ROLE       : USER / Manager
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardPricePrediction from "@/components/dashboard/DashboardPricePrediction";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Price Prediction – Manager Dashboard | Kiro-Maal Real Estate",
};

export default async function PredictionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const predictions = await prisma.pricePrediction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const formattedPredictions = predictions.map((p) => ({
    id: p.id,
    location: p.location,
    propertyType: p.propertyType,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: p.area,
    predictedPrice: p.predictedPrice,
    confidence: p.confidence,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      <DashboardPricePrediction initialPredictions={formattedPredictions} />
    </div>
  );
}
