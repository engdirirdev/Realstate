import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guards";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission(PERMISSIONS.USER_VIEW_ALL);
    if (authResult.response) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const where: any = {};
    if (role && role !== "ALL") {
      if (role === "USERS" || role === "STAFF") {
        where.role = { in: ["ADMIN", "USER"] };
      } else {
        where.role = role;
      }
    }
    if (status === "ACTIVE") where.isActive = true;
    if (status === "INACTIVE") where.isActive = false;

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { email: { contains: query } },
        { phone: { contains: query } },
      ];
    }

    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : undefined;
    const pageSize = pageSizeParam ? Math.min(100, Math.max(1, parseInt(pageSizeParam, 10))) : 25;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...(page ? { take: pageSize, skip: (page - 1) * pageSize } : {}),
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
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ success: true, users, total, page: page || 1, pageSize });
  } catch (error) {
    console.error("[GET /api/admin/users-list]", error);
    return NextResponse.json({ success: false, error: "Failed to load users." }, { status: 500 });
  }
}
