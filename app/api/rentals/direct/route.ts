import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createDirectRental, TxnError } from "@/lib/transactions";

// POST /api/rentals/direct - Manager creates rental agreement directly for a customer
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (role !== "USER" && role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Only managers and administrators can create direct rentals." }, { status: 403 });
    }

    const body = await req.json();
    const { propertyId, customerId, startDate, endDate, rentAmount, securityDeposit, paymentStatus, notes } = body;

    if (!propertyId || !customerId || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: "Property, customer, check-in date, and check-out date are required." },
        { status: 400 }
      );
    }

    const result = await createDirectRental(
      { id: session.user.id, role, name: session.user.name },
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
