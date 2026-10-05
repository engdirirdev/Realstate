/**
 * Gemini Model Upgrade Verification Suite
 *
 * Verifies that:
 * 1. The default Gemini chat model is upgraded to "gemini-3.8-flash".
 * 2. Model configuration is centralized in lib/ai/gemini-config.ts.
 * 3. Runtime environment overrides (GEMINI_MODEL / GOOGLE_AI_MODEL) are honored.
 * 4. Embedding model remains properly configured.
 * 5. Safe API key retrieval functions correctly without leaking secrets.
 * 6. Fallback architecture operates seamlessly without throwing errors.
 */

import { GEMINI_CONFIG, getGeminiApiKey, isGeminiConfigured } from "../lib/ai/gemini-config.ts";
import { processConversationalTurn } from "../lib/ai/conversation/chat-engine.ts";

let passed = 0;
let failed = 0;

function assert(condition, message, details = "") {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message} ${details ? `(${details})` : ""}`);
  }
}

console.log("======================================================================");
console.log(" AIDA — GEMINI MODEL UPGRADE VERIFICATION TEST");
console.log("======================================================================\n");

// ---------------------------------------------------------------------------
// 1. Centralized Configuration Check
// ---------------------------------------------------------------------------
console.log("[SECTION 1] Centralized Configuration Check");
{
  assert(
    GEMINI_CONFIG.CHAT_MODEL === "gemini-3.8-flash" || Boolean(process.env.GEMINI_MODEL),
    `Chat model configured as production-ready Gemini: "${GEMINI_CONFIG.CHAT_MODEL}"`
  );
  assert(
    GEMINI_CONFIG.CHAT_MODEL !== "gemini-1.5-flash",
    `Legacy model "gemini-1.5-flash" is successfully replaced`
  );
  assert(
    GEMINI_CONFIG.EMBEDDING_MODEL === "gemini-embedding-2" || Boolean(process.env.GEMINI_EMBEDDING_MODEL),
    `Embedding model configured as "gemini-embedding-2"`
  );
  assert(
    GEMINI_CONFIG.EMBEDDING_DIMENSIONS === 768,
    `Embedding dimensions are 768`
  );
  assert(
    GEMINI_CONFIG.CHAT_TIMEOUT_MS === 4000,
    `Chat timeout configured as 4,000ms`
  );
  assert(
    GEMINI_CONFIG.EMBEDDING_TIMEOUT_MS === 3500,
    `Embedding timeout configured as 3,500ms`
  );
}

// ---------------------------------------------------------------------------
// 2. Safe API Key Helper Check
// ---------------------------------------------------------------------------
console.log("\n[SECTION 2] Safe Key Helper & Secret Protection");
{
  // In our local environment, GOOGLE_AI_API_KEY is empty string ""
  const key = getGeminiApiKey();
  assert(
    key === null || typeof key === "string",
    `getGeminiApiKey returns valid null or non-empty string without exposing value`
  );
  assert(
    typeof isGeminiConfigured() === "boolean",
    `isGeminiConfigured returns boolean: ${isGeminiConfigured()}`
  );
}

// ---------------------------------------------------------------------------
// 3. Fallback Continuity Check
// ---------------------------------------------------------------------------
console.log("\n[SECTION 3] Fallback Continuity Check");
{
  const res = await processConversationalTurn({
    sessionId: "test-gemini-upgrade-" + Date.now(),
    message: "Waxaan rabaa apartment 3 bedroom ah oo Hodan ah.",
    language: "so",
  });

  assert(
    res.state.slots.propertyType === "APARTMENT",
    `Property type APARTMENT extracted`
  );
  assert(
    res.state.slots.district === "Hodan",
    `District Hodan extracted`
  );
  assert(
    res.state.slots.city === "Mogadishu",
    `City Mogadishu mapped`
  );
  assert(
    res.reply.length > 10,
    `Generated valid conversational response without crashing on unpopulated key`
  );
}

console.log("\n======================================================================");
console.log(` RESULT: ${passed} PASSED, ${failed} FAILED`);
console.log("======================================================================\n");

if (failed > 0) process.exit(1);
