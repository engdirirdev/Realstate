/**
 * ================================================================
 * TEST SUITE : Multi-Tier Caching Engine Verification
 * PURPOSE    : Rigorous verification of Next.js cache, API cache,
 *              Database cache, Static cache, and Image cache.
 * ================================================================
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("\n========================================================");
console.log("   KIRO-MAAL ENTERPRISE CACHING VERIFICATION SUITE       ");
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

// ── 1. In-Memory Database Cache (MemoryCache) Tests ────────────────
console.log("▶ 1. DATABASE & IN-MEMORY CACHE (MemoryCache)");

// Import MemoryCache from lib/cache.ts
const { MemoryCache, dbCache, cachedDbQuery } = await import("../lib/cache.ts");

it("MemoryCache correctly stores, retrieves, and checks existence", () => {
  const cache = new MemoryCache(50);
  assert.strictEqual(cache.get("non-existent"), null);
  assert.strictEqual(cache.has("non-existent"), false);

  cache.set("user:123", { name: "Ahmed", role: "ADMIN" }, 60, ["users"]);
  assert.strictEqual(cache.has("user:123"), true);

  const val = cache.get("user:123");
  assert.deepStrictEqual(val, { name: "Ahmed", role: "ADMIN" });
});

await itAsync("MemoryCache respects TTL expiration", async () => {
  const cache = new MemoryCache(50);
  cache.set("short-lived", "temp-value", 0.05); // 50ms TTL
  assert.strictEqual(cache.get("short-lived"), "temp-value");

  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.strictEqual(cache.get("short-lived"), null);
  assert.strictEqual(cache.has("short-lived"), false);
});

it("MemoryCache enforces capacity and LRU eviction", () => {
  const cache = new MemoryCache(3);
  cache.set("k1", 1, 60);
  cache.set("k2", 2, 60);
  cache.set("k3", 3, 60);

  // Access k1 so k2 becomes the least-recently used
  cache.get("k1");

  // Insert k4, should evict k2
  cache.set("k4", 4, 60);

  assert.strictEqual(cache.has("k2"), false, "k2 should have been evicted as LRU");
  assert.strictEqual(cache.has("k1"), true, "k1 was recently accessed, should remain");
  assert.strictEqual(cache.has("k3"), true, "k3 should remain");
  assert.strictEqual(cache.has("k4"), true, "k4 should remain");
});

it("MemoryCache invalidates by tag and pattern", () => {
  const cache = new MemoryCache(100);
  cache.set("prop:1", { id: "1" }, 60, ["properties", "city:mogadishu"]);
  cache.set("prop:2", { id: "2" }, 60, ["properties", "city:hargeisa"]);
  cache.set("agent:9", { id: "9" }, 60, ["agents"]);

  const count = cache.invalidateTag("city:mogadishu");
  assert.strictEqual(count, 1);
  assert.strictEqual(cache.get("prop:1"), null);
  assert.notStrictEqual(cache.get("prop:2"), null);
  assert.notStrictEqual(cache.get("agent:9"), null);

  const propCount = cache.invalidateTag("properties");
  assert.strictEqual(propCount, 1);
  assert.strictEqual(cache.get("prop:2"), null);
  assert.notStrictEqual(cache.get("agent:9"), null);

  cache.set("stats:daily:2026", { count: 100 }, 60);
  cache.set("stats:monthly:2026", { count: 500 }, 60);
  const patternCount = cache.invalidatePattern(/^stats:/);
  assert.strictEqual(patternCount, 2);
  assert.strictEqual(cache.get("stats:daily:2026"), null);
});

it("MemoryCache tracks telemetry stats accurately", () => {
  const cache = new MemoryCache(100);
  cache.set("test-key", "val", 60);
  cache.get("test-key"); // hit
  cache.get("test-key"); // hit
  cache.get("missing-key"); // miss

  const stats = cache.getStats();
  assert.strictEqual(stats.hits, 2);
  assert.strictEqual(stats.misses, 1);
  assert.strictEqual(stats.size, 1);
  assert.strictEqual(stats.hitRate, "66.7%");
});

await itAsync("cachedDbQuery caches function evaluations and avoids duplicate execution", async () => {
  let callCount = 0;
  const mockFetcher = async () => {
    callCount++;
    return { data: "expensive-query-result" };
  };

  const res1 = await cachedDbQuery(["test", "query", "run1"], mockFetcher, {
    tags: ["test"],
    revalidate: 60,
  });
  const res2 = await cachedDbQuery(["test", "query", "run1"], mockFetcher, {
    tags: ["test"],
    revalidate: 60,
  });

  assert.strictEqual(callCount, 1, "Fetcher should only have executed once");
  assert.deepStrictEqual(res1, res2);
});

// ── 2. API Caching & HTTP Headers Tests ────────────────────────────
console.log("\n▶ 2. API CACHE & HTTP CACHE-CONTROL HEADERS");

const {
  CACHE_PROFILES,
  buildCacheControlHeader,
  generateEtag,
} = await import("../lib/api-cache.ts");

it("buildCacheControlHeader formats RFC-compliant headers for public profiles", () => {
  const shortHeader = buildCacheControlHeader(CACHE_PROFILES.PUBLIC_SHORT);
  assert(shortHeader.includes("public"));
  assert(shortHeader.includes("s-maxage=60"));
  assert(shortHeader.includes("stale-while-revalidate=300"));

  const longHeader = buildCacheControlHeader(CACHE_PROFILES.PUBLIC_LONG);
  assert(longHeader.includes("public"));
  assert(longHeader.includes("max-age=3600"));
  assert(longHeader.includes("s-maxage=86400"));
});

it("buildCacheControlHeader formats strict private no-cache for sensitive profiles", () => {
  const privateHeader = buildCacheControlHeader(CACHE_PROFILES.PRIVATE_NO_CACHE);
  assert.strictEqual(privateHeader, "private, no-cache, no-store, must-revalidate");
});

it("generateEtag creates deterministic content hashes", () => {
  const payload1 = { id: "prop-1", price: 150000, city: "Mogadishu" };
  const payload2 = { id: "prop-1", price: 150000, city: "Mogadishu" };
  const payload3 = { id: "prop-1", price: 175000, city: "Mogadishu" };

  const etag1 = generateEtag(payload1);
  const etag2 = generateEtag(payload2);
  const etag3 = generateEtag(payload3);

  assert.strictEqual(etag1, etag2, "Identical payloads must yield identical ETags");
  assert.notStrictEqual(etag1, etag3, "Modified payload must yield different ETag");
  assert(etag1.startsWith('"') && etag1.endsWith('"'), "ETag must be quoted per RFC 7232");
});

// ── 3. Static & ISR Cache Configuration Tests ──────────────────────
console.log("\n▶ 3. STATIC CACHE & ISR CONFIGURATION");

it("Public pages define explicit ISR revalidation periods", () => {
  const homePath = path.join(process.cwd(), "app", "(public)", "page.tsx");
  const propertiesPath = path.join(process.cwd(), "app", "(public)", "properties", "page.tsx");
  const propertyDetailPath = path.join(process.cwd(), "app", "(public)", "properties", "[id]", "page.tsx");
  const aboutPath = path.join(process.cwd(), "app", "(public)", "about", "page.tsx");
  const servicesPath = path.join(process.cwd(), "app", "(public)", "services", "page.tsx");

  assert(fs.existsSync(homePath), "Home page exists");
  assert(fs.readFileSync(homePath, "utf8").includes("export const revalidate = 60"), "Home page has 60s ISR");

  assert(fs.existsSync(propertiesPath), "Properties catalog page exists");
  assert(fs.readFileSync(propertiesPath, "utf8").includes("export const revalidate = 60"), "Properties page has 60s ISR");

  assert(fs.existsSync(propertyDetailPath), "Property detail page exists");
  assert(fs.readFileSync(propertyDetailPath, "utf8").includes("export const revalidate = 60"), "Property detail has 60s ISR");

  assert(fs.existsSync(aboutPath), "About page exists");
  assert(fs.readFileSync(aboutPath, "utf8").includes("export const revalidate = 86400"), "About page has 24h ISR");

  assert(fs.existsSync(servicesPath), "Services page exists");
  assert(fs.readFileSync(servicesPath, "utf8").includes("export const revalidate = 86400"), "Services page has 24h ISR");
});

// ── 4. Image Caching Configuration Tests ───────────────────────────
console.log("\n▶ 4. IMAGE CACHING & OPTIMIZATION CONFIGURATION");

it("next.config.js enforces 30-day immutable cache and next-gen formats", () => {
  const nextConfigPath = path.join(process.cwd(), "next.config.js");
  const content = fs.readFileSync(nextConfigPath, "utf8");

  assert(content.includes("minimumCacheTTL: 2592000"), "Images minimumCacheTTL configured for 30 days");
  assert(content.includes('"image/avif"') && content.includes('"image/webp"'), "Images formats include AVIF & WebP");
  assert(content.includes("public, max-age=31536000, immutable"), "Static assets header configured for 1-year immutable caching");
});

// ── 5. Cache Invalidation Triggers ─────────────────────────────────
console.log("\n▶ 5. UNIFIED CACHE INVALIDATION HOOKS");

const {
  invalidatePropertyCache,
  invalidateCategoryCache,
  invalidateLocationCache,
} = await import("../lib/cache.ts");

await itAsync("invalidatePropertyCache purges tags and keys without throwing", async () => {
  dbCache.set("property:p101", { title: "Penthouse" }, 60, ["property-p101", "properties"]);
  assert.strictEqual(dbCache.has("property:p101"), true);

  await invalidatePropertyCache("p101");
  assert.strictEqual(dbCache.has("property:p101"), false, "Direct key must be purged");
  assert.strictEqual(dbCache.get("property:p101"), null);
});

await itAsync("invalidateCategoryCache and invalidateLocationCache execute cleanly", async () => {
  dbCache.set("cat:list", ["Villas", "Apartments"], 60, ["categories"]);
  dbCache.set("loc:list", ["Mogadishu", "Hargeisa"], 60, ["locations"]);

  await invalidateCategoryCache();
  assert.strictEqual(dbCache.has("cat:list"), false);
  assert.strictEqual(dbCache.has("loc:list"), true);

  await invalidateLocationCache();
  assert.strictEqual(dbCache.has("loc:list"), false);
});

console.log("\n========================================================");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("========================================================\n");

if (failed > 0) {
  process.exit(1);
}

