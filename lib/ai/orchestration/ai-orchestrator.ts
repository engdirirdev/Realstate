/**
 * Central AI Orchestrator
 *
 * Coordinates:
 * 1. Fast deterministic pre-check (handles high-confidence turns locally without API latency).
 * 2. Parallel Dual-AI invocation (OpenAI + Gemini) for complex, typo-heavy, or ambiguous turns.
 * 3. Dual-AI consensus resolution with disagreement safeguards.
 * 4. Grounded response generation with anti-hallucination validation.
 * 5. Safe metadata observability without leaking credentials.
 */

import {
  AIUnderstandingInput,
  AIUnderstandingResult,
  ActiveResultSummary,
} from "../providers/ai-provider";
import { openAIProvider } from "../providers/openai-provider";
import { geminiProvider } from "../providers/gemini-provider";
import {
  ResolvedConsensus,
  resolveAIConsensus,
} from "./consensus-resolver";
import {
  ConversationState,
  ContextAwareIntent,
  ExtendedLanguage,
} from "../conversation/types";
import { isOpenAIConfigured } from "../openai-config";
import { isGeminiConfigured } from "../gemini-config";

export interface AIOrchestrationTelemetry {
  provider: "openai" | "gemini" | "dual" | "local-deterministic";
  openAILatencyMs?: number;
  geminiLatencyMs?: number;
  totalLatencyMs: number;
  consensusStatus: string;
  confidence: number;
  skippedAICall: boolean;
  skipReason?: string;
}

export interface OrchestrationResult {
  consensus: ResolvedConsensus | null;
  telemetry: AIOrchestrationTelemetry;
}

/**
 * Determines whether a message requires external AI understanding or can be
 * handled completely and accurately by the local deterministic engine.
 * (Section 18: Cost & Latency Optimization)
 */
export function shouldInvokeAI(
  userMessage: string,
  state: ConversationState,
  localConfidence: number = 0.9
): { shouldInvoke: boolean; reason: string } {
  // If neither provider is configured, skip AI calls immediately
  if (!isOpenAIConfigured() && !isGeminiConfigured()) {
    return { shouldInvoke: false, reason: "NO_PROVIDERS_CONFIGURED" };
  }

  // Gemini-native conversational AI: All normal human turns reach Gemini to understand context,
  // reasoning, negations, corrections, preferences, and dialogue flow.
  return { shouldInvoke: true, reason: "GEMINI_NATIVE_CONVERSATIONAL_INTELLIGENCE" };
}

/**
 * Orchestrates dual AI understanding across OpenAI and Gemini in parallel
 */
export async function orchestrateAIUnderstanding(
  input: AIUnderstandingInput,
  preferredLanguage: ExtendedLanguage = "so"
): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const openAIConfigured = openAIProvider.isConfigured();
  const geminiConfigured = geminiProvider.isConfigured();

  if (!openAIConfigured && !geminiConfigured) {
    return {
      consensus: null,
      telemetry: {
        provider: "local-deterministic",
        totalLatencyMs: 0,
        consensusStatus: "NO_PROVIDERS_AVAILABLE",
        confidence: 0,
        skippedAICall: true,
        skipReason: "API_KEYS_NOT_CONFIGURED",
      },
    };
  }

  // Parallel execution of available providers (Section 45: High Performance)
  const [openAIRes, geminiRes] = await Promise.all([
    openAIConfigured
      ? openAIProvider.understand(input)
      : Promise.resolve<AIUnderstandingResult | null>(null),
    geminiConfigured
      ? geminiProvider.understand(input)
      : Promise.resolve<AIUnderstandingResult | null>(null),
  ]);

  const consensus = resolveAIConsensus(openAIRes, geminiRes, preferredLanguage);
  const totalLatencyMs = Date.now() - startTime;

  const providerType =
    openAIConfigured && geminiConfigured
      ? "dual"
      : openAIConfigured
      ? "openai"
      : "gemini";

  return {
    consensus,
    telemetry: {
      provider: providerType,
      openAILatencyMs: openAIRes?.latencyMs,
      geminiLatencyMs: geminiRes?.latencyMs,
      totalLatencyMs,
      consensusStatus: consensus.agreementStatus,
      confidence: consensus.combinedConfidence,
      skippedAICall: false,
    },
  };
}

/**
 * Maps ResultItem into compact ActiveResultSummary to minimize token usage
 * (Section 29: API Cost Control)
 */
export function summarizeActiveResults(
  properties: {
    rank: number;
    id: string;
    title: string;
    price: number;
    city: string;
    type: string;
    bedrooms: number;
    bathrooms: number;
    furnished: boolean;
    parking: boolean;
  }[]
): ActiveResultSummary[] {
  return properties.slice(0, 5).map((p) => ({
    rank: p.rank,
    id: p.id,
    title: p.title,
    price: p.price,
    city: p.city,
    type: p.type,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    furnished: p.furnished,
    parking: p.parking,
  }));
}
