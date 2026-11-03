import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";

type Props = { params: Promise<{ id: string }> };

// GET: Fetch customer details and summary activity
export async function GET(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const authResult = await requireRole(["ADMIN", "USER"]);
    if (authResult.response) {
      return authResult.response;
    }

    const customer = await prisma.user.findFirst({
      where: { id, role: "CUSTOMER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            customerBookings: true,
            customerPayments: true,
            customerRentalRequests: true,
            customerPurchaseRequests: true,
            customerInquiries: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error("[GET /api/customers/[id]]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch customer." }, { status: 500 });
  }
}

// PATCH: Update customer details (name, phone, isActive status)
export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const authResult = await requireRole(["ADMIN", "USER"]);
    if (authResult.response) {
      return authResult.response;
    }

    const body = await req.json();
    const { name, phone, isActive } = body;

    const dataToUpdate: any = {};
    if (name && typeof name === "string" && name.trim()) {
      dataToUpdate.name = name.trim();
    }
    if (phone !== undefined) {
      dataToUpdate.phone = typeof phone === "string" && phone.trim() ? phone.trim() : null;
    }
    if (typeof isActive === "boolean") {
      dataToUpdate.isActive = isActive;
    }

    const updatedCustomer = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Customer updated successfully.",
      customer: updatedCustomer,
    });
  } catch (error: any) {
    console.error("[PATCH /api/customers/[id]]", error);
    return NextResponse.json({ success: false, error: "Failed to update customer." }, { status: 500 });
  }
}
