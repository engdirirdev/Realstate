// ================================================================
// PAGE NAME  : Customer Portal — Notifications
// ROUTE      : /customer/notifications
// DESCRIPTION: Notifications list for customer with Clear & Clear All
//              Kiro-Maal Real Estate Master Design System
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import NotificationsListClient from "@/components/notifications/NotificationsListClient";

export const metadata: Metadata = {
  title: "Notifications – Customer Portal | Kiro-Maal Real Estate",
};

export default async function CustomerNotificationsPage() {
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
      badgeText="Activity Feed"
      headingText="Client Notifications"
      emptyDescription="You will receive instant updates here when property managers respond to your inquiries or confirm scheduled visits."
    />
  );
}
