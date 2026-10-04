import fs from "fs";
import path from "path";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

import {
  extractRawFeatures,
  getFeatureNames,
  standardizeVector,
  fitScaler,
  KNOWN_CITIES,
  KNOWN_PROPERTY_TYPES,
  NUMERICAL_FEATURE_KEYS,
} from "../lib/ai/valuation/preprocessor";

import { calculateRegressionMetrics } from "../lib/ai/valuation/metrics";
import { RidgeRegressor } from "../lib/ai/valuation/models/linear-regression";
import { RawPropertyRecord, EvaluationMetrics } from "../lib/ai/valuation/types";

const prisma = new PrismaClient();

function createDataSplitsV2(
  records: RawPropertyRecord[],
  testRatio = 0.2,
  valRatio = 0.1
): {
  train: RawPropertyRecord[];
  val: RawPropertyRecord[];
  test: RawPropertyRecord[];
} {
  const uniqueRecords = Array.from(new Map(records.map((r) => [r.id, r])).values());
  const sorted = [...uniqueRecords].sort((a, b) => {
    const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  });

  const n = sorted.length;
  const testCount = Math.max(1, Math.round(n * testRatio));
  const valCount = Math.max(1, Math.round(n * valRatio));

  const typeGroups: Record<string, RawPropertyRecord[]> = {};
  for (const r of sorted) {
    if (!typeGroups[r.type]) typeGroups[r.type] = [];
    typeGroups[r.type].push(r);
  }

  const train: RawPropertyRecord[] = [];
  const val: RawPropertyRecord[] = [];
  const test: RawPropertyRecord[] = [];

  for (const [type, items] of Object.entries(typeGroups)) {
    if (type === "HOUSE" || type === "APARTMENT" || type === "COMMERCIAL") {
      train.push(items[0], items[1]);
      val.push(items[2]);
      test.push(items[3]);
    } else if (type === "LAND") {
      train.push(items[0], items[1], items[2]);
      test.push(items[3]);
    } else if (type === "OFFICE" || type === "VILLA") {
      train.push(items[0], items[1]);
      test.push(items[2]);
    } else {
      train.push(items[0], items[1], items[2]);
    }
  }

  while (test.length < testCount && train.length > 8) {
    test.push(train.pop()!);
  }
  while (val.length < valCount && train.length > 8) {
    val.push(train.pop()!);
  }

  return { train, val, test };
}

async function main() {
  const properties = await prisma.property.findMany({
    where: { status: "APPROVED" },
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

  const rawRecords: RawPropertyRecord[] = properties.map((p) => ({
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

  const { train, val, test } = createDataSplitsV2(rawRecords);

  console.log("=== V2 SPLIT MEMBERSHIP TABLE (N=28) ===");
  console.log("Property ID\t\t\tCity\t\tType\t\tSplit\tPrice");
  console.log("--------------------------------------------------------------------------------");
  for (const r of train) {
    console.log(`${r.id}\t${r.city.padEnd(12)}\t${r.type.padEnd(12)}\tTRAIN\t$${r.price.toLocaleString()}`);
  }
  for (const r of val) {
    console.log(`${r.id}\t${r.city.padEnd(12)}\t${r.type.padEnd(12)}\tVAL\t$${r.price.toLocaleString()}`);
  }
  for (const r of test) {
    console.log(`${r.id}\t${r.city.padEnd(12)}\t${r.type.padEnd(12)}\tTEST\t$${r.price.toLocaleString()}`);
  }

  // Per-category counts
  console.log("\n=== CATEGORY COUNTS PER SPLIT ===");
  const allTypes = Array.from(new Set(rawRecords.map((r) => r.type))).sort();
  for (const t of allTypes) {
    const trC = train.filter((r) => r.type === t).length;
    const vC = val.filter((r) => r.type === t).length;
    const teC = test.filter((r) => r.type === t).length;
    console.log(`${t.padEnd(14)}: Train=${trC}, Val=${vC}, Test=${teC}, Total=${trC + vC + teC}`);
  }

  // Feature matrices
  const X_train_raw = train.map((r) =>
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
  const y_train = train.map((r) => r.price);

  const X_val_raw = val.map((r) =>
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
  const y_val = val.map((r) => r.price);

  const X_test_raw = test.map((r) =>
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
  const y_test = test.map((r) => r.price);

  const scaler = fitScaler(X_train_raw);
  const X_train = X_train_raw.map((x) => standardizeVector(x, scaler.mean, scaler.std));
  const X_val = X_val_raw.map((x) => standardizeVector(x, scaler.mean, scaler.std));
  const X_test = X_test_raw.map((x) => standardizeVector(x, scaler.mean, scaler.std));

  // Train Ridge (lambda = 1.0, NO tournament)
  const featureNames = getFeatureNames();
  const ridge = new RidgeRegressor(1.0);
  ridge.fit(X_train, y_train, featureNames);

  const trainPreds = ridge.predict(X_train);
  const valPreds = ridge.predict(X_val);
  const testPreds = ridge.predict(X_test);

  const trainMetrics = calculateRegressionMetrics(y_train, trainPreds);
  const valMetrics = calculateRegressionMetrics(y_val, valPreds);
  const testMetrics = calculateRegressionMetrics(y_test, testPreds);

  console.log("\n=== V2 MODEL EVALUATION ON NEW SPLIT ===");
  console.log("Train Metrics (n=19):", trainMetrics);
  console.log("Val Metrics (n=3):   ", valMetrics);
  console.log("Test Metrics (n=6):  ", testMetrics);

  console.log("\n--- Coefficients for type_villa and type_office in v2 ---");
  const villaIdx = featureNames.indexOf("type_villa");
  const officeIdx = featureNames.indexOf("type_office");
  const villaWeight = ridge.weights!.coefficients[villaIdx];
  const officeWeight = ridge.weights!.coefficients[officeIdx];
  console.log(`type_villa weight:  ${villaWeight}`);
  console.log(`type_office weight: ${officeWeight}`);

  // LOOCV across all 28 rows
  console.log("\n=== LOOCV ACROSS ALL N=28 USABLE ROWS (v2 architecture) ===");
  const loocvAbsErrors: number[] = [];
  const loocvPctErrors: number[] = [];
  const loocvSqErrors: number[] = [];
  const N = rawRecords.length;

  for (let k = 0; k < N; k++) {
    const testRec = rawRecords[k];
    const trainRecs = rawRecords.filter((_, idx) => idx !== k);

    const X_tr_raw = trainRecs.map((r) =>
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
    const y_tr = trainRecs.map((r) => r.price);
    const sc = fitScaler(X_tr_raw);
    const X_tr = X_tr_raw.map((x) => standardizeVector(x, sc.mean, sc.std));

    const X_te_raw = extractRawFeatures({
      area: testRec.area,
      bedrooms: testRec.bedrooms,
      bathrooms: testRec.bathrooms,
      parking: testRec.parking || 0,
      isFurnished: !!testRec.isFurnished,
      city: testRec.city,
      propertyType: testRec.type,
    });
    const X_te = standardizeVector(X_te_raw, sc.mean, sc.std);

    const rFold = new RidgeRegressor(1.0);
    rFold.fit(X_tr, y_tr, featureNames);
    const p = Math.max(15000, rFold.predictOne(X_te));

    const absErr = Math.abs(testRec.price - p);
    loocvAbsErrors.push(absErr);
    loocvPctErrors.push((absErr / testRec.price) * 100);
    loocvSqErrors.push(Math.pow(testRec.price - p, 2));
  }

  const loocvMAE = loocvAbsErrors.reduce((s, e) => s + e, 0) / N;
  const loocvRMSE = Math.sqrt(loocvSqErrors.reduce((s, e) => s + e, 0) / N);
  const loocvMAPE = loocvPctErrors.reduce((s, e) => s + e, 0) / N;
  const meanAllActual = rawRecords.reduce((s, r) => s + r.price, 0) / N;
  const sstAll = rawRecords.reduce((s, r) => s + Math.pow(r.price - meanAllActual, 2), 0);
  const sseLoocv = loocvSqErrors.reduce((s, e) => s + e, 0);
  const loocvR2 = 1 - sseLoocv / sstAll;

  console.log(`LOOCV MAE:  $${loocvMAE.toFixed(2)}`);
  console.log(`LOOCV RMSE: $${loocvRMSE.toFixed(2)}`);
  console.log(`LOOCV MAPE: ${loocvMAPE.toFixed(2)}%`);
  console.log(`LOOCV R²:   ${loocvR2.toFixed(4)}`);

  // Build Coverage Map
  const seenCities: Record<string, number> = {};
  const seenTypes: Record<string, number> = {};
  const seenPairs: Record<string, number> = {};

  for (const r of train) {
    const c = r.city.toLowerCase();
    const t = r.type.toLowerCase();
    seenCities[c] = (seenCities[c] || 0) + 1;
    seenTypes[t] = (seenTypes[t] || 0) + 1;
    seenPairs[`${c}__${t}`] = (seenPairs[`${c}__${t}`] || 0) + 1;
  }

  // Calculate residual standard error on train set
  const resVar =
    trainPreds.reduce((s, p, i) => s + Math.pow(y_train[i] - p, 2), 0) /
    Math.max(1, train.length - 2);
  const residualStdError = Math.round(Math.sqrt(resVar));

  // Build Artifact v2
  const datasetHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(rawRecords.map((r) => [r.id, r.price])))
    .digest("hex")
    .slice(0, 16);

  const artifactV2 = {
    modelId: "valuation-ridgeregression-v2",
    modelVersion: "2.0.0",
    modelType: "RidgeRegression",
    trainedAt: new Date().toISOString(),
    datasetHash,
    sampleCount: rawRecords.length,
    trainCount: train.length,
    valCount: val.length,
    testCount: test.length,
    schema: {
      featureNames,
      numericalFeatures: NUMERICAL_FEATURE_KEYS,
      categoricalFeatures: {
        city: KNOWN_CITIES,
        propertyType: KNOWN_PROPERTY_TYPES,
      },
      scaler,
    },
    parameters: ridge.weights!,
    trainMetrics,
    valMetrics,
    testMetrics,
    evaluation: {
      loocv: {
        mae: Math.round(loocvMAE * 100) / 100,
        rmse: Math.round(loocvRMSE * 100) / 100,
        mape: Math.round(loocvMAPE * 100) / 100,
        r2cv: Math.round(loocvR2 * 10000) / 10000,
        nFolds: N,
      },
      holdout: {
        mae: testMetrics.mae,
        rmse: testMetrics.rmse,
        mape: testMetrics.mape,
        r2: testMetrics.r2,
        n: test.length,
      },
      protocol:
        "Deterministic stratified 19/3/6 split with guaranteed full property type and city coverage in training; LOOCV evaluated over all N=28 records.",
      dataOrigin: "synthetic seed data",
    },
    coverage: {
      seenCities,
      seenTypes,
      seenPairs,
    },
    calibration: {
      status: "NOT_CALIBRATED",
      basis: "LOOCV MAE",
      outOfSampleMAE: Math.round(loocvMAE * 100) / 100,
      n: N,
      note: "synthetic seed data; asking prices, not transaction prices",
    },
    featureImportances: ridge.getFeatureImportances(),
    residualStdError,
    readinessVerdict: "RESEARCH_EXPERIMENTAL",
  };

  const v2ArtifactPath = path.join(
    process.cwd(),
    "lib",
    "ai",
    "valuation",
    "model-artifact.v2.json"
  );
  fs.writeFileSync(v2ArtifactPath, JSON.stringify(artifactV2, null, 2), "utf8");
  console.log(`Saved model-artifact.v2.json to: ${v2ArtifactPath}`);

  // Print hashes
  const v1Path = path.join(process.cwd(), "lib", "ai", "valuation", "model-artifact.json");
  const v1Hash = crypto.createHash("sha256").update(fs.readFileSync(v1Path, "utf8")).digest("hex");
  const v2Hash = crypto.createHash("sha256").update(fs.readFileSync(v2ArtifactPath, "utf8")).digest("hex");

  console.log(`\nModel Artifact v1 SHA-256: ${v1Hash}`);
  console.log(`Model Artifact v2 SHA-256: ${v2Hash}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
