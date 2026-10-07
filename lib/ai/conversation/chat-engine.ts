/**
 * Core Conversational AI Chat & Context Continuity Engine
 *
 * Coordinates:
 * - Multilingual Language Understanding
 * - Multi-Turn Conversation Memory & Slot Carry-Over
 * - Property Entity & Ordinal Reference Resolution
 * - Topic Continuity & Transitions
 * - Grounded Integration with Hybrid Search (2B), Recommendations (2C), and Price ML (3)
 */

import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import {
  ConversationState,
  ResultItem,
  ExtendedLanguage,
  ResponseType,
  ReferenceResolution,
} from "./types";
import { detectConversationalLanguage } from "./language-manager";
import {
  initializeConversationState,
  validatePropertyAgainstQuery,
  attachActiveResultSet,
} from "./state-manager";
import { generateGroundedAIDAResponse } from "../orchestration/response-generator";
import { validateGrounding } from "../orchestration/grounding-validator";
import {
  geminiProvider,
  GeminiPropertySearchArgs,
  GeminiConversationalDecision,
} from "../providers/gemini-provider";
import { openAIProvider } from "../providers/openai-provider";

export interface ProcessTurnInput {
  sessionId: string;
  message: string;
  history?: { role: string; content: string; metadata?: string }[];
  conversationHistory?: { role: string; content: string; metadata?: string }[];
  userName?: string;
  userRole?: string;
  userId?: string | null;
  initialState?: ConversationState;
  language?: ExtendedLanguage;
}

export interface ProcessTurnOutput {
  reply: string;
  properties: ResultItem[];
  intent: string;
  topic: string;
  confidence: number;
  language: ExtendedLanguage;
  conversationLanguage?: ExtendedLanguage;
  languageConfidence?: number;
  searchReadiness?: "READY" | "NEEDS_CLARIFICATION" | "GREETING" | "GENERAL_CONVERSATION" | "VALUATION" | "IN_SET_REFERENCE";
  missingSlots?: string[];
  totalMatches: number;
  resolution?: ReferenceResolution;
  state: ConversationState;
  updatedState?: ConversationState;
  responseType: ResponseType;
  shouldRenderPropertyCards: boolean;
  shouldRenderCards?: boolean;
  activeSearchCriteria?: any;
  referencedPropertyIds?: string[];
}

/**
 * Extracts previously saved ConversationState from the latest assistant message metadata
 * or deterministically replays history turns if metadata is unavailable
 */
export function restoreConversationState(
  sessionId: string,
  history: { role: string; content: string; metadata?: string }[] = []
): ConversationState {
  // 1. Find the most recent assistant message with valid metadata
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === "assistant" && msg.metadata) {
      try {
        const parsed = JSON.parse(msg.metadata);
        if (parsed.conversationState && parsed.conversationState.sessionId === sessionId) {
          const restored = parsed.conversationState as ConversationState;
          if (!restored.lastAssistantMessage && msg.content) {
            restored.lastAssistantMessage = msg.content;
          }
          return restored;
        }
      } catch {
        // Continue searching
      }
    }
  }

  // 2. Replay historical turns if metadata was absent or stripped
  const fallbackState = initializeConversationState(sessionId);
  if (history.length > 0) {
    const lastAsst = [...history].reverse().find(m => m.role === "assistant");
    if (lastAsst) {
      fallbackState.lastAssistantMessage = lastAsst.content;
    }
    for (const msg of history) {
      if (msg.role === "user") {
        const lang = detectConversationalLanguage(msg.content, fallbackState.language);
        if (lang.explicitPreferenceDetected) {
          fallbackState.explicitLanguagePreference = lang.explicitPreferenceDetected;
          fallbackState.language = lang.explicitPreferenceDetected;
        } else if (lang.confidence >= 0.7) {
          fallbackState.language = lang.language;
        }
        fallbackState.turnCount += 1;
        fallbackState.lastUserRequest = msg.content;
      }
    }
  }

  return fallbackState;
}

/**
 * Application Tool Handler for Gemini 3.8 Flash's `search_properties` Tool Call
 *
 * Enforces hard security, approval status, and database integrity independently:
 * - status = "APPROVED"
 * - NOT: excludedLocations (e.g. Hodan ma rabo -> Hodan is strictly excluded)
 * - Budget caps
 * - Validates surviving properties with validatePropertyAgainstQuery
 * - Scores surviving properties by soft preferences (bedrooms, KM4 proximity, price)
 */
async function executePropertySearchTool(
  toolArgs: GeminiPropertySearchArgs,
  state: ConversationState
): Promise<{
  properties: ResultItem[];
  totalMatches: number;
  shouldRenderPropertyCards: boolean;
  responseType: ResponseType;
}> {
  const searchFilter: any = {
    status: "APPROVED",
  };

  const targetCity = toolArgs.city || state.slots.city;
  if (targetCity) {
    searchFilter.city = { contains: targetCity };
  }

  const targetDistrict = toolArgs.district || state.slots.district;
  const excluded = [
    ...(state.slots.excludedLocations || []),
    ...(toolArgs.excludedLocations || []),
  ];
  const uniqueExcluded = Array.from(new Set(excluded));

  if (targetDistrict && !uniqueExcluded.includes(targetDistrict)) {
    searchFilter.OR = [
      { location: { contains: targetDistrict } },
      { address: { contains: targetDistrict } },
      { title: { contains: targetDistrict } },
      { description: { contains: targetDistrict } },
    ];
  }

  // HARD CONSTRAINT: Excluded locations must NEVER be matched in database
  if (uniqueExcluded.length > 0) {
    searchFilter.NOT = uniqueExcluded.map((excl) => ({
      OR: [
        { location: { contains: excl } },
        { address: { contains: excl } },
        { title: { contains: excl } },
        { description: { contains: excl } },
      ],
    }));
  }

  const targetType = toolArgs.propertyType || state.slots.propertyType;
  if (targetType && targetType !== "HOUSE") {
    searchFilter.type = targetType;
  }

  const maxBudget = toolArgs.maxPrice !== undefined ? toolArgs.maxPrice : state.slots.maxPrice;
  if (maxBudget !== undefined) {
    searchFilter.price = { ...(searchFilter.price || {}), lte: maxBudget };
  }

  const minBudget = toolArgs.minPrice !== undefined ? toolArgs.minPrice : state.slots.minPrice;
  if (minBudget !== undefined) {
    searchFilter.price = { ...(searchFilter.price || {}), gte: minBudget };
  }

  // Execute database search with hard constraint filters
  let matchedProps: any[] = [];
  try {
    matchedProps = await Promise.race([
      prisma.property.findMany({
        where: searchFilter,
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          manager: { select: { name: true } },
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
      new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 800)),
    ]);
  } catch {
    matchedProps = [];
  }

  // Convert into standardized ResultItem format
  const rawItems: (ResultItem & { location?: string; address?: string | null })[] = matchedProps.map((p, index) => ({
    rank: index + 1,
    id: p.id,
    title: p.title,
    price: p.price,
    formattedPrice: formatPrice(p.price),
    city: p.city,
    type: p.type,
    typeLabel: p.type.charAt(0) + p.type.slice(1).toLowerCase(),
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: p.area,
    areaSize: p.area,
    furnished: !!p.isFurnished,
    parking: (p.parking || 0) > 0,
    parkingSpaces: p.parking || 0,
    status: p.status,
    statusLabel: p.status === "APPROVED" ? "Available" : p.status,
    statusEmoji: "🟢",
    imageUrl: p.images[0]?.url || null,
    managerName: (p as any).manager?.name || "Verified Manager",
    description: p.description || "",
    location: p.location,
    address: p.address,
  }));

  // CRITICAL: Post-Search Hard Constraint Validation
  // Strictly reject any property in an excluded location or violating budget
  const validatedProps = rawItems.filter((p) =>
    validatePropertyAgainstQuery(
      {
        city: p.city,
        status: p.status,
        bedrooms: p.bedrooms,
        price: p.price,
        type: p.type,
        furnished: p.furnished,
        parking: p.parking,
        location: p.location,
        address: p.address || undefined,
        title: p.title,
        description: p.description,
      },
      {
        ...state.slots,
        city: targetCity,
        excludedLocations: uniqueExcluded,
        maxPrice: maxBudget,
      }
    ).isValid
  );

  // SOFT PREFERENCE RANKING (Section 4 & Section 9)
  const userReasoning = state.slots.userReasoning || [];
  const softPrefs = [...(((state as any).softPreferences as string[]) || []), ...(state.slots.softPreferences || [])];

  const scoredProps = validatedProps.map((p) => {
    let score = 0;
    // Soft bedroom preference: 3 beds preferred (+10), 2 beds acceptable (+6)
    if (
      softPrefs.some((pr) => pr.includes("3_bedrooms_preferred") || pr.includes("3 qol")) ||
      toolArgs.preferredBedrooms?.includes(3)
    ) {
      if (p.bedrooms === 3) score += 10;
      else if (p.bedrooms === 2) score += 6;
      else if (p.bedrooms && p.bedrooms >= 1) score += 2;
    } else if (
      softPrefs.some((pr) => pr.includes("2_bedrooms_acceptable") || pr.includes("2 qol")) ||
      toolArgs.preferredBedrooms?.includes(2)
    ) {
      if (p.bedrooms === 2) score += 8;
      else if (p.bedrooms === 3) score += 6;
    }
    // Workplace proximity (KM4)
    if (
      userReasoning.includes("works_or_travels_near_KM4") ||
      softPrefs.includes("close_to_workplace") ||
      toolArgs.proximity === "KM4"
    ) {
      const text = `${p.location || ""} ${p.address || ""} ${p.title} ${p.description}`.toLowerCase();
      if (text.includes("km4") || text.includes("wadajir") || text.includes("airport") || text.includes("bulsho")) {
        score += 8;
      }
    }
    // Quiet / family-friendly area
    if (softPrefs.includes("quiet_neighborhood")) {
      if (p.type === "APARTMENT" || p.type === "HOUSE") score += 4;
    }
    // Price efficiency within budget
    if (maxBudget && p.price <= maxBudget) {
      score += ((maxBudget - p.price) / maxBudget) * 3;
    }
    return { item: p, score };
  });

  scoredProps.sort((a, b) => b.score - a.score);
  const finalProps = scoredProps.slice(0, 5).map((entry, idx) => ({ ...entry.item, rank: idx + 1 }));

  return {
    properties: finalProps,
    totalMatches: finalProps.length,
    shouldRenderPropertyCards: finalProps.length > 0,
    responseType: finalProps.length > 0 ? "PROPERTY_RESULTS" : "NO_RESULTS",
  };
}

/**
 * Process a conversational user turn with multi-turn memory and context continuity
 */
export async function processConversationalTurn(
  input: ProcessTurnInput
): Promise<ProcessTurnOutput> {
  const { sessionId, message, userName = "Guest", userRole = "PUBLIC" } = input;
  const history = input.history || input.conversationHistory || [];

  // 1. Restore Conversation State from previous turns
  let state = input.initialState || restoreConversationState(sessionId, history);
  if (input.language) {
    state.language = input.language;
    state.explicitLanguagePreference = input.language;
  }
  const lastAssistantMsg = [...history].reverse().find(m => m.role === "assistant")?.content || state.lastAssistantMessage || "";

  // 2. Multilingual Language Detection & Preference Tracking
  const convLang = state.explicitLanguagePreference || state.language || "en";
  const langDetails = detectConversationalLanguage(message, convLang);
  if (langDetails.explicitPreferenceDetected) {
    state.explicitLanguagePreference = langDetails.explicitPreferenceDetected;
  }
  let activeLanguage: ExtendedLanguage = state.explicitLanguagePreference || langDetails.language;
  if ((activeLanguage as string) === "mixed") {
    activeLanguage = (convLang && (convLang as string) !== "mixed") ? convLang : "so";
  }
  state.language = activeLanguage;

  // 3. AI PROVIDER STRATEGY: GEMINI 3.8 FLASH (PRIMARY) -> OPENAI GPT-6 LUNA (FALLBACK) -> TECHNICAL NOTICE (LAST RESORT)
  const turnContext = {
    userMessage: message,
    conversationHistory: history.map((h) => ({ role: h.role, content: h.content })),
    contextSlots: state.slots,
    activeResultSet: state.activeResultSet,
    preferredLanguage: activeLanguage,
  };

  let activeDecision: GeminiConversationalDecision | null = null;

  // Attempt Primary Provider: Gemini 3.8 Flash
  try {
    const geminiDecision = await geminiProvider.decideConversationalAction(turnContext);
    if (geminiDecision.success) {
      activeDecision = geminiDecision;
    } else {
      console.warn(`[AIDA][AI] Gemini failed: ${geminiDecision.error || "decision unsuccessful"}`);
    }
  } catch (err: any) {
    console.warn(`[AIDA][AI] Gemini failed with exception: ${err?.message || "error"}`);
  }

  // Attempt Secondary Fallback Provider: OpenAI GPT-6 Luna only when Gemini fails
  if (!activeDecision && openAIProvider.isConfigured()) {
    console.log("[AIDA][AI] Falling back to OpenAI GPT-6 Luna");
    try {
      const openAIDecision = await openAIProvider.decideConversationalAction(turnContext);
      if (openAIDecision.success) {
        activeDecision = openAIDecision;
        console.log("[AIDA][AI] OpenAI fallback succeeded");
      } else {
        console.warn(`[AIDA][AI] OpenAI fallback failed: ${openAIDecision.error || "decision unsuccessful"}`);
      }
    } catch (err: any) {
      console.warn(`[AIDA][AI] OpenAI fallback failed with exception: ${err?.message || "error"}`);
    }
  }

  // Last Resort: If both providers fail, use safe generic technical notice
  if (!activeDecision) {
    console.warn("[AIDA][AI] Both Gemini and OpenAI failed. Using safe generic technical fallback.");
    activeDecision = geminiProvider.safeGenericTechnicalFallback(turnContext, Date.now());
  }

  const conversationalDecision = activeDecision;

  let reply = "";
  let returnedProperties: ResultItem[] = [];
  let totalMatches = 0;
  let responseType: ResponseType = "GENERAL_CONVERSATION";
  let shouldRenderPropertyCards = false;

  // 4. Update Conversation State as Pure Data from AI's understanding
  if (conversationalDecision.contextUpdates) {
    const cu = conversationalDecision.contextUpdates;
    if (cu.city !== undefined) state.slots.city = cu.city;
    if (cu.district !== undefined) state.slots.district = cu.district;
    if (cu.maxPrice !== undefined) state.slots.maxPrice = cu.maxPrice;
    if (cu.minPrice !== undefined) state.slots.minPrice = cu.minPrice;
    if (cu.purpose !== undefined) state.slots.purpose = cu.purpose;
    if (cu.propertyType !== undefined) state.slots.propertyType = cu.propertyType;
    if (cu.bedrooms !== undefined) state.slots.bedrooms = cu.bedrooms;
    if (cu.furnished !== undefined) state.slots.furnished = cu.furnished;
    if (cu.parking !== undefined) state.slots.parking = cu.parking;
    if (cu.proximity !== undefined) state.slots.proximity = cu.proximity;
    if (cu.excludedLocations !== undefined) {
      state.slots.excludedLocations = cu.excludedLocations;
      // Remove any excluded location from active district
      if (state.slots.district && state.slots.excludedLocations.includes(state.slots.district)) {
        delete state.slots.district;
      }
    }
    if (cu.softPreferences !== undefined) {
      state.slots.softPreferences = cu.softPreferences;
    }
    if (cu.userReasoning !== undefined) {
      state.slots.userReasoning = cu.userReasoning;
    }
    if (cu.referencedPropertyId) {
      state.referencedPropertyId = cu.referencedPropertyId;
    }
    if (cu.responseType) {
      responseType = cu.responseType;
    }
  }

  // 5. Handle AI Decision: Tool Call vs. Text Response
  if (conversationalDecision.type === "TOOL_CALL" && conversationalDecision.toolCall && conversationalDecision.toolCall.name === "search_properties") {
    // -------------------------------------------------------------------------
    // AI TOOL CALL: search_properties
    // AI decided that verified property inventory is needed to answer.
    // -------------------------------------------------------------------------
    const toolArgs = conversationalDecision.toolCall.args;

    // Sync state slots with tool arguments
    if (toolArgs.city) state.slots.city = toolArgs.city;
    if (toolArgs.district) state.slots.district = toolArgs.district;
    if (toolArgs.maxPrice !== undefined) state.slots.maxPrice = toolArgs.maxPrice;
    if (toolArgs.minPrice !== undefined) state.slots.minPrice = toolArgs.minPrice;
    if (toolArgs.purpose) state.slots.purpose = toolArgs.purpose;
    if (toolArgs.propertyType) state.slots.propertyType = toolArgs.propertyType;
    if (toolArgs.preferredBedrooms && toolArgs.preferredBedrooms.length > 0) {
      state.slots.bedrooms = toolArgs.preferredBedrooms[0];
    }
    if (toolArgs.excludedLocations && toolArgs.excludedLocations.length > 0) {
      state.slots.excludedLocations = Array.from(new Set([
        ...(state.slots.excludedLocations || []),
        ...toolArgs.excludedLocations,
      ]));
    }
    if (toolArgs.proximity) {
      state.slots.proximity = toolArgs.proximity;
    }

    // Application executes tool independently with hard constraints
    const searchResult = await executePropertySearchTool(toolArgs, state);
    returnedProperties = searchResult.properties;
    totalMatches = searchResult.totalMatches;
    shouldRenderPropertyCards = searchResult.shouldRenderPropertyCards;
    responseType = searchResult.responseType;

    if (returnedProperties.length > 0) {
      state.interviewStage = "IDLE";
      state = attachActiveResultSet(state, returnedProperties);
    }

    // Return verified database results to AI to generate the grounded natural response
    const fallbackReply = returnedProperties.length > 0
      ? (toolArgs.prioritizeBest || message.includes("ugu fiican")
          ? `Waxaan kuu helay guryaha ugu fiican ee ku jira miisaaniyaddaada ($${state.slots.maxPrice || 500}). Halkan ka eeg xulashooyinka ugu dhow shuruudahaaga:`
          : `Waxaan kuu helay ${returnedProperties.length} guri oo buuxinaya shuruudahaaga:`)
      : (activeLanguage === "so"
          ? (state.slots.excludedLocations && state.slots.excludedLocations.length > 0
              ? `Waxaan hubiyey guryaha ${state.slots.city || "Mogadishu"} ee miisaaniyaddaada ($${state.slots.maxPrice || 500}). Maadaama aad ${state.slots.excludedLocations.join(", ")} ka saartay, ma helin guri buuxiya dhammaan shuruudahaas oo ku jira miisaaniyaddaada. Ma rabtaa inaan miisaaniyadda wax yar kor u qaadno mise goobo kale ayaan eegnaa?`
              : `Waan baaray xog-ururintayada, laakiin kuma helin guri buuxiya dhammaan shuruudahaaga miisaaniyaddaada.`)
          : `I searched our verified database, but could not locate listings matching your criteria within your budget.`);

    const groundedAI = await generateGroundedAIDAResponse(
      {
        userMessage: message,
        language: activeLanguage,
        intent: "REAL_ESTATE_SEARCH",
        verifiedProperties: returnedProperties,
        contextSlots: state.slots,
        lastAssistantMessage: lastAssistantMsg,
        conversationHistory: history.map((h) => ({ role: h.role, content: h.content })),
      },
      fallbackReply
    );
    reply = groundedAI?.replyText || fallbackReply;
  } else {
    // -------------------------------------------------------------------------
    // AI TEXT RESPONSE
    // AI decided NO tool call is needed (greetings, advice, preferences,
    // casual chat, in-set property questions).
    // ZERO MySQL / Prisma queries executed!
    // -------------------------------------------------------------------------
    reply = conversationalDecision.replyText || "";
    returnedProperties = [];
    totalMatches = 0;
    shouldRenderPropertyCards = false;

    if (!conversationalDecision.contextUpdates?.responseType) {
      const lower = message.toLowerCase();
      if (lower.match(/^(asc|salaam|hello|hi|hey|assalamu|nabad)\b/i)) {
        responseType = "GREETING";
      } else if (lower.includes("ku fiican") || lower.includes("advice") || lower.includes("talo")) {
        responseType = "ADVICE";
      } else if (conversationalDecision.contextUpdates && Object.keys(conversationalDecision.contextUpdates).length > 0) {
        responseType = "REQUIREMENT_UPDATE";
      } else {
        responseType = "GENERAL_CONVERSATION";
      }
    }

    if (responseType === "PROPERTY_DETAIL" && state.referencedPropertyId) {
      const referenced = state.activeResultSet.find((p) => p.id === state.referencedPropertyId);
      if (referenced) {
        returnedProperties = [referenced];
        totalMatches = 1;
      }
    }
  }

  // Grounding validation on text responses if a property was referenced
  if (state.referencedPropertyId && state.activeResultSet.length > 0) {
    const targetProp = state.activeResultSet.find((p) => p.id === state.referencedPropertyId);
    if (targetProp) {
      const grounding = validateGrounding(reply, state.activeResultSet, targetProp);
      if (!grounding.isValid) {
        reply = `Xogta aan ka hayo property-kan kama muuqato xogtaas la xaqiijiyay.`;
      }
    }
  }

  state.lastAssistantMessage = reply;
  state.lastUserMessage = message;
  state.lastUserRequest = message;
  state.turnCount += 1;
  state.updatedAt = new Date().toISOString();

  if (reply.includes("Kiro-Maal") || reply.includes("Real Estate Assistant")) {
    state.lastAssistantClaim = "AIDA Kiro-Maal Real Estate Assistant";
  } else if (returnedProperties.length > 0) {
    state.lastAssistantClaim = `Showed ${returnedProperties.length} verified properties`;
  }

  return {
    reply,
    properties: returnedProperties,
    intent: responseType === "PROPERTY_RESULTS" ? "REAL_ESTATE_SEARCH" : responseType,
    topic: state.currentTopic,
    confidence: 0.95,
    language: activeLanguage,
    conversationLanguage: activeLanguage,
    languageConfidence: 0.95,
    searchReadiness: returnedProperties.length > 0 ? "READY" : "GENERAL_CONVERSATION",
    missingSlots: [],
    totalMatches,
    state,
    updatedState: state,
    responseType,
    shouldRenderPropertyCards,
    shouldRenderCards: shouldRenderPropertyCards,
    activeSearchCriteria: state.slots,
    referencedPropertyIds: returnedProperties.map((p) => p.id),
  };
}
