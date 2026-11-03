import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { type Actor } from "@/lib/transactions";
import {
  createErrorResponse,
  AppError,
  generateRequestId,
  ERROR_MESSAGES,
  type ErrorCode,
} from "@/lib/api-error";
import { logger } from "@/lib/logger";

export { AppError, createErrorResponse, generateRequestId };

export async function requireUser(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  if ((session.user as any).isActive === false) return null;
  return { id: session.user.id, role: (session.user as any).role, name: session.user.name };
}

/**
 * Standardized API error response helper.
 * Translates Prisma errors, TxnErrors, AppErrors, and general errors into
 * sanitized responses with correlation IDs and bilingual messages.
 */
export function jsonError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
  requestId?: string
) {
  return createErrorResponse(error, fallback, requestId, "api");
}

export const unauthorized = (
  msg = ERROR_MESSAGES.UNAUTHORIZED.en,
  msgSo = ERROR_MESSAGES.UNAUTHORIZED.so
) =>
  NextResponse.json(
    {
      success: false,
      error: msg,
      code: "UNAUTHORIZED" as ErrorCode,
      messageSo: msgSo,
      timestamp: new Date().toISOString(),
    },
    { status: 401 }
  );

export const forbidden = (
  msg = ERROR_MESSAGES.FORBIDDEN.en,
  msgSo = ERROR_MESSAGES.FORBIDDEN.so
) =>
  NextResponse.json(
    {
      success: false,
      error: msg,
      code: "FORBIDDEN" as ErrorCode,
      messageSo: msgSo,
      timestamp: new Date().toISOString(),
    },
    { status: 403 }
  );

export function parsePaging(searchParams: URLSearchParams, defaultSize = 20) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || defaultSize));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

/**
 * Higher-order wrapper for API route handlers that provides:
 * - Correlation ID injection
 * - Execution duration logging
 * - Automatic uncaught error capture and sanitization
 */
export function withErrorHandler<T extends any[]>(
  handler: (req: Request, ...args: T) => Promise<Response>,
  module = "api"
) {
  return async (req: Request, ...args: T): Promise<Response> => {
    const requestId =
      req.headers.get("x-request-id") ||
      req.headers.get("x-correlation-id") ||
      generateRequestId();
    const start = Date.now();
    const url = new URL(req.url);

    try {
      const response = await handler(req, ...args);
      const durationMs = Date.now() - start;

      // Log API requests in development or slow requests in production
      if (process.env.NODE_ENV === "development" || durationMs > 1000) {
        logger.info(`${req.method} ${url.pathname} completed (${response.status}) in ${durationMs}ms`, undefined, {
          requestId,
          module,
          durationMs,
          path: url.pathname,
          method: req.method,
        });
      }

      return response;
    } catch (error) {
      const durationMs = Date.now() - start;
      logger.error(`${req.method} ${url.pathname} failed after ${durationMs}ms`, error, {
        requestId,
        module,
        durationMs,
        path: url.pathname,
        method: req.method,
      });

      return createErrorResponse(error, "Internal Server Error", requestId, module);
    }
  };
}
