/**
 * ================================================================
 * MULTI-TIER L1 / L2 DISTRIBUTED CACHING ENGINE
 * ================================================================
 * Designed for tiered concurrency from 100 to 100,000+ users:
 * - L1: Local In-Memory LRU Cache (~0.1ms access)
 * - L2: Cluster-Wide Distributed Cache / Redis Adapter (~2-5ms access)
 * - SWR: Stale-While-Revalidate background hydration (0ms latency for stale hits)
 * - Tag Invalidation: Granular invalidation by entity (e.g. "property:123", "city:Mogadishu")
 */

import { MemoryCache } from "@/lib/cache";

export interface CachePayload<T> {
  value: T;
  expiresAt: number;
  staleUntil: number;
  tags: string[];
}

export interface IDistributedCacheAdapter {
  get<T>(key: string): Promise<CachePayload<T> | null>;
  set<T>(key: string, payload: CachePayload<T>, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  deleteByTag(tag: string): Promise<number>;
}

/**
 * In-Memory Distributed Cluster Simulator Adapter.
 * Serves as reliable standalone L2 layer in development and containerized single/dual instances.
 * In full production, swap with Upstash/Redis connection string.
 */
export class InMemoryClusterCacheAdapter implements IDistributedCacheAdapter {
  private store = new Map<string, CachePayload<any>>();
  private tagIndex = new Map<string, Set<string>>();

  async get<T>(key: string): Promise<CachePayload<T> | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.staleUntil) {
      this.store.delete(key);
      return null;
    }
    return entry as CachePayload<T>;
  }

  async set<T>(key: string, payload: CachePayload<T>, ttlSeconds: number): Promise<void> {
    this.store.set(key, payload);
    for (const tag of payload.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async deleteByTag(tag: string): Promise<number> {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    this.tagIndex.delete(tag);
    return count;
  }
}

/**
 * Multi-Tier Cache Coordinator (L1 In-Memory + L2 Distributed).
 */
export class MultiTierCache {
  private l1: MemoryCache;
  private l2: IDistributedCacheAdapter;
  private l1Hits = 0;
  private l2Hits = 0;
  private misses = 0;

  constructor(l1Capacity = 1000, l2Adapter?: IDistributedCacheAdapter) {
    this.l1 = new MemoryCache(l1Capacity);
    this.l2 = l2Adapter || new InMemoryClusterCacheAdapter();
  }

  /**
   * Retrieves item following L1 -> L2 resolution hierarchy.
   */
  async get<T>(key: string): Promise<T | null> {
    // 1. Check L1 In-Memory (~0.1ms)
    const l1Value = this.l1.get<T>(key);
    if (l1Value !== null) {
      this.l1Hits++;
      return l1Value;
    }

    // 2. Check L2 Distributed (~2-5ms)
    const l2Entry = await this.l2.get<T>(key);
    if (l2Entry) {
      this.l2Hits++;
      // Warm L1 for subsequent requests
      const remainingSeconds = Math.max(1, Math.round((l2Entry.expiresAt - Date.now()) / 1000));
      this.l1.set(key, l2Entry.value, remainingSeconds, l2Entry.tags);
      return l2Entry.value;
    }

    this.misses++;
    return null;
  }

  /**
   * Sets item in both L1 and L2 layers with TTL and tags.
   */
  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number,
    tags: string[] = [],
    staleGraceSeconds = 120
  ): Promise<void> {
    const now = Date.now();
    const payload: CachePayload<T> = {
      value,
      expiresAt: now + ttlSeconds * 1000,
      staleUntil: now + (ttlSeconds + staleGraceSeconds) * 1000,
      tags,
    };

    // Parallel write to L1 and L2
    this.l1.set(key, value, ttlSeconds, tags);
    await this.l2.set(key, payload, ttlSeconds + staleGraceSeconds);
  }

  /**
   * Stale-While-Revalidate execution helper.
   * If fresh: returns immediately.
   * If stale (within grace window): returns stale immediately and updates cache in background.
   * If missed: awaits origin fetch.
   */
  async swr<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number,
    tags: string[] = [],
    staleGraceSeconds = 120
  ): Promise<T> {
    const l2Entry = await this.l2.get<T>(key);
    const now = Date.now();

    if (l2Entry) {
      // Fresh hit: return immediately
      if (now < l2Entry.expiresAt) {
        this.l1.set(key, l2Entry.value, Math.round((l2Entry.expiresAt - now) / 1000), tags);
        return l2Entry.value;
      }

      // Stale hit: background revalidation
      this.triggerBackgroundRevalidate(key, fetcher, ttlSeconds, tags, staleGraceSeconds);
      return l2Entry.value;
    }

    // Miss: Fetch origin
    const freshValue = await fetcher();
    await this.set(key, freshValue, ttlSeconds, tags, staleGraceSeconds);
    return freshValue;
  }

  private triggerBackgroundRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number,
    tags: string[],
    staleGraceSeconds: number
  ) {
    // Non-blocking async update
    Promise.resolve().then(async () => {
      try {
        const fresh = await fetcher();
        await this.set(key, fresh, ttlSeconds, tags, staleGraceSeconds);
      } catch (err) {
        console.warn(`[MultiTierCache] Background SWR revalidation failed for ${key}:`, err);
      }
    });
  }

  async invalidateTag(tag: string): Promise<void> {
    this.l1.invalidateTag(tag);
    await this.l2.deleteByTag(tag);
  }

  getStats() {
    const total = this.l1Hits + this.l2Hits + this.misses;
    const hitRate = total > 0 ? ((this.l1Hits + this.l2Hits) / total) * 100 : 0;
    return {
      l1Hits: this.l1Hits,
      l2Hits: this.l2Hits,
      misses: this.misses,
      hitRate: `${hitRate.toFixed(1)}%`,
    };
  }
}

/** Global singleton multi-tier cache instance */
export const distributedCache = new MultiTierCache(1500);

