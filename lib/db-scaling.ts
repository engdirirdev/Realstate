/**
 * Database Scalability & Concurrency Optimization Engine.
 *
 * Implements architectural patterns for 100 to 100,000+ users:
 * 1. Connection Pool Optimization (connection_limit & pool_timeout configuration)
 * 2. Read/Write Splitting (Primary for mutations/transactions, Replicas for search/catalog)
 * 3. High-Performance Cursor-Based Pagination (replaces slow OFFSET scans)
 * 4. Safe Batch Chunking for large datasets without memory exhaustion
 */

import { PrismaClient } from "@prisma/client";
import { prisma as primaryPrisma } from "@/lib/prisma";

export interface PoolConfig {
  connectionLimit?: number;
  poolTimeoutSeconds?: number;
  connectTimeoutSeconds?: number;
}

/**
 * Scale Tier Sizing Guide:
 * - 100 users     : 5-10 pool connections (single Node instance)
 * - 1,000 users   : 15-25 pool connections (optimized queries + caching)
 * - 10,000 users  : 30-50 pool connections + Read Replica (RDS / PlanetScale)
 * - 100,000 users : Connection Pooler (RDS Proxy / PgBouncer) + Read Replicas
 */
export function buildScalableDbUrl(rawUrl: string, config: PoolConfig = {}): string {
  if (!rawUrl) return rawUrl;

  try {
    const url = new URL(rawUrl);
    if (config.connectionLimit) {
      url.searchParams.set("connection_limit", String(config.connectionLimit));
    }
    if (config.poolTimeoutSeconds) {
      url.searchParams.set("pool_timeout", String(config.poolTimeoutSeconds));
    }
    if (config.connectTimeoutSeconds) {
      url.searchParams.set("connect_timeout", String(config.connectTimeoutSeconds));
    }
    return url.toString();
  } catch {
    // If not standard URL format (e.g. SQLite or mock), return as is
    return rawUrl;
  }
}

// ── 2. Read / Write Splitting Architecture ─────────────────────────

let readReplicaPrisma: PrismaClient | null = null;

/**
 * Returns read-optimized Prisma client.
 * If DATABASE_READ_REPLICA_URL is configured, routes queries to replica pool.
 * Otherwise, falls back to the primary client.
 */
export function getReadPrisma(): PrismaClient {
  const replicaUrl = process.env.DATABASE_READ_REPLICA_URL;
  if (!replicaUrl) {
    return primaryPrisma;
  }

  if (!readReplicaPrisma) {
    readReplicaPrisma = new PrismaClient({
      datasources: {
        db: {
          url: buildScalableDbUrl(replicaUrl, {
            connectionLimit: parseInt(process.env.DB_READ_POOL_LIMIT || "30", 10),
            poolTimeoutSeconds: 10,
          }),
        },
      },
      log: process.env.PRISMA_LOG_QUERIES === "true" ? ["query", "error"] : ["error"],
    });
  }

  return readReplicaPrisma;
}

/**
 * Returns write-optimized primary Prisma client (for transactions, mutations).
 */
export function getWritePrisma(): PrismaClient {
  return primaryPrisma;
}

// ── 3. High-Performance Cursor-Based Pagination ───────────────────

export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  maxLimit?: number;
}

export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  count: number;
}

/**
 * High-performance cursor pagination helper.
 * Eliminates O(N) database table scans caused by standard OFFSET queries at scale.
 */
export async function paginateCursor<T extends { id: string }>(
  fetcher: (args: { take: number; skip?: number; cursor?: { id: string } }) => Promise<T[]>,
  params: CursorPaginationParams = {}
): Promise<CursorPaginationResult<T>> {
  const maxLimit = params.maxLimit || 100;
  const limit = Math.min(Math.max(1, params.limit || 20), maxLimit);

  // Fetch 1 extra item to detect if there's a next page
  const queryArgs: { take: number; skip?: number; cursor?: { id: string } } = {
    take: limit + 1,
  };

  if (params.cursor) {
    queryArgs.cursor = { id: params.cursor };
    queryArgs.skip = 1; // Skip the cursor itself
  }

  const results = await fetcher(queryArgs);
  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

  return {
    items,
    nextCursor,
    hasMore,
    count: items.length,
  };
}

// ── 4. Safe Batch Chunking for Large Datasets ───────────────────────

/**
 * Safely processes large arrays in bounded chunks to prevent Node.js heap
 * exhaustion and database connection starvation.
 */
export async function chunkBatch<T, R>(
  items: T[],
  chunkSize = 250,
  worker: (chunk: T[], chunkIndex: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkIndex = Math.floor(i / chunkSize);
    const result = await worker(chunk, chunkIndex);
    results.push(result);
  }

  return results;
}
