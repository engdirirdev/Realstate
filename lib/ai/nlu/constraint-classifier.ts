/**
 * Hard vs Soft Constraint Classifier & Query Normalizer
 *
 * Separates explicit mandatory criteria (Hard Constraints) from descriptive
 * ranking criteria (Soft Preferences), formulates the canonical semantic query,
 * validates extracted bounds, and provides conversational state merging.
 */

import { ExtractedEntities, NumericConstraint } from "./entity-extractor";
import { QueryIntent } from "./intent-classifier";
import { SupportedLanguage } from "../language/detector";

export interface HardConstraints {
  city?: string;
  propertyType?: string;
  bedrooms?: NumericConstraint;
  bathrooms?: NumericConstraint;
  maxPrice?: number;
  minPrice?: number;
  parking?: boolean;
  furnished?: boolean;
  purpose?: "SALE" | "RENT";
}

export interface NormalizedQueryUnderstanding {
  intent: QueryIntent;
  language: SupportedLanguage;
  rawQuery: string;
  hardConstraints: HardConstraints;
  softPreferences: string[];
  semanticQuery: string;
  confidence: number;
}

const VALID_CITIES = new Set([
  "Mogadishu", "Hargeisa", "Bosaso", "Kismayo", "Garowe", "Baydhabo", "Berbera"
]);

const VALID_TYPES = new Set([
  "HOUSE", "APARTMENT", "VILLA", "OFFICE", "LAND", "COMMERCIAL", "TOWNHOUSE", "STUDIO"
]);

/**
 * Validates and sanitizes hard constraints to prevent corrupt or out-of-range database queries.
 */
export function validateHardConstraints(constraints: HardConstraints): HardConstraints {
  const sanitized: HardConstraints = {};

  // 1. City validation
  if (constraints.city && VALID_CITIES.has(constraints.city)) {
    sanitized.city = constraints.city;
  }

  // 2. Property Type validation
  if (constraints.propertyType && VALID_TYPES.has(constraints.propertyType)) {
    sanitized.propertyType = constraints.propertyType;
  }

  // 3. Bedroom validation (must be sensible 1 - 20)
  if (constraints.bedrooms && typeof constraints.bedrooms.value === "number") {
    const val = Math.round(constraints.bedrooms.value);
    if (val >= 1 && val <= 20) {
      sanitized.bedrooms = {
        operator: constraints.bedrooms.operator || "eq",
        value: val,
      };
      if (constraints.bedrooms.maxValue && constraints.bedrooms.maxValue >= val) {
        sanitized.bedrooms.maxValue = Math.round(constraints.bedrooms.maxValue);
      }
    }
  }

  // 4. Bathroom validation (1 - 15)
  if (constraints.bathrooms && typeof constraints.bathrooms.value === "number") {
    const val = Math.round(constraints.bathrooms.value);
    if (val >= 1 && val <= 15) {
      sanitized.bathrooms = {
        operator: constraints.bathrooms.operator || "gte",
        value: val,
      };
    }
  }

  // 5. Price validation ($100 - $50,000,000)
  if (typeof constraints.maxPrice === "number" && !isNaN(constraints.maxPrice)) {
    const p = Math.round(constraints.maxPrice);
    if (p > 0 && p <= 50_000_000) {
      sanitized.maxPrice = p;
    }
  }

  if (typeof constraints.minPrice === "number" && !isNaN(constraints.minPrice)) {
    const p = Math.round(constraints.minPrice);
    if (p >= 0 && p <= 50_000_000) {
      sanitized.minPrice = p;
    }
  }

  // 6. Boolean flags
  if (typeof constraints.parking === "boolean") {
    sanitized.parking = constraints.parking;
  }

  if (typeof constraints.furnished === "boolean") {
    sanitized.furnished = constraints.furnished;
  }

  if (constraints.purpose === "SALE" || constraints.purpose === "RENT") {
    sanitized.purpose = constraints.purpose;
  }

  return sanitized;
}

/**
 * Classifies extracted entities into Hard Constraints vs Soft Preferences,
 * and constructs the canonical semantic query for vector retrieval.
 */
export function classifyConstraints(
  rawQuery: string,
  language: SupportedLanguage,
  intent: QueryIntent,
  entities: ExtractedEntities,
  confidence: number
): NormalizedQueryUnderstanding {
  const rawHard: HardConstraints = {};
  const softPreferences: string[] = [...entities.softPreferences];

  // A. HARD CONSTRAINTS
  if (entities.city) {
    rawHard.city = entities.city;
  }

  if (entities.propertyType) {
    rawHard.propertyType = entities.propertyType;
  }

  if (entities.bedrooms) {
    rawHard.bedrooms = entities.bedrooms;
  }

  if (entities.bathrooms) {
    rawHard.bathrooms = entities.bathrooms;
  }

  if (entities.parking) {
    rawHard.parking = true;
  }

  if (entities.isFurnished) {
    rawHard.furnished = true;
  }

  if (entities.purpose) {
    rawHard.purpose = entities.purpose;
  }

  // Financial constraint handling:
  // Strict operators (lte, gte, between) are Hard Constraints.
  // Approximate price expressions ("around $80k") are treated as soft preferences with relaxed bounds.
  if (entities.price) {
    if (entities.price.operator === "approx") {
      softPreferences.push(`budget around $${entities.price.approxPrice?.toLocaleString()}`);
      // Use relaxed window for hard filter
      if (entities.price.maxPrice) rawHard.maxPrice = entities.price.maxPrice;
      if (entities.price.minPrice) rawHard.minPrice = entities.price.minPrice;
    } else {
      if (entities.price.maxPrice) rawHard.maxPrice = entities.price.maxPrice;
      if (entities.price.minPrice) rawHard.minPrice = entities.price.minPrice;
    }
  }

  // Sanitize and validate
  const hardConstraints = validateHardConstraints(rawHard);

  // B. CONSTRUCT CANONICAL SEMANTIC QUERY
  // If soft preferences are present, they form the core of the semantic vector query.
  // We also incorporate the natural language intent context for rich cross-lingual matching.
  let semanticQuery = "";

  if (softPreferences.length > 0) {
    semanticQuery = softPreferences.join(", ");
    if (hardConstraints.propertyType) {
      semanticQuery = `${hardConstraints.propertyType.toLowerCase()} with ${semanticQuery}`;
    }
  } else {
    // If no soft preferences were extracted, use the raw query cleaned of structured noise
    semanticQuery = rawQuery
      .replace(/\b(\$\d+(?:,\d+)?k?|\d+\s*bedrooms?|\d+\s*qol|\d+\s*bathrooms?)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!semanticQuery || semanticQuery.length < 3) {
      semanticQuery = rawQuery;
    }
  }

  return {
    intent,
    language,
    rawQuery,
    hardConstraints,
    softPreferences,
    semanticQuery,
    confidence,
  };
}

/**
 * Conversational state merging:
 * Combines previous search session state with a new follow-up query.
 * e.g., "Find me a 3-bedroom house in Mogadishu" -> follow-up: "under $80k and near beach"
 */
export function mergeSearchStates(
  previous: NormalizedQueryUnderstanding | null,
  current: NormalizedQueryUnderstanding
): NormalizedQueryUnderstanding {
  if (!previous) return current;

  const mergedHard: HardConstraints = {
    ...previous.hardConstraints,
    ...current.hardConstraints,
  };

  // Merge soft preferences uniquely
  const mergedSoft = Array.from(
    new Set([...previous.softPreferences, ...current.softPreferences])
  );

  const mergedSemantic = mergedSoft.length > 0
    ? mergedSoft.join(", ")
    : current.semanticQuery || previous.semanticQuery;

  return {
    intent: current.intent !== "unsupported" ? current.intent : previous.intent,
    language: current.language !== "unknown" ? current.language : previous.language,
    rawQuery: `${previous.rawQuery} | ${current.rawQuery}`,
    hardConstraints: validateHardConstraints(mergedHard),
    softPreferences: mergedSoft,
    semanticQuery: mergedSemantic,
    confidence: Math.max(previous.confidence, current.confidence),
  };
}
