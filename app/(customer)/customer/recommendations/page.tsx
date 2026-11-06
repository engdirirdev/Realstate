// ================================================================
// PAGE NAME  : Customer Portal — AI Recommendations (Server Component)
// ROUTE      : /customer/recommendations
// DESCRIPTION: Server-rendered AI-scored property recommendations
//              with 0ms client fetch latency and instant initial paint
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateRecommendations } from "@/lib/recommendation-engine";
import CustomerRecommendationsClient from "@/components/customer/CustomerRecommendationsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Property Recommendations – Customer Portal | Kiro-Maal Real Estate",
  description: "Personalized luxury property recommendations tailored to your budget, location, and lifestyle.",
  robots: { index: false, follow: false },
};

export const revalidate = 60;

export default async function CustomerRecommendationsPage() {
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

  return <CustomerRecommendationsClient initialRecommendations={rawRecommendations} />;
}
