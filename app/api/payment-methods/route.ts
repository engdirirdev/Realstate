import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPaymentMethodsConfig, savePaymentMethodsConfig, type PaymentMethodConfig } from "@/lib/payment-settings";

// GET /api/payment-methods - Get active payment methods (or all for admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = (session?.user as any)?.role === "ADMIN";
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true" && isAdmin;

    const methods = await getPaymentMethodsConfig(!all);
    return NextResponse.json({ success: true, methods });
  } catch (error) {
    console.error("[GET /api/payment-methods]", error);
    return NextResponse.json({ success: false, error: "Failed to load payment methods" }, { status: 500 });
  }
}

// PUT /api/payment-methods - Admin updates payment methods configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized. Administrator privileges required." }, { status: 403 });
    }

    const body = await request.json();
    const methods = body.methods as PaymentMethodConfig[];
    if (!Array.isArray(methods)) {
      return NextResponse.json({ success: false, error: "Invalid payment methods payload." }, { status: 400 });
    }

    const updated = await savePaymentMethodsConfig(methods);
    return NextResponse.json({ success: true, methods: updated });
  } catch (error) {
    console.error("[PUT /api/payment-methods]", error);
    return NextResponse.json({ success: false, error: "Failed to update payment methods" }, { status: 500 });
  }
}
