/**
 * AIDA Response Generator
 *
 * Coordinates grounded response generation:
 * 1. Prepares verified database context.
 * 2. Attempts natural generation via configured AI providers (OpenAI or Gemini).
 * 3. Enforces strict grounding validation against hallucinated claims.
 * 4. Falls back deterministically to natural localized templates if AI fails
 *    or fails grounding checks.
 * 5. Guarantees ONE unified AIDA conversational voice.
 */

import {
  AIGenerationInput,
  AIGenerationResult,
} from "../providers/ai-provider";
import { openAIProvider } from "../providers/openai-provider";
import { geminiProvider } from "../providers/gemini-provider";
import { validateGrounding } from "./grounding-validator";
import { generateNaturalDialogResponse } from "../conversation/language-manager";
import { ResultItem } from "../conversation/types";

export interface GroundedResponseOutput {
  replyText: string;
  source: "AI_GENERATED" | "DETERMINISTIC_FALLBACK";
  providerUsed?: "openai" | "gemini";
  latencyMs: number;
  groundingPassed: boolean;
  groundingReason?: string;
}

export async function generateGroundedAIDAResponse(
  input: AIGenerationInput,
  deterministicFallbackReply?: string
): Promise<GroundedResponseOutput> {
  const startTime = Date.now();

  // 1. Check if any provider is configured
  const openAIReady = openAIProvider.isConfigured();
  const geminiReady = geminiProvider.isConfigured();

  if (!openAIReady && !geminiReady) {
    return {
      replyText: deterministicFallbackReply || buildDefaultFallback(input),
      source: "DETERMINISTIC_FALLBACK",
      latencyMs: 0,
      groundingPassed: true,
    };
  }

  // 2. Select primary provider: Gemini 3.8 Flash is AIDA's primary conversational intelligence
  const primaryProvider = geminiReady ? geminiProvider : openAIProvider;
  const secondaryProvider = (geminiReady && openAIReady) ? openAIProvider : null;

  let aiResult: AIGenerationResult | null = null;

  try {
    aiResult = await primaryProvider.generateResponse(input);
  } catch {
    aiResult = null;
  }

  if (!aiResult?.success && secondaryProvider) {
    try {
      aiResult = await secondaryProvider.generateResponse(input);
    } catch {
      aiResult = null;
    }
  }

  // 3. Grounding Validation
  if (aiResult?.success && aiResult.replyText) {
    const groundingCheck = validateGrounding(
      aiResult.replyText,
      input.verifiedProperties,
      input.referencedProperty
    );

    if (groundingCheck.isValid) {
      return {
        replyText: aiResult.replyText,
        source: "AI_GENERATED",
        providerUsed: aiResult.provider,
        latencyMs: Date.now() - startTime,
        groundingPassed: true,
      };
    }

    // Grounding check failed: Log and fall back to deterministic response
    return {
      replyText: deterministicFallbackReply || buildDefaultFallback(input),
      source: "DETERMINISTIC_FALLBACK",
      latencyMs: Date.now() - startTime,
      groundingPassed: false,
      groundingReason: groundingCheck.reason,
    };
  }

  return {
    replyText: deterministicFallbackReply || buildDefaultFallback(input),
    source: "DETERMINISTIC_FALLBACK",
    latencyMs: Date.now() - startTime,
    groundingPassed: true,
  };
}

function buildDefaultFallback(input: AIGenerationInput): string {
  const lang = input.language || "so";
  if (input.referencedProperty) {
    return generateNaturalDialogResponse({
      language: lang,
      templateType: "ORDINAL_DETAILS",
      referencedProperty: input.referencedProperty,
    });
  }
  if (input.verifiedProperties.length > 0) {
    return generateNaturalDialogResponse({
      language: lang,
      templateType: "SEARCH_RESULTS",
      properties: input.verifiedProperties,
      totalMatches: input.verifiedProperties.length,
      slots: input.contextSlots as any,
    });
  }
  return generateNaturalDialogResponse({
    language: lang,
    templateType: "ZERO_RESULTS",
    slots: input.contextSlots as any,
  });
}
