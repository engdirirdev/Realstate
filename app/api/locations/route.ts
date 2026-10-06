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

    const registeredCities = locations.map((l) => l.city.trim());
    const cities = registeredCities.length > 0 ? Array.from(new Set(registeredCities)).sort() : ["Mogadishu"];

    return NextResponse.json({
      success: true,
      locations,
      cities,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
