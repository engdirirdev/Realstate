import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitResponse,
} from "@/lib/rate-limiter";
import { buildUserProfile } from "@/lib/ai/behavior/profile-builder";

const RATE_LIMIT_CONFIG = { limit: 30, windowSeconds: 60 };

/**
 * GET /api/ai/profile
 * Retrieves the authenticated user's learned behavioral profile.
 *
 * Security:
 * - Rate-limited (30 req/min)
 * - Server-side authorization check (never trusts client-supplied userId)
 * - Cross-user data isolation: Users can only access their own profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required to access preference profile" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Rate Limiting Check
    const clientId = getClientIdentifier(request, userId);
    const rateCheck = checkRateLimit(`ai-profile:${clientId}`, RATE_LIMIT_CONFIG);
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck);
    }

    // Build or fetch user profile
    const profile = await buildUserProfile(userId);

    // Omit raw 768-d float array from public payload for bandwidth efficiency unless requested
    const { semanticVector, ...cleanProfile } = profile;

    return NextResponse.json({
      success: true,
      profile: {
        ...cleanProfile,
        hasSemanticVector: !!semanticVector,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/ai/profile] Internal error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve user preference profile" },
      { status: 500 }
    );
  }
}
