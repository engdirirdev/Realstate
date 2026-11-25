import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import {
  verifyRealEmailServer,
  validateSomaliPhone,
  validateStrongPassword,
  assertUniqueUserIdentity,
} from "@/lib/server/identity-validation";

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

    const pwdCheck = validateStrongPassword(password);
    if (!pwdCheck.valid) {
      return NextResponse.json({ success: false, error: pwdCheck.error }, { status: 400 });
    }

    // 1. Validate real, existing email
    const emailCheck = await verifyRealEmailServer(email);
    if (!emailCheck.valid) {
      return NextResponse.json({ success: false, error: emailCheck.error }, { status: 400 });
    }

    // 2. Validate Somali phone number (+252 + 9 digits starting with 61-66, 90, 77)
    const phoneCheck = validateSomaliPhone(phone, { required: false });
    if (!phoneCheck.valid) {
      return NextResponse.json({ success: false, error: phoneCheck.error }, { status: 400 });
    }

    const assignedRole = role === "ADMIN" ? "ADMIN" : role === "CUSTOMER" ? "CUSTOMER" : "USER";

    // 3. Enforce global cross-portal uniqueness for email & phone
    const uniqueCheck = await assertUniqueUserIdentity({
      email: emailCheck.normalized,
      phone: phoneCheck.normalized,
    });
    if (!uniqueCheck.ok) {
      return NextResponse.json({ success: false, error: uniqueCheck.error }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailCheck.normalized,
        password: hashedPassword,
        phone: phoneCheck.normalized,
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
    if (role && (role === "ADMIN" || role === "USER" || role === "CUSTOMER")) {
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

// Re-export GET from users-list for RESTful convention
export { GET } from "../users-list/route";
