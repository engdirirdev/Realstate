/**
 * Conversational Memory, Context Continuity & Multilingual Types
 * Phase 4 Core Infrastructure
 */

import { SupportedLanguage } from "../language/detector";

export type ConversationTopic =
  | "PROPERTY_SEARCH"
  | "PROPERTY_DETAILS"
  | "PROPERTY_VALUATION"
  | "PROPERTY_RECOMMENDATION"
  | "PROPERTY_COMPARISON"
  | "AVAILABILITY"
  | "BOOKING"
  | "EDUCATION"
  | "ADVICE"
  | "USER_UNCERTAIN"
  | "RESET"
  | "GENERAL_INQUIRY"
  | "OFF_TOPIC";

export interface ConversationSlotState {
  city?: string;
  district?: string;
  propertyType?: string;
  purpose?: "SALE" | "RENT";
  minPrice?: number;
  maxPrice?: number;
  pricePeriod?: "month" | "year" | "week" | "day";
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  furnished?: boolean;
  parking?: boolean;
  pool?: boolean;
  garden?: boolean;
  security?: boolean;
  amenities?: string[];
  luxury?: boolean;
  cheap?: boolean;
  sortBy?: "best_match" | "price_asc" | "price_desc" | "newest";
  tradeOff?: "budget_over_location" | "location_over_budget" | "balanced";
  goalPriority?: "price" | "location" | "bedrooms" | "amenities" | "uncertain";
  excludedLocations?: string[];
  alternativeLocations?: string[];
  softPreferences?: string[];
  userReasoning?: string[];
}

export interface ResultItem {
  rank: number; // 1-indexed (1, 2, 3...)
  id: string;
  title: string;
  price: number;
  formattedPrice: string;
  city: string;
  location?: string | null;
  district?: string | null;
  address?: string | null;
  type: string;
  typeLabel?: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  areaSize?: number;
  furnished: boolean;
  parking: boolean;
  parkingSpaces?: number;
  status: string;
  statusLabel?: string;
  statusEmoji?: string;
  imageUrl?: string | null;
  managerName?: string;
  description?: string;
}

export interface ReferenceResolution {
  type: "ORDINAL" | "PRONOUN" | "PROPERTY_ID" | "COMPARATIVE" | "COMPARISON" | "SIMILARITY" | "NONE";
  targetRank?: number;
  targetProperty?: ResultItem;
  comparedProperties?: ResultItem[];
  attributeQueried?: "price" | "bedrooms" | "bathrooms" | "area" | "status" | "location" | "parking" | "furnished" | "pool" | "gym" | "all";
  explanation: string;
}

export interface SlotUpdateDelta {
  newSlots: Partial<ConversationSlotState>;
  changedSlots: { slot: string; from: any; to: any }[];
  removedSlots: string[];
  isFollowUp: boolean;
  isQueryModification: boolean;
}

export type ContextAwareIntent =
  | "REAL_ESTATE_SEARCH"
  | "REAL_ESTATE_FOLLOW_UP"
  | "PROPERTY_REFERENCE"
  | "PROPERTY_DETAILS"
  | "PROPERTY_COMPARISON"
  | "PROPERTY_SEARCH_UPDATE"
  | "PROPERTY_NEGOTIATION"
  | "PROPERTY_AVAILABILITY"
  | "CONFIRMATION_REQUEST"
  | "CLARIFICATION_REQUEST"
  | "CORRECTION"
  | "REQUIREMENT_UPDATE"
  | "CASUAL_CONVERSATION"
  | "GREETING"
  | "OUT_OF_SCOPE"
  | "AMBIGUOUS";

export type ResponseType =
  | "GREETING"
  | "GENERAL_CONVERSATION"
  | "CLARIFICATION"
  | "PROPERTY_RESULTS"
  | "PROPERTY_DETAIL"
  | "PROPERTY_COMPARISON"
  | "PROPERTY_NEGOTIATION"
  | "PROPERTY_AVAILABILITY"
  | "VALUATION"
  | "NO_RESULTS"
  | "ADVICE"
  | "EDUCATION"
  | "USER_UNCERTAIN"
  | "CONFIRMATION"
  | "CORRECTION"
  | "REQUIREMENT_UPDATE"
  | "AMBIGUOUS"
  | "RESET"
  | "OUT_OF_SCOPE"
  | "MIXED_QUERY"
  | "ERROR";

export type InterviewStage =
  | "IDLE"
  | "AWAITING_CITY"
  | "AWAITING_BUDGET"
  | "AWAITING_BEDROOMS"
  | "AWAITING_DISTRICT"
  | "AWAITING_TYPE"
  | "AWAITING_GOAL_CLARIFICATION"
  | "AWAITING_TRADE_OFF";

export interface SearchReadinessDecision {
  isReady: boolean;
  responseType: ResponseType;
  missingSlot?: "city" | "budget" | "bedrooms" | "propertyType" | "district" | "clarification";
  clarificationQuestion?: string;
  reason: string;
}

export interface ConversationState {
  sessionId: string;
  language: SupportedLanguage | ExtendedLanguage;
  explicitLanguagePreference?: SupportedLanguage | ExtendedLanguage;
  currentTopic: ConversationTopic;
  previousTopic?: ConversationTopic;
  topicConfidence: number;
  slots: ConversationSlotState;
  softPreferences?: string[];
  activeResultSet: ResultItem[];
  referencedPropertyId?: string;
  unresolvedSlots: string[];
  rejectedPropertyIds: string[];
  interviewStage?: InterviewStage;
  pendingQuestion?: string;
  pendingSlot?: string;
  expectedEntityType?: string;
  turnCount: number;
  lastUserMessage?: string;
  lastAssistantMessage?: string;
  lastAssistantClaim?: string;
  lastUserRequest?: string;
  activeIntent?: ContextAwareIntent;
  updatedAt: string;
}

export type ExtendedLanguage =
  // Tier 1
  | "so" | "en" | "ar" | "sw" | "mixed"
  // Tier 2 (East African / Horn)
  | "am" | "om" | "ti"
  // Tier 3 (Global & Regional)
  | "fr" | "es" | "de" | "pt" | "it" | "tr" | "hi" | "ur" | "bn" | "id" | "ms" | "zh" | "ja" | "ko" | "ru"
  | "fa" | "ha"
  | "unknown";

export type LanguageSupportLevel = "NATIVE" | "HIGH" | "PARTIAL" | "FALLBACK_ONLY" | "UNSUPPORTED";

export interface LanguageCapability {
  code: ExtendedLanguage;
  name: string;
  nativeName: string;
  detectionSupport: LanguageSupportLevel;
  understandingSupport: LanguageSupportLevel;
  generationSupport: LanguageSupportLevel;
  fallbackLanguage: ExtendedLanguage;
  confidenceThreshold: number;
  tier: 1 | 2 | 3;
  notes?: string;
}

export interface ConversationalResponseContext {
  state: ConversationState;
  intent: string;
  topic: ConversationTopic;
  replyText: string;
  properties: ResultItem[];
  resolution?: ReferenceResolution;
  explanationCodes?: string[];
  languageUsed: ExtendedLanguage;
  responseType: ResponseType;
  shouldRenderPropertyCards: boolean;
}

