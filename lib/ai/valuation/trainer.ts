/**
 * Model Training, Benchmarking & Model Artifact Serialization Pipeline
 * Phase 3 — Real Estate AI
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  RawPropertyRecord,
  ModelArtifact,
  EvaluationMetrics,
} from "./types";
import {
  createDataSplits,
  buildDatasetMatrices,
  extractRawFeatures,
  fitScaler,
  standardizeVector,
} from "./preprocessor";
import {
  calculateRegressionMetrics,
  evaluateGlobalMedianBaseline,
  evaluateLocationTypeBaseline,
  evaluatePricePerAreaBaseline,
} from "./metrics";
import { RidgeRegressor } from "./models/linear-regression";
import { DecisionTreeRegressor } from "./models/decision-tree";
import { RandomForestRegressor } from "./models/random-forest";
import { GradientBoostingRegressor } from "./models/gradient-boosting";

export interface BenchmarkReport {
  timestamp: string;
  datasetSize: number;
  trainSize: number;
  valSize: number;
  testSize: number;
  baselines: {
    globalMedian: EvaluationMetrics;
    locationTypeMedian: EvaluationMetrics;
    pricePerArea: EvaluationMetrics;
  };
  candidateModels: {
    name: string;
    trainMetrics: EvaluationMetrics;
    valMetrics: EvaluationMetrics;
    testMetrics: EvaluationMetrics;
  }[];
  selectedModel: string;
  artifactPath: string;
  readinessVerdict: "RESEARCH_EXPERIMENTAL" | "PRODUCTION_READY";
}

/**
 * Fetch approved property records from database
 */
export async function fetchApprovedPropertyDataset(): Promise<RawPropertyRecord[]> {
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

  return properties.map((p) => ({
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
}

/**
 * Execute full reproducible training and benchmarking pipeline
 */
export async function runTrainingPipeline(
  recordsInput?: RawPropertyRecord[]
): Promise<BenchmarkReport> {
  const records = recordsInput || (await fetchApprovedPropertyDataset());

  if (records.length < 10) {
    throw new Error(
      `Insufficient dataset size for ML training: ${records.length} records. Minimum required: 10.`
    );
  }

  // 1. Create Train / Val / Test Splits (Anti-Leakage enforced)
  const { train, val, test } = createDataSplits(records, 0.2, 0.1);

  // 2. Build feature matrices and fit scaler strictly on train set
  const {
    X_train,
    y_train,
    X_val,
    y_val,
    X_test,
    y_test,
    schema,
  } = buildDatasetMatrices(train, val, test);

  // 3. Evaluate Baselines on Held-out Test Set
  const baseGlobal = evaluateGlobalMedianBaseline(train, test);
  const baseLocType = evaluateLocationTypeBaseline(train, test);
  const basePriceArea = evaluatePricePerAreaBaseline(train, test);

  // 4. Candidate Model 1: Ridge Regression
  const ridge = new RidgeRegressor(1.0);
  ridge.fit(X_train, y_train, schema.featureNames);
  const ridgeTrainPred = ridge.predict(X_train);
  const ridgeValPred = ridge.predict(X_val);
  const ridgeTestPred = ridge.predict(X_test);

  const ridgeTrainMetrics = calculateRegressionMetrics(y_train, ridgeTrainPred);
  const ridgeValMetrics = calculateRegressionMetrics(y_val, ridgeValPred);
  const ridgeTestMetrics = calculateRegressionMetrics(y_test, ridgeTestPred);

  // 5. Candidate Model 2: Decision Tree Regressor
  const dt = new DecisionTreeRegressor(4, 2);
  dt.fit(X_train, y_train, schema.featureNames);
  const dtTrainPred = dt.predict(X_train);
  const dtValPred = dt.predict(X_val);
  const dtTestPred = dt.predict(X_test);

  const dtTrainMetrics = calculateRegressionMetrics(y_train, dtTrainPred);
  const dtValMetrics = calculateRegressionMetrics(y_val, dtValPred);
  const dtTestMetrics = calculateRegressionMetrics(y_test, dtTestPred);

  // 6. Candidate Model 3: Random Forest Regressor
  const rf = new RandomForestRegressor(15, 4, 2, 42);
  rf.fit(X_train, y_train, schema.featureNames);
  const rfTrainPred = rf.predict(X_train);
  const rfValPred = rf.predict(X_val);
  const rfTestPred = rf.predict(X_test);

  const rfTrainMetrics = calculateRegressionMetrics(y_train, rfTrainPred);
  const rfValMetrics = calculateRegressionMetrics(y_val, rfValPred);
  const rfTestMetrics = calculateRegressionMetrics(y_test, rfTestPred);

  // 7. Candidate Model 4: Gradient Boosted Trees (GBDT)
  const gb = new GradientBoostingRegressor(15, 0.1, 3, 2);
  gb.fit(X_train, y_train, schema.featureNames);
  const gbTrainPred = gb.predict(X_train);
  const gbValPred = gb.predict(X_val);
  const gbTestPred = gb.predict(X_test);

  const gbTrainMetrics = calculateRegressionMetrics(y_train, gbTrainPred);
  const gbValMetrics = calculateRegressionMetrics(y_val, gbValPred);
  const gbTestMetrics = calculateRegressionMetrics(y_test, gbTestPred);

  // Candidate summary
  const candidates = [
    {
      name: "RidgeRegression",
      model: ridge,
      trainMetrics: ridgeTrainMetrics,
      valMetrics: ridgeValMetrics,
      testMetrics: ridgeTestMetrics,
    },
    {
      name: "DecisionTree",
      model: dt,
      trainMetrics: dtTrainMetrics,
      valMetrics: dtValMetrics,
      testMetrics: dtTestMetrics,
    },
    {
      name: "RandomForest",
      model: rf,
      trainMetrics: rfTrainMetrics,
      valMetrics: rfValMetrics,
      testMetrics: rfTestMetrics,
    },
    {
      name: "GradientBoosting",
      model: gb,
      trainMetrics: gbTrainMetrics,
      valMetrics: gbValMetrics,
      testMetrics: gbTestMetrics,
    },
  ];

  // Pre-declared algorithm: Ridge Regression (lambda = 1.0, 22 features)
  // Tournament model selection on test RMSE eliminated in accordance with Audit F3
  const winner = candidates[0];

  // Calculate residual standard error on train set
  const trainPreds = winner.model.predict(X_train);
  const resVar =
    trainPreds.reduce((s, p, i) => s + Math.pow(y_train[i] - p, 2), 0) /
    Math.max(1, train.length - 2);
  const residualStdError = Math.round(Math.sqrt(resVar));

  // Compute LOOCV over all N usable records
  const N = records.length;
  const loocvAbsErrors: number[] = [];
  const loocvSqErrors: number[] = [];
  const loocvPctErrors: number[] = [];

  for (let k = 0; k < N; k++) {
    const testRec = records[k];
    const trainRecs = records.filter((_, idx) => idx !== k);
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
    rFold.fit(X_tr, y_tr, schema.featureNames);
    const p = Math.max(15000, rFold.predictOne(X_te));
    const absErr = Math.abs(testRec.price - p);
    loocvAbsErrors.push(absErr);
    loocvPctErrors.push((absErr / testRec.price) * 100);
    loocvSqErrors.push(Math.pow(testRec.price - p, 2));
  }

  const loocvMAE = loocvAbsErrors.reduce((s, e) => s + e, 0) / N;
  const loocvRMSE = Math.sqrt(loocvSqErrors.reduce((s, e) => s + e, 0) / N);
  const loocvMAPE = loocvPctErrors.reduce((s, e) => s + e, 0) / N;
  const meanAllActual = records.reduce((s, r) => s + r.price, 0) / N;
  const sstAll = records.reduce((s, r) => s + Math.pow(r.price - meanAllActual, 2), 0);
  const sseLoocv = loocvSqErrors.reduce((s, e) => s + e, 0);
  const loocvR2 = 1 - sseLoocv / sstAll;

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

  // Determine readiness verdict honestly
  const readinessVerdict =
    records.length >= 100 && winner.testMetrics.r2 > 0.6
      ? ("PRODUCTION_READY" as const)
      : ("RESEARCH_EXPERIMENTAL" as const);

  // 8. Serialize Winning Model Artifact v2 (Do NOT overwrite model-artifact.json)
  const datasetHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(records.map((r) => [r.id, r.price])))
    .digest("hex")
    .slice(0, 16);

  let modelParams = (winner.model as RidgeRegressor).weights!;
  let featureImportances = (winner.model as RidgeRegressor).getFeatureImportances();

  const artifactV2: any = {
    modelId: `valuation-${winner.name.toLowerCase()}-v2`,
    modelVersion: "2.0.0",
    modelType: winner.name as any,
    trainedAt: new Date().toISOString(),
    datasetHash,
    sampleCount: records.length,
    trainCount: train.length,
    valCount: val.length,
    testCount: test.length,
    schema,
    parameters: modelParams,
    trainMetrics: winner.trainMetrics,
    valMetrics: winner.valMetrics,
    testMetrics: winner.testMetrics,
    baselineMetrics: {
      globalMedian: baseGlobal.metrics,
      locationTypeMedian: baseLocType.metrics,
      pricePerArea: basePriceArea.metrics,
    },
    evaluation: {
      loocv: {
        mae: Math.round(loocvMAE * 100) / 100,
        rmse: Math.round(loocvRMSE * 100) / 100,
        mape: Math.round(loocvMAPE * 100) / 100,
        r2cv: Math.round(loocvR2 * 10000) / 10000,
        nFolds: N,
      },
      holdout: {
        mae: winner.testMetrics.mae,
        rmse: winner.testMetrics.rmse,
        mape: winner.testMetrics.mape,
        r2: winner.testMetrics.r2,
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
    featureImportances,
    residualStdError,
    readinessVerdict,
  };

  const artifactPath = path.join(
    process.cwd(),
    "lib",
    "ai",
    "valuation",
    "model-artifact.v2.json"
  );
  fs.writeFileSync(artifactPath, JSON.stringify(artifactV2, null, 2), "utf8");

  return {
    timestamp: artifactV2.trainedAt,
    datasetSize: records.length,
    trainSize: train.length,
    valSize: val.length,
    testSize: test.length,
    baselines: {
      globalMedian: baseGlobal.metrics,
      locationTypeMedian: baseLocType.metrics,
      pricePerArea: basePriceArea.metrics,
    },
    candidateModels: candidates.map((c) => ({
      name: c.name,
      trainMetrics: c.trainMetrics,
      valMetrics: c.valMetrics,
      testMetrics: c.testMetrics,
    })),
    selectedModel: winner.name,
    artifactPath,
    readinessVerdict,
  };
}
