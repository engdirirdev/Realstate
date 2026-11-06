import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomerSavedSearchesClient, { SavedSearchItem } from "@/components/customer/CustomerSavedSearchesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Searches – Customer Portal | Kiro-Maal Real Estate",
  robots: { index: false, follow: false },
};

export const revalidate = 30;

export default async function CustomerSavedSearchesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rawSearches = await prisma.searchHistory.findMany({
    where: { userId: session.user.id, isSaved: true },
    orderBy: { createdAt: "desc" },
  });

  const searches: SavedSearchItem[] = rawSearches.map((s) => ({
    id: s.id,
    name: s.name,
    location: s.location,
    propertyType: s.propertyType,
    minPrice: s.minPrice,
    maxPrice: s.maxPrice,
    bedrooms: s.bedrooms,
    createdAt: s.createdAt.toISOString(),
  }));

  return <CustomerSavedSearchesClient initialSearches={searches} />;
}
