/**
 * Centralized In-Memory Sliding Window Rate Limiter
 *
 * Provides configurable rate limiting for AI and sensitive endpoints.
 * Prioritizes authenticated user IDs, falling back to client IP for anonymous users.
 */
import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredRecords(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitStore.entries()) {
    const freshTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (freshTimestamps.length === 0) {
      rateLimitStore.delete(key);
    } else {
      record.timestamps = freshTimestamps;
    }
  }
}

export interface RateLimitConfig {
  limit: number;        // Max allowed requests in window
  windowSeconds: number; // Time window in seconds
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Checks whether an incoming request is within rate limits.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  cleanupExpiredRecords(windowMs);

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Filter out timestamps outside the active sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  const oldestTimestamp = record.timestamps[0] || now;
  const resetInSeconds = Math.max(
    1,
    Math.ceil((oldestTimestamp + windowMs - now) / 1000)
  );

  if (record.timestamps.length >= config.limit) {
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      resetInSeconds,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    limit: config.limit,
    remaining: Math.max(0, config.limit - record.timestamps.length),
    resetInSeconds,
  };
}

/**
 * Derives a reliable client identifier from the request.
 * Uses authenticated user ID if provided; otherwise derives from client IP.
 */
export function getClientIdentifier(request: NextRequest, userId?: string | null): string {
  if (userId) {
    return `user:${userId}`;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return `ip:${firstIp}`;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return `ip:${realIp.trim()}`;

  return "ip:127.0.0.1";
}

/**
 * Builds a standardized HTTP 429 Too Many Requests response.
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "Too many requests. Please slow down and try again later.",
      retryAfterSeconds: result.resetInSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": result.resetInSeconds.toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": result.resetInSeconds.toString(),
      },
    }
  );
}

export const RATE_LIMIT_PRESETS = {
  // 60 requests per minute for AI Chat
  AI_CHAT: { limit: 60, windowSeconds: 60 },
  // 30 requests per minute for Price Prediction
  PRICE_PREDICTION: { limit: 30, windowSeconds: 60 },
};
