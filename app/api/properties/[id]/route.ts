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

// PATCH /api/properties/[id] - update (admin or property manager)
export async function PATCH(
  req: NextRequest,
  { params }: Props
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    const isAdmin = (session.user as any)?.role === "ADMIN";
    const isOwner = existing.managerId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ success: false, error: "Unauthorized. You cannot edit this property." }, { status: 403 });
    }

    const body = await req.json();

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
      currency,
      isNegotiable,
      rentPeriod,
      securityDeposit,
      typeDetails,
      amenities,
      status: requestedStatus,
      isFeatured,
      rejectionReason,
    } = body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (location !== undefined) updateData.location = location || city;
    if (city !== undefined) updateData.city = city;
    if (address !== undefined) updateData.address = address || null;
    if (latitude !== undefined) updateData.latitude = latitude !== null && latitude !== "" ? Number(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude !== null && longitude !== "" ? Number(longitude) : null;
    if (type !== undefined) updateData.type = type;
    if (listingType !== undefined) updateData.listingType = listingType;
    if (currency !== undefined) updateData.currency = String(currency).trim().toUpperCase().slice(0, 8);
    if (isNegotiable !== undefined) updateData.isNegotiable = Boolean(isNegotiable);
    if (rentPeriod !== undefined) updateData.rentPeriod = rentPeriod;
    if (securityDeposit !== undefined) updateData.securityDeposit = securityDeposit !== null && securityDeposit !== "" ? Number(securityDeposit) : null;
    if (bedrooms !== undefined) updateData.bedrooms = Number(bedrooms);
    if (bathrooms !== undefined) updateData.bathrooms = Number(bathrooms);
    if (area !== undefined) updateData.area = Number(area);
    if (parking !== undefined) updateData.parking = Number(parking);
    if (lotSize !== undefined) updateData.lotSize = lotSize !== null && lotSize !== "" ? Number(lotSize) : null;
    if (yearBuilt !== undefined) updateData.yearBuilt = yearBuilt !== null && yearBuilt !== "" ? Number(yearBuilt) : null;
    if (isFurnished !== undefined) updateData.isFurnished = Boolean(isFurnished);
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl || null;
    if (floorPlanUrl !== undefined) updateData.floorPlanUrl = floorPlanUrl || null;
    if (virtualTourUrl !== undefined) updateData.virtualTourUrl = virtualTourUrl || null;

    if (typeDetails !== undefined) {
      updateData.typeDetails = typeof typeDetails === "string" ? typeDetails : JSON.stringify(typeDetails);
    }
    if (amenities !== undefined) {
      updateData.amenities = typeof amenities === "string" ? amenities : JSON.stringify(amenities);
    }

    // Status logic:
    if (isAdmin) {
      if (requestedStatus) updateData.status = requestedStatus;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
      if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
    } else {
      if (submitForReview) {
        updateData.status = "PENDING";
        updateData.rejectionReason = null;
      }
    }

    // Handle images if provided
    if (imageUrl !== undefined || galleryImages !== undefined) {
      const primaryUrl = imageUrl || existing.images?.[0]?.url;
      const galleryList: string[] = Array.isArray(galleryImages) ? galleryImages : [];

      const imageCreateList: { url: string; altText: string; isPrimary: boolean; order: number }[] = [];
      if (primaryUrl) {
        imageCreateList.push({
          url: primaryUrl,
          altText: title || existing.title,
          isPrimary: true,
          order: 0,
        });
      }
      galleryList.forEach((gUrl: string, idx: number) => {
        if (gUrl && gUrl.trim() && gUrl !== primaryUrl) {
          imageCreateList.push({
            url: gUrl.trim(),
            altText: `${title || existing.title} - Image ${idx + 1}`,
            isPrimary: false,
            order: idx + 1,
          });
        }
      });

      if (imageCreateList.length > 0) {
        await prisma.propertyImage.deleteMany({ where: { propertyId: id } });
        await prisma.propertyImage.createMany({
          data: imageCreateList.map((img) => ({
            ...img,
            propertyId: id,
          })),
        });
      }
    }

    const updated = await prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        images: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ success: true, data: updated, property: updated });
  } catch (error) {
    console.error("[PATCH /api/properties/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update property." },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id] - delete (admin or property owner)
export async function DELETE(
  req: NextRequest,
  { params }: Props
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.property.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    const isAdmin = (session.user as any)?.role === "ADMIN";
    const isOwner = existing.managerId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

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

