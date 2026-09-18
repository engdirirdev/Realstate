import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET: Fetch bookings for Customer, Manager, or Admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;

    const where = role === "USER"
      ? { managerId: userId }
      : role === "ADMIN"
      ? {}
      : { customerId: userId };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        property: {
          select: { id: true, title: true, city: true, price: true, type: true, images: { take: 1, orderBy: { order: "asc" } } },
        },
        customer: { select: { id: true, name: true, email: true, phone: true } },
        manager: { select: { id: true, name: true, email: true } },
        payments: { select: { id: true, amount: true, status: true, transactionRef: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, bookings });
  } catch (error) {
    console.error("[GET /api/bookings]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch bookings" }, { status: 500 });
  }
}

// POST: Customer creates property booking/reservation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Please log in to book a property." }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, startDate, endDate, notes } = body;

    if (!propertyId) {
      return NextResponse.json({ success: false, error: "Property ID is required." }, { status: 400 });
    }

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    const booking = await prisma.booking.create({
      data: {
        propertyId,
        customerId: session.user.id,
        managerId: property.managerId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        totalPrice: property.price,
        status: "PENDING",
        notes: notes || null,
      },
    });

    // Notify Manager
    if (property.managerId) {
      await prisma.notification.create({
        data: {
          userId: property.managerId,
          type: "BOOKING",
          title: "New Booking Request 📅",
          message: `${session.user.name || "A customer"} requested a booking for "${property.title}".`,
          linkUrl: `/dashboard/bookings`,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("[POST /api/bookings]", error);
    return NextResponse.json({ success: false, error: "Failed to create booking." }, { status: 500 });
  }
}

// PATCH: Update booking status (CONFIRMED, CANCELLED, COMPLETED)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, status } = body;

    if (!bookingId || !status) {
      return NextResponse.json({ success: false, error: "Booking ID and status are required." }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: { property: { select: { title: true } } },
    });

    // Notify Customer
    await prisma.notification.create({
      data: {
        userId: updated.customerId,
        type: "BOOKING",
        title: `Booking Status: ${status} 📅`,
        message: `Your booking for "${updated.property.title}" is now ${status}.`,
        linkUrl: `/customer/bookings`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("[PATCH /api/bookings]", error);
    return NextResponse.json({ success: false, error: "Failed to update booking." }, { status: 500 });
  }
}
