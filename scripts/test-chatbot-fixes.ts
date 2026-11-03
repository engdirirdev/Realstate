import { processConversationalTurn } from "../lib/ai/conversation/chat-engine";

async function run() {
  const sessionId = "test-live-" + Date.now();
  const history: { role: string; content: string }[] = [];

  console.log("=================================================");
  console.log("TEST 1: User says 'hi'");
  console.log("=================================================");
  const t1 = await processConversationalTurn({ sessionId, message: "hi", history, language: "en" });
  console.log("Reply:", t1.reply);
  console.log("shouldRenderCards:", t1.shouldRenderPropertyCards);
  console.log("properties count:", t1.properties.length);
  console.log("intent:", t1.intent);
  if (t1.properties.length === 0 && !t1.shouldRenderPropertyCards && t1.intent === "GREETING") {
    console.log(">> PASS: Saying 'hi' produces a pure greeting without any houses!\n");
  } else {
    console.error(">> FAIL on Test 1!\n");
    process.exit(1);
  }

  history.push({ role: "user", content: "hi" });
  history.push({ role: "assistant", content: t1.reply });

  console.log("=================================================");
  console.log("TEST 2: User asks 'show houses in mogadishu'");
  console.log("=================================================");
  const t2 = await processConversationalTurn({ sessionId, message: "show houses in mogadishu", history, language: "en" });
  console.log("Reply:", t2.reply);
  console.log("shouldRenderCards:", t2.shouldRenderPropertyCards);
  console.log("properties count:", t2.properties.length);
  console.log("state city:", t2.state.slots.city);
  console.log("cities in returned listings:", t2.properties.map((p) => p.city));

  const allMog = t2.properties.length > 0 && t2.properties.every((p) => p.city === "Mogadishu");
  if (allMog && t2.shouldRenderPropertyCards && t2.state.slots.city === "Mogadishu") {
    console.log(">> PASS: Shows ONLY Mogadishu houses with property cards!\n");
  } else {
    console.error(">> FAIL on Test 2!\n");
    process.exit(1);
  }

  history.push({ role: "user", content: "show houses in mogadishu" });
  history.push({ role: "assistant", content: t2.reply });

  console.log("=================================================");
  console.log("TEST 3: User now asks 'show houses in hargeisa'");
  console.log("=================================================");
  const t3 = await processConversationalTurn({ sessionId, message: "show houses in hargeisa", history, language: "en" });
  console.log("Reply:", t3.reply);
  console.log("shouldRenderCards:", t3.shouldRenderPropertyCards);
  console.log("properties count:", t3.properties.length);
  console.log("state city:", t3.state.slots.city);
  console.log("cities in returned listings:", t3.properties.map((p) => p.city));

  const allHarg = t3.properties.length > 0 && t3.properties.every((p) => p.city === "Hargeisa");
  if (allHarg && t3.shouldRenderPropertyCards && t3.state.slots.city === "Hargeisa") {
    console.log(">> PASS: Shows ONLY Hargeisa houses without Mogadishu bleeding in!\n");
  } else {
    console.error(">> FAIL on Test 3!\n");
    process.exit(1);
  }

  history.push({ role: "user", content: "show houses in hargeisa" });
  history.push({ role: "assistant", content: t3.reply });

  console.log("=================================================");
  console.log("TEST 4: User asks 'now show houses in mogadishu'");
  console.log("=================================================");
  const t4 = await processConversationalTurn({ sessionId, message: "now show houses in mogadishu", history, language: "en" });
  console.log("Reply:", t4.reply);
  console.log("shouldRenderCards:", t4.shouldRenderPropertyCards);
  console.log("properties count:", t4.properties.length);
  console.log("state city:", t4.state.slots.city);
  console.log("cities in returned listings:", t4.properties.map((p) => p.city));

  const allMogAgain = t4.properties.length > 0 && t4.properties.every((p) => p.city === "Mogadishu");
  if (allMogAgain && t4.shouldRenderPropertyCards && t4.state.slots.city === "Mogadishu") {
    console.log(">> PASS: Multi-turn city switch succeeded! Returned only Mogadishu houses!\n");
  } else {
    console.error(">> FAIL on Test 4!\n");
    process.exit(1);
  }

  console.log("=================================================");
  console.log("TEST 5: User says 'hi' after searching houses");
  console.log("=================================================");
  const t5 = await processConversationalTurn({ sessionId, message: "hi", history, language: "en" });
  console.log("Reply:", t5.reply);
  console.log("shouldRenderCards:", t5.shouldRenderPropertyCards);
  console.log("properties count:", t5.properties.length);
  if (t5.properties.length === 0 && !t5.shouldRenderPropertyCards && t5.intent === "GREETING") {
    console.log(">> PASS: Post-search greeting does NOT show houses!\n");
  } else {
    console.error(">> FAIL on Test 5!\n");
    process.exit(1);
  }

  console.log("ALL 5 TESTS PASSED WITH 100% SUCCESS!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
