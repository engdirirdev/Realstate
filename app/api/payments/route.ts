import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET: Fetch payments for Customer, Manager, or Admin
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

    const payments = await prisma.payment.findMany({
      where,
      include: {
        property: { select: { id: true, title: true, city: true } },
        customer: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
        booking: { select: { id: true, status: true, totalPrice: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const revenueSummary = role === "ADMIN" || role === "USER"
      ? await prisma.payment.aggregate({
          where: role === "USER" ? { managerId: userId, status: "PAID" } : { status: "PAID" },
          _sum: { amount: true },
          _count: { id: true },
        })
      : null;

    return NextResponse.json({
      success: true,
      payments,
      totalRevenue: revenueSummary?._sum?.amount || 0,
      totalPaidTransactions: revenueSummary?._count?.id || 0,
    });
  } catch (error) {
    console.error("[GET /api/payments]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST: Process Demo/Sandbox Payment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Please log in to make a payment." }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, propertyId, amount, paymentMethod } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid payment amount." }, { status: 400 });
    }

    let targetPropId = propertyId;
    let managerId: string | null = null;

    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { property: true },
      });
      if (booking) {
        targetPropId = booking.propertyId;
        managerId = booking.managerId;

        // Update booking status to CONFIRMED
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "CONFIRMED" },
        });
      }
    } else if (propertyId) {
      const prop = await prisma.property.findUnique({ where: { id: propertyId } });
      if (prop) managerId = prop.managerId;
    }

    const txnRef = `TXN-DEMO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await prisma.payment.create({
      data: {
        bookingId: bookingId || null,
        propertyId: targetPropId || null,
        customerId: session.user.id,
        managerId: managerId || null,
        amount: Number(amount),
        currency: "USD",
        paymentMethod: paymentMethod || "DEMO / SANDBOX",
        status: "PAID",
        transactionRef: txnRef,
        receiptUrl: `/customer/payments`,
      },
      include: { property: { select: { title: true } } },
    });

    // Send notifications
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "PAYMENT",
        title: "Payment Successful 💳",
        message: `Your payment of $${amount} for "${payment.property?.title || "Property"}" was processed successfully. Ref: ${txnRef}`,
        linkUrl: `/customer/payments`,
      },
    }).catch(() => {});

    if (managerId) {
      await prisma.notification.create({
        data: {
          userId: managerId,
          type: "PAYMENT",
          title: "New Payment Received 💰",
          message: `Received payment of $${amount} for "${payment.property?.title || "Property"}". Ref: ${txnRef}`,
          linkUrl: `/dashboard/payments`,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("[POST /api/payments]", error);
    return NextResponse.json({ success: false, error: "Failed to process payment." }, { status: 500 });
  }
}
