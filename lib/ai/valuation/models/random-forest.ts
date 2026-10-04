/**
 * Random Forest Regressor
 * Ensemble of randomized decision trees with bootstrap aggregation (bagging)
 * and variance-based prediction intervals.
 * Phase 3 — Real Estate AI
 */

import {
  DecisionTreeRegressor,
  TreeModelSerialized,
} from "./decision-tree";

export interface RandomForestSerialized {
  trees: TreeModelSerialized[];
  featureNames: string[];
  nEstimators: number;
  maxDepth: number;
  featureImportances: Record<string, number>;
}

export class RandomForestRegressor {
  public trees: DecisionTreeRegressor[] = [];
  public featureImportances: Record<string, number> = {};
  public featureNames: string[] = [];

  constructor(
    public nEstimators = 15,
    public maxDepth = 4,
    public minSamplesSplit = 2,
    public seed = 42
  ) {}

  /**
   * Deterministic pseudo-random generator
   */
  private pseudoRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  /**
   * Train Random Forest on feature matrix X and target y
   */
  public fit(X: number[][], y: number[], featureNames: string[]): void {
    this.featureNames = featureNames;
    this.trees = [];
    const n = X.length;
    const rng = this.pseudoRandom(this.seed);

    const importanceSum: Record<string, number> = {};
    featureNames.forEach((name) => {
      importanceSum[name] = 0;
    });

    for (let t = 0; t < this.nEstimators; t++) {
      // Bootstrap sampling (with replacement)
      const bootX: number[][] = [];
      const bootY: number[] = [];

      for (let i = 0; i < n; i++) {
        const randIdx = Math.floor(rng() * n);
        bootX.push(X[randIdx]);
        bootY.push(y[randIdx]);
      }

      // Train single tree with slight depth perturbation
      const treeDepth = Math.max(2, this.maxDepth - (t % 2));
      const tree = new DecisionTreeRegressor(treeDepth, this.minSamplesSplit);
      tree.fit(bootX, bootY, featureNames);
      this.trees.push(tree);

      // Accumulate importances
      for (const [feat, val] of Object.entries(tree.featureImportances)) {
        importanceSum[feat] = (importanceSum[feat] || 0) + val;
      }
    }

    // Average feature importances
    const total = Object.values(importanceSum).reduce((a, b) => a + b, 0) || 1.0;
    this.featureImportances = {};
    for (const [feat, val] of Object.entries(importanceSum)) {
      this.featureImportances[feat] = Math.round((val / total) * 1000) / 1000;
    }
  }

  /**
   * Predict single vector and return ensemble mean and standard deviation
   */
  public predictOneWithVariance(x: number[]): { mean: number; std: number } {
    if (this.trees.length === 0) throw new Error("Random Forest is not fitted");

    const predictions = this.trees.map((t) => t.predictOne(x));
    const mean = predictions.reduce((a, b) => a + b, 0) / predictions.length;

    const variance =
      predictions.reduce((s, p) => s + Math.pow(p - mean, 2), 0) /
      predictions.length;
    const std = Math.sqrt(variance);

    return { mean: Math.max(10000, mean), std };
  }

  /**
   * Predict array of feature vectors
   */
  public predict(X: number[][]): number[] {
    return X.map((x) => this.predictOneWithVariance(x).mean);
  }

  public toJSON(): RandomForestSerialized {
    return {
      trees: this.trees.map((t) => t.toJSON()),
      featureNames: this.featureNames,
      nEstimators: this.nEstimators,
      maxDepth: this.maxDepth,
      featureImportances: this.featureImportances,
    };
  }

  public static fromJSON(json: RandomForestSerialized): RandomForestRegressor {
    const rf = new RandomForestRegressor(json.nEstimators, json.maxDepth);
    rf.featureNames = json.featureNames;
    rf.featureImportances = json.featureImportances;
    rf.trees = json.trees.map((t) => DecisionTreeRegressor.fromJSON(t));
    return rf;
  }
}
