/**
 * Automated Phase 2A Verification Test Suite:
 * Multilingual Semantic Search, Embeddings & Cross-Language Retrieval
 */
import assert from "node:assert";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=================================================");
  console.log("  PHASE 2A MULTILINGUAL SEMANTIC SEARCH TESTS    ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}`);
      console.error(`       Error: ${err.message}\n`);
      failed++;
    }
  }

  // =========================================================================
  // TEST GROUP 1: MULTILINGUAL QUERY & LANGUAGE DETECTION
  // =========================================================================
  console.log("--- TEST GROUP 1: LANGUAGE DETECTION & QUERY UNDERSTANDING ---");

  await test("Test 1: Somali query language detection", async () => {
    const res = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "Waxaan raadinayaa guri saddex qol ah oo ku yaal Muqdisho" }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.language.language, "so");
    assert.ok(data.language.detectedKeywords.includes("waxaan"));
    assert.ok(data.language.detectedKeywords.includes("guri"));
  });

  await test("Test 2: Arabic query language detection with Arabic script", async () => {
    const res = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "أبحث عن منزل من ثلاث غرف نوم مع موقف سيارات" }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.language.language, "ar");
    assert.strictEqual(data.language.script, "Arab");
    assert.ok(data.language.detectedKeywords.includes("منزل"));
  });

  await test("Test 3: English query language detection", async () => {
    const res = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "I need a modern three-bedroom family home with ocean views" }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.language.language, "en");
    assert.strictEqual(data.language.script, "Latn");
  });

  await test("Test 4: Mixed-language query detection (Somali + English)", async () => {
    const res = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "Waxaan rabaa 3 bedroom house oo parking leh Muqdisho" }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.language.language, "mixed");
    assert.strictEqual(data.language.isMultilingualQuery, true);
  });

  // =========================================================================
  // TEST GROUP 2: CROSS-LANGUAGE SEMANTIC RETRIEVAL (MANDATORY REQUIREMENT)
  // =========================================================================
  console.log("\n--- TEST GROUP 2: CROSS-LANGUAGE SEMANTIC RETRIEVAL ---");

  const targetPropertyId = "cmus03vt0001shy5whjof9p2x"; // Modern 3-Bedroom Home near Ocean & Liido Beach

  await test("Test 5: Somali query retrieves English oceanfront property as #1 match", async () => {
    const res = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "Waxaan rabaa guri 3 qol ah oo xeebta u dhow, parking leh, solar-na leh",
        limit: 3,
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.results.length > 0, "Must return results");
    const top = data.results[0];
    assert.strictEqual(top.propertyId, targetPropertyId, "Somali query must rank target ocean property #1");
    assert.ok(top.similarity >= 0.65, `Similarity ${top.similarity} must be >= 0.65`);
  });

  await test("Test 6: English query retrieves English oceanfront property as #1 match", async () => {
    const res = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "Modern 3-bedroom house near the ocean with parking and solar power",
        limit: 3,
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.results.length > 0);
    const top = data.results[0];
    assert.strictEqual(top.propertyId, targetPropertyId, "English query must rank target ocean property #1");
    assert.ok(top.similarity >= 0.65, `Similarity ${top.similarity} must be >= 0.65`);
  });

  await test("Test 7: Arabic query retrieves English oceanfront property as #1 match", async () => {
    const res = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "أريد منزلاً من ثلاث غرف نوم بالقرب من البحر مع موقف سيارات وطاقة شمسية",
        limit: 3,
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.results.length > 0);
    const top = data.results[0];
    assert.strictEqual(top.propertyId, targetPropertyId, "Arabic query must rank target ocean property #1");
    assert.ok(top.similarity >= 0.60, `Similarity ${top.similarity} must be >= 0.60`);
  });

  await test("Test 8: Cross-language synonym matching (badda u dhow vs xeebta u dhow)", async () => {
    const res = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "Guri saddex qol ah oo badda u dhow Muqdisho",
        limit: 3,
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const top = data.results[0];
    assert.strictEqual(top.propertyId, targetPropertyId, "Somali synonym 'badda' must retrieve target property");
  });

  // =========================================================================
  // TEST GROUP 3: HYBRID HARD CONSTRAINT FILTERING
  // =========================================================================
  console.log("\n--- TEST GROUP 3: STRUCTURED HARD CONSTRAINT FILTERING ---");

  await test("Test 9: Semantic search strictly filters by hard city constraint", async () => {
    const res = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "Modern luxury villa",
        filters: { city: "Hargeisa" },
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    for (const r of data.results) {
      assert.strictEqual(r.property.city, "Hargeisa", "Every result must belong to Hargeisa");
    }
  });

  await test("Test 10: Semantic search strictly respects price and bedroom filters", async () => {
    const res = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "Family home",
        filters: { bedrooms: 2, maxPrice: 60000 },
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    for (const r of data.results) {
      assert.ok(r.property.bedrooms >= 2, "Bedrooms must be >= 2");
      assert.ok(r.property.price <= 60000, `Price ${r.property.price} must be <= 60000`);
    }
  });

  // =========================================================================
  // TEST GROUP 4: AUTHORIZATION & PROPERTY STATUS VISIBILITY
  // =========================================================================
  console.log("\n--- TEST GROUP 4: AUTHORIZATION & PROPERTY VISIBILITY ---");

  await test("Test 11: Client role: ADMIN spoofing attempt is neutralized to PUBLIC", async () => {
    const res = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "Prime office space in Kismayo",
        role: "ADMIN", // Spoofing attempt
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    // Verify pending property cmus03vnu000khy5wlm0pgx2z is NOT in results
    const leaked = data.results.find((r) => r.propertyId === "cmus03vnu000khy5wlm0pgx2z");
    assert.strictEqual(leaked, undefined, "Pending property must not be returned via spoofed role");
  });

  await test("Test 12: Rejected and pending properties never appear in public semantic search", async () => {
    const res = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "Grand Estate Villa Bosaso", // Title of REJECTED property cmus03vnf000ghy5w1vpommpn
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    for (const r of data.results) {
      assert.strictEqual(r.property.status, "APPROVED", `Result ${r.propertyId} must have status APPROVED`);
    }
  });

  // =========================================================================
  // TEST GROUP 5: RATE LIMITING & SECURITY DEFENSES
  // =========================================================================
  console.log("\n--- TEST GROUP 5: RATE LIMITING & SECURITY ---");

  await test("Test 13: Exceeding 30 req/min limit returns HTTP 429 with Retry-After header", async () => {
    const floodIp = "198.51.100.222";
    let hit429 = false;
    let retryAfter = null;

    for (let i = 0; i < 32; i++) {
      const res = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": floodIp,
        },
        body: JSON.stringify({ query: "house in Mogadishu" }),
      });

      if (res.status === 429) {
        hit429 = true;
        retryAfter = res.headers.get("Retry-After");
        break;
      }
    }

    assert.ok(hit429, "Must return HTTP 429 when rate limit is exceeded");
    assert.ok(retryAfter && Number(retryAfter) > 0, "Must return valid Retry-After header");
  });

  await test("Test 14: Query length limit validation (exceeding 500 chars returns 400)", async () => {
    const longQuery = "a".repeat(505);
    const res = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: longQuery }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes("500 characters"));
  });

  // =========================================================================
  // TEST GROUP 6: ADMIN EMBEDDING MANAGEMENT ENDPOINTS
  // =========================================================================
  console.log("\n--- TEST GROUP 6: ADMIN EMBEDDING ENDPOINTS ---");

  await test("Test 15: Unauthenticated call to GET /api/admin/embeddings/status returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/embeddings/status`);
    assert.strictEqual(res.status, 401);
  });

  await test("Test 16: Unauthenticated call to POST /api/admin/embeddings/reindex returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/embeddings/reindex`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forceReindex: false }),
    });
    assert.strictEqual(res.status, 401);
  });

  // =========================================================================
  // TEST GROUP 7: RETRIEVAL QUALITY METRICS BENCHMARK
  // =========================================================================
  console.log("\n--- TEST GROUP 7: RETRIEVAL QUALITY BENCHMARK METRICS ---");

  const benchmarkDataset = [
    {
      lang: "so",
      query: "Waxaan rabaa guri 3 qol ah oo xeebta u dhow, parking leh, solar-na leh",
      expectedId: targetPropertyId,
    },
    {
      lang: "en",
      query: "Modern 3-bedroom house near the ocean with parking and solar power",
      expectedId: targetPropertyId,
    },
    {
      lang: "ar",
      query: "أريد منزلاً من ثلاث غرف نوم بالقرب من البحر مع موقف سيارات وطاقة شمسية",
      expectedId: targetPropertyId,
    },
    {
      lang: "so",
      query: "Guri saddex qol ah oo badda u dhow Muqdisho",
      expectedId: targetPropertyId,
    },
  ];

  let top1Hits = 0;
  let top3Hits = 0;
  let totalReciprocalRank = 0;

  for (const item of benchmarkDataset) {
    const res = await fetch(`${BASE_URL}/api/ai/semantic-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": `benchmark-ip-${Math.random()}` },
      body: JSON.stringify({ query: item.query, limit: 3 }),
    });
    const data = await res.json();
    const rank = data.results.findIndex((r) => r.propertyId === item.expectedId);

    if (rank === 0) {
      top1Hits++;
      top3Hits++;
      totalReciprocalRank += 1.0;
    } else if (rank > 0 && rank < 3) {
      top3Hits++;
      totalReciprocalRank += 1.0 / (rank + 1);
    }
  }

  const top1Accuracy = (top1Hits / benchmarkDataset.length) * 100;
  const top3Recall = (top3Hits / benchmarkDataset.length) * 100;
  const mrr = totalReciprocalRank / benchmarkDataset.length;

  console.log(`[BENCHMARK] Total Evaluation Queries: ${benchmarkDataset.length}`);
  console.log(`[BENCHMARK] Top-1 Retrieval Accuracy: ${top1Accuracy.toFixed(1)}%`);
  console.log(`[BENCHMARK] Recall@3                : ${top3Recall.toFixed(1)}%`);
  console.log(`[BENCHMARK] MRR (Mean Reciprocal Rank): ${mrr.toFixed(4)}`);

  await test("Test 17: Benchmark Top-1 Retrieval Accuracy >= 75%", async () => {
    assert.ok(top1Accuracy >= 75.0, `Top-1 Accuracy ${top1Accuracy}% must be >= 75%`);
  });

  await test("Test 18: Benchmark MRR >= 0.75", async () => {
    assert.ok(mrr >= 0.75, `MRR ${mrr} must be >= 0.75`);
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log("\n=================================================");
  console.log(`PHASE 2A TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner crashed:", err);
  prisma.$disconnect();
  process.exit(1);
});
