import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET: Fetch payments for Customer, Manager, or Admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;

    const where = role === "USER"
      ? { managerId: userId }
      : role === "ADMIN"
      ? {}
      : { customerId: userId };

    const sp = request.nextUrl.searchParams;
    const status = sp.get("status");
    const q = sp.get("q")?.trim();

    const filterWhere: any = { ...where };
    if (status && status !== "ALL") {
      filterWhere.status = status;
    }
    if (q) {
      filterWhere.OR = [
        { transactionRef: { contains: q } },
        { property: { title: { contains: q } } },
        { customer: { name: { contains: q } } },
        { customer: { email: { contains: q } } },
      ];
    }

    const [payments, revenueSummary, totalDeals] = await Promise.all([
      prisma.payment.findMany({
        where: filterWhere,
        include: {
          property: { select: { id: true, title: true, city: true } },
          customer: { select: { id: true, name: true, email: true } },
          manager: { select: { id: true, name: true, email: true } },
          booking: { select: { id: true, status: true, totalPrice: true } },
          receipt: { select: { id: true, receiptNo: true } },
          transaction: { select: { id: true, txnNo: true, type: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      (role === "ADMIN" || role === "USER")
        ? prisma.payment.aggregate({
            where: role === "USER" ? { managerId: userId, status: "PAID" } : { status: "PAID" },
            _sum: { amount: true },
            _count: { id: true },
          })
        : Promise.resolve(null),
      prisma.transaction.count({
        where: role === "USER" ? { managerId: userId } : role === "ADMIN" ? {} : { customerId: userId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      payments,
      totalRevenue: revenueSummary?._sum?.amount || 0,
      totalPaidTransactions: revenueSummary?._count?.id || 0,
      totalDeals,
    });
  } catch (error) {
    console.error("[GET /api/payments]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST: DISABLED. Payments are now created only through the approved
// transaction flow: POST /api/transactions/[id]/pay (server-side amount).
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: "Direct payments are no longer supported. Submit a purchase or rental request and pay once it is approved.",
    },
    { status: 410 }
  );
}
