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
