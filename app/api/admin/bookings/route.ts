import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const whereClause: any = {};
    if (status && status !== "ALL") whereClause.status = status;

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
          },
        },
        customer: { select: { id: true, name: true, email: true, phone: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, bookings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: "ID and status required" }, { status: 400 });

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update booking status" }, { status: 500 });
  }
}
