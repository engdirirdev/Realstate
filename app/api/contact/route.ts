import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rateCheck = checkRateLimit(`contact:${clientId}`, { limit: 5, windowSeconds: 60 });
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck);
    }

    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ success: false, error: "All fields (name, email, subject, message) are required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    await prisma.contactMessage.create({
      data: {
        name: name.trim().slice(0, 100),
        email: email.trim().toLowerCase().slice(0, 150),
        subject: subject.trim().slice(0, 200),
        message: message.trim().slice(0, 5000),
      },
    });

    return NextResponse.json({ success: true, message: "Message received. We'll respond within 24 hours." });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
