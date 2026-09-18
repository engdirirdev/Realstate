import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateListingDescription } from "@/lib/ai-assistant-tools";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, city, type, bedrooms, bathrooms, area, amenities } = body;

    const description = generateListingDescription({
      title: title || "Modern Property",
      city: city || "Mogadishu",
      type: type || "HOUSE",
      bedrooms: Number(bedrooms || 3),
      bathrooms: Number(bathrooms || 2),
      area: Number(area || 150),
      amenities: Array.isArray(amenities) ? amenities : [],
    });

    return NextResponse.json({ success: true, description });
  } catch (error) {
    console.error("Generate description error:", error);
    return NextResponse.json({ error: "Failed to generate description" }, { status: 500 });
  }
}
