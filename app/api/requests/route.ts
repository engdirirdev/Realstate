import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncRentalLifecycle } from "@/lib/transactions";
import { requireUser, jsonError, unauthorized, forbidden, parsePaging } from "@/lib/api-utils";

// GET /api/requests?kind=purchase|rental&status=&q=&page=&pageSize=
// Scope: ADMIN = everything, USER (manager) = own properties, CUSTOMER = own requests.
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    await syncRentalLifecycle();

    const sp = request.nextUrl.searchParams;
    const kind = sp.get("kind") === "rental" ? "rental" : "purchase";
    const status = sp.get("status");
    const q = sp.get("q")?.trim();
    const { page, pageSize, skip } = parsePaging(sp);

    const scope: any =
      user.role === "ADMIN" ? {} : user.role === "USER" ? { managerId: user.id } : user.role === "CUSTOMER" ? { customerId: user.id } : null;
    if (!scope) return forbidden();

    const where: any = { ...scope };
    if (status && status !== "ALL") where.status = status;
    if (q) {
      where.OR = [
        { requestNo: { contains: q } },
        { property: { title: { contains: q } } },
        { customer: { name: { contains: q } } },
      ];
    }

    const include = {
      property: { select: { id: true, title: true, city: true, status: true, listingType: true, availabilityStatus: true, price: true } },
      customer: { select: { id: true, name: true, email: true, phone: true } },
      manager: { select: { id: true, name: true } },
      transaction: {
        select: {
          id: true,
          txnNo: true,
          status: true,
          amount: true,
          currency: true,
          receipt: { select: { id: true, receiptNo: true } },
          payments: { select: { id: true, status: true, paymentMethod: true, paidAt: true }, take: 1, orderBy: { createdAt: "desc" as const } },
        },
      },
    };

    const [items, total] =
      kind === "purchase"
        ? await Promise.all([
            prisma.purchaseRequest.findMany({ where, include, orderBy: { createdAt: "desc" }, skip, take: pageSize }),
            prisma.purchaseRequest.count({ where }),
          ])
        : await Promise.all([
            prisma.rentalRequest.findMany({ where, include, orderBy: { createdAt: "desc" }, skip, take: pageSize }),
            prisma.rentalRequest.count({ where }),
          ]);

    return NextResponse.json({ success: true, kind, items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    return jsonError(e, "Failed to load requests.");
  }
}
