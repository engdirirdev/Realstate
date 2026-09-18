import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const where: any = {};
    if (role && role !== "ALL") where.role = role;
    if (status === "ACTIVE") where.isActive = true;
    if (status === "INACTIVE") where.isActive = false;

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { email: { contains: query } },
        { phone: { contains: query } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("[GET /api/admin/users-list]", error);
    return NextResponse.json({ success: false, error: "Failed to load users." }, { status: 500 });
  }
}
