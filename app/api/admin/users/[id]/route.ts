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

type Props = { params: Promise<{ id: string }> };

// GET: Fetch detailed user info & preview dashboard data
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        preferences: true,
        favorites: {
          include: { property: { include: { images: { take: 1, orderBy: { order: "asc" } } } } },
          orderBy: { createdAt: "desc" },
        },
        recommendations: {
          include: { property: { include: { images: { take: 1, orderBy: { order: "asc" } } } } },
          orderBy: { score: "desc" },
        },
        managedProperties: {
          include: { images: { take: 1, orderBy: { order: "asc" } } },
          orderBy: { createdAt: "desc" },
        },
        customerInquiries: {
          include: { property: { select: { title: true, city: true, price: true } } },
          orderBy: { createdAt: "desc" },
        },
        managerInquiries: {
          include: { property: { select: { title: true, city: true } }, customer: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
        customerBookings: {
          include: { property: { select: { title: true, city: true, price: true } }, payments: true },
          orderBy: { createdAt: "desc" },
        },
        managerBookings: {
          include: { property: { select: { title: true, city: true } }, customer: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
        customerPayments: {
          include: { property: { select: { title: true } } },
          orderBy: { createdAt: "desc" },
        },
        managerPayments: {
          include: { property: { select: { title: true } }, customer: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Security: exclude password hash
    const { password: _, ...safeUser } = user as any;

    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("[GET /api/admin/users/[id]]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch user preview data" }, { status: 500 });
  }
}

// PATCH: Update user account details (name, email, phone, role, isActive, optional password)
export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, phone, role, isActive, password } = body;

    const updateData: any = {};

    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (cleanName.length < 2) {
        return NextResponse.json({ success: false, error: "Full name must be at least 2 characters." }, { status: 400 });
      }
      updateData.name = cleanName;
    }

    if (email !== undefined) {
      const targetEmail = String(email).trim().toLowerCase();
      if (targetEmail !== existingUser.email.toLowerCase()) {
        const emailCheck = await verifyRealEmailServer(targetEmail);
        if (!emailCheck.valid) {
          return NextResponse.json({ success: false, error: emailCheck.error }, { status: 400 });
        }
        const uniqueCheck = await assertUniqueUserIdentity({
          email: emailCheck.normalized,
          excludeUserId: id,
        });
        if (!uniqueCheck.ok) {
          return NextResponse.json({ success: false, error: uniqueCheck.error }, { status: 409 });
        }
        updateData.email = emailCheck.normalized;
      }
    }

    if (phone !== undefined) {
      const phoneCheck = validateSomaliPhone(phone, { required: false });
      if (!phoneCheck.valid) {
        return NextResponse.json({ success: false, error: phoneCheck.error }, { status: 400 });
      }
      if (phoneCheck.normalized) {
        const uniqueCheck = await assertUniqueUserIdentity({
          phone: phoneCheck.normalized,
          excludeUserId: id,
        });
        if (!uniqueCheck.ok) {
          return NextResponse.json({ success: false, error: uniqueCheck.error }, { status: 409 });
        }
      }
      updateData.phone = phoneCheck.normalized;
    }

    if (role !== undefined && (role === "ADMIN" || role === "USER" || role === "CUSTOMER")) {
      updateData.role = role;
    }

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    if (password !== undefined && String(password).trim() !== "") {
      const pwdCheck = validateStrongPassword(String(password));
      if (!pwdCheck.valid) {
        return NextResponse.json({ success: false, error: pwdCheck.error }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(String(password), 12);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("[PATCH /api/admin/users/[id]]", error);
    return NextResponse.json({ success: false, error: "Failed to update user account" }, { status: 500 });
  }
}

// DELETE: Delete user or customer account
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    if (session.user.id === id) {
      return NextResponse.json({ error: "You cannot delete your own logged-in admin account." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/users/[id]]", error);
    return NextResponse.json({ error: "Failed to delete user account." }, { status: 500 });
  }
}
