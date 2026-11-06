/**
 * Standardized API Error Handling & Error Translation System.
 *
 * Provides:
 * - Machine-readable error codes
 * - User-friendly English and Somali (Bilingual) error translations
 * - AppError class with HTTP status codes and contextual details
 * - Prisma ORM error code translator (masks internal SQL/schema details)
 * - Standardized JSON error response formatter
 * - Transient operation retry wrapper (with exponential backoff)
 */

import { NextResponse } from "next/server";
import { logger, sanitizeData } from "@/lib/logger";

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "DATABASE_ERROR"
  | "EXTERNAL_SERVICE_ERROR"
  | "INTERNAL_ERROR";

export interface BilingualMessage {
  en: string;
  so: string;
}

/**
 * Standard user-friendly error translations for Kiro-Maal platform.
 */
export const ERROR_MESSAGES: Record<ErrorCode, BilingualMessage> = {
  BAD_REQUEST: {
    en: "Invalid request. Please check your submission and try again.",
    so: "Codsi khaldan. Fadlan hubi xogta aad gelisay oo mar kale isku day.",
  },
  UNAUTHORIZED: {
    en: "Please sign in to access this feature.",
    so: "Fadlan soo gal nidaamka si aad u isticmaasho qaybtan.",
  },
  FORBIDDEN: {
    en: "You do not have permission to perform this action.",
    so: "Uma haysatid ogolaansho inaad fuliso hawshan.",
  },
  NOT_FOUND: {
    en: "The requested resource could not be found.",
    so: "Xogtii aad raadinaysay lama helin.",
  },
  CONFLICT: {
    en: "A conflicting record already exists (e.g. duplicate title, booking overlap).",
    so: "Diiwaan hore u jiray ayaa isku dhacaya (tusaale cinwaan isku mid ah ama ballan hore).",
  },
  VALIDATION_ERROR: {
    en: "Please provide valid information for all required fields.",
    so: "Fadlan buuxi dhammaan meelaha banaan xog sax ahna geli.",
  },
  RATE_LIMITED: {
    en: "Too many requests. Please slow down and try again shortly.",
    so: "Codsiyo aad u badan. Fadlan wax yar sug oo mar kale isku day.",
  },
  DATABASE_ERROR: {
    en: "A database error occurred. Please try again shortly.",
    so: "Cilad kaydka xogta ah ayaa dhacday. Fadlan wax yar ka dib isku day.",
  },
  EXTERNAL_SERVICE_ERROR: {
    en: "External service is temporarily unavailable. Please retry in a few moments.",
    so: "Adeegga dibadda hadda ma shaqaynayo. Fadlan wax yar ka dib isku day.",
  },
  INTERNAL_ERROR: {
    en: "An unexpected error occurred. Our team has been notified.",
    so: "Cilad lama filaan ah ayaa dhacday. Kooxdayada ayaa la socod siiyey.",
  },
};

/**
 * Standard Application Error with machine code and bilingual messages.
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly messageSo?: string;
  public readonly details?: unknown;

  constructor(options: {
    message: string;
    code?: ErrorCode;
    status?: number;
    messageSo?: string;
    details?: unknown;
  }) {
    super(options.message);
    this.name = "AppError";
    this.code = options.code || "INTERNAL_ERROR";
    this.status = options.status || 500;
    this.messageSo = options.messageSo || ERROR_MESSAGES[this.code]?.so;
    this.details = options.details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: unknown, messageSo?: string): AppError {
    return new AppError({
      message,
      code: "BAD_REQUEST",
      status: 400,
      details,
      messageSo: messageSo || ERROR_MESSAGES.BAD_REQUEST.so,
    });
  }

  static validation(message: string, details?: unknown, messageSo?: string): AppError {
    return new AppError({
      message,
      code: "VALIDATION_ERROR",
      status: 422,
      details,
      messageSo: messageSo || ERROR_MESSAGES.VALIDATION_ERROR.so,
    });
  }

  static unauthorized(message = ERROR_MESSAGES.UNAUTHORIZED.en, messageSo?: string): AppError {
    return new AppError({
      message,
      code: "UNAUTHORIZED",
      status: 401,
      messageSo: messageSo || ERROR_MESSAGES.UNAUTHORIZED.so,
    });
  }

  static forbidden(message = ERROR_MESSAGES.FORBIDDEN.en, messageSo?: string): AppError {
    return new AppError({
      message,
      code: "FORBIDDEN",
      status: 403,
      messageSo: messageSo || ERROR_MESSAGES.FORBIDDEN.so,
    });
  }

  static notFound(message = ERROR_MESSAGES.NOT_FOUND.en, messageSo?: string): AppError {
    return new AppError({
      message,
      code: "NOT_FOUND",
      status: 404,
      messageSo: messageSo || ERROR_MESSAGES.NOT_FOUND.so,
    });
  }

  static conflict(message = ERROR_MESSAGES.CONFLICT.en, messageSo?: string): AppError {
    return new AppError({
      message,
      code: "CONFLICT",
      status: 409,
      messageSo: messageSo || ERROR_MESSAGES.CONFLICT.so,
    });
  }

  static rateLimited(message = ERROR_MESSAGES.RATE_LIMITED.en, messageSo?: string): AppError {
    return new AppError({
      message,
      code: "RATE_LIMITED",
      status: 429,
      messageSo: messageSo || ERROR_MESSAGES.RATE_LIMITED.so,
    });
  }

  static internal(message = ERROR_MESSAGES.INTERNAL_ERROR.en, details?: unknown, messageSo?: string): AppError {
    return new AppError({
      message,
      code: "INTERNAL_ERROR",
      status: 500,
      details,
      messageSo: messageSo || ERROR_MESSAGES.INTERNAL_ERROR.so,
    });
  }
}

/**
 * Generates a unique correlation / trace ID for tracking error lifecycles.
 */
export function generateRequestId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `req_${time}_${rand}`;
}

/**
 * Translates known Prisma errors into sanitized, user-friendly AppErrors.
 */
export function translatePrismaError(error: any): AppError | null {
  if (!error || typeof error !== "object") return null;

  // Prisma Known Request Error code (e.g. P2002, P2025, P2003)
  const code = error.code;
  if (!code || typeof code !== "string" || !code.startsWith("P")) {
    return null;
  }

  switch (code) {
    case "P2002": {
      // Unique constraint failed
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(", ")
        : error.meta?.target || "field";
      return new AppError({
        message: `A record with this ${target} already exists.`,
        code: "CONFLICT",
        status: 409,
        messageSo: "Diiwaan macluumaadkan leh mar hore ayaa la abuuray.",
      });
    }
    case "P2025": {
      // Record not found
      return new AppError({
        message: "The requested record could not be found or has been deleted.",
        code: "NOT_FOUND",
        status: 404,
        messageSo: "Diiwaanka la raadinayo lama helin ama waa la tirtiray.",
      });
    }
    case "P2003": {
      // Foreign key constraint failed
      return new AppError({
        message: "Related reference does not exist or has active dependencies.",
        code: "CONFLICT",
        status: 409,
        messageSo: "Xiriiriyaha ku lifaaqan ma jiro ama wuxuu leeyahay xog ku xiran.",
      });
    }
    case "P2024": {
      // Timed out fetching a new connection from the connection pool
      return new AppError({
        message: "Database connection timed out. Please try again in a moment.",
        code: "DATABASE_ERROR",
        status: 503,
        messageSo: "Isku xirka xog-kaydiyaha ayaa daahay. Fadlan mar dhow isku day.",
      });
    }
    default:
      return new AppError({
        message: "A database error occurred while processing the request.",
        code: "DATABASE_ERROR",
        status: 500,
        messageSo: ERROR_MESSAGES.DATABASE_ERROR.so,
      });
  }
}

export interface ErrorResponsePayload {
  success: false;
  error: string; // Backward compatibility with older clients checking res.error
  code: ErrorCode;
  messageSo?: string;
  details?: unknown;
  requestId: string;
  timestamp: string;
}

/**
 * Formats any thrown error into a clean, sanitized HTTP JSON response.
 */
export function formatErrorResponse(
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again.",
  requestId = generateRequestId(),
  module = "api"
): { status: number; payload: ErrorResponsePayload } {
  let status = 500;
  let code: ErrorCode = "INTERNAL_ERROR";
  let message = fallbackMessage;
  let messageSo: string | undefined;
  let details: unknown = undefined;

  // 1. Prisma errors
  const prismaAppError = translatePrismaError(error);
  if (prismaAppError) {
    status = prismaAppError.status;
    code = prismaAppError.code;
    message = prismaAppError.message;
    messageSo = prismaAppError.messageSo;
  }
  // 2. Custom AppError
  else if (error instanceof AppError) {
    status = error.status;
    code = error.code;
    message = error.message;
    messageSo = error.messageSo;
    details = error.details;
  }
  // 3. Transactions TxnError (from lib/transactions.ts)
  else if (error && typeof error === "object" && "status" in error && "message" in error) {
    const txn = error as { status?: number; message: string };
    status = typeof txn.status === "number" ? txn.status : 400;
    code = status === 401 ? "UNAUTHORIZED" : status === 403 ? "FORBIDDEN" : status === 404 ? "NOT_FOUND" : "BAD_REQUEST";
    message = txn.message || fallbackMessage;
    messageSo = ERROR_MESSAGES[code]?.so;
  }
  // 4. Zod validation errors
  else if (error && typeof error === "object" && "issues" in error && Array.isArray((error as any).issues)) {
    status = 422;
    code = "VALIDATION_ERROR";
    message = "Validation failed for submitted data.";
    messageSo = ERROR_MESSAGES.VALIDATION_ERROR.so;
    details = (error as any).issues.map((i: any) => ({
      path: i.path.join("."),
      message: i.message,
    }));
  }
  // 5. Standard Error
  else if (error instanceof Error) {
    message = process.env.NODE_ENV === "development" ? error.message : fallbackMessage;
  }

  // Log error with correlation context
  logger.error(message, error, {
    requestId,
    module,
    statusCode: status,
    errorCode: code,
  });

  const payload: ErrorResponsePayload = {
    success: false,
    error: message,
    code,
    messageSo,
    details: details !== undefined ? sanitizeData(details) : undefined,
    requestId,
    timestamp: new Date().toISOString(),
  };

  return { status, payload };
}

/**
 * Helper to build standard Next.js NextResponse for errors.
 */
export function createErrorResponse(
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again.",
  requestId = generateRequestId(),
  module = "api"
): NextResponse<ErrorResponsePayload> {
  const { status, payload } = formatErrorResponse(error, fallbackMessage, requestId, module);
  return NextResponse.json(payload, {
    status,
    headers: {
      "x-request-id": requestId,
    },
  });
}

/**
 * Determines if an error is considered transient and safely retryable.
 */
export function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  // AppError status check (retry 5xx server errors and 429 rate limits, skip 4xx client errors)
  if (error instanceof AppError) {
    return error.status >= 500 || error.status === 429;
  }

  // Network or system error strings
  const message = error instanceof Error ? error.message : String(error);
  const retryablePatterns = [
    /econnreset/i,
    /etimedout/i,
    /econnrefused/i,
    /network\s*error/i,
    /fetch\s*failed/i,
    /socket\s*hang\s*up/i,
    /rate\s*limit/i,
    /timeout/i,
    /503/i,
    /502/i,
    /504/i,
    /P2024/i, // Prisma connection pool timeout
  ];

  return retryablePatterns.some((pattern) => pattern.test(message));
}

/**
 * Resilient retry wrapper with exponential backoff and randomized jitter for transient failures.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delayMs?: number;
    backoffFactor?: number;
    jitter?: boolean;
    shouldRetry?: (error: unknown) => boolean;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const retries = options.retries ?? 3;
  let delay = options.delayMs ?? 300;
  const factor = options.backoffFactor ?? 2;
  const useJitter = options.jitter ?? true;
  const shouldRetry = options.shouldRetry ?? isRetryableError;

  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries || !shouldRetry(err)) break;

      if (options.onRetry) {
        options.onRetry(attempt, err);
      } else {
        logger.warn(`Operation failed (attempt ${attempt}/${retries}), retrying in ${delay}ms...`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }

      const effectiveDelay = useJitter
        ? delay + Math.random() * 0.25 * delay
        : delay;

      await new Promise((resolve) => setTimeout(resolve, effectiveDelay));
      delay *= factor;
    }
  }

  throw lastError;
}
