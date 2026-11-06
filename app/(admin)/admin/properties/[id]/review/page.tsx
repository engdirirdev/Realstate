// ================================================================
// PAGE NAME  : Admin Dashboard — Property Review (Server Component)
// ROUTE      : /admin/properties/[id]/review
// DESCRIPTION: Dynamic review page for admin to inspect property-type-
//              specific fields, verify documents, and approve/reject
// ROLE       : ADMIN only
// ================================================================
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminPropertyReviewClient from "@/components/admin/AdminPropertyReviewClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Property Governance Review – Admin Portal | Kiro-Maal Real Estate",
  description: "Inspect property specifications, verify land title deeds, and enforce compliance standards.",
  robots: { index: false, follow: false },
};

export const revalidate = 60;

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyReviewPage({ params }: ReviewPageProps) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      manager: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!property) notFound();

  return <AdminPropertyReviewClient initialProperty={property} />;
}
