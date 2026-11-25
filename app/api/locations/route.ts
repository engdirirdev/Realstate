import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cachedDbQuery } from "@/lib/cache";
import { cachedJsonResponse, CACHE_PROFILES } from "@/lib/api-cache";
import {
  ABUDWAK_VILLAGE_NAMES,
  SYSTEM_CITY,
  SYSTEM_COUNTRY,
  SYSTEM_REGION,
} from "@/lib/abudwak-locations";

export async function GET(request: NextRequest) {
  try {
    const data = await cachedDbQuery(
      ["locations", "all"],
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

        const registeredVillages = locations.map((l) => l.city.trim());

        const villages =
          registeredVillages.length > 0
            ? Array.from(new Set(registeredVillages))
            : ABUDWAK_VILLAGE_NAMES;

        return {
          success: true,
          city: SYSTEM_CITY,
          region: SYSTEM_REGION,
          country: SYSTEM_COUNTRY,
          locations,
          villages,
          cities: [SYSTEM_CITY],
        };
      },
      {
        tags: ["locations"],
        revalidate: 86400,
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
