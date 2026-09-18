import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

// POST: Admin creates a new User or Admin account
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, phone, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "Name, email, and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const assignedRole = role === "ADMIN" ? "ADMIN" : "USER";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: assignedRole,
        isActive: true,
        preferences: { create: {} },
      },
    });

    return NextResponse.json({
      success: true,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
    });
  } catch (error) {
    console.error("[POST /api/admin/users]", error);
    return NextResponse.json({ success: false, error: "Failed to create user account." }, { status: 500 });
  }
}

// PATCH: Admin updates role or active status of an existing account
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const body = await request.json();
    const { userId, role, isActive } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required." }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (role && (role === "ADMIN" || role === "USER")) {
      dataToUpdate.role = role;
    }
    if (typeof isActive === "boolean") {
      dataToUpdate.isActive = isActive;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      user: { id: updatedUser.id, role: updatedUser.role, isActive: updatedUser.isActive },
    });
  } catch (error) {
    console.error("[PATCH /api/admin/users]", error);
    return NextResponse.json({ success: false, error: "Failed to update user." }, { status: 500 });
  }
}
