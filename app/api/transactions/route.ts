import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncRentalLifecycle } from "@/lib/transactions";
import { requireUser, jsonError, unauthorized, forbidden, parsePaging } from "@/lib/api-utils";

// GET /api/transactions?type=SALE|RENTAL&status=&q=&page=&pageSize=
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    await syncRentalLifecycle();

    const sp = request.nextUrl.searchParams;
    const type = sp.get("type");
    const status = sp.get("status");
    const q = sp.get("q")?.trim();
    const { page, pageSize, skip } = parsePaging(sp);

    const scope: any =
      user.role === "ADMIN" ? {} : user.role === "USER" ? { managerId: user.id } : user.role === "CUSTOMER" ? { customerId: user.id } : null;
    if (!scope) return forbidden();

    const where: any = { ...scope };
    if (user.role === "USER") {
      where.type = "RENTAL";
    } else if (type === "SALE" || type === "RENTAL") {
      where.type = type;
    }
    if (status && status !== "ALL") where.status = status;
    if (q) where.OR = [{ txnNo: { contains: q } }, { property: { title: { contains: q } } }];

    const [items, total, revenue] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
            },
          },
          customer: { select: { id: true, name: true, email: true, phone: true } },
          manager: { select: { id: true, name: true } },
          rentalRequest: { select: { startDate: true, endDate: true, rentalPeriod: true, periods: true } },
          receipt: { select: { id: true, receiptNo: true } },
          payments: { select: { status: true, paidAt: true, paymentMethod: true }, orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.transaction.count({ where }),
      user.role === "CUSTOMER"
        ? Promise.resolve(null)
        : prisma.payment.aggregate({
            where: { status: "PAID", transaction: { is: where } },
            _sum: { amount: true },
            _count: { id: true },
          }),
    ]);

    return NextResponse.json({
      success: true,
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      revenue: revenue?._sum.amount ?? null,
    });
  } catch (e) {
    return jsonError(e, "Failed to load transactions.");
  }
}
