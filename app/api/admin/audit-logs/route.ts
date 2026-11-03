import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guards";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET() {
  try {
    const authResult = await requirePermission(PERMISSIONS.AUDIT_LOG_VIEW);
    if (authResult.response) {
      return authResult.response;
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
