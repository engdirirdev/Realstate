import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { estimatePropertyPrice, getOrLoadModelArtifact } from "../lib/ai/valuation/valuation-service";

async function main() {
  console.log("=== PHASE 3 REMEDIATION VERIFICATION SCRIPT ===");

  const artifact = await getOrLoadModelArtifact();
  console.log("Active Model Version:", artifact.modelVersion);
  console.log("Residual Std Error (train):", artifact.residualStdError);
  console.log("Evaluation LOOCV MAE:", artifact.evaluation?.loocv?.mae);
  console.log("Evaluation Holdout MAE:", artifact.evaluation?.holdout?.mae);
  console.log("Seen Cities Count:", Object.keys(artifact.coverage?.seenCities || {}).length);
  console.log("Seen Types Count:", Object.keys(artifact.coverage?.seenTypes || {}).length);
  console.log("Seen Pairs Count:", Object.keys(artifact.coverage?.seenPairs || {}).length);

  // 1. Audit 6 Test Properties from the Audit
  // Audit test row indices: 23, 24, 25, 26, 27, 28 (Mogadishu HOUSE, Hargeisa HOUSE, Bosaso STUDIO, Kismayo VILLA, Garowe VILLA, Baydhabo OFFICE)
  const auditTestProperties = [
    { city: "Mogadishu", type: "HOUSE", bedrooms: 4, bathrooms: 3, area: 250, price: 120000, labelBefore: "FAIRLY_PRICED" },
    { city: "Hargeisa", type: "HOUSE", bedrooms: 3, bathrooms: 2, area: 180, price: 110000, labelBefore: "FAIRLY_PRICED" },
    { city: "Bosaso", type: "STUDIO", bedrooms: 1, bathrooms: 1, area: 45, price: 28000, labelBefore: "FAIRLY_PRICED" },
    { city: "Kismayo", type: "VILLA", bedrooms: 5, bathrooms: 4, area: 350, price: 185000, labelBefore: "ABOVE_MARKET" },
    { city: "Garowe", type: "VILLA", bedrooms: 4, bathrooms: 4, area: 320, price: 175000, labelBefore: "ABOVE_MARKET" },
    { city: "Baydhabo", type: "OFFICE", bedrooms: 2, bathrooms: 2, area: 120, price: 75000, labelBefore: "BELOW_MARKET" },
  ];

  console.log("\n--- Per-row computation on audit's 6 test properties ---");
  const testResults = [];
  let emittedCount = 0;

  for (const p of auditTestProperties) {
    const res = await estimatePropertyPrice({
      features: {
        city: p.city,
        propertyType: p.type,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        area: p.area,
        parking: 1,
        isFurnished: false,
      },
      askingPrice: p.price,
    });

    const est = res.estimatedPrice;
    const bandWidth = 0.10 * est;
    const outOfSampleError = res.calibration?.outOfSampleMAE || 1703.92;
    const labelAfter = res.pricePosition || (res.positionSuppressed ? `SUPPRESSED (${res.suppressReason})` : "NONE");

    if (res.pricePosition) {
      emittedCount++;
    }

    testResults.push({
      property: `${p.city} ${p.type}`,
      actualPrice: p.price,
      estimate: est,
      bandWidthUSD: bandWidth,
      outOfSampleError,
      labelBefore: p.labelBefore,
      labelAfter,
      isSuppressed: res.positionSuppressed,
      suppressReason: res.suppressReason,
      isUnseenPair: !!res.pairCoverage,
    });
  }

  console.table(testResults);
  console.log(`Label emission on 6 test rows: ${emittedCount}/6 (${((emittedCount / 6) * 100).toFixed(1)}%) emit a label.`);

  // 2. Exact breakdown of all 28 APPROVED properties
  const allApproved = await prisma.property.findMany({
    where: { status: "APPROVED" },
    select: { id: true, city: true, type: true, price: true, bedrooms: true, bathrooms: true, area: true },
  });

  let level1Count = 0;
  let level2Count = 0;
  let neitherCount = 0;

  for (const prop of allApproved) {
    const res = await estimatePropertyPrice({
      propertyId: prop.id,
      askingPrice: prop.price,
    });

    if ((res as any).status === "INSUFFICIENT_DATA") {
      level1Count++;
    } else if (res.pairCoverage && res.pairCoverage.trainRowsForPair === 0) {
      level2Count++;
    } else {
      neitherCount++;
    }
  }

  console.log("\n--- Coverage Breakdown across all 28 APPROVED properties ---");
  console.log(`Total Properties: ${allApproved.length}`);
  console.log(`Level 1 (Hard Block - INSUFFICIENT_DATA): ${level1Count}/${allApproved.length} (${((level1Count / allApproved.length) * 100).toFixed(1)}%)`);
  console.log(`Level 2 (Soft Warning - Unseen Pair): ${level2Count}/${allApproved.length} (${((level2Count / allApproved.length) * 100).toFixed(1)}%)`);
  console.log(`Neither (Seen Pair in Training Split): ${neitherCount}/${allApproved.length} (${((neitherCount / allApproved.length) * 100).toFixed(1)}%)`);

  // 3. Level 1 Unseen-Individually Test
  console.log("\n--- Level 1 Unseen-Individually Test (City: Burao) ---");
  const level1Res = await estimatePropertyPrice({
    features: {
      city: "Burao",
      propertyType: "HOUSE",
      bedrooms: 3,
      bathrooms: 2,
      area: 150,
      parking: 1,
      isFurnished: false,
    },
    askingPrice: 85000,
  });
  console.log("Level 1 Response:", JSON.stringify(level1Res, null, 2));

  // 4. Level 2 Unseen-Pair Test (Berbera VILLA)
  console.log("\n--- Level 2 Unseen-Pair Test (Berbera VILLA) ---");
  const level2Res = await estimatePropertyPrice({
    features: {
      city: "Berbera",
      propertyType: "VILLA",
      bedrooms: 4,
      bathrooms: 3,
      area: 280,
      parking: 1,
      isFurnished: false,
    },
    askingPrice: 160000,
  });
  console.log("Level 2 Response:", JSON.stringify(level2Res, null, 2));

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
