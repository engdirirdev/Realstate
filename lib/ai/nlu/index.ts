/**
 * Multilingual Natural Language Understanding (NLU) Module Index
 */

import { detectQueryLanguage } from "../language/detector";
import { classifyIntent, IntentClassificationResult } from "./intent-classifier";
import { extractEntities, ExtractedEntities } from "./entity-extractor";
import {
  classifyConstraints,
  validateHardConstraints,
  mergeSearchStates,
  NormalizedQueryUnderstanding,
  HardConstraints,
} from "./constraint-classifier";

export * from "./intent-classifier";
export * from "./entity-extractor";
export * from "./constraint-classifier";

/**
 * End-to-end NLU query understanding pipeline
 */
export function parseNaturalLanguageQuery(
  rawQuery: string,
  previousSession?: NormalizedQueryUnderstanding | null
): NormalizedQueryUnderstanding {
  // 1. Language & Code-Switch Detection
  const langResult = detectQueryLanguage(rawQuery);

  // 2. Intent Classification
  const intentResult = classifyIntent(rawQuery);

  // 3. Entity & Constraint Extraction
  const entities = extractEntities(rawQuery);

  // 4. Hard vs Soft Constraint Separation & Query Normalization
  const understanding = classifyConstraints(
    rawQuery,
    langResult.language,
    intentResult.intent,
    entities,
    intentResult.confidence
  );

  // 5. Merge with conversational context if active
  if (previousSession) {
    return mergeSearchStates(previousSession, understanding);
  }

  return understanding;
}
