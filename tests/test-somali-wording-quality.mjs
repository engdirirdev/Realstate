/**
 * Somali Real Estate Conversational Wording Quality & Intent Verification Suite
 */

import { processConversationalTurn } from "../lib/ai/conversation/chat-engine.ts";
import { evaluateSearchReadiness } from "../lib/ai/conversation/state-manager.ts";
import { extractEntities } from "../lib/ai/nlu/entity-extractor.ts";

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
console.log(" AIDA — SOMALI REAL ESTATE CONVERSATION WORDING QUALITY TEST");
console.log("======================================================================\n");

// ---------------------------------------------------------------------------
// TEST 1: RENTAL INTENT (Apartment 3 bedroom)
// ---------------------------------------------------------------------------
console.log("[TEST 1] Rental intent wording: 'Waxaan rabaa apartment 3 bedroom ah.'");
{
  const res = await processConversationalTurn({
    sessionId: "test-rental-" + Date.now(),
    message: "Waxaan rabaa apartment 3 bedroom ah.",
    language: "so",
  });

  console.log(`  AIDA: "${res.reply}"`);
  assert(res.responseType === "CLARIFICATION", `Response type is CLARIFICATION (got ${res.responseType})`);
  assert(res.state.slots.propertyType === "APARTMENT", `Captured APARTMENT`);
  assert(res.state.slots.bedrooms === 3, `Captured 3 bedrooms`);
  assert(res.state.slots.purpose === "RENT", `Defaulted apartment in Kiro-Maal to RENT purpose`);
  assert(
    res.reply === "Waad heli kartaa! Magaaladee ayaad rabtaa inaad ka kireysato?",
    `Uses natural rental Somali wording: "Waad heli kartaa! Magaaladee ayaad rabtaa inaad ka kireysato?"`,
    `got: "${res.reply}"`
  );
  assert(!res.reply.includes("noocee ah"), `Does NOT contain unnatural "noocee ah"`);
}

// ---------------------------------------------------------------------------
// TEST 2: BUYING INTENT (Guri iib ah)
// ---------------------------------------------------------------------------
console.log("\n[TEST 2] Buying intent wording: 'Waxaan rabaa guri iib ah oo 3 qol ah.'");
{
  const res = await processConversationalTurn({
    sessionId: "test-sale-" + Date.now(),
    message: "Waxaan rabaa guri iib ah oo 3 qol ah.",
    language: "so",
  });

  console.log(`  AIDA: "${res.reply}"`);
  assert(res.responseType === "CLARIFICATION", `Response type is CLARIFICATION (got ${res.responseType})`);
  assert(res.state.slots.purpose === "SALE", `Captured SALE purpose`);
  assert(res.state.slots.bedrooms === 3, `Captured 3 bedrooms`);
  assert(
    res.reply === "Waad heli kartaa! Magaaladee ayaad rabtaa inaad ka iibsato?",
    `Uses natural purchase Somali wording: "Waad heli kartaa! Magaaladee ayaad rabtaa inaad ka iibsato?"`,
    `got: "${res.reply}"`
  );
  assert(!res.reply.includes("kireysato"), `Does NOT use rental wording for buying intent`);
  assert(!res.reply.includes("noocee ah"), `Does NOT contain unnatural "noocee ah"`);
}

// ---------------------------------------------------------------------------
// TEST 3: GENERAL REAL ESTATE SEARCH (No rent/sale specified)
// ---------------------------------------------------------------------------
console.log("\n[TEST 3] General real estate wording: 'Waxaan rabaa guri 3 qol ah.'");
{
  const res = await processConversationalTurn({
    sessionId: "test-general-" + Date.now(),
    message: "Waxaan rabaa guri 3 qol ah.",
    language: "so",
  });

  console.log(`  AIDA: "${res.reply}"`);
  assert(res.responseType === "CLARIFICATION", `Response type is CLARIFICATION (got ${res.responseType})`);
  assert(
    res.reply === "Waad heli kartaa! Magaaladee ayaad ka raadinaysaa?",
    `Uses neutral natural Somali wording: "Waad heli kartaa! Magaaladee ayaad ka raadinaysaa?"`,
    `got: "${res.reply}"`
  );
  assert(!res.reply.includes("noocee ah"), `Does NOT contain unnatural "noocee ah"`);
}

// ---------------------------------------------------------------------------
// TEST 4: LOCATION ALREADY PROVIDED (Hodan -> Mogadishu) -> NEVER RE-ASK CITY
// ---------------------------------------------------------------------------
console.log("\n[TEST 4] Location provided upfront: 'Waxaan rabaa apartment 3 bedroom ah oo Hodan ah.'");
{
  const res = await processConversationalTurn({
    sessionId: "test-location-upfront-" + Date.now(),
    message: "Waxaan rabaa apartment 3 bedroom ah oo Hodan ah.",
    language: "so",
  });

  console.log(`  AIDA: "${res.reply}"`);
  assert(res.state.slots.propertyType === "APARTMENT", `Preserved APARTMENT`);
  assert(res.state.slots.bedrooms === 3, `Preserved 3 bedrooms`);
  assert(res.state.slots.district === "Hodan", `Preserved district Hodan`);
  assert(res.state.slots.city === "Mogadishu", `Mapped city to Mogadishu`);
  assert(res.responseType === "CLARIFICATION", `Asks for next missing requirement (budget)`);
  assert(res.missingSlots?.includes("budget"), `Identified missing slot as budget`);
  assert(!res.reply.includes("Magaaladee"), `NEVER asks for city again when location already known`);
  assert(!res.reply.includes("magaalo"), `Does NOT mention missing city`);
  assert(res.reply.includes("Miisaaniyadda") || res.reply.includes("miisaaniyadda"), `Asks for budget directly`);
}

// ---------------------------------------------------------------------------
// TEST 5: ENGLISH & ARABIC ARE UNCHANGED
// ---------------------------------------------------------------------------
console.log("\n[TEST 5] Multilingual integrity: English & Arabic responses");
{
  const enRes = await processConversationalTurn({
    sessionId: "test-en-" + Date.now(),
    message: "I want a 3 bedroom apartment.",
    language: "en",
  });
  console.log(`  AIDA (EN): "${enRes.reply}"`);
  assert(enRes.responseType === "CLARIFICATION", `EN responseType is CLARIFICATION`);
  assert(
    enRes.reply.includes("Which city would you like me to search in?") || enRes.reply.includes("Which city are you looking to find property in?"),
    `English wording preserved unchanged`
  );

  const arRes = await processConversationalTurn({
    sessionId: "test-ar-" + Date.now(),
    message: "أريد شقة 3 غرف نوم.",
    language: "ar",
  });
  console.log(`  AIDA (AR): "${arRes.reply}"`);
  assert(arRes.responseType === "CLARIFICATION", `AR responseType is CLARIFICATION`);
  assert(
    arRes.reply.includes("في أي مدينة") && arRes.reply.includes("عقارات للإيجار"),
    `Arabic wording preserved unchanged`
  );
}

console.log("\n======================================================================");
console.log(` FINAL TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
console.log("======================================================================\n");

if (failed > 0) process.exit(1);
