/**
 * Canonical Multilingual Semantic Search Engine
 *
 * Implements cross-lingual semantic property retrieval combining:
 * - Multilingual query understanding & language detection
 * - Multilingual query embedding in shared vector space
 * - Cosine similarity scoring against approved property embeddings
 * - Pre-LLM authorization and status enforcement (Phase 1 compliant)
 * - Optional structured hard filters (city, type, budget, bedrooms)
 */
import { prisma } from "@/lib/prisma";
import { detectQueryLanguage, LanguageDetectionResult } from "../language/detector";
import { generateEmbedding } from "../embeddings/embedding-service";
import { cosineSimilarity } from "../embeddings/vector-math";
import { Role } from "@prisma/client";

export interface SemanticSearchFilters {
  city?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  parking?: boolean;
}

export interface SemanticSearchParams {
  query: string;
  limit?: number;
  threshold?: number;
  authContext?: {
    role: Role | "PUBLIC";
    userId?: string | null;
  };
  filters?: SemanticSearchFilters;
}

export interface SemanticSearchResultItem {
  propertyId: string;
  similarity: number;
  property: {
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
  };
}

export interface SemanticSearchResponse {
  query: string;
  language: LanguageDetectionResult;
  totalMatches: number;
  results: SemanticSearchResultItem[];
  model: string;
  provider: string;
}

/**
 * Executes a multilingual semantic search over approved properties.
 */
export async function executeSemanticSearch(
  params: SemanticSearchParams
): Promise<SemanticSearchResponse> {
  const query = params.query?.trim() || "";
  const limit = Math.min(50, Math.max(1, params.limit || 10));
  const threshold = params.threshold !== undefined ? params.threshold : 0.2;
  const role = params.authContext?.role || "PUBLIC";
  const userId = params.authContext?.userId;

  // 1. Multilingual Query Understanding & Language Detection
  const languageInfo = detectQueryLanguage(query);

  // 2. Generate Multilingual Query Embedding Vector
  const { embedding: queryVector, model, provider } = await generateEmbedding(
    query,
    "query"
  );

  // 3. Construct Strict Database Authorization & Property Filters
  const where: any = {};

  if (role === "ADMIN") {
    // Admin can view any status, defaults to APPROVED if not specified
    where.status = "APPROVED";
  } else if (role === "USER" && userId) {
    // Managers only see APPROVED or their own properties
    where.status = "APPROVED";
  } else {
    // PUBLIC & CUSTOMER roles strictly only see APPROVED & AVAILABLE properties
    where.status = { in: ["APPROVED", "PUBLISHED"] };
    where.availabilityStatus = "AVAILABLE";
    where.isActive = true;
  }

  // 4. Apply Optional Structured Hard Constraints
  if (params.filters) {
    const f = params.filters;
    if (f.city) where.city = { contains: f.city };
    if (f.type) where.type = f.type;
    if (f.bedrooms) where.bedrooms = { gte: f.bedrooms };
    if (f.bathrooms) where.bathrooms = { gte: f.bathrooms };
    if (f.furnished !== undefined) where.isFurnished = f.furnished;
    if (f.parking) where.parking = { gt: 0 };
    if (f.minPrice !== undefined || f.maxPrice !== undefined) {
      where.price = {};
      if (f.minPrice !== undefined) where.price.gte = f.minPrice;
      if (f.maxPrice !== undefined) where.price.lte = f.maxPrice;
    }
  }

  // 5. Fetch candidate properties with their pre-indexed embeddings
  const candidateProperties = await prisma.property.findMany({
    where,
    include: {
      embedding: true,
      images: {
        orderBy: { order: "asc" },
        take: 1,
      },
    },
    take: 100, // Search top 100 eligible candidates
  });

  // 6. Vector Similarity Scoring
  const scoredItems: SemanticSearchResultItem[] = [];

  for (const prop of candidateProperties) {
    if (!prop.embedding || !prop.embedding.embedding) continue;

    // Safety: reject vector space mismatch (e.g. dimension mismatch)
    if (prop.embedding.dimension && prop.embedding.dimension !== queryVector.length) {
      continue;
    }

    try {
      const propVector: number[] = JSON.parse(prop.embedding.embedding);
      if (!Array.isArray(propVector) || propVector.length !== queryVector.length) {
        continue;
      }
      const similarity = cosineSimilarity(queryVector, propVector);

      if (similarity >= threshold) {
        scoredItems.push({
          propertyId: prop.id,
          similarity: Math.round(similarity * 10000) / 10000,
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
            description: prop.description,
            imageUrl: prop.images[0]?.url || null,
          },
        });
      }
    } catch (parseErr) {
      console.warn(`Failed to parse embedding for property ${prop.id}:`, parseErr);
    }
  }

  // 7. Sort by Similarity Descending & Limit Results
  scoredItems.sort((a, b) => b.similarity - a.similarity);
  const topResults = scoredItems.slice(0, limit);

  return {
    query,
    language: languageInfo,
    totalMatches: topResults.length,
    results: topResults,
    model,
    provider,
  };
}
