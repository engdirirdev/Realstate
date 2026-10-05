/**
 * OpenAI Intelligence Provider
 *
 * Implements AIProvider using the official OpenAI Node.js SDK.
 * Uses strict JSON Schema Structured Outputs for deterministic NLU.
 * Generates natural responses strictly grounded in verified database data.
 * All API keys remain server-side and are never logged or exposed.
 */

import OpenAI from "openai";
import {
  OPENAI_CONFIG,
  getOpenAIApiKey,
  isOpenAIConfigured,
} from "../openai-config";
import {
  AIProvider,
  AIUnderstandingInput,
  AIUnderstandingResult,
  AIGenerationInput,
  AIGenerationResult,
  AIStructuredUnderstanding,
  AI_UNDERSTANDING_JSON_SCHEMA,
} from "./ai-provider";

export class OpenAIProvider implements AIProvider {
  public readonly id = "openai" as const;
  public readonly model: string;
  private client: OpenAI | null = null;

  constructor(modelOverride?: string) {
    this.model = modelOverride || OPENAI_CONFIG.CHAT_MODEL;
  }

  public isConfigured(): boolean {
    return isOpenAIConfigured();
  }

  private getClient(): OpenAI | null {
    if (this.client) return this.client;
    const apiKey = getOpenAIApiKey();
    if (!apiKey) return null;
    this.client = new OpenAI({ apiKey });
    return this.client;
  }

  public async understand(
    input: AIUnderstandingInput
  ): Promise<AIUnderstandingResult> {
    const startTime = Date.now();
    const client = this.getClient();

    if (!client) {
      return {
        provider: this.id,
        model: this.model,
        latencyMs: 0,
        understanding: this.buildFallbackUnderstanding(input),
        success: false,
        error: "OpenAI API key is not configured.",
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, OPENAI_CONFIG.UNDERSTANDING_TIMEOUT_MS);

    try {
      const systemPrompt = `You are AIDA's internal Natural Language Understanding intelligence engine for Kiro-Maal Real Estate in Somalia.
Your role is to analyze user messages with extreme linguistic accuracy and return structured JSON.

CRITICAL RESPONSIBILITIES:
1. Multilingual Somali & English Fluency:
   - Deeply understand natural Somali, conversational Somali, informal Somali, dialects, code-switching (Somali + English), typos, slang, and abbreviations.
   - Understand typos: "apartmant" -> apartment, "bedrom" -> bedroom, "furnshed" -> furnished, "mogadisho" -> Mogadishu, "hodon" -> Hodan.
2. Context & Short Answers (DO NOT classify as OUT_OF_SCOPE):
   - You MUST utilize conversation context and pending questions/slots.
   - If pendingSlot is "city" and user says "mogadisho" -> city = "Mogadishu", pendingSlotAnswer = { slot: "city", value: "Mogadishu" }.
   - If pendingSlot is "budget" and user says "$400" or "400" -> budget = 400.
   - If pendingSlot is "bedrooms" and user says "3" -> bedrooms = 3.
   - If user says "haa" or "yes" or "maya" or "no", interpret against pending question.
3. Real Estate Scope Validation:
   - Kiro-Maal is strictly a Real Estate platform (houses, apartments, villas, offices, land, rentals, sales).
   - If user asks non-real-estate questions (e.g. "Casharrada school-ka iga caawi", homework, cooking, sports):
     set domain = "OUT_OF_SCOPE", intent = "OUT_OF_SCOPE".
4. Property Reference Resolution:
   - Active result set properties are provided with ranks (1, 2, 3...).
   - "kan labaad" / "the second one" / "kan 2aad" -> targetRank = 2.
   - "kii hore" / "the previous one" / "kan koowaad" -> targetRank = 1.
   - "midka ugu jaban" / "kan ugu jaban" -> type = "COMPARATIVE", attributeQueried = "price".
   - "labadan kee jaban" / "labadan kee fiican" -> type = "COMPARISON".
5. Corrections:
   - "Maya Hodan ma aha, Wadajir ayaan rabaa" -> correction = { slot: "district", previousValue: "Hodan", newValue: "Wadajir" }, district = "Wadajir".
   - "$350 ayaan ula jeedaa" -> correction = { slot: "budget", previousValue: null, newValue: "350" }, budget = 350.`;

      const userPromptPayload = {
        userMessage: input.userMessage,
        pendingQuestion: input.pendingQuestion || null,
        pendingSlot: input.pendingSlot || null,
        expectedEntityType: input.expectedEntityType || null,
        currentKnownSlots: input.currentSlots || {},
        activeResultSet: input.activeResultSetSummary || [],
        preferredLanguage: input.preferredLanguage || "so",
        recentHistory: (input.conversationHistory || []).slice(-4),
      };

      const response = await client.chat.completions.create(
        {
          model: this.model,
          temperature: OPENAI_CONFIG.UNDERSTANDING_TEMPERATURE,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Analyze this conversational turn:\n${JSON.stringify(
                userPromptPayload,
                null,
                2
              )}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "aida_understanding",
              strict: true,
              schema: AI_UNDERSTANDING_JSON_SCHEMA as any,
            },
          },
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from OpenAI completion.");
      }

      const parsed: AIStructuredUnderstanding = JSON.parse(content);
      return {
        provider: this.id,
        model: this.model,
        latencyMs,
        understanding: parsed,
        success: true,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      const isTimeout = err?.name === "AbortError" || controller.signal.aborted;
      const errorMsg = isTimeout
        ? `OpenAI request timed out after ${OPENAI_CONFIG.UNDERSTANDING_TIMEOUT_MS}ms`
        : err?.message || "Unknown OpenAI error";

      return {
        provider: this.id,
        model: this.model,
        latencyMs,
        understanding: this.buildFallbackUnderstanding(input),
        success: false,
        error: errorMsg,
      };
    }
  }

  public async generateResponse(
    input: AIGenerationInput
  ): Promise<AIGenerationResult> {
    const startTime = Date.now();
    const client = this.getClient();

    if (!client) {
      return {
        provider: this.id,
        model: this.model,
        latencyMs: 0,
        replyText: "",
        success: false,
        error: "OpenAI API key is not configured.",
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, OPENAI_CONFIG.GENERATION_TIMEOUT_MS);

    try {
      const systemPrompt = `You are AIDA, the dedicated, friendly, professional Real Estate Assistant for Kiro-Maal in Somalia.
Generate a natural, concise, polished response for the user.

STRICT GROUNDING & ANTI-HALLUCINATION RULES:
1. DATABASE IS THE SOLE SOURCE OF TRUTH:
   - ONLY mention amenities, prices, bedrooms, bathrooms, and availability that exist in the verified property data provided.
   - NEVER invent swimming pools, gym, generators, security, extra bedrooms, or features.
   - If an amenity (e.g. parking, furnished) is null/missing or false, say: "Xogta aan hayo kama muuqato" (Somali) or "Not specified in verified records" (English).
2. TONE & VOCABULARY:
   - Warm, natural, native Somali or English (matching the user's language).
   - Never sound robotic like "Intent detected" or "LOCATION REQUIRED".
   - For missing rental city, ask: "Magaaladee ayaad rabtaa inaad ka kireysato?"
   - For missing sale city, ask: "Magaaladee ayaad rabtaa inaad ka iibsato?"
   - Keep answers conversational and concise (1 to 3 sentences).`;

      const promptData = {
        userMessage: input.userMessage,
        language: input.language,
        intent: input.intent,
        verifiedProperties: input.verifiedProperties.map((p) => ({
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
          status: p.status,
          description: p.description,
        })),
        referencedProperty: input.referencedProperty
          ? {
              rank: input.referencedProperty.rank,
              id: input.referencedProperty.id,
              title: input.referencedProperty.title,
              price: input.referencedProperty.price,
              city: input.referencedProperty.city,
              bedrooms: input.referencedProperty.bedrooms,
              bathrooms: input.referencedProperty.bathrooms,
              furnished: input.referencedProperty.furnished,
              parking: input.referencedProperty.parking,
              status: input.referencedProperty.status,
            }
          : null,
        attributeAnswer: input.attributeAnswer || null,
        contextSlots: input.contextSlots,
        lastAssistantMessage: input.lastAssistantMessage || null,
        clarificationQuestion: input.clarificationQuestion || null,
      };

      const response = await client.chat.completions.create(
        {
          model: this.model,
          temperature: OPENAI_CONFIG.GENERATION_TEMPERATURE,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Generate grounded AIDA reply for:\n${JSON.stringify(
                promptData,
                null,
                2
              )}`,
            },
          ],
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      const replyText = response.choices[0]?.message?.content?.trim() || "";

      return {
        provider: this.id,
        model: this.model,
        latencyMs,
        replyText,
        success: replyText.length > 0,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      const isTimeout = err?.name === "AbortError" || controller.signal.aborted;
      const errorMsg = isTimeout
        ? `OpenAI generation timed out after ${OPENAI_CONFIG.GENERATION_TIMEOUT_MS}ms`
        : err?.message || "Unknown OpenAI error";

      return {
        provider: this.id,
        model: this.model,
        latencyMs,
        replyText: "",
        success: false,
        error: errorMsg,
      };
    }
  }

  private buildFallbackUnderstanding(
    input: AIUnderstandingInput
  ): AIStructuredUnderstanding {
    return {
      intent: "REAL_ESTATE_SEARCH",
      confidence: 0.0,
      language: input.preferredLanguage || "so",
      domain: "REAL_ESTATE",
      entities: {
        city: null,
        district: null,
        propertyType: null,
        listingType: null,
        bedrooms: null,
        bathrooms: null,
        budget: null,
        currency: null,
        furnished: null,
        parking: null,
      },
      reference: null,
      requestedAttribute: null,
      correction: null,
      pendingSlotAnswer: null,
      needsClarification: false,
      clarificationReason: null,
    };
  }
}

export const openAIProvider = new OpenAIProvider();
