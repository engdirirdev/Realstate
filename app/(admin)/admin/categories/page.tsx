// ================================================================
// PAGE NAME  : Admin Dashboard — Categories & Property Types
// ROUTE      : /admin/categories
// DESCRIPTION: Manage property categories and taxonomy (SSR Fast)
//              Kiro-Maal Real Estate Master Design System
// ROLE       : ADMIN
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminCategoriesClient, { CategoryItem } from "@/components/admin/AdminCategoriesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Property Categories – Admin Portal | Kiro-Maal Real Estate",
  robots: { index: false, follow: false },
};

export const revalidate = 60;

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rawCategories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const categories: CategoryItem[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    createdAt: c.createdAt.toISOString(),
  }));

  return <AdminCategoriesClient initialCategories={categories} />;
}
