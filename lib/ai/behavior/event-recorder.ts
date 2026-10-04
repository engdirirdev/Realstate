/**
 * Behavioral Event Recorder
 *
 * Captures user interactions (views, clicks, favorites, inquiries) with:
 * - In-memory throttling & rapid-refresh deduplication (60-second window)
 * - Property view caps (max 5 views per property per hour)
 * - Persistence to `user_interactions` table
 * - Automatic profile refresh invocation
 */

import { prisma } from "@/lib/prisma";
import { InteractionType } from "@prisma/client";
import { SIGNAL_BASE_WEIGHTS, BEHAVIORAL_CONFIG } from "./signal-weights";
import { buildUserProfile } from "./profile-builder";

export interface RecordInteractionParams {
  userId: string;
  propertyId?: string | null;
  eventType: InteractionType;
  metadata?: Record<string, any>;
}

// In-memory deduplication cache: `${userId}:${propertyId}:${eventType}` -> timestamp
const recentInteractionsCache = new Map<string, number>();

// Hourly count tracker: `${userId}:${propertyId}:views` -> number[] of timestamps
const hourlyViewTracker = new Map<string, number[]>();

export async function recordInteraction(params: RecordInteractionParams): Promise<{
  recorded: boolean;
  reason?: string;
  interactionId?: string;
}> {
  const { userId, propertyId, eventType, metadata } = params;
  const now = Date.now();

  // 1. Validation
  if (!userId) {
    return { recorded: false, reason: "Missing required userId" };
  }

  // 2. Rapid-refresh deduplication (within 60s for identical user + property + eventType)
  const dedupKey = `${userId}:${propertyId || "none"}:${eventType}`;
  const lastTime = recentInteractionsCache.get(dedupKey);

  if (lastTime && now - lastTime < BEHAVIORAL_CONFIG.DEDUPLICATION_WINDOW_MS) {
    return { recorded: false, reason: "Throttled: Duplicate interaction within deduplication window" };
  }

  // 3. Hourly view cap (max 5 views per property per hour)
  if (eventType === "VIEW" && propertyId) {
    const hourlyKey = `${userId}:${propertyId}:views`;
    let timestamps = hourlyViewTracker.get(hourlyKey) || [];
    const oneHourAgo = now - 60 * 60 * 1000;
    timestamps = timestamps.filter((t) => t > oneHourAgo);

    if (timestamps.length >= BEHAVIORAL_CONFIG.MAX_HOURLY_VIEWS_PER_PROPERTY) {
      return { recorded: false, reason: "Throttled: Maximum hourly view limit reached for this property" };
    }

    timestamps.push(now);
    hourlyViewTracker.set(hourlyKey, timestamps);
  }

  // Update deduplication cache
  recentInteractionsCache.set(dedupKey, now);

  // 4. Calculate base weight
  const baseWeight = SIGNAL_BASE_WEIGHTS[eventType] || 1.0;

  // 5. Persist interaction to database
  const created = await prisma.userInteraction.create({
    data: {
      userId,
      propertyId: propertyId || null,
      eventType,
      weight: baseWeight,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  // 6. Asynchronously trigger profile rebuild with force refresh
  buildUserProfile(userId, { forceRefresh: true }).catch((err) => {
    console.error(`[EventRecorder] Profile rebuild failed for user ${userId}:`, err);
  });

  return {
    recorded: true,
    interactionId: created.id,
  };
}
