// ================================================================
// PAGE NAME  : Manager Dashboard — Notifications
// ROUTE      : /dashboard/notifications
// DESCRIPTION: Manager notifications list with Clear & Clear All
//              Kiro-Maal Real Estate Master Design System
// ROLE       : USER / Manager
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import NotificationsListClient from "@/components/notifications/NotificationsListClient";

export const metadata: Metadata = {
  title: "Notifications – Manager Dashboard | Kiro-Maal Real Estate",
};

export default async function ManagerNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const serialized = notifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    linkUrl: n.linkUrl,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <NotificationsListClient
      initialNotifications={serialized}
      badgeText="Activity Alerts"
      headingText="Operational Notifications"
      emptyDescription="You will receive instant alerts when Admin reviews your listings, or when clients send viewings and reservation inquiries."
    />
  );
}
