import { NextRequest, NextResponse } from "next/server";
import { createRentalRequest } from "@/lib/transactions";
import { requireUser, jsonError, unauthorized, forbidden } from "@/lib/api-utils";

// POST /api/rental-requests  — customer asks to rent a FOR_RENT property for a date range
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    if (user.role !== "CUSTOMER") return forbidden("Only customer accounts can rent properties.");

    const { propertyId, startDate, endDate, notes } = await request.json();
    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: "Property and rental dates are required." }, { status: 400 });
    }
    const req = await createRentalRequest(
      user.id,
      String(propertyId),
      startDate,
      endDate,
      typeof notes === "string" ? notes.slice(0, 2000) : undefined
    );
    return NextResponse.json({ success: true, request: req });
  } catch (e) {
    return jsonError(e, "Failed to submit rental request.");
  }
}
