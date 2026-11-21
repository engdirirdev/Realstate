import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ManagerInquiriesClient from "@/components/dashboard/ManagerInquiriesClient";
import { getInquiriesDashboardData } from "@/lib/server/dashboard-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inquiries & Messages – Manager Portal | Kiro-Maal Real Estate",
  description:
    "Shared conversations with customers and direct coordination with Super Admin.",
  robots: { index: false, follow: false },
};

export const revalidate = 0;

export default async function ManagerInquiriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = ((session.user as any).role || "USER") as "ADMIN" | "USER";

  const [inquiries, admins] = await Promise.all([
    getInquiriesDashboardData(session.user.id, role),
    prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="w-full min-w-0">
      <ManagerInquiriesClient
        initialInquiries={inquiries}
        portalRole={role}
        currentUserId={session.user.id}
        counterparts={admins}
      />
    </div>
  );
}
