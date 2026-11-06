import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, forbiddenResponse } from "@/lib/auth-guards";
import { canAccessBooking } from "@/lib/rbac";
import { computeRental } from "@/lib/rental-pricing";

// GET: Fetch bookings for Customer, Manager, or Admin
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult.response) {
      return authResult.response;
    }
    const { user } = authResult;

    const where =
      user.role === "USER"
        ? { managerId: user.id }
        : user.role === "ADMIN"
        ? {}
        : { customerId: user.id };

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");
    const page = Math.max(1, parseInt(pageParam || "1", 10));
    const pageSize = pageSizeParam ? Math.min(100, Math.max(1, parseInt(pageSizeParam, 10))) : 25;
    const skip = (page - 1) * pageSize;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              price: true,
              type: true,
              images: { take: 1, orderBy: { order: "asc" } },
            },
          },
          customer: { select: { id: true, name: true, email: true, phone: true } },
          manager: { select: { id: true, name: true, email: true } },
          payments: {
            select: { id: true, amount: true, status: true, transactionRef: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      bookings,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("[GET /api/bookings]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST: Customer creates property booking/reservation
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult.response) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await request.json();
    const { propertyId, startDate, endDate, notes } = body;

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "Property ID is required." },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found." },
        { status: 404 }
      );
    }

    let calculatedTotalPrice = property.price;
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e > s) {
        const numBase =
          typeof property.basePrice === "number" && property.basePrice > 0
            ? property.basePrice
            : Math.max(0, property.price - (property.companyServiceFee || 0) - (property.legalTransferFee || 0));
        const calc = computeRental(
          numBase,
          property.rentPeriod,
          property.securityDeposit,
          s,
          e,
          {
            companyServiceFee: property.companyServiceFee,
            legalTransferFee: property.legalTransferFee,
          }
        );
        calculatedTotalPrice = calc.totalAmount;
      }
    }

    const booking = await prisma.booking.create({
      data: {
        propertyId,
        customerId: user.id,
        managerId: property.managerId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        totalPrice: calculatedTotalPrice,
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
          message: `${user.name || "A customer"} requested a booking for "${property.title}".`,
          linkUrl: `/dashboard/bookings`,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("[POST /api/bookings]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create booking." },
      { status: 500 }
    );
  }
}

// PATCH: Update booking status with strict IDOR authorization guards
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult.response) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await request.json();
    const { bookingId, status } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, error: "Booking ID and status are required." },
        { status: 400 }
      );
    }

    // 1. Fetch booking to verify existence and ownership
    const existing = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Booking not found." },
        { status: 404 }
      );
    }

    // 2. IDOR Prevention: Check if user has permission to access this booking
    if (!canAccessBooking(user, existing)) {
      return forbiddenResponse(
        "Forbidden. You do not have permission to manage this booking."
      );
    }

    // 3. Status Transition Authorization: Customers can only cancel their own bookings
    if (user.role === "CUSTOMER") {
      if (status !== "CANCELLED") {
        return forbiddenResponse(
          "Forbidden. Customers can only cancel their own bookings."
        );
      }
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: { property: { select: { title: true } } },
    });

    // Notify Customer when manager/admin updates status
    if (user.id !== updated.customerId) {
      await prisma.notification.create({
        data: {
          userId: updated.customerId,
          type: "BOOKING",
          title: `Booking Status: ${status} 📅`,
          message: `Your booking for "${updated.property.title}" is now ${status}.`,
          linkUrl: `/customer/bookings`,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("[PATCH /api/bookings]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update booking." },
      { status: 500 }
    );
  }
}
