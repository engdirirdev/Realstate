import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import bcrypt from "bcryptjs";

// GET /api/customers - List customers for managers and admins
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN", "USER"]);
    if (authResult.response) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";
    const status = searchParams.get("status"); // "ACTIVE", "INACTIVE", "ALL"

    const where: any = {
      role: "CUSTOMER",
    };

    if (status === "ACTIVE") {
      where.isActive = true;
    } else if (status === "INACTIVE") {
      where.isActive = false;
    }

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { email: { contains: query } },
        { phone: { contains: query } },
      ];
    }

    const customers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            customerBookings: true,
            customerPayments: true,
            customerRentalRequests: true,
            customerPurchaseRequests: true,
            customerInquiries: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    console.error("[GET /api/customers]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch customers" }, { status: 500 });
  }
}

// POST /api/customers - Manager or Admin adds a new customer to the system
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN", "USER"]);
    if (authResult.response) {
      return authResult.response;
    }

    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ success: false, error: "Customer full name is required." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ success: false, error: "Customer email address is required." }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ success: false, error: "Please provide a valid email address." }, { status: 400 });
    }

    // Check if account already exists with this email
    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        error: `An account with email "${trimmedEmail}" already exists in the system (${existing.role}).`,
      }, { status: 409 });
    }

    // Default password if omitted
    const rawPassword = (password && typeof password === "string" && password.trim().length > 0)
      ? password.trim()
      : "Customer123!";

    if (rawPassword.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    const newCustomer = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        phone: phone && typeof phone === "string" && phone.trim() ? phone.trim() : null,
        password: hashedPassword,
        role: "CUSTOMER",
        isActive: true,
        preferences: {
          create: {},
        },
      },
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

    return NextResponse.json({
      success: true,
      message: `Customer "${newCustomer.name}" successfully created!`,
      customer: newCustomer,
      defaultPasswordUsed: !password || !password.trim(),
    }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/customers]", error);
    return NextResponse.json({ success: false, error: "Failed to create customer account." }, { status: 500 });
  }
}
