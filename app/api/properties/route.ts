import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET: Fetch properties for manager or public list
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    if (mode === "my-properties" && session?.user?.id) {
      const properties = await prisma.property.findMany({
        where: { managerId: session.user.id },
        include: { images: { orderBy: { order: "asc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ success: true, properties });
    }

    const properties = await prisma.property.findMany({
      where: { status: { in: ["APPROVED", "PUBLISHED"] } },
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json({ success: true, properties });
  } catch (error) {
    console.error("[GET /api/properties]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch properties" }, { status: 500 });
  }
}

// POST: Manager adds new property (status: DRAFT or PENDING)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await request.json();
    const {
      title, description, price, location, city, address, type, bedrooms, bathrooms, area, imageUrl, submitForReview,
      videoUrl, floorPlanUrl, virtualTourUrl, parking, isFurnished, lotSize,
    } = body;

    if (!title || !description || !price || !city || !type) {
      return NextResponse.json({ success: false, error: "Title, description, price, city, and type are required." }, { status: 400 });
    }

    const status = submitForReview ? "PENDING" : "DRAFT";

    const property = await prisma.property.create({
      data: {
        title,
        description,
        price: Number(price),
        location: location || city,
        city,
        address: address || null,
        type,
        bedrooms: Number(bedrooms) || 0,
        bathrooms: Number(bathrooms) || 0,
        area: Number(area) || 100,
        videoUrl: videoUrl || null,
        floorPlanUrl: floorPlanUrl || null,
        virtualTourUrl: virtualTourUrl || null,
        parking: parking ? Number(parking) : 0,
        isFurnished: Boolean(isFurnished),
        lotSize: lotSize ? Number(lotSize) : null,
        status,
        managerId: session.user.id,
        images: imageUrl ? {
          create: [{ url: imageUrl, altText: title, isPrimary: true, order: 0 }],
        } : undefined,
      },
    });

    // Notify Admin of pending approval
    if (status === "PENDING") {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "PROPERTY_UPDATE",
            title: "New Property Pending Approval 🏠",
            message: `Manager ${session.user.name || ""} submitted "${title}" for approval.`,
            linkUrl: `/admin/properties`,
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, property });
  } catch (error) {
    console.error("[POST /api/properties]", error);
    return NextResponse.json({ success: false, error: "Failed to create property." }, { status: 500 });
  }
}
