import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST: Register or refresh a native mobile push token (FCM / APNs)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const platform = typeof body?.platform === "string" ? body.platform.trim().toLowerCase() : "android";
    const deviceName = typeof body?.deviceName === "string" ? body.deviceName.trim().slice(0, 120) : null;

    if (!token || token.length < 16) {
      return NextResponse.json({ success: false, error: "Invalid push token." }, { status: 400 });
    }

    await prisma.deviceToken.upsert({
      where: { token },
      update: {
        userId: session.user.id,
        platform,
        deviceName,
        isActive: true,
      },
      create: {
        userId: session.user.id,
        token,
        platform,
        deviceName,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/mobile/push-token]", error);
    return NextResponse.json({ success: false, error: "Failed to register push token" }, { status: 500 });
  }
}

// DELETE: Deactivate a push token on sign out
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (token) {
      await prisma.deviceToken.updateMany({
        where: { token, userId: session.user.id },
        data: { isActive: false },
      });
    } else {
      await prisma.deviceToken.updateMany({
        where: { userId: session.user.id },
        data: { isActive: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/mobile/push-token]", error);
    return NextResponse.json({ success: false, error: "Failed to remove push token" }, { status: 500 });
  }
}

