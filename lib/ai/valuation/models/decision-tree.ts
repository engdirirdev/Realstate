/**
 * Decision Tree Regressor
 * Implements recursive binary splitting minimizing Mean Squared Error (variance reduction).
 * Phase 3 — Real Estate AI
 */

export interface TreeNode {
  isLeaf: boolean;
  value?: number;
  featureIndex?: number;
  featureName?: string;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  sampleCount?: number;
}

export interface TreeModelSerialized {
  root: TreeNode;
  featureNames: string[];
  maxDepth: number;
  minSamplesSplit: number;
  featureImportances: Record<string, number>;
}

export class DecisionTreeRegressor {
  public root: TreeNode | null = null;
  public featureImportances: Record<string, number> = {};
  public featureNames: string[] = [];

  constructor(
    public maxDepth = 4,
    public minSamplesSplit = 3,
    public minImpurityDecrease = 1e-4
  ) {}

  /**
   * Train Decision Tree on feature matrix X and continuous target y
   */
  public fit(X: number[][], y: number[], featureNames: string[]): TreeNode {
    this.featureNames = featureNames;
    const importanceAccumulator: number[] = new Array(featureNames.length).fill(0);

    const indices = Array.from({ length: X.length }, (_, i) => i);
    this.root = this.buildNode(X, y, indices, 0, importanceAccumulator);

    const totalImportance = importanceAccumulator.reduce((a, b) => a + b, 0) || 1.0;
    this.featureImportances = {};
    featureNames.forEach((name, i) => {
      this.featureImportances[name] =
        Math.round((importanceAccumulator[i] / totalImportance) * 1000) / 1000;
    });

    return this.root;
  }

  private buildNode(
    X: number[][],
    y: number[],
    indices: number[],
    depth: number,
    importanceAcc: number[]
  ): TreeNode {
    const n = indices.length;
    if (n === 0) return { isLeaf: true, value: 0 };

    const sumY = indices.reduce((s, idx) => s + y[idx], 0);
    const meanY = sumY / n;

    if (depth >= this.maxDepth || n < this.minSamplesSplit) {
      return { isLeaf: true, value: meanY, sampleCount: n };
    }

    const varianceY =
      indices.reduce((s, idx) => s + Math.pow(y[idx] - meanY, 2), 0) / n;
    if (varianceY <= 1e-6) {
      return { isLeaf: true, value: meanY, sampleCount: n };
    }

    // Search for best split across all features
    let bestGain = -Infinity;
    let bestFeature = -1;
    let bestThreshold = 0;
    let bestLeftIndices: number[] = [];
    let bestRightIndices: number[] = [];

    const d = X[0].length;
    for (let f = 0; f < d; f++) {
      // Collect unique feature values
      const values = Array.from(new Set(indices.map((idx) => X[idx][f]))).sort(
        (a, b) => a - b
      );
      if (values.length <= 1) continue;

      for (let i = 0; i < values.length - 1; i++) {
        const threshold = (values[i] + values[i + 1]) / 2;
        const left: number[] = [];
        const right: number[] = [];

        for (const idx of indices) {
          if (X[idx][f] <= threshold) left.push(idx);
          else right.push(idx);
        }

        if (left.length === 0 || right.length === 0) continue;

        // Compute impurity (variance) of left and right
        const meanLeft = left.reduce((s, idx) => s + y[idx], 0) / left.length;
        const varLeft =
          left.reduce((s, idx) => s + Math.pow(y[idx] - meanLeft, 2), 0) /
          left.length;

        const meanRight = right.reduce((s, idx) => s + y[idx], 0) / right.length;
        const varRight =
          right.reduce((s, idx) => s + Math.pow(y[idx] - meanRight, 2), 0) /
          right.length;

        const weightedVar =
          (left.length / n) * varLeft + (right.length / n) * varRight;
        const gain = varianceY - weightedVar;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = f;
          bestThreshold = threshold;
          bestLeftIndices = left;
          bestRightIndices = right;
        }
      }
    }

    if (bestGain < this.minImpurityDecrease || bestFeature === -1) {
      return { isLeaf: true, value: meanY, sampleCount: n };
    }

    // Accumulate feature importance (gain * sample proportion)
    importanceAcc[bestFeature] += bestGain * (n / X.length);

    return {
      isLeaf: false,
      featureIndex: bestFeature,
      featureName: this.featureNames[bestFeature],
      threshold: bestThreshold,
      sampleCount: n,
      left: this.buildNode(X, y, bestLeftIndices, depth + 1, importanceAcc),
      right: this.buildNode(X, y, bestRightIndices, depth + 1, importanceAcc),
    };
  }

  public predictOne(x: number[], node: TreeNode | null = this.root): number {
    if (!node) throw new Error("Decision tree is not fitted");
    if (node.isLeaf) return node.value!;

    if (x[node.featureIndex!] <= node.threshold!) {
      return this.predictOne(x, node.left!);
    } else {
      return this.predictOne(x, node.right!);
    }
  }

  public predict(X: number[][]): number[] {
    return X.map((x) => this.predictOne(x));
  }

  public toJSON(): TreeModelSerialized {
    if (!this.root) throw new Error("Tree is not fitted");
    return {
      root: this.root,
      featureNames: this.featureNames,
      maxDepth: this.maxDepth,
      minSamplesSplit: this.minSamplesSplit,
      featureImportances: this.featureImportances,
    };
  }

  public static fromJSON(json: TreeModelSerialized): DecisionTreeRegressor {
    const tree = new DecisionTreeRegressor(json.maxDepth, json.minSamplesSplit);
    tree.root = json.root;
    tree.featureNames = json.featureNames;
    tree.featureImportances = json.featureImportances;
    return tree;
  }
}
