/**
 * ================================================================
 * MODULE     : Unified Multi-Tier Caching Engine
 * PLATFORM   : Kiro-Maal Luxury Real Estate
 * PURPOSE    : Provides Next.js App Router cache, in-memory DB cache,
 *              React request memoization, and tag-based invalidation.
 * ================================================================
 */

import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";
import { cache as reactCache } from "react";
import { prisma } from "@/lib/prisma";

// ── 1. In-Memory Database Cache (TTL + Tag Invalidation) ──────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: Set<string>;
  createdAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Periodic background cleanup every 60 seconds
    if (typeof setInterval !== "undefined") {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, 60 * 1000);
      if (this.cleanupTimer.unref) {
        this.cleanupTimer.unref();
      }
    }
  }

  /**
   * Retrieve cached item if present and unexpired.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value as T;
  }

  /**
   * Store item in cache with TTL and optional invalidation tags.
   */
  set<T>(key: string, value: T, ttlSeconds: number, tags: string[] = []): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + Math.max(1, ttlSeconds) * 1000,
      tags: new Set(tags),
      createdAt: Date.now(),
    });
  }

  /**
   * Get item from cache or compute and store it.
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
    tags: string[] = []
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    this.set(key, fresh, ttlSeconds, tags);
    return fresh;
  }

  /**
   * Invalidate a single key.
   */
  invalidateKey(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Invalidate all entries tagged with the given tag.
   */
  invalidateTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.has(tag)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Invalidate multiple tags.
   */
  invalidateTags(tags: string[]): number {
    let total = 0;
    for (const tag of tags) {
      total += this.invalidateTag(tag);
    }
    return total;
  }

  /**
   * Invalidate keys matching regular expression.
   */
  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (pattern.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Flush all cached items.
   */
  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Purge expired items to free memory.
   */
  cleanup(): number {
    const now = Date.now();
    let purged = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        purged++;
      }
    }
    return purged;
  }

  /**
   * Telemetry stats for observability.
   */
  getStats() {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? ((this.hits / totalRequests) * 100).toFixed(1) + "%" : "0%";
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate,
    };
  }
}

// Global singleton for database query caching across Node process
export const dbCache = new MemoryCache();

// ── 2. Next.js App Router Data Cache Wrapper ──────────────────────

export interface CachedDbQueryOptions {
  tags?: string[];
  revalidate?: number; // seconds
}

/**
 * Executes query with Next.js unstable_cache when in Next.js runtime,
 * falling back gracefully to MemoryCache in scripts/tests.
 */
export async function cachedDbQuery<T>(
  keyParts: string[],
  fetcher: () => Promise<T>,
  options: CachedDbQueryOptions = {}
): Promise<T> {
  const { tags = [], revalidate = 60 } = options;
  const cacheKey = keyParts.join(":");

  try {
    // Next.js App Router Data Cache
    if (typeof unstable_cache === "function") {
      const cachedFn = unstable_cache(
        async () => {
          // Double-check memory cache inside cachedFn
          return dbCache.getOrSet(cacheKey, revalidate, fetcher, tags);
        },
        keyParts,
        {
          tags,
          revalidate,
        }
      );
      return await cachedFn();
    }
  } catch {
    // If unstable_cache fails outside App Router context (e.g. CLI script), fall back to dbCache
  }

  return dbCache.getOrSet(cacheKey, revalidate, fetcher, tags);
}

// ── 3. React Request Memoization (Per-Request Deduplication) ──────

/**
 * Deduplicated per-request single property loader.
 * If generateMetadata and PropertyDetailPage both call this with the same ID,
 * only 1 database query is executed during that render cycle.
 */
export const memoizedGetPropertyById = reactCache(async (id: string) => {
  return prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
});

/**
 * Deduplicated metadata query for property titles/OG image.
 */
export const memoizedGetPropertyMetadata = reactCache(async (id: string) => {
  return prisma.property.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      city: true,
      price: true,
      type: true,
      status: true,
      images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
    },
  });
});

// ── 4. Unified Cache Invalidation ────────────────────────────────

/**
 * Invalidates both Next.js App Router cache tags and in-memory DB cache tags.
 */
export async function invalidateCacheTags(tags: string[]): Promise<void> {
  // 1. Invalidate Memory Cache
  dbCache.invalidateTags(tags);

  // 2. Invalidate Next.js Data Cache
  for (const tag of tags) {
    try {
      if (typeof revalidateTag === "function") {
        revalidateTag(tag);
      }
    } catch (err) {
      console.warn(`[Cache] Warning: revalidateTag failed for tag "${tag}":`, err);
    }
  }
}

/**
 * Invalidates Next.js cached route paths (ISR).
 */
export async function invalidateCachePaths(paths: string[]): Promise<void> {
  for (const path of paths) {
    try {
      if (typeof revalidatePath === "function") {
        revalidatePath(path);
      }
    } catch (err) {
      console.warn(`[Cache] Warning: revalidatePath failed for path "${path}":`, err);
    }
  }
}

/**
 * Convenience helper to invalidate all property caches when a property
 * is created, updated, approved, or deleted.
 */
export async function invalidatePropertyCache(propertyId?: string): Promise<void> {
  const tags = ["properties", "home", "featured", "stats"];
  const paths = ["/", "/properties"];

  if (propertyId) {
    tags.push(`property-${propertyId}`);
    paths.push(`/properties/${propertyId}`);
    dbCache.invalidateKey(`property:${propertyId}`);
  }

  await invalidateCacheTags(tags);
  await invalidateCachePaths(paths);
}
