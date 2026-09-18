import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { detectDuplicateListing, detectPriceAnomaly } from "@/lib/ai-assistant-tools";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, city, price, bedrooms, area, type, excludePropertyId } = body;

    if (!title || !city || price == null) {
      return NextResponse.json({ isDuplicate: false });
    }

    const dupResult = await detectDuplicateListing({
      title,
      city,
      price: Number(price),
      bedrooms: Number(bedrooms || 1),
      area: Number(area || 100),
      excludePropertyId,
    });

    const anomalyResult = detectPriceAnomaly({
      price: Number(price),
      area: Number(area || 100),
      city,
      type: type || "HOUSE",
    });

    return NextResponse.json({
      success: true,
      duplicate: dupResult,
      anomaly: anomalyResult,
    });
  } catch (error) {
    console.error("Duplicate check error:", error);
    return NextResponse.json({ isDuplicate: false, error: "Internal server error" }, { status: 500 });
  }
}
