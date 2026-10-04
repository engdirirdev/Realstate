/**
 * Comprehensive Evidence-Only Audit Harness for Phase 3 ML Valuation
 * real_estate_ai — Verification Script
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

// Import valuation modules
import {
  KNOWN_CITIES,
  KNOWN_PROPERTY_TYPES,
  NUMERICAL_FEATURE_KEYS,
  extractRawFeatures,
  getFeatureNames,
  standardizeVector,
  fitScaler,
  createDataSplits,
  buildDatasetMatrices,
} from "../lib/ai/valuation/preprocessor";

import {
  calculateRegressionMetrics,
  evaluateGlobalMedianBaseline,
  evaluateLocationTypeBaseline,
  evaluatePricePerAreaBaseline,
} from "../lib/ai/valuation/metrics";

import { RidgeRegressor } from "../lib/ai/valuation/models/linear-regression";
import { DecisionTreeRegressor } from "../lib/ai/valuation/models/decision-tree";
import { RandomForestRegressor } from "../lib/ai/valuation/models/random-forest";
import { GradientBoostingRegressor } from "../lib/ai/valuation/models/gradient-boosting";
import { classifyPricePosition } from "../lib/ai/valuation/valuation-service";
import { RawPropertyRecord, EvaluationMetrics } from "../lib/ai/valuation/types";

const prisma = new PrismaClient();

async function main() {
  console.log("================================================================================");
  console.log("  PHASE 3: EVIDENCE-ONLY AUDIT & BENCHMARK HARNESS");
  console.log("  Date & Time: " + new Date().toISOString());
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // 1. DATASET QUERY & TARGET VARIABLE AUDIT (Section C)
  // ---------------------------------------------------------------------------
  console.log("=== SECTION C: DATASET QUERY & TARGET AUDIT ===");
  const allProperties = await prisma.property.findMany({
    select: {
      id: true,
      title: true,
      price: true,
      city: true,
      type: true,
      bedrooms: true,
      bathrooms: true,
      area: true,
      parking: true,
      isFurnished: true,
      yearBuilt: true,
      createdAt: true,
      status: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Total properties in DB: ${allProperties.length}`);
  const statusCounts: Record<string, number> = {};
  for (const p of allProperties) {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  }
  console.log("Status distribution:", JSON.stringify(statusCounts));

  const approved = allProperties.filter((p) => p.status === "APPROVED");
  console.log(`Approved properties usable (N): ${approved.length}\n`);

  // Date range check
  const createdDates = approved.map((p) => p.createdAt.toISOString());
  createdDates.sort();
  console.log(`Earliest createdAt: ${createdDates[0]}`);
  console.log(`Latest createdAt:   ${createdDates[createdDates.length - 1]}`);
  const uniqueDates = new Set(createdDates.map((d) => d.slice(0, 10)));
  console.log(`Unique creation dates (YYYY-MM-DD):`, Array.from(uniqueDates));

  // ---------------------------------------------------------------------------
  // 2. SPLIT INTEGRITY & SEEDING (Section E)
  // ---------------------------------------------------------------------------
  console.log("\n=== SECTION E: SPLIT INTEGRITY & REPRODUCIBILITY ===");
  const rawRecords: RawPropertyRecord[] = approved.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    city: p.city,
    type: p.type,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: p.area,
    parking: p.parking,
    isFurnished: p.isFurnished,
    yearBuilt: p.yearBuilt,
    createdAt: p.createdAt,
    status: p.status,
  }));

  const { train, val, test } = createDataSplits(rawRecords, 0.2, 0.1);
  console.log(`Train count: ${train.length}, Val count: ${val.length}, Test count: ${test.length}`);

  // Test set IDs
  console.log("Test set IDs:", test.map((t) => t.id));

  // Check categories in splits
  const trainCities = new Set(train.map((r) => r.city.toLowerCase()));
  const testCities = new Set(test.map((r) => r.city.toLowerCase()));
  const trainTypes = new Set(train.map((r) => r.type.toLowerCase()));
  const testTypes = new Set(test.map((r) => r.type.toLowerCase()));

  console.log("\nTrain distinct cities:", Array.from(trainCities));
  console.log("Test distinct cities:", Array.from(testCities));
  const unseenCitiesInTest = Array.from(testCities).filter((c) => !trainCities.has(c));
  console.log("Unseen cities in test:", unseenCitiesInTest.length > 0 ? unseenCitiesInTest : "None");

  console.log("\nTrain distinct types:", Array.from(trainTypes));
  console.log("Test distinct types:", Array.from(testTypes));
  const unseenTypesInTest = Array.from(testTypes).filter((t) => !trainTypes.has(t));
  console.log("Unseen types in test:", unseenTypesInTest.length > 0 ? unseenTypesInTest : "None");

  // Print full table of training rows (Section C4)
  console.log("\n--- Full Training Set (n=19) ---");
  console.log("ID\tCity\tType\tBeds\tBaths\tArea\tPrice");
  for (const r of train) {
    console.log(`${r.id}\t${r.city}\t${r.type}\t${r.bedrooms}\t${r.bathrooms}\t${r.area}\t$${r.price.toLocaleString()}`);
  }

  // Print full table of test rows
  console.log("\n--- Full Test Set (n=6) ---");
  console.log("ID\tCity\tType\tBeds\tBaths\tArea\tPrice");
  for (const r of test) {
    console.log(`${r.id}\t${r.city}\t${r.type}\t${r.bedrooms}\t${r.bathrooms}\t${r.area}\t$${r.price.toLocaleString()}`);
  }

  // Print validation rows (n=3)
  console.log("\n--- Full Validation Set (n=3) ---");
  console.log("ID\tCity\tType\tBeds\tBaths\tArea\tPrice");
  for (const r of val) {
    console.log(`${r.id}\t${r.city}\t${r.type}\t${r.bedrooms}\t${r.bathrooms}\t${r.area}\t$${r.price.toLocaleString()}`);
  }

  // ---------------------------------------------------------------------------
  // 3. BUILD MATRICES & EVALUATE ON REPORTED TEST SET (Section A)
  // ---------------------------------------------------------------------------
  console.log("\n=== SECTION A: COMPLETE THE METRIC SET (n=6) ===");
  const {
    X_train,
    y_train,
    X_val,
    y_val,
    X_test,
    y_test,
    schema,
  } = buildDatasetMatrices(train, val, test);

  console.log(`Number of features p: ${schema.featureNames.length}`);
  console.log(`Number of training rows n: ${X_train.length}`);

  // Target variance check on test set (A2)
  const n_test = y_test.length;
  const mean_test = y_test.reduce((s, y) => s + y, 0) / n_test;
  const sst_test = y_test.reduce((s, y) => s + Math.pow(y - mean_test, 2), 0);
  const var_test = sst_test / (n_test - 1);
  const std_test = Math.sqrt(var_test);

  console.log(`Test set target prices:`, y_test);
  console.log(`Test set mean: $${mean_test.toFixed(2)}`);
  console.log(`Test set target variance (sample var): $${var_test.toFixed(2)}`);
  console.log(`Test set SST (sum of squared deviations from test mean): $${sst_test.toFixed(2)}`);
  console.log(`Test set standard deviation: $${std_test.toFixed(2)}`);

  // Fit Ridge Regression
  const ridge = new RidgeRegressor(1.0);
  ridge.fit(X_train, y_train, schema.featureNames);
  const ridgePreds = ridge.predict(X_test);
  const ridgeMetrics = calculateRegressionMetrics(y_test, ridgePreds);

  const sse_ridge = y_test.reduce((s, y, i) => s + Math.pow(y - ridgePreds[i], 2), 0);
  const r2_ridge_calculated = 1 - sse_ridge / sst_test;

  console.log(`\nRidge Test Predictions:`, ridgePreds.map((p) => Math.round(p)));
  console.log(`Ridge SSE: $${sse_ridge.toFixed(2)}`);
  console.log(`Ridge R² arithmetic: 1 - (${sse_ridge.toFixed(2)} / ${sst_test.toFixed(2)}) = ${r2_ridge_calculated.toFixed(4)}`);
  console.log(`Reported Ridge Metrics: MAE=$${ridgeMetrics.mae}, RMSE=$${ridgeMetrics.rmse}, MAPE=${ridgeMetrics.mape}%, R²=${ridgeMetrics.r2}`);

  // Constant-predictor baseline predicting TRAIN MEAN (A3)
  const mean_train = y_train.reduce((s, y) => s + y, 0) / y_train.length;
  const meanTrainPreds = y_test.map(() => mean_train);
  const meanTrainMetrics = calculateRegressionMetrics(y_test, meanTrainPreds);
  const sse_meanTrain = y_test.reduce((s, y) => s + Math.pow(y - mean_train, 2), 0);
  const r2_meanTrain = 1 - sse_meanTrain / sst_test;

  console.log(`\nTrain price mean: $${mean_train.toFixed(2)}`);
  console.log(`Constant Train-Mean Baseline Metrics on Test: MAE=$${meanTrainMetrics.mae}, RMSE=$${meanTrainMetrics.rmse}, MAPE=${meanTrainMetrics.mape}%, R²=${r2_meanTrain.toFixed(4)}`);
  console.log(`Ridge vs Constant Train-Mean: MAE difference = $${(ridgeMetrics.mae - meanTrainMetrics.mae).toFixed(2)}, RMSE difference = $${(ridgeMetrics.rmse - meanTrainMetrics.rmse).toFixed(2)}`);

  // ---------------------------------------------------------------------------
  // 4. CANDIDATE MODELS & BASELINES COMPARISON (Section B)
  // ---------------------------------------------------------------------------
  console.log("\n=== SECTION B: CANDIDATE MODELS & BASELINES (n=6) ===");

  // Candidate models
  const dt = new DecisionTreeRegressor(4, 2);
  dt.fit(X_train, y_train, schema.featureNames);
  const dtPreds = dt.predict(X_test);
  const dtMetrics = calculateRegressionMetrics(y_test, dtPreds);

  const rf = new RandomForestRegressor(15, 4, 2, 42);
  rf.fit(X_train, y_train, schema.featureNames);
  const rfPreds = rf.predict(X_test);
  const rfMetrics = calculateRegressionMetrics(y_test, rfPreds);

  const gb = new GradientBoostingRegressor(15, 0.1, 3, 2);
  gb.fit(X_train, y_train, schema.featureNames);
  const gbPreds = gb.predict(X_test);
  const gbMetrics = calculateRegressionMetrics(y_test, gbPreds);

  console.log("\nTable B2: All 4 Candidate ML Models on Held-out Test Set (n=6):");
  console.log("Model\t\t\tMAE\t\tRMSE\t\tMAPE (%)\tR²");
  console.log(`Ridge Regression\t$${ridgeMetrics.mae.toFixed(2)}\t$${ridgeMetrics.rmse.toFixed(2)}\t${ridgeMetrics.mape.toFixed(2)}%\t\t${ridgeMetrics.r2.toFixed(3)}`);
  console.log(`Decision Tree\t\t$${dtMetrics.mae.toFixed(2)}\t$${dtMetrics.rmse.toFixed(2)}\t${dtMetrics.mape.toFixed(2)}%\t\t${dtMetrics.r2.toFixed(3)}`);
  console.log(`Random Forest\t\t$${rfMetrics.mae.toFixed(2)}\t$${rfMetrics.rmse.toFixed(2)}\t${rfMetrics.mape.toFixed(2)}%\t\t${rfMetrics.r2.toFixed(3)}`);
  console.log(`Gradient Boosting\t$${gbMetrics.mae.toFixed(2)}\t$${gbMetrics.rmse.toFixed(2)}\t${gbMetrics.mape.toFixed(2)}%\t\t${gbMetrics.r2.toFixed(3)}`);

  // Baselines
  const baseGlobal = evaluateGlobalMedianBaseline(train, test);
  const baseLocType = evaluateLocationTypeBaseline(train, test);
  const basePriceArea = evaluatePricePerAreaBaseline(train, test);

  console.log("\nTable B3: All 3 Baselines on Held-out Test Set (n=6):");
  console.log("Baseline\t\t\tMAE\t\tRMSE\t\tMAPE (%)\tR²");
  console.log(`Global Median\t\t\t$${baseGlobal.metrics.mae.toFixed(2)}\t$${baseGlobal.metrics.rmse.toFixed(2)}\t${baseGlobal.metrics.mape.toFixed(2)}%\t\t${baseGlobal.metrics.r2.toFixed(3)}`);
  console.log(`Location/Type Median\t\t$${baseLocType.metrics.mae.toFixed(2)}\t$${baseLocType.metrics.rmse.toFixed(2)}\t${baseLocType.metrics.mape.toFixed(2)}%\t\t${baseLocType.metrics.r2.toFixed(3)}`);
  console.log(`Price per m²\t\t\t$${basePriceArea.metrics.mae.toFixed(2)}\t$${basePriceArea.metrics.rmse.toFixed(2)}\t${basePriceArea.metrics.mape.toFixed(2)}%\t\t${basePriceArea.metrics.r2.toFixed(3)}`);

  // Paired per-sample errors on 6 test rows (B4)
  console.log("\nTable B4: Paired Per-Sample Absolute Errors on Test Set (n=6):");
  console.log("Row\tActual\t\tRidge Pred\t|Err_Ridge|\tGlobalMed\t|Err_GMed|\tLocTypeMed\t|Err_LTMed|\tPrice/m²\t|Err_P/m²|");
  const testGlobalPred = test.map(() => baseGlobal.median);
  const testLocPred = test.map((r) => {
    const k = `${r.city.toLowerCase()}__${r.type.toLowerCase()}`;
    return baseLocType.table[k] ?? baseGlobal.median;
  });
  const testAreaPred = test.map((r) => r.area * basePriceArea.medianRate);

  const ridgeAbsErrors: number[] = [];
  const gmedAbsErrors: number[] = [];
  const pairedDiffs: number[] = [];

  for (let i = 0; i < n_test; i++) {
    const act = y_test[i];
    const rPred = ridgePreds[i];
    const rErr = Math.abs(act - rPred);
    const gPred = testGlobalPred[i];
    const gErr = Math.abs(act - gPred);
    const ltPred = testLocPred[i];
    const ltErr = Math.abs(act - ltPred);
    const aPred = testAreaPred[i];
    const aErr = Math.abs(act - aPred);

    ridgeAbsErrors.push(rErr);
    gmedAbsErrors.push(gErr);
    pairedDiffs.push(gErr - rErr);

    console.log(
      `${i + 1}\t$${act.toLocaleString()}\t$${Math.round(rPred).toLocaleString()}\t$${Math.round(rErr).toLocaleString()}\t` +
      `$${Math.round(gPred).toLocaleString()}\t$${Math.round(gErr).toLocaleString()}\t` +
      `$${Math.round(ltPred).toLocaleString()}\t$${Math.round(ltErr).toLocaleString()}\t` +
      `$${Math.round(aPred).toLocaleString()}\t$${Math.round(aErr).toLocaleString()}`
    );
  }

  // Spread of paired differences
  const meanPairedDiff = pairedDiffs.reduce((s, d) => s + d, 0) / n_test;
  const varPairedDiff = pairedDiffs.reduce((s, d) => s + Math.pow(d - meanPairedDiff, 2), 0) / (n_test - 1);
  const stdPairedDiff = Math.sqrt(varPairedDiff);
  console.log(`\nPaired Differences (GlobalMedian_Err - Ridge_Err):`, pairedDiffs.map((d) => Math.round(d)));
  console.log(`Mean paired difference (MAE gap): $${meanPairedDiff.toFixed(2)}`);
  console.log(`Standard deviation of paired differences: $${stdPairedDiff.toFixed(2)}`);
  console.log(`Is MAE gap ($${meanPairedDiff.toFixed(2)}) larger than spread (std = $${stdPairedDiff.toFixed(2)})? ${meanPairedDiff > stdPairedDiff ? "YES" : "NO"}`);

  // ---------------------------------------------------------------------------
  // 5. LEAVE-ONE-OUT CROSS-VALIDATION (LOOCV) ACROSS ALL N=28 (Section B5)
  // ---------------------------------------------------------------------------
  console.log("\n=== SECTION B5: LEAVE-ONE-OUT CROSS-VALIDATION (LOOCV, N=28) ===");
  const loocvResults: {
    fold: number;
    id: string;
    city: string;
    type: string;
    actual: number;
    ridgePred: number;
    ridgeAbsErr: number;
    ridgePctErr: number;
    basePred: number;
    baseAbsErr: number;
    basePctErr: number;
  }[] = [];

  const N = rawRecords.length;

  for (let k = 0; k < N; k++) {
    const testRecord = rawRecords[k];
    const trainRecords = rawRecords.filter((_, idx) => idx !== k);

    // Extract raw features for 27 train rows
    const X_train_raw = trainRecords.map((r) =>
      extractRawFeatures({
        area: r.area,
        bedrooms: r.bedrooms,
        bathrooms: r.bathrooms,
        parking: r.parking || 0,
        isFurnished: !!r.isFurnished,
        city: r.city,
        propertyType: r.type,
      })
    );
    const y_train_fold = trainRecords.map((r) => r.price);

    // Scaler fit strictly on 27 train rows
    const scaler_fold = fitScaler(X_train_raw);

    const X_train_fold = X_train_raw.map((x) => standardizeVector(x, scaler_fold.mean, scaler_fold.std));

    // Test row
    const X_test_raw_one = extractRawFeatures({
      area: testRecord.area,
      bedrooms: testRecord.bedrooms,
      bathrooms: testRecord.bathrooms,
      parking: testRecord.parking || 0,
      isFurnished: !!testRecord.isFurnished,
      city: testRecord.city,
      propertyType: testRecord.type,
    });
    const X_test_fold = standardizeVector(X_test_raw_one, scaler_fold.mean, scaler_fold.std);

    // Train Ridge (lambda = 1.0)
    const ridge_fold = new RidgeRegressor(1.0);
    ridge_fold.fit(X_train_fold, y_train_fold, getFeatureNames());
    const pred_ridge = Math.max(15000, ridge_fold.predictOne(X_test_fold));

    // Strongest baseline on the 27 train rows: Global Median
    const sortedPrices = trainRecords.map((r) => r.price).sort((a, b) => a - b);
    const midIdx = Math.floor(sortedPrices.length / 2);
    const median_train_fold =
      sortedPrices.length % 2 === 0
        ? (sortedPrices[midIdx - 1] + sortedPrices[midIdx]) / 2
        : sortedPrices[midIdx];

    const absErrRidge = Math.abs(testRecord.price - pred_ridge);
    const pctErrRidge = (absErrRidge / testRecord.price) * 100;

    const absErrBase = Math.abs(testRecord.price - median_train_fold);
    const pctErrBase = (absErrBase / testRecord.price) * 100;

    loocvResults.push({
      fold: k + 1,
      id: testRecord.id,
      city: testRecord.city,
      type: testRecord.type,
      actual: testRecord.price,
      ridgePred: pred_ridge,
      ridgeAbsErr: absErrRidge,
      ridgePctErr: pctErrRidge,
      basePred: median_train_fold,
      baseAbsErr: absErrBase,
      basePctErr: pctErrBase,
    });
  }

  console.log("Fold\tCity\tType\tActual\t\tRidge Pred\t|Ridge Err|\tRidge MAPE\tBase Pred\t|Base Err|\tBase MAPE");
  for (const f of loocvResults) {
    console.log(
      `${f.fold}\t${f.city.padEnd(9)}\t${f.type.padEnd(10)}\t$${f.actual.toLocaleString().padStart(7)}\t` +
      `$${Math.round(f.ridgePred).toLocaleString().padStart(7)}\t$${Math.round(f.ridgeAbsErr).toLocaleString().padStart(7)}\t` +
      `${f.ridgePctErr.toFixed(1)}%\t` +
      `$${Math.round(f.basePred).toLocaleString().padStart(7)}\t$${Math.round(f.baseAbsErr).toLocaleString().padStart(7)}\t` +
      `${f.basePctErr.toFixed(1)}%`
    );
  }

  // LOOCV summary metrics
  const loocvRidgeMAE = loocvResults.reduce((s, r) => s + r.ridgeAbsErr, 0) / N;
  const loocvRidgeSqErr = loocvResults.map((r) => Math.pow(r.actual - r.ridgePred, 2));
  const loocvRidgeRMSE = Math.sqrt(loocvRidgeSqErr.reduce((s, e) => s + e, 0) / N);
  const loocvRidgeMAPE = loocvResults.reduce((s, r) => s + r.ridgePctErr, 0) / N;

  const loocvBaseMAE = loocvResults.reduce((s, r) => s + r.baseAbsErr, 0) / N;
  const loocvBaseSqErr = loocvResults.map((r) => Math.pow(r.actual - r.basePred, 2));
  const loocvBaseRMSE = Math.sqrt(loocvBaseSqErr.reduce((s, e) => s + e, 0) / N);
  const loocvBaseMAPE = loocvResults.reduce((s, r) => s + r.basePctErr, 0) / N;

  // Standard deviation across fold absolute errors
  const varRidgeAbs = loocvResults.reduce((s, r) => s + Math.pow(r.ridgeAbsErr - loocvRidgeMAE, 2), 0) / (N - 1);
  const stdRidgeAbs = Math.sqrt(varRidgeAbs);

  const varBaseAbs = loocvResults.reduce((s, r) => s + Math.pow(r.baseAbsErr - loocvBaseMAE, 2), 0) / (N - 1);
  const stdBaseAbs = Math.sqrt(varBaseAbs);

  // Cross-validated R²: 1 - sum(e_k^2) / sum((y_k - y_bar)^2)
  const meanAllActual = rawRecords.reduce((s, r) => s + r.price, 0) / N;
  const sstAll = rawRecords.reduce((s, r) => s + Math.pow(r.price - meanAllActual, 2), 0);
  const sseLoocvRidge = loocvRidgeSqErr.reduce((s, e) => s + e, 0);
  const sseLoocvBase = loocvBaseSqErr.reduce((s, e) => s + e, 0);

  const loocvR2Ridge = 1 - sseLoocvRidge / sstAll;
  const loocvR2Base = 1 - sseLoocvBase / sstAll;

  console.log("\n--- LOOCV Summary Comparison (N=28) ---");
  console.log(`Ridge Regression LOOCV MAE:  $${loocvRidgeMAE.toFixed(2)} ± $${stdRidgeAbs.toFixed(2)}`);
  console.log(`Ridge Regression LOOCV RMSE: $${loocvRidgeRMSE.toFixed(2)}`);
  console.log(`Ridge Regression LOOCV MAPE: ${loocvRidgeMAPE.toFixed(2)}%`);
  console.log(`Ridge Regression LOOCV R²:   ${loocvR2Ridge.toFixed(4)} (Method: 1 - SSE_cv / SST_all)`);

  console.log(`\nGlobal Median LOOCV MAE:     $${loocvBaseMAE.toFixed(2)} ± $${stdBaseAbs.toFixed(2)}`);
  console.log(`Global Median LOOCV RMSE:    $${loocvBaseRMSE.toFixed(2)}`);
  console.log(`Global Median LOOCV MAPE:    ${loocvBaseMAPE.toFixed(2)}%`);
  console.log(`Global Median LOOCV R²:      ${loocvR2Base.toFixed(4)}`);

  // Section B6: Statistical significance (Wilcoxon signed-rank test on LOOCV pairs)
  console.log("\n--- Section B6: Statistical Significance ---");
  const pairedDiffsLOOCV = loocvResults.map((r) => r.baseAbsErr - r.ridgeAbsErr); // positive means Ridge did better
  console.log(`Number of pairs N = ${pairedDiffsLOOCV.length}`);
  const positivePairs = pairedDiffsLOOCV.filter((d) => d > 0).length;
  const negativePairs = pairedDiffsLOOCV.filter((d) => d < 0).length;
  const zeroPairs = pairedDiffsLOOCV.filter((d) => d === 0).length;
  console.log(`Ridge wins: ${positivePairs}, Median Baseline wins: ${negativePairs}, Ties: ${zeroPairs}`);

  // Wilcoxon signed-rank calculation
  const nonZeroDiffs = loocvResults
    .map((r) => ({ diff: r.baseAbsErr - r.ridgeAbsErr, absDiff: Math.abs(r.baseAbsErr - r.ridgeAbsErr) }))
    .filter((d) => d.absDiff > 0);

  nonZeroDiffs.sort((a, b) => a.absDiff - b.absDiff);
  // assign ranks
  let rankSumPositive = 0;
  let rankSumNegative = 0;
  for (let i = 0; i < nonZeroDiffs.length; i++) {
    const rank = i + 1; // simplified unique ranks
    if (nonZeroDiffs[i].diff > 0) rankSumPositive += rank;
    else rankSumNegative += rank;
  }
  const W = Math.min(rankSumPositive, rankSumNegative);
  console.log(`Wilcoxon signed-rank test: W+ = ${rankSumPositive}, W- = ${rankSumNegative}, Test Statistic W = ${W}, n = ${nonZeroDiffs.length}`);

  // ---------------------------------------------------------------------------
  // 6. PRICE POSITION LABELS & ARITHMETIC AUDIT (Section D)
  // ---------------------------------------------------------------------------
  console.log("\n=== SECTION D: PRICE POSITION LABELS: GO / NO-GO ===");
  const medianEstimatedPrice = 65000;
  const bandMargin10Pct = medianEstimatedPrice * 0.10;
  const totalBandWidth = bandMargin10Pct * 2; // [-10%, +10%] is a 20% range = $13,000
  console.log(`Typical property median estimate: $${medianEstimatedPrice.toLocaleString()}`);
  console.log(`±10% band margin: ±$${bandMargin10Pct.toLocaleString()} (from $${(medianEstimatedPrice - bandMargin10Pct).toLocaleString()} to $${(medianEstimatedPrice + bandMargin10Pct).toLocaleString()})`);
  console.log(`Total width of ±10% band: $${totalBandWidth.toLocaleString()}`);
  console.log(`Reported Model Test MAE: $${ridgeMetrics.mae.toLocaleString()}`);
  console.log(`Reported Model Test RMSE: $${ridgeMetrics.rmse.toLocaleString()}`);
  console.log(`Band width ($${totalBandWidth.toLocaleString()}) vs Model MAE ($${ridgeMetrics.mae.toLocaleString()}): Band is ${(ridgeMetrics.mae / totalBandWidth).toFixed(1)}x SMALLER than MAE!`);

  // Misclassification fraction on test set
  console.log("\nTable D3: Misclassification Analysis on Test Set (n=6):");
  console.log("Row\tActual\t\tEstimate\tDifference\tPctDiff\tModel Label\tTrue Label\tMatch?");
  let mislabeledCount = 0;
  for (let i = 0; i < n_test; i++) {
    const actual = y_test[i];
    const estimate = ridgePreds[i];
    const diff = Math.round(actual - estimate);
    const pctDiff = Math.round((diff / estimate) * 1000) / 10;

    // Model label based on asking price = actual price vs estimate
    const modelClass = classifyPricePosition(actual, estimate);

    // What would be the "true label" if we knew true value?
    // Since actual asking price is itself the label, if actual == estimate, it would be FAIRLY_PRICED.
    // But estimate is off by ~$39.5k.
    // If the estimate is $94,849 and actual is $145,000: model says ABOVE_MARKET (+52.9%).
    // But what if true market value is $145,000? Then it's actually FAIRLY_PRICED!
    const trueLabel = "FAIRLY_PRICED"; // ground truth benchmark
    const isMis = modelClass.position !== trueLabel;
    if (isMis) mislabeledCount++;

    console.log(
      `${i + 1}\t$${actual.toLocaleString().padStart(7)}\t$${Math.round(estimate).toLocaleString().padStart(7)}\t` +
      `$${diff.toLocaleString().padStart(7)}\t${pctDiff.toFixed(1).padStart(6)}%\t` +
      `${modelClass.position.padEnd(14)}\t${trueLabel.padEnd(14)}\t${!isMis ? "YES" : "NO (MISCLASSIFIED)"}`
    );
  }
  console.log(`Mislabeled fraction against baseline assumption: ${mislabeledCount} / ${n_test} (${((mislabeledCount / n_test) * 100).toFixed(1)}%)`);

  // ---------------------------------------------------------------------------
  // 7. MODEL ARTIFACT HASH & METADATA (Section E7)
  // ---------------------------------------------------------------------------
  console.log("\n=== SECTION E7: MODEL ARTIFACT FILE HASH & METADATA ===");
  const artifactPath = path.join(process.cwd(), "lib", "ai", "valuation", "model-artifact.json");
  const artifactRaw = fs.readFileSync(artifactPath, "utf8");
  const artifactHash = crypto.createHash("sha256").update(artifactRaw).digest("hex");
  const artifactStats = fs.statSync(artifactPath);
  console.log(`Artifact path: ${artifactPath}`);
  console.log(`Artifact SHA-256: ${artifactHash}`);
  console.log(`Artifact Last Modified: ${artifactStats.mtime.toISOString()}`);
  console.log(`Artifact Size: ${artifactStats.size} bytes`);

  // ---------------------------------------------------------------------------
  // 8. TENSORFLOW RESIDUE & USER FACING CLAIMS (Section F6)
  // ---------------------------------------------------------------------------
  console.log("\n=== SECTION F6: USER-FACING COPY CLAIMS AUDIT ===");
  const pricePredictionPagePath = path.join(process.cwd(), "app", "(public)", "price-prediction", "page.tsx");
  const pageContent = fs.readFileSync(pricePredictionPagePath, "utf8");
  const tfMatch = pageContent.match(/.*TensorFlow\.js.*/);
  console.log("Found in app/(public)/price-prediction/page.tsx:");
  console.log(tfMatch ? tfMatch[0].trim() : "None");

  console.log("\n================================================================================");
  console.log("  AUDIT MEASUREMENTS COMPLETE");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
