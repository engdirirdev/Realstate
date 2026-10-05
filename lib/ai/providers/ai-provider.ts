/**
 * Unified AI Provider Contract & Data Types
 *
 * Defines the common abstraction for intelligence providers (OpenAI and Gemini).
 * Implements strict Structured Outputs contracts for natural language understanding,
 * entity extraction, reference resolution, and grounded response generation.
 */

import {
  ContextAwareIntent,
  ConversationSlotState,
  ExtendedLanguage,
  ResultItem,
} from "../conversation/types";

export interface AIStructuredEntities {
  city: string | null;
  district: string | null;
  propertyType: string | null;
  listingType: "rent" | "sale" | null;
  bedrooms: number | null;
  bathrooms: number | null;
  budget: number | null;
  currency: string | null;
  furnished: boolean | null;
  parking: boolean | null;
}

export interface AIStructuredReference {
  type: "ORDINAL" | "PRONOUN" | "COMPARATIVE" | "COMPARISON" | "NONE";
  targetRank: number | null;
  attributeQueried: string | null;
}

export interface AIStructuredCorrection {
  slot: string;
  previousValue: string | null;
  newValue: string | null;
}

export interface AIStructuredPendingSlotAnswer {
  slot: string;
  value: string | number | boolean | null;
}

export interface AIStructuredUnderstanding {
  intent: ContextAwareIntent;
  confidence: number;
  language: ExtendedLanguage;
  domain: "REAL_ESTATE" | "OUT_OF_SCOPE";
  entities: AIStructuredEntities;
  reference: AIStructuredReference | null;
  requestedAttribute: string | null;
  correction: AIStructuredCorrection | null;
  pendingSlotAnswer: AIStructuredPendingSlotAnswer | null;
  needsClarification: boolean;
  clarificationReason: string | null;
  rawExplanation?: string;
}

export interface ActiveResultSummary {
  rank: number;
  id: string;
  title: string;
  price: number;
  city: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  parking: boolean;
}

export interface AIUnderstandingInput {
  userMessage: string;
  conversationHistory?: { role: string; content: string }[];
  pendingQuestion?: string;
  pendingSlot?: string;
  expectedEntityType?: string;
  currentSlots?: Partial<ConversationSlotState>;
  activeResultSetSummary?: ActiveResultSummary[];
  preferredLanguage?: ExtendedLanguage;
}

export interface AIUnderstandingResult {
  provider: "openai" | "gemini";
  model: string;
  latencyMs: number;
  understanding: AIStructuredUnderstanding;
  success: boolean;
  error?: string;
}

export interface AIGenerationInput {
  userMessage: string;
  language: ExtendedLanguage;
  intent: ContextAwareIntent;
  verifiedProperties: ResultItem[];
  referencedProperty?: ResultItem;
  attributeAnswer?: {
    attribute: string;
    value: any;
    isAvailable: boolean;
    explanation?: string;
  };
  contextSlots: Partial<ConversationSlotState>;
  lastAssistantMessage?: string;
  clarificationQuestion?: string;
  conversationHistory?: { role: string; content: string }[];
}

export interface AIGenerationResult {
  provider: "openai" | "gemini";
  model: string;
  latencyMs: number;
  replyText: string;
  success: boolean;
  error?: string;
}

export interface AIProvider {
  readonly id: "openai" | "gemini";
  readonly model: string;
  isConfigured(): boolean;
  understand(input: AIUnderstandingInput): Promise<AIUnderstandingResult>;
  generateResponse(input: AIGenerationInput): Promise<AIGenerationResult>;
}

/**
 * Standard JSON Schema for strict AI understanding Structured Outputs
 */
export const AI_UNDERSTANDING_JSON_SCHEMA = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      enum: [
        "REAL_ESTATE_SEARCH",
        "REAL_ESTATE_FOLLOW_UP",
        "PROPERTY_REFERENCE",
        "PROPERTY_DETAILS",
        "PROPERTY_COMPARISON",
        "PROPERTY_SEARCH_UPDATE",
        "PROPERTY_NEGOTIATION",
        "PROPERTY_AVAILABILITY",
        "CONFIRMATION_REQUEST",
        "CLARIFICATION_REQUEST",
        "CORRECTION",
        "REQUIREMENT_UPDATE",
        "CASUAL_CONVERSATION",
        "GREETING",
        "OUT_OF_SCOPE",
        "AMBIGUOUS",
      ],
      description: "Classified conversational intent.",
    },
    confidence: {
      type: "number",
      description: "Confidence score between 0.0 and 1.0.",
    },
    language: {
      type: "string",
      enum: ["so", "en", "ar", "sw", "mixed", "unknown"],
      description: "Detected primary language or code-switching mode.",
    },
    domain: {
      type: "string",
      enum: ["REAL_ESTATE", "OUT_OF_SCOPE"],
      description: "Domain classification. Only real estate matters are in scope.",
    },
    entities: {
      type: "object",
      properties: {
        city: { type: ["string", "null"] },
        district: { type: ["string", "null"] },
        propertyType: { type: ["string", "null"] },
        listingType: { type: ["string", "null"], enum: ["rent", "sale", null] },
        bedrooms: { type: ["integer", "null"] },
        bathrooms: { type: ["integer", "null"] },
        budget: { type: ["integer", "null"] },
        currency: { type: ["string", "null"] },
        furnished: { type: ["boolean", "null"] },
        parking: { type: ["boolean", "null"] },
      },
      required: [
        "city",
        "district",
        "propertyType",
        "listingType",
        "bedrooms",
        "bathrooms",
        "budget",
        "currency",
        "furnished",
        "parking",
      ],
      additionalProperties: false,
    },
    reference: {
      type: ["object", "null"],
      properties: {
        type: {
          type: "string",
          enum: ["ORDINAL", "PRONOUN", "COMPARATIVE", "COMPARISON", "NONE"],
        },
        targetRank: { type: ["integer", "null"] },
        attributeQueried: { type: ["string", "null"] },
      },
      required: ["type", "targetRank", "attributeQueried"],
      additionalProperties: false,
    },
    requestedAttribute: { type: ["string", "null"] },
    correction: {
      type: ["object", "null"],
      properties: {
        slot: { type: "string" },
        previousValue: { type: ["string", "null"] },
        newValue: { type: ["string", "null"] },
      },
      required: ["slot", "previousValue", "newValue"],
      additionalProperties: false,
    },
    pendingSlotAnswer: {
      type: ["object", "null"],
      properties: {
        slot: { type: "string" },
        value: { type: ["string", "number", "boolean", "null"] },
      },
      required: ["slot", "value"],
      additionalProperties: false,
    },
    needsClarification: { type: "boolean" },
    clarificationReason: { type: ["string", "null"] },
  },
  required: [
    "intent",
    "confidence",
    "language",
    "domain",
    "entities",
    "reference",
    "requestedAttribute",
    "correction",
    "pendingSlotAnswer",
    "needsClarification",
    "clarificationReason",
  ],
  additionalProperties: false,
} as const;
