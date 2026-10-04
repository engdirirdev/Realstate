/**
 * Reciprocal Rank Fusion (RRF) & Intelligent Hybrid Ranker
 *
 * Implements Reciprocal Rank Fusion (Cormack et al.) to combine:
 * 1. Structured SQL relevance (hard constraint match perfection & property attributes)
 * 2. Multilingual dense vector semantic similarity
 *
 * Formula:
 *   RRF_score(d) = (w_struct / (k + rank_struct(d))) + (w_sem / (k + rank_sem(d)))
 *
 * Default Parameters:
 *   k = 60 (Standard robust constant preventing high-rank domination)
 *   w_struct = 1.0
 *   w_sem = 1.0
 */

import { HardConstraints } from "../nlu/constraint-classifier";

export interface CandidateProperty {
  id: string;
  title: string;
  type: string;
  status: string;
  city: string;
  location: string | null;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  parking: number | null;
  isFurnished: boolean;
  description: string;
  imageUrl: string | null;
  similarity?: number;
  structuredRank?: number;
  semanticRank?: number;
}

export interface RankedSearchResult {
  property: CandidateProperty;
  rrfScore: number;
  semanticSimilarity: number;
  compositeScore: number;
  satisfiesAllHardConstraints: boolean;
  matchedSoftPreferences: string[];
  rankBreakdown: {
    structuredRank: number;
    semanticRank: number;
  };
}

export interface RRFConfig {
  k?: number;
  weightStructured?: number;
  weightSemantic?: number;
}

const DEFAULT_RRF_CONFIG: Required<RRFConfig> = {
  k: 60,
  weightStructured: 1.0,
  weightSemantic: 1.0,
};

/**
 * Checks whether a candidate strictly satisfies all active hard constraints.
 */
export function verifyHardConstraints(
  property: CandidateProperty,
  constraints: HardConstraints
): { satisfies: boolean; violatedFields: string[] } {
  const violated: string[] = [];

  // 1. City constraint
  if (constraints.city) {
    if (property.city.toLowerCase() !== constraints.city.toLowerCase()) {
      violated.push(`city (expected: ${constraints.city}, got: ${property.city})`);
    }
  }

  // 2. Property type constraint (HOUSE encompasses residential homes / townhouses, strictly rejecting apartments/commercial/land)
  if (constraints.propertyType) {
    const req = constraints.propertyType.toUpperCase();
    const actual = property.type.toUpperCase();
    const isMatch = req === actual || (req === "HOUSE" && (actual === "HOUSE" || actual === "TOWNHOUSE"));
    if (!isMatch) {
      violated.push(`propertyType (expected: ${constraints.propertyType}, got: ${property.type})`);
    }
  }

  // 3. Bedroom count constraint
  if (constraints.bedrooms) {
    const { operator, value, maxValue } = constraints.bedrooms;
    if (operator === "eq" && property.bedrooms !== value) {
      violated.push(`bedrooms (expected: ${value}, got: ${property.bedrooms})`);
    } else if (operator === "gte" && property.bedrooms < value) {
      violated.push(`bedrooms (expected: >= ${value}, got: ${property.bedrooms})`);
    } else if (operator === "lte" && property.bedrooms > value) {
      violated.push(`bedrooms (expected: <= ${value}, got: ${property.bedrooms})`);
    } else if (operator === "between" && maxValue && (property.bedrooms < value || property.bedrooms > maxValue)) {
      violated.push(`bedrooms (expected: ${value}-${maxValue}, got: ${property.bedrooms})`);
    }
  }

  // 4. Bathroom count constraint
  if (constraints.bathrooms) {
    const { operator, value } = constraints.bathrooms;
    if (operator === "gte" && property.bathrooms < value) {
      violated.push(`bathrooms (expected: >= ${value}, got: ${property.bathrooms})`);
    } else if (operator === "eq" && property.bathrooms !== value) {
      violated.push(`bathrooms (expected: ${value}, got: ${property.bathrooms})`);
    }
  }

  // 5. Price constraints
  if (constraints.maxPrice !== undefined && property.price > constraints.maxPrice) {
    violated.push(`maxPrice (expected: <= $${constraints.maxPrice}, got: $${property.price})`);
  }
  if (constraints.minPrice !== undefined && property.price < constraints.minPrice) {
    violated.push(`minPrice (expected: >= $${constraints.minPrice}, got: $${property.price})`);
  }

  // 6. Parking constraint
  if (constraints.parking === true) {
    const parkingCount = property.parking || 0;
    if (parkingCount <= 0) {
      violated.push(`parking (expected: parking > 0, got: ${parkingCount})`);
    }
  }

  // 7. Furnished constraint
  if (constraints.furnished === true && !property.isFurnished) {
    violated.push(`furnished (expected: true, got: false)`);
  }

  return {
    satisfies: violated.length === 0,
    violatedFields: violated,
  };
}

/**
 * Executes Reciprocal Rank Fusion over structured and semantic candidate lists.
 */
export function fuseAndRankCandidates(
  structuredCandidates: CandidateProperty[],
  semanticCandidates: CandidateProperty[],
  hardConstraints: HardConstraints,
  softPreferences: string[],
  config?: RRFConfig
): RankedSearchResult[] {
  const { k, weightStructured, weightSemantic } = { ...DEFAULT_RRF_CONFIG, ...config };

  // Map of candidate property by ID
  const propertyMap = new Map<string, CandidateProperty>();

  // Ranks in structured stream (1-indexed)
  const structuredRanks = new Map<string, number>();
  structuredCandidates.forEach((prop, idx) => {
    propertyMap.set(prop.id, prop);
    structuredRanks.set(prop.id, idx + 1);
  });

  // Ranks in semantic stream (1-indexed)
  const semanticRanks = new Map<string, number>();
  const semanticSimMap = new Map<string, number>();
  semanticCandidates.forEach((prop, idx) => {
    if (!propertyMap.has(prop.id)) {
      propertyMap.set(prop.id, prop);
    }
    semanticRanks.set(prop.id, idx + 1);
    semanticSimMap.set(prop.id, prop.similarity || 0);
  });

  // Compute RRF for all unique candidate properties
  const rankedItems: RankedSearchResult[] = [];
  const maxRank = Math.max(structuredCandidates.length, semanticCandidates.length, 100) + 1;

  for (const [id, prop] of propertyMap.entries()) {
    const sRank = structuredRanks.get(id) ?? maxRank;
    const semRank = semanticRanks.get(id) ?? maxRank;
    const similarity = semanticSimMap.get(id) ?? prop.similarity ?? 0;

    // RRF Score
    const rrfScore =
      weightStructured / (k + sRank) +
      weightSemantic / (k + semRank);

    // Verify hard constraint adherence
    const { satisfies } = verifyHardConstraints(prop, hardConstraints);

    // Identify matched soft preferences in title/description
    const matchedSoft: string[] = [];
    const fullText = `${prop.title} ${prop.description} ${prop.location || ""}`.toLowerCase();
    for (const pref of softPreferences) {
      const kw = pref.toLowerCase();
      if (
        fullText.includes(kw) ||
        (kw.includes("beach") && (fullText.includes("ocean") || fullText.includes("xeeb") || fullText.includes("liido"))) ||
        (kw.includes("quiet") && (fullText.includes("peaceful") || fullText.includes("degan"))) ||
        (kw.includes("solar") && (fullText.includes("shamsi") || fullText.includes("solar")))
      ) {
        matchedSoft.push(pref);
      }
    }

    // Normalized composite score:
    // Combines RRF (normalized), semantic similarity, and matched soft preference bonus
    const normRrf = rrfScore * ((k + 1) / 2); // Scales to approx 0-1
    const softBonus = Math.min(0.2, matchedSoft.length * 0.05);
    const compositeScore = Math.round((0.5 * normRrf + 0.35 * similarity + 0.15 * softBonus) * 10000) / 10000;

    rankedItems.push({
      property: prop,
      rrfScore: Math.round(rrfScore * 10000) / 10000,
      semanticSimilarity: Math.round(similarity * 10000) / 10000,
      compositeScore,
      satisfiesAllHardConstraints: satisfies,
      matchedSoftPreferences: matchedSoft,
      rankBreakdown: {
        structuredRank: sRank,
        semanticRank: semRank,
      },
    });
  }

  // Sort descending by composite score, prioritizing hard-constraint satisfaction
  rankedItems.sort((a, b) => {
    // 1. Mandatory constraint satisfaction first
    if (a.satisfiesAllHardConstraints !== b.satisfiesAllHardConstraints) {
      return a.satisfiesAllHardConstraints ? -1 : 1;
    }
    // 2. Composite score descending
    return b.compositeScore - a.compositeScore;
  });

  return rankedItems;
}
