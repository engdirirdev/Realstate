import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guards";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission(PERMISSIONS.AUDIT_LOG_VIEW);
    if (authResult.response) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");
    const page = Math.max(1, parseInt(pageParam || "1", 10));
    const pageSize = pageSizeParam ? Math.min(100, Math.max(1, parseInt(pageSizeParam, 10))) : 50;
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip,
      }),
      prisma.auditLog.count(),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("[GET /api/admin/audit-logs]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
