import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, forbiddenResponse } from "@/lib/auth-guards";
import { dbCache } from "@/lib/cache";
import { parseInquiryThread, serializeInquiryThread } from "@/lib/inquiry-thread";

const INQUIRY_INCLUDE = {
  property: {
    select: {
      id: true,
      title: true,
      city: true,
      price: true,
      type: true,
      listingType: true,
      images: { take: 1, orderBy: { order: "asc" as const } },
    },
  },
  customer: { select: { id: true, name: true, email: true, phone: true, role: true } },
  manager: { select: { id: true, name: true, email: true, phone: true, role: true } },
};

// GET: Fetch inquiries & shared conversations for Customer, Manager, or Admin
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
              { customerId: user.id },
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
    const pageSize = pageSizeParam ? Math.min(100, Math.max(1, parseInt(pageSizeParam, 10))) : 80;
    const skip = (page - 1) * pageSize;

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: INQUIRY_INCLUDE,
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

// POST: Start a Customer->Manager inquiry OR an Admin<->Manager direct conversation
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult.response) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await request.json();
    const { propertyId, managerId: requestedManagerId, targetUserId, subject, message } = body;

    if (!message || !String(message).trim()) {
      return NextResponse.json(
        { success: false, error: "Message content is required." },
        { status: 400 }
      );
    }

    const timestamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // ── Direct Admin <-> Manager Conversation ──────────────────────────
    if (user.role === "ADMIN" || user.role === "USER") {
      // Pick any property to satisfy FK constraint (optional anchor if propertyId passed)
      let property = propertyId
        ? await prisma.property.findUnique({ where: { id: propertyId } })
        : null;

      if (!property) {
        property =
          (await prisma.property.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
          })) ||
          (await prisma.property.findFirst({
            orderBy: { createdAt: "desc" },
          }));
      }

      if (!property) {
        return NextResponse.json(
          { success: false, error: "No property available to anchor conversation." },
          { status: 404 }
        );
      }

      let customerIdForThread = user.id;
      let managerIdForThread: string | null = null;
      let notifyUserId: string | null = null;
      let notifyLink = "/dashboard/inquiries";
      let senderType: "ADMIN" | "MANAGER" = user.role === "ADMIN" ? "ADMIN" : "MANAGER";

      if (user.role === "ADMIN") {
        // Admin messaging a Manager
        let targetMgrId = targetUserId || requestedManagerId || null;
        if (!targetMgrId) {
          const activeManager = await prisma.user.findFirst({
            where: { role: "USER", isActive: true },
            orderBy: { createdAt: "asc" },
            select: { id: true },
          });
          targetMgrId = activeManager?.id || null;
        }
        if (!targetMgrId) {
          return NextResponse.json(
            { success: false, error: "No active Property Manager found." },
            { status: 404 }
          );
        }
        customerIdForThread = user.id; // Admin stored in customerId slot (role: ADMIN)
        managerIdForThread = targetMgrId;
        notifyUserId = targetMgrId;
        notifyLink = "/dashboard/inquiries";
      } else {
        // Manager messaging an Admin
        let targetAdminId = targetUserId || null;
        if (!targetAdminId) {
          const activeAdmin = await prisma.user.findFirst({
            where: { role: "ADMIN", isActive: true },
            orderBy: { createdAt: "asc" },
            select: { id: true },
          });
          targetAdminId = activeAdmin?.id || null;
        }
        if (!targetAdminId) {
          return NextResponse.json(
            { success: false, error: "No active Super Admin found." },
            { status: 404 }
          );
        }
        customerIdForThread = targetAdminId; // Admin stored in customerId slot (role: ADMIN)
        managerIdForThread = user.id;        // Manager stored in managerId slot (role: USER)
        notifyUserId = targetAdminId;
        notifyLink = "/admin/messages";
      }

      const initialTurns = [
        {
          id: `turn-${Date.now()}`,
          sender: senderType,
          senderName: user.name || (senderType === "ADMIN" ? "Super Admin" : "Property Manager"),
          text: String(message).trim(),
          timestamp,
        },
      ];

      const cleanSubject =
        subject && String(subject).trim()
          ? String(subject).trim()
          : "Admin ↔ Manager Coordination";

      const inquiry = await prisma.inquiry.create({
        data: {
          propertyId: property.id,
          customerId: customerIdForThread,
          managerId: managerIdForThread,
          subject: cleanSubject,
          message: String(message).trim(),
          response: serializeInquiryThread(initialTurns),
          status: "NEW",
        },
        include: INQUIRY_INCLUDE,
      });

      dbCache.invalidateTags(["inquiries", "notifications"]);

      if (notifyUserId) {
        await prisma.notification
          .create({
            data: {
              userId: notifyUserId,
              type: "INQUIRY",
              title:
                user.role === "ADMIN"
                  ? "New Message from Super Admin 💬"
                  : "New Message from Property Manager 💬",
              message: `${user.name || "Team Member"}: "${cleanSubject}"`,
              linkUrl: notifyLink,
            },
          })
          .catch(() => {});
      }

      return NextResponse.json({ success: true, inquiry });
    }

    // ── Standard Customer -> Property Manager Inquiry ──────────────────
    let property = null;
    if (propertyId) {
      property = await prisma.property.findUnique({
        where: { id: propertyId },
      });
    } else if (requestedManagerId) {
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
      const activeManager = await prisma.user.findFirst({
        where: { role: "USER", isActive: true },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      targetManagerId = activeManager?.id || null;
    }

    const initialTurns = [
      {
        id: `turn-${Date.now()}`,
        sender: "CUSTOMER" as const,
        senderName: user.name || "Customer",
        text: String(message).trim(),
        timestamp,
      },
    ];

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
        response: serializeInquiryThread(initialTurns),
        status: "NEW",
      },
      include: INQUIRY_INCLUDE,
    });

    dbCache.invalidateTags(["inquiries", "notifications"]);

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

// PATCH: Customer, Manager, or Admin replies in the shared chronological thread
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

    const existing = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        property: { select: { id: true, title: true, managerId: true } },
        customer: { select: { id: true, name: true, role: true } },
        manager: { select: { id: true, name: true, role: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found." },
        { status: 404 }
      );
    }

    const timestamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const currentTurns = parseInquiryThread(existing);
    const isInternalAdminManager = existing.customer?.role === "ADMIN";

    // Case A: Customer is sending the next reply in the thread
    if (customerReply && String(customerReply).trim()) {
      if (existing.customerId !== user.id && user.role !== "ADMIN") {
        return forbiddenResponse("You can only reply to your own message threads.");
      }

      const nextTurns = [
        ...currentTurns,
        {
          id: `turn-${Date.now()}-c`,
          sender: "CUSTOMER" as const,
          senderName: user.name || existing.customer?.name || "Customer",
          text: String(customerReply).trim(),
          timestamp,
        },
      ];

      const updated = await prisma.inquiry.update({
        where: { id: inquiryId },
        data: {
          response: serializeInquiryThread(nextTurns),
          status: "NEW",
        },
        include: INQUIRY_INCLUDE,
      });

      dbCache.invalidateTags(["inquiries", "notifications"]);

      const notifyManagerId = updated.managerId || existing.property?.managerId;
      if (notifyManagerId) {
        await prisma.notification
          .create({
            data: {
              userId: notifyManagerId,
              type: "INQUIRY",
              title: "Customer Replied 💬",
              message: `${user.name || "Customer"} replied on "${existing.property.title}".`,
              linkUrl: `/dashboard/inquiries`,
            },
          })
          .catch(() => {});
      }

      return NextResponse.json({ success: true, inquiry: updated });
    }

    // Case B: Manager or Admin is sending the next reply in the shared thread
    const isAssignedManager =
      existing.managerId === user.id ||
      existing.customerId === user.id ||
      existing.property?.managerId === user.id ||
      (user.role === "USER" && !existing.managerId);
    const isAdmin = user.role === "ADMIN";

    if (!isAdmin && !isAssignedManager) {
      return forbiddenResponse(
        "Forbidden. Only the assigned property manager or an administrator can respond to this inquiry."
      );
    }

    const nextTurns = [...currentTurns];
    if (response && String(response).trim()) {
      nextTurns.push({
        id: `turn-${Date.now()}-${isAdmin ? "a" : "m"}`,
        sender: isAdmin ? ("ADMIN" as const) : ("MANAGER" as const),
        senderName:
          user.name || (isAdmin ? "Super Admin" : existing.manager?.name || "Property Manager"),
        text: String(response).trim(),
        timestamp,
      });
    }

    const updated = await prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        response: serializeInquiryThread(nextTurns),
        status: status || "RESPONDED",
        ...(!existing.managerId && user.role === "USER" ? { managerId: user.id } : {}),
      },
      include: INQUIRY_INCLUDE,
    });

    dbCache.invalidateTags(["inquiries", "notifications"]);

    if (response) {
      if (isInternalAdminManager) {
        // Admin <-> Manager direct thread: notify the counterpart
        const recipientId = isAdmin ? updated.managerId : updated.customerId;
        const recipientLink = isAdmin ? "/dashboard/inquiries" : "/admin/messages";
        if (recipientId && recipientId !== user.id) {
          await prisma.notification
            .create({
              data: {
                userId: recipientId,
                type: "INQUIRY",
                title: isAdmin
                  ? "Super Admin Replied 💬"
                  : "Property Manager Replied 💬",
                message: `${user.name || "Team Member"} replied on "${updated.subject || "Direct Conversation"}".`,
                linkUrl: recipientLink,
              },
            })
            .catch(() => {});
        }
      } else {
        // Shared Customer conversation: notify customer AND (if Admin replied) also notify the assigned manager
        if (updated.customerId) {
          await prisma.notification
            .create({
              data: {
                userId: updated.customerId,
                type: "INQUIRY",
                title: isAdmin
                  ? "Kiro-Maal Admin Replied 💬"
                  : "Property Manager Replied 💬",
                message: `${user.name || "Our team"} replied to your message for "${updated.property.title}".`,
                linkUrl: `/customer/messages`,
              },
            })
            .catch(() => {});
        }

        if (isAdmin && updated.managerId && updated.managerId !== user.id) {
          await prisma.notification
            .create({
              data: {
                userId: updated.managerId,
                type: "INQUIRY",
                title: "Admin Joined Customer Thread 💬",
                message: `${user.name || "Super Admin"} replied to ${updated.customer?.name || "a customer"} on "${updated.property.title}".`,
                linkUrl: `/dashboard/inquiries`,
              },
            })
            .catch(() => {});
        }
      }
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
