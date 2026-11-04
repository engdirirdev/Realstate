import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoReference = searchParams.get("ref");
    const maxWidth = searchParams.get("maxWidth") || "400";

    if (!photoReference) {
      return new NextResponse("Photo reference parameter is required.", { status: 400 });
    }

    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return new NextResponse("Google Places API Key not configured.", { status: 503 });
    }

    const googlePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${encodeURIComponent(
      maxWidth
    )}&photoreference=${encodeURIComponent(photoReference)}&key=${apiKey}`;

    const res = await fetch(googlePhotoUrl, {
      cache: "force-cache",
      next: { revalidate: 604800 }, // 7 days
    });

    if (!res.ok) {
      return new NextResponse("Failed to fetch photo from Google Places.", { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await res.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error("[GET /api/places/photo]", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}

