import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    const defaultCities = [
      "Mogadishu",
      "Hargeisa",
      "Bosaso",
      "Garowe",
      "Kismayo",
      "Berbera",
      "Baydhabo",
    ];

    const dbCities = locations.map((l) => l.city.trim());
    const allCities = Array.from(new Set([...defaultCities, ...dbCities])).sort();

    return NextResponse.json({
      success: true,
      locations,
      cities: allCities,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
