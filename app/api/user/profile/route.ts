import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// PATCH — update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { name, phone } = await request.json();

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: "Name must be at least 2 characters" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
      },
      select: { id: true, name: true, email: true, phone: true },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("[PATCH /api/user/profile]", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}

// GET — get current user profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, phone: true, image: true, createdAt: true },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("[GET /api/user/profile]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}
