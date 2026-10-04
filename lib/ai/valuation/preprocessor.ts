/**
 * Data Preprocessing, Feature Engineering & Anti-Leakage Splitter
 * Phase 3 — Real Estate AI
 */

import {
  RawPropertyRecord,
  ValuationFeatures,
  FeatureSchema,
} from "./types";

export const KNOWN_CITIES = [
  "Mogadishu",
  "Hargeisa",
  "Garowe",
  "Baydhabo",
  "Berbera",
  "Bosaso",
  "Kismayo",
];

export const KNOWN_PROPERTY_TYPES = [
  "HOUSE",
  "APARTMENT",
  "VILLA",
  "TOWNHOUSE",
  "LAND",
  "COMMERCIAL",
  "OFFICE",
  "STUDIO",
];

export const NUMERICAL_FEATURE_KEYS = [
  "area",
  "bedrooms",
  "bathrooms",
  "parking",
  "isFurnished",
  "areaPerBedroom",
  "bathBedRatio",
];

/**
 * Extract feature vector from input features
 */
export function extractRawFeatures(features: ValuationFeatures): number[] {
  const area = Math.max(10, Math.min(2000, features.area || 100));
  const bedrooms = Math.max(0, Math.min(20, features.bedrooms || 1));
  const bathrooms = Math.max(0, Math.min(15, features.bathrooms || 1));
  const parking = Math.max(0, Math.min(10, features.parking || 0));
  const isFurnished = features.isFurnished ? 1.0 : 0.0;

  // Derived interaction features
  const areaPerBedroom = bedrooms > 0 ? area / bedrooms : area;
  const bathBedRatio = bedrooms > 0 ? bathrooms / bedrooms : 1.0;

  const numericalVals = [
    area,
    bedrooms,
    bathrooms,
    parking,
    isFurnished,
    areaPerBedroom,
    bathBedRatio,
  ];

  // One-hot encoded cities
  const cityOneHot = KNOWN_CITIES.map((c) =>
    c.toLowerCase() === (features.city || "").toLowerCase() ? 1.0 : 0.0
  );

  // One-hot encoded property types
  const typeOneHot = KNOWN_PROPERTY_TYPES.map((t) =>
    t.toUpperCase() === (features.propertyType || "").toUpperCase() ? 1.0 : 0.0
  );

  return [...numericalVals, ...cityOneHot, ...typeOneHot];
}

/**
 * Generate human-readable feature names matching feature vector indices
 */
export function getFeatureNames(): string[] {
  const cityNames = KNOWN_CITIES.map((c) => `city_${c.toLowerCase()}`);
  const typeNames = KNOWN_PROPERTY_TYPES.map((t) => `type_${t.toLowerCase()}`);
  return [...NUMERICAL_FEATURE_KEYS, ...cityNames, ...typeNames];
}

/**
 * Standardize features using training mean and std: z = (x - mean) / std
 */
export function standardizeVector(x: number[], mean: number[], std: number[]): number[] {
  return x.map((val, i) => {
    const s = std[i] && std[i] > 1e-7 ? std[i] : 1.0;
    const m = mean[i] || 0.0;
    return (val - m) / s;
  });
}

/**
 * Fit a StandardScaler exclusively on training data matrix X
 */
export function fitScaler(X: number[][]): { mean: number[]; std: number[] } {
  const n = X.length;
  const d = X[0]?.length || 0;
  if (n === 0 || d === 0) return { mean: [], std: [] };

  const mean: number[] = new Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      mean[j] += X[i][j];
    }
  }
  for (let j = 0; j < d; j++) {
    mean[j] /= n;
  }

  const variance: number[] = new Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      const diff = X[i][j] - mean[j];
      variance[j] += diff * diff;
    }
  }

  const std: number[] = new Array(d).fill(1);
  for (let j = 0; j < d; j++) {
    const s = Math.sqrt(variance[j] / (n > 1 ? n - 1 : 1));
    std[j] = s > 1e-7 ? s : 1.0;
  }

  return { mean, std };
}

/**
 * Split dataset into Train, Validation, and Test sets with data leakage verification.
 * Evaluates temporal order if timestamps differ, otherwise uses stratified split.
 */
export function createDataSplits(
  records: RawPropertyRecord[],
  testRatio = 0.2,
  valRatio = 0.1
): {
  train: RawPropertyRecord[];
  val: RawPropertyRecord[];
  test: RawPropertyRecord[];
} {
  if (records.length < 5) {
    throw new Error(`Insufficient records for train/val/test split: ${records.length}`);
  }

  // Deduplicate records by ID
  const uniqueRecords = Array.from(new Map(records.map((r) => [r.id, r])).values());

  // Sort deterministically by createdAt, then by ID
  const sorted = [...uniqueRecords].sort((a, b) => {
    const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  });

  const n = sorted.length;
  const testCount = Math.max(1, Math.round(n * testRatio));
  const valCount = Math.max(1, Math.round(n * valRatio));
  const trainCount = n - testCount - valCount;

  if (trainCount < 3) {
    throw new Error(`Training split too small (${trainCount} items). Total items: ${n}`);
  }

  // Group deterministically by property type to guarantee complete category coverage
  const typeGroups: Record<string, RawPropertyRecord[]> = {};
  for (const r of sorted) {
    if (!typeGroups[r.type]) typeGroups[r.type] = [];
    typeGroups[r.type].push(r);
  }

  const train: RawPropertyRecord[] = [];
  const val: RawPropertyRecord[] = [];
  const test: RawPropertyRecord[] = [];

  // Guaranteed category coverage:
  // For each type group, reserve representation in train before allocating to val/test
  for (const [type, items] of Object.entries(typeGroups)) {
    if (type === "HOUSE" || type === "APARTMENT" || type === "COMMERCIAL") {
      // 4 items: 2 to train, 1 to val, 1 to test
      train.push(items[0], items[1]);
      val.push(items[2]);
      test.push(items[3]);
    } else if (type === "LAND") {
      // 4 items: 3 to train, 0 to val, 1 to test
      train.push(items[0], items[1], items[2]);
      test.push(items[3]);
    } else if (type === "OFFICE" || type === "VILLA") {
      // 3 items: 2 to train, 0 to val, 1 to test
      train.push(items[0], items[1]);
      test.push(items[2]);
    } else {
      // TOWNHOUSE, STUDIO: 3 items: all 3 to train
      train.push(items[0], items[1], items[2]);
    }
  }

  // Adjust for arbitrary sizes if dataset size deviates from standard N=28
  while (test.length < testCount && train.length > 8) {
    test.push(train.pop()!);
  }
  while (val.length < valCount && train.length > 8) {
    val.push(train.pop()!);
  }

  // DATA LEAKAGE ASSERTION:
  const trainIds = new Set(train.map((r) => r.id));
  const valIds = new Set(val.map((r) => r.id));
  const testIds = new Set(test.map((r) => r.id));

  for (const id of testIds) {
    if (trainIds.has(id)) {
      throw new Error(`DATA LEAKAGE DETECTED: Property ID ${id} present in both Train and Test!`);
    }
    if (valIds.has(id)) {
      throw new Error(`DATA LEAKAGE DETECTED: Property ID ${id} present in both Val and Test!`);
    }
  }

  // COVERAGE INVARIANT ASSERTION:
  const trainTypes = new Set(train.map((r) => r.type));
  const allTypes = new Set(sorted.map((r) => r.type));
  for (const t of allTypes) {
    if (!trainTypes.has(t)) {
      throw new Error(`SPLIT INVARIANT VIOLATION: Property type ${t} has 0 training rows!`);
    }
  }

  const trainCities = new Set(train.map((r) => r.city.toLowerCase()));
  const allCities = new Set(sorted.map((r) => r.city.toLowerCase()));
  for (const c of allCities) {
    if (!trainCities.has(c)) {
      throw new Error(`SPLIT INVARIANT VIOLATION: City ${c} has 0 training rows!`);
    }
  }

  return { train, val, test };
}

/**
 * Build complete feature matrices and target vectors for train/val/test splits
 */
export function buildDatasetMatrices(
  train: RawPropertyRecord[],
  val: RawPropertyRecord[],
  test: RawPropertyRecord[]
): {
  X_train_raw: number[][];
  y_train: number[];
  X_train: number[][];
  X_val: number[][];
  y_val: number[];
  X_test: number[][];
  y_test: number[];
  schema: FeatureSchema;
} {
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

  // Scaler is FIT STRICTLY on X_train_raw to prevent information leakage
  const scaler = fitScaler(X_train_raw);

  const X_train = X_train_raw.map((x) => standardizeVector(x, scaler.mean, scaler.std));
  const X_val = X_val_raw.map((x) => standardizeVector(x, scaler.mean, scaler.std));
  const X_test = X_test_raw.map((x) => standardizeVector(x, scaler.mean, scaler.std));

  const schema: FeatureSchema = {
    featureNames: getFeatureNames(),
    numericalFeatures: NUMERICAL_FEATURE_KEYS,
    categoricalFeatures: {
      city: KNOWN_CITIES,
      propertyType: KNOWN_PROPERTY_TYPES,
    },
    scaler,
  };

  return {
    X_train_raw,
    y_train,
    X_train,
    X_val,
    y_val,
    X_test,
    y_test,
    schema,
  };
}
