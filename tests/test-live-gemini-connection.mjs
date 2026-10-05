/**
 * Safe Live Gemini API Connectivity Test
 *
 * Verifies live API connectivity only if an API key is present in the environment.
 * NEVER exposes or logs the API key.
 * Uses a benign prompt: "Reply with exactly: GEMINI_CONNECTION_OK"
 */

import { GEMINI_CONFIG, getGeminiApiKey } from "../lib/ai/gemini-config.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function runLiveTest() {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    console.log("LIVE API TEST:");
    console.log("NOT RUN — Gemini API key is not configured.");
    return;
  }

  console.log("======================================================================");
  console.log(" SAFE LIVE GEMINI API CONNECTIVITY TEST");
  console.log(` Model: ${GEMINI_CONFIG.CHAT_MODEL}`);
  console.log("======================================================================\n");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_CONFIG.CHAT_MODEL });

  // 1. Basic Generation Test
  try {
    const prompt = "Reply with exactly: GEMINI_CONNECTION_OK";
    console.log(`Sending harmless test prompt: "${prompt}"...`);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout after 4000ms")), GEMINI_CONFIG.CHAT_TIMEOUT_MS)
    );

    const apiPromise = model.generateContent(prompt);
    const result = await Promise.race([apiPromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text().trim();

    console.log(`✓ API request succeeded`);
    console.log(`✓ Model "${GEMINI_CONFIG.CHAT_MODEL}" accepted the request`);
    console.log(`✓ Response received: "${text}"`);
    console.log("\nLIVE API TEST RESULT: PASSED");
  } catch (error) {
    console.error(`✗ API Call Failed: ${error?.message || String(error)}`);
    console.log("\nLIVE API TEST RESULT: FAILED");
  }
}

runLiveTest();
