/**
 * High-Throughput API Scalability & Resilience Engine.
 *
 * Provides:
 * 1. Circuit Breaker Pattern (prevents cascading outages from external AI/payment APIs)
 * 2. Single-Flight Request Coalescing (collapses duplicate concurrent calls into one execution)
 * 3. Scaled Rate Limiting Matrix (adaptive throttling based on user authentication tiers)
 */

import { logger } from "@/lib/logger";

// ── 1. Circuit Breaker Pattern ──────────────────────────────────────

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  name: string;
  failureThreshold?: number; // Failures before opening (default: 5)
  recoveryTimeoutMs?: number; // Time in OPEN state before trying HALF_OPEN (default: 30000)
  halfOpenSuccessThreshold?: number; // Successes in HALF_OPEN to close (default: 2)
}

export class CircuitBreakerOpenError extends Error {
  constructor(public serviceName: string) {
    super(`Service "${serviceName}" is temporarily unavailable (Circuit Breaker OPEN).`);
    this.name = "CircuitBreakerOpenError";
  }
}

export class CircuitBreaker {
  public state: CircuitState = "CLOSED";
  public failureCount = 0;
  public successCount = 0;
  public lastFailureTime = 0;
  public readonly name: string;

  private readonly failureThreshold: number;
  private readonly recoveryTimeoutMs: number;
  private readonly halfOpenSuccessThreshold: number;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeoutMs = options.recoveryTimeoutMs || 30000;
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold || 2;
  }

  async execute<T>(action: () => Promise<T>, fallback?: () => Promise<T> | T): Promise<T> {
    const now = Date.now();

    // Check if recovery window has passed while OPEN
    if (this.state === "OPEN") {
      if (now - this.lastFailureTime > this.recoveryTimeoutMs) {
        this.state = "HALF_OPEN";
        this.successCount = 0;
        logger.info(`Circuit breaker "${this.name}" entering HALF_OPEN recovery state.`);
      } else {
        if (fallback) return await fallback();
        throw new CircuitBreakerOpenError(this.name);
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      if (fallback) return await fallback();
      throw err;
    }
  }

  private onSuccess(): void {
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= this.halfOpenSuccessThreshold) {
        this.state = "CLOSED";
        this.failureCount = 0;
        this.successCount = 0;
        logger.info(`Circuit breaker "${this.name}" recovered and CLOSED.`);
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(err: unknown): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;

    if (this.state === "HALF_OPEN" || this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      logger.error(`Circuit breaker "${this.name}" tripped OPEN after ${this.failureCount} failures.`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

// ── 2. Single-Flight Request Coalescing ──────────────────────────────

/**
 * Coalesces duplicate in-flight requests for the same resource key into a single
 * execution. When 50 concurrent requests arrive for the same expensive calculation,
 * the worker function executes only once, and all 50 callers receive the result.
 */
export class SingleFlight {
  private inFlight = new Map<string, Promise<any>>();

  async do<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = fn()
      .then((res) => {
        this.inFlight.delete(key);
        return res;
      })
      .catch((err) => {
        this.inFlight.delete(key);
        throw err;
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  getInFlightCount(): number {
    return this.inFlight.size;
  }
}

export const singleFlight = new SingleFlight();

// ── 3. Adaptive Rate Limiting Matrix ────────────────────────────────

export interface RateLimitTier {
  limit: number;
  windowSeconds: number;
}

export const SCALABILITY_RATE_TIERS: Record<string, RateLimitTier> = {
  PUBLIC: { limit: 60, windowSeconds: 60 },
  CUSTOMER: { limit: 180, windowSeconds: 60 },
  MANAGER: { limit: 300, windowSeconds: 60 },
  ADMIN: { limit: 600, windowSeconds: 60 },
  SEARCH: { limit: 120, windowSeconds: 60 },
  AI_CHAT: { limit: 40, windowSeconds: 60 },
};
