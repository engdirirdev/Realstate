/**
 * End-to-End AIDA Real Estate Scope Verification
 * Tests the live processConversationalTurn function from chat-engine.ts
 */

import { processConversationalTurn } from "../lib/ai/conversation/chat-engine";

async function main() {
  console.log("==================================================");
  console.log(" AIDA REAL ESTATE SCOPE - E2E PROCESS_TURN TESTS");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      passed++;
      console.log(`  ✓ ${msg}`);
    } else {
      failed++;
      console.error(`  ✗ FAIL: ${msg}`);
    }
  }

  const sessionId = "test-session-aida-scope-" + Date.now();
  const history = [];

  async function sendTurn(message) {
    history.push({ role: "user", content: message });
    const res = await processConversationalTurn({
      sessionId,
      message,
      history,
    });
    history.push({
      role: "assistant",
      content: res.reply,
      metadata: JSON.stringify({ conversationState: res.state }),
    });
    return res;
  }

  // Turn 1: User says "Casharrada school-ka inaad iga caawiso baan rabaa."
  console.log("\n[Turn 1] User asks school homework help");
  const turn1 = await sendTurn("Casharrada school-ka inaad iga caawiso baan rabaa.");
  console.log("  AIDA:", turn1.reply);
  assert(turn1.responseType === "OUT_OF_SCOPE", "Turn 1 responseType is OUT_OF_SCOPE");
  assert(turn1.shouldRenderPropertyCards === false, "Turn 1 suppressed property cards");
  assert(!turn1.reply.includes("Magaalo"), "Turn 1 does NOT ask for city");
  assert(turn1.reply.includes("Kiro-Maal Real Estate Assistant"), "Turn 1 explains real estate scope");

  // Turn 2: User says "Bitcoin maanta meeqa ayuu yahay?"
  console.log("\n[Turn 2] User asks Bitcoin price");
  const turn2 = await sendTurn("Bitcoin maanta meeqa ayuu yahay?");
  console.log("  AIDA:", turn2.reply);
  assert(turn2.responseType === "OUT_OF_SCOPE", "Turn 2 responseType is OUT_OF_SCOPE");
  assert(turn2.reply.includes("Su'aashaas waxay ka baxsan tahay adeegga Kiro-Maal"), "Turn 2 redirects from Bitcoin to real estate");

  // Turn 3: User says "Asc"
  console.log("\n[Turn 3] User says 'Asc'");
  const turn3 = await sendTurn("Asc");
  console.log("  AIDA:", turn3.reply);
  assert(turn3.responseType === "GREETING", "Turn 3 responseType is GREETING");
  assert(turn3.reply.includes("Waad salaaman tahay 👋 Ku soo dhowow Kiro-Maal"), "Turn 3 gives natural greeting");

  // Turn 4: User says "Sidee tahay?"
  console.log("\n[Turn 4] User says 'Sidee tahay?'");
  const turn4 = await sendTurn("Sidee tahay?");
  console.log("  AIDA:", turn4.reply);
  assert(turn4.responseType === "GENERAL_CONVERSATION", "Turn 4 responseType is GENERAL_CONVERSATION");
  assert(turn4.reply.includes("Aad baan u fiicanahay 😊"), "Turn 4 responds naturally to casual status check");

  // Turn 5: Mixed question
  console.log("\n[Turn 5] Mixed query: 'Waxaan rabaa guri Hodan ah oo $400 ah, sidoo kale cashar xisaab ah iga caawi.'");
  const turn5 = await sendTurn("Waxaan rabaa guri Hodan ah oo $400 ah, sidoo kale cashar xisaab ah iga caawi.");
  console.log("  AIDA:", turn5.reply);
  assert(turn5.responseType === "MIXED_QUERY", "Turn 5 responseType is MIXED_QUERY");
  assert(turn5.reply.includes("Waan kaa caawin karaa qaybta Real Estate-ka 👍"), "Turn 5 prioritizes real estate");
  assert(turn5.reply.includes("Hodan") && turn5.reply.includes("400"), "Turn 5 summarizes active criteria");
  assert(turn5.reply.includes("Qaybta casharka xisaabta waxay ka baxsan tahay adeegga Kiro-Maal."), "Turn 5 notes math lesson is outside scope");

  // Turn 6: Explicit search to populate active results
  console.log("\n[Turn 6] User says 'ii raadi'");
  const turn6 = await sendTurn("ii raadi");
  console.log("  AIDA:", turn6.reply.slice(0, 150) + "...");
  console.log("  Properties returned:", turn6.properties.length);
  assert(turn6.responseType === "PROPERTY_RESULTS", "Turn 6 executed search");
  assert(turn6.properties.length > 0, "Turn 6 returned matching properties in Hodan/Mogadishu");

  // Turn 7: Intermediate off-topic query
  console.log("\n[Turn 7] Intermediate unrelated question: 'Casharrada school-ka iga caawi.'");
  const turn7 = await sendTurn("Casharrada school-ka iga caawi.");
  console.log("  AIDA:", turn7.reply);
  assert(turn7.responseType === "OUT_OF_SCOPE", "Turn 7 responseType is OUT_OF_SCOPE");
  assert(turn7.reply.includes("Qaybtaas waxay ka baxsan tahay adeegga Kiro-Maal"), "Turn 7 contextual scope clarification");

  // Turn 8: Follow-up referencing #2 from Turn 6: "Hadda kii labaad ii sheeg parking ma leeyahay?"
  console.log("\n[Turn 8] User asks about property #2 parking: 'Hadda kii labaad ii sheeg parking ma leeyahay?'");
  const turn8 = await sendTurn("Hadda kii labaad ii sheeg parking ma leeyahay?");
  console.log("  AIDA:", turn8.reply);
  assert(turn8.responseType === "PROPERTY_DETAIL", "Turn 8 responseType is PROPERTY_DETAIL");
  assert(turn8.reply.includes("property-ga labaad") && turn8.reply.includes("parking"), "Turn 8 answers parking status for property #2 specifically");
  assert(turn8.shouldRenderPropertyCards === false, "Turn 8 does NOT render cards for single attribute question");

  console.log("\n==================================================");
  console.log(` E2E RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("E2E Test Error:", err);
  process.exit(1);
});
