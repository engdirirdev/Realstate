import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        manager: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, property });
  } catch (error) {
    console.error("[GET /api/admin/properties/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch property" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { status, rejectionReason, isFeatured } = await request.json();

    const validStatuses = ["DRAFT", "PENDING", "APPROVED", "REJECTED", "PUBLISHED", "SOLD", "RENTED", "INACTIVE", "UNAVAILABLE"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid property status" }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    if (status === "REJECTED") {
      updateData.approvalStatus = "REJECTED";
      updateData.availabilityStatus = "INACTIVE";
      updateData.isActive = false;
      updateData.rejectionReason = rejectionReason || "Property listing requires additional details or higher quality photos.";
    } else if (status === "APPROVED" || status === "PUBLISHED") {
      updateData.approvalStatus = "APPROVED";
      updateData.availabilityStatus = "AVAILABLE";
      updateData.isActive = true;
      updateData.rejectionReason = null;
    } else if (status === "INACTIVE" || status === "UNAVAILABLE") {
      updateData.availabilityStatus = "INACTIVE";
      updateData.isActive = false;
    }

    const property = await prisma.property.update({
      where: { id },
      data: updateData,
    });

    // Notify Manager
    if (property.managerId && status) {
      const isApproved = status === "APPROVED" || status === "PUBLISHED";
      await prisma.notification.create({
        data: {
          userId: property.managerId,
          type: "PROPERTY_UPDATE",
          title: isApproved ? "Property Approved! 🎉" : "Property Listing Rejected ⚠️",
          message: isApproved
            ? `Your property listing "${property.title}" has been approved and published.`
            : `Your property listing "${property.title}" was rejected. Reason: ${updateData.rejectionReason}`,
          linkUrl: `/dashboard/properties`,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, property });
  } catch (error) {
    console.error("[PATCH /api/admin/properties/[id]]", error);
    return NextResponse.json({ error: "Failed to update property status" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/properties/[id]]", error);
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 });
  }
}
