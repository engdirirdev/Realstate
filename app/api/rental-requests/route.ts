import { NextRequest, NextResponse } from "next/server";
import { createRentalRequest } from "@/lib/transactions";
import { requireUser, jsonError, unauthorized, forbidden } from "@/lib/api-utils";

// POST /api/rental-requests — customer initiates rental booking + payment
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    if (user.role !== "CUSTOMER") return forbidden("Only customer accounts can rent properties.");

    const body = await request.json();
    const { propertyId, startDate, endDate, notes, paymentMethod, transactionRef } = body;

    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: "Property and rental dates are required." }, { status: 400 });
    }

    if (!paymentMethod || typeof paymentMethod !== "string") {
      return NextResponse.json({ success: false, error: "Payment method is required." }, { status: 400 });
    }

    if (!transactionRef || typeof transactionRef !== "string" || !transactionRef.trim()) {
      return NextResponse.json(
        { success: false, error: "Transaction reference is required for payment verification." },
        { status: 400 }
      );
    }

    const result = await createRentalRequest(
      user.id,
      String(propertyId),
      startDate,
      endDate,
      typeof notes === "string" ? notes.slice(0, 2000) : undefined,
      paymentMethod.trim(),
      transactionRef.trim()
    );

    return NextResponse.json({
      success: true,
      request: result,
      message: "Payment submitted successfully. Your booking is waiting for Manager approval.",
    });
  } catch (e) {
    return jsonError(e, "Failed to submit rental booking.");
  }
}
