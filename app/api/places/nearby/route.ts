import { NextRequest, NextResponse } from "next/server";
import { getRealNearbyPlaces } from "@/lib/google-places";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const radiusStr = searchParams.get("radius") || "3000";
    const category = (searchParams.get("category") || "ALL").toUpperCase();
    const city = searchParams.get("city") || "";
    const address = searchParams.get("address") || "";

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { success: false, error: "Latitude and longitude query parameters are required." },
        { status: 400 }
      );
    }

    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);
    let radius = parseInt(radiusStr, 10);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { success: false, error: "Invalid latitude. Must be between -90 and 90." },
        { status: 400 }
      );
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { success: false, error: "Invalid longitude. Must be between -180 and 180." },
        { status: 400 }
      );
    }

    if (isNaN(radius) || radius < 500 || radius > 20000) {
      radius = 3000;
    }

    const result = await getRealNearbyPlaces({
      latitude,
      longitude,
      radius,
      category,
      city,
      address,
    });

    return NextResponse.json(
      {
        success: result.success,
        count: result.places.length,
        places: result.places,
        radius,
        category,
        source: result.source,
        error: result.error,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error: any) {
    console.error("[GET /api/places/nearby]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve nearby places." },
      { status: 500 }
    );
  }
}

