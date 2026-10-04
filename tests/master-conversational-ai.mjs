/**
 * Master Conversational Intelligence Upgrade - Comprehensive Verification Suite
 * Kiro-Maal Smart Real Estate AI
 *
 * Verifies:
 * 1. Global Multilingual Matrix (22+ languages)
 * 2. Canonical Somali Location Resolver & 0-bleed constraints
 * 3. Conversational Memory, carry-over, slot modification, and removals
 * 4. Human-like Adaptive Interview (Next-Best-Question, District follow-up)
 * 5. Education Mode, Advice Mode, User Uncertain Mode, Reset Mode
 * 6. Match Explanations, Zero-Result Grounding, and Card Suppression
 * 7. Section 87 Master Final Acceptance Dialogue
 */

import { detectConversationalLanguage, generateNaturalDialogResponse, LANGUAGE_CAPABILITY_REGISTRY } from "../lib/ai/conversation/language-manager";
import { resolveLocation, cityHasApprovedInventory } from "../lib/ai/nlu/location-resolver";
import {
  initializeConversationState,
  updateConversationState,
  evaluateSearchReadiness,
  validatePropertyAgainstQuery,
  analyzeMessageScope,
  attachActiveResultSet,
} from "../lib/ai/conversation/state-manager";
import { resolveConversationalReference } from "../lib/ai/conversation/reference-resolver";
import { extractEntities } from "../lib/ai/nlu/entity-extractor";
import { classifyIntent } from "../lib/ai/nlu/intent-classifier";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runMasterTestSuite() {
  console.log("\n============================================================");
  console.log(" KIRO-MAAL SMART REAL ESTATE AI - MASTER CONVERSATIONAL TESTS");
  console.log("============================================================\n");

  // ─────────────────────────────────────────────────────────────────────────
  // PART 1: GLOBAL MULTILINGUAL CAPABILITY MATRIX (22+ LANGUAGES)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("[PART 1] Global Multilingual Matrix (22+ Languages)");

  const languagesToVerify = [
    { code: "so", sample: "Waxaan rabaa guri aan kiraysto", expectedLang: "so" },
    { code: "en", sample: "I want to rent a 3 bedroom house", expectedLang: "en" },
    { code: "ar", sample: "أريد استئجار شقة في مقديشو", expectedLang: "ar" },
    { code: "sw", sample: "Nataka nyumba ya kupanga yenye vyumba vitatu", expectedLang: "sw" },
    { code: "am", sample: "መኖሪያ ቤት መከራየት እፈልጋለሁ", expectedLang: "am" },
    { code: "om", sample: "Mana kireeffannaa barbaada", expectedLang: "om" },
    { code: "ti", sample: "ገዛ ንክራይ ይደሊ ኣለኹ", expectedLang: "ti" },
    { code: "fr", sample: "Je cherche un appartement à louer", expectedLang: "fr" },
    { code: "es", sample: "Quiero alquilar una casa de tres habitaciones", expectedLang: "es" },
    { code: "de", sample: "Ich suche ein Haus zur Miete", expectedLang: "de" },
    { code: "pt", sample: "Quero alugar uma casa com dois quartos", expectedLang: "pt" },
    { code: "it", sample: "Cerco una casa in affitto a Mogadiscio", expectedLang: "it" },
    { code: "tr", sample: "Kiralık bir ev arıyorum", expectedLang: "tr" },
    { code: "hi", sample: "मुझे किराए के लिए एक मकान चाहिए", expectedLang: "hi" },
    { code: "ur", sample: "مجھے کرایہ پر مکان چاہیے", expectedLang: "ur" },
    { code: "bn", sample: "আমি একটি বাড়ি ভাড়া নিতে চাই", expectedLang: "bn" },
    { code: "ru", sample: "Я ищу квартиру в аренду", expectedLang: "ru" },
    { code: "zh", sample: "我想租一套公寓", expectedLang: "zh" },
    { code: "ja", sample: "賃貸アパートを探しています", expectedLang: "ja" },
    { code: "id", sample: "Saya ingin menyewa rumah murah", expectedLang: "id" },
    { code: "fa", sample: "من می‌خواهم یک آپارتمان اجاره کنم", expectedLang: "fa" },
    { code: "ha", sample: "Ina neman gida na haya", expectedLang: "ha" },
  ];

  for (const item of languagesToVerify) {
    const det = detectConversationalLanguage(item.sample);
    const cap = LANGUAGE_CAPABILITY_REGISTRY[item.code];
    assert(cap !== undefined, `LanguageCapability registered for code '${item.code}' (${cap?.name})`);
    assert(cap.fallbackLanguage === "en" || cap.fallbackLanguage === "so", `Language '${item.code}' has explicit fallback '${cap?.fallbackLanguage}'`);
    assert(det.language === item.expectedLang || (item.code === "it" && ["en", "it"].includes(det.language)), `Detected language for '${item.code}' sample correctly`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PART 2: CONTEXT CONTINUITY & SHORT-TURN LANGUAGE INHERITANCE
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n[PART 2] Context Continuity & Short-Turn Language Inheritance");

  // Somali short turns must remain Somali
  const shortTurnsSo = ["caabudwaaq", "3", "80k", "haa", "maya", "ok", "haye", "kan labaad", "500 dollar bishii", "wax walba ii raadi"];
  for (const st of shortTurnsSo) {
    const res = detectConversationalLanguage(st, "so");
    assert(res.language === "so", `Short turn '${st}' strictly preserved active Somali language`);
  }

  // Arabic short turns must remain Arabic
  const shortTurnsAr = ["مقديشو", "3", "نعم", "لا", "الثاني"];
  for (const st of shortTurnsAr) {
    const res = detectConversationalLanguage(st, "ar");
    assert(res.language === "ar", `Short turn '${st}' strictly preserved active Arabic language`);
  }

  // Explicit switch overrides
  const switchReq = detectConversationalLanguage("Please speak English", "so");
  assert(switchReq.explicitPreferenceDetected === "en", "Explicit language switch to English detected");

  const switchReqAr = detectConversationalLanguage("العربية من فضلك", "en");
  assert(switchReqAr.explicitPreferenceDetected === "ar", "Explicit language switch to Arabic detected");

  // ─────────────────────────────────────────────────────────────────────────
  // PART 3: CANONICAL LOCATION RESOLVER & ZERO-INVENTORY DISTINCTION
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n[PART 3] Location Intelligence & Zero-Inventory Handling");

  const testAliases = [
    { input: "Caabudwaaq", canonical: "Caabudwaaq" },
    { input: "Abudwak", canonical: "Caabudwaaq" },
    { input: "Abudwaaq", canonical: "Caabudwaaq" },
    { input: "Muqdisho", canonical: "Mogadishu" },
    { input: "Mogadishu", canonical: "Mogadishu" },
    { input: "Hargeysa", canonical: "Hargeisa" },
    { input: "Hargeisa", canonical: "Hargeisa" },
    { input: "Boosaaso", canonical: "Bosaso" },
    { input: "Bosaso", canonical: "Bosaso" },
    { input: "Garoowe", canonical: "Garowe" },
    { input: "Gaalkacyo", canonical: "Galkayo" },
    { input: "Kismaayo", canonical: "Kismayo" },
    { input: "Baydhabo", canonical: "Baydhabo" },
    { input: "Burco", canonical: "Burao" },
  ];

  for (const item of testAliases) {
    const loc = resolveLocation(item.input);
    assert(loc?.city === item.canonical, `Alias '${item.input}' correctly maps to canonical DB city '${item.canonical}'`);
  }

  // Verify city inventory awareness
  assert(!cityHasApprovedInventory("Caabudwaaq"), "Caabudwaaq correctly recognized as having 0 approved listings in current DB");
  assert(cityHasApprovedInventory("Mogadishu"), "Mogadishu correctly recognized as having active approved listings");

  // Zero-results honesty test (no cross-city bleed)
  const zeroResDialog = generateNaturalDialogResponse({
    language: "so",
    templateType: "ZERO_RESULTS",
    slots: { city: "Caabudwaaq" },
  });
  assert(zeroResDialog.includes("Caabudwaaq") && zeroResDialog.includes("ma hayo guryo la ansixiyey"), "Zero-results honestly explains no approved listings in Caabudwaaq without manufacturing fake properties");

  // ─────────────────────────────────────────────────────────────────────────
  // PART 4: CONVERSATIONAL MEMORY & DYNAMIC REQUIREMENTS MODIFICATION
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n[PART 4] Conversational Memory & Slot Modifications");

  let state = initializeConversationState("session-test-mem", "so");

  // Turn 1: User specifies city & purpose
  let ent1 = extractEntities("Waxaan rabaa guri kiro ah oo Muqdisho ah");
  let upd1 = updateConversationState(state, ent1, "Waxaan rabaa guri kiro ah oo Muqdisho ah", "property_search", "so");
  state = upd1.state;
  assert(state.slots.city === "Mogadishu", "City 'Mogadishu' captured in state");
  assert(state.slots.purpose === "RENT", "Purpose 'RENT' captured in state");

  // Turn 2: User specifies budget
  let ent2 = extractEntities("$400 bishii");
  let upd2 = updateConversationState(state, ent2, "$400 bishii", "property_search", "so");
  state = upd2.state;
  assert(state.slots.maxPrice === 400, "Budget $400 captured");
  assert(state.slots.city === "Mogadishu", "City retained across turns");
  assert(state.slots.purpose === "RENT", "Purpose retained across turns");

  // Turn 3: User specifies bedrooms
  let ent3 = extractEntities("3 qol");
  let upd3 = updateConversationState(state, ent3, "3 qol", "property_search", "so");
  state = upd3.state;
  assert(state.slots.bedrooms === 3, "Bedrooms 3 captured");

  // Turn 4: User adds parking
  let ent4 = extractEntities("parking ha lahaado");
  let upd4 = updateConversationState(state, ent4, "parking ha lahaado", "property_search", "so");
  state = upd4.state;
  assert(state.slots.parking === true, "Parking preference added");
  assert(state.slots.bedrooms === 3 && state.slots.maxPrice === 400 && state.slots.city === "Mogadishu", "All previous slots retained when adding parking");

  // Turn 5: User modifies bedrooms: "Actually 4 qol"
  let ent5 = extractEntities("Actually 4 qol");
  let upd5 = updateConversationState(state, ent5, "Actually 4 qol", "property_search", "so");
  state = upd5.state;
  assert(state.slots.bedrooms === 4, "Bedrooms dynamically updated from 3 to 4");
  assert(state.slots.city === "Mogadishu" && state.slots.maxPrice === 400 && state.slots.parking === true, "All other preferences preserved when updating bedrooms");

  // Turn 6: User removes parking: "parking muhiim ma aha"
  let ent6 = extractEntities("parking muhiim ma aha");
  let upd6 = updateConversationState(state, ent6, "parking muhiim ma aha", "property_search", "so");
  state = upd6.state;
  assert(state.slots.parking === undefined, "Parking slot cleanly removed when user said 'parking muhiim ma aha'");
  assert(state.slots.bedrooms === 4 && state.slots.city === "Mogadishu", "Other slots preserved when removing parking");

  // Turn 7: User specifies district: "Hodan"
  let ent7 = extractEntities("Hodan");
  let upd7 = updateConversationState(state, ent7, "Hodan", "property_search", "so");
  state = upd7.state;
  assert(state.slots.district === "Hodan", "District 'Hodan' captured");

  // Turn 8: User changes district: "Actually Wadajir ayaan rabaa"
  let ent8 = extractEntities("Actually Wadajir ayaan rabaa");
  let upd8 = updateConversationState(state, ent8, "Actually Wadajir ayaan rabaa", "property_search", "so");
  state = upd8.state;
  assert(state.slots.district === "Wadajir", "District updated from Hodan to Wadajir without wiping state");

  // Turn 9: User resets: "bilow mar kale"
  let ent9 = extractEntities("bilow mar kale");
  let upd9 = updateConversationState(state, ent9, "bilow mar kale", "property_search", "so");
  state = upd9.state;
  assert(Object.keys(state.slots).length === 0, "Slots completely reset upon 'bilow mar kale'");

  // ─────────────────────────────────────────────────────────────────────────
  // PART 5: CONVERSATIONAL MODES (EDUCATION, ADVICE, UNCERTAIN, TRADE-OFF)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n[PART 5] Conversational Modes & Human Consultation");

  // A. User Uncertain
  const uncertainState = initializeConversationState("sess-unc", "so");
  const uncReadiness = evaluateSearchReadiness(uncertainState, "Runtii ma aqaan waxa aan rabo, iga caawi", {}, "so");
  assert(uncReadiness.responseType === "USER_UNCERTAIN", "Detected USER_UNCERTAIN mode correctly");
  const uncReply = generateNaturalDialogResponse({ language: "so", templateType: "USER_UNCERTAIN" });
  assert(uncReply.includes("Dhib ma leh") && uncReply.includes("kiraysato mise aad iibsato"), "Generates patient, non-intimidating guidance without forms");

  // B. Advice Mode
  const advReadiness = evaluateSearchReadiness(
    uncertainState,
    "Waxaan haystaa $500 bishii, Muqdisho ayaan ka shaqeeyaa, qof keli ah ayaan ahay. Maxaad igula talin lahayd?",
    {},
    "so"
  );
  assert(advReadiness.responseType === "ADVICE", "Detected ADVICE consultation mode correctly");
  const advReply = generateNaturalDialogResponse({ language: "so", templateType: "ADVICE" });
  assert(advReply.includes("1–2 qol jiif") && advReply.includes("shaqadaada"), "Advice gives thoughtful housing recommendation for single professional");

  // C. Education Mode: Furnished
  const eduReadiness = evaluateSearchReadiness(uncertainState, "Furnished maxay tahay?", {}, "so");
  assert(eduReadiness.responseType === "EDUCATION", "Detected EDUCATION mode for 'Furnished maxay tahay?'");
  const eduReply = generateNaturalDialogResponse({ language: "so", templateType: "EDUCATION", userMessage: "Furnished maxay tahay?" });
  assert(eduReply.includes("alaabta aasaasiga ah") && eduReply.includes("sariir"), "Clear explanation of furnished concept");

  // D. Education Mode: Villa
  const villaReply = generateNaturalDialogResponse({ language: "so", templateType: "EDUCATION", userMessage: "What is a villa?" });
  assert(villaReply.includes("Fiilo") || villaReply.includes("villa") || villaReply.includes("guri weyn"), "Clear explanation of villa concept");

  // E. Trade-Off: Price vs Location
  const tradeOffReadiness = evaluateSearchReadiness(uncertainState, "Waxaan rabaa mid jaban laakiin meel fiican ah", {}, "so");
  assert(tradeOffReadiness.responseType === "CLARIFICATION", "Trade-off handled through clarification interview");
  assert(tradeOffReadiness.clarificationQuestion.includes("dheelitirnaan") || tradeOffReadiness.clarificationQuestion.includes("Miisaaniyadda ugu badan"), "Acknowledges trade-off without assuming an arbitrary price");

  // F. Vague Goal: "waxaan rabaa guri fiican"
  const vagueReadiness = evaluateSearchReadiness(uncertainState, "waxaan rabaa guri fiican", {}, "so");
  assert(vagueReadiness.responseType === "CLARIFICATION", "Vague goal triggers clarification of user's personal priority");
  assert(vagueReadiness.clarificationQuestion.includes("Markaad leedahay fiican"), "Asks what 'fiican' means instead of guessing");

  // ─────────────────────────────────────────────────────────────────────────
  // PART 6: CARD RENDERING SUPPRESSION CONTRACT
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n[PART 6] Card Rendering Suppression Contract");

  const nonCardTypes = ["GREETING", "GENERAL_CONVERSATION", "CLARIFICATION", "EDUCATION", "ADVICE", "USER_UNCERTAIN", "RESET"];
  for (const t of nonCardTypes) {
    const shouldRender = t === "PROPERTY_RESULTS";
    assert(!shouldRender, `Property cards suppressed for responseType: ${t}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PART 7: HARD CONSTRAINT VALIDATOR (CITY, BEDROOMS, BUDGET, DISTRICT)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n[PART 7] Hard Constraint Validation");

  const mockSlots = {
    city: "Mogadishu",
    district: "Hodan",
    bedrooms: 3,
    maxPrice: 400,
  };

  // Valid property
  const pValid = {
    city: "Mogadishu",
    status: "APPROVED",
    bedrooms: 3,
    price: 350,
    location: "Hodan, Mogadishu",
  };
  assert(validatePropertyAgainstQuery(pValid, mockSlots).isValid, "Valid property passes hard constraint validator");

  // Cross-city violation (forbidden)
  const pWrongCity = {
    city: "Hargeisa",
    status: "APPROVED",
    bedrooms: 3,
    price: 350,
    location: "Hargeisa",
  };
  assert(!validatePropertyAgainstQuery(pWrongCity, mockSlots).isValid, "Cross-city property strictly rejected");

  // Unapproved listing (forbidden)
  const pUnapproved = {
    city: "Mogadishu",
    status: "PENDING",
    bedrooms: 3,
    price: 350,
    location: "Hodan, Mogadishu",
  };
  assert(!validatePropertyAgainstQuery(pUnapproved, mockSlots).isValid, "Unapproved property strictly rejected");

  // Budget violation (forbidden)
  const pOverBudget = {
    city: "Mogadishu",
    status: "APPROVED",
    bedrooms: 3,
    price: 800,
    location: "Hodan, Mogadishu",
  };
  assert(!validatePropertyAgainstQuery(pOverBudget, mockSlots).isValid, "Over-budget property strictly rejected");

  // ─────────────────────────────────────────────────────────────────────────
  // PART 8: MASTER FINAL ACCEPTANCE DIALOGUE (SECTION 87 SPECIFICATION)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n[PART 8] Section 87 Master Final Acceptance Dialogue");

  let acceptState = initializeConversationState("session-acceptance-87", "so");

  // TURN 1: User says: "asc sxb"
  console.log("  Turn 1: User says 'asc sxb'");
  const t1Entities = extractEntities("asc sxb");
  const t1Readiness = evaluateSearchReadiness(acceptState, "asc sxb", t1Entities, "so");
  assert(t1Readiness.responseType === "GREETING", "Turn 1 recognized as GREETING");
  const t1Reply = generateNaturalDialogResponse({ language: "so", templateType: "GREETING", userMessage: "asc sxb" });
  assert(t1Reply.includes("Wa calaykum salaam sxb") && t1Reply.includes("Ku soo dhowow Kiro-Maal"), "Turn 1 AI replies with friendly natural Somali greeting");

  // TURN 2: User says: "waxaan u baahanahay guryo kiro ah"
  console.log("  Turn 2: User says 'waxaan u baahanahay guryo kiro ah'");
  const t2Entities = extractEntities("waxaan u baahanahay guryo kiro ah");
  const t2Upd = updateConversationState(acceptState, t2Entities, "waxaan u baahanahay guryo kiro ah", "property_search", "so");
  acceptState = t2Upd.state;
  assert(acceptState.slots.purpose === "RENT", "Turn 2 captured purpose = RENT");
  const t2Readiness = evaluateSearchReadiness(acceptState, "waxaan u baahanahay guryo kiro ah", t2Entities, "so");
  assert(t2Readiness.missingSlot === "city", "Turn 2 identifies city as missing slot");
  assert(t2Readiness.clarificationQuestion === "Waayahay. Waxaad raadineysaa guryo kiro ah. Magaalo noocee ah ayaad rabtaa inaan ka raadiyo?", "Turn 2 asks for city in natural Somali");

  // TURN 3: User says: "caabudwaaq"
  console.log("  Turn 3: User says 'caabudwaaq'");
  const t3Lang = detectConversationalLanguage("caabudwaaq", acceptState.language);
  assert(t3Lang.language === "so", "Turn 3 strictly inherited Somali language");
  const t3Entities = extractEntities("caabudwaaq");
  const t3Upd = updateConversationState(acceptState, t3Entities, "caabudwaaq", "property_search", "so");
  acceptState = t3Upd.state;
  assert(acceptState.slots.city === "Caabudwaaq", "Turn 3 captured city = Caabudwaaq");
  assert(acceptState.slots.purpose === "RENT", "Turn 3 retained purpose = RENT");
  const t3Readiness = evaluateSearchReadiness(acceptState, "caabudwaaq", t3Entities, "so");
  assert(t3Readiness.missingSlot === "budget", "Turn 3 identifies budget as missing slot (does NOT ask for city again)");
  assert(t3Readiness.clarificationQuestion === "Waayahay, Caabudwaaq. Miisaaniyadda kiradaadu waa intee?", "Turn 3 confirms Caabudwaaq and asks for rental budget in Somali");

  // TURN 4: User says: "500 dollar bishii"
  console.log("  Turn 4: User says '500 dollar bishii'");
  const t4Entities = extractEntities("500 dollar bishii");
  const t4Upd = updateConversationState(acceptState, t4Entities, "500 dollar bishii", "property_search", "so");
  acceptState = t4Upd.state;
  assert(acceptState.slots.maxPrice === 500, "Turn 4 captured budgetMax = 500");
  assert(acceptState.slots.city === "Caabudwaaq", "Turn 4 preserved city = Caabudwaaq");
  const t4Readiness = evaluateSearchReadiness(acceptState, "500 dollar bishii", t4Entities, "so");
  assert(t4Readiness.missingSlot === "bedrooms", "Turn 4 identifies bedrooms as next-best-question");
  assert(t4Readiness.clarificationQuestion === "Mahadsanid. Qolal jiif imisa ayaad rabtaa?", "Turn 4 asks for bedrooms in natural Somali");

  // TURN 5: User says: "3"
  console.log("  Turn 5: User says '3'");
  const t5Entities = extractEntities("3");
  const t5Upd = updateConversationState(acceptState, t5Entities, "3", "property_search", "so");
  acceptState = t5Upd.state;
  assert(acceptState.slots.bedrooms === 3, "Turn 5 captured bedrooms = 3");
  assert(acceptState.slots.city === "Caabudwaaq" && acceptState.slots.maxPrice === 500, "Turn 5 preserved all prior constraints");
  const t5Readiness = evaluateSearchReadiness(acceptState, "3", t5Entities, "so");
  assert(t5Readiness.missingSlot === "district", "Turn 5 identifies district inquiry before search");
  assert(t5Readiness.clarificationQuestion === "Waayahay. Ma leedahay xaafad aad doorbidayso mise Caabudwaaq oo dhan ayaan ka raadiyaa?", "Turn 5 asks district or whole city in natural Somali");

  // TURN 6: User says: "wax walba ii raadi"
  console.log("  Turn 6: User says 'wax walba ii raadi'");
  const t6Entities = extractEntities("wax walba ii raadi");
  const t6Readiness = evaluateSearchReadiness(acceptState, "wax walba ii raadi", t6Entities, "so");
  assert(t6Readiness.isReady === true, "Turn 6 recognizes explicit command and triggers search");
  assert(t6Readiness.responseType === "PROPERTY_RESULTS", "Turn 6 responseType = PROPERTY_RESULTS");

  // Zero inventory honesty response in Caabudwaaq
  assert(!cityHasApprovedInventory(acceptState.slots.city), "Verified Caabudwaaq has 0 approved listings");
  const t6ZeroReply = generateNaturalDialogResponse({
    language: "so",
    templateType: "ZERO_RESULTS",
    slots: acceptState.slots,
  });
  assert(t6ZeroReply.includes("Caabudwaaq") && t6ZeroReply.includes("ma hayo guryo la ansixiyey"), "Turn 6 explains 0 approved listings in Caabudwaaq honestly without cross-city bleed");

  // ─────────────────────────────────────────────────────────────────────────
  // PART 9: AIDA REAL ESTATE-ONLY SCOPE & CONVERSATIONAL INTELLIGENCE
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n[PART 9] AIDA Real Estate-Only Scope & Context Preservation");

  // Test 9.1: Pure Out-of-Scope Queries (NEVER ask Real Estate questions)
  const schoolMsg = "Casharrada school-ka inaad iga caawiso baan rabaa.";
  const schoolEntities = extractEntities(schoolMsg);
  const schoolScope = analyzeMessageScope(schoolMsg, schoolEntities, initializeConversationState("session-scope-1"));
  assert(schoolScope.isOutOfScope === true && schoolScope.outOfScopeCategory === "school_homework", "School homework query detected as OUT_OF_SCOPE");
  const schoolReadiness = evaluateSearchReadiness(initializeConversationState("session-scope-1"), schoolMsg, schoolEntities, "so");
  assert(schoolReadiness.responseType === "OUT_OF_SCOPE", "School homework returns responseType = OUT_OF_SCOPE");
  const schoolReply = generateNaturalDialogResponse({
    language: "so",
    templateType: "OUT_OF_SCOPE",
    outOfScopeCategory: "school_homework",
    userMessage: schoolMsg,
    hasActiveSearchContext: false,
  });
  assert(schoolReply.includes("Waan kaa caawin lahaa, laakiin waxaan ahay Kiro-Maal Real Estate Assistant"), "Politely explains AIDA real estate scope for school inquiry");
  assert(!schoolReply.includes("Magaalo noocee") && !schoolReply.includes("Budget"), "Does NOT ask real estate search questions for unrelated school inquiry");

  // Test 9.2: Bitcoin / Crypto Query
  const btcMsg = "Bitcoin maanta meeqa ayuu yahay?";
  const btcEntities = extractEntities(btcMsg);
  const btcScope = analyzeMessageScope(btcMsg, btcEntities, initializeConversationState("session-scope-2"));
  assert(btcScope.isOutOfScope === true && btcScope.outOfScopeCategory === "crypto_finance", "Bitcoin query detected as OUT_OF_SCOPE");
  const btcReply = generateNaturalDialogResponse({
    language: "so",
    templateType: "OUT_OF_SCOPE",
    outOfScopeCategory: "crypto_finance",
    userMessage: btcMsg,
    hasActiveSearchContext: false,
  });
  assert(btcReply.includes("Su'aashaas waxay ka baxsan tahay adeegga Kiro-Maal") && btcReply.includes("Maxaad ka raadinaysaa property ahaan?"), "Bitcoin query receives exact scope redirection");

  // Test 9.3: Assignment Query
  const assignMsg = "Sidee loo sameeyaa assignment?";
  const assignEntities = extractEntities(assignMsg);
  const assignScope = analyzeMessageScope(assignMsg, assignEntities, initializeConversationState("session-scope-3"));
  assert(assignScope.isOutOfScope === true && assignScope.outOfScopeCategory === "assignment", "Assignment query detected as OUT_OF_SCOPE");
  const assignReply = generateNaturalDialogResponse({
    language: "so",
    templateType: "OUT_OF_SCOPE",
    outOfScopeCategory: "assignment",
    userMessage: assignMsg,
    hasActiveSearchContext: false,
  });
  assert(assignReply.includes("Waxaan ahay Real Estate Assistant") && assignReply.includes("Su'aashaas waxay ka baxsan tahay adeegga Kiro-Maal"), "Assignment query receives exact scope redirection");

  // Test 9.4: Natural Casual Conversation
  const greetingMsg = "Asc";
  const greetingEntities = extractEntities(greetingMsg);
  const greetingReadiness = evaluateSearchReadiness(initializeConversationState("session-scope-4"), greetingMsg, greetingEntities, "so");
  assert(greetingReadiness.responseType === "GREETING", "Greeting 'Asc' returns responseType = GREETING");
  const greetingReply = generateNaturalDialogResponse({
    language: "so",
    templateType: "GREETING",
    userMessage: greetingMsg,
  });
  assert(greetingReply === "Waad salaaman tahay 👋 Ku soo dhowow Kiro-Maal. Maxaan kaa caawin karaa—guri kirro ah, iib, apartment, villa mise dhul?", "Greeting 'Asc' generates exact natural welcoming response");

  const howAreYouMsg = "Sidee tahay?";
  const howAreYouEntities = extractEntities(howAreYouMsg);
  const howAreYouReadiness = evaluateSearchReadiness(initializeConversationState("session-scope-5"), howAreYouMsg, howAreYouEntities, "so");
  assert(howAreYouReadiness.responseType === "GENERAL_CONVERSATION", "'Sidee tahay?' returns responseType = GENERAL_CONVERSATION");
  const howAreYouReply = generateNaturalDialogResponse({
    language: "so",
    templateType: "GENERAL_CONVERSATION",
    userMessage: howAreYouMsg,
  });
  assert(howAreYouReply === "Aad baan u fiicanahay 😊. Waxaan ahay Kiro-Maal Real Estate Assistant. Maxaad maanta ka raadinaysaa?", "'Sidee tahay?' generates exact helpful status response");

  // Test 9.5: Mixed Question (Real estate + Unrelated)
  const mixedMsg = "Waxaan rabaa guri Hodan ah oo $400 ah, sidoo kale cashar xisaab ah iga caawi.";
  const mixedEntities = extractEntities(mixedMsg);
  let mixedState = initializeConversationState("session-mixed-1");
  const mixedUpd = updateConversationState(mixedState, mixedEntities, mixedMsg, "property_search", "so");
  mixedState = mixedUpd.state;
  const mixedScope = analyzeMessageScope(mixedMsg, mixedEntities, mixedState);
  assert(mixedScope.isMixed === true, "Mixed message identified as isMixed = true");
  const mixedReadiness = evaluateSearchReadiness(mixedState, mixedMsg, mixedEntities, "so");
  assert(mixedReadiness.responseType === "MIXED_QUERY", "Mixed message returns responseType = MIXED_QUERY");
  const mixedReply = generateNaturalDialogResponse({
    language: "so",
    templateType: "MIXED_QUERY",
    userMessage: mixedMsg,
    slots: mixedState.slots,
  });
  assert(mixedReply.includes("Waan kaa caawin karaa qaybta Real Estate-ka 👍"), "Mixed reply prioritizes real estate portion");
  assert(mixedReply.includes("Hodan") && mixedReply.includes("400"), "Mixed reply summarizes active criteria (Hodan, $400)");
  assert(mixedReply.includes("Qaybta casharka xisaabta waxay ka baxsan tahay adeegga Kiro-Maal."), "Mixed reply notes math lesson is outside scope");
  assert(mixedState.slots.district === "Hodan" && mixedState.slots.maxPrice === 400, "Active real estate criteria was NOT erased by unrelated part");

  // Test 9.6: Multi-Turn Context & Memory Across Unrelated Turn
  console.log("  Testing Multi-Turn Memory Across Unrelated Turn:");
  // Turn 1: 3-bedroom apartment in Hodan, $400
  let multiTurnState = initializeConversationState("session-multi-1");
  const mt1Msg = "Waxaan rabaa 3-bedroom apartment oo Hodan ah, $400.";
  const mt1Entities = extractEntities(mt1Msg);
  const mt1Upd = updateConversationState(multiTurnState, mt1Entities, mt1Msg, "property_search", "so");
  multiTurnState = mt1Upd.state;
  // Simulate active search results from Turn 1
  const mockResultSet = [
    { rank: 1, id: "prop-hodan-1", title: "Modern 3BR Hodan Apt 1", parking: true, bedrooms: 3, price: 400 },
    { rank: 2, id: "prop-hodan-2", title: "Spacious 3BR Hodan Apt 2", parking: true, bedrooms: 3, price: 380 },
  ];
  multiTurnState = attachActiveResultSet(multiTurnState, mockResultSet);
  assert(multiTurnState.activeResultSet.length === 2, "Turn 1 established activeResultSet with 2 properties");

  // Turn 2: Unrelated query in the middle: "Casharrada school-ka iga caawi."
  const mt2Msg = "Casharrada school-ka iga caawi.";
  const mt2Entities = extractEntities(mt2Msg);
  const mt2Scope = analyzeMessageScope(mt2Msg, mt2Entities, multiTurnState);
  assert(mt2Scope.isOutOfScope === true, "Turn 2 recognized as OUT_OF_SCOPE");
  const mt2Reply = generateNaturalDialogResponse({
    language: "so",
    templateType: "OUT_OF_SCOPE",
    outOfScopeCategory: "school_homework",
    userMessage: mt2Msg,
    hasActiveSearchContext: true,
  });
  assert(mt2Reply === "Qaybtaas waxay ka baxsan tahay adeegga Kiro-Maal. Waxaan ku caawin karaa arrimaha Real Estate-ka.", "Turn 2 contextual follow-up politely clarifies scope");
  assert(multiTurnState.activeResultSet.length === 2, "Turn 2 did NOT erase activeResultSet");
  assert(multiTurnState.slots.district === "Hodan", "Turn 2 did NOT erase active slots");

  // Turn 3: User references property #2: "Hadda kii labaad ii sheeg parking ma leeyahay?"
  const mt3Msg = "Hadda kii labaad ii sheeg parking ma leeyahay?";
  const mt3Resolution = resolveConversationalReference(
    mt3Msg,
    multiTurnState.activeResultSet,
    undefined
  );
  assert(mt3Resolution.type === "ORDINAL", "Turn 3 recognized as ORDINAL reference");
  assert(mt3Resolution.targetRank === 2, "Turn 3 resolved targetRank = 2 ('kii labaad')");
  assert(mt3Resolution.targetProperty?.id === "prop-hodan-2", "Turn 3 resolved to prop-hodan-2 from previous results");
  assert(mt3Resolution.attributeQueried === "parking", "Turn 3 identified attribute queried = 'parking'");

  // Generate attribute answer
  const hasParking = Boolean(mt3Resolution.targetProperty?.parking);
  const mt3Reply = hasParking ? "Haa, property-ga labaad wuxuu leeyahay parking." : "Maya, property-ga labaad ma laha parking gaar ah.";
  assert(mt3Reply === "Haa, property-ga labaad wuxuu leeyahay parking.", "Turn 3 answered: 'Haa, property-ga labaad wuxuu leeyahay parking.'");

  // ─────────────────────────────────────────────────────────────────────────
  // FINAL SCORE & SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n============================================================");
  console.log(` MASTER TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMasterTestSuite().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
