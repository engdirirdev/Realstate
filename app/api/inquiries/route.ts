import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, forbiddenResponse } from "@/lib/auth-guards";

// GET: Fetch inquiries for Customer, Manager, or Admin
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

    const inquiries = await prisma.inquiry.findMany({
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
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, inquiries });
  } catch (error) {
    console.error("[GET /api/inquiries]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}

// POST: Customer sends inquiry on a property
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult.response) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await request.json();
    const { propertyId, message } = body;

    if (!propertyId || !message) {
      return NextResponse.json(
        { success: false, error: "Property ID and message are required." },
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

    const inquiry = await prisma.inquiry.create({
      data: {
        propertyId,
        customerId: user.id,
        managerId: property.managerId,
        message: message.trim(),
        status: "NEW",
      },
    });

    // Notify Manager
    if (property.managerId) {
      await prisma.notification.create({
        data: {
          userId: property.managerId,
          type: "INQUIRY",
          title: "New Property Inquiry 💬",
          message: `${user.name || "A customer"} inquired about "${property.title}".`,
          linkUrl: `/dashboard/inquiries`,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, inquiry });
  } catch (error) {
    console.error("[POST /api/inquiries]", error);
    return NextResponse.json(
      { success: false, error: "Failed to send inquiry." },
      { status: 500 }
    );
  }
}

// PATCH: Manager or Admin responds to inquiry (Guarded against IDOR)
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult.response) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await request.json();
    const { inquiryId, response, status } = body;

    if (!inquiryId) {
      return NextResponse.json(
        { success: false, error: "Inquiry ID is required." },
        { status: 400 }
      );
    }

    // 1. Verify existence
    const existing = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found." },
        { status: 404 }
      );
    }

    // 2. IDOR Prevention: Only assigned manager or super admin may respond
    const isAssignedManager = existing.managerId === user.id;
    const isAdmin = user.role === "ADMIN";
    if (!isAdmin && !isAssignedManager) {
      return forbiddenResponse(
        "Forbidden. Only the assigned manager or an administrator can respond to this inquiry."
      );
    }

    const updated = await prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        ...(response && { response: response.trim() }),
        ...(status && { status }),
      },
      include: { property: { select: { title: true } } },
    });

    // Send notification to customer if manager responded
    if (response && updated.customerId) {
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
    return NextResponse.json(
      { success: false, error: "Failed to update inquiry." },
      { status: 500 }
    );
  }
}
