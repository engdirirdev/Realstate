import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitResponse,
} from "@/lib/rate-limiter";
import { executeSemanticSearch } from "@/lib/ai/semantic-search/semantic-search-service";

const RATE_LIMIT_CONFIG = { limit: 30, windowSeconds: 60 };

/**
 * POST /api/ai/semantic-search
 * Public and authenticated multilingual semantic search endpoint.
 *
 * Security:
 * - Rate-limited (30 req/min per user / IP)
 * - Server-side authorization check (never trusts client roles)
 * - Enforces property status visibility (unapproved properties never returned to public/customer)
 * - Input validation & length limits
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;
    const verifiedRole: Role | "PUBLIC" = (session?.user as any)?.role || "PUBLIC";

    // 1. Rate Limiting Check
    const clientId = getClientIdentifier(request, userId);
    const rateCheck = checkRateLimit(`semantic-search:${clientId}`, RATE_LIMIT_CONFIG);
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

    const { query, limit, threshold, filters } = body;

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

    // 3. Execute Canonical Semantic Search
    const searchResult = await executeSemanticSearch({
      query: query.trim(),
      limit: typeof limit === "number" ? limit : 10,
      threshold: typeof threshold === "number" ? threshold : 0.2,
      authContext: {
        role: verifiedRole,
        userId,
      },
      filters: filters && typeof filters === "object" ? filters : undefined,
    });

    return NextResponse.json({
      success: true,
      ...searchResult,
    });
  } catch (error: any) {
    console.error("[POST /api/ai/semantic-search] Internal error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process semantic search query" },
      { status: 500 }
    );
  }
}
