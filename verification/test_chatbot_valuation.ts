/**
 * Test script to query chatbot for property valuation
 */

async function testChatbotValuation() {
  const query = "Can you value my property? It is a 3-bedroom house in Mogadishu with 150 sqm.";
  console.log("Chatbot Prompt:", query);

  const res = await fetch("http://localhost:3000/api/ai-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: query }),
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Chatbot Response:", JSON.stringify(data, null, 2));
}

testChatbotValuation().catch((err) => {
  console.error("Chatbot test failed:", err);
  process.exit(1);
});
