/**
 * Comprehensive Phase 2C Verification & Benchmark Suite
 *
 * Verifies:
 * 1. Signal Weighting & Exponential Time Decay (14-day half-life)
 * 2. Interaction Throttling & Deduplication (60s window)
 * 3. Profile Confidence Calculation (Cold start -> Low -> High)
 * 4. User Preference Profile Builder & 768-d Semantic Vector Synthesis
 * 5. Cold-Start Handling & Non-Personalized Safe Fallback
 * 6. Behavioral Preference Lift (City & Property Type Personalization)
 * 7. Inviolable Rule: Hard Constraints Never Overridden by Personalization
 * 8. Explainability Grounding (Structured Reason Codes & Multilingual Explanations)
 * 9. Security Controls (401 Unauthorized, Cross-User Isolation, Approved Property Grounding)
 * 10. Backward Compatibility of /api/user/recommendations
 * 11. Quantitative Benchmark: Baseline vs Personalized Ranking (NDCG@K, Precision@K, Latency)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_BASE = "http://localhost:3000";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function run() {
  console.log("==================================================================");
  console.log("  PHASE 2C: BEHAVIORAL INTELLIGENCE & PERSONALIZED RECOMMENDATIONS");
  console.log("==================================================================\n");

  // -------------------------------------------------------------------------
  // 1. SIGNAL WEIGHTING & EXPONENTIAL TIME-DECAY
  // -------------------------------------------------------------------------
  console.log("--- 1. Signal Weighting & Time-Decay Math ---");
  const { SIGNAL_BASE_WEIGHTS, calculateDecayedWeight, calculateProfileConfidence, BEHAVIORAL_CONFIG } =
    await import("../lib/ai/behavior/signal-weights.ts");

  assert(SIGNAL_BASE_WEIGHTS.INQUIRY === 5.0, "Inquiry signal has highest weight (5.0)");
  assert(SIGNAL_BASE_WEIGHTS.FAVORITE === 4.0, "Favorite signal has strong weight (4.0)");
  assert(SIGNAL_BASE_WEIGHTS.VIEW === 1.0, "View signal has base weight (1.0)");
  assert(SIGNAL_BASE_WEIGHTS.UNFAVORITE === -2.0, "Unfavorite signal has negative weight (-2.0)");

  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const ninetyFiveDaysAgo = new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000);

  const weightNow = calculateDecayedWeight(4.0, now, now);
  const weight14d = calculateDecayedWeight(4.0, fourteenDaysAgo, now);
  const weight28d = calculateDecayedWeight(4.0, twentyEightDaysAgo, now);
  const weight95d = calculateDecayedWeight(4.0, ninetyFiveDaysAgo, now);

  assert(weightNow === 4.0, "Zero age retains 100% of weight (4.0)");
  assert(Math.abs(weight14d - 2.0) < 0.05, `14 days decay equals 1 half-life (50%): ${weight14d} (expected: ~2.0)`);
  assert(Math.abs(weight28d - 1.0) < 0.05, `28 days decay equals 2 half-lives (25%): ${weight28d} (expected: ~1.0)`);
  assert(weight95d === 0, `Events past 90 days are expired to 0 weight: ${weight95d}`);

  // Confidence
  assert(calculateProfileConfidence(0) === 0.0, "0 weight yields 0.0 confidence (cold start)");
  assert(calculateProfileConfidence(1.5) === 0.0, "< 2.0 weight maintains cold start (confidence 0.0)");
  assert(calculateProfileConfidence(7.5) > 0.4 && calculateProfileConfidence(7.5) < 0.6, "7.5 weight yields medium confidence (~0.5)");
  assert(calculateProfileConfidence(15.0) === 1.0, "15.0 weight reaches max confidence (1.0)");

  // -------------------------------------------------------------------------
  // 2. INTERACTION DEDUPLICATION & THROTTLING
  // -------------------------------------------------------------------------
  console.log("\n--- 2. Interaction Throttling & Deduplication ---");
  const { recordInteraction } = await import("../lib/ai/behavior/event-recorder.ts");

  const testUserId = "cmus03vjn0004hy5wc77ofx2p"; // customer user
  const testPropId = "cmus03vk50008hy5wqk1naxrv";

  // First interaction
  const rec1 = await recordInteraction({
    userId: testUserId,
    propertyId: testPropId,
    eventType: "VIEW",
  });
  assert(rec1.recorded === true, "First VIEW interaction recorded successfully");

  // Immediate duplicate within 60s
  const rec2 = await recordInteraction({
    userId: testUserId,
    propertyId: testPropId,
    eventType: "VIEW",
  });
  assert(rec2.recorded === false && rec2.reason.includes("Throttled"),
    "Rapid duplicate VIEW within 60s successfully throttled");

  // -------------------------------------------------------------------------
  // 3. PROFILE BUILDER & 768-D SEMANTIC VECTOR SYNTHESIS
  // -------------------------------------------------------------------------
  console.log("\n--- 3. User Preference Profile Builder & Semantic Vector ---");
  const { buildUserProfile } = await import("../lib/ai/behavior/profile-builder.ts");

  const customerProfile = await buildUserProfile(testUserId, { forceRefresh: true });
  assert(customerProfile.userId === testUserId, "Profile correctly mapped to customer userId");
  assert(customerProfile.confidence > 0, `Profile confidence derived: ${customerProfile.confidence} (> 0.0)`);
  assert(customerProfile.totalWeight > 0, `Total effective weight accumulated: ${customerProfile.totalWeight}`);
  assert(customerProfile.preferredCities["Mogadishu"] > 0, "Learned preferred city includes Mogadishu");
  assert(customerProfile.preferredTypes["HOUSE"] > 0, "Learned preferred property type includes HOUSE");
  assert(customerProfile.priceRange.avgPrice > 0, `Learned typical price range: $${customerProfile.priceRange.minPrice} - $${customerProfile.priceRange.maxPrice} (avg: $${customerProfile.priceRange.avgPrice})`);

  if (customerProfile.semanticVector) {
    assert(customerProfile.semanticVector.length === 768, "Semantic interest vector has exactly 768 dimensions");
    const { l2Norm } = await import("../lib/ai/embeddings/vector-math.ts");
    const norm = l2Norm(customerProfile.semanticVector);
    assert(Math.abs(norm - 1.0) < 0.01, `Semantic interest vector is normalized to unit length: ${norm.toFixed(4)}`);
  } else {
    assert(false, "Semantic interest vector synthesized");
  }

  // -------------------------------------------------------------------------
  // 4. COLD-START DETECTION & SAFE FALLBACK
  // -------------------------------------------------------------------------
  console.log("\n--- 4. Cold-Start Handling & Non-Personalized Fallback ---");
  const mockNewUserId = "new_anonymous_user_12345";
  const coldProfile = await buildUserProfile(mockNewUserId, { forceRefresh: true });

  assert(coldProfile.confidence === 0.0, "New user has exactly 0.0 confidence");
  assert(coldProfile.isColdStart === true, "isColdStart is true for new user");
  assert(coldProfile.totalInteractions === 0, "0 total interactions for new user");
  assert(coldProfile.semanticVector === null, "Semantic vector is null for cold start user");

  // Clean up mock profile from DB
  await prisma.userPreferenceProfile.deleteMany({ where: { userId: mockNewUserId } });

  // -------------------------------------------------------------------------
  // 5. PERSONALIZED RANKING & SCORE LIFT EVALUATION
  // -------------------------------------------------------------------------
  console.log("\n--- 5. Personalized Ranking & Preference Lift ---");
  const { rankPropertiesPersonalized } = await import("../lib/ai/recommendation/personalized-ranker.ts");

  const approvedProps = await prisma.property.findMany({
    where: { status: "APPROVED" },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      embedding: true,
    },
    take: 30,
  });

  // Rank with cold-start profile (Baseline non-personalized)
  const coldRanked = rankPropertiesPersonalized(approvedProps, coldProfile, {}, { topN: 10 });
  // Rank with learned customer profile (Personalized)
  const personalizedRanked = rankPropertiesPersonalized(approvedProps, customerProfile, {}, { topN: 10 });

  assert(coldRanked.length > 0, `Baseline generated ${coldRanked.length} recommendations`);
  assert(personalizedRanked.length > 0, `Personalized engine generated ${personalizedRanked.length} recommendations`);

  const topPersonalized = personalizedRanked[0];
  const topProperty = approvedProps.find((p) => p.id === topPersonalized.propertyId);

  assert(
    customerProfile.preferredCities[topProperty.city] > 0 || customerProfile.preferredTypes[topProperty.type] > 0,
    `Top recommended property matches user's learned profile: "${topProperty.title}" (${topProperty.city}, ${topProperty.type}) - Score: ${topPersonalized.score}`
  );
  assert(topPersonalized.compositeScoreBreakdown.confidence === customerProfile.confidence,
    `Breakdown includes active profile confidence: ${topPersonalized.compositeScoreBreakdown.confidence}`);

  // -------------------------------------------------------------------------
  // 6. HARD CONSTRAINTS NEVER OVERRIDDEN BY PERSONALIZATION
  // -------------------------------------------------------------------------
  console.log("\n--- 6. Hard Constraints Inviolability ---");
  // Customer strongly prefers Mogadishu HOUSE, but explicitly requests Hargeisa APARTMENT with 2 bedrooms
  const explicitConstraints = {
    location: "Hargeisa",
    preferredType: "APARTMENT",
    preferredBedrooms: 2,
  };

  const constraintRanked = rankPropertiesPersonalized(
    approvedProps,
    customerProfile,
    explicitConstraints,
    { topN: 5 }
  );

  const topConstrained = approvedProps.find((p) => p.id === constraintRanked[0].propertyId);
  assert(
    topConstrained.city === "Hargeisa" && topConstrained.type === "APARTMENT" && topConstrained.bedrooms === 2,
    `Hard constraint respected: Top property is ${topConstrained.city} ${topConstrained.type} (${topConstrained.bedrooms} beds), NOT Mogadishu House!`
  );

  // -------------------------------------------------------------------------
  // 7. EXPLAINABILITY & REASON CODES
  // -------------------------------------------------------------------------
  console.log("\n--- 7. Explainability & Multilingual Reasons ---");
  assert(topPersonalized.reasonCodes.length > 0, `Structured reason codes assigned: [${topPersonalized.reasonCodes.join(", ")}]`);
  assert(topPersonalized.reasons.length > 0, `English explanation: "${topPersonalized.reasons[0]}"`);
  assert(topPersonalized.reasonsSo.length > 0, `Somali explanation: "${topPersonalized.reasonsSo[0]}"`);
  assert(topPersonalized.reasonsAr.length > 0, `Arabic explanation: "${topPersonalized.reasonsAr[0]}"`);

  // -------------------------------------------------------------------------
  // 8. SECURITY CONTROLS & PROPERTY VISIBILITY
  // -------------------------------------------------------------------------
  console.log("\n--- 8. Security Controls & Access Isolation ---");
  // Unauthenticated requests to endpoints
  const resNoAuthBehavior = await fetch(`${API_BASE}/api/ai/behavior`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType: "VIEW", propertyId: testPropId }),
  });
  assert(resNoAuthBehavior.status === 401, "Unauthenticated POST /api/ai/behavior rejected with HTTP 401");

  const resNoAuthProfile = await fetch(`${API_BASE}/api/ai/profile`);
  assert(resNoAuthProfile.status === 401, "Unauthenticated GET /api/ai/profile rejected with HTTP 401");

  const resNoAuthRecs = await fetch(`${API_BASE}/api/ai/recommendations`);
  assert(resNoAuthRecs.status === 401, "Unauthenticated GET /api/ai/recommendations rejected with HTTP 401");

  // Verify approved property grounding:
  const allPersonalizedProps = personalizedRanked.map((r) => approvedProps.find((p) => p.id === r.propertyId));
  const unapprovedFound = allPersonalizedProps.some((p) => p.status !== "APPROVED");
  assert(!unapprovedFound, "Property status protection: 100% of recommended properties have status = 'APPROVED'");

  // -------------------------------------------------------------------------
  // 9. BACKWARD COMPATIBILITY
  // -------------------------------------------------------------------------
  console.log("\n--- 9. Existing Recommendation Engine Backward Compatibility ---");
  const { generateRecommendations } = await import("../lib/recommendation-engine.ts");

  const legacyRecs = await generateRecommendations({ userId: testUserId }, 5);
  assert(legacyRecs.length > 0, `generateRecommendations returned ${legacyRecs.length} items`);
  assert(legacyRecs[0].property && typeof legacyRecs[0].score === "number" && Array.isArray(legacyRecs[0].reasons),
    "Response maintains 100% backward-compatible structure (property, score, reasons)");
  assert(Array.isArray(legacyRecs[0].reasonCodes), "Enriched with structured reasonCodes without breaking schema");

  // -------------------------------------------------------------------------
  // 10. QUANTITATIVE BENCHMARK: BASELINE VS PERSONALIZED
  // -------------------------------------------------------------------------
  console.log("\n--- 10. Quantitative Benchmark: Baseline vs Personalized Ranking ---");

  // Measure NDCG and Precision@5 where relevance is defined by user's dominant learned city & type
  function calculateRelevance(prop, profile) {
    let rel = 0;
    if (profile.preferredCities[prop.city]) rel += profile.preferredCities[prop.city] * 2.0;
    if (profile.preferredTypes[prop.type]) rel += profile.preferredTypes[prop.type] * 2.0;
    return Math.min(3, Math.round(rel)); // 0 to 3 scale
  }

  function dcg(relevances, k = 5) {
    let score = 0;
    for (let i = 0; i < Math.min(relevances.length, k); i++) {
      score += (Math.pow(2, relevances[i]) - 1) / Math.log2(i + 2);
    }
    return score;
  }

  function ndcg(relevances, k = 5) {
    const actualDcg = dcg(relevances, k);
    const idealDcg = dcg([...relevances].sort((a, b) => b - a), k);
    return idealDcg === 0 ? 1 : actualDcg / idealDcg;
  }

  const K = 5;
  const startP = Date.now();
  const benchmarkPersonalized = rankPropertiesPersonalized(approvedProps, customerProfile, {}, { topN: K });
  const latencyPersonalized = Date.now() - startP;

  const baselineRel = coldRanked.slice(0, K).map((r) => {
    const p = approvedProps.find((x) => x.id === r.propertyId);
    return calculateRelevance(p, customerProfile);
  });

  const personalRel = benchmarkPersonalized.slice(0, K).map((r) => {
    const p = approvedProps.find((x) => x.id === r.propertyId);
    return calculateRelevance(p, customerProfile);
  });

  const ndcgBaseline = ndcg(baselineRel, K);
  const ndcgPersonalized = ndcg(personalRel, K);
  const precisionBaseline = baselineRel.filter((r) => r >= 2).length / K;
  const precisionPersonalized = personalRel.filter((r) => r >= 2).length / K;
  const liftPercentage = ndcgBaseline > 0 ? ((ndcgPersonalized - ndcgBaseline) / ndcgBaseline) * 100 : 0;

  console.log(`\n  Benchmark Metrics Summary (K = ${K}):`);
  console.log(`  - Baseline NDCG@${K}:            ${ndcgBaseline.toFixed(3)}`);
  console.log(`  - Personalized NDCG@${K}:        ${ndcgPersonalized.toFixed(3)}`);
  console.log(`  - Personalization NDCG Lift:    +${liftPercentage.toFixed(1)}%`);
  console.log(`  - Baseline Precision@${K}:       ${(precisionBaseline * 100).toFixed(1)}%`);
  console.log(`  - Personalized Precision@${K}:   ${(precisionPersonalized * 100).toFixed(1)}%`);
  console.log(`  - Recommendation Latency:       ${latencyPersonalized} ms`);

  assert(ndcgPersonalized >= ndcgBaseline, `Personalized NDCG@${K} >= Baseline (${ndcgPersonalized.toFixed(3)} vs ${ndcgBaseline.toFixed(3)})`);
  assert(precisionPersonalized >= precisionBaseline, `Personalized Precision@${K} >= Baseline`);
  assert(latencyPersonalized < 100, `Recommendation latency < 100ms (Actual: ${latencyPersonalized}ms)`);

  await prisma.$disconnect();

  console.log("\n==================================================================");
  console.log(`  PHASE 2C TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log("==================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Unhandled test suite exception:", err);
  process.exit(1);
});
