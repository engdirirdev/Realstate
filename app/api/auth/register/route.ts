import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/rate-limiter";
import {
  verifyRealEmailServer,
  validateSomaliPhone,
  assertUniqueUserIdentity,
} from "@/lib/server/identity-validation";

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rateCheck = checkRateLimit(`register:${clientId}`, { limit: 10, windowSeconds: 60 });
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck);
    }

    const body = await request.json();
    const { name, username, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "Name, username, email, and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters." }, { status: 400 });
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

    const cleanEmail = emailCheck.normalized;
    const cleanPhone = phoneCheck.normalized;
    const cleanName = name.trim();
    const cleanUsername = typeof username === "string" ? username.trim().replace(/\s+/g, "").toLowerCase() : "";

    // 3. Enforce global cross-portal uniqueness (email & phone)
    const uniqueCheck = await assertUniqueUserIdentity({
      email: cleanEmail,
      phone: cleanPhone,
    });
    if (!uniqueCheck.ok) {
      return NextResponse.json({ success: false, error: uniqueCheck.error }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        phone: cleanPhone,
        role: "CUSTOMER",
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: cleanUsername || user.email.split("@")[0],
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
