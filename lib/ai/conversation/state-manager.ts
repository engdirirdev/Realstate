/**
 * Conversational State & Slot Manager
 *
 * Tracks conversation-level slots, topic transitions, slot additions,
 * modifications, and explicit removals across unlimited conversation turns.
 */

import {
  ConversationState,
  ConversationSlotState,
  ConversationTopic,
  ResultItem,
  SlotUpdateDelta,
  ExtendedLanguage,
  ResponseType,
  InterviewStage,
  SearchReadinessDecision,
} from "./types";
import { ExtractedEntities } from "../nlu/entity-extractor";
import { QueryIntent } from "../nlu/intent-classifier";
import { analyzeConversationalSlang } from "./slang-normalizer";

const OFF_TOPIC_PATTERNS = [
  /\b(weather|joke|football|recipe|politics|president|movie|song|who won|capital of|poem)\b/i,
];

/**
 * Initializes a new empty conversation state
 */
export function initializeConversationState(sessionId: string, initialLanguage: ExtendedLanguage = "en"): ConversationState {
  return {
    sessionId,
    language: initialLanguage,
    currentTopic: "PROPERTY_SEARCH",
    topicConfidence: 0.8,
    slots: {},
    activeResultSet: [],
    unresolvedSlots: ["city", "propertyType"],
    rejectedPropertyIds: [],
    interviewStage: "IDLE",
    turnCount: 0,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Detects whether the user is explicitly requesting a slot removal
 * e.g. "remove parking", "without parking", "no pool", "any bedrooms"
 */
export function detectSlotRemovals(text: string): string[] {
  const lower = text.toLowerCase();
  const removals: string[] = [];

  if (lower.match(/\b(remove|without|no|dont\s*need|ha\s*yeelanin|bilaa)\s+parking\b/i) || lower.includes("baarkin la'aan")) {
    removals.push("parking");
  }
  if (lower.match(/\b(remove|without|no)\s+pool\b/i) || lower.includes("dabaal la'aan")) {
    removals.push("pool");
  }
  if (lower.match(/\b(remove|without|no)\s+furnished\b/i) || lower.includes("aan\s*qalabaysnayn")) {
    removals.push("furnished");
  }
  if (lower.match(/\b(any\s*bedrooms|no\s*bedroom\s*preference|qolalka\s*kala\s*dooran\s*maayo)\b/i)) {
    removals.push("bedrooms");
  }
  if (lower.match(/\b(any\s*budget|no\s*budget|no\s*price\s*limit|qiimaha\s*xad\s*maleh)\b/i)) {
    removals.push("maxPrice");
    removals.push("minPrice");
  }

  return removals;
}

/**
 * Detects if the current turn signifies an explicit topic change
 */
export function detectTopicTransition(
  text: string,
  currentTopic: ConversationTopic,
  detectedIntent: QueryIntent
): { topic: ConversationTopic; confidence: number; isTopicChange: boolean } {
  const lower = text.toLowerCase();

  // 1. Off-topic check
  if (OFF_TOPIC_PATTERNS.some((p) => p.test(lower))) {
    return {
      topic: "OFF_TOPIC",
      confidence: 0.95,
      isTopicChange: currentTopic !== "OFF_TOPIC",
    };
  }

  // 2. Booking intent
  if (lower.includes("book") || lower.includes("visit") || lower.includes("ballan") || lower.includes("حجز")) {
    return {
      topic: "BOOKING",
      confidence: 0.92,
      isTopicChange: currentTopic !== "BOOKING",
    };
  }

  // 3. Valuation intent
  if (lower.includes("valuation") || lower.includes("appraisal") || lower.includes("predict price") ||
      lower.includes("qiimee") || lower.includes("qiyaas qiimaha") || lower.includes("تقييم")) {
    return {
      topic: "PROPERTY_VALUATION",
      confidence: 0.90,
      isTopicChange: currentTopic !== "PROPERTY_VALUATION",
    };
  }

  // 4. Comparison intent
  if (lower.includes("compare") || lower.includes("barbar dhig") || lower.includes("قارن")) {
    return {
      topic: "PROPERTY_COMPARISON",
      confidence: 0.90,
      isTopicChange: currentTopic !== "PROPERTY_COMPARISON",
    };
  }

  // 5. Details on referenced property
  if (lower.includes("details") || lower.includes("tell me more") || lower.includes("falanqee") || lower.includes("تفاصيل")) {
    return {
      topic: "PROPERTY_DETAILS",
      confidence: 0.88,
      isTopicChange: currentTopic !== "PROPERTY_DETAILS",
    };
  }

  // 6. Educational / Platform questions
  if (detectedIntent === "general_inquiry" || lower.includes("how does escrow work") || lower.includes("what is ai")) {
    return {
      topic: "GENERAL_INQUIRY",
      confidence: 0.90,
      isTopicChange: currentTopic !== "GENERAL_INQUIRY",
    };
  }

  // Default to keeping property search or recommendation
  return {
    topic: currentTopic === "OFF_TOPIC" ? "PROPERTY_SEARCH" : currentTopic,
    confidence: 0.85,
    isTopicChange: false,
  };
}

/**
 * Updates conversational state with new extracted entities and user inputs
 */
export function updateConversationState(
  prevState: ConversationState,
  entities: ExtractedEntities,
  userMessage: string,
  detectedIntent: QueryIntent,
  newLanguage?: ExtendedLanguage
): { state: ConversationState; delta: SlotUpdateDelta } {
  const currentSlots: ConversationSlotState = { ...prevState.slots };
  const changedSlots: { slot: string; from: any; to: any }[] = [];
  const newSlots: Partial<ConversationSlotState> = {};

  // 1. Detect slot removals
  const removedSlots = detectSlotRemovals(userMessage);
  for (const slotKey of removedSlots) {
    if ((currentSlots as any)[slotKey] !== undefined) {
      delete (currentSlots as any)[slotKey];
    }
  }

  // 2. City update / retention
  if (entities.city) {
    if (currentSlots.city !== entities.city) {
      if (currentSlots.city) {
        changedSlots.push({ slot: "city", from: currentSlots.city, to: entities.city });
      } else {
        newSlots.city = entities.city;
      }
      currentSlots.city = entities.city;
    }
  }

  // 3. Property Type update / retention
  if (entities.propertyType) {
    if (currentSlots.propertyType !== entities.propertyType) {
      if (currentSlots.propertyType) {
        changedSlots.push({ slot: "propertyType", from: currentSlots.propertyType, to: entities.propertyType });
      } else {
        newSlots.propertyType = entities.propertyType;
      }
      currentSlots.propertyType = entities.propertyType;
    }
  }

  // 4. Bedrooms update
  if (entities.bedrooms && typeof entities.bedrooms.value === "number") {
    const val = entities.bedrooms.value;
    if (currentSlots.bedrooms !== val) {
      if (currentSlots.bedrooms !== undefined) {
        changedSlots.push({ slot: "bedrooms", from: currentSlots.bedrooms, to: val });
      } else {
        newSlots.bedrooms = val;
      }
      currentSlots.bedrooms = val;
    }
  }

  // 5. Bathrooms update
  if (entities.bathrooms && typeof entities.bathrooms.value === "number") {
    const val = entities.bathrooms.value;
    if (currentSlots.bathrooms !== val) {
      if (currentSlots.bathrooms !== undefined) {
        changedSlots.push({ slot: "bathrooms", from: currentSlots.bathrooms, to: val });
      } else {
        newSlots.bathrooms = val;
      }
      currentSlots.bathrooms = val;
    }
  }

  // 6. Price update
  if (entities.price) {
    if (entities.price.maxPrice) {
      if (currentSlots.maxPrice !== entities.price.maxPrice) {
        if (currentSlots.maxPrice !== undefined) {
          changedSlots.push({ slot: "maxPrice", from: currentSlots.maxPrice, to: entities.price.maxPrice });
        } else {
          newSlots.maxPrice = entities.price.maxPrice;
        }
        currentSlots.maxPrice = entities.price.maxPrice;
      }
    }
    if (entities.price.minPrice) {
      if (currentSlots.minPrice !== entities.price.minPrice) {
        currentSlots.minPrice = entities.price.minPrice;
      }
    }
    if (entities.price.approxPrice && !entities.price.maxPrice) {
      currentSlots.maxPrice = entities.price.approxPrice;
      newSlots.maxPrice = entities.price.approxPrice;
    }
  }

  // 7. Cheaper query modifier ("show me cheaper ones", "find cheaper")
  const lowerMsg = userMessage.toLowerCase();
  if ((lowerMsg.includes("cheaper") || lowerMsg.includes("ka jaban") || lowerMsg.includes("أرخص")) &&
      !entities.price?.maxPrice && prevState.activeResultSet.length > 0) {
    const lowestReturned = Math.min(...prevState.activeResultSet.map((p) => p.price));
    const newMax = Math.round(lowestReturned * 0.9);
    changedSlots.push({ slot: "maxPrice", from: currentSlots.maxPrice, to: newMax });
    currentSlots.maxPrice = newMax;
  }

  // 8. Boolean Flags (parking, furnished)
  if (entities.parking !== undefined && !removedSlots.includes("parking")) {
    currentSlots.parking = entities.parking;
  }
  if (entities.isFurnished !== undefined && !removedSlots.includes("furnished")) {
    currentSlots.furnished = entities.isFurnished;
  }

  // 8b. Purpose slot (SALE vs RENT) & rental price period
  if (entities.purpose) {
    if (currentSlots.purpose !== entities.purpose) {
      if (currentSlots.purpose) {
        changedSlots.push({ slot: "purpose", from: currentSlots.purpose, to: entities.purpose });
      } else {
        newSlots.purpose = entities.purpose;
      }
      currentSlots.purpose = entities.purpose;
    }
  }
  if (entities.price?.period) {
    currentSlots.pricePeriod = entities.price.period;
  }

  // 9. Topic transition evaluation
  const topicEval = detectTopicTransition(userMessage, prevState.currentTopic, detectedIntent);

  // 10. Compute unresolved slots
  const unresolved: string[] = [];
  if (!currentSlots.city) unresolved.push("city");
  if (!currentSlots.propertyType) unresolved.push("propertyType");
  if (!currentSlots.maxPrice) unresolved.push("budget");

  const isQueryModification = changedSlots.length > 0 || removedSlots.length > 0;
  const isFollowUp = Object.keys(newSlots).length > 0 || isQueryModification;

  const nextState: ConversationState = {
    ...prevState,
    language: newLanguage || prevState.language,
    currentTopic: topicEval.topic,
    previousTopic: topicEval.isTopicChange ? prevState.currentTopic : prevState.previousTopic,
    topicConfidence: topicEval.confidence,
    slots: currentSlots,
    unresolvedSlots: unresolved,
    turnCount: prevState.turnCount + 1,
    lastUserMessage: userMessage,
    updatedAt: new Date().toISOString(),
  };

  return {
    state: nextState,
    delta: {
      newSlots,
      changedSlots,
      removedSlots,
      isFollowUp,
      isQueryModification,
    },
  };
}

/**
 * Attaches a newly returned property result set to conversation memory
 */
export function attachActiveResultSet(
  state: ConversationState,
  properties: ResultItem[]
): ConversationState {
  return {
    ...state,
    activeResultSet: properties.slice(0, 5), // Keep top 5 in memory
    referencedPropertyId: properties[0]?.id,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Truncate long conversation message histories safely without losing structured slots
 */
export function truncateContextWindow(
  history: { role: string; content: string }[],
  maxTurns: number = 6
): { role: string; content: string }[] {
  if (history.length <= maxTurns) {
    return history;
  }
  // Keep the most recent maxTurns messages
  return history.slice(history.length - maxTurns);
}

/**
 * Post-search property validator.
 * Strictly guarantees that every returned property fulfills all hard constraints.
 * NEVER allows cross-city bleed, unapproved listings, or bedroom/price violations.
 */
export function validatePropertyAgainstQuery(
  property: {
    city: string;
    status: string;
    bedrooms?: number;
    price?: number;
    type?: string;
    furnished?: boolean;
    parking?: boolean;
  },
  slots: ConversationSlotState
): { isValid: boolean; violationReason?: string } {
  // 1. Hard status check - ONLY APPROVED properties
  if (property.status !== "APPROVED") {
    return {
      isValid: false,
      violationReason: `Property status is ${property.status}; must be APPROVED`,
    };
  }

  // 2. Hard city check (CRITICAL: prevents cross-city bleed)
  if (slots.city) {
    const propCity = (property.city || "").trim().toLowerCase();
    const targetCity = slots.city.trim().toLowerCase();
    if (propCity !== targetCity) {
      return {
        isValid: false,
        violationReason: `City constraint violation: property is in ${property.city}, expected ${slots.city}`,
      };
    }
  }

  // 3. Hard bedroom check
  if (slots.bedrooms !== undefined && property.bedrooms !== undefined) {
    if (property.bedrooms < slots.bedrooms) {
      return {
        isValid: false,
        violationReason: `Bedrooms violation: property has ${property.bedrooms} beds, requested >= ${slots.bedrooms}`,
      };
    }
  }

  // 4. Hard max price check
  if (slots.maxPrice !== undefined && property.price !== undefined) {
    if (property.price > slots.maxPrice) {
      return {
        isValid: false,
        violationReason: `Price violation: property price $${property.price} exceeds budget $${slots.maxPrice}`,
      };
    }
  }

  // 5. Hard min price check
  if (slots.minPrice !== undefined && property.price !== undefined) {
    if (property.price < slots.minPrice) {
      return {
        isValid: false,
        violationReason: `Price violation: property price $${property.price} is below minimum $${slots.minPrice}`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Deterministic Search Readiness & Conversational Interview Decision Engine
 *
 * Distinguishes between:
 * - Greetings (asc, hello, hi, etc.)
 * - Casual conversation & gratitude (mahadsanid, thanks, ok, sxb)
 * - Educational / FAQ questions (what is escrow, what is a villa, how does valuation work)
 * - Valuation requests
 * - In-set reference resolutions (the second one, cheaper)
 * - Property search with missing slots (interview mode: ask for city -> budget -> bedrooms)
 * - Ready for search
 */
export function evaluateSearchReadiness(
  state: ConversationState,
  userMessage: string,
  entities: ExtractedEntities,
  activeLanguage: ExtendedLanguage = "en"
): SearchReadinessDecision {
  const slang = analyzeConversationalSlang(userMessage);
  const lower = userMessage.toLowerCase().trim();

  // 1. Pure greeting check (e.g. "asc", "hello", "hi", "wcs", "salaam")
  if (slang.isGreeting || slang.isGreetingResponse) {
    if (!entities.city && !entities.bedrooms && !entities.price && (!entities.propertyType || lower.length < 15)) {
      return {
        isReady: false,
        responseType: "GREETING",
        reason: "User provided a greeting without search criteria",
      };
    }
  }

  // 2. Gratitude / Casual conversation (e.g. "mahadsanid", "thanks", "how are you", "sxb", "ok")
  if (
    slang.isGratitude ||
    (slang.hasInformalAddress && lower.length < 10) ||
    lower.match(/^(how are you|see tahay|sidee tahay|waad mahadsantahay|thanks|thx|ok|okay)\b/i)
  ) {
    if (!entities.city && !entities.bedrooms && !entities.price) {
      return {
        isReady: false,
        responseType: "GENERAL_CONVERSATION",
        reason: "User sent casual conversation or gratitude",
      };
    }
  }

  // 3. Educational / Real estate FAQ inquiries
  const isEducationalQuestion =
    lower.includes("what is a villa") ||
    lower.includes("what is the difference between rent and buy") ||
    lower.includes("difference between rent and buy") ||
    lower.includes("how does property valuation work") ||
    lower.includes("what should i check before buying") ||
    lower.includes("how does escrow work") ||
    lower.includes("what is escrow") ||
    lower.includes("escrow") ||
    lower.includes("what is a mortgage") ||
    lower.includes("mortgage") ||
    lower.includes("waa maxay fiilo") ||
    lower.includes("farqiga u dhexeeya iibka iyo kirada") ||
    lower.includes("sidee u shaqeysaa qiimeynta") ||
    lower.includes("maxaan hubiyaa intaanan guri iibsan") ||
    lower.includes("ما هي الفيلا") ||
    lower.includes("الفرق بين الإيجار والشراء") ||
    lower.includes("كيف يعمل التقييم العقاري");

  if (isEducationalQuestion) {
    return {
      isReady: false,
      responseType: "GENERAL_CONVERSATION",
      reason: "User asked a general real estate educational question",
    };
  }

  // 4. Valuation inquiry
  if (
    lower.includes("valuation") ||
    lower.includes("appraisal") ||
    lower.includes("predict price") ||
    lower.includes("qiimee") ||
    lower.includes("qiyaas qiimaha") ||
    lower.includes("تقييم")
  ) {
    return {
      isReady: false,
      responseType: "VALUATION",
      reason: "User requested property valuation or appraisal",
    };
  }

  // 5. In-set Reference resolution (Ordinal, Comparative, Side-by-side)
  if (
    lower.match(/\b(kan labaad|the second one|first one|kan hore|saddexaad|third one|ka jaban|cheaper|compare|barbar dhig|قارن)\b/i) &&
    state.activeResultSet.length > 0
  ) {
    // If it's "cheaper" modification, it IS ready for search with adjusted price
    if (lower.includes("cheaper") || lower.includes("ka jaban") || lower.includes("أرخص")) {
      return {
        isReady: true,
        responseType: "PROPERTY_RESULTS",
        reason: "Follow-up query modification for cheaper listings in active context",
      };
    }
    return {
      isReady: false,
      responseType: lower.includes("compare") || lower.includes("barbar") ? "PROPERTY_COMPARISON" : "PROPERTY_DETAIL",
      reason: "User referenced a specific item from active result set",
    };
  }

  // 6. Property Search Readiness Check
  const slots = state.slots;

  // A. If City is missing -> We MUST interview the user for location!
  if (!slots.city) {
    const isRental = slots.purpose === "RENT";
    return {
      isReady: false,
      responseType: "CLARIFICATION",
      missingSlot: "city",
      clarificationQuestion:
        activeLanguage === "so"
          ? (isRental
              ? "Waayahay. Waxaad raadineysaa guryo kiro ah. Magaalo noocee ah ayaad ka raadinaysaa?"
              : "Waad heli kartaa! Magaalo noocee ah ayaad ka raadinaysaa?")
          : activeLanguage === "ar"
          ? (isRental
              ? "حسناً، تبحث عن عقارات للإيجار. في أي مدينة تريد أن أبحث لك؟"
              : "بالتأكيد، يمكنني مساعدتك. في أي مدينة تبحث عن العقار؟")
          : (isRental
              ? "Understood, you are looking for rental properties. Which city would you like me to search in?"
              : "Certainly! Which city are you looking to find property in?"),
      reason: "Missing mandatory city constraint; interviewing user for city",
    };
  }

  // B. City is known: Check whether enough parameters exist or if an interview step is needed.
  const hasExplicitSearchCommand =
    /\b(find|search|show me|list|give me|browse|raadi|i tus|ii raadi|keen|أبحث|ابحث|أريد أن أرى|اعرض)\b/i.test(lower) ||
    lower.includes("under") || lower.includes("budget") || lower.includes("below") || lower.includes("ka yar");

  const hasSpecificType = slots.propertyType && slots.propertyType !== "HOUSE"; // Villa, Apartment, Office, etc.
  const hasBedrooms = slots.bedrooms !== undefined;
  const hasPrice = slots.maxPrice !== undefined;
  const isRental = slots.purpose === "RENT";

  // If user provided city, but NO price and NO bedrooms:
  if (!hasBedrooms && !hasPrice && !hasSpecificType && !hasExplicitSearchCommand) {
    // Progressive interview step: Ask for budget (rental-aware)
    const budgetPromptSo = isRental
      ? `Waayahay, ${slots.city}. Miisaaniyadda kiradaadu waa intee?`
      : `Waayahay, ${slots.city}. Miisaaniyaddaadu waa intee?`;
    const budgetPromptAr = isRental
      ? `حسناً، ${slots.city}. كم ميزانيتك التقريبية للإيجار؟`
      : `حسناً، ${slots.city}. كم هي ميزانيتك التقريبية؟`;
    const budgetPromptEn = isRental
      ? `Understood, ${slots.city}. What is your rental budget?`
      : `Understood, ${slots.city}. What is your target budget?`;

    return {
      isReady: false,
      responseType: "CLARIFICATION",
      missingSlot: "budget",
      clarificationQuestion:
        activeLanguage === "so"
          ? budgetPromptSo
          : activeLanguage === "ar"
          ? budgetPromptAr
          : budgetPromptEn,
      reason: "City is known but budget and bedroom count are missing; progressive interview step",
    };
  }

  // If user provided city and budget, but no bedrooms and didn't give explicit search command:
  if (hasPrice && !hasBedrooms && !hasExplicitSearchCommand) {
    return {
      isReady: false,
      responseType: "CLARIFICATION",
      missingSlot: "bedrooms",
      clarificationQuestion:
        activeLanguage === "so"
          ? `Mahadsanid. Qolal jiif imisa ayaad rabtaa?`
          : activeLanguage === "ar"
          ? `شكراً لك. كم عدد غرف النوم التي ترغب بها؟`
          : `Thank you. How many bedrooms would you prefer?`,
      reason: "Budget is known but bedroom count is missing; progressive interview step",
    };
  }

  // C. All essential criteria or explicit command present -> READY TO SEARCH!
  return {
    isReady: true,
    responseType: "PROPERTY_RESULTS",
    reason: "Sufficient search constraints established for database search",
  };
}

