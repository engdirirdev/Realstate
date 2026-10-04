import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generateRecommendations } from "@/lib/recommendation-engine";

/**
 * GET /api/user/recommendations
 * Canonical recommendation endpoint using the central Recommendation Engine.
 * Fully backward-compatible with dashboard and customer portals.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user preferences
    const preferences = await prisma.userPreference.findUnique({
      where: { userId },
    });

    // Generate recommendations using the single canonical recommendation engine
    const recommendations = await generateRecommendations(
      {
        userId,
        location: preferences?.preferredLocation || undefined,
        minBudget: preferences?.minBudget || undefined,
        maxBudget: preferences?.maxBudget || undefined,
        preferredType: preferences?.preferredType || undefined,
        preferredBedrooms: preferences?.preferredBedrooms || undefined,
        preferredBathrooms: preferences?.preferredBathrooms || undefined,
        preferredMinArea: preferences?.preferredMinArea || undefined,
        preferredMaxArea: preferences?.preferredMaxArea || undefined,
      },
      8
    );

    // Format response maintaining 100% backward compatibility for all consumers
    const formattedRecommendations = recommendations.map((r) => ({
      id: r.property.id,
      score: r.score,
      reasons: r.reasons,
      property: {
        id: r.property.id,
        title: r.property.title,
        type: r.property.type,
        city: r.property.city,
        price: r.property.price,
        bedrooms: r.property.bedrooms,
        bathrooms: r.property.bathrooms,
        area: r.property.area,
        images: r.property.images,
      },
      // Flattened properties for components that access item directly
      title: r.property.title,
      type: r.property.type,
      city: r.property.city,
      price: r.property.price,
      bedrooms: r.property.bedrooms,
      bathrooms: r.property.bathrooms,
      area: r.property.area,
      images: r.property.images,
    }));

    return NextResponse.json({ success: true, recommendations: formattedRecommendations });
  } catch (error) {
    console.error("GET /api/user/recommendations error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate recommendations" }, { status: 500 });
  }
}
