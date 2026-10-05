/**
 * Google Gemini Intelligence Provider
 *
 * Implements AIProvider using @google/generative-ai.
 * Keeps production gemini-3.8-flash for chat and conversational understanding.
 * Embeddings are handled separately by gemini-embedding-2 and are NOT modified here.
 * All API keys remain server-side and are never logged or exposed.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
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
        model: this.model,
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
      const systemInstruction = `You are Gemini 3.8 Flash, acting as AIDA — the AI Real Estate Assistant for Kiro-Maal (Somalia's premier real estate platform).

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
- If verified properties are returned, explain them accurately and answer user questions based on the verified facts.
- If no properties match or if the user excludes an area, respect the factual database reality honestly.`;

      const genModel = client.getGenerativeModel({
        model: this.model,
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
      let groundedContext = "";
      if (input.verifiedProperties && input.verifiedProperties.length > 0) {
        groundedContext += `[VERIFIED KIRO-MAAL PROPERTIES IN DATABASE]:\n` +
          input.verifiedProperties.map((p) =>
            `#${p.rank || 1} "${p.title}": Price $${p.price} (${p.city}${p.location ? ', ' + p.location : ''}), ` +
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
