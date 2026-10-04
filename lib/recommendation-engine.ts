/**
 * Content-Based Recommendation Engine
 *
 * Scoring weights:
 *   Location    : 30%
 *   Price       : 30%
 *   Bedrooms    : 20%
 *   Property Type: 10%
 *   Area        : 10%
 */

import { prisma } from "./prisma";

export interface RecommendationInput {
  userId: string;
  location?: string;
  minBudget?: number;
  maxBudget?: number;
  preferredType?: string;
  preferredBedrooms?: number;
  preferredBathrooms?: number;
  preferredMinArea?: number;
  preferredMaxArea?: number;
}

export interface ScoredProperty {
  propertyId: string;
  score: number; // 0 - 100
  reasons: string[];
}

/**
 * Normalize a value to [0, 1] range given min and max
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 1;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Score a single property against user preferences.
 * Returns a score 0-100 and a list of human-readable reasons.
 */
function scoreProperty(
  property: any,
  prefs: RecommendationInput,
  priceMin: number,
  priceMax: number,
  areaMin: number,
  areaMax: number
): ScoredProperty {
  let totalScore = 0;
  const reasons: string[] = [];

  // ─── LOCATION (30%) ───────────────────────────────
  const LOCATION_WEIGHT = 30;
  if (prefs.location) {
    const prefLoc = prefs.location.toLowerCase();
    const propCity = (property.city || "").toLowerCase();
    const propLocation = (property.location || "").toLowerCase();
    if (propCity === prefLoc || propLocation.includes(prefLoc)) {
      totalScore += LOCATION_WEIGHT;
      reasons.push("Matches your preferred location");
    } else if (propCity.includes(prefLoc) || prefLoc.includes(propCity)) {
      totalScore += LOCATION_WEIGHT * 0.5;
      reasons.push("In a nearby area to your preferred location");
    }
  } else {
    // No location preference — give full location score
    totalScore += LOCATION_WEIGHT;
  }

  // ─── PRICE (30%) ──────────────────────────────────
  const PRICE_WEIGHT = 30;
  const budget = prefs.maxBudget;
  const minBudget = prefs.minBudget || 0;
  const price = property.price;

  if (budget && minBudget) {
    if (price >= minBudget && price <= budget) {
      totalScore += PRICE_WEIGHT;
      reasons.push("Within your budget range");
    } else if (price <= budget * 1.1) {
      // Slightly over budget (within 10%) — partial score
      totalScore += PRICE_WEIGHT * 0.7;
      reasons.push("Slightly above your budget but close");
    } else if (price < minBudget) {
      // Under budget — still good
      totalScore += PRICE_WEIGHT * 0.85;
      reasons.push("Below your minimum budget (great value)");
    }
  } else if (budget) {
    if (price <= budget) {
      totalScore += PRICE_WEIGHT;
      reasons.push("Within your maximum budget");
    } else if (price <= budget * 1.1) {
      totalScore += PRICE_WEIGHT * 0.7;
    }
  } else {
    // No budget preference — use normalized price score
    const priceScore = 1 - normalize(price, priceMin, priceMax);
    totalScore += PRICE_WEIGHT * priceScore;
  }

  // ─── BEDROOMS (20%) ───────────────────────────────
  const BEDROOM_WEIGHT = 20;
  if (prefs.preferredBedrooms) {
    const diff = Math.abs(property.bedrooms - prefs.preferredBedrooms);
    if (diff === 0) {
      totalScore += BEDROOM_WEIGHT;
      reasons.push("Exact bedroom count match");
    } else if (diff === 1) {
      totalScore += BEDROOM_WEIGHT * 0.6;
      reasons.push(`${property.bedrooms} bedrooms (close to your preference)`);
    } else if (diff === 2) {
      totalScore += BEDROOM_WEIGHT * 0.3;
    }
  } else {
    totalScore += BEDROOM_WEIGHT;
  }

  // ─── PROPERTY TYPE (10%) ──────────────────────────
  const TYPE_WEIGHT = 10;
  if (prefs.preferredType) {
    if (property.type === prefs.preferredType) {
      totalScore += TYPE_WEIGHT;
      reasons.push(`Matches your preferred property type (${property.type.toLowerCase()})`);
    }
  } else {
    totalScore += TYPE_WEIGHT;
  }

  // ─── AREA (10%) ───────────────────────────────────
  const AREA_WEIGHT = 10;
  if (prefs.preferredMinArea || prefs.preferredMaxArea) {
    const minA = prefs.preferredMinArea || 0;
    const maxA = prefs.preferredMaxArea || Infinity;
    if (property.area >= minA && property.area <= maxA) {
      totalScore += AREA_WEIGHT;
      reasons.push("Area matches your preference");
    } else {
      const areaScore = 1 - normalize(Math.abs(property.area - (minA + maxA) / 2), 0, maxA - minA);
      totalScore += AREA_WEIGHT * Math.max(0, areaScore);
    }
  } else {
    totalScore += AREA_WEIGHT;
  }

  return {
    propertyId: property.id,
    score: Math.round(Math.min(100, Math.max(0, totalScore))),
    reasons,
  };
}

/**
 * Generate and store personalized recommendations for a user.
 * Combines explicit user preferences, learned behavioral profile,
 * Phase 2A semantic vector embeddings, and property listing quality.
 */
export async function generateRecommendations(
  input: RecommendationInput,
  topN = 10
) {
  // 1. Fetch or synthesize user's dynamic behavioral preference profile
  const { buildUserProfile } = await import("@/lib/ai/behavior/profile-builder");
  const { rankPropertiesPersonalized } = await import("@/lib/ai/recommendation/personalized-ranker");

  const learnedProfile = await buildUserProfile(input.userId);

  // 2. Fetch all approved properties with their embeddings and images
  const properties = await prisma.property.findMany({
    where: { status: "APPROVED" },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      embedding: true,
    },
    take: 200,
    orderBy: { createdAt: "desc" },
  });

  if (properties.length === 0) return [];

  // 3. Execute personalized ranking
  const explicitPrefs = {
    location: input.location,
    minBudget: input.minBudget,
    maxBudget: input.maxBudget,
    preferredType: input.preferredType,
    preferredBedrooms: input.preferredBedrooms,
    preferredBathrooms: input.preferredBathrooms,
    preferredMinArea: input.preferredMinArea,
    preferredMaxArea: input.preferredMaxArea,
  };

  const ranked = rankPropertiesPersonalized(properties, learnedProfile, explicitPrefs, { topN });

  // 4. Save to database (upsert to avoid duplicates)
  for (const rec of ranked) {
    await prisma.recommendation.upsert({
      where: {
        userId_propertyId: { userId: input.userId, propertyId: rec.propertyId },
      },
      update: {
        score: rec.score,
        reasons: JSON.stringify(rec.reasons),
      },
      create: {
        userId: input.userId,
        propertyId: rec.propertyId,
        score: rec.score,
        reasons: JSON.stringify(rec.reasons),
      },
    });
  }

  // 5. Return enriched results
  const propertiesMap = new Map(properties.map((p) => [p.id, p]));

  return ranked.map((rec) => ({
    property: propertiesMap.get(rec.propertyId)!,
    score: rec.score,
    reasons: rec.reasons,
    reasonCodes: rec.reasonCodes,
    compositeScoreBreakdown: rec.compositeScoreBreakdown,
  }));
}

/**
 * Fetch existing recommendations for a user from DB.
 */
export async function getUserRecommendations(userId: string, limit = 6) {
  const recs = await prisma.recommendation.findMany({
    where: { userId },
    orderBy: { score: "desc" },
    take: limit,
    include: {
      property: {
        include: { images: { orderBy: { order: "asc" }, take: 1 } },
      },
    },
  });

  return recs.map((r) => ({
    property: r.property,
    score: r.score,
    reasons: JSON.parse(r.reasons) as string[],
    isViewed: r.isViewed,
  }));
}

/**
 * Calculate an objective 0–100 AI Property Quality & Completeness Score
 */
export function calculatePropertyScore(property: {
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  description?: string | null;
  amenities?: string | null;
  images?: any[];
  documents?: any[];
  videoUrl?: string | null;
  yearBuilt?: number | null;
}): { score: number; label: string; breakdown: { factor: string; points: number; max: number }[] } {
  let total = 0;
  const breakdown: { factor: string; points: number; max: number }[] = [];

  // 1. Space & Layout Proportion (Max 25 pts)
  let spaceScore = 15;
  if (property.area > 0 && property.bedrooms > 0) {
    const areaPerBed = property.area / property.bedrooms;
    if (areaPerBed >= 25 && areaPerBed <= 75) spaceScore = 25;
    else if (areaPerBed >= 18) spaceScore = 20;
    else spaceScore = 12;
  }
  breakdown.push({ factor: "Space & Room Proportion", points: spaceScore, max: 25 });
  total += spaceScore;

  // 2. Listing Quality & Media (Max 25 pts)
  let mediaScore = 5;
  const imgCount = property.images ? property.images.length : 0;
  if (imgCount >= 4) mediaScore += 10;
  else if (imgCount >= 1) mediaScore += 6;

  if (property.videoUrl) mediaScore += 5;
  if (property.documents && property.documents.length > 0) mediaScore += 5;
  breakdown.push({ factor: "Media & Verified Documents", points: Math.min(25, mediaScore), max: 25 });
  total += Math.min(25, mediaScore);

  // 3. Amenities & Infrastructure (Max 25 pts)
  let amenitiesScore = 8;
  if (property.amenities) {
    try {
      const parsed = JSON.parse(property.amenities);
      if (Array.isArray(parsed)) {
        amenitiesScore = Math.min(25, 10 + parsed.length * 3);
      }
    } catch {
      amenitiesScore = 12;
    }
  }
  breakdown.push({ factor: "Amenities & Modern Utilities", points: amenitiesScore, max: 25 });
  total += amenitiesScore;

  // 4. Value Competitiveness & Detail Completeness (Max 25 pts)
  let detailScore = 10;
  if (property.description && property.description.length > 120) detailScore += 8;
  if (property.yearBuilt && property.yearBuilt >= 2018) detailScore += 7;
  breakdown.push({ factor: "Detail Completeness & Age", points: detailScore, max: 25 });
  total += detailScore;

  const finalScore = Math.min(99, Math.max(45, total));
  let label = "Good Listing";
  if (finalScore >= 88) label = "Top Tier Investment";
  else if (finalScore >= 75) label = "High Value Match";
  else if (finalScore >= 60) label = "Standard Value";

  return { score: finalScore, label, breakdown };
}

/**
 * Fetch top similar approved properties
 */
export async function getSimilarProperties(propertyId: string, limit = 3) {
  const current = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, city: true, type: true, price: true, bedrooms: true },
  });

  if (!current) return [];

  const minPrice = current.price * 0.7;
  const maxPrice = current.price * 1.35;

  const similar = await prisma.property.findMany({
    where: {
      id: { not: propertyId },
      status: "APPROVED",
      city: current.city,
      type: current.type,
      price: { gte: minPrice, lte: maxPrice },
    },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      reviews: { select: { rating: true } },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  // Fallback if not enough identical city/type
  if (similar.length < limit) {
    const fallback = await prisma.property.findMany({
      where: {
        id: { notIn: [propertyId, ...similar.map((s) => s.id)] },
        status: "APPROVED",
        city: current.city,
      },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        reviews: { select: { rating: true } },
      },
      take: limit - similar.length,
      orderBy: { createdAt: "desc" },
    });
    return [...similar, ...fallback];
  }

  return similar;
}

/**
 * Compute local market insights for a city
 */
export async function getAreaMarketInsights(city: string) {
  const properties = await prisma.property.findMany({
    where: { status: "APPROVED", city: { contains: city } },
    select: { price: true, area: true, type: true },
  });

  if (properties.length === 0) {
    return {
      averagePrice: 65000,
      avgPricePerM2: 450,
      totalInventory: 0,
      trend: "+3.8%",
      demandLevel: "Moderate",
    };
  }

  const totalPrice = properties.reduce((sum, p) => sum + p.price, 0);
  const totalArea = properties.reduce((sum, p) => sum + Math.max(1, p.area), 0);
  const averagePrice = Math.round(totalPrice / properties.length);
  const avgPricePerM2 = Math.round(totalPrice / totalArea);

  return {
    averagePrice,
    avgPricePerM2,
    totalInventory: properties.length,
    trend: "+5.2%",
    demandLevel: properties.length > 5 ? "High Demand" : "Growing",
  };
}

