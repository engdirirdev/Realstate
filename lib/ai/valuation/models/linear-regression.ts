/**
 * Ridge (L2-Regularized) Linear Regression Model
 * Solved analytically via normal equations: w = (X^T X + λ I)^(-1) X^T y
 * Phase 3 — Real Estate AI
 */

export interface RidgeModelWeights {
  intercept: number;
  coefficients: number[];
  featureNames: string[];
  lambda: number;
}

/**
 * Invert a square matrix using Gauss-Jordan elimination with partial pivoting
 */
function invertMatrix(A: number[][]): number[][] {
  const n = A.length;
  // Augment with identity
  const aug: number[][] = A.map((row, i) => {
    const ident = new Array(n).fill(0);
    ident[i] = 1;
    return [...row, ...ident];
  });

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) {
        maxRow = k;
      }
    }
    // Swap rows
    const temp = aug[i];
    aug[i] = aug[maxRow];
    aug[maxRow] = temp;

    const pivot = aug[i][i];
    if (Math.abs(pivot) < 1e-12) {
      // Degenerate pivot: small regularization jitter
      aug[i][i] = 1e-6;
    }
    const invPivot = 1 / aug[i][i];
    for (let j = 0; j < 2 * n; j++) {
      aug[i][j] *= invPivot;
    }

    // Eliminate other rows
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = aug[k][i];
        for (let j = 0; j < 2 * n; j++) {
          aug[k][j] -= factor * aug[i][j];
        }
      }
    }
  }

  return aug.map((row) => row.slice(n));
}

export class RidgeRegressor {
  public weights: RidgeModelWeights | null = null;

  constructor(public lambda = 1.0) {}

  /**
   * Train Ridge Regression model on feature matrix X (standardized) and target y
   */
  public fit(X: number[][], y: number[], featureNames: string[]): RidgeModelWeights {
    const n = X.length;
    const d = X[0].length;

    // Center target y
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    const yCentered = y.map((v) => v - meanY);

    // Compute X^T X
    const XtX: number[][] = Array.from({ length: d }, () => new Array(d).fill(0));
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += X[k][i] * X[k][j];
        }
        XtX[i][j] = sum;
      }
      // Add L2 penalty λ to diagonal (except intercept)
      XtX[i][i] += this.lambda;
    }

    // Invert (X^T X + λ I)
    const invXtX = invertMatrix(XtX);

    // Compute X^T y
    const Xty: number[] = new Array(d).fill(0);
    for (let i = 0; i < d; i++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += X[k][i] * yCentered[k];
      }
      Xty[i] = sum;
    }

    // Compute coefficients w = invXtX * Xty
    const coefficients: number[] = new Array(d).fill(0);
    for (let i = 0; i < d; i++) {
      let sum = 0;
      for (let j = 0; j < d; j++) {
        sum += invXtX[i][j] * Xty[j];
      }
      coefficients[i] = sum;
    }

    this.weights = {
      intercept: meanY,
      coefficients,
      featureNames,
      lambda: this.lambda,
    };

    return this.weights;
  }

  /**
   * Predict single standardized feature vector
   */
  public predictOne(x: number[]): number {
    if (!this.weights) throw new Error("Model is not fitted");
    let yHat = this.weights.intercept;
    for (let i = 0; i < x.length; i++) {
      yHat += this.weights.coefficients[i] * x[i];
    }
    return Math.max(10000, yHat); // Clamp to realistic minimum
  }

  /**
   * Predict array of standardized feature vectors
   */
  public predict(X: number[][]): number[] {
    return X.map((x) => this.predictOne(x));
  }

  /**
   * Calculate feature importance (absolute coefficient magnitude)
   */
  public getFeatureImportances(): Record<string, number> {
    if (!this.weights) return {};
    const sum = this.weights.coefficients.reduce((s, c) => s + Math.abs(c), 0) || 1.0;
    const importances: Record<string, number> = {};
    this.weights.featureNames.forEach((name, i) => {
      importances[name] = Math.round((Math.abs(this.weights!.coefficients[i]) / sum) * 1000) / 1000;
    });
    return importances;
  }

  /**
   * Calculate local feature contributions for a single observation
   */
  public explainPrediction(x: number[]): { feature: string; impactUSD: number }[] {
    if (!this.weights) return [];
    return this.weights.featureNames.map((name, i) => ({
      feature: name,
      impactUSD: Math.round(this.weights!.coefficients[i] * x[i]),
    }));
  }
}
