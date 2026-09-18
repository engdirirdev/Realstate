import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { propertyId, reason, details } = body;

    if (!propertyId || !reason) {
      return NextResponse.json({ error: "Property ID and reason are required" }, { status: 400 });
    }

    const report = await prisma.listingReport.create({
      data: {
        propertyId,
        userId: session?.user?.id || null,
        reason,
        details: details || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Report property error:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
