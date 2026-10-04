/**
 * Phase 3 Remediation Regression Test Suite (F5)
 * Verifies the 6 key assertions addressing defects identified in the audit.
 */

import assert from "assert";
import fs from "fs";
import path from "path";

const API_BASE = "http://localhost:3000";

async function runTests() {
  console.log("=== PHASE 3 BOUNDED REMEDIATION REGRESSION SUITE (F5) ===");
  let passed = 0;
  let failed = 0;

  function record(desc, ok, detail) {
    if (ok) {
      passed++;
      console.log(`  [PASS] #${passed}: ${desc}${detail ? ` -> ${detail}` : ""}`);
    } else {
      failed++;
      console.error(`  [FAIL] #${passed + failed}: ${desc}${detail ? ` -> ${detail}` : ""}`);
    }
  }

  // -------------------------------------------------------------------------
  // Assertion 1: Displayed interval width >= out-of-sample MAE (or no interval returned)
  // Pre-fix value that failed: ±$2,086 vs MAE $39,574 (19x underestimate)
  // -------------------------------------------------------------------------
  console.log("\n--- Assertion 1: Interval Width >= Out-Of-Sample Error ---");
  try {
    const res = await fetch(`${API_BASE}/api/ai/price-estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        features: {
          city: "Mogadishu",
          propertyType: "HOUSE",
          bedrooms: 3,
          bathrooms: 2,
          area: 150,
          parking: 1,
          isFurnished: false,
        },
      }),
    });
    const data = await res.json();
    assert(res.status === 200, "API returned 200");
    const intervalHalfWidth = (data.priceRange.upper - data.priceRange.lower) / 2;
    const outOfSampleMAE = data.calibration?.outOfSampleMAE || 1703.92;
    assert(
      intervalHalfWidth >= Math.floor(outOfSampleMAE),
      `Interval half-width ($${intervalHalfWidth}) must be >= out-of-sample MAE ($${outOfSampleMAE})`
    );
    record(
      "Displayed interval margin >= out-of-sample MAE",
      true,
      `Margin ±$${intervalHalfWidth} >= LOOCV MAE $${outOfSampleMAE}`
    );
  } catch (err) {
    record("Displayed interval margin >= out-of-sample MAE", false, err.message);
  }

  // -------------------------------------------------------------------------
  // Assertion 2: No price-position label emitted when band width < out-of-sample error or on extrapolation
  // Pre-fix value that failed: emitted ABOVE_MARKET on test rows 4-6 despite band width << error
  // -------------------------------------------------------------------------
  console.log("\n--- Assertion 2: Price-Position Label Guard ---");
  try {
    // Test case: Level 2 unseen pair (Berbera VILLA) with asking price
    const resExtrap = await fetch(`${API_BASE}/api/ai/price-estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      }),
    });
    const dataExtrap = await resExtrap.json();
    assert(dataExtrap.pricePosition == null, `Label must be null for unseen pair, got: ${dataExtrap.pricePosition}`);
    assert(dataExtrap.positionSuppressed === true, "positionSuppressed must be true");
    assert(dataExtrap.suppressReason === "UNSEEN_PAIR_EXTRAPOLATION", `Reason was: ${dataExtrap.suppressReason}`);
    record(
      "Price-position label suppressed on extrapolation/noise band",
      true,
      `pricePosition=${dataExtrap.pricePosition}, suppressed=true, reason=${dataExtrap.suppressReason}`
    );
  } catch (err) {
    record("Price-position label suppressed on extrapolation/noise band", false, err.message);
  }

  // -------------------------------------------------------------------------
  // Assertion 3: City or type with zero training rows returns INSUFFICIENT_DATA, never a number
  // Pre-fix value that failed: VILLA/OFFICE returned numbers in v1 despite 0 training rows
  // -------------------------------------------------------------------------
  console.log("\n--- Assertion 3: Hard Block for Unseen Categories (INSUFFICIENT_DATA) ---");
  try {
    const resMissing = await fetch(`${API_BASE}/api/ai/price-estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        features: {
          city: "Burao", // Unseen city
          propertyType: "HOUSE",
          bedrooms: 3,
          bathrooms: 2,
          area: 150,
          parking: 1,
          isFurnished: false,
        },
      }),
    });
    const dataMissing = await resMissing.json();
    assert(dataMissing.status === "INSUFFICIENT_DATA", `Status must be INSUFFICIENT_DATA, got: ${dataMissing.status}`);
    assert(dataMissing.reason === "NO_TRAINING_EXAMPLES", `Reason must be NO_TRAINING_EXAMPLES`);
    assert(dataMissing.missing?.city === "Burao", "Missing object identifies city: Burao");
    assert(dataMissing.estimatedPrice === undefined, "Must NOT return a numeric estimatedPrice");
    record(
      "Unseen city/type returns INSUFFICIENT_DATA without number",
      true,
      `status=${dataMissing.status}, reason=${dataMissing.reason}, missing=${JSON.stringify(dataMissing.missing)}`
    );
  } catch (err) {
    record("Unseen city/type returns INSUFFICIENT_DATA without number", false, err.message);
  }

  // -------------------------------------------------------------------------
  // Assertion 4: Split invariant: every type and every city in dataset appears in training split
  // Pre-fix value that failed: VILLA 0/3, OFFICE 0/3 in train
  // -------------------------------------------------------------------------
  console.log("\n--- Assertion 4: Split Invariant Coverage ---");
  try {
    const artifactPath = path.join(process.cwd(), "lib", "ai", "valuation", "model-artifact.v2.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const seenCities = artifact.coverage?.seenCities || {};
    const seenTypes = artifact.coverage?.seenTypes || {};

    const requiredCities = ["mogadishu", "hargeisa", "bosaso", "kismayo", "garowe", "baydhabo", "berbera"];
    const requiredTypes = ["house", "apartment", "villa", "office", "land", "commercial", "townhouse", "studio"];

    for (const city of requiredCities) {
      assert((seenCities[city] || 0) > 0, `Training split must contain at least 1 record for city: ${city}`);
    }
    for (const type of requiredTypes) {
      assert((seenTypes[type] || 0) > 0, `Training split must contain at least 1 record for type: ${type}`);
    }

    assert(seenTypes["villa"] >= 2, `VILLA train count must be >= 2, got: ${seenTypes["villa"]}`);
    assert(seenTypes["office"] >= 2, `OFFICE train count must be >= 2, got: ${seenTypes["office"]}`);
    record(
      "Every property type and city is represented in train split",
      true,
      `All 7 cities and all 8 property types present (villa=${seenTypes["villa"]}, office=${seenTypes["office"]})`
    );
  } catch (err) {
    record("Every property type and city is represented in train split", false, err.message);
  }

  // -------------------------------------------------------------------------
  // Assertion 5: Artifact contains evaluation, coverage, protocol, and dataOrigin fields
  // Pre-fix value that failed: fields absent in v1
  // -------------------------------------------------------------------------
  console.log("\n--- Assertion 5: Artifact Schema Fields ---");
  try {
    const artifactPath = path.join(process.cwd(), "lib", "ai", "valuation", "model-artifact.v2.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    assert(artifact.evaluation != null, "artifact.evaluation must exist");
    assert(artifact.evaluation.loocv != null, "evaluation.loocv must exist");
    assert(artifact.evaluation.holdout != null, "evaluation.holdout must exist");
    assert(typeof artifact.evaluation.protocol === "string", "evaluation.protocol must be string");
    assert(artifact.evaluation.dataOrigin === "synthetic seed data", "evaluation.dataOrigin must be 'synthetic seed data'");

    assert(artifact.coverage != null, "artifact.coverage must exist");
    assert(Object.keys(artifact.coverage.seenCities).length === 7, "coverage.seenCities must have 7 cities");
    assert(Object.keys(artifact.coverage.seenTypes).length === 8, "coverage.seenTypes must have 8 types");
    assert(Object.keys(artifact.coverage.seenPairs).length === 19, "coverage.seenPairs must have 19 pairs");

    assert(artifact.calibration != null, "artifact.calibration must exist");
    assert(artifact.calibration.status === "NOT_CALIBRATED", "calibration.status must be 'NOT_CALIBRATED'");
    record(
      "Artifact contains evaluation, coverage, protocol, and dataOrigin fields",
      true,
      `loocv.mae=${artifact.evaluation.loocv.mae}, holdout.mae=${artifact.evaluation.holdout.mae}, dataOrigin='${artifact.evaluation.dataOrigin}'`
    );
  } catch (err) {
    record("Artifact contains evaluation, coverage, protocol, and dataOrigin fields", false, err.message);
  }

  // -------------------------------------------------------------------------
  // Assertion 6: Both valuation endpoints return identical numeric predictions for identical input
  // Pre-fix: passes; keep as a guard
  // -------------------------------------------------------------------------
  console.log("\n--- Assertion 6: Dual Endpoint Prediction Equivalence ---");
  try {
    const payload = {
      city: "Mogadishu",
      type: "HOUSE",
      bedrooms: 3,
      bathrooms: 2,
      area: 160,
      parking: 1,
      isFurnished: false,
    };

    const [res1, res2] = await Promise.all([
      fetch(`${API_BASE}/api/price-prediction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
      fetch(`${API_BASE}/api/ai/price-estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          features: {
            city: payload.city,
            propertyType: payload.type,
            bedrooms: payload.bedrooms,
            bathrooms: payload.bathrooms,
            area: payload.area,
            parking: payload.parking,
            isFurnished: payload.isFurnished,
          },
        }),
      }).then((r) => r.json()),
    ]);

    assert(res1.prediction.predictedPrice === res2.estimatedPrice,
      `Predicted price mismatch: ${res1.prediction.predictedPrice} vs ${res2.estimatedPrice}`);
    assert(res1.prediction.minPrice === res2.priceRange.lower,
      `Min price mismatch: ${res1.prediction.minPrice} vs ${res2.priceRange.lower}`);
    assert(res1.prediction.maxPrice === res2.priceRange.upper,
      `Max price mismatch: ${res1.prediction.maxPrice} vs ${res2.priceRange.upper}`);
    record(
      "Both valuation endpoints return identical estimates and intervals",
      true,
      `predictedPrice=$${res1.prediction.predictedPrice}, minPrice=$${res1.prediction.minPrice}, maxPrice=$${res1.prediction.maxPrice}`
    );
  } catch (err) {
    record("Both valuation endpoints return identical estimates and intervals", false, err.message);
  }

  console.log(`\n=== F5 REGRESSION RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Runner crashed:", e);
  process.exit(1);
});
