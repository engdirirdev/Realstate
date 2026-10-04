import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type Props = { params: Promise<{ id: string }> };

// GET /api/properties/[id]
export async function GET(
  req: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
      },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found." },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.property.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, data: property });
  } catch (error) {
    console.error("[GET /api/properties/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch property." },
      { status: 500 }
    );
  }
}

// PATCH /api/properties/[id] - update (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: Props
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const property = await prisma.property.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, data: property });
  } catch (error) {
    console.error("[PATCH /api/properties/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update property." },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id] - delete (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: Props
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Property deleted." });
  } catch (error) {
    console.error("[DELETE /api/properties/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete property." },
      { status: 500 }
    );
  }
}
