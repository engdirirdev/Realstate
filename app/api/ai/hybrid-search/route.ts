import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitResponse,
} from "@/lib/rate-limiter";
import { executeHybridSearch } from "@/lib/ai/hybrid-search/hybrid-search-service";

const RATE_LIMIT_CONFIG = { limit: 30, windowSeconds: 60 };

/**
 * POST /api/ai/hybrid-search
 * Multilingual Natural Language Query Understanding + Hybrid Retrieval + RRF
 *
 * Security & Reliability:
 * - Rate-limited (30 req/min per user / IP)
 * - Server-side authorization check (never trusts client roles)
 * - Enforces property status visibility (unapproved properties never returned)
 * - Input validation & 500-character safety limit
 * - Controlled relaxation when exactMatches = 0
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;
    const verifiedRole: Role | "PUBLIC" = (session?.user as any)?.role || "PUBLIC";

    // 1. Rate Limiting Check
    const clientId = getClientIdentifier(request, userId);
    const rateCheck = checkRateLimit(`hybrid-search:${clientId}`, RATE_LIMIT_CONFIG);
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck);
    }

    // 2. Parse & Validate Request Body
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { query, limit, threshold, sessionState } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Query string is required" },
        { status: 400 }
      );
    }

    if (query.length > 500) {
      return NextResponse.json(
        { success: false, error: "Query exceeds maximum limit of 500 characters" },
        { status: 400 }
      );
    }

    // 3. Execute Canonical Hybrid Search Pipeline
    const searchResult = await executeHybridSearch({
      query: query.trim(),
      limit: typeof limit === "number" ? limit : 10,
      threshold: typeof threshold === "number" ? threshold : 0.15,
      sessionState: sessionState && typeof sessionState === "object" ? sessionState : null,
      authContext: {
        role: verifiedRole,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      ...searchResult,
    });
  } catch (error: any) {
    console.error("[POST /api/ai/hybrid-search] Internal error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process hybrid search query" },
      { status: 500 }
    );
  }
}
