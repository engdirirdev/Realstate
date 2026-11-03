import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guards";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rate-limiter";
import bcrypt from "bcryptjs";

// PATCH: Change user password with brute-force rate limiting and length enforcement
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult.response) {
      return authResult.response;
    }
    const { user } = authResult;

    // Rate Limiting: Max 5 password change attempts per minute per user
    const rateCheck = checkRateLimit(`pwd_change:${user.id}`, {
      limit: 5,
      windowSeconds: 60,
    });
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck);
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, password: true },
    });

    if (!dbUser || !dbUser.password) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    const matches = await bcrypt.compare(currentPassword, dbUser.password);
    if (!matches) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    // Hash with 12 salt rounds for strong security
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error: any) {
    console.error("[PATCH /api/user/password]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update password. Please try again." },
      { status: 500 }
    );
  }
}
