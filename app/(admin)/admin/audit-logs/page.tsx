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

export const revalidate = 60;

export default async function AdminAuditLogsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rawLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const logs: AuditItem[] = rawLogs.map((l) => ({
    id: l.id,
    userId: l.userId,
    action: l.action,
    details: l.details,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt.toISOString(),
  }));

  return <AdminAuditLogsClient initialLogs={logs} />;
}
