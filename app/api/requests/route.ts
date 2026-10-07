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
    const mode = sp.get("mode"); // "bookings" | "rentals"
    const status = sp.get("status");
    const q = sp.get("q")?.trim();
    const { page, pageSize, skip } = parsePaging(sp);

    const scope: any =
      user.role === "ADMIN" ? {} : user.role === "USER" ? { managerId: user.id } : user.role === "CUSTOMER" ? { customerId: user.id } : null;
    if (!scope) return forbidden();

    const where: any = { ...scope };

    if (kind === "rental" && mode === "bookings") {
      // Rental Bookings: PENDING, APPROVED, REJECTED, CANCELLED
      if (!status || status === "ALL") {
        where.bookingStatus = { in: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] };
      } else if (status === "PENDING") {
        where.bookingStatus = "PENDING";
      } else if (status === "APPROVED") {
        where.bookingStatus = "APPROVED";
      } else if (status === "REJECTED") {
        where.bookingStatus = "REJECTED";
      } else if (status === "CANCELLED") {
        where.bookingStatus = "CANCELLED";
      }
    } else if (kind === "rental" && mode === "rentals") {
      // Actual Rentals / Tenancies: ACTIVE, EXPIRED, COMPLETED, CANCELLED (Never PENDING)
      if (!status || status === "ALL") {
        where.rentalStatus = { in: ["ACTIVE", "EXPIRED", "COMPLETED", "CANCELLED"] };
      } else if (status === "ACTIVE") {
        where.rentalStatus = "ACTIVE";
      } else if (status === "EXPIRED") {
        where.rentalStatus = "EXPIRED";
      } else if (status === "COMPLETED") {
        where.rentalStatus = "COMPLETED";
      } else if (status === "CANCELLED") {
        where.rentalStatus = "CANCELLED";
      }
    } else {
      if (status && status !== "ALL") where.status = status;
    }

    if (q) {
      where.OR = [
        { requestNo: { contains: q } },
        { agreementNo: { contains: q } },
        { property: { title: { contains: q } } },
        { customer: { name: { contains: q } } },
      ];
    }

    const include = {
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          location: true,
          status: true,
          listingType: true,
          availabilityStatus: true,
          price: true,
          images: { take: 1, select: { url: true } },
        },
      },
      customer: { select: { id: true, name: true, email: true, phone: true } },
      manager: { select: { id: true, name: true, email: true, phone: true } },
      transaction: {
        select: {
          id: true,
          txnNo: true,
          status: true,
          amount: true,
          currency: true,
          receipt: { select: { id: true, receiptNo: true } },
          payments: {
            select: { id: true, status: true, paymentMethod: true, transactionRef: true, amount: true, paidAt: true },
            take: 1,
            orderBy: { createdAt: "desc" as const },
          },
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
