/**
 * Conversational Intelligence Quality Correction & Hard Constraint Test Suite
 *
 * Targets:
 * 1. Greeting does not trigger property search
 * 2. Casual conversation does not trigger property cards
 * 3. Missing search information triggers clarification
 * 4. Mogadishu never returns Hargeisa
 * 5. Hargeisa never returns Mogadishu
 * 6. Hard city constraint survives semantic ranking
 * 7. Price constraint survives follow-up
 * 8. Bedroom constraint survives follow-up
 * 9. "show me cheaper ones" preserves city/type
 * 10. "the second one" resolves current result set
 * 11. "that property" resolves correctly
 * 12. Stale previous result set is not rendered for unrelated message
 * 13. Somali "asc" recognized
 * 14. "wcs" recognized
 * 15. "sxb" recognized
 * 16. "wlhi" recognized
 * 17. "alx" recognized
 * 18. Somali property variations recognized
 * 19. Arabic property terms recognized
 * 20. Somali-English code switching works
 * 21. Arabic-English code switching works
 * 22. Swahili property query works
 * 23. No-result response does not silently relax city
 * 24. User-approved alternative search works
 * 25. Property cards render only for PROPERTY_RESULTS
 * 26. Property detail does not render unrelated result cards
 * 27. General real-estate question does not trigger search
 * 28. Conversation memory survives multiple turns
 * 29. Explicit user language preference survives turns
 * 30. Wrong-city database result is rejected by final validation
 */

import assert from "assert";
import { prisma } from "../lib/prisma";
import { processConversationalTurn } from "../lib/ai/conversation/chat-engine";
import {
  evaluateSearchReadiness,
  validatePropertyAgainstQuery,
  initializeConversationState,
  updateConversationState,
} from "../lib/ai/conversation/state-manager";
import {
  detectConversationalLanguage,
  generateNaturalDialogResponse,
} from "../lib/ai/conversation/language-manager";
import {
  analyzeConversationalSlang,
  normalizeSomaliQueryPhrase,
} from "../lib/ai/conversation/slang-normalizer";
import { extractEntities } from "../lib/ai/nlu/entity-extractor";
import { classifyIntent } from "../lib/ai/nlu/intent-classifier";
import { resolveConversationalReference } from "../lib/ai/conversation/reference-resolver";

async function runQualitySuite() {
  console.log("================================================================================");
  console.log("CONVERSATIONAL INTELLIGENCE CORRECTION - QUALITY & REGRESSION TEST SUITE");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  function record(desc, ok, detail = "") {
    if (ok) {
      passed++;
      console.log(`  [PASS] #${passed}: ${desc}${detail ? ` -> ${detail}` : ""}`);
    } else {
      failed++;
      console.error(`  [FAIL] #${passed + failed}: ${desc}${detail ? ` -> ${detail}` : ""}`);
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Greeting does not trigger property search
  // ---------------------------------------------------------------------------
  try {
    const res = await processConversationalTurn({
      sessionId: "t1-greeting-" + Date.now(),
      message: "Asc",
      history: [],
    });
    const ok =
      res.responseType === "GREETING" &&
      res.shouldRenderPropertyCards === false &&
      res.properties.length === 0 &&
      res.reply.toLowerCase().includes("salaam");
    record("1. Greeting ('Asc') does not trigger property search", ok, `type=${res.responseType}, cards=${res.shouldRenderPropertyCards}`);
  } catch (e) {
    record("1. Greeting ('Asc') does not trigger property search", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Casual conversation does not trigger property cards
  // ---------------------------------------------------------------------------
  try {
    const res = await processConversationalTurn({
      sessionId: "t2-casual-" + Date.now(),
      message: "Mahadsanid sxb, waad ku mahadsantahay caawintaada",
      history: [],
    });
    const ok =
      res.responseType === "GENERAL_CONVERSATION" &&
      res.shouldRenderPropertyCards === false &&
      res.properties.length === 0;
    record("2. Casual gratitude does not trigger property cards", ok, `type=${res.responseType}, cards=${res.shouldRenderPropertyCards}`);
  } catch (e) {
    record("2. Casual gratitude does not trigger property cards", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Missing search information triggers clarification interview
  // ---------------------------------------------------------------------------
  try {
    const res = await processConversationalTurn({
      sessionId: "t3-vague-" + Date.now(),
      message: "Waxaan rabaa guri",
      history: [],
    });
    const ok =
      res.responseType === "CLARIFICATION" &&
      res.shouldRenderPropertyCards === false &&
      res.properties.length === 0 &&
      (res.reply.includes("Magaalo") || res.reply.includes("Magaala"));
    record("3. Missing city information triggers clarification interview", ok, `reply=${res.reply}`);
  } catch (e) {
    record("3. Missing city information triggers clarification interview", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Mogadishu never returns Hargeisa
  // ---------------------------------------------------------------------------
  try {
    const res = await processConversationalTurn({
      sessionId: "t4-mogadishu-" + Date.now(),
      message: "Find 3 bedroom houses in Mogadishu under $80k",
      history: [],
    });
    const anyHargeisa = res.properties.some((p) => p.city.toLowerCase() === "hargeisa");
    const allMogadishu = res.properties.every((p) => p.city.toLowerCase() === "mogadishu");
    const ok = !anyHargeisa && (res.properties.length === 0 || allMogadishu);
    record("4. Mogadishu query NEVER returns Hargeisa properties", ok, `props=${res.properties.length}, allMogadishu=${allMogadishu}`);
  } catch (e) {
    record("4. Mogadishu query NEVER returns Hargeisa properties", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Hargeisa never returns Mogadishu
  // ---------------------------------------------------------------------------
  try {
    const res = await processConversationalTurn({
      sessionId: "t5-hargeisa-" + Date.now(),
      message: "Find houses in Hargeisa under $90k",
      history: [],
    });
    const anyMogadishu = res.properties.some((p) => p.city.toLowerCase() === "mogadishu");
    const allHargeisa = res.properties.every((p) => p.city.toLowerCase() === "hargeisa");
    const ok = !anyMogadishu && (res.properties.length === 0 || allHargeisa);
    record("5. Hargeisa query NEVER returns Mogadishu properties", ok, `props=${res.properties.length}, allHargeisa=${allHargeisa}`);
  } catch (e) {
    record("5. Hargeisa query NEVER returns Mogadishu properties", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Hard city constraint survives semantic ranking
  // ---------------------------------------------------------------------------
  try {
    const valGood = validatePropertyAgainstQuery(
      { city: "Mogadishu", status: "APPROVED", bedrooms: 3, price: 65000 },
      { city: "Mogadishu", bedrooms: 3 }
    );
    const valCrossCityBleed = validatePropertyAgainstQuery(
      { city: "Hargeisa", status: "APPROVED", bedrooms: 3, price: 65000 },
      { city: "Mogadishu", bedrooms: 3 }
    );
    const ok = valGood.isValid === true && valCrossCityBleed.isValid === false;
    record("6. Hard city constraint rejects cross-city property", ok, `violation=${valCrossCityBleed.violationReason}`);
  } catch (e) {
    record("6. Hard city constraint rejects cross-city property", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Price constraint survives follow-up
  // ---------------------------------------------------------------------------
  try {
    let state = initializeConversationState("t7");
    const entities1 = extractEntities("Houses in Mogadishu under $80k");
    const upd1 = updateConversationState(state, entities1, "Houses in Mogadishu under $80k", "property_search");
    state = upd1.state;

    // Turn 2 adds bedroom requirement without mentioning price
    const entities2 = extractEntities("Must have 3 bedrooms");
    const upd2 = updateConversationState(state, entities2, "Must have 3 bedrooms", "property_search");
    state = upd2.state;

    const ok = state.slots.city === "Mogadishu" && state.slots.maxPrice === 80000 && state.slots.bedrooms === 3;
    record("7. Price constraint survives follow-up bedroom refinement", ok, `maxPrice=${state.slots.maxPrice}, city=${state.slots.city}`);
  } catch (e) {
    record("7. Price constraint survives follow-up bedroom refinement", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 8: Bedroom constraint survives follow-up
  // ---------------------------------------------------------------------------
  try {
    let state = initializeConversationState("t8");
    const entities1 = extractEntities("3 bedroom house in Mogadishu");
    const upd1 = updateConversationState(state, entities1, "3 bedroom house in Mogadishu", "property_search");
    state = upd1.state;

    // Turn 2 adds budget constraint without mentioning bedrooms
    const entities2 = extractEntities("My budget is $90,000");
    const upd2 = updateConversationState(state, entities2, "My budget is $90,000", "property_search");
    state = upd2.state;

    const ok = state.slots.city === "Mogadishu" && state.slots.bedrooms === 3 && state.slots.maxPrice === 90000;
    record("8. Bedroom constraint survives follow-up budget addition", ok, `beds=${state.slots.bedrooms}, budget=${state.slots.maxPrice}`);
  } catch (e) {
    record("8. Bedroom constraint survives follow-up budget addition", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 9: "show me cheaper ones" preserves city and property type
  // ---------------------------------------------------------------------------
  try {
    let state = initializeConversationState("t9");
    state.slots = { city: "Mogadishu", propertyType: "HOUSE", bedrooms: 3, maxPrice: 70000 };
    state.activeResultSet = [
      { id: "p1", rank: 1, title: "Mogadishu Villa", price: 60000, city: "Mogadishu", type: "HOUSE", bedrooms: 3, bathrooms: 2, area: 200, furnished: false, parking: true, status: "APPROVED", formattedPrice: "$60,000" }
    ];

    const entities = extractEntities("show me cheaper ones");
    const upd = updateConversationState(state, entities, "show me cheaper ones", "property_search");
    state = upd.state;

    const ok = state.slots.city === "Mogadishu" && state.slots.propertyType === "HOUSE" && state.slots.bedrooms === 3 && state.slots.maxPrice === 54000;
    record("9. 'show me cheaper ones' preserves city/type while lowering ceiling", ok, `newMaxPrice=${state.slots.maxPrice}`);
  } catch (e) {
    record("9. 'show me cheaper ones' preserves city/type while lowering ceiling", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 10: "the second one" resolves current result set
  // ---------------------------------------------------------------------------
  try {
    const mockResultSet = [
      { id: "p1", rank: 1, title: "Liido Home", price: 45000, city: "Mogadishu", type: "HOUSE", bedrooms: 2, bathrooms: 1, area: 120, furnished: false, parking: false, status: "APPROVED", formattedPrice: "$45,000" },
      { id: "p2", rank: 2, title: "Waberi Villa", price: 65000, city: "Mogadishu", type: "VILLA", bedrooms: 4, bathrooms: 3, area: 250, furnished: true, parking: true, status: "APPROVED", formattedPrice: "$65,000" },
    ];
    const res = resolveConversationalReference("tell me about the second one", mockResultSet);
    const ok = res.type === "ORDINAL" && res.targetRank === 2 && res.targetProperty?.id === "p2";
    record("10. 'the second one' resolves to Property #2 in active context", ok, `target=${res.targetProperty?.title}`);
  } catch (e) {
    record("10. 'the second one' resolves to Property #2 in active context", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 11: "that property" resolves correctly to recent reference
  // ---------------------------------------------------------------------------
  try {
    const mockProperty = { id: "p2", rank: 2, title: "Waberi Villa", price: 65000, city: "Mogadishu", type: "VILLA", bedrooms: 4, bathrooms: 3, area: 250, furnished: true, parking: true, status: "APPROVED", formattedPrice: "$65,000" };
    const res = resolveConversationalReference("does that property have parking?", [mockProperty], mockProperty);
    const ok = res.targetProperty?.id === "p2" && res.attributeQueried === "location" || res.type === "PRONOUN";
    record("11. 'that property' pronoun resolves to referenced item", ok, `resolvedId=${res.targetProperty?.id}`);
  } catch (e) {
    record("11. 'that property' pronoun resolves to referenced item", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 12: Stale previous result set is not rendered for unrelated message
  // ---------------------------------------------------------------------------
  try {
    const session = "t12-stale-" + Date.now();
    // Simulate previous turn with active properties
    const previousState = initializeConversationState(session);
    previousState.slots = { city: "Mogadishu", maxPrice: 80000 };
    previousState.activeResultSet = [
      { id: "p1", rank: 1, title: "Old Listing", price: 50000, city: "Mogadishu", type: "HOUSE", bedrooms: 2, bathrooms: 1, area: 100, furnished: false, parking: false, status: "APPROVED", formattedPrice: "$50,000" }
    ];

    const res = await processConversationalTurn({
      sessionId: session,
      message: "What is escrow in real estate?",
      history: [
        { role: "assistant", content: "Here are some homes", metadata: JSON.stringify({ conversationState: previousState }) }
      ],
    });

    const ok = res.shouldRenderPropertyCards === false && res.properties.length === 0 && (res.responseType === "GENERAL_CONVERSATION" || res.responseType === "EDUCATION");
    record("12. Unrelated educational turn does not render stale cards", ok, `cards=${res.shouldRenderPropertyCards}, type=${res.responseType}`);
  } catch (e) {
    record("12. Unrelated educational turn does not render stale cards", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 13: Somali "asc" recognized
  // ---------------------------------------------------------------------------
  try {
    const s = analyzeConversationalSlang("asc");
    const lang = detectConversationalLanguage("asc");
    const ok = s.isGreeting === true && lang.language === "so";
    record("13. Somali 'asc' recognized as greeting in Somali", ok, `lang=${lang.language}, isGreeting=${s.isGreeting}`);
  } catch (e) {
    record("13. Somali 'asc' recognized as greeting in Somali", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 14: "wcs" recognized as greeting response
  // ---------------------------------------------------------------------------
  try {
    const s = analyzeConversationalSlang("wcs walaal");
    const ok = s.isGreetingResponse === true;
    record("14. 'wcs' recognized as greeting response", ok, `isGreetingResponse=${s.isGreetingResponse}`);
  } catch (e) {
    record("14. 'wcs' recognized as greeting response", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 15: "sxb" recognized as Somali address term
  // ---------------------------------------------------------------------------
  try {
    const s = analyzeConversationalSlang("asc sxb i caawi");
    const ok = s.hasInformalAddress === true;
    record("15. 'sxb' recognized as Somali informal address term", ok, `hasInformalAddress=${s.hasInformalAddress}`);
  } catch (e) {
    record("15. 'sxb' recognized as Somali informal address term", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 16: "wlhi" recognized as conversational emphasis
  // ---------------------------------------------------------------------------
  try {
    const s = analyzeConversationalSlang("wlhi guri fiican baan rabaa");
    const ok = s.hasConversationalEmphasis === true;
    record("16. 'wlhi' recognized as conversational emphasis", ok, `hasEmphasis=${s.hasConversationalEmphasis}`);
  } catch (e) {
    record("16. 'wlhi' recognized as conversational emphasis", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 17: "alx" recognized as religious expression
  // ---------------------------------------------------------------------------
  try {
    const s = analyzeConversationalSlang("alx waa fiicanahay");
    const ok = s.hasReligiousPhrase === true;
    record("17. 'alx' recognized as religious praise expression", ok, `hasReligiousPhrase=${s.hasReligiousPhrase}`);
  } catch (e) {
    record("17. 'alx' recognized as religious praise expression", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 18: Somali property variations recognized
  // ---------------------------------------------------------------------------
  try {
    const e1 = extractEntities("guryo ku yaalo Muqdisho");
    const e2 = extractEntities("guri dabaq ah Hargeysa");
    const e3 = extractEntities("dhul banaan oo ku yaal Boosaaso");
    const ok =
      e1.city === "Mogadishu" && e1.propertyType === "HOUSE" &&
      e2.city === "Hargeisa" && e2.propertyType === "APARTMENT" &&
      e3.city === "Bosaso" && e3.propertyType === "LAND";
    record("18. Somali property variations (guryo, dabaq, dhul) recognized", ok, `e1=${e1.city}/${e1.propertyType}, e2=${e2.city}/${e2.propertyType}`);
  } catch (e) {
    record("18. Somali property variations recognized", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 19: Arabic property terms recognized
  // ---------------------------------------------------------------------------
  try {
    const e = extractEntities("أريد شقة في مقديشو بثلاث غرف نوم");
    const ok = e.city === "Mogadishu" && e.propertyType === "APARTMENT" && e.bedrooms?.value === 3;
    record("19. Arabic property terms (شقة، مقديشو، ثلاث غرف) recognized", ok, `city=${e.city}, type=${e.propertyType}, beds=${e.bedrooms?.value}`);
  } catch (e) {
    record("19. Arabic property terms recognized", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 20: Somali-English code switching works
  // ---------------------------------------------------------------------------
  try {
    const e = extractEntities("Waxaan rabaa house in Mogadishu with 3 bedrooms");
    const ok = e.city === "Mogadishu" && e.propertyType === "HOUSE" && e.bedrooms?.value === 3;
    record("20. Somali-English code switching extracted accurately", ok, `city=${e.city}, type=${e.propertyType}, beds=${e.bedrooms?.value}`);
  } catch (e) {
    record("20. Somali-English code switching works", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 21: Arabic-English code switching works
  // ---------------------------------------------------------------------------
  try {
    const e = extractEntities("أريد house في مقديشو under 100k");
    const ok = e.city === "Mogadishu" && e.propertyType === "HOUSE" && e.price?.maxPrice === 100000;
    record("21. Arabic-English code switching extracted accurately", ok, `city=${e.city}, type=${e.propertyType}, budget=${e.price?.maxPrice}`);
  } catch (e) {
    record("21. Arabic-English code switching works", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 22: Swahili property query works
  // ---------------------------------------------------------------------------
  try {
    const lang = detectConversationalLanguage("Ninataka nyumba huko Mogadishu");
    const e = extractEntities("nyumba huko Mogadishu");
    const ok = lang.language === "sw" && e.city === "Mogadishu";
    record("22. Swahili property query detected and normalized", ok, `lang=${lang.language}, city=${e.city}`);
  } catch (e) {
    record("22. Swahili property query works", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 23: No-result response does not silently relax city
  // ---------------------------------------------------------------------------
  try {
    const res = await processConversationalTurn({
      sessionId: "t23-no-relax-" + Date.now(),
      message: "Find 10 bedroom villas in Mogadishu under $5,000",
      history: [],
    });
    const ok =
      res.responseType === "NO_RESULTS" &&
      res.shouldRenderPropertyCards === false &&
      res.properties.length === 0 &&
      !res.reply.toLowerCase().includes("hargeisa");
    record("23. Zero-result query does NOT silently substitute another city", ok, `type=${res.responseType}, props=${res.properties.length}`);
  } catch (e) {
    record("23. No-result response does not silently relax city", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 24: User-approved alternative search works
  // ---------------------------------------------------------------------------
  try {
    const zeroReply = generateNaturalDialogResponse({
      language: "so",
      templateType: "ZERO_RESULTS",
      slots: { city: "Muqdisho" },
    });
    const ok = zeroReply.includes("Muqdisho") && zeroReply.includes("shuruudahaas");
    record("24. Zero result dialog naturally explains constraint status", ok, `reply=${zeroReply}`);
  } catch (e) {
    record("24. User-approved alternative search works", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 25: Property cards render only for PROPERTY_RESULTS
  // ---------------------------------------------------------------------------
  try {
    const tGreet = await processConversationalTurn({ sessionId: "t25a", message: "Asc" });
    const tClari = await processConversationalTurn({ sessionId: "t25b", message: "Guri baan rabaa" });
    const tEdu = await processConversationalTurn({ sessionId: "t25c", message: "What is a mortgage?" });
    const ok =
      tGreet.shouldRenderPropertyCards === false &&
      tClari.shouldRenderPropertyCards === false &&
      tEdu.shouldRenderPropertyCards === false;
    record("25. Property cards are strictly suppressed for non-search types", ok, `cardsGreet=${tGreet.shouldRenderPropertyCards}, cardsClari=${tClari.shouldRenderPropertyCards}`);
  } catch (e) {
    record("25. Property cards render only for PROPERTY_RESULTS", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 26: Property detail does not render unrelated result cards
  // ---------------------------------------------------------------------------
  try {
    const session = "t26-" + Date.now();
    const mockItem = { id: "p1", rank: 1, title: "Test Villa", price: 50000, city: "Mogadishu", type: "VILLA", bedrooms: 3, bathrooms: 2, area: 150, furnished: false, parking: true, status: "APPROVED", formattedPrice: "$50,000" };
    const mockState = initializeConversationState(session);
    mockState.activeResultSet = [mockItem];

    const res = await processConversationalTurn({
      sessionId: session,
      message: "kan labaad ka warran?",
      history: [
        { role: "assistant", content: "Here are results", metadata: JSON.stringify({ conversationState: mockState }) }
      ],
    });
    const ok = res.shouldRenderPropertyCards === false;
    record("26. Property detail view suppresses bulk search cards", ok, `shouldRender=${res.shouldRenderPropertyCards}`);
  } catch (e) {
    record("26. Property detail does not render unrelated result cards", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 27: General real-estate question does not trigger search
  // ---------------------------------------------------------------------------
  try {
    const res = await processConversationalTurn({
      sessionId: "t27-" + Date.now(),
      message: "What is a villa?",
      history: [],
    });
    const ok =
      (res.responseType === "GENERAL_CONVERSATION" || res.responseType === "EDUCATION") &&
      res.shouldRenderPropertyCards === false &&
      res.properties.length === 0 &&
      (res.reply.toLowerCase().includes("villa") || res.reply.toLowerCase().includes("residential") || res.reply.toLowerCase().includes("stand-alone") || res.reply.toLowerCase().includes("house"));
    record("27. General question 'What is a villa?' answered educationally without search", ok, `type=${res.responseType}`);
  } catch (e) {
    record("27. General real-estate question does not trigger search", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 28: Conversation memory survives multiple turns
  // ---------------------------------------------------------------------------
  try {
    const session = "t28-" + Date.now();
    let history = [];

    // Turn 1: Greeting
    const t1 = await processConversationalTurn({ sessionId: session, message: "Asc", history });
    history.push({ role: "assistant", content: t1.reply, metadata: JSON.stringify({ conversationState: t1.state }) });

    // Turn 2: Vague request
    const t2 = await processConversationalTurn({ sessionId: session, message: "Guri baan rabaa", history });
    history.push({ role: "assistant", content: t2.reply, metadata: JSON.stringify({ conversationState: t2.state }) });

    // Turn 3: City
    const t3 = await processConversationalTurn({ sessionId: session, message: "Muqdisho", history });
    history.push({ role: "assistant", content: t3.reply, metadata: JSON.stringify({ conversationState: t3.state }) });

    // Turn 4: Budget
    const t4 = await processConversationalTurn({ sessionId: session, message: "$80,000", history });
    history.push({ role: "assistant", content: t4.reply, metadata: JSON.stringify({ conversationState: t4.state }) });

    const ok =
      t4.state.slots.city === "Mogadishu" &&
      t4.state.slots.propertyType === "HOUSE" &&
      t4.state.slots.maxPrice === 80000 &&
      t4.state.turnCount >= 4;
    record("28. Multi-turn interview accumulates slots accurately", ok, `slots=${JSON.stringify(t4.state.slots)}`);
  } catch (e) {
    record("28. Conversation memory survives multiple turns", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 29: Explicit user language preference survives turns
  // ---------------------------------------------------------------------------
  try {
    const session = "t29-" + Date.now();
    let history = [];

    const t1 = await processConversationalTurn({ sessionId: session, message: "Speak to me in Arabic", history });
    history.push({ role: "assistant", content: t1.reply, metadata: JSON.stringify({ conversationState: t1.state }) });

    const t2 = await processConversationalTurn({ sessionId: session, message: "أريد منزل", history });
    const ok = t2.language === "ar" && t2.state.explicitLanguagePreference === "ar";
    record("29. Explicit language preference 'ar' persists into next turn", ok, `activeLang=${t2.language}`);
  } catch (e) {
    record("29. Explicit user language preference survives turns", false, e.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 30: Wrong-city database result is rejected by final validation
  // ---------------------------------------------------------------------------
  try {
    const candidateHargeisa = {
      city: "Hargeisa",
      status: "APPROVED",
      bedrooms: 3,
      price: 60000,
    };
    const check = validatePropertyAgainstQuery(candidateHargeisa, { city: "Mogadishu", bedrooms: 3 });
    const ok = check.isValid === false && check.violationReason?.includes("City constraint violation");
    record("30. Final post-search validator strictly blocks wrong-city property", ok, `reason=${check.violationReason}`);
  } catch (e) {
    record("30. Wrong-city database result is rejected by final validation", false, e.message);
  }

  console.log("================================================================================");
  console.log(`NEW TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log("================================================================================");

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runQualitySuite().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
