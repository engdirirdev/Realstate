/**
 * Gradient Boosted Decision Trees (GBDT) Regressor
 * Sequential boosting minimizing MSE loss with shrinkage learning rate.
 * Phase 3 — Real Estate AI
 */

import {
  DecisionTreeRegressor,
  TreeModelSerialized,
} from "./decision-tree";

export interface GBDTModelSerialized {
  baseValue: number;
  learningRate: number;
  nEstimators: number;
  maxDepth: number;
  trees: TreeModelSerialized[];
  featureNames: string[];
  featureImportances: Record<string, number>;
}

export class GradientBoostingRegressor {
  public baseValue = 0;
  public trees: DecisionTreeRegressor[] = [];
  public featureImportances: Record<string, number> = {};
  public featureNames: string[] = [];

  constructor(
    public nEstimators = 15,
    public learningRate = 0.1,
    public maxDepth = 3,
    public minSamplesSplit = 2
  ) {}

  /**
   * Train Gradient Boosted Trees sequentially on residuals
   */
  public fit(X: number[][], y: number[], featureNames: string[]): void {
    this.featureNames = featureNames;
    this.trees = [];
    const n = X.length;

    // Initial constant estimate: baseValue = mean(y)
    this.baseValue = y.reduce((a, b) => a + b, 0) / n;

    // Current ensemble predictions
    const currentPred = new Array(n).fill(this.baseValue);

    const importanceSum: Record<string, number> = {};
    featureNames.forEach((name) => {
      importanceSum[name] = 0;
    });

    for (let m = 0; m < this.nEstimators; m++) {
      // Calculate negative gradient (residuals): r_i = y_i - F_{m-1}(x_i)
      const residuals = y.map((val, i) => val - currentPred[i]);

      // Fit tree to residuals
      const tree = new DecisionTreeRegressor(this.maxDepth, this.minSamplesSplit);
      tree.fit(X, residuals, featureNames);
      this.trees.push(tree);

      // Update predictions: F_m(x) = F_{m-1}(x) + η * h_m(x)
      for (let i = 0; i < n; i++) {
        currentPred[i] += this.learningRate * tree.predictOne(X[i]);
      }

      // Accumulate importances
      for (const [feat, val] of Object.entries(tree.featureImportances)) {
        importanceSum[feat] = (importanceSum[feat] || 0) + val;
      }
    }

    // Normalize feature importances
    const total = Object.values(importanceSum).reduce((a, b) => a + b, 0) || 1.0;
    this.featureImportances = {};
    for (const [feat, val] of Object.entries(importanceSum)) {
      this.featureImportances[feat] = Math.round((val / total) * 1000) / 1000;
    }
  }

  public predictOne(x: number[]): number {
    let yHat = this.baseValue;
    for (const tree of this.trees) {
      yHat += this.learningRate * tree.predictOne(x);
    }
    return Math.max(10000, yHat);
  }

  public predict(X: number[][]): number[] {
    return X.map((x) => this.predictOne(x));
  }

  public toJSON(): GBDTModelSerialized {
    return {
      baseValue: this.baseValue,
      learningRate: this.learningRate,
      nEstimators: this.nEstimators,
      maxDepth: this.maxDepth,
      trees: this.trees.map((t) => t.toJSON()),
      featureNames: this.featureNames,
      featureImportances: this.featureImportances,
    };
  }

  public static fromJSON(json: GBDTModelSerialized): GradientBoostingRegressor {
    const gb = new GradientBoostingRegressor(
      json.nEstimators,
      json.learningRate,
      json.maxDepth
    );
    gb.baseValue = json.baseValue;
    gb.featureNames = json.featureNames;
    gb.featureImportances = json.featureImportances;
    gb.trees = json.trees.map((t) => DecisionTreeRegressor.fromJSON(t));
    return gb;
  }
}
