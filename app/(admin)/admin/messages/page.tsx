// ================================================================
// PAGE NAME  : Admin Dashboard — Shared Conversations & Messages
// ROUTE      : /admin/messages
// DESCRIPTION: Shared conversation hub for Super Admin:
//              - Direct Admin <-> Property Manager conversations
//              - Shared live Customer inquiry threads
//              - Inbound public contact form submissions
// ROLE       : ADMIN only
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getInquiriesDashboardData } from "@/lib/server/dashboard-data";
import ManagerInquiriesClient from "@/components/dashboard/ManagerInquiriesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared Messages & Inquiries – Admin | Kiro-Maal Real Estate",
};

export const revalidate = 0;

export default async function AdminMessagesPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any)?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [inquiries, managers, rawContactMessages] = await Promise.all([
    getInquiriesDashboardData(session.user.id, "ADMIN"),
    prisma.user.findMany({
      where: { role: "USER", isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.contactMessage.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const contactMessages = rawContactMessages.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    subject: m.subject,
    message: m.message,
    isRead: m.isRead,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <ManagerInquiriesClient
      initialInquiries={inquiries}
      portalRole="ADMIN"
      currentUserId={session.user.id}
      counterparts={managers}
      contactMessages={contactMessages}
    />
  );
}
