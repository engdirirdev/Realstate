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
      title,
      description,
      price,
      location,
      city,
      address,
      latitude,
      longitude,
      type,
      bedrooms,
      bathrooms,
      area,
      imageUrl,
      galleryImages,
      submitForReview,
      videoUrl,
      floorPlanUrl,
      virtualTourUrl,
      parking,
      isFurnished,
      lotSize,
      yearBuilt,
      listingType,
      typeDetails,
      amenities,
    } = body;

    if (!title || !description || !price || !city || !type) {
      return NextResponse.json(
        { success: false, error: "Title, description, price, city, and property type are required." },
        { status: 400 }
      );
    }

    const isAdmin = (session.user as any)?.role === "ADMIN";
    const status = submitForReview ? (isAdmin ? "APPROVED" : "PENDING") : "DRAFT";

    // Handle parsed type-specific details
    let parsedTypeDetails: Record<string, any> | null = null;
    if (typeDetails) {
      parsedTypeDetails = typeof typeDetails === "string" ? JSON.parse(typeDetails) : typeDetails;
    }

    // Determine effective area based on type
    let effectiveArea = Number(area) || 0;
    if (!effectiveArea && parsedTypeDetails) {
      effectiveArea = Number(
        parsedTypeDetails.landArea ||
          parsedTypeDetails.shopArea ||
          parsedTypeDetails.warehouseArea ||
          parsedTypeDetails.floorArea
      ) || 100;
    }

    // Adapt bedrooms and bathrooms according to type
    const isCommercialOrLand = ["LAND", "SHOP", "WAREHOUSE", "OFFICE", "COMMERCIAL"].includes(String(type).toUpperCase());
    const effectiveBedrooms = isCommercialOrLand ? 0 : Number(bedrooms) || 0;
    const effectiveBathrooms = String(type).toUpperCase() === "LAND" ? 0 : Number(bathrooms) || 0;

    // Serialize amenities array
    let serializedAmenities: string | null = null;
    if (Array.isArray(amenities)) {
      serializedAmenities = JSON.stringify(amenities);
    } else if (typeof amenities === "string") {
      serializedAmenities = amenities;
    }

    // Build image records (primary image + gallery images)
    const imageCreateList: { url: string; altText: string; isPrimary: boolean; order: number }[] = [];
    if (imageUrl) {
      imageCreateList.push({
        url: imageUrl,
        altText: title,
        isPrimary: true,
        order: 0,
      });
    }
    if (Array.isArray(galleryImages)) {
      galleryImages.forEach((imgUrl: string, idx: number) => {
        if (imgUrl && imgUrl.trim() && imgUrl !== imageUrl) {
          imageCreateList.push({
            url: imgUrl.trim(),
            altText: `${title} - Image ${idx + 1}`,
            isPrimary: false,
            order: idx + 1,
          });
        }
      });
    }

    const property = await prisma.property.create({
      data: {
        title,
        description,
        price: Number(price),
        location: location || city,
        city,
        address: address || null,
        latitude: latitude !== undefined && latitude !== null && latitude !== "" ? Number(latitude) : null,
        longitude: longitude !== undefined && longitude !== null && longitude !== "" ? Number(longitude) : null,
        type,
        listingType: listingType || "FOR_SALE",
        typeDetails: parsedTypeDetails ? JSON.stringify(parsedTypeDetails) : null,
        amenities: serializedAmenities,
        bedrooms: effectiveBedrooms,
        bathrooms: effectiveBathrooms,
        area: effectiveArea || 100,
        videoUrl: videoUrl || null,
        floorPlanUrl: floorPlanUrl || null,
        virtualTourUrl: virtualTourUrl || null,
        parking: parking ? Number(parking) : 0,
        isFurnished: Boolean(isFurnished),
        lotSize: lotSize ? Number(lotSize) : parsedTypeDetails?.compoundSize ? Number(parsedTypeDetails.compoundSize) : null,
        yearBuilt: yearBuilt ? Number(yearBuilt) : null,
        status,
        managerId: session.user.id,
        images: imageCreateList.length > 0 ? {
          create: imageCreateList,
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
