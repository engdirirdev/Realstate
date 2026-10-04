/**
 * AI Valuation Service — Core Price Intelligence & Comparable Analysis Engine
 * Phase 3 — Real Estate AI
 */

import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  ValuationFeatures,
  ValuationPredictionResult,
  ModelArtifact,
  PricePosition,
  PriceReliability,
  FeatureContribution,
  ComparableProperty,
} from "./types";
import {
  extractRawFeatures,
  standardizeVector,
  KNOWN_CITIES,
  KNOWN_PROPERTY_TYPES,
} from "./preprocessor";
import { RidgeRegressor } from "./models/linear-regression";
import { DecisionTreeRegressor } from "./models/decision-tree";
import { RandomForestRegressor } from "./models/random-forest";
import { GradientBoostingRegressor } from "./models/gradient-boosting";
import { runTrainingPipeline } from "./trainer";

let cachedArtifact: ModelArtifact | null = null;
let activePredictor: {
  predictOne: (x: number[]) => number | { mean: number; std: number };
  explain?: (x: number[]) => { feature: string; impactUSD: number }[];
} | null = null;

/**
 * Load or initialize trained model artifact
 */
export async function getOrLoadModelArtifact(): Promise<ModelArtifact> {
  if (cachedArtifact && activePredictor) {
    return cachedArtifact;
  }

  const artifactPath = path.join(
    process.cwd(),
    "lib",
    "ai",
    "valuation",
    "model-artifact.v2.json"
  );

  if (!fs.existsSync(artifactPath)) {
    // Automatically train initial model if artifact does not exist
    await runTrainingPipeline();
  }

  const rawJson = fs.readFileSync(artifactPath, "utf8");
  cachedArtifact = JSON.parse(rawJson) as ModelArtifact;

  // Re-instantiate model predictor from serialized weights
  if (cachedArtifact.modelType === "RidgeRegression") {
    const ridge = new RidgeRegressor();
    ridge.weights = cachedArtifact.parameters as any;
    activePredictor = {
      predictOne: (x) => ridge.predictOne(x),
      explain: (x) => ridge.explainPrediction(x),
    };
  } else if (cachedArtifact.modelType === "DecisionTree") {
    const tree = DecisionTreeRegressor.fromJSON(cachedArtifact.parameters as any);
    activePredictor = {
      predictOne: (x) => tree.predictOne(x),
    };
  } else if (cachedArtifact.modelType === "RandomForest") {
    const rf = RandomForestRegressor.fromJSON(cachedArtifact.parameters as any);
    activePredictor = {
      predictOne: (x) => rf.predictOneWithVariance(x),
    };
  } else if (cachedArtifact.modelType === "GradientBoosting") {
    const gb = GradientBoostingRegressor.fromJSON(cachedArtifact.parameters as any);
    activePredictor = {
      predictOne: (x) => gb.predictOne(x),
    };
  }

  return cachedArtifact;
}

/**
 * Assess market position of asking price relative to estimated valuation
 */
export function classifyPricePosition(
  askingPrice: number,
  estimatedPrice: number
): {
  position: PricePosition;
  diffUSD: number;
  percentageDiff: number;
  explanation: string;
} {
  const diffUSD = Math.round(askingPrice - estimatedPrice);
  const percentageDiff = Math.round((diffUSD / estimatedPrice) * 1000) / 10; // e.g. -12.4%

  let position: PricePosition;
  let explanation: string;

  if (percentageDiff < -10.0) {
    position = "BELOW_MARKET";
    explanation = `The asking price ($${askingPrice.toLocaleString()}) is ${Math.abs(
      percentageDiff
    )}% below the estimated market value ($${estimatedPrice.toLocaleString()}), representing strong investment value.`;
  } else if (percentageDiff > 10.0) {
    position = "ABOVE_MARKET";
    explanation = `The asking price ($${askingPrice.toLocaleString()}) is ${percentageDiff}% above the estimated market value ($${estimatedPrice.toLocaleString()}), commanding a premium over comparable listings.`;
  } else {
    position = "FAIRLY_PRICED";
    explanation = `The asking price ($${askingPrice.toLocaleString()}) is aligned with current market conditions (within ±10% of estimated $${estimatedPrice.toLocaleString()}).`;
  }

  return { position, diffUSD, percentageDiff, explanation };
}

/**
 * Find comparable properties in the database matching location, type, and dimensions
 */
export async function findComparableProperties(
  params: {
    city: string;
    type: string;
    area: number;
    bedrooms: number;
    bathrooms: number;
    targetPrice?: number;
    excludePropertyId?: string;
  },
  limit = 4
): Promise<ComparableProperty[]> {
  // Query strictly APPROVED properties
  const candidates = await prisma.property.findMany({
    where: {
      status: "APPROVED",
      id: params.excludePropertyId ? { not: params.excludePropertyId } : undefined,
    },
    select: {
      id: true,
      title: true,
      city: true,
      type: true,
      price: true,
      bedrooms: true,
      bathrooms: true,
      area: true,
    },
    take: 50,
  });

  if (candidates.length === 0) return [];

  // Score each candidate on physical comparability
  const scored = candidates.map((cand) => {
    let score = 0;

    // Exact city match: 40 points
    if (cand.city.toLowerCase() === params.city.toLowerCase()) {
      score += 40;
    }

    // Exact type match: 30 points
    if (cand.type.toLowerCase() === params.type.toLowerCase()) {
      score += 30;
    }

    // Bedroom proximity: max 15 points
    const bedDiff = Math.abs(cand.bedrooms - params.bedrooms);
    score += Math.max(0, 15 - bedDiff * 7.5);

    // Bathroom proximity: max 5 points
    const bathDiff = Math.abs(cand.bathrooms - params.bathrooms);
    score += Math.max(0, 5 - bathDiff * 2.5);

    // Area proximity: max 10 points
    const areaDiffRatio = Math.abs(cand.area - params.area) / Math.max(1, params.area);
    score += Math.max(0, 10 * (1 - Math.min(1, areaDiffRatio)));

    const variancePercent = params.targetPrice
      ? Math.round(((cand.price - params.targetPrice) / params.targetPrice) * 1000) / 10
      : 0;

    return {
      id: cand.id,
      title: cand.title,
      city: cand.city,
      type: cand.type,
      price: cand.price,
      bedrooms: cand.bedrooms,
      bathrooms: cand.bathrooms,
      area: cand.area,
      similarityScore: Math.round(score),
      priceVariancePercent: variancePercent,
    };
  });

  scored.sort((a, b) => b.similarityScore - a.similarityScore);
  return scored.slice(0, limit);
}

/**
 * Predict property price using trained ML model with uncertainty and explainability
 */
export async function estimatePropertyPrice(
  input: {
    propertyId?: string;
    features?: ValuationFeatures;
    askingPrice?: number;
  }
): Promise<ValuationPredictionResult> {
  const artifact = await getOrLoadModelArtifact();

  let features: ValuationFeatures;
  let askingPrice = input.askingPrice;

  if (input.propertyId) {
    const prop = await prisma.property.findUnique({
      where: { id: input.propertyId },
    });
    if (!prop) {
      throw new Error(`Property not found with ID: ${input.propertyId}`);
    }
    // Only approved properties can be accessed by public estimation
    if (prop.status !== "APPROVED") {
      throw new Error(`Valuation unavailable: Property status is ${prop.status}`);
    }

    features = {
      area: prop.area,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      parking: prop.parking || 0,
      isFurnished: !!prop.isFurnished,
      city: prop.city,
      propertyType: prop.type,
    };
    askingPrice = askingPrice || prop.price;
  } else if (input.features) {
    features = input.features;
  } else {
    throw new Error("Either propertyId or features must be provided.");
  }

  // 0. F4 Coverage Guard
  const cityKey = features.city.trim().toLowerCase();
  const typeKey = features.propertyType.trim().toLowerCase();

  const cityCount = artifact.coverage?.seenCities?.[cityKey] ?? 0;
  const typeCount = artifact.coverage?.seenTypes?.[typeKey] ?? 0;

  // Level 1 — hard block (unseen city or unseen type individually)
  if (cityCount === 0 || typeCount === 0) {
    const missing: { city?: string; type?: string } = {};
    if (cityCount === 0) missing.city = features.city;
    if (typeCount === 0) missing.type = features.propertyType;
    return {
      status: "INSUFFICIENT_DATA",
      reason: "NO_TRAINING_EXAMPLES",
      missing,
    } as any;
  }

  // Level 2 — soft warning (pair unseen, but both members seen individually)
  const pairKey = `${cityKey}__${typeKey}`;
  const pairCount = artifact.coverage?.seenPairs?.[pairKey] ?? 0;
  const isUnseenPair = pairCount === 0;
  const pairCoverage = isUnseenPair
    ? {
        trainRowsForPair: 0,
        cityTrainRows: cityCount,
        typeTrainRows: typeCount,
      }
    : undefined;

  // 1. Feature Preprocessing
  const rawVector = extractRawFeatures(features);
  const stdVector = standardizeVector(
    rawVector,
    artifact.schema.scaler.mean,
    artifact.schema.scaler.std
  );

  // 2. Model Inference
  let estimatedPrice: number;
  let uncertaintyStd = artifact.residualStdError;

  const pred = activePredictor!.predictOne(stdVector);
  if (typeof pred === "number") {
    estimatedPrice = Math.round(pred);
  } else {
    estimatedPrice = Math.round(pred.mean);
    if (pred.std > 0) {
      uncertaintyStd = Math.max(pred.std, artifact.residualStdError);
    }
  }

  // Ensure positive valuation
  estimatedPrice = Math.max(15000, estimatedPrice);

  // 3. Price Uncertainty Range derived from out-of-sample error (F2)
  // Basis: LOOCV MAE ($1,703.92) uses all N=28 rows and is not subject to partition artifact.
  // Multiplier: 1.0x (uncalibrated seed data). For unseen pairs (Level 2), widened to holdout MAE ($6,424).
  const outOfSampleMAE =
    artifact.calibration?.outOfSampleMAE ||
    artifact.evaluation?.loocv?.mae ||
    1703.92;
  const marginUSD = isUnseenPair
    ? Math.round(Math.max(outOfSampleMAE * 2.0, 6424))
    : Math.round(1.0 * outOfSampleMAE);
  const lowerPrice = Math.max(10000, estimatedPrice - marginUSD);
  const upperPrice = estimatedPrice + marginUSD;
  const marginPercent = Math.round((marginUSD / estimatedPrice) * 100);

  // 4. Reliability Evaluation
  let reliabilityScore = 0;
  // Is city known in training distribution?
  if (KNOWN_CITIES.map((c) => c.toLowerCase()).includes(features.city.toLowerCase())) {
    reliabilityScore += 35;
  }
  // Is property type known in training distribution?
  if (
    KNOWN_PROPERTY_TYPES.map((t) => t.toUpperCase()).includes(
      features.propertyType.toUpperCase()
    )
  ) {
    reliabilityScore += 35;
  }
  // Is area within standard domain (30 - 600 sqm)?
  if (features.area >= 30 && features.area <= 600) {
    reliabilityScore += 15;
  }
  // Are bedrooms within standard domain (1 - 8)?
  if (features.bedrooms >= 1 && features.bedrooms <= 8) {
    reliabilityScore += 15;
  }

  const reliability: PriceReliability =
    reliabilityScore >= 80 ? "HIGH" : reliabilityScore >= 50 ? "MEDIUM" : "LOW";

  // 5. Feature Contributions & Explainability
  const contributions: FeatureContribution[] = [];
  const topDrivers: string[] = [];

  // Use model feature importances
  const sortedFeats = Object.entries(artifact.featureImportances).sort(
    (a, b) => b[1] - a[1]
  );

  for (const [featKey, weight] of sortedFeats.slice(0, 5)) {
    let label = featKey;
    let val: any = "";

    if (featKey === "area") {
      label = "Property Area";
      val = `${features.area} m²`;
      topDrivers.push(`Area of ${features.area} m² accounts for ${(weight * 100).toFixed(0)}% of model weight`);
    } else if (featKey === "bedrooms") {
      label = "Bedrooms Count";
      val = features.bedrooms;
      topDrivers.push(`${features.bedrooms} bedrooms significantly influence space pricing`);
    } else if (featKey === "bathrooms") {
      label = "Bathrooms Count";
      val = features.bathrooms;
    } else if (featKey.startsWith("city_")) {
      const city = featKey.replace("city_", "");
      label = `Location (${city.toUpperCase()})`;
      val = features.city;
      if (features.city.toLowerCase() === city.toLowerCase()) {
        topDrivers.push(`Premium location in ${features.city}`);
      }
    } else if (featKey.startsWith("type_")) {
      const pType = featKey.replace("type_", "");
      label = `Property Type (${pType.toUpperCase()})`;
      val = features.propertyType;
    }

    contributions.push({
      feature: featKey,
      label,
      value: val,
      impactUSD: Math.round(weight * estimatedPrice * 0.3),
      relativePercent: Math.round(weight * 100),
    });
  }

  // 6. Price Position Analysis & F1 Emission Guard
  let pricePosition: PricePosition | null = null;
  let positionDetails: any | null = null;
  let positionSuppressed = false;
  let suppressReason: string | undefined;

  if (askingPrice && askingPrice > 0) {
    const bandWidthUSD = 0.10 * estimatedPrice; // threshold currently 0.10
    if (isUnseenPair) {
      pricePosition = null;
      positionDetails = null;
      positionSuppressed = true;
      suppressReason = "UNSEEN_PAIR_EXTRAPOLATION";
    } else if (bandWidthUSD < outOfSampleMAE) {
      pricePosition = null;
      positionDetails = null;
      positionSuppressed = true;
      suppressReason = "BAND_NARROWER_THAN_MODEL_ERROR";
    } else {
      const analysis = classifyPricePosition(askingPrice, estimatedPrice);
      pricePosition = analysis.position;
      positionDetails = {
        askingPrice,
        differenceUSD: analysis.diffUSD,
        percentageDifference: analysis.percentageDiff,
        explanation: analysis.explanation,
      };
      positionSuppressed = false;
    }
  }

  // 7. Find Comparable Listings
  const comparables = await findComparableProperties({
    city: features.city,
    type: features.propertyType,
    area: features.area,
    bedrooms: features.bedrooms,
    bathrooms: features.bathrooms,
    targetPrice: estimatedPrice,
    excludePropertyId: input.propertyId,
  });

  return {
    estimatedPrice,
    currency: "USD",
    priceRange: {
      lower: lowerPrice,
      upper: upperPrice,
      marginPercent,
    },
    reliability,
    pricePosition,
    positionDetails,
    positionSuppressed,
    suppressReason,
    pairCoverage,
    calibration: {
      status: artifact.calibration?.status || "NOT_CALIBRATED",
      basis: artifact.calibration?.basis || "LOOCV MAE",
      outOfSampleMAE: outOfSampleMAE,
      n: artifact.calibration?.n || 28,
      note:
        artifact.calibration?.note ||
        "synthetic seed data; asking prices, not transaction prices",
    },
    featureContributions: contributions,
    topDrivers,
    comparables,
    modelMetadata: {
      modelId: artifact.modelId,
      modelVersion: artifact.modelVersion,
      modelType: artifact.modelType,
      trainedAt: artifact.trainedAt,
      datasetSize: artifact.sampleCount,
      testMetrics: artifact.testMetrics,
      readinessVerdict: artifact.readinessVerdict,
    },
  };
}
