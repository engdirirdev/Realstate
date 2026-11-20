import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { dbCache } from "@/lib/cache";
import { PropertyType } from "@prisma/client";

const VALID_PROPERTY_TYPES = new Set<string>([
  "HOUSE",
  "APARTMENT",
  "VILLA",
  "COMMERCIAL",
  "LAND",
  "OFFICE",
  "WAREHOUSE",
  "SHOP",
  "STUDIO",
  "TOWNHOUSE",
  "OTHER",
]);

function normalizePropertyType(val: unknown): PropertyType | null {
  if (!val || typeof val !== "string") return null;
  const upper = val.trim().toUpperCase();
  return VALID_PROPERTY_TYPES.has(upper) ? (upper as PropertyType) : null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const savedSearches = await prisma.searchHistory.findMany({
      where: { userId: session.user.id, isSaved: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, savedSearches });
  } catch (error) {
    console.error("Get saved searches error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      query,
      q,
      location,
      city,
      propertyType,
      type,
      minPrice,
      maxPrice,
      bedrooms,
    } = body;

    const resolvedLocation = (location || city || "").toString().trim() || null;
    const resolvedQuery = (query || q || "").toString().trim() || null;
    const resolvedType = normalizePropertyType(propertyType || type);
    const resolvedMinPrice =
      minPrice !== undefined && minPrice !== null && minPrice !== "" && !isNaN(Number(minPrice))
        ? Number(minPrice)
        : null;
    const resolvedMaxPrice =
      maxPrice !== undefined && maxPrice !== null && maxPrice !== "" && !isNaN(Number(maxPrice))
        ? Number(maxPrice)
        : null;
    const resolvedBedrooms =
      bedrooms !== undefined && bedrooms !== null && bedrooms !== "" && !isNaN(Number(bedrooms))
        ? Number(bedrooms)
        : null;

    const defaultParts = [
      resolvedLocation || "All Cities",
      resolvedType || "All Types",
      resolvedQuery ? `"${resolvedQuery}"` : "",
      resolvedMaxPrice ? `Up to $${resolvedMaxPrice.toLocaleString()}` : "",
      resolvedBedrooms ? `${resolvedBedrooms}+ Beds` : "",
    ].filter(Boolean);

    const saved = await prisma.searchHistory.create({
      data: {
        userId: session.user.id,
        name: (name && String(name).trim()) || `Search: ${defaultParts.join(" • ")}`,
        query: resolvedQuery,
        location: resolvedLocation,
        propertyType: resolvedType,
        minPrice: resolvedMinPrice,
        maxPrice: resolvedMaxPrice,
        bedrooms: resolvedBedrooms,
        isSaved: true,
      },
    });

    dbCache.invalidateTags(["saved-searches"]);

    return NextResponse.json({
      success: true,
      search: {
        ...saved,
        createdAt: saved.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Save search error:", error);
    return NextResponse.json({ error: "Failed to save search" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing search ID" }, { status: 400 });
    }

    await prisma.searchHistory.deleteMany({
      where: { id, userId: session.user.id },
    });

    dbCache.invalidateTags(["saved-searches"]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete saved search error:", error);
    return NextResponse.json({ error: "Failed to delete saved search" }, { status: 500 });
  }
}
