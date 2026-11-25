import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import bcrypt from "bcryptjs";
import {
  verifyRealEmailServer,
  validateSomaliPhone,
  assertUniqueUserIdentity,
} from "@/lib/server/identity-validation";

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

    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");
    const page = Math.max(1, parseInt(pageParam || "1", 10));
    const pageSize = pageSizeParam ? Math.min(100, Math.max(1, parseInt(pageSizeParam, 10))) : 25;
    const skip = (page - 1) * pageSize;

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
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
        take: pageSize,
        skip,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      customers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
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

    const trimmedEmail = emailCheck.normalized;

    // 3. Enforce global cross-portal uniqueness for email & phone
    const uniqueCheck = await assertUniqueUserIdentity({
      email: trimmedEmail,
      phone: phoneCheck.normalized,
    });
    if (!uniqueCheck.ok) {
      return NextResponse.json({
        success: false,
        error: uniqueCheck.error,
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
        phone: phoneCheck.normalized,
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
