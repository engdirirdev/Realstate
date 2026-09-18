import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

interface ScoredProperty {
  id: string;
  title: string;
  type: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: { url: string }[];
  score: number;
  reasons: string[];
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Fetch user preferences (correct model name: userPreference)
  const preferences = await prisma.userPreference.findUnique({ where: { userId } });

  // Get all approved properties
  const properties = await prisma.property.findMany({
    where: { status: "APPROVED" },
    include: { images: { take: 1, orderBy: { order: "asc" } } },
    take: 50,
  });

  // Score each property
  const scored: ScoredProperty[] = properties.map((p) => {
    let score = 50; // base score
    const reasons: string[] = [];

    if (preferences) {
      // Location match (25 pts) — uses preferredLocation in schema
      if (
        preferences.preferredLocation &&
        p.city.toLowerCase().includes(preferences.preferredLocation.toLowerCase())
      ) {
        score += 25;
        reasons.push(`Located in your preferred city: ${preferences.preferredLocation}`);
      }

      // Price match (25 pts)
      if (preferences.maxBudget) {
        if (p.price <= preferences.maxBudget) {
          const savingPct = ((preferences.maxBudget - p.price) / preferences.maxBudget) * 100;
          score += Math.min(25, Math.round(savingPct / 4 + 10));
          reasons.push(`Within your budget of $${preferences.maxBudget.toLocaleString()}`);
        } else {
          score -= 20;
        }
      }

      // Property type (15 pts) — uses preferredType in schema
      if (preferences.preferredType && p.type === preferences.preferredType) {
        score += 15;
        reasons.push(`Matches your preferred property type`);
      }

      // Bedrooms (10 pts) — uses preferredBedrooms in schema
      if (preferences.preferredBedrooms && p.bedrooms >= preferences.preferredBedrooms) {
        score += 10;
        reasons.push(`Has ${p.bedrooms} bedrooms (your minimum: ${preferences.preferredBedrooms})`);
      }

      // Area (5 pts) — uses preferredMinArea in schema
      if (preferences.preferredMinArea && p.area >= preferences.preferredMinArea) {
        score += 5;
        reasons.push(`Spacious ${p.area}m² area meets your requirements`);
      }
    } else {
      // No preferences — score by objective quality signals
      if (p.bedrooms >= 3) {
        score += 5;
        reasons.push("Spacious family-sized property");
      }
      if (p.isFeatured) {
        score += 10;
        reasons.push("Featured listing with premium amenities");
      }
      reasons.push("Popular listing in a sought-after area");
    }

    score = Math.min(100, Math.max(0, score));

    return {
      id: p.id,
      title: p.title,
      type: p.type,
      city: p.city,
      price: p.price,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      area: p.area,
      images: p.images,
      score,
      reasons: reasons.slice(0, 3),
    };
  });

  const topRecommendations = scored.sort((a, b) => b.score - a.score).slice(0, 8);

  // Persist to DB
  if (topRecommendations.length > 0) {
    await prisma.recommendation.deleteMany({ where: { userId } });
    await prisma.recommendation.createMany({
      data: topRecommendations.map((r) => ({
        userId,
        propertyId: r.id,
        score: r.score,
        reasons: JSON.stringify(r.reasons),
      })),
    });
  }

  const formattedRecommendations = topRecommendations.map((r) => ({
    id: r.id,
    score: r.score,
    reasons: r.reasons,
    property: {
      id: r.id,
      title: r.title,
      type: r.type,
      city: r.city,
      price: r.price,
      bedrooms: r.bedrooms,
      bathrooms: r.bathrooms,
      area: r.area,
      images: r.images,
    },
  }));

  return NextResponse.json({ success: true, recommendations: formattedRecommendations });
}
