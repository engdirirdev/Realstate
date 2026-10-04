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
}

export interface ResultItem {
  rank: number; // 1-indexed (1, 2, 3...)
  id: string;
  title: string;
  price: number;
  formattedPrice: string;
  city: string;
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
  attributeQueried?: "price" | "bedrooms" | "bathrooms" | "area" | "status" | "location" | "all";
  explanation: string;
}

export interface SlotUpdateDelta {
  newSlots: Partial<ConversationSlotState>;
  changedSlots: { slot: string; from: any; to: any }[];
  removedSlots: string[];
  isFollowUp: boolean;
  isQueryModification: boolean;
}

export type ResponseType =
  | "GREETING"
  | "GENERAL_CONVERSATION"
  | "CLARIFICATION"
  | "PROPERTY_RESULTS"
  | "PROPERTY_DETAIL"
  | "PROPERTY_COMPARISON"
  | "VALUATION"
  | "NO_RESULTS"
  | "ERROR";

export type InterviewStage =
  | "IDLE"
  | "AWAITING_CITY"
  | "AWAITING_BUDGET"
  | "AWAITING_BEDROOMS"
  | "AWAITING_TYPE";

export interface SearchReadinessDecision {
  isReady: boolean;
  responseType: ResponseType;
  missingSlot?: "city" | "budget" | "bedrooms" | "propertyType";
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
  activeResultSet: ResultItem[];
  referencedPropertyId?: string;
  unresolvedSlots: string[];
  rejectedPropertyIds: string[];
  interviewStage?: InterviewStage;
  pendingQuestion?: string;
  turnCount: number;
  lastUserMessage?: string;
  lastAssistantMessage?: string;
  updatedAt: string;
}

export type ExtendedLanguage =
  // Tier 1
  | "so" | "en" | "ar" | "mixed"
  // Tier 2 (East African)
  | "sw" | "am" | "om" | "ti"
  // Tier 3 (Global)
  | "fr" | "es" | "de" | "pt" | "it" | "tr" | "hi" | "ur" | "bn" | "id" | "ms" | "zh" | "ja" | "ko" | "ru"
  | "unknown";

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

