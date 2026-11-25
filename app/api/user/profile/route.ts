import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { dbCache } from "@/lib/cache";
import bcrypt from "bcryptjs";
import {
  verifyRealEmailServer,
  validateSomaliPhone,
  assertUniqueUserIdentity,
} from "@/lib/server/identity-validation";

// GET — get current user profile + preferences
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.email.split("@")[0],
        email: user.email,
        phone: user.phone || "",
        image: user.image || "",
        role: user.role,
        createdAt: user.createdAt,
      },
      preferences: user.preferences,
    });
  } catch (error) {
    console.error("[GET /api/user/profile]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PATCH — update user profile (name, username/email, phone, profile picture image, and optional password)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      username,
      email,
      phone,
      image,
      currentPassword,
      newPassword,
    } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!existingUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (name !== undefined) {
      if (String(name).trim().length < 2) {
        return NextResponse.json(
          { success: false, error: "Name must be at least 2 characters." },
          { status: 400 }
        );
      }
      updateData.name = String(name).trim();
    }

    // Handle email or username update
    if (email !== undefined && String(email).trim()) {
      const targetEmail = String(email).trim().toLowerCase();
      if (targetEmail !== existingUser.email.toLowerCase()) {
        const emailCheck = await verifyRealEmailServer(targetEmail);
        if (!emailCheck.valid) {
          return NextResponse.json(
            { success: false, error: emailCheck.error },
            { status: 400 }
          );
        }
        const uniqueCheck = await assertUniqueUserIdentity({
          email: emailCheck.normalized,
          excludeUserId: existingUser.id,
        });
        if (!uniqueCheck.ok) {
          return NextResponse.json(
            { success: false, error: uniqueCheck.error },
            { status: 409 }
          );
        }
        updateData.email = emailCheck.normalized;
      }
    } else if (username !== undefined && String(username).trim()) {
      const rawUser = String(username).trim().toLowerCase();
      const domain = existingUser.email.includes("@")
        ? existingUser.email.split("@")[1]
        : "kiromaal.com";
      const targetEmail = rawUser.includes("@") ? rawUser : `${rawUser}@${domain}`;
      if (targetEmail !== existingUser.email.toLowerCase()) {
        const emailCheck = await verifyRealEmailServer(targetEmail);
        if (!emailCheck.valid) {
          return NextResponse.json(
            { success: false, error: emailCheck.error },
            { status: 400 }
          );
        }
        const uniqueCheck = await assertUniqueUserIdentity({
          email: emailCheck.normalized,
          excludeUserId: existingUser.id,
        });
        if (!uniqueCheck.ok) {
          return NextResponse.json(
            { success: false, error: uniqueCheck.error },
            { status: 409 }
          );
        }
        updateData.email = emailCheck.normalized;
      }
    }

    if (phone !== undefined) {
      const phoneCheck = validateSomaliPhone(phone, { required: false });
      if (!phoneCheck.valid) {
        return NextResponse.json(
          { success: false, error: phoneCheck.error },
          { status: 400 }
        );
      }
      if (phoneCheck.normalized) {
        const uniqueCheck = await assertUniqueUserIdentity({
          phone: phoneCheck.normalized,
          excludeUserId: existingUser.id,
        });
        if (!uniqueCheck.ok) {
          return NextResponse.json(
            { success: false, error: uniqueCheck.error },
            { status: 409 }
          );
        }
      }
      updateData.phone = phoneCheck.normalized;
    }

    if (image !== undefined) {
      updateData.image = image ? String(image).trim() : null;
    }

    // Optional password update in the same request
    if (newPassword && String(newPassword).trim()) {
      const cleanNew = String(newPassword).trim();
      if (cleanNew.length < 6) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }
      if (currentPassword) {
        const matches = await bcrypt.compare(String(currentPassword), existingUser.password);
        if (!matches) {
          return NextResponse.json(
            { success: false, error: "Current password is incorrect." },
            { status: 400 }
          );
        }
      }
      updateData.password = await bcrypt.hash(cleanNew, 12);
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
      },
    });

    dbCache.invalidateTags(["users"]);

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        username: user.email.split("@")[0],
      },
    });
  } catch (error) {
    console.error("[PATCH /api/user/profile]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
