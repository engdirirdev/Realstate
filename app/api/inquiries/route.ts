import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, forbiddenResponse } from "@/lib/auth-guards";
import { dbCache } from "@/lib/cache";

// GET: Fetch inquiries for Customer, Manager, or Admin
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult.response) {
      return authResult.response;
    }
    const { user } = authResult;

    const where: any =
      user.role === "USER"
        ? {
            OR: [
              { managerId: user.id },
              { property: { managerId: user.id } },
              { managerId: null },
            ],
          }
        : user.role === "ADMIN"
        ? {}
        : { customerId: user.id };

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");
    const page = Math.max(1, parseInt(pageParam || "1", 10));
    const pageSize = pageSizeParam ? Math.min(100, Math.max(1, parseInt(pageSizeParam, 10))) : 50;
    const skip = (page - 1) * pageSize;

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              price: true,
              type: true,
              listingType: true,
              images: { take: 1, orderBy: { order: "asc" } },
            },
          },
          customer: { select: { id: true, name: true, email: true, phone: true } },
          manager: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: pageSize,
        skip,
      }),
      prisma.inquiry.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      inquiries,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("[GET /api/inquiries]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}

// POST: Customer sends message / inquiry to a Property Manager
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult.response) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await request.json();
    const { propertyId, managerId: requestedManagerId, subject, message } = body;

    if (!message || !String(message).trim()) {
      return NextResponse.json(
        { success: false, error: "Message content is required." },
        { status: 400 }
      );
    }

    let property = null;
    if (propertyId) {
      property = await prisma.property.findUnique({
        where: { id: propertyId },
      });
    } else if (requestedManagerId) {
      // If customer selected a manager directly without specifying a property, attach their latest managed property or any active property
      property =
        (await prisma.property.findFirst({
          where: { managerId: requestedManagerId, isActive: true },
          orderBy: { createdAt: "desc" },
        })) ||
        (await prisma.property.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        }));
    } else {
      property = await prisma.property.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found." },
        { status: 404 }
      );
    }

    let targetManagerId = requestedManagerId || property.managerId || null;
    if (!targetManagerId) {
      // Assign to an active Property Manager (role = USER) so a manager always receives the message
      const activeManager = await prisma.user.findFirst({
        where: { role: "USER", isActive: true },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      targetManagerId = activeManager?.id || null;
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        propertyId: property.id,
        customerId: user.id,
        managerId: targetManagerId,
        subject:
          subject && String(subject).trim()
            ? String(subject).trim()
            : `Inquiry about ${property.title}`,
        message: String(message).trim(),
        status: "NEW",
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            listingType: true,
            images: { take: 1, orderBy: { order: "asc" } },
          },
        },
        customer: { select: { id: true, name: true, email: true, phone: true } },
        manager: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    dbCache.invalidateTags(["inquiries", "notifications"]);

    // Notify Assigned Manager
    if (targetManagerId) {
      await prisma.notification
        .create({
          data: {
            userId: targetManagerId,
            type: "INQUIRY",
            title: "New Customer Message 💬",
            message: `${user.name || "A customer"} sent you a message about "${property.title}".`,
            linkUrl: `/dashboard/inquiries`,
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({ success: true, inquiry });
  } catch (error) {
    console.error("[POST /api/inquiries]", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message." },
      { status: 500 }
    );
  }
}

// PATCH: Manager replies to inquiry OR Customer sends a follow-up reply in the thread
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult.response) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await request.json();
    const { inquiryId, response, customerReply, status } = body;

    if (!inquiryId) {
      return NextResponse.json(
        { success: false, error: "Inquiry ID is required." },
        { status: 400 }
      );
    }

    // 1. Verify existence
    const existing = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        property: { select: { id: true, title: true, managerId: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found." },
        { status: 404 }
      );
    }

    // Case A: Customer is sending a follow-up reply in their own thread
    if (customerReply && String(customerReply).trim()) {
      if (existing.customerId !== user.id && user.role !== "ADMIN") {
        return forbiddenResponse("You can only reply to your own message threads.");
      }

      const timestamp = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const updatedMessage = `${existing.message}\n\n[${user.name || "Customer"} • ${timestamp}]:\n${String(customerReply).trim()}`;

      const updated = await prisma.inquiry.update({
        where: { id: inquiryId },
        data: {
          message: updatedMessage,
          status: "NEW",
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              price: true,
              listingType: true,
              images: { take: 1, orderBy: { order: "asc" } },
            },
          },
          customer: { select: { id: true, name: true, email: true, phone: true } },
          manager: { select: { id: true, name: true, email: true, phone: true } },
        },
      });

      dbCache.invalidateTags(["inquiries", "notifications"]);

      const notifyManagerId = updated.managerId || existing.property?.managerId;
      if (notifyManagerId) {
        await prisma.notification
          .create({
            data: {
              userId: notifyManagerId,
              type: "INQUIRY",
              title: "Customer Replied to Inquiry 💬",
              message: `${user.name || "Customer"} sent a follow-up reply on "${existing.property.title}".`,
              linkUrl: `/dashboard/inquiries`,
            },
          })
          .catch(() => {});
      }

      return NextResponse.json({ success: true, inquiry: updated });
    }

    // Case B: Manager or Admin is responding to the Customer
    const isAssignedManager =
      existing.managerId === user.id ||
      existing.property?.managerId === user.id ||
      (user.role === "USER" && !existing.managerId);
    const isAdmin = user.role === "ADMIN";

    if (!isAdmin && !isAssignedManager) {
      return forbiddenResponse(
        "Forbidden. Only the assigned property manager or an administrator can respond to this inquiry."
      );
    }

    const updated = await prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        ...(response !== undefined && { response: String(response).trim() }),
        status: status || "RESPONDED",
        ...(!existing.managerId && user.role === "USER" ? { managerId: user.id } : {}),
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            listingType: true,
            images: { take: 1, orderBy: { order: "asc" } },
          },
        },
        customer: { select: { id: true, name: true, email: true, phone: true } },
        manager: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    dbCache.invalidateTags(["inquiries", "notifications"]);

    // Send notification to customer when manager responds
    if (response && updated.customerId) {
      await prisma.notification
        .create({
          data: {
            userId: updated.customerId,
            type: "INQUIRY",
            title: "Property Manager Replied 💬",
            message: `${user.name || "The property manager"} replied to your message for "${updated.property.title}".`,
            linkUrl: `/customer/messages`,
          },
        })
        .catch(() => {});
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
