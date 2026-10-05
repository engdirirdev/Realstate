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
  analyzeMessageScope,
  detectContextAwareIntent,
} from "./state-manager";
import {
  shouldInvokeAI,
  orchestrateAIUnderstanding,
  summarizeActiveResults,
  OrchestrationResult,
} from "../orchestration/ai-orchestrator";
import { generateGroundedAIDAResponse } from "../orchestration/response-generator";
import { AIUnderstandingInput } from "../providers/ai-provider";

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

  // 3. Phase 2B Intent & Entity Extraction on current message
  const rawIntent = classifyIntent(message);
  const entities = extractEntities(message);

  // 3b. Detect Context-Aware Intent
  const contextIntent = detectContextAwareIntent(message, state, entities, lastAssistantMsg);
  state.activeIntent = contextIntent.intent;

  // 3c. DUAL-AI INTELLIGENCE LAYER (OpenAI + Gemini in parallel with consensus)
  // Invoked selectively for ambiguous queries, typos, slang, or when deterministic confidence is low
  const aiInvocationCheck = shouldInvokeAI(message, state, contextIntent.confidence);
  let aiConsensusResult: OrchestrationResult | null = null;

  if (aiInvocationCheck.shouldInvoke) {
    try {
      const aiInput: AIUnderstandingInput = {
        userMessage: message,
        pendingQuestion: state.pendingQuestion,
        pendingSlot: state.pendingSlot,
        expectedEntityType: state.expectedEntityType,
        currentSlots: state.slots,
        activeResultSetSummary: summarizeActiveResults(state.activeResultSet),
        preferredLanguage: activeLanguage,
        conversationHistory: history.map((h) => ({ role: h.role, content: h.content })),
      };

      aiConsensusResult = await orchestrateAIUnderstanding(aiInput, activeLanguage);
      if (aiConsensusResult?.consensus?.understanding) {
        const u = aiConsensusResult.consensus.understanding;
        if (u.entities) {
          if (!entities.city && u.entities.city) entities.city = u.entities.city;
          if (!entities.propertyType && u.entities.propertyType) {
            entities.propertyType = u.entities.propertyType.toUpperCase();
          }
          if (!entities.bedrooms && u.entities.bedrooms) {
            entities.bedrooms = {
              operator: "eq",
              value: u.entities.bedrooms,
              rawMatchedText: `${u.entities.bedrooms} bedrooms`,
            };
          }
          if (!entities.price && u.entities.budget) {
            entities.price = {
              operator: "lte",
              maxPrice: u.entities.budget,
              rawMatchedText: `$${u.entities.budget}`,
            };
          }
          if (entities.isFurnished === undefined && u.entities.furnished !== null) {
            entities.isFurnished = u.entities.furnished;
          }
          if (entities.parking === undefined && u.entities.parking !== null) {
            entities.parking = u.entities.parking;
          }
        }

        // Apply pending slot answer if present
        if (u.pendingSlotAnswer && state.pendingSlot) {
          if (state.pendingSlot === "city" && typeof u.pendingSlotAnswer.value === "string") {
            entities.city = u.pendingSlotAnswer.value;
          } else if (state.pendingSlot === "budget" && u.pendingSlotAnswer.value) {
            const bVal = Number(u.pendingSlotAnswer.value);
            if (!isNaN(bVal)) {
              entities.price = {
                operator: "lte",
                maxPrice: bVal,
                rawMatchedText: `$${bVal}`,
              };
            }
          } else if (state.pendingSlot === "bedrooms" && u.pendingSlotAnswer.value) {
            const bedVal = Number(u.pendingSlotAnswer.value);
            if (!isNaN(bedVal)) {
              entities.bedrooms = {
                operator: "eq",
                value: bedVal,
                rawMatchedText: `${bedVal} bedrooms`,
              };
            }
          } else if (state.pendingSlot === "furnished" && u.pendingSlotAnswer.value !== null) {
            entities.isFurnished = Boolean(u.pendingSlotAnswer.value);
          } else if (state.pendingSlot === "parking" && u.pendingSlotAnswer.value !== null) {
            entities.parking = Boolean(u.pendingSlotAnswer.value);
          }
        }

        // Handle AI-detected corrections
        if (u.correction && u.correction.slot) {
          const slot = u.correction.slot;
          const newVal = u.correction.newValue;
          if (slot === "district" && newVal) state.slots.district = newVal;
          if (slot === "city" && newVal) state.slots.city = newVal;
          if (slot === "budget" && newVal) state.slots.maxPrice = Number(newVal);
          if (slot === "bedrooms" && newVal) state.slots.bedrooms = Number(newVal);
        }

        // Update active intent if AI has high confidence and local intent was AMBIGUOUS or generic
        if (
          u.confidence >= 0.85 &&
          (contextIntent.intent === "AMBIGUOUS" || contextIntent.intent === "REAL_ESTATE_SEARCH")
        ) {
          state.activeIntent = u.intent;
        }
      }
    } catch {
      // Graceful fallback to deterministic understanding
    }
  }

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
    state.activeResultSet.find((p) => p.id === state.referencedPropertyId) || state.activeResultSet[0]
  );

  let reply = "";
  let returnedProperties: ResultItem[] = [];
  let totalMatches = 0;
  let responseType: ResponseType = "PROPERTY_RESULTS";
  let shouldRenderPropertyCards = false;
  let attributeAnswer: any = null;

  // ───────────────────────────────────────────────────────────────────────────
  // ROUTE 0: SEARCH READINESS & CONVERSATIONAL INTERVIEW PRE-CHECK
  // (Prevents premature database searches, handles greetings, casual chat, FAQs)
  // ───────────────────────────────────────────────────────────────────────────
  const readiness = evaluateSearchReadiness(state, message, entities, activeLanguage, lastAssistantMsg);

  if (aiConsensusResult?.consensus?.clarificationRequired && aiConsensusResult.consensus.clarificationQuestion) {
    reply = aiConsensusResult.consensus.clarificationQuestion;
    responseType = "CLARIFICATION";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
    state.pendingQuestion = reply;
    state.pendingSlot = "city";
    state.expectedEntityType = "LOCATION";
  } else if (readiness.responseType === "RESET") {
    reply = generateNaturalDialogResponse({
      language: activeLanguage,
      templateType: "RESET",
      userMessage: message,
    });
    responseType = "RESET";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
  } else if (readiness.responseType === "CONFIRMATION") {
    reply = generateNaturalDialogResponse({
      language: activeLanguage,
      templateType: "CONFIRMATION",
      userMessage: message,
      lastAssistantMessage: lastAssistantMsg,
    });
    responseType = "CONFIRMATION";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
  } else if (readiness.responseType === "CORRECTION") {
    const lastChanged = delta.changedSlots[delta.changedSlots.length - 1];
    reply = generateNaturalDialogResponse({
      language: activeLanguage,
      templateType: "CORRECTION",
      userMessage: message,
      updatedSlot: lastChanged ? { name: lastChanged.slot, value: lastChanged.to } : undefined,
    });
    responseType = "CORRECTION";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
  } else if (readiness.responseType === "REQUIREMENT_UPDATE") {
    reply = readiness.clarificationQuestion || (activeLanguage === "so"
      ? "Waa hagaag, xogtaada waan cusboonaysiiyay. Waxaan ku sii wadayaa shuruudahaagii."
      : "Understood, updated your preferences.");
    responseType = "REQUIREMENT_UPDATE";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
  } else if (readiness.responseType === "AMBIGUOUS") {
    reply = generateNaturalDialogResponse({
      language: activeLanguage,
      templateType: "AMBIGUOUS",
      userMessage: message,
      clarificationQuestion: readiness.clarificationQuestion,
    });
    responseType = "AMBIGUOUS";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
  } else if (readiness.responseType === "PROPERTY_NEGOTIATION") {
    const target = resolution.targetProperty || state.activeResultSet.find(p => p.id === state.referencedPropertyId) || state.activeResultSet[0];
    const priceOfferMatch = message.match(/\$?(\d+)/);
    const offeredPrice = priceOfferMatch ? priceOfferMatch[1] : null;
    if (target) {
      if (activeLanguage === "so") {
        reply = offeredPrice
          ? `Qiimaha hadda waa $${target.price.toLocaleString()}. Ma awoodo inaan xaqiijiyo in milkiiluhu $${offeredPrice} ku aqbali doono, laakiin waxaan kuu gudbin karaa codsi negotiation ah.`
          : `Qiimaha hadda waa $${target.price.toLocaleString()}. Ma awoodo inaan xaqiijiyo qiimo dhimis ilaa milkiilaha lagala hadlo, laakiin waxaan kuu gudbin karaa codsi negotiation ah.`;
      } else if (activeLanguage === "ar") {
        reply = offeredPrice
          ? `السعر الحالي المدرج هو ${target.price.toLocaleString()} دولار. لا يمكنني تأكيد موافقة المالك على ${offeredPrice} دولار، ولكن يمكنني تقديم طلب تفاوض نيابة عنك.`
          : `السعر الحالي المدرج هو ${target.price.toLocaleString()} دولار. لا يمكنني ضمان أي تخفيض دون موافقة المالك، ولكن يمكنني تقديم طلب تفاوض لك.`;
      } else {
        reply = offeredPrice
          ? `The current listed price is $${target.price.toLocaleString()}. I cannot guarantee that the owner will accept $${offeredPrice}, but I can submit an official negotiation request on your behalf.`
          : `The current listed price is $${target.price.toLocaleString()}. I cannot guarantee a discount without owner approval, but I can submit a negotiation request for you.`;
      }
    } else {
      reply = activeLanguage === "so"
        ? `Kiro-Maal waxay kuu oggoshahay inaad dalbato negotiation guryaha qaarkood. Fadlan marka hore ii sheeg guriga aad doonayso si aan qiimihiisa u eegno una gudbino codsigaaga.`
        : `Kiro-Maal allows submitting negotiation requests for properties. Please specify which property you are interested in so we can review its price and forward your offer.`;
    }
    responseType = "PROPERTY_NEGOTIATION";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
  } else if (readiness.responseType === "PROPERTY_AVAILABILITY") {
    const target = resolution.targetProperty || state.activeResultSet.find(p => p.id === state.referencedPropertyId) || state.activeResultSet[0];
    if (target) {
      const isAvailable = target.status === "APPROVED" || (target as any).status === "AVAILABLE";
      if (activeLanguage === "so") {
        reply = isAvailable
          ? `Haa, xogta nidaamka Kiro-Maal waxay xaqiijinaysaa in property-kan (#${target.rank || 1} ${target.title}) uu hadda diyaar yahay (Available).`
          : `Maya, xogta nidaamka waxay muujinaysaa in property-kan aan hadda la heli karin.`;
      } else if (activeLanguage === "ar") {
        reply = isAvailable
          ? `نعم، تؤكد سجلات كيرو-مال أن هذا العقار (#${target.rank || 1} ${target.title}) متاح حالياً.`
          : `لا، تشير السجلات إلى أن هذا العقار غير متاح حالياً.`;
      } else {
        reply = isAvailable
          ? `Yes, verified records on Kiro-Maal confirm that property (#${target.rank || 1} ${target.title}) is currently available.`
          : `No, system records indicate that this property is currently not available.`;
      }
    } else {
      reply = activeLanguage === "so"
        ? `Fadlan ii sheeg guriga aad doonayso inaad hubiso helitaankiisa (availability).`
        : `Please specify which property you would like to check availability for.`;
    }
    responseType = "PROPERTY_AVAILABILITY";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
  } else if (readiness.responseType === "USER_UNCERTAIN") {
    reply = generateNaturalDialogResponse({
      language: activeLanguage,
      templateType: "USER_UNCERTAIN",
      userMessage: message,
    });
    responseType = "USER_UNCERTAIN";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
  } else if (readiness.responseType === "ADVICE") {
    reply = generateNaturalDialogResponse({
      language: activeLanguage,
      templateType: "ADVICE",
      userMessage: message,
    });
    responseType = "ADVICE";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
  } else if (readiness.responseType === "EDUCATION") {
    reply = generateNaturalDialogResponse({
      language: activeLanguage,
      templateType: "EDUCATION",
      userMessage: message,
    });
    responseType = "EDUCATION";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
  } else if (readiness.responseType === "GREETING") {
    reply = generateNaturalDialogResponse({
      language: activeLanguage,
      templateType: "GREETING",
      userName,
      userMessage: message,
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
  } else if (readiness.responseType === "OUT_OF_SCOPE") {
    const scope = analyzeMessageScope(message, entities, state);
    reply = generateNaturalDialogResponse({
      language: activeLanguage,
      templateType: "OUT_OF_SCOPE",
      outOfScopeCategory: scope.outOfScopeCategory,
      userMessage: message,
      hasActiveSearchContext: state.activeResultSet.length > 0 || Boolean(state.slots.city || state.slots.purpose),
    });
    responseType = "OUT_OF_SCOPE";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
  } else if (readiness.responseType === "MIXED_QUERY") {
    reply = generateNaturalDialogResponse({
      language: activeLanguage,
      templateType: "MIXED_QUERY",
      userMessage: message,
      slots: state.slots,
    });
    responseType = "MIXED_QUERY";
    shouldRenderPropertyCards = false;
    returnedProperties = [];
  } else if (readiness.responseType === "CLARIFICATION") {
    reply = generateNaturalDialogResponse({
      language: activeLanguage,
      templateType: readiness.missingSlot === "district" ? "DISTRICT_INQUIRY" : "CLARIFICATION",
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
    } else if (readiness.missingSlot === "district") {
      state.interviewStage = "AWAITING_DISTRICT";
    }
  }
  // ───────────────────────────────────────────────────────────────────────────
  // ROUTE 1: Specific Reference Resolution (Ordinals, Comparatives, Comparisons)
  // ───────────────────────────────────────────────────────────────────────────
  // A. Side-by-Side Comparison ("compare 1 and 2", "labadan kee jaban")
  else if (resolution.type === "COMPARISON" && resolution.comparedProperties?.length === 2) {
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
  else if (resolution.type !== "NONE" && resolution.targetProperty) {
    state.referencedPropertyId = resolution.targetProperty.id;

    // B. Cheaper Comparative ("which one is cheaper", "the cheaper one")
    if (resolution.type === "COMPARATIVE" && resolution.attributeQueried === "price") {
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
    // C. Direct Attribute Queries (e.g. "kii labaad ii sheeg parking ma leeyahay?", "Parking?", "Furnished?")
    else if (resolution.attributeQueried === "parking" && resolution.targetProperty) {
      const p = resolution.targetProperty;
      const isMissing = p.parking === null || p.parking === undefined;
      const rankWordSo = resolution.targetRank === 1 ? "koowaad" : resolution.targetRank === 2 ? "labaad" : resolution.targetRank === 3 ? "saddexaad" : `${resolution.targetRank || ""}aad`;
      const rankWordEn = resolution.targetRank === 1 ? "first" : resolution.targetRank === 2 ? "second" : resolution.targetRank === 3 ? "third" : `#${resolution.targetRank || ""}`;
      const rankWordAr = resolution.targetRank === 1 ? "الأول" : resolution.targetRank === 2 ? "الثاني" : resolution.targetRank === 3 ? "الثالث" : `#${resolution.targetRank || ""}`;

      if (isMissing) {
        if (activeLanguage === "so") {
          reply = `Xogta aan ka hayo property-kan kama muuqato in parking leeyahay.`;
        } else if (activeLanguage === "ar") {
          reply = `معلومات موقف السيارات لهذا العقار غير متوفرة في السجلات الحالية.`;
        } else {
          reply = `Parking information for this property is not available in our verified records.`;
        }
      } else {
        const hasParking = typeof p.parking === "boolean"
          ? p.parking
          : Boolean(p.parkingSpaces && p.parkingSpaces > 0);

        if (activeLanguage === "so") {
          reply = hasParking
            ? `Haa, property-ga ${rankWordSo} wuxuu leeyahay parking.`
            : `Maya, property-ga ${rankWordSo} ma laha parking gaar ah.`;
        } else if (activeLanguage === "ar") {
          reply = hasParking
            ? `نعم، العقار ${rankWordAr} يحتوي على موقف سيارات.`
            : `لا، العقار ${rankWordAr} لا يحتوي على موقف سيارات خاص.`;
        } else {
          reply = hasParking
            ? `Yes, the ${rankWordEn} property has parking.`
            : `No, the ${rankWordEn} property does not have dedicated parking.`;
        }
      }
      attributeAnswer = {
        attribute: "parking",
        value: !isMissing ? Boolean(p.parking || (p.parkingSpaces && p.parkingSpaces > 0)) : null,
        isAvailable: !isMissing,
        explanation: reply,
      };
      returnedProperties = [resolution.targetProperty];
      totalMatches = 1;
      responseType = "PROPERTY_DETAIL";
      shouldRenderPropertyCards = false;
    }
    else if (resolution.attributeQueried === "furnished" && resolution.targetProperty) {
      const p = resolution.targetProperty;
      const isMissing = p.furnished === null || p.furnished === undefined;
      const rankWordSo = resolution.targetRank === 1 ? "koowaad" : resolution.targetRank === 2 ? "labaad" : resolution.targetRank === 3 ? "saddexaad" : `${resolution.targetRank || ""}aad`;
      const rankWordEn = resolution.targetRank === 1 ? "first" : resolution.targetRank === 2 ? "second" : resolution.targetRank === 3 ? "third" : `#${resolution.targetRank || ""}`;
      const rankWordAr = resolution.targetRank === 1 ? "الأول" : resolution.targetRank === 2 ? "الثاني" : resolution.targetRank === 3 ? "الثالث" : `#${resolution.targetRank || ""}`;

      if (isMissing) {
        if (activeLanguage === "so") {
          reply = `Xogta aan ka hayo property-kan kama muuqato in alaab leeyahay.`;
        } else if (activeLanguage === "ar") {
          reply = `معلومات الأثاث لهذا العقار غير متوفرة في السجلات الحالية.`;
        } else {
          reply = `Furnished information for this property is not available in our verified records.`;
        }
      } else {
        const isFurnished = Boolean(p.furnished);
        if (activeLanguage === "so") {
          reply = isFurnished
            ? `Haa, property-ga ${rankWordSo} wuxuu leeyahay alaab (furnished).`
            : `Maya, property-ga ${rankWordSo} ma laha alaab (unfurnished).`;
        } else if (activeLanguage === "ar") {
          reply = isFurnished
            ? `نعم، العقار ${rankWordAr} مفروش بالكامل.`
            : `لا، العقار ${rankWordAr} غير مفروش.`;
        } else {
          reply = isFurnished
            ? `Yes, the ${rankWordEn} property is furnished.`
            : `No, the ${rankWordEn} property is unfurnished.`;
        }
      }
      attributeAnswer = {
        attribute: "furnished",
        value: !isMissing ? Boolean(p.furnished) : null,
        isAvailable: !isMissing,
        explanation: reply,
      };
      returnedProperties = [resolution.targetProperty];
      totalMatches = 1;
      responseType = "PROPERTY_DETAIL";
      shouldRenderPropertyCards = false;
    }
    else if (resolution.attributeQueried === "pool" && resolution.targetProperty) {
      const p = resolution.targetProperty;
      const desc = (p.description || "").toLowerCase();
      const hasPool = desc.includes("pool") || desc.includes("barkad") || desc.includes("swimming") || Boolean((p as any).pool) || Boolean((p as any).swimmingPool);
      if (hasPool) {
        reply = activeLanguage === "so"
          ? `Haa, xogta nidaamka waxay muujinaysaa in property-kan uu leeyahay swimming pool.`
          : activeLanguage === "ar"
          ? `نعم، السجلات تشير إلى أن هذا العقار يحتوي على مسبح.`
          : `Yes, verified records indicate this property features a swimming pool.`;
      } else {
        reply = activeLanguage === "so"
          ? `Xogta aan ka hayo property-kan kama muuqato in uu leeyahay swimming pool.`
          : activeLanguage === "ar"
          ? `المعلومات المتوفرة عن هذا العقار لا تؤكد وجود مسبح.`
          : `The available property information does not confirm a swimming pool.`;
      }
      attributeAnswer = {
        attribute: "pool",
        value: hasPool,
        isAvailable: hasPool,
        explanation: reply,
      };
      returnedProperties = [resolution.targetProperty];
      totalMatches = 1;
      responseType = "PROPERTY_DETAIL";
      shouldRenderPropertyCards = false;
    }
    else if (resolution.attributeQueried === "gym" && resolution.targetProperty) {
      const p = resolution.targetProperty;
      const desc = (p.description || "").toLowerCase();
      const hasGym = desc.includes("gym") || desc.includes("jimicsi") || desc.includes("fitness") || Boolean((p as any).gym);
      if (hasGym) {
        reply = activeLanguage === "so"
          ? `Haa, xogta nidaamka waxay muujinaysaa in property-kan uu leeyahay gym.`
          : activeLanguage === "ar"
          ? `نعم، السجلات تشير إلى أن هذا العقار يحتوي على صالة رياضية (gym).`
          : `Yes, verified records indicate this property features a gym.`;
      } else {
        reply = activeLanguage === "so"
          ? `Xogta aan ka hayo property-kan kama muuqato in uu leeyahay gym.`
          : activeLanguage === "ar"
          ? `المعلومات المتوفرة عن هذا العقar لا تؤكد وجود صالة رياضية.`
          : `The available property information does not confirm a gym.`;
      }
      attributeAnswer = {
        attribute: "gym",
        value: hasGym,
        isAvailable: hasGym,
        explanation: reply,
      };
      returnedProperties = [resolution.targetProperty];
      totalMatches = 1;
      responseType = "PROPERTY_DETAIL";
      shouldRenderPropertyCards = false;
    }
    else if (resolution.attributeQueried === "bedrooms" && resolution.targetProperty) {
      const p = resolution.targetProperty;
      const isMissing = p.bedrooms === null || p.bedrooms === undefined;
      if (isMissing) {
        reply = activeLanguage === "so"
          ? `Bedrooms information-ka property-kan kama muuqato xogta aan hayo.`
          : `Bedrooms information for this property is not available in our verified records.`;
      } else {
        reply = activeLanguage === "so"
          ? `Property-gan wuxuu leeyahay ${p.bedrooms} qol jiif.`
          : `This property features ${p.bedrooms} bedrooms.`;
      }
      attributeAnswer = {
        attribute: "bedrooms",
        value: p.bedrooms ?? null,
        isAvailable: !isMissing,
        explanation: reply,
      };
      returnedProperties = [resolution.targetProperty];
      totalMatches = 1;
      responseType = "PROPERTY_DETAIL";
      shouldRenderPropertyCards = false;
    }
    else if (resolution.attributeQueried === "bathrooms" && resolution.targetProperty) {
      const p = resolution.targetProperty;
      const isMissing = p.bathrooms === null || p.bathrooms === undefined;
      if (isMissing) {
        reply = activeLanguage === "so"
          ? `Bathrooms information-ka property-kan kama muuqato xogta aan hayo.`
          : `Bathrooms information for this property is not available in our verified records.`;
      } else {
        reply = activeLanguage === "so"
          ? `Property-gan wuxuu leeyahay ${p.bathrooms} musqul.`
          : `This property features ${p.bathrooms} bathrooms.`;
      }
      attributeAnswer = {
        attribute: "bathrooms",
        value: p.bathrooms ?? null,
        isAvailable: !isMissing,
        explanation: reply,
      };
      returnedProperties = [resolution.targetProperty];
      totalMatches = 1;
      responseType = "PROPERTY_DETAIL";
      shouldRenderPropertyCards = false;
    }
    else if (resolution.attributeQueried === "price" && resolution.targetProperty) {
      const p = resolution.targetProperty;
      const isMissing = p.price === null || p.price === undefined;
      if (isMissing) {
        reply = activeLanguage === "so"
          ? `Qiimaha property-kan kama muuqato xogta aan hayo.`
          : `Price information for this property is not available in our verified records.`;
      } else {
        reply = activeLanguage === "so"
          ? `Qiimaha property-gan (#${p.rank || 1}) waa $${p.price.toLocaleString()}.`
          : `The price for this property (#${p.rank || 1}) is $${p.price.toLocaleString()}.`;
      }
      attributeAnswer = {
        attribute: "price",
        value: p.price ?? null,
        isAvailable: !isMissing,
        explanation: reply,
      };
      returnedProperties = [resolution.targetProperty];
      totalMatches = 1;
      responseType = "PROPERTY_DETAIL";
      shouldRenderPropertyCards = false;
    }
    else if (resolution.attributeQueried === "location" && resolution.targetProperty) {
      const p = resolution.targetProperty;
      const isMissing = !p.city;
      if (isMissing) {
        reply = activeLanguage === "so"
          ? `Location information-ka property-kan kama muuqato xogta aan hayo.`
          : `Location information for this property is not available in our verified records.`;
      } else {
        reply = activeLanguage === "so"
          ? `Property-gan wuxuu ku yaal ${p.city}.`
          : `This property is located in ${p.city}.`;
      }
      attributeAnswer = {
        attribute: "location",
        value: p.city ?? null,
        isAvailable: !isMissing,
        explanation: reply,
      };
      returnedProperties = [resolution.targetProperty];
      totalMatches = 1;
      responseType = "PROPERTY_DETAIL";
      shouldRenderPropertyCards = false;
    }
    else if (resolution.attributeQueried === "status" && resolution.targetProperty) {
      const p = resolution.targetProperty;
      const isAvailable = p.status === "APPROVED" || (p as any).status === "AVAILABLE";
      reply = activeLanguage === "so"
        ? (isAvailable
            ? `Haa, property-gan (${p.title}) hadda waa diyaar (Available).`
            : `Maya, xogta nidaamka waxay muujinaysaa in property-kan aan hadda la heli karin.`)
        : (isAvailable
            ? `Yes, this property (${p.title}) is currently available.`
            : `No, system records indicate that this property is currently not available.`);
      attributeAnswer = {
        attribute: "status",
        value: isAvailable,
        isAvailable: true,
        explanation: reply,
      };
      returnedProperties = [resolution.targetProperty];
      totalMatches = 1;
      responseType = "PROPERTY_AVAILABILITY";
      shouldRenderPropertyCards = false;
    }
    // D. Ordinal / Pronoun details on single property ("the second one", "what is its price?")
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
    // HARD CONSTRAINTS: Status, City, Budget, Excluded Locations
    const searchFilter: any = {
      status: "APPROVED",
    };

    if (state.slots.city) {
      searchFilter.city = { contains: state.slots.city };
    }
    if (state.slots.district && (!state.slots.excludedLocations || !state.slots.excludedLocations.includes(state.slots.district))) {
      searchFilter.OR = [
        { location: { contains: state.slots.district } },
        { address: { contains: state.slots.district } },
        { title: { contains: state.slots.district } },
        { description: { contains: state.slots.district } },
      ];
    }
    // HARD CONSTRAINT: Excluded locations must NEVER be matched in database
    if (state.slots.excludedLocations && state.slots.excludedLocations.length > 0) {
      searchFilter.NOT = state.slots.excludedLocations.map((excl) => ({
        OR: [
          { location: { contains: excl } },
          { address: { contains: excl } },
          { title: { contains: excl } },
          { description: { contains: excl } },
        ],
      }));
    }
    if (state.slots.propertyType && state.slots.propertyType !== "HOUSE") {
      searchFilter.type = state.slots.propertyType;
    }

    // Bedroom filter: only enforce if bedrooms is a hard constraint, NOT a soft preference
    const hasSoftBedroomPref =
      state.softPreferences?.some((p) => p.includes("bedroom") || p.includes("qol")) ||
      state.slots.softPreferences?.some((p) => p.includes("bedroom") || p.includes("qol"));
    if (state.slots.bedrooms !== undefined && !hasSoftBedroomPref) {
      searchFilter.bedrooms = { gte: state.slots.bedrooms };
    }

    // HARD CONSTRAINT: Budget
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
    let matchedProps: any[] = [];
    try {
      matchedProps = await prisma.property.findMany({
        where: searchFilter,
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          manager: { select: { name: true } },
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      });
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
    // Re-verify EVERY property against user slots: strictly reject any property in an excluded location or violating budget
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
        state.slots
      ).isValid
    );

    // SOFT PREFERENCE RANKING (Section 4 & Section 9)
    // Rank the verified surviving properties based on soft preferences (3 beds preferred, 2 beds accepted, KM4 proximity, quiet area)
    const isBestRequest =
      message.toLowerCase().includes("ugu fiican") ||
      message.toLowerCase().includes("best") ||
      message.toLowerCase().includes("lacagtaas");
    const userReasoning = state.slots.userReasoning || [];
    const softPrefs = [...(state.softPreferences || []), ...(state.slots.softPreferences || [])];

    const scoredProps = validatedProps.map((p) => {
      let score = 0;
      // Soft bedroom preference: 3 beds preferred (+10), 2 beds acceptable (+6)
      if (softPrefs.some((pr) => pr.includes("3_bedrooms_preferred") || pr.includes("3 qol"))) {
        if (p.bedrooms === 3) score += 10;
        else if (p.bedrooms === 2) score += 6;
        else if (p.bedrooms && p.bedrooms >= 1) score += 2;
      } else if (softPrefs.some((pr) => pr.includes("2_bedrooms_acceptable") || pr.includes("2 qol"))) {
        if (p.bedrooms === 2) score += 8;
        else if (p.bedrooms === 3) score += 6;
      }
      // Workplace proximity (KM4)
      if (userReasoning.includes("works_or_travels_near_KM4") || softPrefs.includes("close_to_workplace")) {
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
      if (state.slots.maxPrice && p.price <= state.slots.maxPrice) {
        score += ((state.slots.maxPrice - p.price) / state.slots.maxPrice) * 3;
      }
      return { item: p, score };
    });

    scoredProps.sort((a, b) => b.score - a.score);
    const finalProps = scoredProps.slice(0, 5).map((entry, idx) => ({ ...entry.item, rank: idx + 1 }));

    if (finalProps.length > 0) {
      returnedProperties = finalProps;
      totalMatches = finalProps.length;
      shouldRenderPropertyCards = true;
      responseType = "PROPERTY_RESULTS";
      state.interviewStage = "IDLE";
      state = attachActiveResultSet(state, returnedProperties);

      reply = isBestRequest
        ? `Waxaan kuu helay guryaha ugu fiican ee ku jira miisaaniyaddaada ($${state.slots.maxPrice || 500}). Halkan ka eeg xulashooyinka ugu dhow shuruudahaaga:`
        : delta.isQueryModification && delta.changedSlots.length > 0
        ? generateNaturalDialogResponse({
            language: activeLanguage,
            templateType: "SLOT_UPDATE",
            updatedSlot: { name: delta.changedSlots[0].slot, value: delta.changedSlots[0].to },
            properties: returnedProperties,
            totalMatches,
            slots: state.slots,
          })
        : generateNaturalDialogResponse({
            language: activeLanguage,
            templateType: "SEARCH_RESULTS",
            properties: returnedProperties,
            totalMatches,
          });
    } else {
      returnedProperties = [];
      totalMatches = 0;
      shouldRenderPropertyCards = false;
      responseType = "NO_RESULTS";

      // Query alternative verified listings in the city / budget to provide grounded context
      let alternativeProps: ResultItem[] = [];
      if (state.slots.city || state.slots.maxPrice) {
        try {
          const alts = await prisma.property.findMany({
            where: {
              status: "APPROVED",
              ...(state.slots.city ? { city: { contains: state.slots.city } } : {}),
              ...(state.slots.maxPrice ? { price: { lte: Math.round(state.slots.maxPrice * 1.25) } } : {}),
            },
            take: 3,
            orderBy: { price: "asc" },
          });
          alternativeProps = alts.map((p, idx) => ({
            rank: idx + 1,
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
            statusLabel: "Available",
            statusEmoji: "🟢",
            imageUrl: null,
            managerName: "Verified Manager",
            description: p.description || "",
            location: p.location,
            address: p.address,
          }));
        } catch {
          alternativeProps = [];
        }
      }

      // Generate a context-aware zero results response acknowledging user's specific exclusions and preferences
      if (activeLanguage === "so") {
        if (state.slots.excludedLocations && state.slots.excludedLocations.length > 0) {
          const excl = state.slots.excludedLocations.join(", ");
          reply = `Waxaan hubiyey guryaha ${state.slots.city || "Mogadishu"} ee miisaaniyaddaada ($${state.slots.maxPrice || 500}). Maadaama aad ${excl} ka saartay, ma helin guri buuxiya dhammaan shuruudahaas oo ku jira miisaaniyaddaada. Ma rabtaa inaan miisaaniyadda wax yar kor u qaadno mise goobo kale ayaan eegnaa?`;
        } else {
          reply = generateNaturalDialogResponse({
            language: activeLanguage,
            templateType: "ZERO_RESULTS",
            slots: state.slots,
          });
        }
      } else {
        reply = generateNaturalDialogResponse({
          language: activeLanguage,
          templateType: "ZERO_RESULTS",
          slots: state.slots,
        });
      }
    }
  }

  // UNIFIED GROUNDED AI RESPONSE GENERATION
  // Every conversational turn (greetings, confirmations, casual conversation, clarifications,
  // advice, in-set references, property details, comparisons, searches, zero results)
  // is passed to Gemini with the raw user message, verified properties, and full conversation history.
  if (
    responseType !== "OUT_OF_SCOPE" &&
    responseType !== "VALUATION"
  ) {
    const fallbackTemplateReply = reply;
    try {
      const groundedAI = await generateGroundedAIDAResponse(
        {
          userMessage: message,
          language: activeLanguage,
          intent: (state.activeIntent as any) || responseType,
          verifiedProperties: shouldRenderPropertyCards ? returnedProperties : (resolution.type !== "NONE" ? state.activeResultSet : []),
          referencedProperty: resolution.targetProperty || (returnedProperties.length === 1 ? returnedProperties[0] : undefined),
          attributeAnswer,
          contextSlots: state.slots,
          lastAssistantMessage: lastAssistantMsg,
          conversationHistory: history.map((h) => ({ role: h.role, content: h.content })),
        },
        fallbackTemplateReply
      );
      if (groundedAI?.replyText) {
        reply = groundedAI.replyText;
      }
    } catch {
      // Deterministic fallback safely preserved
    }
  }

  state.lastAssistantMessage = reply;
  state.lastUserMessage = message;
  state.lastUserRequest = message;

  // Manage pending slots and question tracking for multi-turn context continuity
  if (responseType === "CLARIFICATION" && readiness.missingSlot) {
    state.pendingSlot = readiness.missingSlot;
    state.expectedEntityType =
      readiness.missingSlot === "city" || readiness.missingSlot === "district"
        ? "LOCATION"
        : readiness.missingSlot === "budget"
        ? "CURRENCY"
        : readiness.missingSlot === "bedrooms"
        ? "NUMBER"
        : "TEXT";
    state.pendingQuestion = reply;
  } else if (responseType === "PROPERTY_RESULTS" || responseType === "RESET") {
    state.pendingSlot = undefined;
    state.expectedEntityType = undefined;
    state.pendingQuestion = undefined;
  }

  if (reply.includes("Kiro-Maal") || reply.includes("Real Estate Assistant")) {
    state.lastAssistantClaim = "AIDA Kiro-Maal Real Estate Assistant";
  } else if (returnedProperties.length > 0) {
    state.lastAssistantClaim = `Showed ${returnedProperties.length} verified properties`;
  }

  const searchReadinessValue = resolution.type !== "NONE"
    ? "IN_SET_REFERENCE"
    : readiness.isReady
    ? "READY"
    : readiness.responseType === "CLARIFICATION"
    ? "NEEDS_CLARIFICATION"
    : (readiness.responseType as any);

  return {
    reply,
    properties: returnedProperties,
    intent: state.activeIntent || rawIntent.intent,
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
    updatedState: state,
    responseType,
    shouldRenderPropertyCards,
    shouldRenderCards: shouldRenderPropertyCards,
    activeSearchCriteria: state.slots,
    referencedPropertyIds: returnedProperties.map((p) => p.id),
  };
}
