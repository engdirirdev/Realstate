// ================================================================
// PAGE NAME  : Admin Dashboard — Audit Logs
// ROUTE      : /admin/audit-logs
// DESCRIPTION: Platform security audit logs and action history (SSR Fast)
//              Kiro-Maal Real Estate Master Design System
// ROLE       : ADMIN
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminAuditLogsClient, { AuditItem } from "@/components/admin/AdminAuditLogsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Logs – Admin Portal | Kiro-Maal Real Estate",
  robots: { index: false, follow: false },
};

export const revalidate = 30;

export default async function AdminAuditLogsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rawLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  const userIds = Array.from(
    new Set(rawLogs.map((l) => l.userId).filter((id): id is string => Boolean(id)))
  );

  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, role: true },
      })
    : [];

  const userMap = new Map(users.map((u) => [u.id, u]));

  const logs: AuditItem[] = rawLogs.map((l) => {
    const actor = l.userId ? userMap.get(l.userId) : null;
    return {
      id: l.id,
      userId: l.userId,
      actorName: actor?.name || null,
      actorEmail: actor?.email || null,
      actorRole: actor?.role || null,
      action: l.action,
      details: l.details,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt.toISOString(),
    };
  });

  return <AdminAuditLogsClient initialLogs={logs} />;
}
