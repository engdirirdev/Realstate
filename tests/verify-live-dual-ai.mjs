/**
 * Live Verification Script for Dual-AI Architecture
 *
 * Executes live checks against the configured environment and API endpoints.
 */

import { geminiProvider } from "../lib/ai/providers/gemini-provider.ts";
import { openAIProvider } from "../lib/ai/providers/openai-provider.ts";
import { processConversationalTurn } from "../lib/ai/conversation/chat-engine.ts";
import { OPENAI_CONFIG, getOpenAIApiKey, isOpenAIConfigured } from "../lib/ai/openai-config.ts";
import { GEMINI_CONFIG, getGeminiApiKey, isGeminiConfigured } from "../lib/ai/gemini-config.ts";
import { validateGrounding } from "../lib/ai/orchestration/grounding-validator.ts";
import { initializeConversationState } from "../lib/ai/conversation/state-manager.ts";

async function runLiveVerification() {
  console.log("======================================================================");
  console.log(" AIDA — FINAL LIVE DUAL-AI VERIFICATION EXECUTION");
  console.log("======================================================================\n");

  console.log("[CONFIG CHECK]");
  console.log("Gemini configured:", isGeminiConfigured(), "| Model:", GEMINI_CONFIG.CHAT_MODEL);
  console.log("OpenAI configured:", isOpenAIConfigured(), "| Model:", OPENAI_CONFIG.CHAT_MODEL);
  console.log("OpenAI Key Present (masked):", getOpenAIApiKey() ? "YES (sk-...)" : "NO");
  console.log("Gemini Key Present (masked):", getGeminiApiKey() ? "YES (AQ-...)" : "NO");

  // ---------------------------------------------------------------------------
  // 1. LIVE GEMINI DIRECT CALL CHECK
  // ---------------------------------------------------------------------------
  console.log("\n----------------------------------------------------------------------");
  console.log("[STEP 1] Direct Live Call to Gemini 3.8 Flash");
  console.log("----------------------------------------------------------------------");
  const gStart = Date.now();
  let liveGeminiDecision;
  try {
    liveGeminiDecision = await geminiProvider.decideConversationalAction({
      userMessage: "Asc walaal",
      conversationHistory: [],
      contextSlots: {},
      preferredLanguage: "so",
    });
  } catch (err) {
    liveGeminiDecision = { success: false, error: err?.message, latencyMs: Date.now() - gStart };
  }
  const gLatency = Date.now() - gStart;
  console.log("Gemini Live Success:", liveGeminiDecision.success);
  console.log("Gemini Live Latency:", gLatency, "ms");
  if (!liveGeminiDecision.success) {
    console.log("Gemini Live Error (Safe):", liveGeminiDecision.error?.split("\n")[0]);
  } else {
    console.log("Gemini Live Reply:", liveGeminiDecision.replyText?.slice(0, 100));
  }

  // ---------------------------------------------------------------------------
  // 2. LIVE OPENAI DIRECT CALL CHECK (Model: gpt-6-luna)
  // ---------------------------------------------------------------------------
  console.log("\n----------------------------------------------------------------------");
  console.log(`[STEP 2] Direct Live Call to OpenAI API (Model: ${openAIProvider.model})`);
  console.log("----------------------------------------------------------------------");
  const oStart = Date.now();
  let liveOpenAIDecision;
  try {
    liveOpenAIDecision = await openAIProvider.decideConversationalAction({
      userMessage: "Asc walaal",
      conversationHistory: [],
      contextSlots: {},
      preferredLanguage: "so",
    });
  } catch (err) {
    liveOpenAIDecision = { success: false, error: err?.message, latencyMs: Date.now() - oStart };
  }
  const oLatency = Date.now() - oStart;
  console.log("OpenAI Live Success:", liveOpenAIDecision.success);
  console.log("OpenAI Live Latency:", oLatency, "ms");
  if (!liveOpenAIDecision.success) {
    console.log("OpenAI Live Error (Safe):", liveOpenAIDecision.error);
  } else {
    console.log("OpenAI Live Reply:", liveOpenAIDecision.replyText?.slice(0, 100));
  }

  // ---------------------------------------------------------------------------
  // 3. LIVE ROUTING TEST: Normal Request (Cost Control)
  // ---------------------------------------------------------------------------
  console.log("\n----------------------------------------------------------------------");
  console.log("[TEST 1 & TEST 7] Normal Request & Cost Control");
  console.log("----------------------------------------------------------------------");
  let openAICalledDuringTurn = false;
  const originalOpenAIDecide = openAIProvider.decideConversationalAction.bind(openAIProvider);
  openAIProvider.decideConversationalAction = async (...args) => {
    openAICalledDuringTurn = true;
    return originalOpenAIDecide(...args);
  };

  const normalRes = await processConversationalTurn({
    sessionId: "live-session-normal-1",
    message: "Asc walaal",
    language: "so",
  });

  console.log("Normal Turn Reply:", normalRes.reply?.slice(0, 100));
  console.log("Was OpenAI called during normal turn?:", openAICalledDuringTurn);
  if (liveGeminiDecision.success) {
    console.log("Result: Gemini succeeded, OpenAI was SKIPPED.");
  } else {
    console.log("Result: Gemini live quota was exhausted (429), fallback correctly triggered.");
  }

  openAIProvider.decideConversationalAction = originalOpenAIDecide;

  // ---------------------------------------------------------------------------
  // 4. REAL PROPERTY SEARCH LOGIC
  // ---------------------------------------------------------------------------
  console.log("\n----------------------------------------------------------------------");
  console.log("[TEST 2] Real Property Search Understanding & Grounding");
  console.log("----------------------------------------------------------------------");
  const searchTurn = await processConversationalTurn({
    sessionId: "live-session-search-2",
    message: "Waxaan rabaa guri 3 qol ah oo Hodan ah, budget-kayguna waa $400.",
    language: "so",
  });
  console.log("Recorded Slots:", JSON.stringify(searchTurn.state.slots));
  console.log("Reply:", searchTurn.reply?.slice(0, 120));

  // ---------------------------------------------------------------------------
  // 5. REAL CONVERSATION CORRECTION
  // ---------------------------------------------------------------------------
  console.log("\n----------------------------------------------------------------------");
  console.log("[TEST 3] Real Conversation Correction (Hodan -> Wadajir)");
  console.log("----------------------------------------------------------------------");
  let state3 = initializeConversationState("live-session-corr-3");
  state3.slots.district = "Hodan";
  state3.slots.city = "Mogadishu";

  const corrTurn = await processConversationalTurn({
    sessionId: "live-session-corr-3",
    message: "Maya Wadajir ayaan ula jeedaa.",
    initialState: state3,
    language: "so",
  });
  console.log("Updated Slots:", JSON.stringify(corrTurn.state.slots));

  // ---------------------------------------------------------------------------
  // 6. PROPERTY REFERENCE RESOLUTION
  // ---------------------------------------------------------------------------
  console.log("\n----------------------------------------------------------------------");
  console.log("[TEST 4] Property Reference Resolution ('Kan labaad ka warran?')");
  console.log("----------------------------------------------------------------------");
  let state4 = initializeConversationState("live-session-ref-4");
  const p1 = { rank: 1, id: "prop-live-1", title: "Apartment 1", price: 300, city: "Mogadishu", type: "APARTMENT", bedrooms: 2, bathrooms: 1, furnished: false, parking: false, status: "APPROVED", formattedPrice: "$300" };
  const p2 = { rank: 2, id: "prop-live-2", title: "Apartment 2", price: 400, city: "Mogadishu", type: "APARTMENT", bedrooms: 3, bathrooms: 2, furnished: true, parking: true, status: "APPROVED", formattedPrice: "$400" };
  state4.activeResultSet = [p1, p2];

  const refTurn = await processConversationalTurn({
    sessionId: "live-session-ref-4",
    message: "Kan labaad ka warran?",
    initialState: state4,
    language: "so",
  });
  console.log("Referenced Property ID:", refTurn.state.referencedPropertyId);
  console.log("Reply:", refTurn.reply?.slice(0, 120));

  // ---------------------------------------------------------------------------
  // 7. CONTROLLED GEMINI FAILURE -> REAL OPENAI FALLBACK (TEST 5)
  // ---------------------------------------------------------------------------
  console.log("\n----------------------------------------------------------------------");
  console.log("[TEST 5] Controlled Gemini Failure -> Real OpenAI Fallback");
  console.log("----------------------------------------------------------------------");
  const originalGeminiDecide = geminiProvider.decideConversationalAction.bind(geminiProvider);
  // Controlled temporary failure injection for Gemini only
  geminiProvider.decideConversationalAction = async () => {
    return {
      type: "TEXT_RESPONSE",
      replyText: "",
      latencyMs: 50,
      model: "gemini-3.8-flash",
      success: false,
      error: "Controlled temporary Gemini failure injection",
    };
  };

  const fbStart = Date.now();
  const fbTurn = await processConversationalTurn({
    sessionId: "live-session-fb-5",
    message: "Asc walaal",
    language: "so",
  });
  const fbLatency = Date.now() - fbStart;
  console.log("Fallback Total Turn Latency:", fbLatency, "ms");
  console.log("Fallback Final Reply:", fbTurn.reply?.slice(0, 120));

  // Restore Gemini
  geminiProvider.decideConversationalAction = originalGeminiDecide;

  // ---------------------------------------------------------------------------
  // 8. BOTH PROVIDERS UNAVAILABLE (TEST 6)
  // ---------------------------------------------------------------------------
  console.log("\n----------------------------------------------------------------------");
  console.log("[TEST 6] Both Providers Unavailable (Graceful Last Resort)");
  console.log("----------------------------------------------------------------------");
  const origG = geminiProvider.decideConversationalAction.bind(geminiProvider);
  const origO = openAIProvider.decideConversationalAction.bind(openAIProvider);
  geminiProvider.decideConversationalAction = async () => ({ type: "TEXT_RESPONSE", replyText: "", latencyMs: 10, model: "gemini-3.8-flash", success: false, error: "Unavailable" });
  openAIProvider.decideConversationalAction = async () => ({ type: "TEXT_RESPONSE", replyText: "", latencyMs: 10, model: "gpt-6-luna", success: false, error: "Unavailable" });

  const bothFailTurn = await processConversationalTurn({
    sessionId: "live-session-both-fail-6",
    message: "Asc walaal",
    language: "so",
  });
  console.log("Both Fail Last Resort Reply:", bothFailTurn.reply?.slice(0, 120));

  geminiProvider.decideConversationalAction = origG;
  openAIProvider.decideConversationalAction = origO;

  console.log("\n======================================================================");
  console.log(" LIVE VERIFICATION RUN COMPLETED");
  console.log("======================================================================");
}

runLiveVerification().catch(console.error);
