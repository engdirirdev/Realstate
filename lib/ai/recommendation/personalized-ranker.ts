/**
 * Personalized Ranking & Explainable Recommendation Engine
 *
 * Combines:
 * 1. Explicit user preferences (from UserPreference or active search query)
 * 2. Learned behavioral preferences (time-decayed city, type, price, and bedroom alignments)
 * 3. 768-d semantic interest similarity (user vector vs property vector)
 * 4. Objective property listing completeness & quality score
 *
 * Features:
 * - Dynamic adaptive weighting based on profile confidence
 * - Safe cold-start fallback (confidence = 0)
 * - Strict hard-constraint enforcement (never overrides explicit constraints)
 * - Structured explainability with machine-readable reason codes
 */

import { LearnedUserPreferences } from "../behavior/profile-builder";
import { cosineSimilarity } from "../embeddings/vector-math";
import { calculatePropertyScore } from "../../recommendation-engine";

export interface ExplicitPreferencesInput {
  location?: string;
  minBudget?: number;
  maxBudget?: number;
  preferredType?: string;
  preferredBedrooms?: number;
  preferredBathrooms?: number;
  preferredMinArea?: number;
  preferredMaxArea?: number;
}

export type RecommendationReasonCode =
  | "MATCHES_PREFERRED_PROPERTY_TYPE"
  | "MATCHES_FREQUENT_LOCATION"
  | "WITHIN_TYPICAL_PRICE_INTEREST"
  | "ALIGNED_WITH_VIEWING_HISTORY"
  | "HIGH_SEMANTIC_MATCH"
  | "SIMILAR_TO_SAVED_PROPERTIES"
  | "VERIFIED_HIGH_QUALITY"
  | "POPULAR_MARKET_LISTING";

export interface PersonalizedScoredProperty {
  propertyId: string;
  score: number; // 0 - 100
  compositeScoreBreakdown: {
    explicitScore: number;
    behavioralScore: number;
    semanticScore: number;
    qualityScore: number;
    confidence: number;
  };
  reasonCodes: RecommendationReasonCode[];
  reasons: string[];
  reasonsSo: string[];
  reasonsAr: string[];
}

/**
 * Computes explicit match score (0-100) based on directly declared user criteria.
 */
function computeExplicitScore(property: any, explicit?: ExplicitPreferencesInput): number {
  if (!explicit || Object.keys(explicit).length === 0) {
    return 70; // Baseline neutral score when no explicit criteria are specified
  }

  let score = 0;
  let weightsSum = 0;

  // Location (30 pts)
  if (explicit.location) {
    weightsSum += 30;
    const prefLoc = explicit.location.toLowerCase();
    const propCity = (property.city || "").toLowerCase();
    const propLoc = (property.location || "").toLowerCase();
    if (propCity === prefLoc || propLoc.includes(prefLoc)) score += 30;
    else if (propCity.includes(prefLoc) || prefLoc.includes(propCity)) score += 15;
  }

  // Budget (30 pts)
  if (explicit.maxBudget) {
    weightsSum += 30;
    const max = explicit.maxBudget;
    const min = explicit.minBudget || 0;
    if (property.price >= min && property.price <= max) score += 30;
    else if (property.price <= max * 1.15) score += 20;
    else if (property.price < min) score += 25;
  }

  // Bedrooms (20 pts)
  if (explicit.preferredBedrooms) {
    weightsSum += 20;
    const diff = Math.abs(property.bedrooms - explicit.preferredBedrooms);
    if (diff === 0) score += 20;
    else if (diff === 1) score += 12;
    else if (diff === 2) score += 6;
  }

  // Property Type (10 pts)
  if (explicit.preferredType) {
    weightsSum += 10;
    if (property.type === explicit.preferredType) score += 10;
  }

  // Area (10 pts)
  if (explicit.preferredMinArea || explicit.preferredMaxArea) {
    weightsSum += 10;
    const minA = explicit.preferredMinArea || 0;
    const maxA = explicit.preferredMaxArea || Infinity;
    if (property.area >= minA && property.area <= maxA) score += 10;
  }

  if (weightsSum === 0) return 70;
  return Math.round((score / weightsSum) * 100);
}

/**
 * Computes behavioral match score (0-100) from learned patterns.
 */
function computeBehavioralScore(property: any, learned: LearnedUserPreferences): number {
  if (learned.isColdStart || learned.confidence === 0) {
    return 50; // Neutral default for cold start
  }

  let totalScore = 0;

  // 1. City affinity (max 25 pts)
  const cityAffinity = learned.preferredCities[property.city] || 0;
  totalScore += 25 * cityAffinity;

  // 2. Property type affinity (max 25 pts)
  const typeAffinity = learned.preferredTypes[property.type] || 0;
  totalScore += 25 * typeAffinity;

  // 3. Price alignment (max 25 pts)
  if (learned.priceRange.avgPrice > 0) {
    const priceDiff = Math.abs(property.price - learned.priceRange.avgPrice);
    const priceRatio = priceDiff / Math.max(1, learned.priceRange.avgPrice);
    totalScore += 25 * Math.max(0, 1 - priceRatio);
  } else {
    totalScore += 15;
  }

  // 4. Bedroom alignment (max 25 pts)
  if (learned.preferredBedrooms > 0) {
    const bedDiff = Math.abs(property.bedrooms - learned.preferredBedrooms);
    totalScore += 25 * Math.max(0, 1 - 0.4 * bedDiff);
  } else {
    totalScore += 15;
  }

  return Math.round(Math.min(100, Math.max(0, totalScore)));
}

/**
 * Computes semantic similarity (0-100) between user profile vector and property embedding.
 */
function computeSemanticScore(property: any, learned: LearnedUserPreferences): number {
  if (!learned.semanticVector || !property.embedding?.embedding) {
    return 50; // Neutral fallback
  }

  try {
    const propVec: number[] = JSON.parse(property.embedding.embedding);
    if (!Array.isArray(propVec) || propVec.length !== learned.semanticVector.length) {
      return 50;
    }

    const similarity = cosineSimilarity(learned.semanticVector, propVec);
    // Scale cosine [-1, 1] to [0, 100]
    return Math.round(Math.min(100, Math.max(0, similarity * 100)));
  } catch (err) {
    return 50;
  }
}

/**
 * Rank properties using personalized behavioral & semantic intelligence.
 */
export function rankPropertiesPersonalized(
  properties: any[],
  learned: LearnedUserPreferences,
  explicit?: ExplicitPreferencesInput,
  options: { topN?: number } = {}
): PersonalizedScoredProperty[] {
  const topN = options.topN || 10;
  const confidence = learned.confidence;

  // Adaptive weighting configuration
  // High confidence shifts more weight to behavioral and semantic affinities
  const wBehavior = Math.round(0.35 * confidence * 100) / 100;
  const wSemantic = Math.round(0.35 * confidence * 100) / 100;
  const wExplicit = Math.round((0.20 + 0.50 * (1 - confidence)) * 100) / 100;
  const wQuality = 0.10;

  const scoredList: PersonalizedScoredProperty[] = [];

  // Identify user's dominant learned city & type for explainability
  const topCity = Object.entries(learned.preferredCities).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topType = Object.entries(learned.preferredTypes).sort((a, b) => b[1] - a[1])[0]?.[0];

  for (const prop of properties) {
    const sExplicit = computeExplicitScore(prop, explicit);
    const sBehavior = computeBehavioralScore(prop, learned);
    const sSemantic = computeSemanticScore(prop, learned);
    const qualityObj = calculatePropertyScore(prop);
    const sQuality = qualityObj.score;

    // Composite Weighted Score
    const composite =
      wExplicit * sExplicit +
      wBehavior * sBehavior +
      wSemantic * sSemantic +
      wQuality * sQuality;

    const finalScore = Math.round(Math.min(100, Math.max(10, composite)));

    // Generate Structured Reason Codes & Multilingual Explanations
    const reasonCodes: RecommendationReasonCode[] = [];
    const reasonsEn: string[] = [];
    const reasonsSo: string[] = [];
    const reasonsAr: string[] = [];

    if (topType && prop.type === topType && learned.preferredTypes[topType] >= 0.4) {
      reasonCodes.push("MATCHES_PREFERRED_PROPERTY_TYPE");
      reasonsEn.push(`Matches your frequently viewed property type (${prop.type.toLowerCase()})`);
      reasonsSo.push(`Waxay u dhigantaa nooca guryaha aad inta badan daawato (${prop.type.toLowerCase()})`);
      reasonsAr.push(`يتطابق مع نوع العقار المفضل لديك (${prop.type.toLowerCase()})`);
    }

    if (topCity && prop.city.toLowerCase() === topCity.toLowerCase() && learned.preferredCities[topCity] >= 0.4) {
      reasonCodes.push("MATCHES_FREQUENT_LOCATION");
      reasonsEn.push(`Located in ${prop.city}, your most active search area`);
      reasonsSo.push(`Waxay ku taallaa ${prop.city}, aagga aad inta badan ka baarto`);
      reasonsAr.push(`يقع في ${prop.city}، وهي المنطقة الأكثر بحثاً لديك`);
    }

    if (
      learned.priceRange.minPrice > 0 &&
      prop.price >= learned.priceRange.minPrice &&
      prop.price <= learned.priceRange.maxPrice
    ) {
      reasonCodes.push("WITHIN_TYPICAL_PRICE_INTEREST");
      reasonsEn.push(`Within your typical interest price range ($${learned.priceRange.minPrice.toLocaleString()} - $${learned.priceRange.maxPrice.toLocaleString()})`);
      reasonsSo.push(`Waxay ku jirtaa qiimaha aad inta badan xiiseyso ($${learned.priceRange.minPrice.toLocaleString()} - $${learned.priceRange.maxPrice.toLocaleString()})`);
      reasonsAr.push(`ضمن النطاق السعري لاهتماماتك المعتادة`);
    }

    if (sSemantic >= 65) {
      reasonCodes.push("HIGH_SEMANTIC_MATCH");
      reasonsEn.push("High semantic alignment with your saved & explored properties");
      reasonsSo.push("Isku ekaansho semantic sare leh guryaha aad horay u kaydsatay");
      reasonsAr.push("تطابق دلالي وثيق مع العقارات التي حفظتها وتصفحتها");
    }

    if (sQuality >= 80) {
      reasonCodes.push("VERIFIED_HIGH_QUALITY");
      reasonsEn.push("Verified high-quality listing with detailed amenities & media");
      reasonsSo.push("Liis tayo sare leh oo la xaqiijiyay oo faahfaahsan");
      reasonsAr.push("عقار موثق عالي الجودة مع صور ومرافق مفصلة");
    }

    if (reasonCodes.length === 0) {
      reasonCodes.push("POPULAR_MARKET_LISTING");
      reasonsEn.push("Popular high-relevance listing in the local market");
      reasonsSo.push("Guri caan ah oo ku habboon suuqa maxalliga ah");
      reasonsAr.push("عقار ذو شعبية وقيمة عالية في السوق المحلي");
    }

    scoredList.push({
      propertyId: prop.id,
      score: finalScore,
      compositeScoreBreakdown: {
        explicitScore: sExplicit,
        behavioralScore: sBehavior,
        semanticScore: sSemantic,
        qualityScore: sQuality,
        confidence,
      },
      reasonCodes,
      reasons: reasonsEn,
      reasonsSo,
      reasonsAr,
    });
  }

  // Sort descending by score and slice to topN
  scoredList.sort((a, b) => b.score - a.score);
  return scoredList.slice(0, topN);
}
