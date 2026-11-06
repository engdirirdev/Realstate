// ================================================================
// PAGE NAME  : Admin Dashboard — Locations & Regions
// ROUTE      : /admin/locations
// DESCRIPTION: Manage regional locations and cities (SSR Fast)
//              Kiro-Maal Real Estate Master Design System
// ROLE       : ADMIN
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLocationsClient, { LocationItem } from "@/components/admin/AdminLocationsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Locations & Regions – Admin Portal | Kiro-Maal Real Estate",
  robots: { index: false, follow: false },
};

export const revalidate = 60;

export default async function AdminLocationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rawLocations = await prisma.location.findMany({
    orderBy: { city: "asc" },
  });

  const locations: LocationItem[] = rawLocations.map((l) => ({
    id: l.id,
    city: l.city,
    region: l.region,
    country: l.country,
    createdAt: l.createdAt.toISOString(),
  }));

  return <AdminLocationsClient initialLocations={locations} />;
}
