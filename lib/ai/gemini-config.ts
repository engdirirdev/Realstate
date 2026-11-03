/**
 * Central Google Gemini Configuration
 *
 * Configures the active Gemini models, API keys, timeouts, and generation parameters.
 * Eliminates hardcoded model strings across API routes and services.
 */

export const GEMINI_CONFIG = {
  /**
   * Primary Chat & Dialogue Generation Model
   * Upgraded from legacy models to state-of-the-art production gemini-3.8-flash.
   * Can be overridden at runtime via GEMINI_MODEL or GOOGLE_AI_MODEL in .env
   */
  CHAT_MODEL: process.env.GEMINI_MODEL || process.env.GOOGLE_AI_MODEL || "gemini-3.8-flash",

  /**
   * Vector Embedding Model
   * Upgraded from deprecated text-embedding-004 to official gemini-embedding-2.
   * Leverages Matryoshka Representation Learning (MRL) at 768 dimensions.
   */
  EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2",
  EMBEDDING_DIMENSIONS: 768,

  /**
   * Maximum allowed response time before falling back to deterministic engine (milliseconds)
   */
  CHAT_TIMEOUT_MS: process.env.GEMINI_TIMEOUT_MS ? Number(process.env.GEMINI_TIMEOUT_MS) : 4000,
  EMBEDDING_TIMEOUT_MS: 3500,

  /**
   * Fallback Provider Identifier
   */
  FALLBACK_PROVIDER: "local-deterministic",
} as const;

/**
 * Returns the server-side Gemini API key from environment variables.
 * Prioritizes GEMINI_API_KEY, falling back to GOOGLE_AI_API_KEY.
 * Never exposed to client bundles.
 */
export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    return null;
  }
  return key.trim();
}

/**
 * Checks whether the Gemini API is configured with a non-empty key.
 */
export function isGeminiConfigured(): boolean {
  return getGeminiApiKey() !== null;
}
