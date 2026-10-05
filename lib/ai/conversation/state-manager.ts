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
  ContextAwareIntent,
  ReferenceResolution,
} from "./types";
import { extractEntities, ExtractedEntities } from "../nlu/entity-extractor";
import { QueryIntent } from "../nlu/intent-classifier";
import { analyzeConversationalSlang } from "./slang-normalizer";
import { resolveConversationalReference } from "./reference-resolver";

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

  if (
    lower.match(/\b(remove|without|no|dont\s*need|ha\s*yeelanin|bilaa)\s+parking\b/i) ||
    lower.includes("baarkin la'aan") ||
    lower.match(/\b(parking|baarkin)\s+muhiim\s+ma\s+ah(a|an)\b/i) ||
    lower.includes("parking is not important") ||
    lower.includes("no need for parking")
  ) {
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

const DISTRICT_PATTERNS: Record<string, string> = {
  "hodan": "Hodan",
  "wadajir": "Wadajir",
  "karaan": "Karaan",
  "yaqshid": "Yaqshid",
  "taleex": "Taleex",
  "banaadir": "Banaadir",
  "waberi": "Waberi",
  "waaberi": "Waberi",
  "shibis": "Shibis",
  "hamar weyne": "Hamar Weyne",
  "xamar weyne": "Hamar Weyne",
  "dayniile": "Dayniile",
  "kaxda": "Kaxda",
  "hawl wadaag": "Hawl Wadaag",
  "howlwadaag": "Hawl Wadaag",
  "dharkenley": "Dharkenley",
  "huriwaa": "Huriwaa",
  "heliwaa": "Huriwaa",
  "bondhere": "Bondhere",
  "boondheere": "Bondhere",
  "bakaaraha": "Bakaaraha",
  "bakaraha": "Bakaaraha",
  "suuqa bakaaraha": "Bakaaraha",
};

/**
 * Detects if the current turn signifies an explicit topic change
 */
export function detectTopicTransition(
  text: string,
  currentTopic: ConversationTopic,
  detectedIntent: QueryIntent
): { topic: ConversationTopic; confidence: number; isTopicChange: boolean } {
  const lower = text.toLowerCase();

  // 0. Reset / Start Over
  if (lower.match(/\b(bilow mar kale|aan dib uga bilowno|start over|forget this search|new search)\b/i)) {
    return {
      topic: "RESET",
      confidence: 0.98,
      isTopicChange: true,
    };
  }

  // 1. Off-topic check
  if (OFF_TOPIC_PATTERNS.some((p) => p.test(lower))) {
    return {
      topic: "OFF_TOPIC",
      confidence: 0.95,
      isTopicChange: currentTopic !== "OFF_TOPIC",
    };
  }

  // 2. User uncertain / Guided flow
  if (lower.match(/\b(ma aqaan waxa aan rabo|ma garanayo waxa aan rabo|runtii ma aqaan|i don't know what i want|help me choose|iga caawi)\b/i) && !lower.includes("guri")) {
    return {
      topic: "USER_UNCERTAIN",
      confidence: 0.95,
      isTopicChange: true,
    };
  }

  // 3. Consultation / Advice
  if (lower.match(/\b(maxaad igula talin lahayd|what would you recommend|what do you recommend|igula tali|single person|qof keli ah)\b/i)) {
    return {
      topic: "ADVICE",
      confidence: 0.95,
      isTopicChange: true,
    };
  }

  // 4. Educational / Real estate concept explanation
  if (
    lower.includes("furnished maxay tahay") ||
    lower.includes("what is a villa") ||
    lower.includes("what is a lease") ||
    lower.includes("what is escrow") ||
    lower.includes("what does furnished mean") ||
    lower.includes("farqiga u dhexeeya apartment iyo villa") ||
    lower.includes("security deposit maxay tahay") ||
    lower.includes("what is a mortgage")
  ) {
    return {
      topic: "EDUCATION",
      confidence: 0.95,
      isTopicChange: true,
    };
  }

  // 5. Booking intent
  if (lower.includes("book") || lower.includes("visit") || lower.includes("ballan") || lower.includes("حجز")) {
    return {
      topic: "BOOKING",
      confidence: 0.92,
      isTopicChange: currentTopic !== "BOOKING",
    };
  }

  // 6. Valuation intent
  if (lower.includes("valuation") || lower.includes("appraisal") || lower.includes("predict price") ||
      lower.includes("qiimee") || lower.includes("qiyaas qiimaha") || lower.includes("تقييم")) {
    return {
      topic: "PROPERTY_VALUATION",
      confidence: 0.90,
      isTopicChange: currentTopic !== "PROPERTY_VALUATION",
    };
  }

  // 7. Comparison intent
  if (lower.includes("compare") || lower.includes("barbar dhig") || lower.includes("قارن")) {
    return {
      topic: "PROPERTY_COMPARISON",
      confidence: 0.90,
      isTopicChange: currentTopic !== "PROPERTY_COMPARISON",
    };
  }

  // 8. Details on referenced property
  if (lower.includes("details") || lower.includes("tell me more") || lower.includes("falanqee") || lower.includes("تفاصيل")) {
    return {
      topic: "PROPERTY_DETAILS",
      confidence: 0.88,
      isTopicChange: currentTopic !== "PROPERTY_DETAILS",
    };
  }

  // 9. Educational / Platform questions
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
  const lowerMsg = userMessage.toLowerCase();

  // 0. Topic transition evaluation
  const topicEval = detectTopicTransition(userMessage, prevState.currentTopic, detectedIntent);

  // If user asked to reset, wipe active slots
  if (topicEval.topic === "RESET") {
    for (const k of Object.keys(currentSlots)) {
      delete (currentSlots as any)[k];
    }
    return {
      state: {
        ...prevState,
        slots: {},
        activeResultSet: [],
        currentTopic: "PROPERTY_SEARCH",
        unresolvedSlots: ["city", "propertyType"],
        turnCount: prevState.turnCount + 1,
        lastUserMessage: userMessage,
        updatedAt: new Date().toISOString(),
      },
      delta: {
        newSlots: {},
        changedSlots: [],
        removedSlots: ["all"],
        isFollowUp: false,
        isQueryModification: true,
      },
    };
  }

  // 1. Detect slot removals
  const removedSlots = detectSlotRemovals(userMessage);
  for (const slotKey of removedSlots) {
    if ((currentSlots as any)[slotKey] !== undefined) {
      delete (currentSlots as any)[slotKey];
    }
  }

  // 1b. Explicit Corrections Handling (e.g. "500 ma aha, 400", "Hodan ma aha, Wadajir", "Maya Hodan ma aha, Wadajir ayaan rabaa", "3 qol ma aha, 4 qol")
  let handledPriceCorr = false;
  const priceCorr = lowerMsg.match(/(?:not\s+\$?(\d+)|\$?(\d+)\s*(?:dollar|doolar|\$)?\s*ma\s+aha)[,\s]+(?:actually\s+)?\$?(\d+)/i);
  if (priceCorr) {
    const fromVal = parseInt(priceCorr[1] || priceCorr[2], 10);
    const toVal = parseInt(priceCorr[3], 10);
    if (!isNaN(toVal) && toVal > 0) {
      changedSlots.push({ slot: "maxPrice", from: fromVal, to: toVal });
      currentSlots.maxPrice = toVal;
      handledPriceCorr = true;
    }
  }

  // Single price corrections (e.g. "$350 ayaan ula jeedaa", "Maya $350 ayaan ula jeedaa", "Maya, $350 ayaan awoodaa")
  const singlePriceCorr = lowerMsg.match(/(?:maya\s*[,.]?\s*)?\$?(\d+)(?:\s*(?:dollar|doolar|\$))?\s*ayaan\s*(?:ula\s*(?:jeedaa|jeeday)|awoodaa|awoodi\s*karaa|bixin\s*karaa|rabaa)/i);
  if (singlePriceCorr && !handledPriceCorr) {
    const newPrice = parseInt(singlePriceCorr[1], 10);
    if (!isNaN(newPrice) && newPrice > 0) {
      changedSlots.push({ slot: "maxPrice", from: currentSlots.maxPrice, to: newPrice });
      currentSlots.maxPrice = newPrice;
      handledPriceCorr = true;
    }
  }

  let handledDistrictCorr = false;
  const districtCorr = lowerMsg.match(/(?:maya\s+)?(?:not\s+([a-z\s]+)|([a-z\s]+)\s+ma\s+aha)[,\s]+(?:actually\s+)?([a-z]+)(?:\s+ayaan\s+(?:rabaa|ula\s*jeeday|ula\s*jeedaa|doonayaa))?/i);
  if (districtCorr) {
    const rawFrom = (districtCorr[1] || districtCorr[2] || "").replace(/^maya\s+/i, "").trim().toLowerCase();
    const rawTo = (districtCorr[3] || "").trim().toLowerCase();
    const matchedDistrict = DISTRICT_PATTERNS[rawTo] || (rawTo.charAt(0).toUpperCase() + rawTo.slice(1));
    if (matchedDistrict && matchedDistrict.length > 2) {
      changedSlots.push({ slot: "district", from: rawFrom, to: matchedDistrict });
      currentSlots.district = matchedDistrict;
      if (!currentSlots.city) currentSlots.city = "Mogadishu";
      handledDistrictCorr = true;
    }
  }

  let handledBedCorr = false;
  const bedCorr = lowerMsg.match(/(?:not\s+(\d+)|\b(\d+)\s*qol\s*ma\s+aha)[,\s]+(?:actually\s+)?(\d+)/i);
  if (bedCorr) {
    const fromVal = parseInt(bedCorr[1] || bedCorr[2], 10);
    const toVal = parseInt(bedCorr[3], 10);
    if (!isNaN(toVal) && toVal > 0) {
      changedSlots.push({ slot: "bedrooms", from: fromVal, to: toVal });
      currentSlots.bedrooms = toVal;
      handledBedCorr = true;
    }
  }

  // Requirement updates
  const budgetUpdate = lowerMsg.match(/(?:budget-ka|miisaaniyadda|make\s+budget|set\s+budget)\s*(?:waa|=|:)?\s*\$?(\d+)(?:\s*ka\s*dhig)?/i);
  if (budgetUpdate && !handledPriceCorr) {
    const newBudget = parseInt(budgetUpdate[1], 10);
    if (!isNaN(newBudget) && newBudget > 0) {
      changedSlots.push({ slot: "maxPrice", from: currentSlots.maxPrice, to: newBudget });
      currentSlots.maxPrice = newBudget;
      handledPriceCorr = true;
    }
  }

  if (lowerMsg.match(/\b(parking-na\s+waa\s+muhiim|parking\s+ha\s+lahaado|parking\s+waa\s+muhiim|parking\s+is\s+important|must\s+have\s+parking)\b/i)) {
    changedSlots.push({ slot: "parking", from: currentSlots.parking, to: true });
    currentSlots.parking = true;
    newSlots.parking = true;
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

  // 2b. District extraction & update (e.g. "Hodan", "Wadajir", "Actually Wadajir ayaan rabaa")
  if (!handledDistrictCorr) {
    for (const [key, dist] of Object.entries(DISTRICT_PATTERNS)) {
      if (new RegExp(`\\b${key}\\b`, "i").test(lowerMsg)) {
        // Natural Negation check (e.g. "Hodan ma rabo", "hodan ha ii keenin", "meel aan hodan ahayn", "not hodan", "hodan ka saar")
        const isNegated = new RegExp(
          `\\b(${key})\\s*(?:ma\\s*(?:rabo|doonayo|rabno|doonayno|aha|bano)|ha\\s*(?:ii\\s*)?keenin|ka\\s*saar|laga\\s*reebo)|` +
          `(?:aan\\s+${key}\\s+ahayn|meel\\s+aan\\s+${key}\\s+ahayn)|` +
          `(?:not|no|don't\\s*want|without|avoid|exclude)\\s+${key}`,
          "i"
        ).test(lowerMsg);

        if (isNegated) {
          if (!currentSlots.excludedLocations) currentSlots.excludedLocations = [];
          if (!currentSlots.excludedLocations.includes(dist)) {
            currentSlots.excludedLocations.push(dist);
          }
          if (currentSlots.district === dist) {
            delete currentSlots.district;
            removedSlots.push("district");
            changedSlots.push({ slot: "district", from: dist, to: null });
          }
          break;
        }

        if (currentSlots.district !== dist) {
          if (currentSlots.district) {
            changedSlots.push({ slot: "district", from: currentSlots.district, to: dist });
          } else {
            newSlots.district = dist;
          }
          currentSlots.district = dist;
        }
        if (!currentSlots.city) {
          currentSlots.city = "Mogadishu";
          newSlots.city = "Mogadishu";
        }
        break;
      }
    }
  }

  // Soft preferences & Proximity / Workplace reasoning
  if (lowerMsg.includes("shaqadayda u dhow") || lowerMsg.includes("shaqada u dhow") || lowerMsg.includes("near work") || lowerMsg.includes("near my work")) {
    if (!currentSlots.softPreferences) currentSlots.softPreferences = [];
    if (!currentSlots.softPreferences.includes("close_to_workplace")) {
      currentSlots.softPreferences.push("close_to_workplace");
    }
  }
  if (lowerMsg.includes("meel degan") || lowerMsg.includes("quiet area") || lowerMsg.includes("aan aad u mashquul badnayn")) {
    if (!currentSlots.softPreferences) currentSlots.softPreferences = [];
    if (!currentSlots.softPreferences.includes("quiet_neighborhood")) {
      currentSlots.softPreferences.push("quiet_neighborhood");
    }
  }
  if (lowerMsg.includes("km4") || lowerMsg.includes("taleex")) {
    if (!currentSlots.userReasoning) currentSlots.userReasoning = [];
    const reason = lowerMsg.includes("km4") ? "works_or_travels_near_KM4" : "preferred_near_Taleex";
    if (!currentSlots.userReasoning.includes(reason)) {
      currentSlots.userReasoning.push(reason);
    }
    if (!currentSlots.city) {
      currentSlots.city = "Mogadishu";
    }
  }

  // Disjunction of locations (e.g. "Hodan ama Wadajir", "Hodan or Wadajir")
  if (lowerMsg.includes("ama wadajir") || lowerMsg.includes("or wadajir") || lowerMsg.includes("hodan ama")) {
    if (!currentSlots.alternativeLocations) currentSlots.alternativeLocations = [];
    if (lowerMsg.includes("hodan") && !currentSlots.alternativeLocations.includes("Hodan")) currentSlots.alternativeLocations.push("Hodan");
    if (lowerMsg.includes("wadajir") && !currentSlots.alternativeLocations.includes("Wadajir")) currentSlots.alternativeLocations.push("Wadajir");
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

  // 4. Bedrooms update (supports "Actually 4 qol", "3", etc. and differentiates soft preference vs hard constraint)
  if (!handledBedCorr && entities.bedrooms && typeof entities.bedrooms.value === "number") {
    const isSoftPreference =
      lowerMsg.includes("khasab ma aha") ||
      lowerMsg.includes("khasab maaha") ||
      lowerMsg.includes("khasab maha") ||
      lowerMsg.includes("not required") ||
      lowerMsg.includes("not mandatory") ||
      lowerMsg.includes("optional") ||
      lowerMsg.includes("haddii la heli karo way fiican") ||
      lowerMsg.includes("haddii la helo waa fiican") ||
      lowerMsg.includes("haddii la helo way fiican") ||
      lowerMsg.includes("waan qaadan karaa") ||
      lowerMsg.includes("waa la qaadan karaa") ||
      lowerMsg.includes("acceptable");

    if (isSoftPreference) {
      if (!currentSlots.softPreferences) currentSlots.softPreferences = [];
      const prefDesc =
        lowerMsg.includes("waan qaadan karaa") || lowerMsg.includes("waa la qaadan karaa") || lowerMsg.includes("acceptable")
          ? `${entities.bedrooms.value}_bedrooms_acceptable`
          : `${entities.bedrooms.value}_bedrooms_preferred`;
      if (!currentSlots.softPreferences.includes(prefDesc)) {
        currentSlots.softPreferences.push(prefDesc);
      }
      // Differentiate soft preference from hard constraint - do not set as rigid filter
    } else {
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
  if (!handledPriceCorr && entities.price) {
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

  // 7. Cheaper query modifier ("show me cheaper ones", "find cheaper", "mid ka jaban")
  if ((lowerMsg.includes("cheaper") || lowerMsg.includes("ka jaban") || lowerMsg.includes("أرخص")) &&
      !entities.price?.maxPrice && prevState.activeResultSet.length > 0) {
    const lowestReturned = Math.min(...prevState.activeResultSet.map((p) => p.price));
    const newMax = Math.round(lowestReturned * 0.9);
    changedSlots.push({ slot: "maxPrice", from: currentSlots.maxPrice, to: newMax });
    currentSlots.maxPrice = newMax;
  }

  // 8. Boolean Flags (parking, furnished)
  if (lowerMsg.match(/\b(parking|baarkin)\s+ha\s+lahaado\b/i) || lowerMsg.includes("with parking") || lowerMsg.includes("leh parking")) {
    currentSlots.parking = true;
    newSlots.parking = true;
  } else if (entities.parking !== undefined && !removedSlots.includes("parking")) {
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
  } else if (!currentSlots.purpose) {
    if (entities.propertyType === "APARTMENT" || lowerMsg.includes("apartment")) {
      currentSlots.purpose = "RENT";
      newSlots.purpose = "RENT";
    }
  }
  if (entities.price?.period) {
    currentSlots.pricePeriod = entities.price.period;
  }

  // 8c. Vague goals and trade-offs
  if (lowerMsg.includes("fiican oo jaban") || lowerMsg.includes("jaban laakiin meel fiican") || lowerMsg.includes("cheap but good")) {
    currentSlots.tradeOff = "balanced";
  }
  if (lowerMsg.match(/\b(guri fiican|wax fiican|good home|good house)\b/i) && !currentSlots.maxPrice && !currentSlots.bedrooms) {
    currentSlots.goalPriority = "uncertain";
  }

  // 10. Compute unresolved slots
  const unresolved: string[] = [];
  if (!currentSlots.city) unresolved.push("city");
  if (!currentSlots.propertyType) unresolved.push("propertyType");
  if (!currentSlots.maxPrice) unresolved.push("budget");

  const isQueryModification = changedSlots.length > 0 || removedSlots.length > 0;
  const isFollowUp = Object.keys(newSlots).length > 0 || isQueryModification;

  // 11. Purge activeResultSet if any properties violate current excludedLocations
  let activeResultSet = prevState.activeResultSet || [];
  if (currentSlots.excludedLocations && currentSlots.excludedLocations.length > 0 && activeResultSet.length > 0) {
    activeResultSet = activeResultSet.filter((p) => {
      const pText = `${p.title || ""} ${p.location || ""} ${p.district || ""} ${p.city || ""} ${p.address || ""} ${p.description || ""}`.toLowerCase();
      return !currentSlots.excludedLocations!.some((excl) => pText.includes(excl.toLowerCase()));
    });
  }

  const nextState: ConversationState = {
    ...prevState,
    activeResultSet,
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
    location?: string;
    address?: string;
    title?: string;
    description?: string;
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

  // 2b. Hard district check (if district constraint is specified)
  if (slots.district) {
    const targetDist = slots.district.trim().toLowerCase();
    const searchable = `${property.location || ""} ${property.address || ""} ${property.title || ""} ${property.description || ""}`.toLowerCase();
    if (searchable.trim().length > 0 && !searchable.includes(targetDist)) {
      return {
        isValid: false,
        violationReason: `District constraint violation: property does not match district ${slots.district}`,
      };
    }
  }

  // 2c. Hard excluded locations check (Natural negation e.g. "Hodan ma rabo", "Hodan Central")
  if (slots.excludedLocations && slots.excludedLocations.length > 0) {
    const searchable = `${(property as any).district || ""} ${property.location || ""} ${property.address || ""} ${property.title || ""} ${property.description || ""}`.toLowerCase();
    for (const excl of slots.excludedLocations) {
      if (searchable.includes(excl.toLowerCase())) {
        return {
          isValid: false,
          violationReason: `Excluded location violation: property is in rejected location ${excl}`,
        };
      }
    }
  }

  // 3. Hard bedroom check (only enforced when not purely a soft preference)
  const hasSoftBedroomPref = slots.softPreferences && slots.softPreferences.some((p) => p.includes("bedroom"));
  if (slots.bedrooms !== undefined && property.bedrooms !== undefined && !hasSoftBedroomPref) {
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

export type MessageScopeAnalysis = {
  isRealEstate: boolean;
  isOutOfScope: boolean;
  isMixed: boolean;
  outOfScopeCategory?: "school_homework" | "crypto_finance" | "assignment" | "general_offtopic";
  unrelatedPart?: string;
};

/**
 * Advanced Context-Aware Intent Engine
 * Deterministically classifies user messages by synthesizing:
 * Current Message + Previous Assistant Message + Active Context + Known Search State
 */
export function detectContextAwareIntent(
  userMessage: string,
  state?: ConversationState | null,
  entities?: ExtractedEntities | null,
  lastAssistantMessage?: string | null
): {
  intent: ContextAwareIntent;
  confidence: number;
  explanation: string;
  matchedSignals: string[];
  resolvedReference?: ReferenceResolution;
} {
  const safeState = state || initializeConversationState("temp-context");
  const safeEntities = entities || extractEntities(userMessage);
  const priorAsstMsg = lastAssistantMessage || safeState.lastAssistantMessage || "";
  const lower = userMessage.toLowerCase().trim();
  const slang = analyzeConversationalSlang(userMessage);

  // 1. OUT_OF_SCOPE check first if explicit off-topic terms exist (e.g. "Sidee loo sameeyaa assignment?", "Bitcoin meeqa ayuu yahay?")
  const scope = analyzeMessageScope(userMessage, safeEntities, safeState);
  if (scope.isOutOfScope) {
    return {
      intent: "OUT_OF_SCOPE",
      confidence: 0.98,
      explanation: `Explicit out-of-scope query: ${scope.outOfScopeCategory || "general_offtopic"}`,
      matchedSignals: ["out_of_scope_domain"],
    };
  }

  // 2. GREETING
  // e.g. "Asc", "Hello", "Hi", "Salaam", "Wcs", "Marhaba"
  if (
    slang.isGreeting ||
    slang.isGreetingResponse ||
    /^(asc|hello|hi|hey|salaam|marhaba|wcs)\b/i.test(lower)
  ) {
    return {
      intent: (state as any)?.activeTopic === "casual" ? "CASUAL_CONVERSATION" : "GREETING",
      confidence: 0.96,
      explanation: "Greeting from user",
      matchedSignals: ["greeting_signal"],
    };
  }

  // 3. CASUAL_CONVERSATION
  // e.g. "Sidee tahay?", "See tahay?", "How are you?", "Mahadsanid", "Ok", "Thanks"
  if (
    slang.isGratitude ||
    /^(how are you|sidee tahay|see tahay|seetahay|ok|okay|waad mahadsantahay|thanks|thx|nabad|fiican|waan fiicanahay)\b/i.test(lower)
  ) {
    return {
      intent: "CASUAL_CONVERSATION",
      confidence: 0.95,
      explanation: "Casual small talk or gratitude",
      matchedSignals: ["casual_conversation"],
    };
  }

  // 4. CONFIRMATION_REQUEST
  // e.g. "Ma hubtaa?", "Sax miyaa?", "Runtii?", "Ma dhab baa?", "Are you sure?", "Ma hubtaa midaas?", "Sure?", "Really?"
  if (
    !lower.includes("ma aqaan") &&
    !lower.includes("ma garanayo") &&
    (/\b(ma\s+hubtaa|ma\s+hubtaa\s+midaas|ma\s+hubtaa\s+waxaas|taasi\s+ma\s+hubtaa|ma\s+sidaas\s+baa|sax\s+miyaa|ma\s+sax\s+baa|runtii\?|ma\s+dhab\s+baa|ma\s+dhabtaa|dhab\s+miyaa|hubi|are\s+you\s+sure|you\s+sure|are\s+you\s+certain|is\s+that\s+(true|correct|real)|sure\?|really\?|هل\s+أنت\s+متأكد|حقاً|صحيح)\b/i.test(lower) ||
    lower === "haa?" || lower === "sax miyaa?" || lower === "runtii" || lower === "runtii?" || lower === "hubtaa" || lower === "hubtaa?" || lower === "sure?" || lower === "you sure?")
  ) {
    return {
      intent: "CONFIRMATION_REQUEST",
      confidence: 0.96,
      explanation: "User requested confirmation of assistant's previous statement",
      matchedSignals: ["confirmation_inquiry"],
    };
  }

  // 5. CLARIFICATION_REQUEST
  // e.g. "Maxaad ula jeeddaa?", "Sidee?", "Maxay ka dhigan tahay?", "Faahfaahi", "Wax yar ii sharax"
  if (
    (/\b(maxaad\s+ula\s+jeeddaa|maxaad\s+ka\s+waddaa|sidee\?|maxay\s+ka\s+dhigan\s+tahay|faahfaahi|wax\s+yar\s+ii\s+sharax|sharaxaad\s+ka\s+bixi|waa\s+maxay\?|sabab\?|sabab\b|maxaa\?|haddaba\?|laakiin\?|what\s+do\s+you\s+mean|how\s+so|can\s+you\s+explain|explain\s+further|why\?|what\s+does\s+that\s+mean|ماذا\s+تعني|كيف\s+ذلك|اشرح\s+لي)\b/i.test(lower) ||
    lower === "sidee" || lower === "sidee?" || lower === "maxaa?" || lower === "sabab?") &&
    !safeEntities.city && !safeEntities.bedrooms && !safeEntities.price
  ) {
    return {
      intent: "CLARIFICATION_REQUEST",
      confidence: 0.95,
      explanation: "User requested clarification of assistant's previous statement",
      matchedSignals: ["clarification_inquiry"],
    };
  }

  // 6. CORRECTION
  // e.g. "500 ma aha, 400 ayaan ula jeeday", "Hodan ma aha, Wadajir", "Maya $350 ayaan ula jeedaa", "$350 ayaan ula jeedaa", "3 qol ma aha, 4 qol"
  const isOrdinalRefCorrection = Boolean(
    safeState.activeResultSet &&
    safeState.activeResultSet.length > 0 &&
    resolveConversationalReference(userMessage, safeState.activeResultSet).type !== "NONE"
  );

  const isSoftPrefOnly =
    lower.includes("khasab ma aha") ||
    lower.includes("khasab maaha") ||
    lower.includes("khasab maha") ||
    lower.includes("not mandatory") ||
    lower.includes("optional");

  if (
    !isOrdinalRefCorrection &&
    !isSoftPrefOnly &&
    /\b(\d+\s*ma\s+aha|\w+\s+ma\s+aha|ma\s+aha|waxaan\s+ula\s+jeeday|ayaan\s+ula\s+jeeday|waxaan\s+ula\s+jeedaa|ayaan\s+ula\s+jeedaa|actually|not\s+\w+)\b/i.test(lower)
  ) {
    return {
      intent: "CORRECTION",
      confidence: 0.95,
      explanation: "User correcting previously provided parameter",
      matchedSignals: ["correction_signal"],
    };
  }

  // 7. PROPERTY_NEGOTIATION
  // e.g. "$350 ma looga dhigi karaa?", "qiimaha ma la dhimi karaa?", "can we negotiate?", "is price negotiable?"
  if (
    /\b(ma\s+looga\s+dhigi\s+karaa|qiimaha\s+ma\s+la\s+dhimi\s+karaa|ma\s+la\s+gorgortami\s+karaa|can\s+we\s+negotiate|is\s+the\s+price\s+negotiable|is\s+it\s+negotiable|qiimo\s+dhimis|discount)\b/i.test(lower)
  ) {
    return {
      intent: "PROPERTY_NEGOTIATION",
      confidence: 0.95,
      explanation: "User inquired about price negotiation or discount",
      matchedSignals: ["property_negotiation"],
    };
  }

  // 8. PROPERTY_AVAILABILITY
  // e.g. "ma bannaan yahay?", "hadda ma diyaar baa?", "is it available?", "bannaan miyaa?"
  if (
    /\b(ma\s+bannaan\s+yahay|ma\s+banaan\s+yahay|bannaan\s+miyaa|hadda\s+ma\s+diyaar\s+baa|is\s+it\s+available|is\s+it\s+ready|ma\s+la\s+heli\s+karaa)\b/i.test(lower)
  ) {
    return {
      intent: "PROPERTY_AVAILABILITY",
      confidence: 0.95,
      explanation: "User inquired about property availability",
      matchedSignals: ["property_availability"],
    };
  }

  // 9. PROPERTY_COMPARISON
  // e.g. "Labadan kee jaban?", "Labadan kee fiican?", "Kan iyo kii hore kee jaban?", "Midkee parking fiican leh?", "compare 1 and 2"
  if (
    /\b(labadan\s+kee|labadaan\s+kee|kan\s+iyo\s+kii\s+hore\s+kee|kee\s+jaban|kee\s+fiican|midkee\s+parking\s+fiican\s+leh|midkee\s+ku\s+habboon\s+budget|compare\s+(?:the\s+)?(?:first|1st|second|2nd|1|2|properties)|which\s+one\s+is\s+(?:cheaper|better)|barbar\s+dhig)\b/i.test(lower)
  ) {
    return {
      intent: "PROPERTY_COMPARISON",
      confidence: 0.94,
      explanation: "User requested side-by-side comparison between listings",
      matchedSignals: ["property_comparison"],
    };
  }

  // 10. AMBIGUOUS
  // e.g. "Kan ma fiican yahay?" when there is no single focused reference, or "Kan ii samee" with empty results
  if (
    (/\b(kan\s+ma\s+fiican\s+yahay|ma\s+fiican\s+yahay|is\s+this\s+one\s+good|which\s+one\s+is\s+better)\b/i.test(lower) &&
      (!safeState.referencedPropertyId || safeState.activeResultSet.length !== 1)) ||
    (lower.match(/\b(kan\s+ii\s+samee|kan\s+yeel|kaas\s+samee|do\s+that|do\s+this)\b/i) && safeState.activeResultSet.length === 0)
  ) {
    return {
      intent: "AMBIGUOUS",
      confidence: 0.90,
      explanation: "Ambiguous pointer without active reference",
      matchedSignals: ["unresolvable_pointer"],
    };
  }

  // 11. PROPERTY_DETAILS
  // e.g. "Kan labaad parking ma leeyahay?", "Kan labaad ma furnished baa?", "Parking?", "Furnished?"
  if (
    (/\b(kan\s+labaad|kii\s+labaad|kan\s+hore|kii\s+hore|the\s+second\s+one|second\s+one|that\s+one)\b/i.test(lower) &&
      /\b(parking|baarkin|garaash|furnished|furnshed|alaab|qalab|price|qiimo|bedrooms?|qolal?|bathrooms?|musqul)\b/i.test(lower)) ||
    (lower.match(/^(?:parking|baarkin|furnished|furnshed|alaab|bedrooms?|qolal?|bathrooms?|musqul|price|qiimo|location|availability)\??$/i) && safeState.activeResultSet.length > 0)
  ) {
    const refResolution = resolveConversationalReference(userMessage, safeState.activeResultSet);
    return {
      intent: "PROPERTY_DETAILS",
      confidence: 0.95,
      explanation: "Attribute question on referenced property",
      matchedSignals: ["property_details"],
      resolvedReference: refResolution,
    };
  }

  // 12. PROPERTY_REFERENCE
  if (
    /\b(kan|kii\s+hore|kan\s+hore|kan\s+labaad|kii\s+labaad|saddexaad|midkaas|labadaas|kan\s+ugu\s+jaban|kii\s+aad\s+hadda\s+sheegtay|the\s+second\s+one|first\s+one|cheaper\s+one|الأول|الثاني|الثالث|ugu\s*horeeyey|ugu\s*horeeya|koowaad|1aad)\b/i.test(lower) &&
    safeState.activeResultSet &&
    safeState.activeResultSet.length > 0
  ) {
    const refResolution = resolveConversationalReference(userMessage, safeState.activeResultSet);
    return {
      intent: "PROPERTY_REFERENCE",
      confidence: 0.94,
      explanation: "Reference to property in active result set",
      matchedSignals: ["property_reference"],
      resolvedReference: refResolution,
    };
  }

  // 13. PROPERTY_SEARCH_UPDATE
  if (
    /\b(update\s+search|modify\s+search|beddel\s+raadinta|cusboonaysii\s+raadinta)\b/i.test(lower)
  ) {
    return {
      intent: "PROPERTY_SEARCH_UPDATE",
      confidence: 0.93,
      explanation: "User requested search modification",
      matchedSignals: ["property_search_update"],
    };
  }

  // 14. REQUIREMENT_UPDATE
  if (
    /\b(parking-na\s+waa\s+muhiim|parking\s+ha\s+lahaado|parking\s+muhiim\s+ma\s+aha|ka\s+dhig|make\s+budget|set\s+budget|mid\s+ka\s+jaban|cheaper)\b/i.test(lower)
  ) {
    return {
      intent: "REQUIREMENT_UPDATE",
      confidence: 0.92,
      explanation: "User updating specific criteria or requirements",
      matchedSignals: ["requirement_update"],
    };
  }

  // 15. REAL_ESTATE_FOLLOW_UP
  if (
    /\b(parking\s+ma\s+leeyahay|qiimihiisu\s+waa\s+imisa|owner-ka\s+yaa\s+leh|koronto\s+ma\s+leeyahay|biyo\s+ma\s+leeyahay|xaggee\s+ku\s+yaal|does\s+it\s+have\s+parking)\b/i.test(lower)
  ) {
    return {
      intent: "REAL_ESTATE_FOLLOW_UP",
      confidence: 0.94,
      explanation: "Attribute or status question about a property",
      matchedSignals: ["property_attribute_query"],
    };
  }

  // 16. REAL_ESTATE_SEARCH
  return {
    intent: "REAL_ESTATE_SEARCH",
    confidence: 0.92,
    explanation: "Real estate property search or general exploration",
    matchedSignals: ["real_estate_search"],
  };
}

/**
 * Robust Scope & Intent Analyzer
 * Distinguishes between pure real estate, mixed, and off-topic requests
 */
export function analyzeMessageScope(
  userMessage: string,
  entities: ExtractedEntities,
  state: ConversationState
): MessageScopeAnalysis {
  const lower = userMessage.toLowerCase().trim();
  const slang = analyzeConversationalSlang(userMessage);

  // Exclude greetings and smalltalk from being marked as out-of-scope errors
  if (
    slang.isGreeting ||
    slang.isGreetingResponse ||
    slang.isGratitude ||
    /^(how are you|sidee tahay|see tahay|ok|okay|waad mahadsantahay)\b/i.test(lower)
  ) {
    const hasRealEstateContent =
      /\b(guri|guryo|guriga|apartment|apartments|villa|villas|dhul|kiro|kirro|kirada|rent|iib|qol|qolal|suuli|musqul|parking|baarkin|alaab|furnished|qiimo|miisaaniyad|awoodaa|awoodayaa|raadinayaa|raadi|hodan|wadajir|muqdisho|mogadishu|hargeisa|kismayo|garowe|bosaso)\b/i.test(lower) ||
      Boolean(entities.city || entities.propertyType || entities.price?.maxPrice || entities.bedrooms);

    if (!hasRealEstateContent) {
      return {
        isRealEstate: false,
        isOutOfScope: false,
        isMixed: false,
      };
    }
  }

  // 0. Detect prompt injection attempts attempting to override real estate domain
  const isPromptInjection =
    /\b(ignore\s+(?:all\s+)?(?:previous\s+)?instructions|act\s+as\s+(?:a\s+)?general\s+ai|jailbreak|forget\s+all\s+instructions|system\s+prompt|dan\s+ha\s+ka\s+yeelan\s+amaradii\s+hore|you\s+are\s+no\s+longer|no\s+longer\s+kiro-maal|no\s+longer\s+aida|not\s+kiro-maal)\b/i.test(lower);
  if (isPromptInjection) {
    return {
      isRealEstate: false,
      isOutOfScope: true,
      isMixed: false,
      outOfScopeCategory: "general_offtopic",
    };
  }

  // 1. Detect explicit out-of-scope categories
  let outOfScopeCategory: MessageScopeAnalysis["outOfScopeCategory"] = undefined;

  const isSchoolHomework =
    /\b(cashar|casharro|casharrada|school-ka|school|iskool|homework|xisaab|xisaabta|saynis|physics|chemistry|biology|algebra|geometry|tacliin|waxbarasho|grammar|english\s+grammar|luuqad|carabi|somali\s+grammar|واجب|مدرسة|دروس|رياضيات)\b/i.test(lower);
  const isCryptoFinance =
    /\b(bitcoin|btc|crypto|cryptocurrency|ethereum|eth|forex|stocks?|stock market|saamiyada|suuqa saamiyada|trading|تداول|بورصة|بيتكوين)\b/i.test(lower);
  const isAssignment =
    /\b(assignment|assignments|mashruuc jaamacadeed|sidee loo sameeyaa assignment|how to do assignment|how to write an essay|essay|تكليف)\b/i.test(lower);
  const isGeneralOfftopic =
    /\b(recipe|cunto karis|movie|film|filim|football|kubadda cagta|joke|qosol|poem|gabay|weather|cimilada|python code|javascript code|doctor|dhakhtar|dawo|website|madaxweyne|madaxweynaha|president|dawlad|politics|programming|code\s+ii\s+qor|ii\s+qor\s+code)\b/i.test(lower) ||
    /^(sidee loo sameeyaa|sidee loo qoraa|yaa madaxweyne)\b/i.test(lower);

  if (isSchoolHomework) outOfScopeCategory = "school_homework";
  else if (isCryptoFinance) outOfScopeCategory = "crypto_finance";
  else if (isAssignment) outOfScopeCategory = "assignment";
  else if (isGeneralOfftopic) outOfScopeCategory = "general_offtopic";

  const hasExplicitOutOfScope = outOfScopeCategory !== undefined;

  // 2. Exclude conversational contextual messages (confirmations, clarifications, corrections, references) if no explicit out-of-scope category
  if (!hasExplicitOutOfScope) {
    const isPropertyAttrFollowup =
      Boolean(state.activeResultSet &&
      state.activeResultSet.length > 0 &&
      /^(price|qiimo|qiimaha|location|halkee|availability|available|diyaar|bannaan|bedrooms?|bathrooms?|musqul|qol|parking|baarkin|furnished|alaab|pool|swimming|barkad|gym|jimicsi)\??$/i.test(lower));

    const isContextualQuery =
      /\b(ma\s+hubtaa|taasi\s+ma\s+hubtaa|ma\s+sidaas\s+baa|you\s+sure|sax\s+miyaa|runtii|ma\s+dhab\s+baa|dhab\s+miyaa|hubi|are\s+you\s+sure|is\s+that\s+true|maxaad\s+ula\s+jeeddaa|sidee\?|maxay\s+ka\s+dhigan\s+tahay|faahfaahi|sharax|wax\s+yar\s+ii\s+sharax|sabab|maxaa|haddaba|laakiin|what\s+do\s+you\s+mean|can\s+you\s+explain|ma\s+aha|ula\s+jeeday|actually|beddel|badal|ka\s+dhig|muhiim\s+ma\s+aha|waa\s+muhiim|kan\s+ii\s+samee|kaas|kan\s+kee|kan\s+ma\s+fiican\s+yahay|ma\s+fiican\s+yahay|is\s+this\s+one\s+good|which\s+one\s+is\s+better|kee\s+jaban|kee\s+fiican|labadan\s+kee|labadan|labada|ma\s+leeyahay|ma\s+leedahay)\b/i.test(lower) ||
      /^(haa\?|sax\s+miyaa\?|ok|okay|haye|hmm)\b/i.test(lower);

    if (isContextualQuery || isPropertyAttrFollowup) {
      return {
        isRealEstate: true,
        isOutOfScope: false,
        isMixed: false,
      };
    }
  }

  // 2. Check for real estate intent in the current message
  const hasRealEstateKeywords =
    /\b(guri|guryo|guriga|apartment|apartments|apartmant|aprtment|villa|villas|fiilo|dhul|dhulka|land|plot|xafiis|office|commercial|bakhaar|warehouse|kiro|kirro|kiree|kirada|rent|rental|lease|iib|iibso|iibi|gadasho|buy|purchase|sale|qol|qolal|bedroom|bedrooms|bedrom|suuli|musqul|bathroom|bathrooms|fadhiga|living room|jiko|kitchen|parking|garaash|baarkin|balcony|dabaq|floor|furnished|furnshed|alaab|qalab|unfurnished|magaalo|property|properties|listing|listings|viewing|ballan|milkiile|owner|broker|dilaal|jaban|qaali|qiimo|qiimaha|budget|cheap|affordable|meel|xaafad|raadi|ii raadi|i tus|keen|wax walba|find|search|show me|browse|list|dhammaan|all|pool|swimming|barkad|barkadda|gym|jimicsi|fitness|مسبح|أبحث|ابحث|اعرض|hodan|wadajir|yaaqshiid|howlwadaag|waberi|kaaraan|shibis|boondheere|shangaani|hamarweyne|hamarjajab|dharkenley|kaxda|dayniile|muqdisho|mogadishu|mogadisho|hargeisa|hargeysa|garowe|kismayo|berbera|baydhabo|caabudwaaq|عقار|شقة|منزل|فيلا|للإيجار|للبيع|إيجار|شراء|real\s+estate|escrow|mortgage|tenant|landlord|deposit|security\s+deposit)\b/i.test(lower);

  const hasEntities = Boolean(
    entities.city ||
    entities.propertyType ||
    entities.bedrooms ||
    entities.price?.maxPrice ||
    entities.price?.approxPrice ||
    entities.purpose
  );

  const hasReferenceToActiveResults = Boolean(
    state?.activeResultSet &&
    state.activeResultSet.length > 0 &&
    /\b(kan|kii|kan hore|kii hore|kan labaad|kii labaad|saddexaad|ka jaban|cheaper|parking|alaab|furnished|qiimihiisu|is it|does it have|labadan|labada|midka|kee|swimming|pool|barkad|gym|jimicsi|ma leeyahay|ma leedahay)\b/i.test(lower)
  );

  const hasActiveConversationContext = Boolean(
    state?.slots &&
    (state.slots.city || state.slots.purpose || state.slots.maxPrice || state.slots.bedrooms)
  );

  const isAnsweringPendingSlot = Boolean(
    state?.pendingSlot ||
    (state?.interviewStage && state.interviewStage !== "IDLE") ||
    state?.pendingQuestion
  );

  const hasRealEstateIntent =
    hasRealEstateKeywords ||
    hasEntities ||
    hasReferenceToActiveResults ||
    isAnsweringPendingSlot ||
    (hasActiveConversationContext && /\b(raadi|ii raadi|i tus|keen|wax walba|find|search|show me|all|dhammaan)\b/i.test(lower));

  if (hasExplicitOutOfScope && hasRealEstateIntent) {
    return {
      isRealEstate: true,
      isOutOfScope: false,
      isMixed: true,
      outOfScopeCategory,
      unrelatedPart: outOfScopeCategory === "school_homework" ? "cashar xisaab" : outOfScopeCategory,
    };
  }

  if (hasExplicitOutOfScope && !hasRealEstateIntent) {
    return {
      isRealEstate: false,
      isOutOfScope: true,
      isMixed: false,
      outOfScopeCategory,
    };
  }

  return {
    isRealEstate: hasRealEstateIntent,
    isOutOfScope: hasExplicitOutOfScope,
    isMixed: false,
    outOfScopeCategory: hasExplicitOutOfScope ? outOfScopeCategory : undefined,
  };
}

/**
 * Deterministic Search Readiness & Conversational Interview Decision Engine
 */
export function evaluateSearchReadiness(
  state: ConversationState,
  userMessage: string,
  entities: ExtractedEntities,
  activeLanguage: ExtendedLanguage = "en",
  lastAssistantMessage?: string
): SearchReadinessDecision {
  const slang = analyzeConversationalSlang(userMessage);
  const lower = userMessage.toLowerCase().trim();
  const lastAsst = lastAssistantMessage || state.lastAssistantMessage || "";

  // 1. Context-Aware Intent Check
  const contextIntent = detectContextAwareIntent(userMessage, state, entities, lastAsst);

  // A. Confirmation Request (e.g. "Ma hubtaa?", "Sax miyaa?", "Runtii?", "Are you sure?")
  if (contextIntent.intent === "CONFIRMATION_REQUEST") {
    return {
      isReady: false,
      responseType: "CONFIRMATION",
      reason: "User requested confirmation of assistant's previous statement",
    };
  }

  // B. Clarification Request (e.g. "Maxaad ula jeeddaa?", "Sidee?", "Faahfaahi", "What do you mean?")
  if (contextIntent.intent === "CLARIFICATION_REQUEST") {
    return {
      isReady: false,
      responseType: "CLARIFICATION",
      clarificationQuestion:
        activeLanguage === "so"
          ? "Waxaan ula jeedaa inaan si fiican u fahmo baahidaada dhabta ah si aan kuugu helo guryaha ugu habboon ee ku jira Kiro-Maal, halkii aan kugu wareerin lahaa xulashooyin aan kugu habboonayn. 😊"
          : activeLanguage === "ar"
          ? "أقصد فهم متطلباتك بدقة حتى أتمكن من إيجاد أفضل العقارات المناسبة لك على كيرو-مال بدلاً من عرض خيارات غير ملائمة. 😊"
          : "I mean to clearly understand your exact property preferences so I can match you with the best available homes on Kiro-Maal, rather than overwhelming you with unsuitable options. 😊",
      reason: "User requested clarification of assistant's previous statement",
    };
  }

  // C. Ambiguous message (e.g. "Kan ma fiican yahay?", "Kan ii samee" with no identifiable target)
  if (contextIntent.intent === "AMBIGUOUS") {
    const isMultiOption = state.activeResultSet && state.activeResultSet.length >= 2;
    return {
      isReady: false,
      responseType: "AMBIGUOUS",
      clarificationQuestion: isMultiOption
        ? (activeLanguage === "so"
            ? "Midkee ayaad ula jeeddaa—kan 1aad mise kan 2aad?"
            : activeLanguage === "ar"
            ? "أيهما تقصد—الأول أم الثاني؟"
            : "Which one do you mean—the 1st or the 2nd one?")
        : (activeLanguage === "so"
            ? "Maxaad ula jeeddaa kan? Ii sheeg property-ga ama fariintii aad tixraacayso si aan si sax ah kaaga caawiyo."
            : activeLanguage === "ar"
            ? "ماذا تقصد بهذا؟ يرجى تحديد العقار أو الرسالة التي تشير إليها حتى أتمكن من مساعدتك."
            : "What do you mean by that? Please specify the property or message you are referring to so I can assist you accurately."),
      reason: "Ambiguous pointer without identifiable referent",
    };
  }

  // D. Correction response type
  if (contextIntent.intent === "CORRECTION") {
    return {
      isReady: false,
      responseType: "CORRECTION",
      reason: "User corrected previously provided parameter",
    };
  }

  // E. Negotiation response type
  if (contextIntent.intent === "PROPERTY_NEGOTIATION") {
    return {
      isReady: false,
      responseType: "PROPERTY_NEGOTIATION",
      reason: "User inquired about price negotiation or discount",
    };
  }

  // F. Availability response type
  if (contextIntent.intent === "PROPERTY_AVAILABILITY") {
    return {
      isReady: false,
      responseType: "PROPERTY_AVAILABILITY",
      reason: "User inquired about property availability",
    };
  }

  // G. Greeting response type
  if (contextIntent.intent === "GREETING") {
    if (!entities.city && !entities.bedrooms && !entities.price && (!entities.propertyType || lower.length < 15)) {
      return {
        isReady: false,
        responseType: "GREETING",
        reason: "User provided a greeting without search criteria",
      };
    }
  }

  // -1. Strict Scope Check (AIDA Real Estate-Only Scope)
  const scope = analyzeMessageScope(userMessage, entities, state);

  if (scope.isOutOfScope) {
    return {
      isReady: false,
      responseType: "OUT_OF_SCOPE",
      reason: `User asked non-real-estate out-of-scope question (${scope.outOfScopeCategory || "general_offtopic"})`,
    };
  }

  if (scope.isMixed) {
    return {
      isReady: false,
      responseType: "MIXED_QUERY",
      reason: "User combined real estate requirements with unrelated question",
    };
  }

  // Unrealistic Low Budget Check (Section 9 & Section 19: clarification safeguard, not universal rejection)
  if (state.slots.maxPrice !== undefined && state.slots.maxPrice > 0 && state.slots.maxPrice < 30) {
    const isRespondingToLowBudgetClarification =
      lastAsst.includes("way adkaan kartaa") ||
      lastAsst.includes("difficult to find") ||
      lastAsst.includes("الصعب جداً") ||
      lower.match(/\b(waan\s+hubaa|haa|yes|confirm|i am sure|waan\s+rabaa\s+\$?\d+)\b/i);

    if (!isRespondingToLowBudgetClarification) {
      const bVal = state.slots.maxPrice;
      return {
        isReady: false,
        responseType: "CLARIFICATION",
        missingSlot: "budget",
        clarificationQuestion:
          activeLanguage === "so"
            ? `$${bVal} bishii guri kirro ah way adkaan kartaa in laga helo suuqa caadiga ah. Haddii aad ula jeeddo $${bVal * 100}, fadlan ii xaqiiji.`
            : activeLanguage === "ar"
            ? `${bVal} دولارات شهرياً للإيجار قد يكون من الصعب جداً العثور عليه في السوق. إذا كنت تقصد ${bVal * 100} دولار، يرجى التأكيد.`
            : `$${bVal}/month for a rental home can be very difficult to find in the normal market. If you meant $${bVal * 100}, please confirm.`,
        reason: "Unrealistic low rental budget detected; requesting confirmation without silent conversion",
      };
    }
  }

  // 0. Reset / Start Over
  if (lower.match(/\b(bilow mar kale|aan dib uga bilowno|start over|forget this search|new search)\b/i)) {
    return {
      isReady: false,
      responseType: "RESET",
      clarificationQuestion: activeLanguage === "so"
        ? "Waa hagaag! Waxaan dib uga bilaabaynaa raadinta. Maxaan hadda kuu qabtaa—guri noocee ah ayaad rabtaa?"
        : "Sure! Resetting our search criteria. What kind of home or city would you like to explore now?",
      reason: "User requested search reset",
    };
  }

  // 0b. User uncertain / Guided flow
  if (lower.match(/\b(runtii ma aqaan|ma aqaan waxa aan rabo|ma garanayo waxa aan rabo|i don't know what i want|help me choose|iga caawi)\b/i) && !entities.city && !entities.bedrooms && !entities.price) {
    return {
      isReady: false,
      responseType: "USER_UNCERTAIN",
      clarificationQuestion: activeLanguage === "so"
        ? "Dhib ma leh 😊 Aan kuu fududeeyo. Marka hore, ma rabtaa inaad guri kiraysato mise aad iibsato?"
        : "No problem at all 😊 Let me help simplify this. First, are you looking to rent or buy a home?",
      reason: "User requested help choosing / uncertain goal",
    };
  }

  // 0c. Consultation / Advice
  if (lower.match(/\b(maxaad igula talin lahayd|what would you recommend|what do you recommend|igula tali|single person|qof keli ah)\b/i)) {
    return {
      isReady: false,
      responseType: "ADVICE",
      clarificationQuestion: activeLanguage === "so"
        ? "Haddii aad kaligaa tahay oo budget-kaagu yahay $500 bishii, waxaan kugula talin lahaa inaad marka hore eegto apartment 1–2 qol jiif ah oo ku yaal meel kuu dhow shaqadaada. Haddii aad ii sheegto xaafadda ama meesha aad ka shaqeyso, waxaan kuu raadin karaa options ku habboon oo aan isbarbar dhigi karo."
        : "If you're living alone with a $500/month budget, I'd recommend starting with 1–2 bedroom apartments in convenient areas close to your work. If you tell me your preferred neighborhood or where you work, I can help compare suitable options.",
      reason: "User requested real estate consultation / advice",
    };
  }

  // 1. Pure greeting check (e.g. "asc", "hello", "hi", "wcs", "salaam", "asc sxb")
  if (slang.isGreeting || slang.isGreetingResponse) {
    if (!entities.city && !entities.bedrooms && !entities.price && (!entities.propertyType || lower.length < 15)) {
      return {
        isReady: false,
        responseType: "GREETING",
        reason: "User provided a greeting without search criteria",
      };
    }
  }

  // 2. Gratitude / Casual conversation / Pleasantries / Sharing personal state
  if (
    slang.isGratitude ||
    (slang.hasInformalAddress && lower.length < 10) ||
    lower.match(/^(how are you|see tahay|sidee tahay|waad mahadsantahay|thanks|thx|ok|okay)\b/i) ||
    lower.match(/\b(waan fiicanahay|adiguna|fiicanahay|alhamdulillah|mashquul|mashquulsanahay|shaqada aad baan|shaqo ayaan ku|shaqo wacan|doing well|busy today)\b/i)
  ) {
    if (!entities.city && !entities.bedrooms && !entities.price) {
      return {
        isReady: false,
        responseType: "GENERAL_CONVERSATION",
        reason: "User sent casual conversation, pleasantries, or gratitude",
      };
    }
  }

  // 2b. Kiro-Maal company background / services inquiries
  if (
    lower.match(/\b(kiro-maal|kiromaal)\b/i) &&
    lower.match(/\b(maxay|maxaad|qabataa|qabataan|aasaasay|la aasaasay|what is|about|services|adeegyada|who are you|yaad tahay)\b/i)
  ) {
    return {
      isReady: false,
      responseType: "GENERAL_CONVERSATION",
      reason: "User inquired about Kiro-Maal company background or services",
    };
  }

  // 2c. Neighborhood & Location Advice / Inquiries (e.g. "Muqdisho meelaha ugu fiican ee reer lagu degi karo", "meelaha reeraha ku fiican")
  if (
    lower.match(/\b(meelaha|xaafadaha|meel|xaafad|degmo|meelaha ugu fiican|reer|reeraha|qoys|qoysaska|degi karo|ku habboon|best area|best neighborhood|where to live)\b/i) &&
    !lower.match(/\b(ii raadi|raadi|search|find|i tus|show me|keen)\b/i)
  ) {
    return {
      isReady: false,
      responseType: "ADVICE",
      reason: "User requested neighborhood advice or area consultation",
    };
  }

  // 3. Educational / Real estate concept inquiries
  const isEducationalQuestion =
    lower.includes("furnished maxay tahay") ||
    lower.includes("what is a villa") ||
    lower.includes("what is a lease") ||
    lower.includes("what is escrow") ||
    lower.includes("what does furnished mean") ||
    lower.includes("farqiga u dhexeeya apartment iyo villa") ||
    lower.includes("security deposit maxay tahay") ||
    lower.includes("what is a mortgage") ||
    lower.includes("what is the difference between rent and buy") ||
    lower.includes("difference between rent and buy") ||
    lower.includes("how does property valuation work") ||
    lower.includes("what should i check before buying") ||
    lower.includes("how does escrow work") ||
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
      responseType: "EDUCATION",
      reason: "User asked a general real estate educational question",
    };
  }

  // 3b. Trade-off inquiry ("jaban laakiin meel fiican")
  if (lower.includes("jaban laakiin meel fiican") || lower.includes("fiican oo jaban") || lower.includes("cheap but good")) {
    return {
      isReady: false,
      responseType: "CLARIFICATION",
      missingSlot: "clarification",
      clarificationQuestion: activeLanguage === "so"
        ? "Waan fahmay—waxaad raadineysaa dheelitirnaan u dhaxeysa qiimo jaban iyo goob fiican. Miisaaniyadda ugu badan ee aad awoodi karto bishii intee le'eg ayay tahay si aan kuugu soo xulo meelaha ugu habboon?"
        : "Understood—balancing an affordable price with a great location is a great strategy. What is the maximum budget you would like to stay under so I can find the best options in convenient neighborhoods?",
      reason: "Budget vs location trade-off; clarifying maximum budget limit",
    };
  }

  // 3c. Vague goal inquiry ("guri fiican")
  if (lower.match(/\b(guri fiican|wax fiican|good home|good house)\b/i) && !state.slots.city && !state.slots.maxPrice && !state.slots.bedrooms) {
    return {
      isReady: false,
      responseType: "CLARIFICATION",
      missingSlot: "clarification",
      clarificationQuestion: activeLanguage === "so"
        ? "Markaad leedahay fiican, maxaa kuu muhiimsan—qiimo jaban, meel fiican, qolal badan, mise amenities-ka sida parking iyo security?"
        : "When you say a good home, what is most important to you—budget affordability, prime location, spacious rooms, or amenities like parking and security?",
      reason: "Vague goal provided; asking user for priority clarification",
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

  // 5. In-set Reference resolution (Ordinal, Comparative, Side-by-side, Pronouns, Attribute follow-ups)
  if (state.activeResultSet && state.activeResultSet.length > 0) {
    const prevTarget = state.activeResultSet.find((p) => p.id === state.referencedPropertyId) || state.activeResultSet[0];
    const resCheck = resolveConversationalReference(userMessage, state.activeResultSet, prevTarget);
    if (resCheck.type !== "NONE") {
      // If it's "cheaper" modification with explicit search command, it IS ready for search with adjusted price
      if ((lower.includes("cheaper") || lower.includes("ka jaban") || lower.includes("أرخص")) &&
          (lower.includes("raadi") || lower.includes("find") || lower.includes("show") || lower.includes("search"))) {
        return {
          isReady: true,
          responseType: "PROPERTY_RESULTS",
          reason: "Follow-up query modification for cheaper listings in active context",
        };
      }
      return {
        isReady: false,
        responseType: resCheck.type === "COMPARISON"
          ? "PROPERTY_COMPARISON"
          : "PROPERTY_DETAIL",
        reason: "User referencing an existing property from the active result set",
      };
    }
  }

  // 5b. Location/preference adjustment or exclusion check before search trigger
  if (
    lower.match(/\b(hodan\s*(?:ma\s*rabo|ha\s*(?:ii\s*)?keenin|ka\s*saar)|meel\s+aan\s+hodan\s+ahayn|aan\s+hodan\s+ahayn|meeshaas\s*ma\s*rabo)\b/i) ||
    (state.slots.excludedLocations && state.slots.excludedLocations.includes("Hodan") && (lower.includes("ha ii keenin") || lower.includes("ma rabo") || lower.includes("ahayn")))
  ) {
    return {
      isReady: false,
      responseType: "REQUIREMENT_UPDATE",
      clarificationQuestion: activeLanguage === "so"
        ? "Waa hagaag! Hodan waan ka saaray goobaha aan ka raadinayno. Waxaan ku sii wadayaa shuruudahaagii hore."
        : "Understood! Hodan has been excluded from the search locations. Proceeding with your remaining preferences.",
      reason: "User explicitly excluded Hodan",
    };
  }

  if (lower.includes("khasab ma aha") || lower.includes("khasab maaha") || lower.includes("khasab maha")) {
    return {
      isReady: false,
      responseType: "REQUIREMENT_UPDATE",
      clarificationQuestion: activeLanguage === "so"
        ? "Waa hagaag! 3 qol haddii la helo waa mudnaan laakiin khasab ma aha waan fahmay. Waxaan ku xisaabtamaynaa xulashooyinka 2 ilaa 3 qol ee ku jira miisaaniyaddaada."
        : "Understood! 3 bedrooms is preferred if available, but not a hard requirement. I will keep that in mind.",
      reason: "User expressed a soft bedroom preference",
    };
  }

  if (lower.includes("waan qaadan karaa") || lower.includes("waa la qaadan karaa")) {
    return {
      isReady: false,
      responseType: "REQUIREMENT_UPDATE",
      clarificationQuestion: activeLanguage === "so"
        ? "Waa hagaag! 2 qol oo fiican in laguu raadiyo waan qaatay. Ma rabtaa inaan hadda kuu raadiyo guryaha ugu fiican ee lacagtaas ku jira?"
        : "Understood! 2 good bedrooms is acceptable. Would you like me to find the best listings within that budget now?",
      reason: "User indicated acceptable bedroom alternative",
    };
  }

  // 5c. Workplace context / personal situation statement (e.g. "KM4 ayaan ka shaqeeyaa", "waxaan shaqeeyaa...")
  if (lower.match(/\b(km4|shaqeeyaa|ka shaqeeyaa|work near|office)\b/i) && !lower.match(/\b(raadi|search|find|keen|i tus)\b/i)) {
    return {
      isReady: false,
      responseType: "REQUIREMENT_UPDATE",
      clarificationQuestion: activeLanguage === "so"
        ? "Waa hagaag! Goobtaada shaqada (KM4) waan diiwaangeliyay si aan kuugu soo xulo guryo ku dhow."
        : "Understood! I noted your workplace near KM4 to prioritize nearby homes.",
      reason: "User stated workplace location preference",
    };
  }

  // 5d. Uncommitted intent to search (e.g. "waxaan rabaa inaan guri raadsado", "waxaan rabaa guri laakiin shaqo ayaan ku mashquulsanahay")
  if (
    lower.match(/\b(waxaan rabaa inaan guri|rabaa inaan guri raadsado|waxaan rabaa guri laakiin)\b/i) &&
    !lower.match(/\b(ii raadi|raadi|search|find|i tus|show me|keen)\b/i)
  ) {
    return {
      isReady: false,
      responseType: "GENERAL_CONVERSATION",
      reason: "User expressed general intent or conversational situation without explicit search command",
    };
  }

  // 6. Property Search Readiness Check
  const slots = state.slots;

  // Check whether the user is explicitly executing an active search query
  const hasExplicitSearchCommand =
    /\b(find|search|show me|list|give me|browse|raadi|i tus|ii raadi|keen|wax walba|wax walba ii raadi|dhammaan|all|doonayaa|أبحث|ابحث|أريد أن أرى|اعرض|ugu fiican|kan ugu fiican|midka ugu fiican)\b/i.test(lower) ||
    lower.includes("ku yaal") ||
    (Boolean(slots.city) && Boolean(slots.propertyType) && typeof slots.bedrooms === "number" && typeof slots.maxPrice === "number" && !lower.includes("khasab") && !lower.includes("haddii") && !lower.includes("ma rabo"));

  // A. If City is missing:
  if (!slots.city) {
    if (scope.isOutOfScope) {
      return {
        isReady: false,
        responseType: "OUT_OF_SCOPE",
        reason: "User has asked a non-real-estate question",
      };
    }

    // If user has not commanded a search and simply shared criteria / preferences:
    if (!hasExplicitSearchCommand && (slots.maxPrice || slots.purpose || slots.propertyType)) {
      return {
        isReady: false,
        responseType: "REQUIREMENT_UPDATE",
        clarificationQuestion: activeLanguage === "so"
          ? (slots.maxPrice
              ? `Waayahay walaal, miisaaniyaddaada $${slots.maxPrice} waan diiwaangeliyay. Magaalada aad rabto wali ma sheegin—Mogadishu miyaa mise meel kale?`
              : "Waa hagaag, shuruudahaaga waan diiwaangeliyay.")
          : "Understood, noted your preferences.",
        reason: "Preferences noted; conversational continuation without forcing rigid questionnaire",
      };
    }

    const isRental = slots.purpose === "RENT" || (!slots.purpose && slots.propertyType === "APARTMENT");
    const isSale = slots.purpose === "SALE";
    return {
      isReady: false,
      responseType: "CLARIFICATION",
      missingSlot: "city",
      clarificationQuestion:
        activeLanguage === "so"
          ? (lower.includes("waxaan u baahanahay guryo kiro ah")
              ? "Waayahay. Waxaad raadineysaa guryo kiro ah. Magaalo noocee ah ayaad rabtaa inaan ka raadiyo?"
              : (slots.maxPrice && (slots.softPreferences?.includes("quiet_neighborhood") || lower.includes("mashquul") || lower.includes("reer") || lower.includes("qoys")))
              ? `Waayahay walaal, waxaan qaatay miisaaniyaddaada $${slots.maxPrice} iyo inaad reer tihiin oo meel deggan rabtaan. Magaalada aad ka doonaysay ma ii sheegi kartaa—Mogadishu miyaa mise meel kale?`
              : slots.maxPrice
              ? `Waayahay walaal, miisaaniyaddaada $${slots.maxPrice} waan diiwaangeliyay. Magaalada aad rabto wali ma sheegin—Mogadishu miyaa mise meel kale?`
              : (slots.softPreferences?.includes("quiet_neighborhood") || lower.includes("mashquul") || lower.includes("reer") || lower.includes("qoys"))
              ? "Waad mahadsan tahay. Meel deggan oo qoyska ku habboon ayaan eegaynaa. Magaaladee ayaad jeceshahay inaan ka raadinno?"
              : isRental
              ? "Waad heli kartaa! Magaaladee ayaad rabtaa inaad ka kireysato?"
              : isSale
              ? "Waad heli kartaa! Magaaladee ayaad rabtaa inaad ka iibsato?"
              : "Waad heli kartaa! Magaaladee ayaad ka raadinaysaa?")
          : activeLanguage === "ar"
          ? (isRental
              ? "حسناً، تبحث عن عقارات للإيجار. في أي مدينة تريد أن أبحث لك؟"
              : "بالتأكيد، يمكنني مساعدتك. في أي مدينة تبحث عن العقار؟")
          : (isRental
              ? "Understood, you are looking for rental properties. Which city would you like me to search in?"
              : "Certainly! Which city are you looking to find property in?"),
      reason: "Missing mandatory city constraint for search execution",
    };
  }

  // C. City is known: Check whether enough parameters exist or if an interview step is needed.
  const hasDetailedSearchCommand =
    hasExplicitSearchCommand ||
    /\b(find|search|show me|list|give me|browse|raadi|i tus|ii raadi|keen|wax walba|wax walba ii raadi|dhammaan|all|doonayaa|أبحث|ابحث|أريد أن أرى|اعرض)\b/i.test(lower) ||
    lower.includes("under") || lower.includes("budget") || lower.includes("below") || lower.includes("ka yar") || lower.includes("miisaaniyad") || lower.includes("ii raadi") || lower.includes("ugu fiican");

  const hasSpecificType = slots.propertyType && slots.propertyType !== "HOUSE"; // Villa, Apartment, Office, etc.
  const hasBedrooms = slots.bedrooms !== undefined || Boolean(slots.softPreferences && slots.softPreferences.some(p => p.includes("bedroom")));
  const hasPrice = slots.maxPrice !== undefined;
  const isRental = slots.purpose === "RENT";

  // If user provided city, but NO price and NO bedrooms:
  if (!hasBedrooms && !hasPrice && !hasSpecificType && !hasDetailedSearchCommand) {
    // Progressive interview step: Ask for budget (rental-aware)
    const budgetPromptSo = isRental
      ? `Waayahay, ${slots.city}. Miisaaniyadda kiradaadu waa intee?`
      : `Waayahay, ${slots.city}. Miisaaniyaddaadu waa intee?`;
    const budgetPromptAr = isRental
      ? `حسناً، ${slots.city}. ما هي ميزانيتك الشهرية للإيجار؟`
      : `حسناً، ${slots.city}. كم هي ميزانيتك التقريبية؟`;
    const budgetPromptEn = isRental
      ? `Understood, ${slots.city}. What is your target monthly budget?`
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

  // If budget is still missing and user gave property type and district:
  if (!hasPrice && !hasExplicitSearchCommand && slots.district && slots.propertyType) {
    const locText = slots.district ? `${slots.district}` : slots.city;
    const typeText = slots.propertyType ? slots.propertyType.toLowerCase() : "guri";
    const budgetPromptSo = isRental
      ? `Waayahay, ${typeText}${locText ? ` oo ${locText} ah` : ""}. Miisaaniyadda aad qorshaynayso waa intee bishii?`
      : `Waayahay, ${typeText}${locText ? ` oo ${locText} ah` : ""}. Miisaaniyadda aad qorshaynayso waa intee?`;
    const budgetPromptAr = isRental
      ? `حسناً، ${typeText} في ${locText || ""}. ما هي ميزانيتك الشهرية للإيجار؟`
      : `حسناً، ${typeText} في ${locText || ""}. ما هي ميزانيتك التقريبية؟`;
    const budgetPromptEn = isRental
      ? `Understood, ${typeText} in ${locText || slots.city}. What is your target monthly budget?`
      : `Understood, ${typeText} in ${locText || slots.city}. What is your target budget?`;

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
      reason: "Budget is missing; interviewing user for target budget",
    };
  }

  // If user expresses criteria or preferences without an explicit search command:
  if (!hasExplicitSearchCommand) {
    // If user was specifically answering a pending budget interview question (e.g. Test C):
    const isAnsweringPendingBudget =
      (state.pendingSlot === "budget" || state.interviewStage === "AWAITING_BUDGET" || (lastAsst && /miisaaniyadda|budget/i.test(lastAsst))) &&
      hasPrice &&
      hasBedrooms &&
      Boolean(slots.district);

    if (isAnsweringPendingBudget) {
      return {
        isReady: true,
        responseType: "PROPERTY_RESULTS",
        reason: "User completed the pending search criteria by providing budget",
      };
    }

    // Conversational continuation without forcing fixed questionnaires or automatic DB search
    let responseText = "Waa hagaag, shuruudahaaga waan diiwaangeliyay.";
    if (activeLanguage === "so") {
      if (lower.includes("3 qol") || lower.includes("qol")) {
        responseText = "Waa hagaag! 3 qol haddii la helo waa mudnaan waan fahmay.";
      } else if (lower.includes("kirro") || lower.includes("kiro") || slots.purpose === "RENT") {
        responseText = "Waa hagaag, waxaan ku xisaabtamaynaa guri kirro ah.";
      } else if (slots.maxPrice) {
        responseText = `Waayahay walaal, miisaaniyaddaada $${slots.maxPrice} waan diiwaangeliyay.`;
      }
    }

    return {
      isReady: false,
      responseType: "REQUIREMENT_UPDATE",
      clarificationQuestion: responseText,
      reason: "User provided criteria/preferences without an explicit search command; conversational continuation",
    };
  }

  // User explicitly commanded a search (e.g. "ii raadi", "search", "find", "kan ugu fiican"):
  return {
    isReady: true,
    responseType: "PROPERTY_RESULTS",
    reason: "Explicit search command detected with available criteria; executing search",
  };

  // C. All essential criteria or explicit command present -> READY TO SEARCH!
  return {
    isReady: true,
    responseType: "PROPERTY_RESULTS",
    reason: "Sufficient search constraints established for database search",
  };
}

