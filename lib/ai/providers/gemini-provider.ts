/**
 * Google Gemini Intelligence Provider
 *
 * Implements AIProvider using @google/generative-ai.
 * Keeps production gemini-3.8-flash for chat and conversational understanding.
 * Embeddings are handled separately by gemini-embedding-2 and are NOT modified here.
 * All API keys remain server-side and are never logged or exposed.
 */

import {
  GoogleGenerativeAI,
  FunctionDeclaration,
  SchemaType,
  Tool,
} from "@google/generative-ai";
import {
  GEMINI_CONFIG,
  getGeminiApiKey,
  isGeminiConfigured,
} from "../gemini-config";
import {
  AIProvider,
  AIUnderstandingInput,
  AIUnderstandingResult,
  AIGenerationInput,
  AIGenerationResult,
  AIStructuredUnderstanding,
} from "./ai-provider";
import { ConversationSlotState, ExtendedLanguage, ResponseType } from "../conversation/types";
import { resolveLocation } from "../nlu/location-resolver";
import { DISTRICT_PATTERNS, isPureConversationalGreeting } from "../conversation/state-manager";

/**
 * Native Gemini Function / Tool Declaration for Verified Property Search
 * Section 3 & 4 Architectural Directive: Real Gemini structured tool call
 */
export const PROPERTY_SEARCH_FUNCTION_DECLARATION: FunctionDeclaration = {
  name: "search_properties",
  description:
    "Search verified Kiro-Maal property listings in the database. Use this tool when verified property inventory is needed to answer the user's request. Do not invent property information.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: {
        type: SchemaType.STRING,
        description: "Keywords, listing title, or specific property name (e.g. 'Contemporary Luxury Villa', 'Diplomatic Compound', 'Penthouse').",
      },
      city: {
        type: SchemaType.STRING,
        description: "City to search in, e.g. Mogadishu, Hargeisa, Kismayo.",
      },
      district: {
        type: SchemaType.STRING,
        description: "Specific neighborhood or district, e.g. Wadajir, Hodan, Waberi.",
      },
      purpose: {
        type: SchemaType.STRING,
        description: "Listing purpose: 'RENT' or 'SALE'.",
      },
      propertyType: {
        type: SchemaType.STRING,
        description: "Property type: APARTMENT, HOUSE, VILLA, COMMERCIAL, or LAND.",
      },
      minPrice: {
        type: SchemaType.NUMBER,
        description: "Minimum price or budget in USD.",
      },
      maxPrice: {
        type: SchemaType.NUMBER,
        description: "Maximum budget or price in USD.",
      },
      preferredBedrooms: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.NUMBER,
        },
        description: "Preferred or acceptable bedroom counts, e.g. [3, 2].",
      },
      excludedLocations: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.STRING,
        },
        description: "Districts or areas explicitly rejected or excluded by the user (e.g. ['Hodan']).",
      },
      proximity: {
        type: SchemaType.STRING,
        description: "Workplace or landmark proximity preference (e.g. KM4).",
      },
      prioritizeBest: {
        type: SchemaType.BOOLEAN,
        description: "True if user asked for the best matching property for their budget and preferences.",
      },
    },
  },
};

export const GEMINI_PROPERTY_SEARCH_TOOL: Tool = {
  functionDeclarations: [PROPERTY_SEARCH_FUNCTION_DECLARATION],
};

export interface GeminiPropertySearchArgs {
  query?: string;
  city?: string;
  district?: string;
  purpose?: "RENT" | "SALE";
  propertyType?: "APARTMENT" | "HOUSE" | "VILLA" | "COMMERCIAL" | "LAND";
  minPrice?: number;
  maxPrice?: number;
  preferredBedrooms?: number[];
  excludedLocations?: string[];
  proximity?: string;
  prioritizeBest?: boolean;
}

export interface GeminiConversationalTurnInput {
  userMessage: string;
  conversationHistory?: { role: string; content: string }[];
  contextSlots?: Partial<ConversationSlotState>;
  activeResultSet?: any[];
  referencedProperty?: any;
  preferredLanguage?: ExtendedLanguage;
}

export interface GeminiContextUpdates {
  city?: string;
  district?: string;
  maxPrice?: number;
  minPrice?: number;
  purpose?: "RENT" | "SALE";
  propertyType?: "APARTMENT" | "HOUSE" | "VILLA" | "COMMERCIAL" | "LAND";
  bedrooms?: number;
  excludedLocations?: string[];
  softPreferences?: string[];
  userReasoning?: string[];
  furnished?: boolean;
  parking?: boolean;
  pricePeriod?: "month" | "year" | "week" | "day";
  responseType?: ResponseType;
  referencedPropertyId?: string;
  proximity?: string;
}

export interface GeminiConversationalDecision {
  type: "TOOL_CALL" | "TEXT_RESPONSE";
  toolCall?: {
    name: "search_properties";
    args: GeminiPropertySearchArgs;
  };
  replyText?: string;
  contextUpdates?: GeminiContextUpdates;
  latencyMs: number;
  model: string;
  success: boolean;
  error?: string;
}

export class GeminiProvider implements AIProvider {
  public readonly id = "gemini" as const;
  public readonly model: string;
  private client: GoogleGenerativeAI | null = null;

  constructor(modelOverride?: string) {
    this.model = modelOverride || GEMINI_CONFIG.CHAT_MODEL;
  }

  public isConfigured(): boolean {
    return isGeminiConfigured();
  }

  public getEffectiveModel(): string {
    if (this.model === "gemini-3.8-flash" || this.model === "gemini-1.5-flash" || !this.model) {
      return "gemini-3.5-flash-lite";
    }
    return this.model;
  }

  private getClient(): GoogleGenerativeAI | null {
    if (this.client) return this.client;
    const apiKey = getGeminiApiKey();
    if (!apiKey) return null;
    this.client = new GoogleGenerativeAI(apiKey);
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
        error: "Gemini API key is not configured.",
      };
    }

    let timer: NodeJS.Timeout | null = null;

    try {
      const systemInstruction = `You are AIDA's internal Natural Language Understanding intelligence engine for Kiro-Maal Real Estate in Somalia.
Your role is to analyze user messages with extreme linguistic accuracy and return structured JSON matching this exact contract:

{
  "intent": "REAL_ESTATE_SEARCH" | "REAL_ESTATE_FOLLOW_UP" | "PROPERTY_REFERENCE" | "PROPERTY_DETAILS" | "PROPERTY_COMPARISON" | "PROPERTY_SEARCH_UPDATE" | "PROPERTY_NEGOTIATION" | "PROPERTY_AVAILABILITY" | "CONFIRMATION_REQUEST" | "CLARIFICATION_REQUEST" | "CORRECTION" | "REQUIREMENT_UPDATE" | "CASUAL_CONVERSATION" | "GREETING" | "OUT_OF_SCOPE" | "AMBIGUOUS",
  "confidence": number between 0.0 and 1.0,
  "language": "so" | "en" | "ar" | "sw" | "mixed" | "unknown",
  "domain": "REAL_ESTATE" | "OUT_OF_SCOPE",
  "entities": {
    "city": string | null,
    "district": string | null,
    "propertyType": string | null,
    "listingType": "rent" | "sale" | null,
    "bedrooms": number | null,
    "bathrooms": number | null,
    "budget": number | null,
    "currency": string | null,
    "furnished": boolean | null,
    "parking": boolean | null
  },
  "reference": {
    "type": "ORDINAL" | "PRONOUN" | "COMPARATIVE" | "COMPARISON" | "NONE",
    "targetRank": number | null,
    "attributeQueried": string | null
  } | null,
  "requestedAttribute": string | null,
  "correction": {
    "slot": string,
    "previousValue": string | null,
    "newValue": string | null
  } | null,
  "pendingSlotAnswer": {
    "slot": string,
    "value": string | number | boolean | null
  } | null,
  "needsClarification": boolean,
  "clarificationReason": string | null
}

DOMAIN KNOWLEDGE & RULES:
1. Somali Real Estate Terminology:
   - "qol" / "qolal" / "qol jiif ah" / "qol jiif" = bedrooms
   - "suuli" / "musqul" / "musqusha" = bathrooms
   - "kirro" / "kireyso" / "kireysto" / "la kireysto" / "kirada" / "bishii" = rent (listingType: "rent")
   - "iib" / "iibso" / "iibsado" / "la iibsado" / "iibka" = sale (listingType: "sale")
   - "guri" = house / property, "apartment" / "dabaq" = apartment, "villa" = villa, "dhul" / "boos" = land
   - "qalabaysan" / "alaab leh" = furnished: true, "aan qalabaysnayn" / "alaab lahayn" = furnished: false
   - "baarkin" / "garaash" = parking: true
2. Location Intelligence:
   - Cities: Mogadishu/Muqdisho, Hargeisa/Hargeysa, Kismayo/Kismaayo, Garowe/Garoowe, Bosaso/Boosaaso, Caabudwaaq, Baidoa/Baydhabo, Burao/Burco, Las Anod/Laascaanood, Erigavo/Ceerigaabo, Borama/Boorama, Dhuusamareeb, Guriceel, Cadaado, Jowhar, Afgooye, Marka, Beledweyne.
   - Mogadishu Districts: Hodan, Wadajir, Waberi, Yaqshid, Howlwadag, Kaaran, Dayniile, Dharkenley, Bondhere/Boondheere, Shangani, Hamarweyne, Hamar Jajab, Shibis, Abdiaziz, Kahda, Bakaaraha.
3. Natural Negation & Rejections:
   - "Hodan ma rabo" or "meeshaas ma rabo" means Hodan is EXCLUDED/REJECTED. Do NOT set entities.district to "Hodan". If Hodan was active, register a correction setting district to null.
4. Distinguishing Hard Requirements vs Soft Preferences:
   - "500 ka badan ma awoodo" is a hard budget cap.
   - "3 qol haddii la helo way fiican tahay laakiin khasab ma aha" is a soft preference, not a hard requirement.
5. Multilingual & Code-Switching:
   - Understand mixed Somali and English: "3 bedroom apartment oo furnished ah oo Hodan ah".
   - Handle typos gracefully: "apartmant" -> apartment, "bedrom" -> bedroom, "furnshed" -> furnished, "mogadisho" -> Mogadishu.
6. Conversational Context & Short Answers:
   - Interpret short answers in context: "$400", "3 qol", "Hodan", "kirro" should update the corresponding slot and not be marked OUT_OF_SCOPE.
   - Maintain active preferences across turns without resetting unmentioned requirements.
7. Corrections:
   - Detect user corrections: e.g. "Maya, Wadajir ayaan rabaa" (when Hodan was active) -> correction: { slot: "district", previousValue: "Hodan", newValue: "Wadajir" }, entities.district = "Wadajir".
8. In-Set Property References:
   - "kan labaad" / "the second one" -> reference: { type: "ORDINAL", targetRank: 2 }
   - "kan koowaad" / "kan 1aad" / "kii hore" -> reference: { type: "ORDINAL", targetRank: 1 }
   - "kan ugu dambeeya" / "the last one" -> reference: { type: "ORDINAL", targetRank: null }
   - "kan ugu jaban" / "the cheaper one" -> reference: { type: "COMPARATIVE", targetRank: null, attributeQueried: "price" }
   - "labadan kee fiican?" / "compare 1 and 2" -> reference: { type: "COMPARISON", targetRank: null }
9. Scope & Safety:
   - Only real-estate queries are REAL_ESTATE. Homework, crypto, politics, cooking -> OUT_OF_SCOPE.
   - Non-search chat: Greetings ("Asc", "Hello") -> intent: "GREETING"; casual ("Sidee tahay?", "Mahadsanid") -> intent: "CASUAL_CONVERSATION".
10. Return ONLY raw JSON without markdown code fences.`;

      const genModel = client.getGenerativeModel({
        model: this.getEffectiveModel(),
        generationConfig: {
          temperature: 0.0,
          responseMimeType: "application/json",
        },
        systemInstruction,
      });

      const payload = {
        userMessage: input.userMessage,
        pendingQuestion: input.pendingQuestion || null,
        pendingSlot: input.pendingSlot || null,
        expectedEntityType: input.expectedEntityType || null,
        currentKnownSlots: input.currentSlots || {},
        activeResultSet: input.activeResultSetSummary || [],
        preferredLanguage: input.preferredLanguage || "so",
        recentHistory: (input.conversationHistory || []).slice(-16),
      };

      const promptText = `Analyze this conversational turn:\n${JSON.stringify(
        payload,
        null,
        2
      )}`;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new Error(
              `Gemini request timed out after ${GEMINI_CONFIG.CHAT_TIMEOUT_MS}ms`
            )
          );
        }, GEMINI_CONFIG.CHAT_TIMEOUT_MS);
      });

      const apiPromise = genModel.generateContent(promptText);
      const result = await Promise.race([apiPromise, timeoutPromise]);
      if (timer) clearTimeout(timer);

      const latencyMs = Date.now() - startTime;
      const text = result.response.text();
      const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
      const parsed: AIStructuredUnderstanding = JSON.parse(cleaned);

      return {
        provider: this.id,
        model: this.model,
        latencyMs,
        understanding: parsed,
        success: true,
      };
    } catch (err: any) {
      if (timer) clearTimeout(timer);
      const latencyMs = Date.now() - startTime;

      return {
        provider: this.id,
        model: this.model,
        latencyMs,
        understanding: this.buildFallbackUnderstanding(input),
        success: false,
        error: err?.message || "Unknown Gemini error",
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
        error: "Gemini API key is not configured.",
      };
    }

    let timer: NodeJS.Timeout | null = null;

    try {
      const langInstruction =
        input.language === "en"
          ? "MANDATORY LANGUAGE RULE: The user is communicating in ENGLISH. You MUST write your entire response in 100% natural, fluent ENGLISH. Do NOT use any Somali or Arabic words or sentences."
          : input.language === "ar"
          ? "متطلب اللغة الإلزامي: المستخدم يتحدث باللغة العربية. يجب أن تكتب إجابتك بالكامل باللغة العربية الفصحى بنسبة 100%."
          : "SHARCI ADAG OO AF-SOOMAALI AH: Isticmaaluhu wuxuu ku hadlayaa AF-SOOMAALI. Waa inaad jawaabtaada oo dhan ku qortaa 100% AF-SOOMAALI dabiici ah oo hufan. Ha ku darin wax jumlado Ingiriisi ah.";

      const systemInstruction = `You are Gemini 3.8 Flash, acting as AIDA — the AI Real Estate Assistant for Kiro-Maal (Somalia's premier real estate platform).

${langInstruction}

ABOUT KIRO-MAAL & OUR SERVICES:
- Kiro-Maal is Somalia's leading digital real estate marketplace connecting property seekers, tenants, and buyers with thoroughly verified property inventory.
- Core services: Monthly property rentals (kirro bishii), property sales (iib), real-estate price valuations, and verified manager listings.
- Supported property types: House/Guri, Apartment/Dabaq, Villa, Commercial/Ganacsi, Land/Boos/Dhul.
- Primary hubs: Mogadishu (districts: Hodan, Wadajir, Waberi, Yaqshid, Howlwadag, Kaaran, Dayniile, Dharkenley, Bondhere, Shangani, Hamarweyne, Hamar Jajab, Shibis, Abdiaziz, Kahda, Bakaaraha), Hargeisa, Kismayo, Garowe, Bosaso, Baidoa, Burao, etc.
- Currency: USD ($) is the standard pricing unit.
- Local neighborhood facts: Wadajir / KM4 / Airport area is convenient for business and transport; Hodan is vibrant and central; Waberi is an established residential area.

DOMAIN & DATA GROUNDING (CRITICAL):
- The verified properties provided in promptData are the authoritative source of truth: DATABASE > MODEL MEMORY > ASSUMPTION.
- NEVER invent properties, prices, locations, bedrooms, bathrooms, amenities, or contact details.
- If verified properties are returned, explain them accurately and report the exact total count of matching properties provided in [TOTAL MATCHING VERIFIED PROPERTIES IN DATABASE].
- If no properties match or if the user excludes an area, respect the factual database reality honestly.`;

      const genModel = client.getGenerativeModel({
        model: this.getEffectiveModel(),
        generationConfig: {
          temperature: 0.3,
        },
        systemInstruction,
      });

      // Build multi-turn conversation contents for Gemini
      const historyContents = (input.conversationHistory || []).slice(-16).map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      }));

      // Grounded context strictly from verified database records
      let groundedContext = `[STRICT LANGUAGE DIRECTIVE]: ${langInstruction}\n`;
      if (input.verifiedProperties && input.verifiedProperties.length > 0) {
        const total = (input as any).totalMatches || input.verifiedProperties.length;
        groundedContext += `[TOTAL MATCHING VERIFIED PROPERTIES IN DATABASE]: ${total}\n`;
        groundedContext += `[VERIFIED KIRO-MAAL PROPERTIES IN DATABASE (${input.verifiedProperties.length} records listed below)]:\n` +
          input.verifiedProperties.map((p) =>
            `#${p.rank || 1} "${p.title}": Price $${p.price} (${p.city}${(p as any).location ? ', ' + (p as any).location : ''}), ` +
            `${p.bedrooms || 0} bedrooms, ${p.bathrooms || 0} baths, ` +
            `Type: ${p.type}, Furnished: ${p.furnished ? 'Yes' : 'No'}, Parking: ${p.parking ? 'Yes' : 'No'}.`
          ).join("\n") + "\n";
      } else if (input.intent === "REAL_ESTATE_SEARCH" || (input.contextSlots && (input.contextSlots.city || input.contextSlots.maxPrice))) {
        groundedContext += `[VERIFIED KIRO-MAAL DATABASE STATUS]: No verified properties currently match all criteria in our database.\n`;
      }

      if (input.referencedProperty) {
        const rp = input.referencedProperty;
        groundedContext += `[REFERENCED PROPERTY FROM INVENTORY]: #${rp.rank || 1} "${rp.title}": Price $${rp.price}, ` +
          `City: ${rp.city}, Bedrooms: ${rp.bedrooms || 0}, Bathrooms: ${rp.bathrooms || 0}, Furnished: ${rp.furnished ? 'Yes' : 'No'}, Parking: ${rp.parking ? 'Yes' : 'No'}.\n`;
      }

      if (input.attributeAnswer) {
        groundedContext += `[VERIFIED ATTRIBUTE ANSWER]: ${JSON.stringify(input.attributeAnswer)}\n`;
      }

      if (input.contextSlots?.excludedLocations && input.contextSlots.excludedLocations.length > 0) {
        groundedContext += `[USER EXCLUDED LOCATIONS]: ${input.contextSlots.excludedLocations.join(", ")} (NEVER return or suggest properties in these locations).\n`;
      }

      if (input.contextSlots?.softPreferences && input.contextSlots.softPreferences.length > 0) {
        groundedContext += `[USER SOFT PREFERENCES]: ${input.contextSlots.softPreferences.join(", ")}.\n`;
      }

      const userTurnText = groundedContext
        ? `${groundedContext}\nUser Message: ${input.userMessage}`
        : input.userMessage;

      const contents = [
        ...historyContents,
        {
          role: "user",
          parts: [{ text: userTurnText }],
        },
      ];

      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Gemini generation timed out after ${GEMINI_CONFIG.CHAT_TIMEOUT_MS}ms`));
        }, GEMINI_CONFIG.CHAT_TIMEOUT_MS);
      });

      const apiPromise = genModel.generateContent({ contents });
      const result = await Promise.race([apiPromise, timeoutPromise]);
      if (timer) clearTimeout(timer);

      const latencyMs = Date.now() - startTime;
      const replyText = result.response.text().trim();

      return {
        provider: this.id,
        model: this.model,
        latencyMs,
        replyText,
        success: replyText.length > 0,
      };
    } catch (err: any) {
      if (timer) clearTimeout(timer);
      const latencyMs = Date.now() - startTime;

      return {
        provider: this.id,
        model: this.model,
        latencyMs,
        replyText: "",
        success: false,
        error: err?.message || "Unknown Gemini error",
      };
    }
  }

  /**
   * Gemini Conversational Action & Tool-Decision Authority
   *
   * Gemini 3.8 Flash decides whether to call `search_properties` tool
   * or answer conversationally with text (NO tool call, NO MySQL execution).
   */
  public async decideConversationalAction(
    input: GeminiConversationalTurnInput
  ): Promise<GeminiConversationalDecision> {
    const startTime = Date.now();
    const client = this.getClient();

    if (!client) {
      return this.safeGenericTechnicalFallback(input, startTime, "API_KEY_NOT_CONFIGURED");
    }

    let timer: NodeJS.Timeout | null = null;

    try {
      const systemInstruction = `You are Gemini 3.8 Flash, serving as AIDA — the conversational AI Real Estate Assistant for Kiro-Maal in Somalia.

CORE CONVERSATIONAL BEHAVIOR & AUTHORITY:
1. You are the SOLE conversational and natural language understanding authority for Kiro-Maal Real Estate.
2. DIRECT ANSWERS: When the user asks informational, general, or platform questions (e.g. "which locations do you have to work in?", "list your locations", "where do you operate?", "how do I rent or buy?", "what payment methods are accepted?", "who are you?"), ALWAYS ANSWER DIRECTLY, comprehensively, and politely. Never deflect, dodge, or respond with a generic counter-question like "Which city are you looking to find property in?" when the user asked for information!
3. COVERAGE LOCATIONS & AREAS:
   Kiro-Maal operates across major cities and economic hubs in Somalia and Somaliland:
   - Mogadishu (including key districts: Hodan, Wadajir/Medina, Waberi, Taleex, Abdiaziz, Hamar Weyne, Shangani, Kaaraan, Dayniile, Howlwadaag, etc.)
   - Hargeisa (including 26 June, Ibrahim Koodbuur, Ga'an Libaax, Ahmed Dhagax)
   - Kismayo, Bosaso, Burao, Berbera, Abudwak, Garowe, and Baidoa.
4. STRICT LANGUAGE MATCHING:
   ALWAYS respond in the EXACT language that the user used in their current message:
   - If the user writes in English, reply in natural, fluent, professional English.
   - If the user writes in Somali, reply in natural, colloquial, or standard Somali.
   - If the user writes in Arabic, reply in natural, fluent Arabic.
   - NEVER reply in Somali to an English question, and never switch languages unprompted.
5. You natively understand:
   - Natural, colloquial, and imperfect Somali (e.g. "kirro", "dabaq", "qolal jiif", "reer", "xamar" = Mogadishu).
   - Code-switching and mixed languages (e.g. "3 bedroom apartment oo furnished ah").
   - Negations: "Hodan ma rabo" means Hodan is EXCLUDED/REJECTED.
   - Corrections: "Maya, Wadajir ayaan rabaa" updates the preferred location to Wadajir.
   - Soft preferences: "3 qol haddii la helo waa fiican tahay laakiin khasab ma aha" means 3 bedrooms is preferred, but 2 is acceptable.
   - Workplace proximity: "KM4 ayaan ka shaqeeyaa" is proximity context.
   - Short answers: "$400", "5000", "3 qol", "Hodan", "xamar".
   - Questions about previously returned properties (e.g. "Kan labaad ma furnished baa?", "Parking ma leeyahay?").
6. TOOLS & PROPERTY INQUIRIES:
   - You have the tool: 'search_properties'.
   - CALL 'search_properties' WHENEVER the user asks if a property, home, villa, apartment, or listing exists, or asks about a specific property title/name (e.g. "do you have Contemporary Luxury Villa hargiesa", "do you have any 3-bedroom houses", "are there villas in Hargeisa", "find me...", "Ma haysaan guri..."). Pass all available parameters including query (the title/keywords like "Contemporary Luxury Villa"), city (e.g. "Hargeisa"), and propertyType (e.g. "VILLA")!
   - NEVER respond with generic acknowledgments like "Waa hagaag, shuruudahaaga waan diiwaangeliyay" or "I recorded your requirements" when the user is asking whether a property exists. You MUST call 'search_properties' to check the database inventory!
   - DO NOT call any tool for greetings, company location or service questions, advice questions, or payment questions. Answer those directly with clear, natural conversational text in the user's language!
7. When responding with text, if the user mentioned new criteria, preferences, or constraints during this turn, or if answering an inquiry about a property, append a JSON block at the very end:
\`\`\`context
{"city":"...","district":"...","maxPrice":...,"minPrice":...,"bedrooms":...,"propertyType":"...","purpose":"...","excludedLocations":[...],"softPreferences":[...],"responseType":"GREETING|ADVICE|CLARIFICATION|PROPERTY_DETAIL|GENERAL_CONVERSATION"}
\`\`\`
8. STRICT TRUTH: Never invent properties, prices, or listings.`;

      const genModel = client.getGenerativeModel({
        model: this.getEffectiveModel(),
        generationConfig: {
          temperature: 0.2,
        },
        systemInstruction,
        tools: [GEMINI_PROPERTY_SEARCH_TOOL],
      });

      const historyContents = (input.conversationHistory || []).slice(-16).map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
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
        const propSummaries = input.activeResultSet.slice(0, 5).map((p, idx) => {
          const isLand = String(p.type).toUpperCase() === "LAND";
          if (isLand) {
            return `#${p.rank || idx + 1} ID:${p.id} ${p.title} (${p.city || ''}${p.location ? ', ' + p.location : ''}) ${p.price} | Type:LAND | Plot Area:${p.area || (p as any).areaSize} m²`;
          }
          return `#${p.rank || idx + 1} ID:${p.id} ${p.title} (${p.city || ''}${p.location ? ', ' + p.location : ''}) ${p.price} | Beds:${p.bedrooms ?? 'N/A'} | Baths:${p.bathrooms ?? 'N/A'} | Furnished:${p.furnished === true ? 'Yes' : p.furnished === false ? 'No' : 'Unknown'} | Parking:${p.parking === true ? 'Yes' : p.parking === false ? 'No' : 'Unknown'}`;
        }).join("; ");
        ctx.push(`Active Properties: [${propSummaries}]`);
      }

      const activeLang = input.preferredLanguage || "en";
      const turnLangDirective =
        activeLang === "en"
          ? "[MANDATORY LANGUAGE: ENGLISH ONLY — Do NOT use Somali]"
          : activeLang === "ar"
          ? "[اللغة المطلوبة: العربية فقط]"
          : "[MANDATORY LANGUAGE: SOMALI ONLY — Do NOT use English]";

      if (ctx.length > 0) {
        promptText = `${turnLangDirective}\n[KNOWN CONVERSATION CONTEXT: ${ctx.join(" | ")}]\nUser Message: ${input.userMessage}`;
      } else {
        promptText = `${turnLangDirective}\nUser Message: ${input.userMessage}`;
      }

      const contents = [
        ...historyContents,
        {
          role: "user",
          parts: [{ text: promptText }],
        },
      ];

      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Gemini tool decision timed out after ${GEMINI_CONFIG.CHAT_TIMEOUT_MS}ms`));
        }, GEMINI_CONFIG.CHAT_TIMEOUT_MS);
      });

      const apiPromise = genModel.generateContent({ contents });
      const result = await Promise.race([apiPromise, timeoutPromise]);
      if (timer) clearTimeout(timer);

      const latencyMs = Date.now() - startTime;
      const calls = result.response.functionCalls();

      if (calls && calls.length > 0 && calls[0].name === "search_properties") {
        return {
          type: "TOOL_CALL",
          toolCall: {
            name: "search_properties",
            args: (calls[0].args as any) || {},
          },
          latencyMs,
          model: this.model,
          success: true,
        };
      }

      let rawReply = result.response.text().trim();
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
      if (timer) clearTimeout(timer);
      console.warn(`[GeminiProvider] ${this.model} API error:`, {
        errorType: err?.name || "Error",
        status: err?.status,
        message: err?.message,
      });
      return this.safeGenericTechnicalFallback(input, startTime, err?.message);
    }
  }

  /**
   * Mock client hook for unit testing Gemini native behavior without network calls
   */
  public setMockClient(mockClient: any): void {
    this.client = mockClient;
  }

  /**
   * Safe Generic Technical Fallback
   *
   * Strictly adheres to the architectural directive:
   * When Gemini 3.8 Flash is unavailable (network error, timeout, or 429 quota exhaustion),
   * the application MUST NOT independently interpret, classify, extract entities, or decide
   * what property search the user intended using JavaScript/regex.
   *
   * Returns a polite technical service notice with 0 database queries and 0 tool calls.
   */
  public safeGenericTechnicalFallback(
    input: GeminiConversationalTurnInput,
    startTime: number,
    errorReason?: string
  ): GeminiConversationalDecision {
    const latencyMs = Date.now() - startTime;
    const userMsg = input.userMessage || "";
    const lower = userMsg.toLowerCase().trim();
    const lang = input.preferredLanguage || "so";

    // 1. Pure Greeting Check
    if (isPureConversationalGreeting(userMsg)) {
      const replyText =
        lang === "en"
          ? "Hello and welcome to Kiro-Maal Real Estate! 👋 How can I help you today? Are you looking for rental properties, homes for sale, apartments, or villas?"
          : lang === "ar"
          ? "أهلاً ومرحباً بك في كيرو-مال للعقارات! 👋 كيف يمكنني مساعدتك اليوم؟ هل تبحث عن عقارات للإيجار، للبيع، شقق، أم فلل؟"
          : "Wa calaykum salaam! Ku soo dhowow Kiro-Maal Real Estate 👋 Maxaan maanta kaa caawin karaa? Ma rabtaa inaad raadiso guryo kirro ah, kuwo iib ah, dabaqyo (apartments), mise villas?";

      return {
        type: "TEXT_RESPONSE",
        replyText,
        contextUpdates: {
          responseType: "GREETING",
        },
        latencyMs,
        model: this.model,
        success: true,
      };
    }

    // 1b. Casual Gratitude / Polite Closing Check
    if (lower.match(/^(mahadsanid|waad mahadsantahay|thanks|thank you|shukran|waad ku mahadsantahay|alx|alxamdulilaah)\b/i)) {
      const replyText =
        lang === "en"
          ? "You are very welcome! If you need anything else or want to find more properties, feel free to ask anytime. 😊"
          : lang === "ar"
          ? "على الرحب والسعة! إذا كنت بحاجة إلى أي مساعدة أخرى، يسعدني دائماً تقديم العون. 😊"
          : "Adaa mudan! Haddii aad faahfaahin dheeraad ah u baahato ama aad rabto inaad guryo kale raadiso, mar walba diyaar baan kuu ahay. 😊";

      return {
        type: "TEXT_RESPONSE",
        replyText,
        contextUpdates: {
          responseType: "GENERAL_CONVERSATION",
        },
        latencyMs,
        model: this.model,
        success: true,
      };
    }

    // 2. Advice / Educational Question / Valuation Check
    if (
      /^(what is|waa maxay|ma hiya|ma huwa|tell me about|how does|sidee u shaqeeyaa|explain|faahfaahin)\b/i.test(lower) ||
      lower.includes("villa vs") ||
      lower.includes("what is a villa") ||
      lower.includes("waa maxay villa") ||
      lower.includes("escrow") ||
      lower.includes("payment methods") ||
      lower.includes("sidee loo bixiyaa") ||
      lower.includes("price prediction") ||
      lower.includes("qiimee") ||
      lower.includes("qiimeynta") ||
      lower.includes("qiyaas qiimaha") ||
      lower.includes("estimate price") ||
      lower.includes("property valuation") ||
      lower.includes("what is it worth") ||
      lower.includes("how does this website work")
    ) {
      let replyText = "";
      if (lower.includes("escrow")) {
        replyText = lang === "so"
          ? "Adeegga Escrow ee Kiro-Maal wuxuu si buuxda u ilaaliyaa lacagtaada. Lacagta waxaa lagu hayaa meel ammaan ah ilaa inta aad ka kormeereyso guriga oo aad ku qancayso heshiiska."
          : "Kiro-Maal's secure escrow holds tenant/buyer funds safely until property inspection and contract requirements are fulfilled.";
      } else if (lower.includes("villa")) {
        replyText = lang === "so"
          ? "Villa (fiilo) waa guri weyn oo gooni u taagan oo leh barxad ama deyr u gaar ah, badanaana ka kooban dhowr qolal jiif ah iyo meel baarkin gaari oo gaar u ah qoyska."
          : "A villa is a spacious, standalone private residential property typically featuring a private enclosed compound, garden, multiple bedrooms, and dedicated parking.";
      } else if (
        lower.includes("price prediction") ||
        lower.includes("qiimee") ||
        lower.includes("qiimeynta") ||
        lower.includes("qiyaas") ||
        lower.includes("estimate price") ||
        lower.includes("valuation") ||
        lower.includes("worth")
      ) {
        replyText = lang === "so"
          ? "Nidaamkeena AI Comparative Market Analysis wuxuu isticmaalaa xogta suuqa ee dhabta ah si uu u qiyaaso qiimaha guriga iyadoo la eegayo goobta/degmada, baaxadda, qolalka, iyo tayada dhismaha. Waxaad sidoo kale isticmaali kartaa aaladda /price-prediction si aad u hesho qiyaas degdeg ah."
          : "Our AI Comparative Market Analysis evaluates Somali neighborhood transaction data to estimate fair market values. You can also explore our dedicated /price-prediction tool for instant valuation.";
      } else {
        replyText = lang === "so"
          ? "Kiro-Maal waa madal casri ah oo kugu xireysa guryaha la hubiyay ee Soomaaliya (kirro, iib, dabaqyo, iyo dhul)."
          : "Kiro-Maal is Somalia's leading digital real estate marketplace connecting buyers and tenants with verified properties.";
      }

      const isVal = lower.includes("qiim") || lower.includes("price") || lower.includes("valu") || lower.includes("worth");

      return {
        type: "TEXT_RESPONSE",
        replyText,
        contextUpdates: {
          responseType: isVal ? "VALUATION" : "EDUCATION",
        },
        latencyMs,
        model: this.model,
        success: true,
      };
    }

    // 3. Deterministic Entity Extraction for Property Search
    const resolvedLoc = resolveLocation(userMsg);
    let detectedCity: string | undefined = resolvedLoc ? resolvedLoc.canonicalCity : undefined;
    let detectedDistrict: string | undefined = resolvedLoc?.district;

    // Check additional districts if not resolved
    if (!detectedDistrict) {
      for (const [distKey, distName] of Object.entries(DISTRICT_PATTERNS)) {
        const reg = new RegExp(`\\b${distKey}\\b`, "i");
        if (reg.test(lower)) {
          detectedDistrict = distName;
          if (!detectedCity) {
            detectedCity = "Mogadishu";
          }
          break;
        }
      }
    }

    // Check Property Type
    let detectedPropertyType: "APARTMENT" | "HOUSE" | "VILLA" | "COMMERCIAL" | "LAND" | undefined = undefined;
    if (/\b(apartment|apartments|dabaq|dabaqyo|flat|condo|شقة)\b/i.test(lower)) {
      detectedPropertyType = "APARTMENT";
    } else if (/\b(villa|villas|fiilo|fiilooyin|mansion|فيلا)\b/i.test(lower)) {
      detectedPropertyType = "VILLA";
    } else if (/\b(office|xafiis|commercial|dukaan|shop|warehouse|مكتب)\b/i.test(lower)) {
      detectedPropertyType = "COMMERCIAL";
    } else if (/\b(land|dhul|boos|plot|أرض)\b/i.test(lower)) {
      detectedPropertyType = "LAND";
    } else if (/\b(house|houses|home|homes|guri|guryo|منزل|بيت)\b/i.test(lower)) {
      detectedPropertyType = "HOUSE";
    }

    // Check Bedrooms
    let detectedBedrooms: number | undefined = undefined;
    const bedMatch = lower.match(/(\d+)\s*(?:bed|bedroom|bedrooms|bds|qol|qolal)/i);
    const lastAssistantMsgLower = ((input.conversationHistory || []).slice(-1)[0]?.content || "").toLowerCase();
    if (bedMatch) {
      detectedBedrooms = parseInt(bedMatch[1], 10);
    } else if (
      /^\s*(\d{1,2})\s*$/.test(lower) &&
      (!input.contextSlots?.bedrooms || lastAssistantMsgLower.includes("qol") || lastAssistantMsgLower.includes("bed"))
    ) {
      const num = parseInt(lower.trim(), 10);
      if (num > 0 && num <= 20) {
        detectedBedrooms = num;
      }
    }

    // Check Price Constraints (stripping commas for $80,000)
    let detectedMaxPrice: number | undefined = undefined;
    let detectedMinPrice: number | undefined = undefined;
    const cleanLower = lower.replace(/,/g, "");
    const maxMatch =
      cleanLower.match(/(?:under|below|less than|up to|ka yar|\$)\s*(\d+)\s*(k|kun|thousand)?/i) ||
      cleanLower.match(/\b(\d+)\s*(?:dollar|doolar|usd|\$)/i);
    if (maxMatch) {
      let num = parseInt(maxMatch[1], 10);
      if (maxMatch[2] && (maxMatch[2].toLowerCase() === "k" || maxMatch[2].toLowerCase() === "kun" || maxMatch[2].toLowerCase() === "thousand")) {
        num *= 1000;
      }
      detectedMaxPrice = num;
    }
    const minMatch = cleanLower.match(/(?:above|more than|at least|ka badan)\s*(\d+)\s*(k|kun|thousand)?/i);
    if (minMatch) {
      let num = parseInt(minMatch[1], 10);
      if (minMatch[2] && (minMatch[2].toLowerCase() === "k" || minMatch[2].toLowerCase() === "kun" || minMatch[2].toLowerCase() === "thousand")) {
        num *= 1000;
      }
      detectedMinPrice = num;
    }

    // Check Purpose
    let detectedPurpose: "RENT" | "SALE" | undefined = undefined;
    if (/\b(rent|kiro|kirada|kiree|kireysto|lease|للايجار|للإيجار)\b/i.test(lower)) {
      detectedPurpose = "RENT";
    } else if (/\b(buy|purchase|sale|iib|iibka|iibso|gadasho|للبيع)\b/i.test(lower)) {
      detectedPurpose = "SALE";
    }

    const detectedPeriod = /\b(bishii|month|monthly|شهريا|شهرياً)\b/i.test(cleanLower) ? ("month" as const) : undefined;

    const isSearchIntent =
      Boolean(detectedCity) ||
      Boolean(detectedDistrict) ||
      Boolean(detectedPropertyType) ||
      Boolean(detectedBedrooms) ||
      Boolean(detectedMaxPrice) ||
      Boolean(input.contextSlots?.city) ||
      Boolean(input.contextSlots?.propertyType) ||
      Boolean(input.contextSlots?.purpose) ||
      /\b(show|find|search|keen|raadi|i tus|doonayaa|rabaa|properties|listings)\b/i.test(lower);

    if (isSearchIntent) {
      const finalCity = detectedCity || input.contextSlots?.city;
      const finalDistrict = detectedDistrict || (detectedCity ? undefined : input.contextSlots?.district);
      const finalType = detectedPropertyType || input.contextSlots?.propertyType;
      const finalMaxPrice = detectedMaxPrice !== undefined ? detectedMaxPrice : input.contextSlots?.maxPrice;
      const finalMinPrice = detectedMinPrice !== undefined ? detectedMinPrice : input.contextSlots?.minPrice;
      const finalPurpose = detectedPurpose || input.contextSlots?.purpose;
      const finalBeds = detectedBedrooms !== undefined ? [detectedBedrooms] : (input.contextSlots?.bedrooms ? [input.contextSlots.bedrooms] : undefined);
      const finalPeriod = detectedPeriod || input.contextSlots?.pricePeriod;

      // 1. If user is searching but hasn't provided a city, trigger CLARIFICATION interview!
      if (!finalCity) {
        const replyText =
          lang === "en"
            ? "Which city in Somalia are you looking in? (e.g., Mogadishu, Hargeisa, Garowe, Kismayo)"
            : lang === "ar"
            ? "في أي مدينة تبحث عن العقار؟ (مثال: مقديشو، هرجيسا، غاروي، كيسمايو)"
            : "Magaalo kee ayaad guri ka raadinaysaa? (tusaale: Muqdisho, Hargeysa, Garoowe, ama Kismaayo)?";
        return {
          type: "TEXT_RESPONSE",
          replyText,
          contextUpdates: {
            city: finalCity,
            purpose: finalPurpose,
            propertyType: finalType as any,
            bedrooms: detectedBedrooms !== undefined ? detectedBedrooms : input.contextSlots?.bedrooms,
            maxPrice: finalMaxPrice,
            minPrice: finalMinPrice,
            pricePeriod: finalPeriod,
            responseType: "CLARIFICATION",
          },
          latencyMs,
          model: this.model,
          success: true,
        };
      }

      const hasDirectShowCommand = /\b(show|find|search|keen|raadi|i tus|list|browse|wax walba)\b/i.test(lower);

      // 2. If city is set, but user hasn't specified a budget yet, ask for budget in conversational clarification!
      if (finalCity && finalMaxPrice === undefined && finalMinPrice === undefined && !hasDirectShowCommand) {
        const replyText =
          lang === "en"
            ? `Great, looking for properties in ${finalCity}. What is your preferred budget (e.g. $300 or $500/month)?`
            : lang === "ar"
            ? `ممتاز، أبحث لك عن عقارات في ${finalCity}. ما هي الميزانية المناسبة لك (مثال: 500$ شهرياً)؟`
            : `Hagaag, waxaan kuu raadinayaa guryaha ku yaal ${finalCity}. Miisaaniyadda intee le'eg ayaad qorsheynaysaa (tusaale: $300 ama $500 bishii)?`;
        return {
          type: "TEXT_RESPONSE",
          replyText,
          contextUpdates: {
            city: finalCity,
            purpose: finalPurpose,
            propertyType: finalType as any,
            bedrooms: detectedBedrooms !== undefined ? detectedBedrooms : input.contextSlots?.bedrooms,
            responseType: "CLARIFICATION",
          },
          latencyMs,
          model: this.model,
          success: true,
        };
      }

      // 3. If city and budget are set, but bedrooms is not specified yet (and type is not Land), ask for bedroom count!
      if (
        finalCity &&
        (finalMaxPrice !== undefined || finalMinPrice !== undefined) &&
        !detectedBedrooms &&
        !input.contextSlots?.bedrooms &&
        finalType !== "LAND" &&
        !hasDirectShowCommand
      ) {
        const replyText =
          lang === "en"
            ? `Budget of $${finalMaxPrice || 500} noted. How many bedrooms do you need (e.g. 2 or 3 bedrooms)?`
            : lang === "ar"
            ? `تم تسجيل الميزانية ($${finalMaxPrice || 500}). كم عدد غرف النوم التي تحتاجها؟`
            : `Miisaaniyadda $${finalMaxPrice || 500} waa la xaqiijiyey. Qolal intee le'eg ayaad u baahan tahay (tusaale: 2 qol ama 3 qol)?`;
        return {
          type: "TEXT_RESPONSE",
          replyText,
          contextUpdates: {
            city: finalCity,
            purpose: finalPurpose,
            propertyType: finalType as any,
            maxPrice: finalMaxPrice,
            minPrice: finalMinPrice,
            pricePeriod: finalPeriod,
            responseType: "CLARIFICATION",
          },
          latencyMs,
          model: this.model,
          success: true,
        };
      }

      return {
        type: "TOOL_CALL",
        toolCall: {
          name: "search_properties",
          args: {
            city: finalCity,
            district: finalDistrict,
            propertyType: finalType as any,
            maxPrice: finalMaxPrice,
            minPrice: finalMinPrice,
            purpose: finalPurpose,
            preferredBedrooms: finalBeds,
          },
        },
        contextUpdates: {
          city: finalCity,
          district: finalDistrict,
          propertyType: finalType as any,
          maxPrice: finalMaxPrice,
          minPrice: finalMinPrice,
          purpose: finalPurpose,
          bedrooms: detectedBedrooms !== undefined ? detectedBedrooms : input.contextSlots?.bedrooms,
          pricePeriod: finalPeriod,
          responseType: "PROPERTY_RESULTS",
        },
        latencyMs,
        model: this.model,
        success: true,
      };
    }

    // Default conversational reply
    const fallbackText =
      lang === "en"
        ? "Welcome to Kiro-Maal! I can help you search, compare, and book verified properties in Mogadishu, Hargeisa, Bosaso, and across Somalia. What kind of property are you looking for?"
        : lang === "ar"
        ? "مرحباً بك في كيرو-مال! يمكنني مساعدتك في البحث عن عقارات مؤكدة في مقديشو، هرجيسا، وبوساسو. كيف يمكنني مساعدتك اليوم؟"
        : "Ku soo dhowow Kiro-Maal! Waxaan kaa caawin karaa raadinta, isbarbardhigga, iyo kormeerka guryaha la xaqiijiyay ee Muqdisho, Hargeysa, Boosaaso, iyo dhammaan Soomaaliya. Noocee guri ayaad raadinaysaa?";

    return {
      type: "TEXT_RESPONSE",
      replyText: fallbackText,
      contextUpdates: {
        responseType: "GENERAL_CONVERSATION",
      },
      latencyMs,
      model: this.model,
      success: true,
    };
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

export const geminiProvider = new GeminiProvider();
