/**
 * ================================================================
 * API SCALABILITY, RESILIENCE & CIRCUIT BREAKER ENGINE
 * ================================================================
 * Designed for graceful degradation under heavy load (100 to 100,000 users):
 * - Circuit Breaker pattern for external dependencies (AI providers, storage)
 * - Scaled rate limit allowances by user tier
 * - Fast-path 304 Not Modified ETag verification
 */

import { NextResponse } from "next/server";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Failures before tripping open
  resetTimeoutMs?: number;   // Time in ms before attempting half-open recovery
  halfOpenSuccesses?: number; // Successful probes needed to close
  name?: string;
}

/**
 * Enterprise Circuit Breaker.
 * Prevents cascade failure when downstream services (e.g. Gemini, OpenAI, S3) experience outages.
 */
export class CircuitBreaker {
  public state: CircuitState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeoutMs: options.resetTimeoutMs ?? 30000,
      halfOpenSuccesses: options.halfOpenSuccesses ?? 2,
      name: options.name ?? "default-circuit",
    };
  }

  /**
   * Executes an asynchronous action through the circuit breaker.
   */
  async execute<T>(action: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    const now = Date.now();

    // 1. If OPEN, check if recovery timeout has elapsed to transition to HALF_OPEN
    if (this.state === "OPEN") {
      if (now - this.lastFailureTime > this.options.resetTimeoutMs) {
        this.state = "HALF_OPEN";
        this.successCount = 0;
      } else {
        if (fallback) {
          return await fallback();
        }
        throw new Error(
          `[Circuit Breaker: ${this.options.name}] Circuit is OPEN. Fast failing to protect event loop.`
        );
      }
    }

    // 2. Execute target action
    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      if (fallback) {
        return await fallback();
      }
      throw err;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= this.options.halfOpenSuccesses) {
        this.state = "CLOSED";
      }
    }
  }

  private onFailure() {
    this.lastFailureTime = Date.now();
    this.failureCount++;

    if (this.state === "HALF_OPEN" || this.failureCount >= this.options.failureThreshold) {
      this.state = "OPEN";
    }
  }

  reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

/** Pre-instantiated circuit breakers for core subsystems */
export const aiCircuitBreaker = new CircuitBreaker({
  name: "ai-services",
  failureThreshold: 4,
  resetTimeoutMs: 20000,
});

export const storageCircuitBreaker = new CircuitBreaker({
  name: "storage-services",
  failureThreshold: 5,
  resetTimeoutMs: 15000,
});

/**
 * Returns dynamic rate limit quotas scaled to concurrency tiers and user roles.
 */
export function getTieredRateLimit(
  role: "PUBLIC" | "CUSTOMER" | "MANAGER" | "ADMIN",
  tierScale: "TIER_100" | "TIER_1K" | "TIER_10K" | "TIER_100K" = "TIER_1K"
): { limit: number; windowSeconds: number } {
  const multipliers: Record<typeof tierScale, number> = {
    TIER_100: 1,
    TIER_1K: 1.5,
    TIER_10K: 2.5,
    TIER_100K: 5,
  };

  const factor = multipliers[tierScale] || 1;

  switch (role) {
    case "ADMIN":
      return { limit: Math.round(600 * factor), windowSeconds: 60 };
    case "MANAGER":
      return { limit: Math.round(300 * factor), windowSeconds: 60 };
    case "CUSTOMER":
      return { limit: Math.round(180 * factor), windowSeconds: 60 };
    case "PUBLIC":
    default:
      return { limit: Math.round(60 * factor), windowSeconds: 60 };
  }
}

/**
 * Checks client If-None-Match header against calculated ETag and returns empty 304 if fresh.
 */
export function handleConditionalGet(
  clientEtag: string | null,
  currentEtag: string,
  payload: any,
  headers: Record<string, string> = {}
): NextResponse {
  if (clientEtag && clientEtag === currentEtag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: currentEtag,
        "Cache-Control": headers["Cache-Control"] || "public, max-age=60, stale-while-revalidate=300",
        ...headers,
      },
    });
  }

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      ETag: currentEtag,
      "Cache-Control": headers["Cache-Control"] || "public, max-age=60, stale-while-revalidate=300",
      ...headers,
    },
  });
}

