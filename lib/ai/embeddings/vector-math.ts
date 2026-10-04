/**
 * Vector Mathematics and Similarity Utilities
 *
 * Implements high-performance Cosine Similarity, L2 Normalization, and Dot Product
 * for 768-dimensional multilingual property embeddings.
 */

/**
 * Computes the Euclidean (L2) norm of a vector.
 */
export function l2Norm(v: number[] | Float32Array): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}

/**
 * Normalizes a vector in-place or returns a normalized copy with unit length (L2 norm = 1).
 */
export function normalizeVector(v: number[] | Float32Array): number[] {
  const norm = l2Norm(v);
  if (norm === 0) return Array.from(v);
  const result = new Array(v.length);
  for (let i = 0; i < v.length; i++) {
    result[i] = v[i] / norm;
  }
  return result;
}

/**
 * Computes the Dot Product of two vectors of equal length.
 */
export function dotProduct(
  a: number[] | Float32Array,
  b: number[] | Float32Array
): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * Computes the Cosine Similarity between two vectors.
 * Returns a value between -1.0 and 1.0 (typically 0.0 to 1.0 for embeddings).
 */
export function cosineSimilarity(
  a: number[] | Float32Array,
  b: number[] | Float32Array
): number {
  if (a.length === 0 || b.length === 0) return 0;
  const dot = dotProduct(a, b);
  const normA = l2Norm(a);
  const normB = l2Norm(b);

  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
}

export interface ScoredVectorItem<T> {
  item: T;
  similarity: number;
}

/**
 * Finds top-K items ranked by cosine similarity against a query vector.
 */
export function rankByCosineSimilarity<T>(
  queryVector: number[] | Float32Array,
  items: { item: T; vector: number[] | Float32Array }[],
  options: {
    topK?: number;
    threshold?: number;
  } = {}
): ScoredVectorItem<T>[] {
  const topK = options.topK ?? 10;
  const threshold = options.threshold ?? 0.0;

  const scored: ScoredVectorItem<T>[] = [];

  for (const entry of items) {
    const similarity = cosineSimilarity(queryVector, entry.vector);
    if (similarity >= threshold) {
      scored.push({
        item: entry.item,
        similarity: Math.round(similarity * 10000) / 10000, // 4 decimal places
      });
    }
  }

  // Sort descending by similarity
  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK);
}
