import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET: Fetch inquiries for logged in Customer or Manager
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

    const inquiries = await prisma.inquiry.findMany({
      where,
      include: {
        property: {
          select: { id: true, title: true, city: true, price: true, images: { take: 1, orderBy: { order: "asc" } } },
        },
        customer: { select: { id: true, name: true, email: true, phone: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, inquiries });
  } catch (error) {
    console.error("[GET /api/inquiries]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch inquiries" }, { status: 500 });
  }
}

// POST: Customer sends inquiry to Property Manager
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Please log in to send an inquiry." }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, subject, message } = body;

    if (!propertyId || !message) {
      return NextResponse.json({ success: false, error: "Property ID and message are required." }, { status: 400 });
    }

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        propertyId,
        customerId: session.user.id,
        managerId: property.managerId,
        subject: subject || `Inquiry about ${property.title}`,
        message,
        status: "NEW",
      },
    });

    // Create notification for Manager if assigned
    if (property.managerId) {
      await prisma.notification.create({
        data: {
          userId: property.managerId,
          type: "INQUIRY",
          title: "New Customer Property Inquiry 💬",
          message: `${session.user.name || "A customer"} sent an inquiry for "${property.title}".`,
          linkUrl: `/dashboard/inquiries`,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, inquiry });
  } catch (error) {
    console.error("[POST /api/inquiries]", error);
    return NextResponse.json({ success: false, error: "Failed to send inquiry." }, { status: 500 });
  }
}

// PATCH: Manager responds to inquiry
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { inquiryId, response, status } = body;

    if (!inquiryId) {
      return NextResponse.json({ success: false, error: "Inquiry ID is required." }, { status: 400 });
    }

    const updated = await prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        ...(response && { response }),
        ...(status && { status }),
      },
      include: { property: { select: { title: true } } },
    });

    // Send notification to customer
    if (response) {
      await prisma.notification.create({
        data: {
          userId: updated.customerId,
          type: "INQUIRY",
          title: "Property Manager Replied 💬",
          message: `The manager replied to your inquiry for "${updated.property.title}".`,
          linkUrl: `/customer/inquiries`,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (error) {
    console.error("[PATCH /api/inquiries]", error);
    return NextResponse.json({ success: false, error: "Failed to update inquiry." }, { status: 500 });
  }
}
