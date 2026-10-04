/**
 * Property Semantic Indexing Lifecycle Service
 *
 * Handles:
 * - Single property indexing & update detection via SHA-256 hash comparison
 * - Batch indexing of all approved properties
 * - De-indexing of rejected, pending, draft, or deleted properties
 * - Real-time indexing status diagnostics
 */
import { prisma } from "@/lib/prisma";
import { buildPropertyCanonicalDocument } from "../embeddings/document-builder";
import { generateEmbedding, EMBEDDING_CONFIG } from "../embeddings/embedding-service";

export interface IndexingResult {
  propertyId: string;
  action: "indexed" | "updated" | "skipped" | "deindexed";
  reason?: string;
  sourceHash?: string;
}

export interface BatchIndexSummary {
  totalApproved: number;
  indexed: number;
  updated: number;
  skipped: number;
  errors: { propertyId: string; error: string }[];
}

export interface IndexDiagnostics {
  totalApprovedProperties: number;
  totalIndexedProperties: number;
  missingEmbeddings: number;
  staleEmbeddings: number;
  model: string;
  dimension: number;
  isFullyIndexed: boolean;
}

/**
 * Indexes or updates a single property.
 * If the property is not APPROVED, it is automatically de-indexed from the search index.
 */
export async function indexProperty(propertyId: string): Promise<IndexingResult> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    // Property deleted; remove any dangling embedding
    await deindexProperty(propertyId);
    return { propertyId, action: "deindexed", reason: "Property does not exist" };
  }

  // Strictly enforce visibility: ONLY APPROVED properties are indexed
  if (property.status !== "APPROVED") {
    await deindexProperty(propertyId);
    return {
      propertyId,
      action: "deindexed",
      reason: `Property status is ${property.status}; only APPROVED properties may be indexed`,
    };
  }

  // Build canonical document & hash
  const { canonicalText, sourceHash } = buildPropertyCanonicalDocument(property);

  // Check if existing embedding is already up-to-date
  const existing = await prisma.propertyEmbedding.findUnique({
    where: { propertyId },
  });

  if (existing && existing.sourceHash === sourceHash && existing.model === EMBEDDING_CONFIG.MODEL_NAME) {
    return { propertyId, action: "skipped", reason: "Embedding is current; hash matched" };
  }

  // Generate vector
  const { embedding, model, dimension } = await generateEmbedding(canonicalText, "document");

  // Upsert embedding record in MySQL
  await prisma.propertyEmbedding.upsert({
    where: { propertyId },
    create: {
      propertyId,
      embedding: JSON.stringify(embedding),
      model,
      version: EMBEDDING_CONFIG.VERSION,
      dimension,
      sourceHash,
      sourceText: canonicalText,
    },
    update: {
      embedding: JSON.stringify(embedding),
      model,
      version: EMBEDDING_CONFIG.VERSION,
      dimension,
      sourceHash,
      sourceText: canonicalText,
    },
  });

  return {
    propertyId,
    action: existing ? "updated" : "indexed",
    sourceHash,
  };
}

/**
 * De-indexes a property, completely removing it from semantic search.
 */
export async function deindexProperty(propertyId: string): Promise<boolean> {
  try {
    await prisma.propertyEmbedding.deleteMany({
      where: { propertyId },
    });
    return true;
  } catch (err) {
    console.error(`Failed to de-index property ${propertyId}:`, err);
    return false;
  }
}

/**
 * Indexes all approved properties that are missing embeddings or have changed.
 */
export async function indexAllApprovedProperties(options: { forceReindex?: boolean } = {}): Promise<BatchIndexSummary> {
  const approvedProperties = await prisma.property.findMany({
    where: { status: "APPROVED" },
  });

  const summary: BatchIndexSummary = {
    totalApproved: approvedProperties.length,
    indexed: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const property of approvedProperties) {
    try {
      const { canonicalText, sourceHash } = buildPropertyCanonicalDocument(property);

      if (!options.forceReindex) {
        const existing = await prisma.propertyEmbedding.findUnique({
          where: { propertyId: property.id },
        });

        if (existing && existing.sourceHash === sourceHash && existing.model === EMBEDDING_CONFIG.MODEL_NAME) {
          summary.skipped++;
          continue;
        }
      }

      const { embedding, model, dimension } = await generateEmbedding(canonicalText, "document");

      const existingRecord = await prisma.propertyEmbedding.findUnique({
        where: { propertyId: property.id },
      });

      await prisma.propertyEmbedding.upsert({
        where: { propertyId: property.id },
        create: {
          propertyId: property.id,
          embedding: JSON.stringify(embedding),
          model,
          version: EMBEDDING_CONFIG.VERSION,
          dimension,
          sourceHash,
          sourceText: canonicalText,
        },
        update: {
          embedding: JSON.stringify(embedding),
          model,
          version: EMBEDDING_CONFIG.VERSION,
          dimension,
          sourceHash,
          sourceText: canonicalText,
        },
      });

      if (existingRecord) {
        summary.updated++;
      } else {
        summary.indexed++;
      }
    } catch (err: any) {
      summary.errors.push({
        propertyId: property.id,
        error: err.message || "Failed to embed property",
      });
    }
  }

  return summary;
}

/**
 * Retrieves diagnostics for embedding coverage and index health.
 */
export async function getIndexDiagnostics(): Promise<IndexDiagnostics> {
  const totalApproved = await prisma.property.count({
    where: { status: "APPROVED" },
  });

  const indexedEmbeddings = await prisma.propertyEmbedding.findMany({
    include: { property: { select: { id: true, status: true } } },
  });

  // Filter to only embeddings whose corresponding property is approved
  const validIndexedCount = indexedEmbeddings.filter(
    (e) => e.property && e.property.status === "APPROVED"
  ).length;

  const missing = Math.max(0, totalApproved - validIndexedCount);

  return {
    totalApprovedProperties: totalApproved,
    totalIndexedProperties: validIndexedCount,
    missingEmbeddings: missing,
    staleEmbeddings: 0,
    model: EMBEDDING_CONFIG.MODEL_NAME,
    dimension: EMBEDDING_CONFIG.DIMENSIONS,
    isFullyIndexed: missing === 0,
  };
}
