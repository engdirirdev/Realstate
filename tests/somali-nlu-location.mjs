/**
 * Automated Test Suite: Somali NLU, Location Intelligence, Language Inheritance, and Rental Intent
 * Covers Sections 21, 22, and 28 of the specification.
 */

import { processConversationalTurn } from "../lib/ai/conversation/chat-engine.js";
import { resolveLocation, cityHasApprovedInventory, SOMALI_CITY_DIRECTORY } from "../lib/ai/nlu/location-resolver.js";
import { extractEntities } from "../lib/ai/nlu/entity-extractor.js";
import { detectConversationalLanguage } from "../lib/ai/conversation/language-manager.js";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message, detail = "") {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] #${totalTests}: ${message} ${detail ? `(${detail})` : ""}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] #${totalTests}: ${message} ${detail ? `[Detail: ${detail}]` : ""}`);
  }
}

async function runTests() {
  console.log("================================================================================");
  console.log("SOMALI NLU, LOCATION INTELLIGENCE & CONVERSATION INHERITANCE TEST SUITE");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // SECTION 21: EXACT CASES 1 - 10
  // ---------------------------------------------------------------------------
  console.log("--- PART 1: SECTION 21 CASES 1-10 ---");

  // Case 1: "waxaan u baahanahay guryo kiro ah"
  const c1Entities = extractEntities("waxaan u baahanahay guryo kiro ah");
  const c1Turn = await processConversationalTurn({
    sessionId: "test-c1-" + Date.now(),
    message: "waxaan u baahanahay guryo kiro ah",
    history: [],
  });

  assert(
    c1Entities.purpose === "RENT",
    "Case 1: Purpose extracted as RENT",
    `purpose=${c1Entities.purpose}`
  );
  assert(
    c1Entities.propertyType === "HOUSE",
    "Case 1: Property type extracted as HOUSE",
    `type=${c1Entities.propertyType}`
  );
  assert(
    c1Turn.responseType === "CLARIFICATION",
    "Case 1: Response type is CLARIFICATION",
    `responseType=${c1Turn.responseType}`
  );
  assert(
    c1Turn.language === "so",
    "Case 1: Response language is Somali",
    `language=${c1Turn.language}`
  );

  // Case 2: "caabudwaaq" after Case 1
  const c2SessionId = "test-c2-chain-" + Date.now();
  const c2Turn1 = await processConversationalTurn({
    sessionId: c2SessionId,
    message: "waxaan u baahanahay guryo kiro ah",
    history: [],
  });
  const c2Turn2 = await processConversationalTurn({
    sessionId: c2SessionId,
    message: "caabudwaaq",
    history: [
      { role: "user", content: "waxaan u baahanahay guryo kiro ah" },
      {
        role: "assistant",
        content: c2Turn1.reply,
        metadata: JSON.stringify({ conversationState: c2Turn1.state }),
      },
    ],
  });

  assert(
    c2Turn2.state.slots.city === "Caabudwaaq",
    "Case 2: City extracted as Caabudwaaq",
    `city=${c2Turn2.state.slots.city}`
  );
  assert(
    c2Turn2.language === "so",
    "Case 2: Language remains Somali",
    `language=${c2Turn2.language}`
  );
  assert(
    !c2Turn2.reply.toLowerCase().includes("which city") &&
    !c2Turn2.reply.toLowerCase().includes("magaalo noocee ah") &&
    !c2Turn2.reply.toLowerCase().includes("magaaladee"),
    "Case 2: Does NOT ask for city again",
    `reply=${c2Turn2.reply}`
  );
  assert(
    c2Turn2.reply.includes("Caabudwaaq") && c2Turn2.reply.includes("Miisaaniyadda"),
    "Case 2: Naturally confirms Caabudwaaq and asks for rental budget",
    `reply=${c2Turn2.reply}`
  );

  // Case 3: "guryo kiro ah caabudwaaq"
  const c3Entities = extractEntities("guryo kiro ah caabudwaaq");
  assert(
    c3Entities.purpose === "RENT" && c3Entities.propertyType === "HOUSE" && c3Entities.city === "Caabudwaaq",
    "Case 3: 'guryo kiro ah caabudwaaq' yields RENT, HOUSE, Caabudwaaq",
    `purpose=${c3Entities.purpose}, type=${c3Entities.propertyType}, city=${c3Entities.city}`
  );

  // Case 4: "waxaan rabaa guri muqdisho ah"
  const c4Entities = extractEntities("waxaan rabaa guri muqdisho ah");
  const c4Turn = await processConversationalTurn({
    sessionId: "test-c4-" + Date.now(),
    message: "waxaan rabaa guri muqdisho ah",
    history: [],
  });
  assert(
    c4Entities.city === "Mogadishu",
    "Case 4: 'muqdisho ah' resolves to canonical Mogadishu",
    `city=${c4Entities.city}`
  );
  assert(
    c4Turn.language === "so",
    "Case 4: Language detected as Somali",
    `language=${c4Turn.language}`
  );

  // Case 5: "guryo kiro ah Muqdisho"
  const c5Entities = extractEntities("guryo kiro ah Muqdisho");
  assert(
    c5Entities.purpose === "RENT" && c5Entities.city === "Mogadishu",
    "Case 5: 'guryo kiro ah Muqdisho' yields RENT + MOGADISHU",
    `purpose=${c5Entities.purpose}, city=${c5Entities.city}`
  );

  // Case 6: "guri 3 qol ah oo caabudwaaq ah"
  const c6Entities = extractEntities("guri 3 qol ah oo caabudwaaq ah");
  assert(
    c6Entities.propertyType === "HOUSE" &&
    c6Entities.bedrooms?.value === 3 &&
    c6Entities.city === "Caabudwaaq",
    "Case 6: 'guri 3 qol ah oo caabudwaaq ah' yields HOUSE, 3 bedrooms, Caabudwaaq",
    `type=${c6Entities.propertyType}, beds=${c6Entities.bedrooms?.value}, city=${c6Entities.city}`
  );

  // Case 7: "500 dollar bishii" after rental context
  const c7Entities = extractEntities("500 dollar bishii");
  assert(
    c7Entities.price?.maxPrice === 500 && c7Entities.price?.period === "month",
    "Case 7: '500 dollar bishii' extracts maxPrice=500 and period=month",
    `price=${c7Entities.price?.maxPrice}, period=${c7Entities.price?.period}`
  );

  // Case 8: "80k" after Somali context
  const c8Lang = detectConversationalLanguage("80k", "so");
  assert(
    c8Lang.language === "so",
    "Case 8: '80k' after Somali context inherits language=so",
    `lang=${c8Lang.language}`
  );

  // Case 9: "haa" after Somali context
  const c9Lang = detectConversationalLanguage("haa", "so");
  assert(
    c9Lang.language === "so",
    "Case 9: 'haa' after Somali context inherits language=so",
    `lang=${c9Lang.language}`
  );

  // Case 10: "kan labaad" after Somali context
  const c10Lang = detectConversationalLanguage("kan labaad", "so");
  assert(
    c10Lang.language === "so",
    "Case 10: 'kan labaad' after Somali context inherits language=so",
    `lang=${c10Lang.language}`
  );

  // ---------------------------------------------------------------------------
  // SECTION 22: SOMALI LOCATION CANONICAL DICTIONARY TESTS
  // ---------------------------------------------------------------------------
  console.log("\n--- PART 2: SECTION 22 SOMALI LOCATION MAPPINGS ---");

  const locationTestCases = [
    { input: "Caabudwaaq", expected: "Caabudwaaq" },
    { input: "Abudwak", expected: "Caabudwaaq" },
    { input: "Abudwaaq", expected: "Caabudwaaq" },
    { input: "Muqdisho", expected: "Mogadishu" },
    { input: "Mogadishu", expected: "Mogadishu" },
    { input: "Hargeysa", expected: "Hargeisa" },
    { input: "Hargeisa", expected: "Hargeisa" },
    { input: "Boosaaso", expected: "Bosaso" },
    { input: "Bosaso", expected: "Bosaso" },
    { input: "Garoowe", expected: "Garowe" },
    { input: "Garowe", expected: "Garowe" },
    { input: "Gaalkacyo", expected: "Galkayo" },
    { input: "Galkayo", expected: "Galkayo" },
    { input: "Kismaayo", expected: "Kismayo" },
    { input: "Kismayo", expected: "Kismayo" },
    { input: "Baydhabo", expected: "Baydhabo" },
    { input: "Baidoa", expected: "Baydhabo" },
    { input: "Burco", expected: "Burao" },
    { input: "Burao", expected: "Burao" },
    { input: "Laascaanood", expected: "Las Anod" },
    { input: "Las Anod", expected: "Las Anod" },
    { input: "Ceerigaabo", expected: "Erigavo" },
    { input: "Erigavo", expected: "Erigavo" },
    { input: "Boorama", expected: "Borama" },
    { input: "Borama", expected: "Borama" },
    { input: "Dhuusamareeb", expected: "Dhuusamareeb" },
    { input: "Dhusamareeb", expected: "Dhuusamareeb" },
    { input: "Guriceel", expected: "Guriceel" },
    { input: "Cadaado", expected: "Cadaado" },
    { input: "Hobyo", expected: "Hobyo" },
    { input: "Jowhar", expected: "Jowhar" },
    { input: "Afgooye", expected: "Afgooye" },
    { input: "Marka", expected: "Marka" },
    { input: "Baardheere", expected: "Bardera" },
    { input: "Beledweyne", expected: "Beledweyne" },
  ];

  for (const tc of locationTestCases) {
    const res = resolveLocation(tc.input);
    assert(
      res && res.canonicalCity === tc.expected,
      `Location mapping: "${tc.input}" -> "${tc.expected}"`,
      `resolved=${res ? res.canonicalCity : "null"}`
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 28: EXACT END-TO-END TARGET DIALOGUE
  // ---------------------------------------------------------------------------
  console.log("\n--- PART 3: SECTION 28 END-TO-END TARGET CONVERSATION ---");

  const e2eSessionId = "e2e-target-" + Date.now();
  let conversationHistory = [];

  // Turn 1: "asc"
  const t1 = await processConversationalTurn({
    sessionId: e2eSessionId,
    message: "asc",
    history: conversationHistory,
  });
  conversationHistory.push({ role: "user", content: "asc" });
  conversationHistory.push({
    role: "assistant",
    content: t1.reply,
    metadata: JSON.stringify({ conversationState: t1.state }),
  });

  assert(
    t1.language === "so" && t1.responseType === "GREETING",
    "E2E Turn 1: 'asc' produces Somali greeting without search cards",
    `reply=${t1.reply}`
  );

  // Turn 2: "waxaan u baahanahay guryo kiro ah"
  const t2 = await processConversationalTurn({
    sessionId: e2eSessionId,
    message: "waxaan u baahanahay guryo kiro ah",
    history: conversationHistory,
  });
  conversationHistory.push({ role: "user", content: "waxaan u baahanahay guryo kiro ah" });
  conversationHistory.push({
    role: "assistant",
    content: t2.reply,
    metadata: JSON.stringify({ conversationState: t2.state }),
  });

  assert(
    t2.language === "so" &&
    t2.responseType === "CLARIFICATION" &&
    t2.state.slots.purpose === "RENT" &&
    t2.state.slots.propertyType === "HOUSE" &&
    t2.reply.includes("Magaalo"),
    "E2E Turn 2: Understood RENT + HOUSE, asks for city in Somali",
    `reply=${t2.reply}`
  );

  // Turn 3: "caabudwaaq"
  const t3 = await processConversationalTurn({
    sessionId: e2eSessionId,
    message: "caabudwaaq",
    history: conversationHistory,
  });
  conversationHistory.push({ role: "user", content: "caabudwaaq" });
  conversationHistory.push({
    role: "assistant",
    content: t3.reply,
    metadata: JSON.stringify({ conversationState: t3.state }),
  });

  assert(
    t3.language === "so" &&
    t3.state.slots.city === "Caabudwaaq" &&
    t3.reply.includes("Caabudwaaq") &&
    t3.reply.includes("Miisaaniyadda") &&
    !t3.reply.toLowerCase().includes("which city"),
    "E2E Turn 3: Understood Caabudwaaq, asks for rental budget in Somali (NOT city again!)",
    `reply=${t3.reply}`
  );

  // Turn 4: "500 dollar bishii"
  const t4 = await processConversationalTurn({
    sessionId: e2eSessionId,
    message: "500 dollar bishii",
    history: conversationHistory,
  });
  conversationHistory.push({ role: "user", content: "500 dollar bishii" });
  conversationHistory.push({
    role: "assistant",
    content: t4.reply,
    metadata: JSON.stringify({ conversationState: t4.state }),
  });

  assert(
    t4.language === "so" &&
    t4.state.slots.maxPrice === 500 &&
    t4.state.slots.pricePeriod === "month" &&
    t4.reply.includes("Qolal"),
    "E2E Turn 4: Understood $500 monthly budget, asks for bedroom count in Somali",
    `reply=${t4.reply}`
  );

  // Turn 5: "3"
  const t5 = await processConversationalTurn({
    sessionId: e2eSessionId,
    message: "3",
    history: conversationHistory,
  });

  assert(
    t5.language === "so" &&
    t5.state.slots.bedrooms === 3 &&
    t5.state.slots.city === "Caabudwaaq" &&
    t5.state.slots.purpose === "RENT" &&
    t5.state.slots.maxPrice === 500,
    "E2E Turn 5: Slots fully collected: Caabudwaaq, RENT, HOUSE, 3 beds, $500/month",
    `slots=${JSON.stringify(t5.state.slots)}`
  );

  // Check inventory handling for Caabudwaaq (0 approved properties in DB)
  assert(
    t5.responseType === "NO_RESULTS" &&
    t5.properties.length === 0 &&
    t5.reply.includes("Caabudwaaq") &&
    !t5.reply.includes("Mogadishu") &&
    !t5.reply.includes("Hargeisa"),
    "E2E Turn 5: Zero inventory for Caabudwaaq reported honestly with NO silent cross-city fallback",
    `reply=${t5.reply}`
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${totalTests})`);
  console.log("================================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
