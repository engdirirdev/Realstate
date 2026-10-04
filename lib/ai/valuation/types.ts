/**
 * Types & Interfaces for AI Property Valuation & Machine Learning Engine
 * Phase 3 — Real Estate AI
 */

import { PropertyType } from "@prisma/client";

export type PricePosition = "BELOW_MARKET" | "FAIRLY_PRICED" | "ABOVE_MARKET";
export type PriceReliability = "LOW" | "MEDIUM" | "HIGH";

export interface RawPropertyRecord {
  id: string;
  title: string;
  price: number;
  city: string;
  type: PropertyType | string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  parking?: number | null;
  isFurnished?: boolean;
  yearBuilt?: number | null;
  createdAt: Date;
  status: string;
}

export interface ValuationFeatures {
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  isFurnished: boolean;
  city: string;
  propertyType: string;
  // Derived numerical features
  areaPerBedroom?: number;
  bathBedRatio?: number;
}

export interface FeatureSchema {
  featureNames: string[];
  numericalFeatures: string[];
  categoricalFeatures: {
    city: string[];
    propertyType: string[];
  };
  scaler: {
    mean: number[];
    std: number[];
  };
}

export interface EvaluationMetrics {
  mae: number;
  rmse: number;
  r2: number;
  mape: number;
  sampleCount: number;
}

export interface FeatureContribution {
  feature: string;
  label: string;
  value: number | string | boolean;
  impactUSD: number; // Positive = pushes price up, Negative = pushes price down
  relativePercent: number;
}

export interface ComparableProperty {
  id: string;
  title: string;
  city: string;
  type: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  similarityScore: number; // 0 - 100
  priceVariancePercent: number; // ((price - estimated) / estimated) * 100
}

export interface ValuationPredictionResult {
  estimatedPrice: number;
  currency: "USD";
  priceRange: {
    lower: number;
    upper: number;
    marginPercent: number;
  };
  reliability: PriceReliability;
  pricePosition?: PricePosition | null;
  positionDetails?: {
    askingPrice: number;
    differenceUSD: number;
    percentageDifference: number;
    explanation: string;
  } | null;
  positionSuppressed?: boolean;
  suppressReason?: string;
  pairCoverage?: {
    trainRowsForPair: number;
    cityTrainRows: number;
    typeTrainRows: number;
  };
  calibration?: {
    status: string;
    basis: string;
    outOfSampleMAE: number;
    n: number;
    note: string;
  };
  featureContributions: FeatureContribution[];
  topDrivers: string[];
  comparables: ComparableProperty[];
  modelMetadata: {
    modelId: string;
    modelVersion: string;
    modelType: string;
    trainedAt: string;
    datasetSize: number;
    testMetrics: EvaluationMetrics;
    readinessVerdict: "RESEARCH_EXPERIMENTAL" | "PRODUCTION_READY";
  };
}

export interface ModelArtifact {
  modelId: string;
  modelVersion: string;
  modelType: "RidgeRegression" | "DecisionTree" | "RandomForest" | "GradientBoosting";
  trainedAt: string;
  datasetHash: string;
  sampleCount: number;
  trainCount: number;
  valCount: number;
  testCount: number;
  schema: FeatureSchema;
  parameters: Record<string, any>;
  trainMetrics: EvaluationMetrics;
  testMetrics: EvaluationMetrics;
  baselineMetrics: {
    globalMedian: EvaluationMetrics;
    locationTypeMedian: EvaluationMetrics;
    pricePerArea: EvaluationMetrics;
  };
  evaluation?: {
    loocv: { mae: number; mape: number; r2cv: number; nFolds: number };
    holdout: { mae: number; rmse: number; mape: number; r2: number; n: number };
    protocol: string;
    dataOrigin: string;
  };
  coverage?: {
    seenCities: Record<string, number>;
    seenTypes: Record<string, number>;
    seenPairs: Record<string, number>;
  };
  calibration?: {
    status: string;
    basis: string;
    outOfSampleMAE: number;
    n: number;
    note: string;
  };
  featureImportances: Record<string, number>;
  residualStdError: number;
  readinessVerdict: "RESEARCH_EXPERIMENTAL" | "PRODUCTION_READY";
}
