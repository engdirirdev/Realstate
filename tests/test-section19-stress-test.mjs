// @ts-check
import { processConversationalTurn } from '../lib/ai/conversation/chat-engine.js';

async function runSection19StressTest() {
  console.log("======================================================================");
  console.log(" SECTION 19 — REAL-LIFE STRESS TEST EXECUTION TRACE");
  console.log("======================================================================");

  const rawMessage = "walaal asc, guri ayaan rabaa kirro ah, reer ayaan nahay oo meel aad u buuq badan ma rabno, shaqadayduna km4 ayay u dhowdahay, lacag ahaan 400 ilaa 500 ayaan awoodaa, 3 qol haddii la helo waa fiican laakiin haddii aan la helin 2 qol oo fiican waan qaadan karaa, Hodanna hadda ma rabo, marka adigu kan ugu fiican ee shuruudahaan ku dhow ii raadi";

  console.log("\n1. USER RAW MESSAGE:\n" + rawMessage);

  const result = await processConversationalTurn({
    sessionId: "stress-test-" + Date.now(),
    message: rawMessage,
    history: [],
  });

  console.log("\n2. CONVERSATION STATE / UNDERSTANDING (STORED AS PURE DATA):");
  console.log("  - City:", result.state.slots.city || "none");
  console.log("  - Max Price:", result.state.slots.maxPrice || "none");
  console.log("  - Purpose:", result.state.slots.purpose || "none");
  console.log("  - Excluded Locations:", JSON.stringify(result.state.slots.excludedLocations || []));
  console.log("  - Soft Preferences:", JSON.stringify(result.state.slots.softPreferences || []));
  console.log("  - Proximity:", result.state.slots.proximity || "none");
  console.log("  - User Reasoning:", JSON.stringify(result.state.slots.userReasoning || []));

  console.log("\n3. TOOL EXECUTION & APPLICATION SAFETY ENFORCEMENT:");
  console.log("  - Response Type:", result.responseType);
  console.log("  - Returned Properties Count:", result.properties.length);
  console.log("  - Property Cards Rendered:", result.shouldRenderPropertyCards);

  const hodanLeaks = result.properties.filter(p => 
    (p.city && p.city.toLowerCase().includes('hodan')) ||
    (p.location && p.location.toLowerCase().includes('hodan')) ||
    (p.address && p.address.toLowerCase().includes('hodan'))
  );
  console.log("  - Hodan Leaks in Verified Results:", hodanLeaks.length, "(Must be 0)");

  console.log("\n4. FINAL GROUNDED AIDA RESPONSE:");
  console.log(result.reply);

  console.log("\n======================================================================");
  if (hodanLeaks.length === 0 && result.state.slots.excludedLocations?.includes("Hodan")) {
    console.log(" STRESS TEST RESULT: PASS");
  } else {
    console.log(" STRESS TEST RESULT: FAIL");
  }
  console.log("======================================================================");
}

runSection19StressTest().catch(console.error);
