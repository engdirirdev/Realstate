import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { city: "asc" },
      select: {
        id: true,
        city: true,
        region: true,
        country: true,
      },
    });

    const registeredCities = locations.map((l) => {
      const c = l.city.trim();
      return c.charAt(0).toUpperCase() + c.slice(1);
    });

    const cities =
      registeredCities.length > 0
        ? Array.from(new Set(registeredCities)).sort((a, b) => a.localeCompare(b))
        : ["Mogadishu"];

    return NextResponse.json(
      {
        success: true,
        locations,
        cities,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/locations]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
