import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitResponse,
} from "@/lib/rate-limiter";
import { buildUserProfile } from "@/lib/ai/behavior/profile-builder";
import { rankPropertiesPersonalized } from "@/lib/ai/recommendation/personalized-ranker";

const RATE_LIMIT_CONFIG = { limit: 30, windowSeconds: 60 };

/**
 * GET /api/ai/recommendations
 * Generates personalized, explainable property recommendations combining
 * learned behavioral intelligence, semantic vector similarity, and explicit preferences.
 *
 * Security:
 * - Rate-limited (30 req/min)
 * - Server-side authorization check (never trusts client roles)
 * - Enforces property status = 'APPROVED'
 * - Complete cross-user isolation
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required to generate personalized recommendations" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Rate Limiting Check
    const clientId = getClientIdentifier(request, userId);
    const rateCheck = checkRateLimit(`ai-recommendations:${clientId}`, RATE_LIMIT_CONFIG);
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck);
    }

    // Parse query params for optional explicit overrides & limit
    const { searchParams } = new URL(request.url);
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const city = searchParams.get("city") || undefined;
    const type = searchParams.get("type") || undefined;
    const listingType = searchParams.get("listingType") || undefined;
    const maxBudget = searchParams.get("maxBudget") ? parseFloat(searchParams.get("maxBudget")!) : undefined;
    const bedrooms = searchParams.get("bedrooms") ? parseInt(searchParams.get("bedrooms")!, 10) : undefined;

    // 1. Fetch user's explicit preferences from database
    const explicitPrefs = await prisma.userPreference.findUnique({
      where: { userId },
    });

    // 2. Fetch or synthesize user's dynamic behavioral preference profile
    const learnedProfile = await buildUserProfile(userId);

    // 3. Fetch candidate approved properties that are strictly AVAILABLE
    const where: any = {
      status: { in: ["APPROVED", "PUBLISHED"] },
      availabilityStatus: "AVAILABLE",
      isActive: true,
    };
    if (listingType && ["FOR_RENT", "FOR_SALE"].includes(listingType.toUpperCase())) {
      where.listingType = listingType.toUpperCase();
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        embedding: true,
      },
      take: 150,
      orderBy: { createdAt: "desc" },
    });

    if (properties.length === 0) {
      return NextResponse.json({
        success: true,
        confidence: learnedProfile.confidence,
        isColdStart: learnedProfile.isColdStart,
        total: 0,
        recommendations: [],
      });
    }

    // 4. Combine explicit preferences (overrides > stored preferences)
    const combinedExplicit = {
      location: city || explicitPrefs?.preferredLocation || undefined,
      maxBudget: maxBudget || explicitPrefs?.maxBudget || undefined,
      minBudget: explicitPrefs?.minBudget || undefined,
      preferredType: type || explicitPrefs?.preferredType || undefined,
      preferredBedrooms: bedrooms || explicitPrefs?.preferredBedrooms || undefined,
      preferredBathrooms: explicitPrefs?.preferredBathrooms || undefined,
      preferredMinArea: explicitPrefs?.preferredMinArea || undefined,
      preferredMaxArea: explicitPrefs?.preferredMaxArea || undefined,
    };

    // 5. Execute Personalized Ranking
    const ranked = rankPropertiesPersonalized(
      properties,
      learnedProfile,
      combinedExplicit,
      { topN: limit }
    );

    const propertiesMap = new Map(properties.map((p) => [p.id, p]));

    const formattedRecommendations = ranked.map((r) => {
      const prop = propertiesMap.get(r.propertyId)!;
      return {
        id: prop.id,
        score: r.score,
        reasonCodes: r.reasonCodes,
        reasons: r.reasons,
        reasonsSo: r.reasonsSo,
        reasonsAr: r.reasonsAr,
        compositeScoreBreakdown: r.compositeScoreBreakdown,
        property: {
          id: prop.id,
          title: prop.title,
          type: prop.type,
          status: prop.status,
          city: prop.city,
          location: prop.location,
          price: prop.price,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          area: prop.area,
          parking: prop.parking,
          isFurnished: prop.isFurnished,
          imageUrl: prop.images[0]?.url || null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      confidence: learnedProfile.confidence,
      isColdStart: learnedProfile.isColdStart,
      totalWeight: learnedProfile.totalWeight,
      totalInteractions: learnedProfile.totalInteractions,
      total: formattedRecommendations.length,
      recommendations: formattedRecommendations,
    });
  } catch (error: any) {
    console.error("[GET /api/ai/recommendations] Internal error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate personalized recommendations" },
      { status: 500 }
    );
  }
}
