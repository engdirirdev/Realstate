/**
 * Canonical Multilingual Hybrid Search Service
 *
 * Implements end-to-end NLU understanding + Structured Filtering + Vector Retrieval + RRF:
 * 1. Multilingual NLU intent classification & entity extraction (Somali, Arabic, English, Mixed)
 * 2. Separation of strict Hard Constraints from descriptive Soft Preferences
 * 3. Structured database filtering with Phase 1 status enforcement (status = 'APPROVED')
 * 4. Single-pass multilingual query vectorization using Phase 2A 768-d embedding infrastructure
 * 5. Reciprocal Rank Fusion (RRF k=60) combining structured match and vector similarity
 * 6. Zero-result detection with controlled, explicitly labeled alternative relaxation
 * 7. Comprehensive observability & latency metrics
 */

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { parseNaturalLanguageQuery } from "../nlu";
import { NormalizedQueryUnderstanding, HardConstraints } from "../nlu/constraint-classifier";
import { QueryIntent } from "../nlu/intent-classifier";
import { SupportedLanguage } from "../language/detector";
import { generateEmbedding } from "../embeddings/embedding-service";
import { cosineSimilarity } from "../embeddings/vector-math";
import {
  fuseAndRankCandidates,
  CandidateProperty,
  RankedSearchResult,
} from "./rrf-ranker";
import {
  findControlledAlternatives,
  AlternativeResultItem,
} from "./relaxation-engine";

export interface HybridSearchParams {
  query: string;
  limit?: number;
  threshold?: number;
  sessionState?: NormalizedQueryUnderstanding | null;
  authContext?: {
    role: Role | "PUBLIC";
    userId?: string | null;
  };
}

export interface HybridSearchResponse {
  query: string;
  intent: QueryIntent;
  language: SupportedLanguage;
  parsedQuery: {
    hardConstraints: HardConstraints;
    softPreferences: string[];
    semanticQuery: string;
  };
  totalExactMatches: number;
  results: RankedSearchResult[];
  alternatives: AlternativeResultItem[];
  hasRelaxedAlternatives: boolean;
  relaxationSummary?: string;
  metadata: {
    retrievalStrategy: "hybrid_rrf" | "intent_shortcircuit";
    structuredCandidateCount: number;
    semanticCandidateCount: number;
    fusedCount: number;
    latencyMs: number;
    model: string;
    provider: string;
  };
}

/**
 * Transforms a Prisma property with images to CandidateProperty format.
 */
function toCandidateProperty(prop: any, similarity?: number): CandidateProperty {
  return {
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
    description: prop.description,
    imageUrl: prop.images && prop.images[0] ? prop.images[0].url : null,
    similarity,
  };
}

/**
 * Executes Canonical Hybrid Search.
 */
export async function executeHybridSearch(
  params: HybridSearchParams
): Promise<HybridSearchResponse> {
  const startTime = Date.now();
  const rawQuery = params.query?.trim() || "";
  const limit = Math.min(50, Math.max(1, params.limit || 10));
  const threshold = params.threshold !== undefined ? params.threshold : 0.15;
  const role = params.authContext?.role || "PUBLIC";
  const userId = params.authContext?.userId;

  // 1. Natural Language Understanding & Constraint Separation
  const understanding = parseNaturalLanguageQuery(rawQuery, params.sessionState);

  // Short-circuit non-searchable queries (e.g. general questions or greetings)
  if (
    understanding.intent !== "property_search" &&
    understanding.intent !== "property_recommendation"
  ) {
    const latencyMs = Date.now() - startTime;
    return {
      query: rawQuery,
      intent: understanding.intent,
      language: understanding.language,
      parsedQuery: {
        hardConstraints: understanding.hardConstraints,
        softPreferences: understanding.softPreferences,
        semanticQuery: understanding.semanticQuery,
      },
      totalExactMatches: 0,
      results: [],
      alternatives: [],
      hasRelaxedAlternatives: false,
      metadata: {
        retrievalStrategy: "intent_shortcircuit",
        structuredCandidateCount: 0,
        semanticCandidateCount: 0,
        fusedCount: 0,
        latencyMs,
        model: "none",
        provider: "deterministic",
      },
    };
  }

  // 2. Strict Database Authorization & Property Status Filter
  const baseWhere: any = {};
  if (role === "ADMIN") {
    baseWhere.status = "APPROVED";
  } else if (role === "USER" && userId) {
    baseWhere.status = "APPROVED";
  } else {
    baseWhere.status = "APPROVED";
  }

  // 3. Build Structured SQL Where Clause from Hard Constraints
  const structuredWhere: any = { ...baseWhere };
  const h = understanding.hardConstraints;

  if (h.city) structuredWhere.city = { contains: h.city };
  if (h.propertyType) {
    if (h.propertyType === "HOUSE") {
      structuredWhere.type = { in: ["HOUSE", "TOWNHOUSE"] };
    } else {
      structuredWhere.type = h.propertyType;
    }
  }
  if (h.parking === true) structuredWhere.parking = { gt: 0 };
  if (h.furnished === true) structuredWhere.isFurnished = true;

  // Bedroom filtering
  if (h.bedrooms) {
    if (h.bedrooms.operator === "eq") {
      structuredWhere.bedrooms = h.bedrooms.value;
    } else if (h.bedrooms.operator === "gte") {
      structuredWhere.bedrooms = { gte: h.bedrooms.value };
    } else if (h.bedrooms.operator === "lte") {
      structuredWhere.bedrooms = { lte: h.bedrooms.value };
    } else if (h.bedrooms.operator === "between" && h.bedrooms.maxValue) {
      structuredWhere.bedrooms = {
        gte: h.bedrooms.value,
        lte: h.bedrooms.maxValue,
      };
    }
  }

  // Bathroom filtering
  if (h.bathrooms) {
    if (h.bathrooms.operator === "gte") {
      structuredWhere.bathrooms = { gte: h.bathrooms.value };
    } else if (h.bathrooms.operator === "eq") {
      structuredWhere.bathrooms = h.bathrooms.value;
    }
  }

  // Price filtering
  if (h.maxPrice !== undefined || h.minPrice !== undefined) {
    structuredWhere.price = {};
    if (h.minPrice !== undefined) structuredWhere.price.gte = h.minPrice;
    if (h.maxPrice !== undefined) structuredWhere.price.lte = h.maxPrice;
  }

  // Execute Structured Query
  const structuredRaw = await prisma.property.findMany({
    where: structuredWhere,
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      embedding: true,
    },
    take: 50,
  });

  const structuredCandidates: CandidateProperty[] = structuredRaw.map((p) =>
    toCandidateProperty(p)
  );

  // 4. Dense Multilingual Semantic Vector Retrieval
  // Generate ONE query embedding on the semantic descriptive query
  const queryToEmbed = understanding.semanticQuery || rawQuery;
  const { embedding: queryVector, model, provider } = await generateEmbedding(
    queryToEmbed,
    "query"
  );

  // Fetch approved properties for vector scoring
  // If structured candidates are found, we evaluate those first plus a broader pool
  const vectorCandidatePool = await prisma.property.findMany({
    where: baseWhere,
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      embedding: true,
    },
    take: 100,
  });

  const semanticCandidates: CandidateProperty[] = [];
  for (const prop of vectorCandidatePool) {
    if (!prop.embedding || !prop.embedding.embedding) continue;
    if (prop.embedding.dimension && prop.embedding.dimension !== queryVector.length) continue;
    try {
      const propVec: number[] = JSON.parse(prop.embedding.embedding);
      if (!Array.isArray(propVec) || propVec.length !== queryVector.length) continue;
      const sim = cosineSimilarity(queryVector, propVec);
      if (sim >= threshold) {
        semanticCandidates.push(toCandidateProperty(prop, sim));
      }
    } catch (e) {
      console.warn(`[HybridSearch] Embedding parse error for prop ${prop.id}:`, e);
    }
  }

  // Sort semantic candidates by similarity descending
  semanticCandidates.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

  // 5. Reciprocal Rank Fusion (RRF) & Intelligent Ranking
  const fusedResults = fuseAndRankCandidates(
    structuredCandidates,
    semanticCandidates,
    understanding.hardConstraints,
    understanding.softPreferences,
    { k: 60, weightStructured: 1.0, weightSemantic: 1.0 }
  );

  // Separate Exact Matches (strictly satisfying all hard constraints)
  const exactMatches = fusedResults.filter((item) => item.satisfiesAllHardConstraints);

  // 6. Zero-Result Handling & Controlled Relaxation
  let alternatives: AlternativeResultItem[] = [];
  let hasRelaxedAlternatives = false;
  let relaxationSummary: string | undefined;

  if (exactMatches.length === 0) {
    const relaxationResult = await findControlledAlternatives(
      understanding.hardConstraints,
      limit
    );
    if (relaxationResult.hasAlternatives) {
      alternatives = relaxationResult.alternatives;
      hasRelaxedAlternatives = true;
      relaxationSummary = relaxationResult.relaxationSummary;
    }
  }

  const finalTopResults = exactMatches.slice(0, limit);
  const latencyMs = Date.now() - startTime;

  // Log non-sensitive observability
  console.log(
    `[HybridSearch] Lang: ${understanding.language}, Intent: ${understanding.intent}, HardConstraints: ${Object.keys(understanding.hardConstraints).join(",")}, StructuredCount: ${structuredCandidates.length}, SemanticCount: ${semanticCandidates.length}, ExactMatches: ${exactMatches.length}, Latency: ${latencyMs}ms`
  );

  return {
    query: rawQuery,
    intent: understanding.intent,
    language: understanding.language,
    parsedQuery: {
      hardConstraints: understanding.hardConstraints,
      softPreferences: understanding.softPreferences,
      semanticQuery: understanding.semanticQuery,
    },
    totalExactMatches: exactMatches.length,
    results: finalTopResults,
    alternatives,
    hasRelaxedAlternatives,
    relaxationSummary,
    metadata: {
      retrievalStrategy: "hybrid_rrf",
      structuredCandidateCount: structuredCandidates.length,
      semanticCandidateCount: semanticCandidates.length,
      fusedCount: fusedResults.length,
      latencyMs,
      model,
      provider,
    },
  };
}
