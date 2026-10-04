import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitResponse,
} from "@/lib/rate-limiter";
import { recordInteraction } from "@/lib/ai/behavior/event-recorder";
import { InteractionType } from "@prisma/client";

const RATE_LIMIT_CONFIG = { limit: 60, windowSeconds: 60 };

const VALID_INTERACTION_TYPES = new Set<InteractionType>([
  "VIEW",
  "CLICK",
  "FAVORITE",
  "UNFAVORITE",
  "INQUIRY",
  "SEARCH_CLICK",
  "SAVE",
  "UNSAVE",
  "SHARE",
]);

/**
 * POST /api/ai/behavior
 * Records an authenticated user's behavioral interaction.
 *
 * Security:
 * - Rate-limited (60 req/min per user / IP)
 * - Server-side authorization check (never trusts client-supplied userId)
 * - Input validation & noise throttling
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required to record behavioral signals" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 1. Rate Limiting Check
    const clientId = getClientIdentifier(request, userId);
    const rateCheck = checkRateLimit(`ai-behavior:${clientId}`, RATE_LIMIT_CONFIG);
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

    const { eventType, propertyId, metadata } = body;

    if (!eventType || typeof eventType !== "string" || !VALID_INTERACTION_TYPES.has(eventType as InteractionType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid eventType. Allowed: ${Array.from(VALID_INTERACTION_TYPES).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 3. Record Interaction
    const result = await recordInteraction({
      userId,
      propertyId: typeof propertyId === "string" ? propertyId : null,
      eventType: eventType as InteractionType,
      metadata: metadata && typeof metadata === "object" ? metadata : undefined,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[POST /api/ai/behavior] Internal error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record behavioral signal" },
      { status: 500 }
    );
  }
}
