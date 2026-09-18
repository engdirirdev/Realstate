import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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
    const { name, location, propertyType, minPrice, maxPrice, bedrooms } = body;

    const saved = await prisma.searchHistory.create({
      data: {
        userId: session.user.id,
        name: name || `Search: ${location || propertyType || "All Properties"}`,
        location: location || null,
        propertyType: propertyType || null,
        minPrice: minPrice ? Number(minPrice) : null,
        maxPrice: maxPrice ? Number(maxPrice) : null,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        isSaved: true,
      },
    });

    return NextResponse.json({ success: true, search: saved });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete saved search error:", error);
    return NextResponse.json({ error: "Failed to delete saved search" }, { status: 500 });
  }
}
