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
import {
  GeminiConversationalTurnInput,
  GeminiConversationalDecision,
  GeminiContextUpdates,
  GeminiPropertySearchArgs,
} from "./gemini-provider";

export const OPENAI_PROPERTY_SEARCH_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "search_properties",
    description:
      "Search verified Kiro-Maal property listings in the database. Use this tool when verified property inventory is needed to answer the user's request. Do not invent property information.",
    parameters: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "City to search in, e.g. Mogadishu, Hargeisa, Kismayo.",
        },
        district: {
          type: "string",
          description: "Specific neighborhood or district, e.g. Wadajir, Hodan, Waberi.",
        },
        purpose: {
          type: "string",
          enum: ["RENT", "SALE"],
          description: "Listing purpose: 'RENT' or 'SALE'.",
        },
        propertyType: {
          type: "string",
          enum: ["APARTMENT", "HOUSE", "VILLA", "COMMERCIAL", "LAND"],
          description: "Property type: APARTMENT, HOUSE, VILLA, COMMERCIAL, or LAND.",
        },
        minPrice: {
          type: "number",
          description: "Minimum price or budget in USD.",
        },
        maxPrice: {
          type: "number",
          description: "Maximum budget or price in USD.",
        },
        preferredBedrooms: {
          type: "array",
          items: {
            type: "number",
          },
          description: "Preferred or acceptable bedroom counts, e.g. [3, 2].",
        },
        excludedLocations: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Districts or areas explicitly rejected or excluded by the user (e.g. ['Hodan']).",
        },
        proximity: {
          type: "string",
          description: "Workplace or landmark proximity preference (e.g. KM4).",
        },
        prioritizeBest: {
          type: "boolean",
          description: "True if user asked for the best matching property for their budget and preferences.",
        },
      },
    },
  },
};

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

  public setMockClient(mockClient: any): void {
    this.client = mockClient;
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

  /**
   * OpenAI Conversational Action & Tool-Decision Authority (Secondary Fallback)
   *
   * When Gemini 3.8 Flash is unavailable, OpenAI GPT-6 Luna serves as the reliable fallback,
   * receiving the exact same context (slots, recent history, active properties) and evaluating
   * whether to invoke `search_properties` tool or respond directly with text.
   */
  public async decideConversationalAction(
    input: GeminiConversationalTurnInput
  ): Promise<GeminiConversationalDecision> {
    const startTime = Date.now();
    const client = this.getClient();

    if (!client) {
      return {
        type: "TEXT_RESPONSE",
        replyText: "",
        latencyMs: 0,
        model: this.model,
        success: false,
        error: "OPENAI_API_KEY_NOT_CONFIGURED",
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, OPENAI_CONFIG.CHAT_TIMEOUT_MS);

    try {
      const systemPrompt = `You are OpenAI GPT-6 Luna, serving as AIDA — the conversational AI Real Estate Assistant for Kiro-Maal in Somalia.

CORE CONVERSATIONAL BEHAVIOR & AUTHORITY:
1. You are the conversational and natural language understanding authority when acting as AIDA.
2. Converse warmly, professionally, and politely in Somali, English, or Arabic.
3. You natively understand:
   - Natural, colloquial, and imperfect Somali (e.g. "kirro", "dabaq", "qolal jiif", "reer").
   - Code-switching and mixed languages (e.g. "3 bedroom apartment oo furnished ah").
   - Negations: "Hodan ma rabo" means Hodan is EXCLUDED/REJECTED.
   - Corrections: "Maya, Wadajir ayaan rabaa" updates the preferred location to Wadajir.
   - Soft preferences: "3 qol haddii la helo waa fiican tahay laakiin khasab ma aha" means 3 bedrooms is preferred, but 2 is acceptable.
   - Workplace proximity: "KM4 ayaan ka shaqeeyaa" is proximity context.
   - Short answers: "$400", "3 qol", "Hodan".
   - Questions about previously returned properties (e.g. "Kan labaad ma furnished baa?", "Parking ma leeyahay?").
4. TOOLS:
   - You have the tool: 'search_properties'.
   - CALL 'search_properties' ONLY when the user explicitly requests to search, find, or view properties (e.g. "ii raadi kan ugu fiican", "find properties", "keen guryo", "waxaan rabaa guri...").
   - DO NOT call any tool for greetings, general conversation, advice questions, expressing preferences, budget statements, or inquiries about already displayed properties. Answer those with natural conversational text!
5. When responding with text, if the user mentioned new criteria, preferences, or constraints during this turn, or if answering an inquiry about a property, append a JSON block at the very end:
\`\`\`context
{"city":"...","district":"...","maxPrice":...,"minPrice":...,"bedrooms":...,"propertyType":"...","purpose":"...","excludedLocations":[...],"softPreferences":[...],"responseType":"GREETING|ADVICE|REQUIREMENT_UPDATE|PROPERTY_DETAIL|GENERAL_CONVERSATION"}
\`\`\`
6. STRICT TRUTH: Never invent properties, prices, or listings.`;

      const historyMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = (input.conversationHistory || []).slice(-16).map((h) => ({
        role: h.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: h.content,
      }));

      let promptText = input.userMessage;
      const ctx: string[] = [];
      if (input.contextSlots && Object.keys(input.contextSlots).length > 0) {
        if (input.contextSlots.city) ctx.push(`City: ${input.contextSlots.city}`);
        if (input.contextSlots.district) ctx.push(`District: ${input.contextSlots.district}`);
        if (input.contextSlots.maxPrice) ctx.push(`Budget: $${input.contextSlots.maxPrice}`);
        if (input.contextSlots.purpose) ctx.push(`Purpose: ${input.contextSlots.purpose}`);
        if (input.contextSlots.propertyType) ctx.push(`Type: ${input.contextSlots.propertyType}`);
        if (input.contextSlots.bedrooms) ctx.push(`Bedrooms: ${input.contextSlots.bedrooms}`);
        if (input.contextSlots.excludedLocations && input.contextSlots.excludedLocations.length > 0) {
          ctx.push(`Excluded: ${input.contextSlots.excludedLocations.join(", ")}`);
        }
        if (input.contextSlots.softPreferences && input.contextSlots.softPreferences.length > 0) {
          ctx.push(`Soft Preferences: ${input.contextSlots.softPreferences.join(", ")}`);
        }
        if (input.contextSlots.userReasoning && input.contextSlots.userReasoning.length > 0) {
          ctx.push(`Reasoning/Workplace: ${input.contextSlots.userReasoning.join(", ")}`);
        }
      }
      if (input.activeResultSet && input.activeResultSet.length > 0) {
        const propSummaries = input.activeResultSet.slice(0, 5).map((p, idx) =>
          `#${p.rank || idx + 1} ID:${p.id} ${p.title} (${p.city || ''}${p.location ? ', ' + p.location : ''}) $${p.price} | Beds:${p.bedrooms ?? 'N/A'} | Furnished:${p.furnished === true ? 'Yes' : p.furnished === false ? 'No' : 'Unknown'} | Parking:${p.parking === true ? 'Yes' : p.parking === false ? 'No' : 'Unknown'}`
        ).join("; ");
        ctx.push(`Active Properties: [${propSummaries}]`);
      }

      if (ctx.length > 0) {
        promptText = `[KNOWN CONVERSATION CONTEXT: ${ctx.join(" | ")}]\nUser Message: ${input.userMessage}`;
      }

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: promptText },
      ];

      const response = await client.chat.completions.create(
        {
          model: this.model,
          temperature: 0.2,
          messages,
          tools: [OPENAI_PROPERTY_SEARCH_TOOL],
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      const choice = response.choices[0];
      const toolCalls = choice?.message?.tool_calls;

      if (
        toolCalls &&
        toolCalls.length > 0 &&
        toolCalls[0].type === "function" &&
        toolCalls[0].function?.name === "search_properties"
      ) {
        let parsedArgs: any = {};
        try {
          parsedArgs = JSON.parse(toolCalls[0].function.arguments || "{}");
        } catch {
          parsedArgs = {};
        }
        return {
          type: "TOOL_CALL",
          toolCall: {
            name: "search_properties",
            args: parsedArgs as GeminiPropertySearchArgs,
          },
          latencyMs,
          model: this.model,
          success: true,
        };
      }

      let rawReply = choice?.message?.content?.trim() || "";
      let contextUpdates: GeminiContextUpdates | undefined = undefined;

      const contextMatch = rawReply.match(/```context\s*([\s\S]*?)\s*```/i) || rawReply.match(/\[CONTEXT_UPDATE:\s*([\s\S]*?)\]/i);
      if (contextMatch) {
        try {
          contextUpdates = JSON.parse(contextMatch[1]);
          rawReply = rawReply.replace(contextMatch[0], "").trim();
        } catch {
          // ignore parsing error
        }
      }

      return {
        type: "TEXT_RESPONSE",
        replyText: rawReply,
        contextUpdates,
        latencyMs,
        model: this.model,
        success: rawReply.length > 0,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      const isTimeout = err?.name === "AbortError" || controller.signal.aborted;
      const errorMsg = isTimeout
        ? `OpenAI tool decision timed out after ${OPENAI_CONFIG.CHAT_TIMEOUT_MS}ms`
        : err?.message || "Unknown OpenAI error";

      return {
        type: "TEXT_RESPONSE",
        replyText: "",
        contextUpdates: undefined,
        latencyMs,
        model: this.model,
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
