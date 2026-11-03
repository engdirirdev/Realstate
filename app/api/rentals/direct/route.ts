import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { PERMISSIONS } from "@/lib/rbac";
import { createDirectRental, TxnError } from "@/lib/transactions";

// POST /api/rentals/direct - Manager creates rental agreement directly for a customer
export async function POST(req: NextRequest) {
  try {
    const authResult = await requirePermission(PERMISSIONS.DIRECT_RENTAL_CREATE);
    if (authResult.response) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await req.json();
    const { propertyId, customerId, startDate, endDate, rentAmount, securityDeposit, paymentStatus, notes } = body;

    if (!propertyId || !customerId || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: "Property, customer, check-in date, and check-out date are required." },
        { status: 400 }
      );
    }

    const result = await createDirectRental(
      { id: user.id, role: user.role, name: user.name },
      {
        propertyId,
        customerId,
        startDate,
        endDate,
        rentAmount: rentAmount !== undefined && rentAmount !== null && rentAmount !== "" ? Number(rentAmount) : undefined,
        securityDeposit: securityDeposit !== undefined && securityDeposit !== null && securityDeposit !== "" ? Number(securityDeposit) : undefined,
        paymentStatus: paymentStatus === "PAID" ? "PAID" : "PENDING",
        notes,
      }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[POST /api/rentals/direct]", error);
    if (error instanceof TxnError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: error.message || "Failed to create rental." }, { status: 500 });
  }
}
