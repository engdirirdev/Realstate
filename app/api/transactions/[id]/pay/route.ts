import { NextRequest, NextResponse } from "next/server";
import { payTransaction } from "@/lib/transactions";
import { requireUser, jsonError, unauthorized, forbidden } from "@/lib/api-utils";

type Props = { params: Promise<{ id: string }> };

const METHODS = ["SANDBOX", "MOBILE_MONEY", "BANK_TRANSFER", "CARD"];

// POST /api/transactions/[id]/pay
// Sandbox gateway: no real money moves. The amount is ALWAYS the server-side transaction amount.
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    if (user.role !== "CUSTOMER") return forbidden("Only the customer can pay for this transaction.");

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const method = METHODS.includes(body?.paymentMethod) ? body.paymentMethod : "SANDBOX";

    const result = await payTransaction(id, user.id, method);
    return NextResponse.json({
      success: true,
      payment: { id: result.payment.id, reference: result.payment.transactionRef, amount: result.payment.amount },
      receiptId: result.receipt.id,
      receiptNo: result.receipt.receiptNo,
      transactionStatus: result.transactionStatus,
    });
  } catch (e) {
    return jsonError(e, "Payment failed. Please try again.");
  }
}
