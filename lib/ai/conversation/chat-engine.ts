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
import { extractEntities } from "../nlu/entity-extractor";
import { classifyIntent } from "../nlu/intent-classifier";
import { executeHybridSearch } from "../hybrid-search/hybrid-search-service";
import { estimatePropertyPrice } from "../valuation/valuation-service";
import {
  ConversationState,
  ResultItem,
  ExtendedLanguage,
  ReferenceResolution,
  ResponseType,
} from "./types";
import {
  detectConversationalLanguage,
  generateNaturalDialogResponse,
} from "./language-manager";
import { resolveConversationalReference } from "./reference-resolver";
import {
  initializeConversationState,
  updateConversationState,
  attachActiveResultSet,
  truncateContextWindow,
  validatePropertyAgainstQuery,
  evaluateSearchReadiness,
} from "./state-manager";

export interface ProcessTurnInput {
  sessionId: string;
  message: string;
  history?: { role: string; content: string; metadata?: string }[];
  userName?: string;
  userRole?: string;
  userId?: string | null;
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
  responseType: ResponseType;
  shouldRenderPropertyCards: boolean;
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
          return parsed.conversationState as ConversationState;
        }
      } catch {
        // Continue searching
      }
    }
  }

  // 2. Replay historical turns if metadata was absent or stripped
  const fallbackState = initializeConversationState(sessionId);
  if (history.length > 0) {
    for (const msg of history) {
      if (msg.role === "user") {
        const lang = detectConversationalLanguage(msg.content, fallbackState.language);
        if (lang.explicitPreferenceDetected) {
          fallbackState.explicitLanguagePreference = lang.explicitPreferenceDetected;
          fallbackState.language = lang.explicitPreferenceDetected;
        } else if (lang.confidence >= 0.7) {
          fallbackState.language = lang.language;
        }
        const intent = classifyIntent(msg.content);
        const entities = extractEntities(msg.content);
        const { state: updated } = updateConversationState(
          fallbackState,
          entities,
          msg.content,
          intent.intent,
          fallbackState.language
        );
        fallbackState.slots = updated.slots;
        fallbackState.currentTopic = updated.currentTopic;
        fallbackState.turnCount += 1;
      }
    }
  }

  return fallbackState;
}

/**
 * Process a conversational user turn with multi-turn memory and context continuity
 */
export async function processConversationalTurn(
  input: ProcessTurnInput
): Promise<ProcessTurnOutput> {
  const { sessionId, message, history = [], userName = "Guest", userRole = "PUBLIC" } = input;

  // 1. Restore Conversation State from previous turns
  let state = restoreConversationState(sessionId, history);

  // 2. Multilingual Language Detection & Preference Tracking
  const convLang = state.explicitLanguagePreference || state.language || "en";
  const langDetails = detectConversationalLanguage(message, convLang);
  if (langDetails.explicitPreferenceDetected) {
    state.explicitLanguagePreference = langDetails.explicitPreferenceDetected;
  }
  const activeLanguage: ExtendedLanguage = state.explicitLanguagePreference || langDetails.language;
  state.language = activeLanguage;

  // 3. Phase 2B Intent & Entity Extraction on current message
  const rawIntent = classifyIntent(message);
  const entities = extractEntities(message);

  // 4. Update Conversation State (Slot carry-over, removals, topic tracking)
  const { state: updatedState, delta } = updateConversationState(
    state,
    entities,
    message,
    rawIntent.intent,
    activeLanguage
  );
  state = updatedState;

  // 5. Check for Ordinal or Pronoun Reference Resolution against active result set
  const resolution = resolveConversationalReference(
    message,
    state.activeResultSet,
    state.activeResultSet.find((p) => p.id === state.referencedPropertyId)
  );

  let reply = "";
  let returnedProperties: ResultItem[] = [];
  let totalMatches = 0;
  let responseType: ResponseType = "PROPERTY_RESULTS";
  let shouldRenderPropertyCards = false;

  // ───────────────────────────────────────────────────────────────────────────
  // ROUTE 0: SEARCH READINESS & CONVERSATIONAL INTERVIEW PRE-CHECK
  // (Prevents premature database searches, handles greetings, casual chat, FAQs)
  // ───────────────────────────────────────────────────────────────────────────
  const readiness = evaluateSearchReadiness(state, message, entities, activeLanguage);

  if (readiness.responseType === "GREETING") {
    reply = generateNaturalDialogResponse({
      language: activeLanguage,
      templateType: "GREETING",
      userName,
    });
    responseType = "GREETING";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
  } else if (readiness.responseType === "GENERAL_CONVERSATION") {
    reply = generateNaturalDialogResponse({
      language: activeLanguage,
      templateType: "GENERAL_CONVERSATION",
      userMessage: message,
    });
    responseType = "GENERAL_CONVERSATION";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
  } else if (readiness.responseType === "CLARIFICATION") {
    reply = generateNaturalDialogResponse({
      language: activeLanguage,
      templateType: "CLARIFICATION",
      clarificationQuestion: readiness.clarificationQuestion,
      missingSlot: readiness.missingSlot,
      slots: state.slots,
    });
    responseType = "CLARIFICATION";
    shouldRenderPropertyCards = false;
    returnedProperties = [];

    // Track interview progress
    if (readiness.missingSlot === "city") {
      state.interviewStage = "AWAITING_CITY";
    } else if (readiness.missingSlot === "budget") {
      state.interviewStage = "AWAITING_BUDGET";
    } else if (readiness.missingSlot === "bedrooms") {
      state.interviewStage = "AWAITING_BEDROOMS";
    }
  }
  // ───────────────────────────────────────────────────────────────────────────
  // ROUTE 1: Specific Reference Resolution (Ordinals, Comparatives, Comparisons)
  // ───────────────────────────────────────────────────────────────────────────
  else if (resolution.type !== "NONE" && resolution.targetProperty) {
    state.referencedPropertyId = resolution.targetProperty.id;

    // A. Side-by-Side Comparison ("compare 1 and 2")
    if (resolution.type === "COMPARISON" && resolution.comparedProperties?.length === 2) {
      const [pA, pB] = resolution.comparedProperties;
      reply = generateNaturalDialogResponse({
        language: activeLanguage,
        templateType: "SIDE_BY_SIDE_COMPARISON",
        comparedPropertyA: pA,
        comparedPropertyB: pB,
      });
      returnedProperties = [pA, pB];
      totalMatches = 2;
      responseType = "PROPERTY_COMPARISON";
      shouldRenderPropertyCards = false;
    }
    // B. Cheaper Comparative ("which one is cheaper", "the cheaper one")
    else if (resolution.type === "COMPARATIVE" && resolution.attributeQueried === "price") {
      reply = generateNaturalDialogResponse({
        language: activeLanguage,
        templateType: "CHEAPER_COMPARISON",
        referencedProperty: resolution.targetProperty,
      });
      returnedProperties = [resolution.targetProperty];
      totalMatches = 1;
      responseType = "PROPERTY_DETAIL";
      shouldRenderPropertyCards = false;
    }
    // C. Ordinal / Pronoun details on single property ("the second one", "what is its price?")
    else {
      const lower = message.toLowerCase();
      if (lower.includes("valuation") || lower.includes("appraisal") || lower.includes("predict") || lower.includes("qiimee")) {
        try {
          const valRes = await estimatePropertyPrice({ propertyId: resolution.targetProperty.id });
          reply = generateNaturalDialogResponse({
            language: activeLanguage,
            templateType: "PRICE_VALUATION",
            valuationData: valRes,
          });
          responseType = "VALUATION";
        } catch {
          reply = generateNaturalDialogResponse({
            language: activeLanguage,
            templateType: "ORDINAL_DETAILS",
            referencedProperty: resolution.targetProperty,
          });
          responseType = "PROPERTY_DETAIL";
        }
      } else {
        reply = generateNaturalDialogResponse({
          language: activeLanguage,
          templateType: "ORDINAL_DETAILS",
          referencedProperty: resolution.targetProperty,
        });
        responseType = "PROPERTY_DETAIL";
      }
      returnedProperties = [resolution.targetProperty];
      totalMatches = 1;
      shouldRenderPropertyCards = false;
    }
  }
  // ───────────────────────────────────────────────────────────────────────────
  // ROUTE 1A: Out-of-bounds Ordinal Reference (e.g. Asking for #2 when only 1 exists)
  // ───────────────────────────────────────────────────────────────────────────
  else if (resolution.type === "ORDINAL" && !resolution.targetProperty) {
    responseType = "PROPERTY_DETAIL";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
    const count = state.activeResultSet.length;
    if (activeLanguage === "so") {
      reply = count === 0
        ? "Ma jiraan guryo hore loo helay oo aad tixraaci karto. Fadlan marka hore raadso guryo."
        : `Waxaa natiijooyinkaaga ku jira kaliya ${count} guri. Fadlan dooro mid ka mid ah intaas ama raadso guryo kale.`;
    } else if (activeLanguage === "ar") {
      reply = count === 0
        ? "لا توجد عقارات سابقة للإشارة إليها. يرجى البحث عن عقارات أولاً."
        : `تتضمن نتائجك ${count} عقار فقط. يرجى اختيار أحد هذه العقارات أو إجراء بحث جديد.`;
    } else {
      reply = count === 0
        ? "There are no previous search results to refer to. Please perform a search first."
        : `There are only ${count} properties in your current results. Please select one of those or perform a new search.`;
    }
  }
  // ───────────────────────────────────────────────────────────────────────────
  // ROUTE 1B: Explicit Property ID / Identifier Inquiries (Strict Status Gating)
  // ───────────────────────────────────────────────────────────────────────────
  else if (message.match(/\b(cm[a-z0-9]{20,30})\b/i) || message.match(/(?:property|listing)\s+(?:id\s+|number\s+|#\s*)?([a-z0-9]{6,})/i)) {
    const idMatch = message.match(/\b(cm[a-z0-9]{20,30})\b/i) || message.match(/(?:property|listing)\s+(?:id\s+|number\s+|#\s*)?([a-z0-9]{6,})/i);
    const identifier = idMatch ? idMatch[1] : "";

    const matchedProp = await prisma.property.findFirst({
      where: {
        OR: [
          { id: identifier },
          { title: { contains: identifier } },
        ],
        status: "APPROVED",
      },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        manager: { select: { name: true } },
      },
    });

    if (matchedProp) {
      const item: ResultItem = {
        rank: 1,
        id: matchedProp.id,
        title: matchedProp.title,
        price: matchedProp.price,
        formattedPrice: formatPrice(matchedProp.price),
        city: matchedProp.city,
        type: matchedProp.type,
        typeLabel: matchedProp.type.charAt(0) + matchedProp.type.slice(1).toLowerCase(),
        bedrooms: matchedProp.bedrooms,
        bathrooms: matchedProp.bathrooms,
        area: matchedProp.area,
        areaSize: matchedProp.area,
        furnished: !!matchedProp.isFurnished,
        parking: (matchedProp.parking || 0) > 0,
        parkingSpaces: matchedProp.parking || 0,
        status: matchedProp.status,
        statusLabel: "Available",
        statusEmoji: "🟢",
        imageUrl: matchedProp.images[0]?.url || null,
        managerName: (matchedProp as any).manager?.name || "Verified Manager",
        description: matchedProp.description || "",
      };
      returnedProperties = [item];
      totalMatches = 1;
      responseType = "PROPERTY_DETAIL";
      shouldRenderPropertyCards = false;
      reply = generateNaturalDialogResponse({
        language: activeLanguage,
        templateType: "ORDINAL_DETAILS",
        referencedProperty: item,
      });
      state = attachActiveResultSet(state, returnedProperties);
    } else {
      returnedProperties = [];
      totalMatches = 0;
      responseType = "NO_RESULTS";
      shouldRenderPropertyCards = false;
      if (activeLanguage === "so") {
        reply = `Waan baaray xog-ururintayada, laakiin kuma helin hantidaas aqoonsigeeda gudaha guryaha la ansixiyay ee diyaar u ah dadweynaha.`;
      } else if (activeLanguage === "ar") {
        reply = `بحثت في قاعدة البيانات، ولكن لم أتمكن من العثور على هذا العقار المحدد في قائمتنا المعتمدة والمتاحة.`;
      } else {
        reply = `I searched our database, but could not locate that specific property ID or listing in our approved inventory.`;
      }
    }
  }
  // ───────────────────────────────────────────────────────────────────────────
  // ROUTE 2: Off-Topic
  // ───────────────────────────────────────────────────────────────────────────
  else if (state.currentTopic === "OFF_TOPIC") {
    reply = generateNaturalDialogResponse({
      language: activeLanguage,
      templateType: "TOPIC_SHIFT",
    });
    responseType = "GENERAL_CONVERSATION";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
  }
  // ───────────────────────────────────────────────────────────────────────────
  // ROUTE 3: Grounded Property Search with Strict Hard Constraints & Validation
  // ───────────────────────────────────────────────────────────────────────────
  else {
    // Construct merged query criteria from conversational slots
    const searchFilter: any = {
      status: "APPROVED",
    };

    if (state.slots.city) {
      searchFilter.city = { contains: state.slots.city };
    }
    if (state.slots.propertyType && state.slots.propertyType !== "HOUSE") {
      searchFilter.type = state.slots.propertyType;
    }
    if (state.slots.bedrooms !== undefined) {
      searchFilter.bedrooms = { gte: state.slots.bedrooms };
    }
    if (state.slots.maxPrice !== undefined) {
      searchFilter.price = { ...(searchFilter.price || {}), lte: state.slots.maxPrice };
    }
    if (state.slots.minPrice !== undefined) {
      searchFilter.price = { ...(searchFilter.price || {}), gte: state.slots.minPrice };
    }
    if (state.slots.furnished) {
      searchFilter.isFurnished = true;
    }
    if (state.slots.parking) {
      searchFilter.parking = { gt: 0 };
    }

    // Execute database search with hard constraint filters
    const matchedProps = await prisma.property.findMany({
      where: searchFilter,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        manager: { select: { name: true } },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    // Convert into standardized ResultItem format
    const rawItems: ResultItem[] = matchedProps.map((p, index) => ({
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
    }));

    // CRITICAL: Post-Search Hard Constraint Validation
    // Re-verify EVERY property against user slots to prevent any cross-city bleed
    const validatedProps = rawItems
      .filter((p) => validatePropertyAgainstQuery(p, state.slots).isValid)
      .slice(0, 5)
      .map((p, idx) => ({ ...p, rank: idx + 1 }));

    if (validatedProps.length > 0) {
      returnedProperties = validatedProps;
      totalMatches = validatedProps.length;
      shouldRenderPropertyCards = true;
      responseType = "PROPERTY_RESULTS";
      state.interviewStage = "IDLE";
      state = attachActiveResultSet(state, returnedProperties);

      if (delta.isQueryModification && delta.changedSlots.length > 0) {
        const topChange = delta.changedSlots[0];
        reply = generateNaturalDialogResponse({
          language: activeLanguage,
          templateType: "SLOT_UPDATE",
          updatedSlot: { name: topChange.slot, value: topChange.to },
          properties: returnedProperties,
          totalMatches,
          slots: state.slots,
        });
      } else {
        reply = generateNaturalDialogResponse({
          language: activeLanguage,
          templateType: "SEARCH_RESULTS",
          properties: returnedProperties,
          totalMatches,
          slots: state.slots,
        });
      }
    } else {
      returnedProperties = [];
      totalMatches = 0;
      shouldRenderPropertyCards = false;
      responseType = "NO_RESULTS";
      reply = generateNaturalDialogResponse({
        language: activeLanguage,
        templateType: "ZERO_RESULTS",
        slots: state.slots,
      });
    }
  }

  state.lastAssistantMessage = reply;

  const searchReadinessValue = readiness.isReady
    ? "READY"
    : readiness.responseType === "CLARIFICATION"
    ? "NEEDS_CLARIFICATION"
    : (readiness.responseType as any);

  return {
    reply,
    properties: returnedProperties,
    intent: rawIntent.intent,
    topic: state.currentTopic,
    confidence: state.topicConfidence,
    language: activeLanguage,
    conversationLanguage: activeLanguage,
    languageConfidence: langDetails.confidence,
    searchReadiness: searchReadinessValue,
    missingSlots: readiness.missingSlot ? [readiness.missingSlot] : state.unresolvedSlots,
    totalMatches,
    resolution: resolution.type !== "NONE" ? resolution : undefined,
    state,
    responseType,
    shouldRenderPropertyCards,
    activeSearchCriteria: state.slots,
    referencedPropertyIds: returnedProperties.map((p) => p.id),
  };
}
