import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, requirePermission } from "@/lib/auth-guards";
import { PERMISSIONS } from "@/lib/rbac";
import { resolveLocation } from "@/lib/ai/nlu/location-resolver";
import { cachedDbQuery, invalidatePropertyCache } from "@/lib/cache";
import { cachedJsonResponse, CACHE_PROFILES } from "@/lib/api-cache";

// Selective fields for fast response times and lower payload size
const PROPERTY_CARD_SELECT = {
  id: true,
  title: true,
  price: true,
  basePrice: true,
  companyServiceFee: true,
  legalTransferFee: true,
  brokerCommission: true,
  currency: true,
  city: true,
  location: true,
  address: true,
  type: true,
  listingType: true,
  bedrooms: true,
  bathrooms: true,
  area: true,
  isFurnished: true,
  parking: true,
  status: true,
  availabilityStatus: true,
  isFeatured: true,
  viewCount: true,
  createdAt: true,
  images: {
    orderBy: { order: "asc" as const },
    take: 1,
    select: { id: true, url: true, isPrimary: true },
  },
};

// GET: Fetch properties for manager or public list with high-performance filters
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const listingType = searchParams.get("listingType");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 24));
    const skip = (page - 1) * pageSize;

    if (mode === "my-properties" && user?.id) {
      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where: { managerId: user.id },
          include: { images: { orderBy: { order: "asc" }, take: 1 } },
          orderBy: { createdAt: "desc" },
          take: pageSize,
          skip,
        }),
        prisma.property.count({ where: { managerId: user.id } }),
      ]);
      return cachedJsonResponse(
        request,
        {
          success: true,
          properties,
          pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        },
        { profile: CACHE_PROFILES.PRIVATE_NO_CACHE }
      );
    }

    const where: any = {
      status: { in: ["APPROVED", "PUBLISHED"] },
      availabilityStatus: "AVAILABLE",
      isActive: true,
    };

    if (listingType && ["FOR_RENT", "FOR_SALE"].includes(listingType.toUpperCase())) {
      where.listingType = listingType.toUpperCase();
    }

    const andClauses: any[] = [];

    // 1. Keyword search (q / search)
    const query = (searchParams.get("search") || searchParams.get("q") || "").trim();
    if (query) {
      andClauses.push({
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { location: { contains: query } },
          { address: { contains: query } },
          { city: { contains: query } },
        ],
      });
    }

    // 2. City & District resolution
    const rawLocation = (searchParams.get("city") || searchParams.get("location") || "").trim();
    const explicitDistrict = (searchParams.get("district") || "").trim();

    if (rawLocation) {
      const resolved = resolveLocation(rawLocation);
      if (resolved) {
        where.city = { contains: resolved.canonicalCity };
        if (resolved.district) {
          andClauses.push({
            OR: [
              { location: { contains: resolved.district } },
              { address: { contains: resolved.district } },
              { title: { contains: resolved.district } },
              { description: { contains: resolved.district } },
            ],
          });
        }
      } else {
        where.city = { contains: rawLocation };
      }
    }

    if (explicitDistrict) {
      andClauses.push({
        OR: [
          { location: { contains: explicitDistrict } },
          { address: { contains: explicitDistrict } },
          { title: { contains: explicitDistrict } },
          { description: { contains: explicitDistrict } },
        ],
      });
    }

    // 3. Property Type
    const type = searchParams.get("type");
    if (type) {
      if (type.toUpperCase() === "HOUSE") {
        where.type = { in: ["HOUSE", "VILLA", "TOWNHOUSE"] };
      } else {
        where.type = type.toUpperCase();
      }
    }

    // 4. Bedrooms
    const bedrooms = searchParams.get("bedrooms");
    const exactBedrooms = searchParams.get("exactBedrooms") === "true";
    if (bedrooms !== null && bedrooms !== "") {
      const bedNum = Number(bedrooms);
      if (!isNaN(bedNum)) {
        where.bedrooms = exactBedrooms ? bedNum : { gte: bedNum };
      }
    }

    // 5. Bathrooms
    const bathrooms = searchParams.get("bathrooms");
    if (bathrooms !== null && bathrooms !== "") {
      const bathNum = Number(bathrooms);
      if (!isNaN(bathNum)) {
        where.bathrooms = { gte: bathNum };
      }
    }

    // 6. Price Range
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice && !isNaN(Number(minPrice))) where.price.gte = Number(minPrice);
      if (maxPrice && !isNaN(Number(maxPrice))) where.price.lte = Number(maxPrice);
    }

    // 7. Amenities & Features
    const furnished = searchParams.get("furnished");
    if (furnished === "true") where.isFurnished = true;
    else if (furnished === "false") where.isFurnished = false;

    const parking = searchParams.get("parking");
    if (parking && !isNaN(Number(parking))) {
      where.parking = { gte: Number(parking) };
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    // 8. Sorting
    const sort = searchParams.get("sort") || searchParams.get("sortBy");
    let orderBy: any = [{ isFeatured: "desc" }, { createdAt: "desc" }];
    if (sort === "price_asc") orderBy = [{ price: "asc" }, { createdAt: "desc" }];
    else if (sort === "price_desc") orderBy = [{ price: "desc" }, { createdAt: "desc" }];
    else if (sort === "area_desc") orderBy = [{ area: "desc" }, { createdAt: "desc" }];
    else if (sort === "newest") orderBy = [{ createdAt: "desc" }];

    const cacheKeyParts = [
      "properties",
      "search",
      request.nextUrl.searchParams.toString() || "default",
    ];

    const responseData = await cachedDbQuery(
      cacheKeyParts,
      async () => {
        const [properties, total] = await Promise.all([
          prisma.property.findMany({
            where,
            select: PROPERTY_CARD_SELECT,
            orderBy,
            take: pageSize,
            skip,
          }),
          prisma.property.count({ where }),
        ]);
        return {
          success: true,
          properties,
          pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        };
      },
      {
        tags: ["properties"],
        revalidate: 60, // 60s
      }
    );

    return cachedJsonResponse(request, responseData, {
      profile: CACHE_PROFILES.PUBLIC_SHORT,
    });
  } catch (error) {
    console.error("[GET /api/properties]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch properties" }, { status: 500 });
  }
}

// POST: Manager adds new property (status: DRAFT or PENDING)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission(PERMISSIONS.PROPERTY_CREATE);
    if (authResult.response) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await request.json();
    const {
      title,
      description,
      price,
      basePrice,
      companyServiceFee,
      legalTransferFee,
      brokerCommission,
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
    } = body;

    if (!title || !description || !price || !city || !type) {
      return NextResponse.json(
        { success: false, error: "Title, description, price, city, and property type are required." },
        { status: 400 }
      );
    }

    const isAdmin = user.role === "ADMIN";
    const status = submitForReview ? (isAdmin ? "APPROVED" : "PENDING") : "DRAFT";

    const isLand = String(type).toUpperCase() === "LAND";
    const effectiveListingType = isLand ? "FOR_SALE" : (listingType === "FOR_RENT" ? "FOR_RENT" : "FOR_SALE");
    const effectiveRentPeriod =
      !isLand && effectiveListingType === "FOR_RENT" && ["MONTHLY", "WEEKLY", "DAILY"].includes(String(rentPeriod).toUpperCase())
        ? String(rentPeriod).toUpperCase()
        : !isLand && effectiveListingType === "FOR_RENT"
        ? "MONTHLY"
        : null;
    const numBase = basePrice !== undefined && basePrice !== null && basePrice !== "" ? Number(basePrice) : null;
    const numCompany = companyServiceFee !== undefined && companyServiceFee !== null && companyServiceFee !== "" ? Number(companyServiceFee) : 300;
    const numLegal = legalTransferFee !== undefined && legalTransferFee !== null && legalTransferFee !== "" ? Number(legalTransferFee) : 200;
    const numBroker = brokerCommission !== undefined && brokerCommission !== null && brokerCommission !== "" ? Number(brokerCommission) : 500;

    if (numBase !== null && (isNaN(numBase) || numBase <= 0)) {
      return NextResponse.json({ success: false, error: "Property Base Price must be greater than zero." }, { status: 400 });
    }
    if (isNaN(numCompany) || numCompany < 0) {
      return NextResponse.json({ success: false, error: "Company Service Fee cannot be negative." }, { status: 400 });
    }
    if (isNaN(numLegal) || numLegal < 0) {
      return NextResponse.json({ success: false, error: "Legal Transfer and Notarization Fee cannot be negative." }, { status: 400 });
    }
    if (isNaN(numBroker) || numBroker < 0) {
      return NextResponse.json({ success: false, error: "Broker Commission cannot be negative." }, { status: 400 });
    }

    const effectiveBasePrice = numBase ?? Math.max(500, (Number(price) || 1000) - numCompany - numLegal);
    const effectiveTotalPrice = effectiveBasePrice + numCompany + numLegal;

    if (Number(price) <= 0 || isNaN(Number(price))) {
      return NextResponse.json({ success: false, error: "Price must be greater than zero." }, { status: 400 });
    }
    if (securityDeposit !== undefined && securityDeposit !== null && securityDeposit !== "" && Number(securityDeposit) < 0) {
      return NextResponse.json({ success: false, error: "Security deposit cannot be negative." }, { status: 400 });
    }

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
        price: effectiveTotalPrice,
        basePrice: effectiveBasePrice,
        companyServiceFee: numCompany,
        legalTransferFee: numLegal,
        brokerCommission: numBroker,
        location: location || city,
        city,
        address: address || null,
        latitude: latitude !== undefined && latitude !== null && latitude !== "" ? Number(latitude) : null,
        longitude: longitude !== undefined && longitude !== null && longitude !== "" ? Number(longitude) : null,
        type,
        listingType: effectiveListingType,
        currency: typeof currency === "string" && currency.trim() ? currency.trim().toUpperCase().slice(0, 8) : "USD",
        isNegotiable: effectiveListingType === "FOR_SALE" ? Boolean(isNegotiable) : false,
        rentPeriod: effectiveRentPeriod,
        securityDeposit:
          !isLand && effectiveListingType === "FOR_RENT" && securityDeposit !== undefined && securityDeposit !== null && securityDeposit !== ""
            ? Number(securityDeposit)
            : null,
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
        approvalStatus: submitForReview ? (isAdmin ? "APPROVED" : "PENDING_REVIEW") : "DRAFT",
        availabilityStatus: "AVAILABLE",
        isActive: status === "APPROVED",
        managerId: user.id,
        images: imageCreateList.length > 0 ? {
          create: imageCreateList,
        } : undefined,
      },
    });

    // Notify Admin of pending approval
    if (status === "PENDING") {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: "PROPERTY_UPDATE",
            title: "New Property Pending Approval 🏠",
            message: `Manager ${user.name || ""} submitted "${title}" for approval.`,
            linkUrl: `/admin/properties`,
          })),
        }).catch(() => {});
      }
    }

    await invalidatePropertyCache(property.id);

    return NextResponse.json({ success: true, property });
  } catch (error) {
    console.error("[POST /api/properties]", error);
    return NextResponse.json({ success: false, error: "Failed to create property." }, { status: 500 });
  }
}
