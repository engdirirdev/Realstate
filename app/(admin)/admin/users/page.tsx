// ================================================================
// PAGE NAME  : Admin Dashboard — Manage Users Directory
// ROUTE      : /admin/users
// DESCRIPTION: Admin User List — Filter tabs [All Users] [Admins]
//              [Users / Managers] [Customers] (SSR Fast)
//              Kiro-Maal Real Estate Master Design System
// ROLE       : ADMIN only
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminUsersClient, { UserItem } from "@/components/admin/AdminUsersClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Directory – Admin Portal | Kiro-Maal Real Estate",
  robots: { index: false, follow: false },
};

export const revalidate = 60;

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rawUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          favorites: true,
          pricePredictions: true,
          recommendations: true,
          managedProperties: true,
          customerBookings: true,
          customerPayments: true,
        },
      },
    },
  });

  const initialUsers: UserItem[] = rawUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return <AdminUsersClient initialUsers={initialUsers} />;
}
