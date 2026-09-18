import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type Props = { params: Promise<{ id: string }> };

// GET: Fetch detailed user info & preview dashboard data
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        preferences: true,
        favorites: {
          include: { property: { include: { images: { take: 1, orderBy: { order: "asc" } } } } },
          orderBy: { createdAt: "desc" },
        },
        recommendations: {
          include: { property: { include: { images: { take: 1, orderBy: { order: "asc" } } } } },
          orderBy: { score: "desc" },
        },
        managedProperties: {
          include: { images: { take: 1, orderBy: { order: "asc" } } },
          orderBy: { createdAt: "desc" },
        },
        customerInquiries: {
          include: { property: { select: { title: true, city: true, price: true } } },
          orderBy: { createdAt: "desc" },
        },
        managerInquiries: {
          include: { property: { select: { title: true, city: true } }, customer: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
        customerBookings: {
          include: { property: { select: { title: true, city: true, price: true } }, payments: true },
          orderBy: { createdAt: "desc" },
        },
        managerBookings: {
          include: { property: { select: { title: true, city: true } }, customer: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
        customerPayments: {
          include: { property: { select: { title: true } } },
          orderBy: { createdAt: "desc" },
        },
        managerPayments: {
          include: { property: { select: { title: true } }, customer: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("[GET /api/admin/users/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch user preview data" }, { status: 500 });
  }
}

// PATCH: Update user status or role
export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, isActive } = await request.json();

    const updateData: any = {};
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("[PATCH /api/admin/users/[id]]", error);
    return NextResponse.json({ error: "Failed to update user account" }, { status: 500 });
  }
}

// DELETE: Delete user or customer account
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    if (session.user.id === id) {
      return NextResponse.json({ error: "You cannot delete your own logged-in admin account." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/users/[id]]", error);
    return NextResponse.json({ error: "Failed to delete user account." }, { status: 500 });
  }
}
