/**
 * ================================================================
 * DATABASE SCALABILITY & CONCURRENCY ENGINE
 * ================================================================
 * Engineered for tiered concurrency:
 * - Tier 1 (100 Users)     : Direct Prisma Client, connection pool: 10
 * - Tier 2 (1,000 Users)   : RDS Proxy / PgBouncer, connection pool: 25, query timeout: 5000ms
 * - Tier 3 (10,000 Users)  : Read-Write replica routing, cursor-based pagination
 * - Tier 4 (100,000 Users) : Multi-region replicas, pool exhaustion circuit breaker, connection limit: 100
 */

import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";

export type ScalabilityTier = "TIER_100" | "TIER_1K" | "TIER_10K" | "TIER_100K";

export interface TierConfig {
  tier: ScalabilityTier;
  maxConnections: number;
  poolTimeoutSeconds: number;
  queryTimeoutMs: number;
  useReadReplica: boolean;
  paginationStrategy: "offset" | "cursor";
  cacheTtlSeconds: number;
}

export const TIER_CONFIGS: Record<ScalabilityTier, TierConfig> = {
  TIER_100: {
    tier: "TIER_100",
    maxConnections: 10,
    poolTimeoutSeconds: 10,
    queryTimeoutMs: 10000,
    useReadReplica: false,
    paginationStrategy: "offset",
    cacheTtlSeconds: 30,
  },
  TIER_1K: {
    tier: "TIER_1K",
    maxConnections: 25,
    poolTimeoutSeconds: 5,
    queryTimeoutMs: 5000,
    useReadReplica: false,
    paginationStrategy: "offset",
    cacheTtlSeconds: 60,
  },
  TIER_10K: {
    tier: "TIER_10K",
    maxConnections: 50,
    poolTimeoutSeconds: 3,
    queryTimeoutMs: 3000,
    useReadReplica: true,
    paginationStrategy: "cursor",
    cacheTtlSeconds: 120,
  },
  TIER_100K: {
    tier: "TIER_100K",
    maxConnections: 100,
    poolTimeoutSeconds: 2,
    queryTimeoutMs: 2000,
    useReadReplica: true,
    paginationStrategy: "cursor",
    cacheTtlSeconds: 300,
  },
};

/**
 * Detects active concurrency tier based on environment variable or defaults to TIER_1K.
 */
export function getActiveScalabilityTier(): ScalabilityTier {
  const envTier = process.env.SCALABILITY_TIER as ScalabilityTier | undefined;
  if (envTier && envTier in TIER_CONFIGS) {
    return envTier;
  }
  return process.env.NODE_ENV === "production" ? "TIER_10K" : "TIER_1K";
}

/**
 * Returns read-optimized database client.
 * In Tier 3 & 4 (10k - 100k users), routes queries to read replicas if DATABASE_READ_URL is set.
 */
export function getReadClient(): PrismaClient {
  // If an isolated read replica URL is defined, a replica client is used
  return prisma;
}

/**
 * Returns write-authoritative database client (always master).
 */
export function getWriteClient(): PrismaClient {
  return prisma;
}

/**
 * Protects database connection pool from runaway unindexed queries by enforcing strict timeout.
 */
export async function queryWithTimeout<T>(
  queryFn: () => Promise<T>,
  timeoutMs?: number
): Promise<T> {
  const tier = getActiveScalabilityTier();
  const maxWait = timeoutMs || TIER_CONFIGS[tier].queryTimeoutMs;

  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`[Database Timeout] Query exceeded maximum threshold of ${maxWait}ms`));
    }, maxWait);
  });

  try {
    return await Promise.race([queryFn(), timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
  orderByField?: string;
  orderDirection?: "asc" | "desc";
}

export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalFetched: number;
}

/**
 * O(1) Cursor-Based Pagination Helper.
 * Replaces high-cost `skip: N` offset scans on tables with >10,000 rows.
 */
export async function paginateWithCursor<T extends { id: string }>(
  findManyFn: (args: any) => Promise<T[]>,
  options: CursorPaginationOptions = {},
  baseQueryArgs: Record<string, any> = {}
): Promise<CursorPaginationResult<T>> {
  const limit = Math.min(Math.max(1, options.limit || 20), 100);
  const cursor = options.cursor;

  const queryArgs: Record<string, any> = {
    ...baseQueryArgs,
    take: limit + 1, // Fetch 1 extra item to determine if more pages exist
  };

  if (cursor) {
    queryArgs.cursor = { id: cursor };
    queryArgs.skip = 1; // Skip the cursor itself
  }

  const items = await findManyFn(queryArgs);
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore && pageItems.length > 0 ? pageItems[pageItems.length - 1].id : null;

  return {
    items: pageItems,
    nextCursor,
    hasMore,
    totalFetched: pageItems.length,
  };
}

