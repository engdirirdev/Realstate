/**
 * Behavioral Signal Weighting & Time-Decay Model
 *
 * Implements mathematically grounded signal weighting and exponential half-life decay.
 *
 * Event Weights:
 * - INQUIRY (5.0): Very strong intent — directly contacting owner/manager
 * - FAVORITE / SAVE (4.0): Strong explicit intent — bookmarking for future decision
 * - SHARE (3.0): Strong social endorsement
 * - SEARCH_CLICK (2.5): Intentional engagement from specific search intent
 * - REPEATED_VIEW (2.5): High retention interest — user returned to property
 * - CLICK (1.5): Engaged click on card or gallery
 * - VIEW (1.0): Single detail page view
 * - UNFAVORITE / UNSAVE (-2.0): Negative preference signal — user reconsidered
 *
 * Decay Model:
 *   weight(t) = base_weight * 2^(-age_ms / half_life_ms)
 *   Default Half-Life = 14 Days (1,209,600,000 ms)
 */

import { InteractionType } from "@prisma/client";

export const SIGNAL_BASE_WEIGHTS: Record<InteractionType, number> = {
  INQUIRY: 5.0,
  FAVORITE: 4.0,
  SAVE: 4.0,
  SHARE: 3.0,
  SEARCH_CLICK: 2.5,
  CLICK: 1.5,
  VIEW: 1.0,
  UNFAVORITE: -2.0,
  UNSAVE: -2.0,
};

export const BEHAVIORAL_CONFIG = {
  // 14-day half-life for time decay
  HALF_LIFE_DAYS: 14,
  HALF_LIFE_MS: 14 * 24 * 60 * 60 * 1000,
  // Minimum weight before event is considered effectively expired (90 days)
  MAX_AGE_DAYS: 90,
  // Rapid refresh deduplication window: 60 seconds
  DEDUPLICATION_WINDOW_MS: 60 * 1000,
  // Max repeated view events counted per property per hour
  MAX_HOURLY_VIEWS_PER_PROPERTY: 5,
  // Evidence weight threshold for high profile confidence (15.0 effective weight)
  HIGH_CONFIDENCE_WEIGHT: 15.0,
  // Minimum weight to activate personalization (2.0 effective weight)
  MIN_PERSONALIZATION_WEIGHT: 2.0,
};

/**
 * Calculates the time-decayed weight for an event.
 */
export function calculateDecayedWeight(
  baseWeight: number,
  eventDate: Date,
  nowDate: Date = new Date()
): number {
  const ageMs = Math.max(0, nowDate.getTime() - eventDate.getTime());
  const maxAgeMs = BEHAVIORAL_CONFIG.MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  // Stale events past max age decay to near-zero
  if (ageMs > maxAgeMs) {
    return 0;
  }

  const halfLives = ageMs / BEHAVIORAL_CONFIG.HALF_LIFE_MS;
  const decayFactor = Math.pow(2, -halfLives);

  return Math.round(baseWeight * decayFactor * 1000) / 1000;
}

/**
 * Computes profile confidence (0.0 to 1.0) given the total accumulated decayed weight.
 */
export function calculateProfileConfidence(totalDecayedWeight: number): number {
  if (totalDecayedWeight < BEHAVIORAL_CONFIG.MIN_PERSONALIZATION_WEIGHT) {
    return 0.0; // Cold start — insufficient evidence
  }

  const score = totalDecayedWeight / BEHAVIORAL_CONFIG.HIGH_CONFIDENCE_WEIGHT;
  return Math.round(Math.min(1.0, Math.max(0.1, score)) * 100) / 100;
}
