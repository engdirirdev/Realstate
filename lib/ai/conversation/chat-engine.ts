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
  isPureConversationalGreeting,
  evaluateSearchReadiness,
} from "./state-manager";
import { extractEntities } from "../nlu/entity-extractor";
import { resolveLocation, getCityDbVariants, getDistrictAliases } from "../nlu/location-resolver";
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

        // Carry over extracted location and entities from prior user turns
        const loc = resolveLocation(msg.content);
        if (loc?.canonicalCity) {
          fallbackState.slots.city = loc.canonicalCity;
          if (loc.district) fallbackState.slots.district = loc.district;
        }
        const entities = extractEntities(msg.content);
        if (entities.purpose && !fallbackState.slots.purpose) fallbackState.slots.purpose = entities.purpose;
        if (entities.propertyType && !fallbackState.slots.propertyType) fallbackState.slots.propertyType = entities.propertyType;
        if (typeof entities.bedrooms === "number") fallbackState.slots.bedrooms = entities.bedrooms;
        if (entities.price) {
          if (typeof entities.price === "number") fallbackState.slots.maxPrice = entities.price;
          else if (typeof (entities.price as any).maxPrice === "number") fallbackState.slots.maxPrice = (entities.price as any).maxPrice;
        }
      } else if (msg.role === "assistant" && msg.content) {
        // Also carry over confirmed city mentions from previous assistant replies (e.g. "Waayahay, Mogadishu")
        const asstLoc = resolveLocation(msg.content);
        if (asstLoc?.canonicalCity && !fallbackState.slots.city) {
          fallbackState.slots.city = asstLoc.canonicalCity;
          if (asstLoc.district) fallbackState.slots.district = asstLoc.district;
        }
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
    status: { in: ["APPROVED", "PUBLISHED"] },
    availabilityStatus: "AVAILABLE",
    isActive: true,
  };

  const listingType = (toolArgs as any).listingType || (state.slots as any).listingType;
  if (listingType && ["FOR_RENT", "FOR_SALE"].includes(String(listingType).toUpperCase())) {
    searchFilter.listingType = String(listingType).toUpperCase();
  }

  const rawCity = toolArgs.city || state.slots.city;
  let targetCity = rawCity;
  if (rawCity) {
    const loc = resolveLocation(rawCity);
    if (loc?.canonicalCity) {
      targetCity = loc.canonicalCity;
    }
  }
  if (targetCity) {
    const cityVariants = getCityDbVariants(targetCity);
    if (cityVariants.length > 1) {
      searchFilter.city = { in: cityVariants };
    } else if (cityVariants.length === 1) {
      searchFilter.city = cityVariants[0];
    } else {
      searchFilter.city = { contains: targetCity };
    }
  }

  const targetDistrict = toolArgs.district || state.slots.district;
  const excluded = [
    ...(state.slots.excludedLocations || []),
    ...(toolArgs.excludedLocations || []),
  ];
  const uniqueExcluded = Array.from(new Set(excluded));

  if (targetDistrict && !uniqueExcluded.includes(targetDistrict)) {
    const districtTerms = getDistrictAliases(targetDistrict);
    const districtClause = {
      OR: districtTerms.flatMap((term) => [
        { location: { contains: term } },
        { address: { contains: term } },
        { title: { contains: term } },
        { description: { contains: term } },
      ]),
    };
    if (searchFilter.AND) {
      (searchFilter.AND as any[]).push(districtClause);
    } else {
      searchFilter.AND = [districtClause];
    }
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
  if (targetType) {
    if (targetType === "HOUSE") {
      searchFilter.type = { in: ["HOUSE", "VILLA", "TOWNHOUSE"] };
    } else {
      searchFilter.type = targetType;
    }
  }

  const maxBudget = typeof toolArgs.maxPrice === "number" ? toolArgs.maxPrice : typeof state.slots.maxPrice === "number" ? state.slots.maxPrice : undefined;
  if (maxBudget !== undefined) {
    searchFilter.price = { ...(searchFilter.price || {}), lte: maxBudget };
  }

  const minBudget = typeof toolArgs.minPrice === "number" ? toolArgs.minPrice : typeof state.slots.minPrice === "number" ? state.slots.minPrice : undefined;
  if (minBudget !== undefined) {
    searchFilter.price = { ...(searchFilter.price || {}), gte: minBudget };
  }

  // Keyword / Title Matching support (e.g. "Contemporary Luxury Villa")
  const rawQ = (toolArgs as any).query || (toolArgs as any).title;
  if (rawQ && typeof rawQ === "string" && rawQ.trim().length > 0) {
    const cleanQ = rawQ.replace(/\b(hargiesa|hargeisa|muqdisho|mogadishu|villa|house|apartment|guri|dabaq|do you have|any)\b/gi, "").trim();
    const words = cleanQ.split(/\s+/).filter((w: string) => w.length > 2);
    if (words.length > 0) {
      const qClause = {
        OR: words.flatMap((w: string) => [
          { title: { contains: w } },
          { description: { contains: w } },
        ]),
      };
      if (searchFilter.AND) {
        (searchFilter.AND as any[]).push(qClause);
      } else {
        searchFilter.AND = [qClause];
      }
    }
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
      new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 3000)),
    ]);
  } catch {
    matchedProps = [];
  }

  // Convert into standardized ResultItem format
  const rawItems: (ResultItem & { location?: string; address?: string | null; aiMatchScore?: number; listingType?: string })[] = matchedProps.map((p, index) => {
    const isLand = String(p.type).toUpperCase() === "LAND";
    return {
      rank: index + 1,
      id: p.id,
      title: p.title,
      price: p.price,
      formattedPrice: formatPrice(p.price),
      city: p.city,
      type: p.type,
      typeLabel: isLand ? "Land" : p.type.charAt(0) + p.type.slice(1).toLowerCase(),
      bedrooms: isLand ? 0 : p.bedrooms,
      bathrooms: isLand ? 0 : p.bathrooms,
      area: p.area,
      areaSize: p.area,
      furnished: isLand ? false : !!p.isFurnished,
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
      listingType: (p as any).listingType === "FOR_RENT" || p.price < 5000 ? "For Rent" : "For Sale",
      aiMatchScore: 95,
    };
  });

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
        district: targetDistrict,
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
  const finalProps = scoredProps.slice(0, 15).map((entry, idx) => {
    const dynamicScore = Math.min(99, Math.max(82, Math.round(94 + entry.score * 1.2 - idx * 2)));
    return {
      ...entry.item,
      rank: idx + 1,
      aiMatchScore: (entry.item as any).aiMatchScore && (entry.item as any).aiMatchScore !== 95
        ? (entry.item as any).aiMatchScore
        : dynamicScore,
    };
  });

  return {
    properties: finalProps,
    totalMatches: validatedProps.length,
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
  const { sessionId, message } = input;
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

  // 2b. Strict Pure Greeting Interceptor
  // When a user simply says "hi", "hello", "asc", "salaam", etc., NEVER show property cards!
  if (isPureConversationalGreeting(message)) {
    const greetingText =
      activeLanguage === "en"
        ? "Hello and welcome to Kiro-Maal Real Estate! 👋 How can I help you today? Are you looking for rental properties, homes for sale, apartments, or villas?"
        : activeLanguage === "ar"
        ? "أهلاً ومرحباً بك في كيرو-مال للعقارات! 👋 كيف يمكنني مساعدتك اليوم؟ هل تبحث عن عقارات للإيجار، للبيع، شقق، أم فلل؟"
        : "Waad salaaman tahay 👋 Ku soo dhowow Kiro-Maal Real Estate! Maxaan maanta kaa caawin karaa—guri kirro ah, guri iib ah, apartment, villa mise dhul?";

    state.lastAssistantMessage = greetingText;
    state.lastUserMessage = message;
    state.lastUserRequest = message;
    state.turnCount += 1;
    state.updatedAt = new Date().toISOString();
    state.activeResultSet = [];

    return {
      reply: greetingText,
      properties: [],
      intent: "GREETING",
      topic: "PROPERTY_SEARCH",
      confidence: 0.98,
      language: activeLanguage,
      conversationLanguage: activeLanguage,
      languageConfidence: 0.98,
      searchReadiness: "GREETING",
      missingSlots: [],
      totalMatches: 0,
      state,
      updatedState: state,
      responseType: "GREETING",
      shouldRenderPropertyCards: false,
      shouldRenderCards: false,
      activeSearchCriteria: state.slots,
      referencedPropertyIds: [],
    };
  }

  // 2b-2. Direct Coverage & Location List Interceptor
  // When user asks which locations Kiro-Maal operates in or to list locations, answer directly and accurately!
  const isCoverageQuestion =
    /\b(which locations|list (your|you) locations|what locations|where do you (work|operate|cover)|locations do you|meelahee ka shaqeysaan|magaalooyinkee ka shaqeysaan|goobaha aad ka shaqeysaan|cities do you cover|where are your offices)\b/i.test(message) ||
    /^(which locations do you have to work|list you locations|list your locations)\b/i.test(message.trim());

  if (isCoverageQuestion) {
    const coverageReply =
      activeLanguage === "en"
        ? `Kiro-Maal operates across major cities in Somalia and Somaliland, with verified property listings in:
* **Mogadishu** (Hodan, Wadajir/Medina, Waberi, Taleex, Abdiaziz, Hamar Weyne, Dayniile, etc.)
* **Hargeisa** (Jigjiga Yar, 26 June, Ibrahim Koodbuur, Ga'an Libaax)
* **Garowe**, **Kismayo**, **Bosaso**, **Burao**, **Berbera**, and **Baidoa**

Which city or neighborhood would you like to explore properties in?`
        : activeLanguage === "ar"
        ? `تعمل كيرو-مال (Kiro-Maal) في جميع المدن الرئيسية في الصومال وأرض الصومال:
* **مقديشو** (هودان، واداجير/المدينة، وابري، طليح، عبد العزيز، حمروين، دينيلي، إلخ)
* **هرجيسا** (جيجيجا يار، 26 يونيو، إبراهيم كودبور، غعان ليباح)
* **غاروي**، **كيسمايو**، **بوساسو**، **برعو**، **بربرة**، و**بيدوا**

في أي مدينة ترغب في استكشاف العقارات؟`
        : `Kiro-Maal waxay ka shaqeysaa dhammaan magaalooyinka waaweyn ee Soomaaliya iyo Somaliland, oo ay ku jiraan:
* **Muqdisho** (Hodan, Wadajir/Madiina, Waaberi, Taleex, Cabdicasiis, Xamar Weyne, Dayniile, iwm.)
* **Hargeysa** (Jigjiga Yar, 26 Juun, Ibraahim Koodbuur, Gacan Libaax)
* **Garoowe**, **Kismaayo**, **Boosaaso**, **Burco**, **Berbera**, iyo **Baydhabo**

Magaaladee ama goobtee ayaad jeceshahay inaad guryo ama hanti ka raadiso?`;

    state.lastAssistantMessage = coverageReply;
    state.lastUserMessage = message;
    state.lastUserRequest = message;
    state.turnCount += 1;
    state.updatedAt = new Date().toISOString();

    return {
      reply: coverageReply,
      properties: [],
      intent: "GENERAL_CONVERSATION",
      topic: state.currentTopic,
      confidence: 0.98,
      language: activeLanguage,
      conversationLanguage: activeLanguage,
      languageConfidence: 0.98,
      searchReadiness: "GENERAL_CONVERSATION",
      missingSlots: [],
      totalMatches: 0,
      state,
      updatedState: state,
      responseType: "GENERAL_CONVERSATION",
      shouldRenderPropertyCards: false,
      shouldRenderCards: false,
      activeSearchCriteria: state.slots,
      referencedPropertyIds: [],
    };
  }

  // 2c. Immediate Deterministic Entity Extraction & Slot Enrichment
  const currentEntities = extractEntities(message);

  // Detect broad count, total, or overview inquiries (e.g. "meeqo ayay totalka noqonayaan", "si guud waa meeqo nooc kaste ha ahaadaane", "how many properties are in hargiesa")
  const isBroadCountOrOverview =
    /\b(meeqo|meeo|imisa|totalka|total|wadarta|tirada|guud|si guud|nooc kaste|nooc kasta|nooc kasto|wax walba|dhammaan|dhan)\b/i.test(message) ||
    /\b(how many|count|how much properties|all properties|overall|in general|any type|whatever type|total properties)\b/i.test(message);

  // Clear single-turn keyword queries so they never poison subsequent turns
  delete (state.slots as any).query;

  if (isBroadCountOrOverview && !currentEntities.propertyType) {
    // Reset narrow filters from prior turns so we count/show ALL verified inventory in the target location
    delete state.slots.propertyType;
    delete state.slots.bedrooms;
    delete state.slots.maxPrice;
    delete state.slots.minPrice;
    delete state.slots.purpose;
    delete state.referencedPropertyId;
    state.activeResultSet = [];
  }

  if (currentEntities.purpose) state.slots.purpose = currentEntities.purpose;
  if (currentEntities.propertyType) state.slots.propertyType = currentEntities.propertyType;
  if (currentEntities.price) {
    if (typeof currentEntities.price === "number") {
      state.slots.maxPrice = currentEntities.price;
    } else if (typeof (currentEntities.price as any).maxPrice === "number") {
      state.slots.maxPrice = (currentEntities.price as any).maxPrice;
      if ((currentEntities.price as any).period) {
        state.slots.pricePeriod = (currentEntities.price as any).period;
      }
    }
  }
  if ((currentEntities as any).pricePeriod) state.slots.pricePeriod = (currentEntities as any).pricePeriod;
  if (typeof currentEntities.bedrooms === "number") state.slots.bedrooms = currentEntities.bedrooms;

  // 2d. Explicit City Extraction & Cross-City Slot Reset
  // If the user's current turn explicitly specifies a city (e.g. "show houses in mogadishu"),
  // overwrite the city slot immediately and wipe any contradictory previous city filters!
  const explicitLoc = resolveLocation(message);
  if (explicitLoc && explicitLoc.canonicalCity) {
    const newCity = explicitLoc.canonicalCity;
    if (state.slots.city && state.slots.city.toLowerCase() !== newCity.toLowerCase()) {
      delete state.slots.district;
      delete state.slots.propertyType;
      delete state.slots.bedrooms;
      delete state.slots.maxPrice;
      delete state.slots.minPrice;
      state.slots.excludedLocations = [];
      state.activeResultSet = [];
      delete state.referencedPropertyId;
      if (currentEntities.propertyType) state.slots.propertyType = currentEntities.propertyType;
    }
    state.slots.city = newCity;
    if (explicitLoc.district) {
      state.slots.district = explicitLoc.district;
    }
  }

  // Direct property ID security guard for non-approved or private properties
  const idMatch = message.match(/\b(cm[a-z0-9]{20,})\b/i);
  if (idMatch) {
    const queriedId = idMatch[1];
    const targetProperty = await prisma.property.findUnique({
      where: { id: queriedId },
      include: { images: true },
    });
    if (!targetProperty || (targetProperty.status !== "APPROVED" && targetProperty.status !== "PUBLISHED")) {
      const isSomali = activeLanguage === "so";
      return {
        reply: isSomali
          ? "Waan ka xumahay, hantida aad raadinayso lama heli karo ama ma aha mid hadda u furan daawashada dadweynaha."
          : "I apologize, the property you are inquiring about is not available for public viewing or does not exist in our verified inventory.",
        properties: [],
        totalMatches: 0,
        shouldRenderPropertyCards: false,
        responseType: "PROPERTY_DETAIL" as ResponseType,
        state,
        intent: "PROPERTY_DETAIL",
        topic: state.currentTopic,
        confidence: 0.95,
        language: activeLanguage,
      };
    }
  }

  // 3. AI PROVIDER STRATEGY: GEMINI 3.8 FLASH (PRIMARY) -> OPENAI GPT-6 LUNA (FALLBACK) -> TECHNICAL NOTICE (LAST RESORT)
  const turnContext = {
    userMessage: message,
    conversationHistory: history.map((h) => ({ role: h.role, content: h.content })),
    contextSlots: state.slots,
    activeResultSet: state.activeResultSet,
    preferredLanguage: activeLanguage,
  };

  let activeDecision: GeminiConversationalDecision | null = null;

  // Provider Priority: Google Gemini is Primary
  const preferGemini = process.env.AI_PROVIDER !== "openai";

  if (preferGemini && geminiProvider.isConfigured()) {
    try {
      console.log("[AIDA][AI] Calling Primary Provider: Google Gemini (gemini-1.5-flash)");
      const geminiDecision = await geminiProvider.decideConversationalAction(turnContext);
      if (geminiDecision.success) {
        activeDecision = geminiDecision;
      } else {
        console.warn(`[AIDA][AI] Gemini failed: ${geminiDecision.error || "decision unsuccessful"}`);
      }
    } catch (err: any) {
      console.warn(`[AIDA][AI] Gemini failed with exception: ${err?.message || "error"}`);
    }
  }

  // Fallback: If Gemini is unavailable or not configured, try OpenAI
  if (!activeDecision && openAIProvider.isConfigured()) {
    try {
      console.log("[AIDA][AI] Calling Fallback Provider: OpenAI");
      const openAIDecision = await openAIProvider.decideConversationalAction(turnContext);
      if (openAIDecision.success) {
        activeDecision = openAIDecision;
      } else {
        console.warn(`[AIDA][AI] OpenAI fallback failed: ${openAIDecision.error || "decision unsuccessful"}`);
      }
    } catch (err: any) {
      console.warn(`[AIDA][AI] OpenAI fallback failed with exception: ${err?.message || "error"}`);
    }
  }

  // Last Resort: If all AI providers fail or none configured, use deterministic fallback
  if (!activeDecision) {
    console.warn("[AIDA][AI] No active AI provider decision. Using safe deterministic fallback.");
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
    if (cu.city !== undefined && cu.city !== null) state.slots.city = cu.city;
    if (cu.district !== undefined && cu.district !== null) state.slots.district = cu.district;
    if (typeof cu.maxPrice === "number" && !isBroadCountOrOverview) state.slots.maxPrice = cu.maxPrice;
    if (typeof cu.minPrice === "number" && !isBroadCountOrOverview) state.slots.minPrice = cu.minPrice;
    if (cu.purpose !== undefined && cu.purpose !== null && !isBroadCountOrOverview) state.slots.purpose = cu.purpose;
    if (cu.propertyType !== undefined && cu.propertyType !== null && (!isBroadCountOrOverview || Boolean(currentEntities.propertyType))) {
      state.slots.propertyType = cu.propertyType;
    }
    if (typeof cu.bedrooms === "number" && !isBroadCountOrOverview) state.slots.bedrooms = cu.bedrooms;
    if (cu.pricePeriod !== undefined && cu.pricePeriod !== null) state.slots.pricePeriod = cu.pricePeriod;
    if (cu.furnished !== undefined && cu.furnished !== null) state.slots.furnished = cu.furnished;
    if (cu.parking !== undefined && cu.parking !== null) state.slots.parking = cu.parking;
    if (cu.proximity !== undefined && cu.proximity !== null) state.slots.proximity = cu.proximity;
    if (cu.excludedLocations !== undefined && cu.excludedLocations !== null) {
      state.slots.excludedLocations = cu.excludedLocations;
      // Remove any excluded location from active district
      if (state.slots.district && state.slots.excludedLocations.includes(state.slots.district)) {
        delete state.slots.district;
      }
    }
    if (cu.softPreferences !== undefined && cu.softPreferences !== null) {
      state.slots.softPreferences = cu.softPreferences;
    }
    if (cu.userReasoning !== undefined && cu.userReasoning !== null) {
      state.slots.userReasoning = cu.userReasoning;
    }
    if (cu.referencedPropertyId) {
      state.referencedPropertyId = cu.referencedPropertyId;
    }
    if (cu.responseType) {
      responseType = cu.responseType;
    }
  }

  // 4b. Automatic Search Upgrade for Property Inquiries & Broad Count/Overview Questions:
  const isAvailabilityInquiry =
    isBroadCountOrOverview ||
    /\b(do you have|is there|are there|any|ma haysaan|ma jiraa|ma leedihiin|haysaa|ma heshaa)\b/i.test(message) ||
    Boolean((state.slots.city || conversationalDecision.contextUpdates?.city) && (state.slots.propertyType || conversationalDecision.contextUpdates?.propertyType) && !message.match(/\b(locations|cities|where do you work|offices)\b/i));

  if (
    conversationalDecision.type !== "TOOL_CALL" &&
    isAvailabilityInquiry &&
    (conversationalDecision.contextUpdates?.propertyType || conversationalDecision.contextUpdates?.city || state.slots.city || state.slots.propertyType)
  ) {
    conversationalDecision.type = "TOOL_CALL";
    conversationalDecision.toolCall = {
      name: "search_properties",
      args: {
        city: conversationalDecision.contextUpdates?.city || state.slots.city,
        district: conversationalDecision.contextUpdates?.district || state.slots.district,
        propertyType: (isBroadCountOrOverview && !currentEntities.propertyType)
          ? undefined
          : ((conversationalDecision.contextUpdates?.propertyType || state.slots.propertyType) as any),
        query: isBroadCountOrOverview ? undefined : message,
      },
    };
  }

  // 5. Handle AI Decision: Tool Call vs. Text Response
  if (conversationalDecision.type === "TOOL_CALL" && conversationalDecision.toolCall && conversationalDecision.toolCall.name === "search_properties") {
    // -------------------------------------------------------------------------
    // AI TOOL CALL: search_properties
    // AI decided that verified property inventory is needed to answer.
    // -------------------------------------------------------------------------
    const toolArgs = conversationalDecision.toolCall.args;

    // If user asked a general count/overview question without specifying a type, clear narrow filters on toolArgs
    if (isBroadCountOrOverview && !currentEntities.propertyType) {
      delete toolArgs.propertyType;
      delete toolArgs.preferredBedrooms;
      delete toolArgs.maxPrice;
      delete toolArgs.minPrice;
      delete toolArgs.purpose;
      delete (toolArgs as any).query;
      delete state.slots.propertyType;
      delete state.slots.bedrooms;
      delete state.slots.maxPrice;
      delete state.slots.minPrice;
      delete state.slots.purpose;
    }

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

    // 5a. Search Readiness Guard: Only clarify if the user's inquiry is totally generic (e.g. no city, type, or title)
    const extracted = extractEntities(message);
    const readiness = evaluateSearchReadiness(state, message, extracted, activeLanguage);
    const hasSpecificInquiry = Boolean(
      isBroadCountOrOverview ||
      (toolArgs as any).query ||
      toolArgs.city ||
      toolArgs.propertyType ||
      state.slots.city ||
      message.match(/\b(contemporary|luxury|villa|apartment|townhouse|penthouse|compound|hargeisa|hargiesa|mogadishu|muqdisho|do you have|ma haysaan|how many|meeqo|imisa|totalka|si guud)\b/i)
    );
    if (!readiness.isReady && readiness.clarificationQuestion && !hasSpecificInquiry) {
      return {
        reply: readiness.clarificationQuestion,
        properties: [],
        totalMatches: 0,
        shouldRenderPropertyCards: false,
        shouldRenderCards: false,
        responseType: readiness.responseType || "CLARIFICATION",
        state,
        updatedState: state,
        intent: readiness.responseType || "CLARIFICATION",
        topic: state.currentTopic,
        confidence: 0.95,
        language: activeLanguage,
        conversationLanguage: activeLanguage,
        languageConfidence: 0.95,
        activeSearchCriteria: state.slots,
        referencedPropertyIds: [],
      };
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
    const targetLocName = state.slots.city || toolArgs.city || "Somalia";
    const fallbackReply = returnedProperties.length > 0
      ? (activeLanguage === "en"
          ? (toolArgs.prioritizeBest || message.includes("best")
              ? `I found the best matching properties in ${targetLocName} within your budget ($${state.slots.maxPrice || 500}). Here are the top verified options:`
              : `There ${totalMatches === 1 ? "is" : "are"} ${totalMatches} verified ${totalMatches === 1 ? "property" : "properties"} in ${targetLocName} matching your inquiry:`)
          : activeLanguage === "ar"
          ? `وجدت لك ${totalMatches} من العقارات المؤكدة في ${targetLocName}:`
          : (toolArgs.prioritizeBest || message.includes("ugu fiican")
              ? `Waxaan kuu helay guryaha ugu fiican ee ku jira miisaaniyaddaada ($${state.slots.maxPrice || 500}). Halkan ka eeg xulashooyinka ugu dhow shuruudahaaga:`
              : `Waxaan ku haynaa wadar ahaan ${totalMatches} guri oo la xaqiijiyay oo ku yaal ${targetLocName}:`))
      : (activeLanguage === "en"
          ? (state.slots.excludedLocations && state.slots.excludedLocations.length > 0
              ? `I checked listings in ${targetLocName} within your budget. Since you excluded ${state.slots.excludedLocations.join(", ")}, no listings matched all criteria. Would you like to adjust your budget or explore other areas?`
              : `I searched our verified database, but could not locate active listings in ${targetLocName} matching your criteria.`)
          : activeLanguage === "ar"
          ? `بحثت في قاعدة بياناتنا المؤكدة، لكن لم أجد عقارات في ${targetLocName} تطابق معاييرك حالياً.`
          : (state.slots.excludedLocations && state.slots.excludedLocations.length > 0
              ? `Waxaan hubiyey guryaha ${targetLocName} ee miisaaniyaddaada ($${state.slots.maxPrice || 500}). Maadaama aad ${state.slots.excludedLocations.join(", ")} ka saartay, ma helin guri buuxiya dhammaan shuruudahaas oo ku jira miisaaniyaddaada. Ma rabtaa inaan miisaaniyadda wax yar kor u qaadno mise goobo kale ayaan eegnaa?`
              : `Waxaan hubiyey guryaha ${targetLocName}, laakiin kuma helin guri buuxiya dhammaan shuruudahaaga. Ma rabtaa inaan kordhino baaritaanka mise goobo kale ayaan eegnaa?`));

    if (returnedProperties.length === 0) {
      reply = fallbackReply;
    } else {
      const groundedAI = await generateGroundedAIDAResponse(
        {
          userMessage: message,
          language: activeLanguage,
          intent: "REAL_ESTATE_SEARCH",
          verifiedProperties: returnedProperties,
          totalMatches,
          contextSlots: state.slots,
          lastAssistantMessage: lastAssistantMsg,
          conversationHistory: history.map((h) => ({ role: h.role, content: h.content })),
        } as any,
        fallbackReply
      );
      reply = groundedAI?.replyText || fallbackReply;
    }
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

    const readiness = evaluateSearchReadiness(state, message, extractEntities(message), activeLanguage);
    if (readiness && readiness.responseType && readiness.responseType !== "PROPERTY_RESULTS") {
      responseType = readiness.responseType;
      // Preserve Gemini's direct, intelligent answer if provided; only fall back to clarification question if empty
      if (!reply && readiness.clarificationQuestion) {
        reply = readiness.clarificationQuestion;
      }
    } else if (conversationalDecision.contextUpdates?.responseType) {
      let rType: any = conversationalDecision.contextUpdates.responseType;
      if (rType === "REQUIREMENT_UPDATE") rType = "CLARIFICATION";
      if (rType === "GREETING" && (state.slots.purpose || state.slots.propertyType || state.slots.city || state.slots.maxPrice)) {
        rType = "CLARIFICATION";
      }
      responseType = rType;
    } else {
      const lower = message.toLowerCase();
      if (lower.match(/^(asc|salaam|hello|hi|hey|assalamu|nabad)\b/i) && !state.slots.purpose && !state.slots.city) {
        responseType = "GREETING";
      } else if (lower.includes("ku fiican") || lower.includes("advice") || lower.includes("talo")) {
        responseType = "ADVICE";
      } else if (conversationalDecision.contextUpdates && Object.keys(conversationalDecision.contextUpdates).length > 0) {
        responseType = "CLARIFICATION";
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
    properties: shouldRenderPropertyCards ? returnedProperties : [],
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
