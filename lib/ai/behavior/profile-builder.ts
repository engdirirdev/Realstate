/**
 * User Preference Profile Builder
 *
 * Synthesizes raw behavioral events (views, clicks, favorites, inquiries)
 * into a dynamic, time-decayed preference profile and a 768-d semantic interest vector.
 *
 * Reuses Phase 2A property embeddings and normalizes distributions.
 */

import { prisma } from "@/lib/prisma";
import { InteractionType } from "@prisma/client";
import {
  SIGNAL_BASE_WEIGHTS,
  calculateDecayedWeight,
  calculateProfileConfidence,
  BEHAVIORAL_CONFIG,
} from "./signal-weights";
import { normalizeVector } from "../embeddings/vector-math";

export interface LearnedUserPreferences {
  userId: string;
  confidence: number; // 0.0 (cold-start) to 1.0 (high)
  totalInteractions: number;
  totalWeight: number;
  preferredCities: Record<string, number>; // normalized distribution: { Mogadishu: 0.8, Hargeisa: 0.2 }
  preferredTypes: Record<string, number>;  // normalized distribution: { HOUSE: 0.65, APARTMENT: 0.35 }
  priceRange: {
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
  };
  preferredBedrooms: number;
  preferredBathrooms: number;
  preferredAmenities: string[];
  semanticVector: number[] | null; // 768-d unit vector
  lastActiveAt: Date;
  isColdStart: boolean;
}

/**
 * Builds or refreshes the user's learned preference profile from historical interactions.
 */
export async function buildUserProfile(
  userId: string,
  options: { forceRefresh?: boolean } = {}
): Promise<LearnedUserPreferences> {
  const now = new Date();

  // 1. Check existing cached profile if not forcing refresh
  if (!options.forceRefresh) {
    const cached = await prisma.userPreferenceProfile.findUnique({
      where: { userId },
    });

    // If profile was updated in the last 15 minutes, return cached profile
    if (cached && now.getTime() - cached.updatedAt.getTime() < 15 * 60 * 1000) {
      let cities: Record<string, number> = {};
      let types: Record<string, number> = {};
      let amenities: string[] = [];
      let vector: number[] | null = null;

      try {
        if (cached.preferredCities) cities = JSON.parse(cached.preferredCities);
        if (cached.preferredTypes) types = JSON.parse(cached.preferredTypes);
        if (cached.amenities) amenities = JSON.parse(cached.amenities);
        if (cached.semanticVector) vector = JSON.parse(cached.semanticVector);
      } catch (err) {
        console.warn(`[ProfileBuilder] Failed to parse cached profile for user ${userId}:`, err);
      }

      return {
        userId,
        confidence: cached.confidence,
        totalInteractions: cached.totalInteractions,
        totalWeight: cached.totalWeight,
        preferredCities: cities,
        preferredTypes: types,
        priceRange: {
          minPrice: cached.minPrice || 0,
          maxPrice: cached.maxPrice || 0,
          avgPrice: cached.avgPrice || 0,
        },
        preferredBedrooms: cached.preferredBeds || 0,
        preferredBathrooms: cached.preferredBaths || 0,
        preferredAmenities: amenities,
        semanticVector: vector,
        lastActiveAt: cached.lastActiveAt,
        isColdStart: cached.confidence === 0,
      };
    }
  }

  // 2. Query all interactions for this user within the last 90 days
  const minDate = new Date(now.getTime() - BEHAVIORAL_CONFIG.MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

  const interactions = await prisma.userInteraction.findMany({
    where: {
      userId,
      createdAt: { gte: minDate },
    },
    include: {
      property: {
        include: {
          embedding: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // 3. Fallback / supplement with existing Favorite and Inquiry records if interactions table is sparse
  let supplementaryInteractions: any[] = [];
  if (interactions.length === 0) {
    const [favs, inqs] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId, createdAt: { gte: minDate } },
        include: { property: { include: { embedding: true } } },
        take: 50,
      }),
      prisma.inquiry.findMany({
        where: { customerId: userId, createdAt: { gte: minDate } },
        include: { property: { include: { embedding: true } } },
        take: 50,
      }),
    ]);

    for (const f of favs) {
      supplementaryInteractions.push({
        id: `supp_fav_${f.id}`,
        userId,
        propertyId: f.propertyId,
        eventType: "FAVORITE" as InteractionType,
        weight: SIGNAL_BASE_WEIGHTS.FAVORITE,
        createdAt: f.createdAt,
        property: f.property,
      });
    }

    for (const inq of inqs) {
      supplementaryInteractions.push({
        id: `supp_inq_${inq.id}`,
        userId,
        propertyId: inq.propertyId,
        eventType: "INQUIRY" as InteractionType,
        weight: SIGNAL_BASE_WEIGHTS.INQUIRY,
        createdAt: inq.createdAt,
        property: inq.property,
      });
    }
  }

  const allEvents = [...interactions, ...supplementaryInteractions];

  // Cold Start Detection: No interactions
  if (allEvents.length === 0) {
    const coldStartProfile: LearnedUserPreferences = {
      userId,
      confidence: 0.0,
      totalInteractions: 0,
      totalWeight: 0.0,
      preferredCities: {},
      preferredTypes: {},
      priceRange: { minPrice: 0, maxPrice: 0, avgPrice: 0 },
      preferredBedrooms: 0,
      preferredBathrooms: 0,
      preferredAmenities: [],
      semanticVector: null,
      lastActiveAt: now,
      isColdStart: true,
    };

    // Upsert zero-confidence profile safely if user exists in database
    try {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (userExists) {
        await prisma.userPreferenceProfile.upsert({
          where: { userId },
          update: {
            confidence: 0.0,
            totalInteractions: 0,
            totalWeight: 0.0,
            updatedAt: now,
          },
          create: {
            userId,
            confidence: 0.0,
            totalInteractions: 0,
            totalWeight: 0.0,
          },
        });
      }
    } catch {
      // Safe fallback for guest or unpersisted user IDs
    }

    return coldStartProfile;
  }

  // 4. Aggregate features weighted by time-decay
  let totalEffectiveWeight = 0;
  const cityWeights: Record<string, number> = {};
  const typeWeights: Record<string, number> = {};
  const amenityWeights: Record<string, number> = {};

  let sumWeightedPrice = 0;
  let sumWeightedBeds = 0;
  let sumWeightedBaths = 0;
  let minObservedPrice = Infinity;
  let maxObservedPrice = -Infinity;

  // Semantic vector accumulator (768 dimensions)
  const vectorDim = 768;
  const vectorAccumulator = new Float64Array(vectorDim);
  let totalVectorWeight = 0;

  for (const event of allEvents) {
    const baseW = SIGNAL_BASE_WEIGHTS[event.eventType as InteractionType] || 1.0;
    const decayedW = calculateDecayedWeight(baseW, event.createdAt, now);

    // Negative signals decrease weights or skip accumulation
    if (decayedW <= 0) continue;

    const prop = event.property;
    if (!prop) continue;

    totalEffectiveWeight += decayedW;

    // City aggregation
    if (prop.city) {
      cityWeights[prop.city] = (cityWeights[prop.city] || 0) + decayedW;
    }

    // Type aggregation
    if (prop.type) {
      typeWeights[prop.type] = (typeWeights[prop.type] || 0) + decayedW;
    }

    // Bedroom / Bathroom aggregation
    if (prop.bedrooms) {
      sumWeightedBeds += prop.bedrooms * decayedW;
    }
    if (prop.bathrooms) {
      sumWeightedBaths += prop.bathrooms * decayedW;
    }

    // Price aggregation
    if (prop.price && prop.price > 0) {
      sumWeightedPrice += prop.price * decayedW;
      if (prop.price < minObservedPrice) minObservedPrice = prop.price;
      if (prop.price > maxObservedPrice) maxObservedPrice = prop.price;
    }

    // Amenities aggregation
    if (prop.amenities) {
      try {
        const parsed = JSON.parse(prop.amenities);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const clean = String(item).toLowerCase().trim();
            amenityWeights[clean] = (amenityWeights[clean] || 0) + decayedW;
          }
        }
      } catch {
        // ignore JSON parse error
      }
    }

    // Semantic vector accumulation
    if (prop.embedding && prop.embedding.embedding) {
      try {
        const propVec: number[] = JSON.parse(prop.embedding.embedding);
        if (Array.isArray(propVec) && propVec.length === vectorDim) {
          for (let i = 0; i < vectorDim; i++) {
            vectorAccumulator[i] += propVec[i] * decayedW;
          }
          totalVectorWeight += decayedW;
        }
      } catch (err) {
        console.warn(`[ProfileBuilder] Embedding parse error for prop ${prop.id}:`, err);
      }
    }
  }

  // 5. Normalize distributions
  const normalizedCities: Record<string, number> = {};
  if (totalEffectiveWeight > 0) {
    for (const [c, w] of Object.entries(cityWeights)) {
      normalizedCities[c] = Math.round((w / totalEffectiveWeight) * 1000) / 1000;
    }
  }

  const normalizedTypes: Record<string, number> = {};
  if (totalEffectiveWeight > 0) {
    for (const [t, w] of Object.entries(typeWeights)) {
      normalizedTypes[t] = Math.round((w / totalEffectiveWeight) * 1000) / 1000;
    }
  }

  // Top amenities
  const sortedAmenities = Object.entries(amenityWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([a]) => a);

  // Compute weighted averages
  const avgPrice = totalEffectiveWeight > 0 ? Math.round(sumWeightedPrice / totalEffectiveWeight) : 0;
  const prefBeds = totalEffectiveWeight > 0 ? Math.round((sumWeightedBeds / totalEffectiveWeight) * 10) / 10 : 0;
  const prefBaths = totalEffectiveWeight > 0 ? Math.round((sumWeightedBaths / totalEffectiveWeight) * 10) / 10 : 0;
  const minPrice = minObservedPrice === Infinity ? 0 : Math.round(minObservedPrice * 0.9);
  const maxPrice = maxObservedPrice === -Infinity ? 0 : Math.round(maxObservedPrice * 1.1);

  // Normalize semantic profile vector
  let semanticVector: number[] | null = null;
  if (totalVectorWeight > 0) {
    const rawVec = new Array(vectorDim);
    for (let i = 0; i < vectorDim; i++) {
      rawVec[i] = vectorAccumulator[i] / totalVectorWeight;
    }
    semanticVector = normalizeVector(rawVec);
  }

  // Compute profile confidence
  const confidence = calculateProfileConfidence(totalEffectiveWeight);

  const profileResult: LearnedUserPreferences = {
    userId,
    confidence,
    totalInteractions: allEvents.length,
    totalWeight: Math.round(totalEffectiveWeight * 100) / 100,
    preferredCities: normalizedCities,
    preferredTypes: normalizedTypes,
    priceRange: {
      minPrice,
      maxPrice,
      avgPrice,
    },
    preferredBedrooms: prefBeds,
    preferredBathrooms: prefBaths,
    preferredAmenities: sortedAmenities,
    semanticVector,
    lastActiveAt: allEvents[0]?.createdAt || now,
    isColdStart: confidence === 0,
  };

  // 6. Upsert to database (with concurrency and foreign-key safety)
  try {
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (userExists) {
      await prisma.userPreferenceProfile.upsert({
        where: { userId },
        update: {
          confidence,
          totalInteractions: allEvents.length,
          totalWeight: Math.round(totalEffectiveWeight * 100) / 100,
          preferredCities: JSON.stringify(normalizedCities),
          preferredTypes: JSON.stringify(normalizedTypes),
          minPrice,
          maxPrice,
          avgPrice,
          preferredBeds: prefBeds,
          preferredBaths: prefBaths,
          amenities: JSON.stringify(sortedAmenities),
          semanticVector: semanticVector ? JSON.stringify(semanticVector) : null,
          lastActiveAt: profileResult.lastActiveAt,
          updatedAt: now,
        },
        create: {
          userId,
          confidence,
          totalInteractions: allEvents.length,
          totalWeight: Math.round(totalEffectiveWeight * 100) / 100,
          preferredCities: JSON.stringify(normalizedCities),
          preferredTypes: JSON.stringify(normalizedTypes),
          minPrice,
          maxPrice,
          avgPrice,
          preferredBeds: prefBeds,
          preferredBaths: prefBaths,
          amenities: JSON.stringify(sortedAmenities),
          semanticVector: semanticVector ? JSON.stringify(semanticVector) : null,
          lastActiveAt: profileResult.lastActiveAt,
        },
      });
    }
  } catch (err: any) {
    if (err.code === "P2002") {
      // Handled race condition: update existing
      try {
        await prisma.userPreferenceProfile.update({
          where: { userId },
          data: {
            confidence,
            totalInteractions: allEvents.length,
            totalWeight: Math.round(totalEffectiveWeight * 100) / 100,
            preferredCities: JSON.stringify(normalizedCities),
            preferredTypes: JSON.stringify(normalizedTypes),
            minPrice,
            maxPrice,
            avgPrice,
            preferredBeds: prefBeds,
            preferredBaths: prefBaths,
            amenities: JSON.stringify(sortedAmenities),
            semanticVector: semanticVector ? JSON.stringify(semanticVector) : null,
            lastActiveAt: profileResult.lastActiveAt,
            updatedAt: now,
          },
        });
      } catch {
        // Safe ignore
      }
    } else {
      console.warn(`[AI:ProfileBuilder] Could not persist profile for ${userId}: ${err.message}`);
    }
  }

  return profileResult;
}
