/**
 * Central OpenAI Configuration
 *
 * Configures the active OpenAI models, API keys, timeouts, and parameters.
 * Eliminates hardcoded model strings across API routes and services.
 * Keeps all API keys strictly server-side.
 */

export const OPENAI_CONFIG = {
  /**
   * Primary Chat & Understanding Model
   * Configured as gpt-6-luna (secondary fallback provider for AIDA).
   * Can be overridden at runtime via OPENAI_MODEL in .env
   */
  CHAT_MODEL: process.env.OPENAI_MODEL || "gpt-6-luna",

  /**
   * Timeouts in milliseconds
   */
  CHAT_TIMEOUT_MS: process.env.OPENAI_TIMEOUT_MS ? Number(process.env.OPENAI_TIMEOUT_MS) : 4000,
  UNDERSTANDING_TIMEOUT_MS: process.env.OPENAI_TIMEOUT_MS ? Number(process.env.OPENAI_TIMEOUT_MS) : 8500,
  GENERATION_TIMEOUT_MS: 8500,

  /**
   * Temperature for structured analysis (deterministic)
   */
  UNDERSTANDING_TEMPERATURE: 0.0,

  /**
   * Temperature for natural grounded generation (focused, natural)
   */
  GENERATION_TEMPERATURE: 0.3,
} as const;

/**
 * Returns the server-side OpenAI API key from environment variables.
 * Never exposed to client bundles.
 */
export function getOpenAIApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    return null;
  }
  return key.trim();
}

/**
 * Checks whether OpenAI is configured with a non-empty API key.
 */
export function isOpenAIConfigured(): boolean {
  return getOpenAIApiKey() !== null;
}
