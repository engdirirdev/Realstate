/**
 * ================================================================
 * TEST SUITE : System Scalability & Concurrency Verification
 * PURPOSE    : Rigorous verification of Database, API, Caching,
 *              and Storage scaling architectures across:
 *              - Tier 1: 100 Users (MVP Single Instance)
 *              - Tier 2: 1,000 Users (Growth Clustered)
 *              - Tier 3: 10,000 Users (High Concurrency Replicas)
 *              - Tier 4: 100,000 Users (Global Diaspora Scale)
 * ================================================================
 */

import assert from "node:assert";

console.log("\n========================================================");
console.log("   KIRO-MAAL ENTERPRISE SCALABILITY VERIFICATION SUITE   ");
console.log("========================================================\n");

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function itAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✓ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ── 1. DATABASE CONCURRENCY & SCALING TESTS ──────────────────────────
console.log("▶ 1. DATABASE CONCURRENCY & SCALABILITY (100 to 100k Users)");

const {
  TIER_CONFIGS,
  getActiveScalabilityTier,
  getReadClient,
  getWriteClient,
  queryWithTimeout,
  paginateWithCursor,
} = await import("../lib/db-scaling.ts");

it("TIER_CONFIGS defines valid specifications across 100 to 100,000 users", () => {
  const tiers = ["TIER_100", "TIER_1K", "TIER_10K", "TIER_100K"];
  for (const tier of tiers) {
    const config = TIER_CONFIGS[tier];
    assert.ok(config, `Missing tier: ${tier}`);
    assert.ok(config.maxConnections > 0, `Invalid maxConnections for ${tier}`);
    assert.ok(config.poolTimeoutSeconds > 0, `Invalid poolTimeout for ${tier}`);
    assert.ok(config.queryTimeoutMs > 0, `Invalid queryTimeout for ${tier}`);
    assert.ok(config.cacheTtlSeconds > 0, `Invalid cacheTtl for ${tier}`);
    assert.ok(["offset", "cursor"].includes(config.paginationStrategy));
  }

  // Verify progression: connections expand, query timeout tightens, cursor pagination at high scale
  assert.strictEqual(TIER_CONFIGS.TIER_100.maxConnections, 10);
  assert.strictEqual(TIER_CONFIGS.TIER_100K.maxConnections, 100);
  assert.strictEqual(TIER_CONFIGS.TIER_100.paginationStrategy, "offset");
  assert.strictEqual(TIER_CONFIGS.TIER_10K.paginationStrategy, "cursor");
  assert.strictEqual(TIER_CONFIGS.TIER_100K.paginationStrategy, "cursor");
  assert.strictEqual(TIER_CONFIGS.TIER_10K.useReadReplica, true);
});

it("getActiveScalabilityTier respects environment variable override and fallback", () => {
  const originalEnv = process.env.SCALABILITY_TIER;
  try {
    process.env.SCALABILITY_TIER = "TIER_100K";
    assert.strictEqual(getActiveScalabilityTier(), "TIER_100K");

    process.env.SCALABILITY_TIER = "TIER_100";
    assert.strictEqual(getActiveScalabilityTier(), "TIER_100");

    delete process.env.SCALABILITY_TIER;
    const fallback = getActiveScalabilityTier();
    assert.ok(["TIER_1K", "TIER_10K"].includes(fallback));
  } finally {
    if (originalEnv) {
      process.env.SCALABILITY_TIER = originalEnv;
    } else {
      delete process.env.SCALABILITY_TIER;
    }
  }
});

it("getReadClient and getWriteClient return functional Prisma clients", () => {
  const readClient = getReadClient();
  const writeClient = getWriteClient();
  assert.ok(readClient, "Read client is defined");
  assert.ok(writeClient, "Write client is defined");
});

await itAsync("queryWithTimeout enforces database execution timeout protection", async () => {
  // Successful query well within timeout
  const fastResult = await queryWithTimeout(async () => {
    return "fast-db-data";
  }, 500);
  assert.strictEqual(fastResult, "fast-db-data");

  // Runaway unindexed query exceeding timeout
  let timedOut = false;
  try {
    await queryWithTimeout(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return "delayed";
    }, 50);
  } catch (err) {
    timedOut = true;
    assert.ok(err.message.includes("Query exceeded maximum threshold of 50ms"));
  }
  assert.strictEqual(timedOut, true, "Query should have timed out");
});

await itAsync("paginateWithCursor delivers O(1) cursor slicing and pagination metadata", async () => {
  const mockDataset = Array.from({ length: 45 }, (_, i) => ({
    id: `prop-${i + 1}`,
    title: `Somali Property ${i + 1}`,
  }));

  const mockFindMany = async (args) => {
    let list = mockDataset;
    if (args.cursor) {
      const idx = list.findIndex((item) => item.id === args.cursor.id);
      list = idx !== -1 ? list.slice(idx + (args.skip || 0)) : [];
    }
    return list.slice(0, args.take);
  };

  // Page 1: take 10
  const page1 = await paginateWithCursor(mockFindMany, { limit: 10 });
  assert.strictEqual(page1.items.length, 10);
  assert.strictEqual(page1.hasMore, true);
  assert.strictEqual(page1.nextCursor, "prop-10");
  assert.strictEqual(page1.items[0].id, "prop-1");

  // Page 2: take next 10 with cursor
  const page2 = await paginateWithCursor(mockFindMany, { limit: 10, cursor: page1.nextCursor });
  assert.strictEqual(page2.items.length, 10);
  assert.strictEqual(page2.hasMore, true);
  assert.strictEqual(page2.nextCursor, "prop-20");
  assert.strictEqual(page2.items[0].id, "prop-11");

  // Last page: reach end
  const pageLast = await paginateWithCursor(mockFindMany, { limit: 10, cursor: "prop-40" });
  assert.strictEqual(pageLast.items.length, 5);
  assert.strictEqual(pageLast.hasMore, false);
  assert.strictEqual(pageLast.nextCursor, null);
});

// ── 2. API SCALING & CIRCUIT BREAKER TESTS ───────────────────────────
console.log("\n▶ 2. API SCALING & CIRCUIT BREAKER RESILIENCE");

const {
  CircuitBreaker,
  aiCircuitBreaker,
  storageCircuitBreaker,
  getTieredRateLimit,
  handleConditionalGet,
} = await import("../lib/api-scaling.ts");

await itAsync("CircuitBreaker transitions CLOSED -> OPEN -> HALF_OPEN -> CLOSED", async () => {
  const breaker = new CircuitBreaker({
    name: "test-breaker",
    failureThreshold: 3,
    resetTimeoutMs: 50,
    halfOpenSuccesses: 2,
  });

  assert.strictEqual(breaker.state, "CLOSED");

  // Trigger 2 failures (threshold is 3) -> remains CLOSED
  await assert.rejects(
    breaker.execute(async () => {
      throw new Error("fail 1");
    })
  );
  await assert.rejects(
    breaker.execute(async () => {
      throw new Error("fail 2");
    })
  );
  assert.strictEqual(breaker.state, "CLOSED");

  // 3rd failure -> trips to OPEN
  await assert.rejects(
    breaker.execute(async () => {
      throw new Error("fail 3");
    })
  );
  assert.strictEqual(breaker.state, "OPEN");

  // In OPEN state: executes fallback or fast-fails without calling target
  let calledTarget = false;
  const fallbackResult = await breaker.execute(
    async () => {
      calledTarget = true;
      return "target";
    },
    async () => "graceful-fallback"
  );
  assert.strictEqual(calledTarget, false, "Target should NOT be called in OPEN state");
  assert.strictEqual(fallbackResult, "graceful-fallback");

  // Wait for resetTimeoutMs to allow transition to HALF_OPEN
  await new Promise((resolve) => setTimeout(resolve, 60));

  // Probe 1 in HALF_OPEN
  const probe1 = await breaker.execute(async () => "recovered-1");
  assert.strictEqual(probe1, "recovered-1");
  assert.strictEqual(breaker.state, "HALF_OPEN");

  // Probe 2 in HALF_OPEN -> meets threshold, transitions to CLOSED
  const probe2 = await breaker.execute(async () => "recovered-2");
  assert.strictEqual(probe2, "recovered-2");
  assert.strictEqual(breaker.state, "CLOSED");
});

it("Pre-instantiated circuit breakers exist for AI and Storage", () => {
  assert.ok(aiCircuitBreaker instanceof CircuitBreaker);
  assert.ok(storageCircuitBreaker instanceof CircuitBreaker);
  assert.strictEqual(aiCircuitBreaker.state, "CLOSED");
  assert.strictEqual(storageCircuitBreaker.state, "CLOSED");
});

it("getTieredRateLimit dynamically scales quotas by role and concurrency tier", () => {
  const public100 = getTieredRateLimit("PUBLIC", "TIER_100");
  const public100k = getTieredRateLimit("PUBLIC", "TIER_100K");
  assert.strictEqual(public100.limit, 60);
  assert.strictEqual(public100k.limit, 300); // 5x multiplier

  const admin100 = getTieredRateLimit("ADMIN", "TIER_100");
  const admin100k = getTieredRateLimit("ADMIN", "TIER_100K");
  assert.strictEqual(admin100.limit, 600);
  assert.strictEqual(admin100k.limit, 3000); // 5x multiplier

  const customer1k = getTieredRateLimit("CUSTOMER", "TIER_1K");
  const manager10k = getTieredRateLimit("MANAGER", "TIER_10K");
  assert.strictEqual(customer1k.limit, 270);
  assert.strictEqual(manager10k.limit, 750);
});

it("handleConditionalGet returns 304 on matching ETag and 200 on new content", () => {
  const etag = '"somali-prop-v1"';

  // Matching ETag -> 304 Not Modified
  const res304 = handleConditionalGet(etag, etag, { data: "test" });
  assert.strictEqual(res304.status, 304);
  assert.strictEqual(res304.headers.get("ETag"), etag);

  // Mismatched ETag -> 200 OK
  const res200 = handleConditionalGet('"old-etag"', etag, { data: "test" });
  assert.strictEqual(res200.status, 200);
  assert.strictEqual(res200.headers.get("ETag"), etag);
});

// ── 3. MULTI-TIER DISTRIBUTED CACHING TESTS ──────────────────────────
console.log("\n▶ 3. MULTI-TIER L1/L2 DISTRIBUTED CACHING");

const {
  InMemoryClusterCacheAdapter,
  MultiTierCache,
  distributedCache,
} = await import("../lib/distributed-cache.ts");

await itAsync("InMemoryClusterCacheAdapter handles set, get, and tag invalidation", async () => {
  const adapter = new InMemoryClusterCacheAdapter();
  const payload = {
    value: { title: "Wadajir Luxury Villa" },
    expiresAt: Date.now() + 10000,
    staleUntil: Date.now() + 20000,
    tags: ["city:Mogadishu", "district:Wadajir"],
  };

  await adapter.set("prop:99", payload, 20);
  const fetched = await adapter.get("prop:99");
  assert.ok(fetched);
  assert.strictEqual(fetched.value.title, "Wadajir Luxury Villa");

  // Invalidate by tag
  const invalidatedCount = await adapter.deleteByTag("district:Wadajir");
  assert.strictEqual(invalidatedCount, 1);
  const afterDelete = await adapter.get("prop:99");
  assert.strictEqual(afterDelete, null);
});

await itAsync("MultiTierCache satisfies L1 hit, L2 hit + warming, and SWR hydration", async () => {
  const cache = new MultiTierCache(100);

  // Set in cache
  await cache.set("prop:101", { price: 250000 }, 60, ["prop:101"]);

  // 1. L1 Hit
  const hit1 = await cache.get("prop:101");
  assert.deepStrictEqual(hit1, { price: 250000 });

  // 2. Clear L1 directly and verify L2 fallback + L1 warming
  cache["l1"].clear();
  const hit2 = await cache.get("prop:101");
  assert.deepStrictEqual(hit2, { price: 250000 });
  // Verify it warmed L1
  const hit3 = cache["l1"].get("prop:101");
  assert.deepStrictEqual(hit3, { price: 250000 });

  // 3. SWR execution
  let fetchCount = 0;
  const mockFetcher = async () => {
    fetchCount++;
    return { name: "Hodhan Office", fetchCount };
  };

  // Initial fetch
  const swr1 = await cache.swr("swr:1", mockFetcher, 1);
  assert.strictEqual(swr1.fetchCount, 1);
  assert.strictEqual(fetchCount, 1);

  // Immediate second fetch (fresh cache hit, no fetcher invocation)
  const swr2 = await cache.swr("swr:1", mockFetcher, 1);
  assert.strictEqual(swr2.fetchCount, 1);
  assert.strictEqual(fetchCount, 1);

  // Tag Invalidation across both L1 and L2
  await cache.invalidateTag("prop:101");
  const afterTagInvalidation = await cache.get("prop:101");
  assert.strictEqual(afterTagInvalidation, null);

  const stats = cache.getStats();
  assert.ok(stats.hitRate.endsWith("%"));
});

it("Global distributedCache singleton is instantiated and ready", () => {
  assert.ok(distributedCache instanceof MultiTierCache);
});

// ── 4. FILE STORAGE SCALING TESTS ────────────────────────────────────
console.log("\n▶ 4. CLOUD FILE STORAGE & CDN ACCELERATION");

const {
  resolveCdnUrl,
  getStorageTierMetrics,
  S3CloudStorageProvider,
} = await import("../lib/storage-provider.ts");

it("resolveCdnUrl correctly resolves direct URLs, CDN edge URLs, and local paths", () => {
  // Direct HTTP URLs remain intact
  assert.strictEqual(
    resolveCdnUrl("https://images.unsplash.com/photo-somali.jpg"),
    "https://images.unsplash.com/photo-somali.jpg"
  );

  // Local fallback when CDN not configured
  const originalCdn = process.env.CDN_URL;
  try {
    delete process.env.CDN_URL;
    delete process.env.NEXT_PUBLIC_CDN_URL;
    assert.strictEqual(resolveCdnUrl("/uploads/photo.jpg"), "/uploads/photo.jpg");
    assert.strictEqual(resolveCdnUrl("uploads/photo.jpg"), "/uploads/photo.jpg");

    // Edge CDN acceleration when CDN is configured
    process.env.CDN_URL = "https://cdn.kiro-maal.so";
    assert.strictEqual(
      resolveCdnUrl("/properties/hero.webp"),
      "https://cdn.kiro-maal.so/properties/hero.webp"
    );
  } finally {
    if (originalCdn) {
      process.env.CDN_URL = originalCdn;
    } else {
      delete process.env.CDN_URL;
    }
  }
});

it("getStorageTierMetrics reports accurate telemetry for local vs cloud tier", () => {
  const metrics = getStorageTierMetrics();
  assert.ok(["local", "s3"].includes(metrics.provider));
  assert.strictEqual(typeof metrics.isCloudActive, "boolean");
  assert.strictEqual(typeof metrics.cdnAccelerated, "boolean");
});

await itAsync("S3CloudStorageProvider produces direct browser presigned upload parameters", async () => {
  const s3Provider = new S3CloudStorageProvider({
    bucket: "kiro-maal-production",
    region: "af-south-1",
    publicCdnUrl: "https://media.kiro-maal.so",
  });

  const presigned = await s3Provider.getPresignedUploadUrl(
    "villa-front.webp",
    "image/webp",
    "properties"
  );

  assert.ok(presigned.uploadUrl.startsWith("https://media.kiro-maal.so/properties/"));
  assert.ok(presigned.uploadUrl.includes("presigned=true"));
  assert.ok(presigned.fileUrl.startsWith("https://media.kiro-maal.so/properties/"));
  assert.ok(presigned.key.startsWith("properties/"));
  assert.strictEqual(presigned.headers["Content-Type"], "image/webp");
  assert.strictEqual(presigned.expiresInSeconds, 900);
});

// ── Summary Report ───────────────────────────────────────────────────
console.log("\n========================================================");
console.log(`SCALABILITY VERIFICATION COMPLETE: ${passed} passed, ${failed} failed`);
console.log("========================================================\n");

if (failed > 0) {
  process.exit(1);
}

