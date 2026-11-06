import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { invalidateLocationCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const locations = await prisma.location.findMany({ orderBy: { city: "asc" } });
    return NextResponse.json({ success: true, locations });
  } catch (error) {
    console.error("[GET /api/admin/locations]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch locations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { city, region, country } = await request.json();
    if (!city || !region) return NextResponse.json({ success: false, error: "City and Region required" }, { status: 400 });

    const trimmedCity = String(city).trim();
    const formattedCity = trimmedCity.charAt(0).toUpperCase() + trimmedCity.slice(1);
    const trimmedRegion = String(region).trim();
    const formattedRegion = trimmedRegion.charAt(0).toUpperCase() + trimmedRegion.slice(1);

    const location = await prisma.location.create({
      data: {
        city: formattedCity,
        region: formattedRegion,
        country: country ? String(country).trim() : "Somalia",
      },
    });

    await invalidateLocationCache().catch(() => {});

    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error("[POST /api/admin/locations]", error);
    return NextResponse.json({ success: false, error: "Location already exists or invalid" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, city, region, country } = await request.json();
    if (!id || !city || !region) {
      return NextResponse.json({ success: false, error: "Location ID, City, and Region are required" }, { status: 400 });
    }

    const trimmedCity = String(city).trim();
    const formattedCity = trimmedCity.charAt(0).toUpperCase() + trimmedCity.slice(1);
    const trimmedRegion = String(region).trim();
    const formattedRegion = trimmedRegion.charAt(0).toUpperCase() + trimmedRegion.slice(1);

    const location = await prisma.location.update({
      where: { id },
      data: {
        city: formattedCity,
        region: formattedRegion,
        country: country ? String(country).trim() : "Somalia",
      },
    });

    await invalidateLocationCache().catch(() => {});

    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error("[PATCH /api/admin/locations]", error);
    return NextResponse.json({ success: false, error: "Failed to update location" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    await prisma.location.delete({ where: { id } });

    await invalidateLocationCache().catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/locations]", error);
    return NextResponse.json({ success: false, error: "Failed to delete location" }, { status: 500 });
  }
}
