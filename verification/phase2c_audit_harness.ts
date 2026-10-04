import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { calculateDecayedWeight, calculateProfileConfidence, SIGNAL_BASE_WEIGHTS, BEHAVIORAL_CONFIG } from "../lib/ai/behavior/signal-weights";
import { recordInteraction } from "../lib/ai/behavior/event-recorder";
import { buildUserProfile, LearnedUserPreferences } from "../lib/ai/behavior/profile-builder";
import { rankPropertiesPersonalized, ExplicitPreferencesInput } from "../lib/ai/recommendation/personalized-ranker";
import { generateRecommendations } from "../lib/recommendation-engine";
import { cosineSimilarity, l2Norm } from "../lib/ai/embeddings/vector-math";
import { executeSemanticSearch } from "../lib/ai/semantic-search/semantic-search-service";

async function main() {
  const logLines: string[] = [];
  function log(section: string, data: any) {
    const header = `\n========================================\n[${section}]\n========================================`;
    console.log(header);
    logLines.push(header);
    const content = typeof data === "string" ? data : JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value, 2);
    console.log(content);
    logLines.push(content);
  }

  // ----------------------------------------------------
  // SECTION A: Behavioral Data Origin & DB stats
  // ----------------------------------------------------
  const userInteractions = await prisma.userInteraction.findMany();
  const distinctUsersWithInteractions = await prisma.userInteraction.groupBy({
    by: ["userId"],
    _count: { id: true },
  });
  log("A6: Existing user_interactions in DB", {
    totalRows: userInteractions.length,
    distinctUsersCount: distinctUsersWithInteractions.length,
    distinctUsers: distinctUsersWithInteractions,
  });

  const existingProfiles = await prisma.userPreferenceProfile.findMany();
  log("D1: Existing UserPreferenceProfile in DB", existingProfiles.map(p => ({
    userId: p.userId,
    confidence: p.confidence,
    totalWeight: p.totalWeight,
    totalInteractions: p.totalInteractions,
    updatedAt: p.updatedAt,
  })));

  // ----------------------------------------------------
  // SECTION E1: Embedding Provider Mix
  // ----------------------------------------------------
  const embeddingModels = await prisma.$queryRawUnsafe(`SELECT model, COUNT(*) as count FROM property_embeddings GROUP BY model;`);
  log("E1: Embedding Provider Mix in DB", embeddingModels);

  // ----------------------------------------------------
  // SECTION E3: De-index on Status Change Live Check
  // ----------------------------------------------------
  // Pick an approved property with an embedding
  const testPropForDeindex = await prisma.property.findFirst({
    where: { status: "APPROVED", embedding: { isNot: null } },
    include: { embedding: true },
  });

  if (testPropForDeindex) {
    const originalStatus = testPropForDeindex.status;
    const propId = testPropForDeindex.id;
    const propTitle = testPropForDeindex.title;

    // Search before change
    const searchBefore = await executeSemanticSearch({
      query: propTitle,
      limit: 5,
    });
    const inSearchBefore = searchBefore.results.some(r => r.propertyId === propId);

    // Update status to REJECTED via Prisma (simulating what app/api/admin/properties/[id] does)
    await prisma.property.update({
      where: { id: propId },
      data: { status: "REJECTED" },
    });

    // Check if embedding row still exists
    const embAfterReject = await prisma.propertyEmbedding.findUnique({
      where: { propertyId: propId },
    });

    // Search after reject
    const searchAfter = await executeSemanticSearch({
      query: propTitle,
      limit: 5,
    });
    const inSearchAfter = searchAfter.results.some(r => r.propertyId === propId);

    // Revert status back to APPROVED
    await prisma.property.update({
      where: { id: propId },
      data: { status: originalStatus },
    });

    log("E3: De-index Live Check", {
      propertyId: propId,
      title: propTitle,
      embeddingBeforePresent: !!testPropForDeindex.embedding,
      inSearchBefore,
      embeddingAfterStatusRejected: !!embAfterReject,
      inSearchAfterStatusRejected: inSearchAfter,
      verdict: !embAfterReject ? "DEINDEXED_AUTOMATICALLY" : "EMBEDDING_PERSISTS_IN_DB",
    });
  }

  // ----------------------------------------------------
  // SECTION F1: Signal Netting Live Check (UNFAVORITE vs FAVORITE)
  // ----------------------------------------------------
  const tempUserNet = await prisma.user.create({
    data: {
      email: `temp_net_${Date.now()}@test.so`,
      name: "Temp Net User",
      role: "CUSTOMER",
      password: "dummy_password_hash",
    },
  });

  const sampleProp = await prisma.property.findFirst({ where: { status: "APPROVED" } });
  if (sampleProp) {
    // 1. Add FAVORITE (+4.0)
    await prisma.userInteraction.create({
      data: {
        userId: tempUserNet.id,
        propertyId: sampleProp.id,
        eventType: "FAVORITE",
        weight: 4.0,
      },
    });

    const profAfterFav = await buildUserProfile(tempUserNet.id, { forceRefresh: true });

    // 2. Add UNFAVORITE (-2.0)
    await prisma.userInteraction.create({
      data: {
        userId: tempUserNet.id,
        propertyId: sampleProp.id,
        eventType: "UNFAVORITE",
        weight: -2.0,
      },
    });

    const profAfterUnfav = await buildUserProfile(tempUserNet.id, { forceRefresh: true });

    log("F1: Signal Netting Test", {
      afterFavorite: {
        totalInteractions: profAfterFav.totalInteractions,
        totalWeight: profAfterFav.totalWeight,
        confidence: profAfterFav.confidence,
      },
      afterUnfavorite: {
        totalInteractions: profAfterUnfav.totalInteractions,
        totalWeight: profAfterUnfav.totalWeight,
        confidence: profAfterUnfav.confidence,
      },
      netted: profAfterUnfav.totalWeight < profAfterFav.totalWeight,
      analysis: profAfterUnfav.totalWeight === profAfterFav.totalWeight ? "NEGATIVE_SIGNAL_SKIPPED_ENTIRELY" : "NETTED",
    });
  }

  // Clean up tempUserNet
  await prisma.user.delete({ where: { id: tempUserNet.id } });

  // ----------------------------------------------------
  // SECTION F3: Rapid Deduplication & Hourly View Cap
  // ----------------------------------------------------
  const tempUserDedup = await prisma.user.create({
    data: {
      email: `temp_dedup_${Date.now()}@test.so`,
      name: "Temp Dedup User",
      role: "CUSTOMER",
      password: "dummy_password_hash",
    },
  });

  if (sampleProp) {
    const dedupResults = [];
    for (let i = 0; i < 6; i++) {
      const res = await recordInteraction({
        userId: tempUserDedup.id,
        propertyId: sampleProp.id,
        eventType: "VIEW",
      });
      dedupResults.push({ attempt: i + 1, recorded: res.recorded, reason: res.reason });
    }

    const rowsCount = await prisma.userInteraction.count({
      where: { userId: tempUserDedup.id },
    });

    log("F3: Rapid Deduplication Test (6 consecutive VIEWs)", {
      attempts: dedupResults,
      rowsCreatedInDB: rowsCount,
    });
  }

  await prisma.user.delete({ where: { id: tempUserDedup.id } });

  // ----------------------------------------------------
  // SECTION F5: User Deletion Retention / Cascade Test
  // ----------------------------------------------------
  const tempUserRetention = await prisma.user.create({
    data: {
      email: `temp_retention_${Date.now()}@test.so`,
      name: "Temp Retention User",
      role: "CUSTOMER",
      password: "dummy_password_hash",
    },
  });

  if (sampleProp) {
    await prisma.userInteraction.create({
      data: {
        userId: tempUserRetention.id,
        propertyId: sampleProp.id,
        eventType: "VIEW",
        weight: 1.0,
      },
    });
    await buildUserProfile(tempUserRetention.id, { forceRefresh: true });

    const interBefore = await prisma.userInteraction.count({ where: { userId: tempUserRetention.id } });
    const profBefore = await prisma.userPreferenceProfile.count({ where: { userId: tempUserRetention.id } });

    // Delete user
    await prisma.user.delete({ where: { id: tempUserRetention.id } });

    const interAfter = await prisma.userInteraction.count({ where: { userId: tempUserRetention.id } });
    const profAfter = await prisma.userPreferenceProfile.count({ where: { userId: tempUserRetention.id } });

    log("F5: User Retention / Cascade Test", {
      beforeDelete: { interactions: interBefore, profile: profBefore },
      afterDelete: { interactions: interAfter, profile: profAfter },
      behavioralDataRemoved: interAfter === 0 && profAfter === 0 ? "YES" : "NO",
    });
  }

  // ----------------------------------------------------
  // SECTION D2: Cross-User Vector Distinctness (3 synthetic profiles)
  // ----------------------------------------------------
  // User 1: Apartment-focused (views multiple apartments)
  // User 2: Villa-focused (views multiple villas)
  // User 3: Land-focused (views multiple land plots)
  const aptProps = await prisma.property.findMany({ where: { status: "APPROVED", type: "APARTMENT" }, take: 3, include: { embedding: true } });
  const villaProps = await prisma.property.findMany({ where: { status: "APPROVED", type: "VILLA" }, take: 3, include: { embedding: true } });
  const landProps = await prisma.property.findMany({ where: { status: "APPROVED", type: "LAND" }, take: 3, include: { embedding: true } });

  const uApt = await prisma.user.create({ data: { email: `u_apt_${Date.now()}@test.so`, name: "User Apt", role: "CUSTOMER", password: "dummy_password_hash" } });
  const uVilla = await prisma.user.create({ data: { email: `u_villa_${Date.now()}@test.so`, name: "User Villa", role: "CUSTOMER", password: "dummy_password_hash" } });
  const uLand = await prisma.user.create({ data: { email: `u_land_${Date.now()}@test.so`, name: "User Land", role: "CUSTOMER", password: "dummy_password_hash" } });

  for (const p of aptProps) {
    await prisma.userInteraction.create({ data: { userId: uApt.id, propertyId: p.id, eventType: "FAVORITE", weight: 4.0 } });
  }
  for (const p of villaProps) {
    await prisma.userInteraction.create({ data: { userId: uVilla.id, propertyId: p.id, eventType: "FAVORITE", weight: 4.0 } });
  }
  for (const p of landProps) {
    await prisma.userInteraction.create({ data: { userId: uLand.id, propertyId: p.id, eventType: "FAVORITE", weight: 4.0 } });
  }

  const profApt = await buildUserProfile(uApt.id, { forceRefresh: true });
  const profVilla = await buildUserProfile(uVilla.id, { forceRefresh: true });
  const profLand = await buildUserProfile(uLand.id, { forceRefresh: true });

  const vApt = profApt.semanticVector;
  const vVilla = profVilla.semanticVector;
  const vLand = profLand.semanticVector;

  const simMatrix = {
    "Apt-Apt": vApt ? cosineSimilarity(vApt, vApt) : 0,
    "Apt-Villa": vApt && vVilla ? cosineSimilarity(vApt, vVilla) : 0,
    "Apt-Land": vApt && vLand ? cosineSimilarity(vApt, vLand) : 0,
    "Villa-Villa": vVilla ? cosineSimilarity(vVilla, vVilla) : 0,
    "Villa-Land": vVilla && vLand ? cosineSimilarity(vVilla, vLand) : 0,
    "Land-Land": vLand ? cosineSimilarity(vLand, vLand) : 0,
  };

  log("D2: Cross-User Vector Distinctness (3x3 Matrix)", {
    norms: {
      aptNorm: vApt ? l2Norm(vApt) : 0,
      villaNorm: vVilla ? l2Norm(vVilla) : 0,
      landNorm: vLand ? l2Norm(vLand) : 0,
    },
    pairwiseCosineSimilarity: [
      { pair: "Apt vs Apt", cosine: simMatrix["Apt-Apt"] },
      { pair: "Apt vs Villa", cosine: simMatrix["Apt-Villa"] },
      { pair: "Apt vs Land", cosine: simMatrix["Apt-Land"] },
      { pair: "Villa vs Villa", cosine: simMatrix["Villa-Villa"] },
      { pair: "Villa vs Land", cosine: simMatrix["Villa-Land"] },
      { pair: "Land vs Land", cosine: simMatrix["Land-Land"] },
    ],
  });

  // ----------------------------------------------------
  // SECTION D3: Global Profile Degeneracy Test
  // ----------------------------------------------------
  // Reconstruct union profile across all 3 users
  const allCandidateProps = await prisma.property.findMany({
    where: { status: "APPROVED" },
    include: { embedding: true, images: { take: 1 } },
  });

  const rankOwn = rankPropertiesPersonalized(allCandidateProps, profApt, {}, { topN: 5 }).map(r => r.propertyId);

  const uUnion = await prisma.user.create({ data: { email: `u_union_${Date.now()}@test.so`, name: "User Union", role: "CUSTOMER", password: "dummy_password_hash" } });
  for (const p of [...aptProps, ...villaProps, ...landProps]) {
    await prisma.userInteraction.create({ data: { userId: uUnion.id, propertyId: p.id, eventType: "FAVORITE", weight: 4.0 } });
  }
  const profUnion = await buildUserProfile(uUnion.id, { forceRefresh: true });
  const rankUnion = rankPropertiesPersonalized(allCandidateProps, profUnion, {}, { topN: 5 }).map(r => r.propertyId);

  log("D3: Global-Profile Degeneracy Test", {
    ownRankTop5: rankOwn,
    unionRankTop5: rankUnion,
    areIdentical: JSON.stringify(rankOwn) === JSON.stringify(rankUnion),
  });

  const uThreshold = await prisma.user.create({ data: { email: `u_thresh_${Date.now()}@test.so`, name: "User Thresh", role: "CUSTOMER", password: "dummy_password_hash" } });
  const coldProfileInitial = await buildUserProfile(uThreshold.id, { forceRefresh: true });
  const initialOrdering = rankPropertiesPersonalized(allCandidateProps, coldProfileInitial, {}, { topN: 5 }).map(r => r.propertyId);

  let activationInteractionsCount = 0;
  let orderingChanged = false;
  let activationWeight = 0;
  let activationConfidence = 0;

  for (let i = 0; i < 10; i++) {
    await prisma.userInteraction.create({
      data: {
        userId: uThreshold.id,
        propertyId: villaProps[0].id,
        eventType: "VIEW", // 1.0 weight each
        weight: 1.0,
      },
    });

    const currProfile = await buildUserProfile(uThreshold.id, { forceRefresh: true });
    const currOrdering = rankPropertiesPersonalized(allCandidateProps, currProfile, {}, { topN: 5 }).map(r => r.propertyId);

    if (JSON.stringify(currOrdering) !== JSON.stringify(initialOrdering) && !orderingChanged) {
      orderingChanged = true;
      activationInteractionsCount = i + 1;
      activationWeight = currProfile.totalWeight;
      activationConfidence = currProfile.confidence;
      break;
    }
  }

  log("D5: Cold-Start Activation Threshold", {
    initialOrdering,
    orderingChanged,
    interactionCountAtFirstChange: activationInteractionsCount,
    accumulatedWeightAtChange: activationWeight,
    confidenceAtChange: activationConfidence,
    documentedMinWeight: BEHAVIORAL_CONFIG.MIN_PERSONALIZATION_WEIGHT,
  });

  // ----------------------------------------------------
  // SECTION B3 & B4: Leave-Last-Out (LLO) Protocol & 4 Baselines
  // ----------------------------------------------------
  // Construct 5 test users with K=5 interactions each
  const lloUsers = [];
  const propertyPool = allCandidateProps;

  // Let's create 5 synthetic users with distinct preferences
  const typePool = ["HOUSE", "APARTMENT", "VILLA", "COMMERCIAL", "LAND"];
  for (let uIdx = 0; uIdx < 5; uIdx++) {
    const u = await prisma.user.create({
      data: { email: `llo_user_${uIdx}_${Date.now()}@test.so`, name: `LLO User ${uIdx}`, role: "CUSTOMER", password: "dummy_password_hash" }
    });
    lloUsers.push(u);

    const targetType = typePool[uIdx % typePool.length];
    const candidateOfType = propertyPool.filter(p => p.type === targetType);
    const chosen = candidateOfType.length >= 5 ? candidateOfType.slice(0, 5) : propertyPool.slice(0, 5);

    // Create 5 interactions with increasing timestamps
    for (let step = 0; step < 5; step++) {
      const pastTime = new Date(Date.now() - (5 - step) * 3600 * 1000);
      await prisma.userInteraction.create({
        data: {
          userId: u.id,
          propertyId: chosen[step].id,
          eventType: step === 4 ? "INQUIRY" : "FAVORITE",
          weight: step === 4 ? 5.0 : 4.0,
          createdAt: pastTime,
        }
      });
    }
  }

  // Run LLO Protocol:
  // For each user, hide the 5th (most recent) interaction.
  // Build profile from remaining 4 interactions.
  // Rank full pool of 28 properties. Record rank of held-out 5th property.
  const lloResults = [];
  const baselineResults = {
    random: { hr5: 0, mrr: 0, ndcg5: 0 },
    popularity: { hr5: 0, mrr: 0, ndcg5: 0 },
    semanticOnly: { hr5: 0, mrr: 0, ndcg5: 0 },
    additiveStructural: { hr5: 0, mrr: 0, ndcg5: 0 },
    personalized: { hr5: 0, mrr: 0, ndcg5: 0 },
  };

  // Popularity map across all interactions
  const allInterCounts = await prisma.userInteraction.groupBy({
    by: ["propertyId"],
    _count: { id: true },
  });
  const popMap: Record<string, number> = {};
  for (const c of allInterCounts) {
    if (c.propertyId) popMap[c.propertyId] = c._count.id;
  }

  for (const u of lloUsers) {
    const allUserInteractions = await prisma.userInteraction.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: "asc" },
    });

    const heldOut = allUserInteractions[allUserInteractions.length - 1];
    const trainingInters = allUserInteractions.slice(0, allUserInteractions.length - 1);

    // Rebuild profile strictly without held-out
    // Temporarily delete heldOut, build profile, restore
    await prisma.userInteraction.delete({ where: { id: heldOut.id } });
    const profileNoHeldOut = await buildUserProfile(u.id, { forceRefresh: true });

    // 1. Personalized Ranking
    const rankedPersonalized = rankPropertiesPersonalized(propertyPool, profileNoHeldOut, {}, { topN: propertyPool.length });
    const personalRankIdx = rankedPersonalized.findIndex(r => r.propertyId === heldOut.propertyId) + 1;

    // 2. Random Baseline
    const randomOrder = [...propertyPool].sort(() => Math.random() - 0.5);
    const randomRankIdx = randomOrder.findIndex(p => p.id === heldOut.propertyId) + 1;

    // 3. Popularity Baseline
    const popOrder = [...propertyPool].sort((a, b) => (popMap[b.id] || 0) - (popMap[a.id] || 0));
    const popRankIdx = popOrder.findIndex(p => p.id === heldOut.propertyId) + 1;

    // 4. Semantic-Only Baseline (using mean embedding of training interactions vs candidate embedding)
    const semRanked = [...propertyPool].sort((a, b) => {
      const simA = profileNoHeldOut.semanticVector && a.embedding?.embedding ? cosineSimilarity(profileNoHeldOut.semanticVector, JSON.parse(a.embedding.embedding)) : 0;
      const simB = profileNoHeldOut.semanticVector && b.embedding?.embedding ? cosineSimilarity(profileNoHeldOut.semanticVector, JSON.parse(b.embedding.embedding)) : 0;
      return simB - simA;
    });
    const semRankIdx = semRanked.findIndex(p => p.id === heldOut.propertyId) + 1;

    // 5. Additive Structural Baseline (city match + type match only, no vector)
    const structRanked = [...propertyPool].sort((a, b) => {
      let scoreA = (profileNoHeldOut.preferredCities[a.city] || 0) * 30 + (profileNoHeldOut.preferredTypes[a.type] || 0) * 30;
      let scoreB = (profileNoHeldOut.preferredCities[b.city] || 0) * 30 + (profileNoHeldOut.preferredTypes[b.type] || 0) * 30;
      return scoreB - scoreA;
    });
    const structRankIdx = structRanked.findIndex(p => p.id === heldOut.propertyId) + 1;

    // Re-insert heldOut
    await prisma.userInteraction.create({
      data: {
        id: heldOut.id,
        userId: heldOut.userId,
        propertyId: heldOut.propertyId,
        eventType: heldOut.eventType,
        weight: heldOut.weight,
        createdAt: heldOut.createdAt,
      },
    });

    const hr5P = personalRankIdx <= 5 ? 1 : 0;
    const mrrP = personalRankIdx > 0 ? 1 / personalRankIdx : 0;
    const ndcg5P = personalRankIdx <= 5 ? 1 / Math.log2(personalRankIdx + 1) : 0;

    lloResults.push({
      userId: u.id,
      heldOutPropertyId: heldOut.propertyId,
      personalizedRank: personalRankIdx,
      hr5: hr5P,
      reciprocalRank: Math.round(mrrP * 1000) / 1000,
      ndcg5: Math.round(ndcg5P * 1000) / 1000,
      baselines: {
        randomRank: randomRankIdx,
        popRank: popRankIdx,
        semRank: semRankIdx,
        structRank: structRankIdx,
      }
    });

    // Accumulate metrics
    function acc(target: any, rank: number) {
      if (rank <= 5) {
        target.hr5 += 1;
        target.ndcg5 += 1 / Math.log2(rank + 1);
      }
      target.mrr += 1 / rank;
    }

    acc(baselineResults.personalized, personalRankIdx);
    acc(baselineResults.random, randomRankIdx);
    acc(baselineResults.popularity, popRankIdx);
    acc(baselineResults.semanticOnly, semRankIdx);
    acc(baselineResults.additiveStructural, structRankIdx);
  }

  const nLLO = lloUsers.length;
  for (const k of Object.keys(baselineResults) as (keyof typeof baselineResults)[]) {
    baselineResults[k].hr5 = Math.round((baselineResults[k].hr5 / nLLO) * 1000) / 1000;
    baselineResults[k].mrr = Math.round((baselineResults[k].mrr / nLLO) * 1000) / 1000;
    baselineResults[k].ndcg5 = Math.round((baselineResults[k].ndcg5 / nLLO) * 1000) / 1000;
  }

  log("B3: LLO Per-User Raw Results (N=5)", lloResults);
  log("B4: Baselines vs Personalized (N=5)", baselineResults);

  // ----------------------------------------------------
  // SECTION C3: Ordering-Equality Test between Routes
  // ----------------------------------------------------
  // Compare /api/user/recommendations vs /api/ai/recommendations
  const legacyRecs = await generateRecommendations({ userId: lloUsers[0].id }, 5);
  const aiRecs = rankPropertiesPersonalized(propertyPool, await buildUserProfile(lloUsers[0].id), {}, { topN: 5 });

  const legacyOrder = legacyRecs.map(r => r.property.id);
  const aiOrder = aiRecs.map(r => r.propertyId);

  log("C3: Route Ordering Equality (/api/user/recs vs /api/ai/recs)", {
    legacyOrdering: legacyOrder,
    aiOrdering: aiOrder,
    isEqual: JSON.stringify(legacyOrder) === JSON.stringify(aiOrder),
  });

  // Clean up all synthetic test users
  for (const u of [...lloUsers, uApt, uVilla, uLand, uUnion, uThreshold]) {
    await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
  }

  const finalInteractionsCount = await prisma.userInteraction.count();
  const finalProfilesCount = await prisma.userPreferenceProfile.count();
  log("CLEANUP: Final DB Row Counts", {
    userInteractionsCount: finalInteractionsCount,
    userPreferenceProfilesCount: finalProfilesCount,
  });

  const outPath = path.join(process.cwd(), "verification", "phase2c_audit_raw.txt");
  fs.writeFileSync(outPath, logLines.join("\n"), "utf8");
  console.log(`Phase 2C audit raw output written to ${outPath}`);

  await prisma.$disconnect();
}

main().catch(console.error);
