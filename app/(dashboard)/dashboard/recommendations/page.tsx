// ================================================================
// PAGE NAME  : User Dashboard — AI Recommendations (Server Component)
// ROUTE      : /dashboard/recommendations
// DESCRIPTION: Server-rendered AI-scored recommendations with 0ms
//              client fetch latency and instant initial paint
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateRecommendations } from "@/lib/recommendation-engine";
import DashboardRecommendationsClient from "@/components/dashboard/DashboardRecommendationsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Recommendations – Manager Portal | Kiro-Maal Real Estate",
  description: "Algorithmic portfolio evaluation and property matching recommendations.",
  robots: { index: false, follow: false },
};

export const revalidate = 60;

export default async function RecommendationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const preferences = await prisma.userPreference.findUnique({
    where: { userId },
  });

  const rawRecommendations = await generateRecommendations(
    {
      userId,
      location: preferences?.preferredLocation || undefined,
      minBudget: preferences?.minBudget || undefined,
      maxBudget: preferences?.maxBudget || undefined,
      preferredType: preferences?.preferredType || undefined,
      preferredBedrooms: preferences?.preferredBedrooms || undefined,
      preferredBathrooms: preferences?.preferredBathrooms || undefined,
      preferredMinArea: preferences?.preferredMinArea || undefined,
      preferredMaxArea: preferences?.preferredMaxArea || undefined,
    },
    8
  );

  return <DashboardRecommendationsClient initialRecommendations={rawRecommendations} />;
}
