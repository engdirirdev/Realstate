import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cachedDbQuery } from "@/lib/cache";
import { cachedJsonResponse, CACHE_PROFILES } from "@/lib/api-cache";

export async function GET(request: NextRequest) {
  try {
    const data = await cachedDbQuery(
      ["locations", "directory"],
      async () => {
        const locations = await prisma.location.findMany({
          orderBy: { city: "asc" },
          select: {
            id: true,
            city: true,
            region: true,
            country: true,
          },
        });

        const registeredCities = locations.map((l) => l.city.trim());
        const cities =
          registeredCities.length > 0
            ? Array.from(new Set(registeredCities)).sort()
            : ["Mogadishu"];

        return {
          success: true,
          locations,
          cities,
        };
      },
      {
        tags: ["locations"],
        revalidate: 86400, // 24 hours
      }
    );

    return cachedJsonResponse(request, data, {
      profile: CACHE_PROFILES.PUBLIC_LONG,
    });
  } catch (error) {
    console.error("[GET /api/locations]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
