/**
 * Regression Evaluation Metrics & Baseline Models
 * Phase 3 — Real Estate AI
 */

import { EvaluationMetrics, RawPropertyRecord } from "./types";

/**
 * Calculate MAE, RMSE, R², and MAPE between actual and predicted vectors
 */
export function calculateRegressionMetrics(
  actual: number[],
  predicted: number[]
): EvaluationMetrics {
  const n = actual.length;
  if (n === 0 || n !== predicted.length) {
    return { mae: 0, rmse: 0, r2: 0, mape: 0, sampleCount: 0 };
  }

  let absErrorSum = 0;
  let sqErrorSum = 0;
  let pctErrorSum = 0;
  let actualSum = 0;

  for (let i = 0; i < n; i++) {
    const y = actual[i];
    const yHat = predicted[i];
    const diff = y - yHat;

    absErrorSum += Math.abs(diff);
    sqErrorSum += diff * diff;
    actualSum += y;

    if (y > 0) {
      pctErrorSum += Math.abs(diff / y);
    }
  }

  const meanActual = actualSum / n;
  let totalSqSum = 0;
  for (let i = 0; i < n; i++) {
    const diff = actual[i] - meanActual;
    totalSqSum += diff * diff;
  }

  const mae = absErrorSum / n;
  const rmse = Math.sqrt(sqErrorSum / n);
  const r2 = totalSqSum > 0 ? 1 - sqErrorSum / totalSqSum : 0;
  const mape = (pctErrorSum / n) * 100;

  return {
    mae: Math.round(mae * 100) / 100,
    rmse: Math.round(rmse * 100) / 100,
    r2: Math.round(r2 * 1000) / 1000,
    mape: Math.round(mape * 100) / 100,
    sampleCount: n,
  };
}

/**
 * Baseline Model A: Global Median Baseline
 */
export function evaluateGlobalMedianBaseline(
  train: RawPropertyRecord[],
  test: RawPropertyRecord[]
): { metrics: EvaluationMetrics; median: number } {
  const sorted = train.map((r) => r.price).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  const actual = test.map((r) => r.price);
  const predicted = test.map(() => median);

  return {
    metrics: calculateRegressionMetrics(actual, predicted),
    median,
  };
}

/**
 * Baseline Model B: Location + Property Type Median Baseline
 */
export function evaluateLocationTypeBaseline(
  train: RawPropertyRecord[],
  test: RawPropertyRecord[]
): { metrics: EvaluationMetrics; table: Record<string, number> } {
  // Compute group medians
  const groups: Record<string, number[]> = {};
  const typeGroups: Record<string, number[]> = {};
  const allPrices: number[] = [];

  for (const r of train) {
    const key = `${r.city.toLowerCase()}__${r.type.toLowerCase()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r.price);

    const typeKey = r.type.toLowerCase();
    if (!typeGroups[typeKey]) typeGroups[typeKey] = [];
    typeGroups[typeKey].push(r.price);

    allPrices.push(r.price);
  }

  const medianOf = (arr: number[]) => {
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
  };

  const globalMedian = medianOf(allPrices);
  const groupMedians: Record<string, number> = {};
  for (const [k, v] of Object.entries(groups)) {
    groupMedians[k] = medianOf(v);
  }
  const typeMedians: Record<string, number> = {};
  for (const [k, v] of Object.entries(typeGroups)) {
    typeMedians[k] = medianOf(v);
  }

  const actual = test.map((r) => r.price);
  const predicted = test.map((r) => {
    const key = `${r.city.toLowerCase()}__${r.type.toLowerCase()}`;
    if (groupMedians[key] !== undefined) return groupMedians[key];
    const typeKey = r.type.toLowerCase();
    if (typeMedians[typeKey] !== undefined) return typeMedians[typeKey];
    return globalMedian;
  });

  return {
    metrics: calculateRegressionMetrics(actual, predicted),
    table: groupMedians,
  };
}

/**
 * Baseline Model C: Price per Square Meter Baseline
 */
export function evaluatePricePerAreaBaseline(
  train: RawPropertyRecord[],
  test: RawPropertyRecord[]
): { metrics: EvaluationMetrics; medianRate: number } {
  const rates = train
    .filter((r) => r.area > 0)
    .map((r) => r.price / r.area)
    .sort((a, b) => a - b);

  const mid = Math.floor(rates.length / 2);
  const medianRate =
    rates.length % 2 === 0
      ? (rates[mid - 1] + rates[mid]) / 2
      : rates[mid];

  const actual = test.map((r) => r.price);
  const predicted = test.map((r) => r.area * medianRate);

  return {
    metrics: calculateRegressionMetrics(actual, predicted),
    medianRate,
  };
}
