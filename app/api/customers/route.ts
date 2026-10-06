import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/customers - List customers for managers and admins
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (role !== "ADMIN" && role !== "USER") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const customers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: { name: "asc" },
      take: 200,
    });

    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    console.error("[GET /api/customers]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch customers" }, { status: 500 });
  }
}
