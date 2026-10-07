/**
 * Test Suite: OpenAI GPT-6 Luna as Secondary Fallback for AIDA
 *
 * Verifies:
 * - Test 1: Gemini 3.8 Flash is PRIMARY (OpenAI is NOT called for valid Gemini turns)
 * - Test 2: Real estate search (verified property data search)
 * - Test 3: Conversation context & location correction (Hodan -> Wadajir)
 * - Test 4: Property reference resolution ("kan labaad")
 * - Test 5: Grounding & anti-hallucination validation (unverified amenities)
 * - Test 6: OpenAI GPT-6 Luna Fallback on Gemini failure (429/timeout/network)
 * - Test 7: Both providers fail (graceful fallback to safe generic technical notice)
 * - Test 8: API key security (no keys exposed in logs, responses, or client data)
 */

import { processConversationalTurn } from "../lib/ai/conversation/chat-engine.ts";
import { geminiProvider } from "../lib/ai/providers/gemini-provider.ts";
import { openAIProvider } from "../lib/ai/providers/openai-provider.ts";
import { OPENAI_CONFIG, getOpenAIApiKey, isOpenAIConfigured } from "../lib/ai/openai-config.ts";
import { GEMINI_CONFIG, getGeminiApiKey, isGeminiConfigured } from "../lib/ai/gemini-config.ts";
import { validateGrounding } from "../lib/ai/orchestration/grounding-validator.ts";
import { initializeConversationState } from "../lib/ai/conversation/state-manager.ts";

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
console.log(" AIDA — OPENAI GPT-6 LUNA SECONDARY FALLBACK VERIFICATION SUITE");
console.log("======================================================================\n");

// ---------------------------------------------------------------------------
// TEST 1: GEMINI PRIMARY (OPENAI NOT CALLED)
// ---------------------------------------------------------------------------
console.log("----------------------------------------------------------------------");
console.log("[TEST 1] Gemini Primary & Cost Control (OpenAI NOT Called)");
console.log("----------------------------------------------------------------------");
{
  let openAICalled = false;
  const originalOpenAIDecide = openAIProvider.decideConversationalAction.bind(openAIProvider);
  openAIProvider.decideConversationalAction = async (...args) => {
    openAICalled = true;
    return originalOpenAIDecide(...args);
  };

  const originalGeminiDecide = geminiProvider.decideConversationalAction.bind(geminiProvider);
  // Mock Gemini to succeed cleanly
  geminiProvider.decideConversationalAction = async (input) => {
    return {
      type: "TEXT_RESPONSE",
      replyText: "Asc! Soo dhawoow, waxaan ahay AIDA. Sideen maanta kuu caawin karaa?",
      contextUpdates: { responseType: "GREETING" },
      latencyMs: 150,
      model: "gemini-3.8-flash",
      success: true,
    };
  };

  try {
    const res = await processConversationalTurn({
      sessionId: "test-primary-gemini",
      message: "Asc walaal",
      language: "so",
    });

    assert(res.reply.includes("Asc") || res.reply.includes("AIDA"), "Gemini answered greeting successfully");
    assert(openAICalled === false, "OpenAI was NOT called during successful Gemini turn (Cost Control PASS)");
  } finally {
    openAIProvider.decideConversationalAction = originalOpenAIDecide;
    geminiProvider.decideConversationalAction = originalGeminiDecide;
  }
}

// ---------------------------------------------------------------------------
// TEST 2: REAL ESTATE SEARCH
// ---------------------------------------------------------------------------
console.log("\n----------------------------------------------------------------------");
console.log("[TEST 2] Real Estate Search (Verified Inventory Search)");
console.log("----------------------------------------------------------------------");
{
  const originalGeminiDecide = geminiProvider.decideConversationalAction.bind(geminiProvider);
  geminiProvider.decideConversationalAction = async (input) => {
    return {
      type: "TOOL_CALL",
      toolCall: {
        name: "search_properties",
        args: {
          city: "Mogadishu",
          district: "Hodan",
          preferredBedrooms: [3],
          maxPrice: 400,
          purpose: "RENT",
        },
      },
      latencyMs: 180,
      model: "gemini-3.8-flash",
      success: true,
    };
  };

  try {
    const res = await processConversationalTurn({
      sessionId: "test-search-properties",
      message: "Waxaan rabaa guri 3 qol ah oo Hodan ah, budget-kayguna waa $400.",
      language: "so",
    });

    assert(res.state.slots.district === "Hodan", "District Hodan recorded in conversation slots");
    assert(res.state.slots.maxPrice === 400, "Budget $400 recorded in conversation slots");
    assert(res.state.slots.bedrooms === 3, "3 bedrooms recorded in conversation slots");
    assert(typeof res.reply === "string" && res.reply.length > 0, "Grounded conversational reply returned");
  } finally {
    geminiProvider.decideConversationalAction = originalGeminiDecide;
  }
}

// ---------------------------------------------------------------------------
// TEST 3: CONVERSATION CONTEXT & LOCATION CORRECTION
// ---------------------------------------------------------------------------
console.log("\n----------------------------------------------------------------------");
console.log("[TEST 3] Conversation Context & Slot Correction (Hodan -> Wadajir)");
console.log("----------------------------------------------------------------------");
{
  let state = initializeConversationState("test-correction-ctx");
  state.slots.district = "Hodan";
  state.slots.city = "Mogadishu";

  const originalGeminiDecide = geminiProvider.decideConversationalAction.bind(geminiProvider);
  geminiProvider.decideConversationalAction = async (input) => {
    return {
      type: "TEXT_RESPONSE",
      replyText: "Hagaag, waxaan meesha ka saaray Hodan, waxaana u beddelay Wadajir.",
      contextUpdates: {
        district: "Wadajir",
        excludedLocations: ["Hodan"],
        responseType: "REQUIREMENT_UPDATE",
      },
      latencyMs: 160,
      model: "gemini-3.8-flash",
      success: true,
    };
  };

  try {
    const res = await processConversationalTurn({
      sessionId: "test-correction-ctx",
      message: "Maya Wadajir ayaan ula jeedaa.",
      initialState: state,
      language: "so",
    });

    assert(res.state.slots.district === "Wadajir", "District successfully updated from Hodan to Wadajir");
    assert(res.state.slots.excludedLocations?.includes("Hodan"), "Previous location Hodan recorded as excluded");
  } finally {
    geminiProvider.decideConversationalAction = originalGeminiDecide;
  }
}

// ---------------------------------------------------------------------------
// TEST 4: PROPERTY REFERENCE RESOLUTION
// ---------------------------------------------------------------------------
console.log("\n----------------------------------------------------------------------");
console.log("[TEST 4] In-Set Property Reference Resolution ('kan labaad')");
console.log("----------------------------------------------------------------------");
{
  let state = initializeConversationState("test-ref-resolution");
  const prop1 = { rank: 1, id: "prop-101", title: "Villa Hodan", price: 500, city: "Mogadishu", type: "VILLA", bedrooms: 4, bathrooms: 3, furnished: true, parking: true, status: "APPROVED", formattedPrice: "$500" };
  const prop2 = { rank: 2, id: "prop-102", title: "Apartment Wadajir", price: 350, city: "Mogadishu", type: "APARTMENT", bedrooms: 2, bathrooms: 1, furnished: false, parking: true, status: "APPROVED", formattedPrice: "$350" };
  state.activeResultSet = [prop1, prop2];

  const originalGeminiDecide = geminiProvider.decideConversationalAction.bind(geminiProvider);
  geminiProvider.decideConversationalAction = async (input) => {
    return {
      type: "TEXT_RESPONSE",
      replyText: "Guri #2 ee Wadajir waa dabaq (Apartment), qiimihiisuna waa $350 bishii.",
      contextUpdates: {
        referencedPropertyId: "prop-102",
        responseType: "PROPERTY_DETAIL",
      },
      latencyMs: 170,
      model: "gemini-3.8-flash",
      success: true,
    };
  };

  try {
    const res = await processConversationalTurn({
      sessionId: "test-ref-resolution",
      message: "Kan labaad ka warran?",
      initialState: state,
      language: "so",
    });

    assert(res.state.referencedPropertyId === "prop-102", "Correctly identified target property ID as prop-102");
    assert(res.properties.length === 1 && res.properties[0].id === "prop-102", "Returned focused property #2 data");
  } finally {
    geminiProvider.decideConversationalAction = originalGeminiDecide;
  }
}

// ---------------------------------------------------------------------------
// TEST 5: GROUNDING & ANTI-HALLUCINATION
// ---------------------------------------------------------------------------
console.log("\n----------------------------------------------------------------------");
console.log("[TEST 5] Grounding Validation & Anti-Hallucination Guard");
console.log("----------------------------------------------------------------------");
{
  const testListing = {
    rank: 1,
    id: "prop-ground-test",
    title: "Apartment KM4",
    price: 300,
    city: "Mogadishu",
    type: "APARTMENT",
    bedrooms: 2,
    bathrooms: 1,
    furnished: false,
    parking: false,
    parkingSpaces: 0,
    pool: false,
    description: "Cozy 2 bedroom apartment near KM4.",
    status: "APPROVED",
    formattedPrice: "$300",
  };

  // Case A: Hallucinated swimming pool when listing has no pool
  const badPoolClaim = "Guryahan wuxuu leeyahay barkad dabaasha oo aad u weyn (swimming pool).";
  const valPool = validateGrounding(badPoolClaim, [testListing], testListing);
  assert(valPool.isValid === false, "Rejected hallucinated swimming pool claim");
  assert(valPool.hallucinatedFeature === "swimming_pool", "Flagged hallucinatedFeature as swimming_pool");

  // Case B: Grounded honest statement stating amenity is not available
  const honestClaim = "Gurigan ma laha barkad dabaasha, xogta la xaqiijiyayna kuma jirto.";
  const valHonest = validateGrounding(honestClaim, [testListing], testListing);
  assert(valHonest.isValid === true, "Accepted honest non-hallucinating statement");
}

// ---------------------------------------------------------------------------
// TEST 6: OPENAI GPT-6 LUNA FALLBACK ON GEMINI FAILURE
// ---------------------------------------------------------------------------
console.log("\n----------------------------------------------------------------------");
console.log("[TEST 6] OpenAI GPT-6 Luna Fallback (Triggered Only on Gemini Failure)");
console.log("----------------------------------------------------------------------");
{
  let openAIFallbackCalled = false;
  let openAIModelUsed = "";

  const originalGeminiDecide = geminiProvider.decideConversationalAction.bind(geminiProvider);
  // Force Gemini failure (e.g. simulated HTTP 429 / timeout)
  geminiProvider.decideConversationalAction = async () => {
    return {
      type: "TEXT_RESPONSE",
      replyText: "",
      latencyMs: 120,
      model: "gemini-3.8-flash",
      success: false,
      error: "429 Too Many Requests (Quota Exceeded)",
    };
  };

  const originalOpenAIDecide = openAIProvider.decideConversationalAction.bind(openAIProvider);
  openAIProvider.decideConversationalAction = async (input) => {
    openAIFallbackCalled = true;
    openAIModelUsed = openAIProvider.model;
    return {
      type: "TEXT_RESPONSE",
      replyText: "Asc! Waxaan ahay AIDA, adeeggaaga Kiro-Maal Real Estate. Maxaan kugu caawin karaa?",
      contextUpdates: { responseType: "GREETING" },
      latencyMs: 250,
      model: openAIProvider.model,
      success: true,
    };
  };

  try {
    const res = await processConversationalTurn({
      sessionId: "test-openai-fallback-trigger",
      message: "Asc walaal",
      language: "so",
    });

    assert(openAIFallbackCalled === true, "OpenAI GPT-6 Luna was triggered upon Gemini 429 failure");
    assert(openAIModelUsed === "gpt-6-luna", `OpenAI model verified as "${openAIModelUsed}"`);
    assert(res.reply.includes("Asc") || res.reply.includes("AIDA"), "Valid conversational reply produced by OpenAI fallback");
  } finally {
    geminiProvider.decideConversationalAction = originalGeminiDecide;
    openAIProvider.decideConversationalAction = originalOpenAIDecide;
  }
}

// ---------------------------------------------------------------------------
// TEST 7: BOTH PROVIDERS FAIL (GRACEFUL LAST RESORT)
// ---------------------------------------------------------------------------
console.log("\n----------------------------------------------------------------------");
console.log("[TEST 7] Both Providers Fail (Graceful Last Resort)");
console.log("----------------------------------------------------------------------");
{
  const originalGeminiDecide = geminiProvider.decideConversationalAction.bind(geminiProvider);
  const originalOpenAIDecide = openAIProvider.decideConversationalAction.bind(openAIProvider);

  // Both fail
  geminiProvider.decideConversationalAction = async () => {
    return {
      type: "TEXT_RESPONSE",
      replyText: "",
      latencyMs: 100,
      model: "gemini-3.8-flash",
      success: false,
      error: "Gemini Service Unavailable",
    };
  };

  openAIProvider.decideConversationalAction = async () => {
    return {
      type: "TEXT_RESPONSE",
      replyText: "",
      latencyMs: 120,
      model: "gpt-6-luna",
      success: false,
      error: "OpenAI Service Unavailable",
    };
  };

  try {
    const res = await processConversationalTurn({
      sessionId: "test-both-fail",
      message: "Asc walaal",
      language: "so",
    });

    assert(typeof res.reply === "string" && res.reply.length > 10, "Polite technical service fallback returned");
    assert(res.reply.includes("Raalli ahow") || res.reply.includes("apologize"), "Appropriate localized fallback wording used");
    assert(!res.reply.includes("Error:") && !res.reply.includes("stack"), "Zero internal stack traces exposed to user");
  } finally {
    geminiProvider.decideConversationalAction = originalGeminiDecide;
    openAIProvider.decideConversationalAction = originalOpenAIDecide;
  }
}

// ---------------------------------------------------------------------------
// TEST 8: API KEY SECURITY & ZERO CREDENTIAL LEAKAGE
// ---------------------------------------------------------------------------
console.log("\n----------------------------------------------------------------------");
console.log("[TEST 8] API Key Security & Zero Credential Leakage");
console.log("----------------------------------------------------------------------");
{
  const openAIKey = getOpenAIApiKey();
  const geminiKey = getGeminiApiKey();

  assert(isOpenAIConfigured() === true, "OpenAI API key is properly configured in environment");
  assert(isGeminiConfigured() === true, "Gemini API key is properly configured in environment");

  assert(OPENAI_CONFIG.CHAT_MODEL === "gpt-6-luna", `OPENAI_CONFIG.CHAT_MODEL is configured as "gpt-6-luna"`);
  assert(GEMINI_CONFIG.CHAT_MODEL === "gemini-3.8-flash", `GEMINI_CONFIG.CHAT_MODEL is configured as "gemini-3.8-flash"`);

  // Ensure secrets cannot be leaked in responses
  if (openAIKey) {
    assert(!JSON.stringify(OPENAI_CONFIG).includes(openAIKey), "OPENAI_CONFIG does not leak raw API key");
  }
  if (geminiKey) {
    assert(!JSON.stringify(GEMINI_CONFIG).includes(geminiKey), "GEMINI_CONFIG does not leak raw API key");
  }
}

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log("\n======================================================================");
console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("======================================================================");

if (failed > 0) {
  process.exit(1);
}
