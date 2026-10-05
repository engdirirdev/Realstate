import { NextRequest, NextResponse } from "next/server";
import { createPurchaseRequest } from "@/lib/transactions";
import { requireUser, jsonError, unauthorized, forbidden } from "@/lib/api-utils";

// POST /api/purchase-requests  — customer asks to buy a FOR_SALE property
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    if (user.role !== "CUSTOMER") return forbidden("Only customer accounts can purchase properties.");

    const { propertyId, notes } = await request.json();
    if (!propertyId || typeof propertyId !== "string") {
      return NextResponse.json({ success: false, error: "propertyId is required." }, { status: 400 });
    }
    const req = await createPurchaseRequest(user.id, propertyId, typeof notes === "string" ? notes.slice(0, 2000) : undefined);
    return NextResponse.json({ success: true, request: req });
  } catch (e) {
    return jsonError(e, "Failed to submit purchase request.");
  }
}
