import { prisma } from "@/lib/prisma";
import { getPaymentMethodsConfig } from "@/lib/payment-settings";
import { dbCache } from "@/lib/cache";

// ─── 1. RENTAL & BOOKINGS DASHBOARD DATA ───────────────────────────
export async function getRentalDashboardData(userId: string, role: string) {
  const cacheKey = `dashboard:rentals:${role}:${userId}`;
  return dbCache.getOrSet(cacheKey, 15, async () => {
    const andClauses: any[] = [];
    if (role === "ADMIN") {
      // Admin has global oversight
    } else if (role === "USER") {
      andClauses.push({
        OR: [
          { managerId: userId },
          { property: { managerId: userId } },
          { AND: [{ managerId: null }, { property: { managerId: null } }] },
        ],
      });
    } else {
      andClauses.push({ customerId: userId });
    }

    const baseWhere: any = andClauses.length > 0 ? { AND: andClauses } : {};
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const bookingsWhere: any = {
      ...baseWhere,
      bookingStatus: { in: ["PENDING", "APPROVED", "CONFIRMED", "REJECTED", "CANCELLED"] },
    };

    const rentalsWhere: any = {
      ...baseWhere,
      rentalStatus: { in: ["ACTIVE", "EXPIRED", "COMPLETED", "CANCELLED"] },
    };

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

    const [
      pendingBookings,
      approvedBookings,
      activeRentals,
      expiringSoon,
      rawBookings,
      totalBookings,
      rawRentals,
      totalRentals,
    ] = await Promise.all([
      prisma.rentalRequest.count({ where: { ...baseWhere, bookingStatus: "PENDING" } }),
      prisma.rentalRequest.count({ where: { ...baseWhere, bookingStatus: { in: ["APPROVED", "CONFIRMED"] } } }),
      prisma.rentalRequest.count({ where: { ...baseWhere, rentalStatus: "ACTIVE" } }),
      prisma.rentalRequest.count({
        where: { ...baseWhere, rentalStatus: "ACTIVE", endDate: { gt: now, lte: in30Days } },
      }),
      prisma.rentalRequest.findMany({
        where: bookingsWhere,
        include,
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.rentalRequest.count({ where: bookingsWhere }),
      prisma.rentalRequest.findMany({
        where: rentalsWhere,
        include,
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.rentalRequest.count({ where: rentalsWhere }),
    ]);

    // Deep serialization of dates to ISO strings for safe Client Component hydration
    const serializeItem = (item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
      startDate: item.startDate ? new Date(item.startDate).toISOString() : null,
      endDate: item.endDate ? new Date(item.endDate).toISOString() : null,
      transaction: item.transaction
        ? {
            ...item.transaction,
            payments: item.transaction.payments?.map((p: any) => ({
              ...p,
              paidAt: p.paidAt ? new Date(p.paidAt).toISOString() : null,
            })),
          }
        : null,
    });

    return {
      metrics: { pendingBookings, approvedBookings, activeRentals, expiringSoon },
      bookings: rawBookings.map(serializeItem),
      totalBookings,
      rentals: rawRentals.map(serializeItem),
      totalRentals,
    };
  }, ["rentals", "bookings"]);
}

// ─── 2. TRANSACTIONS & PAYMENTS DASHBOARD DATA ─────────────────────
export async function getTransactionsDashboardData(userId: string, role: string) {
  const cacheKey = `dashboard:transactions:${role}:${userId}`;
  return dbCache.getOrSet(cacheKey, 15, async () => {
    const paymentScope =
      role === "USER"
        ? { managerId: userId }
        : role === "ADMIN"
        ? {}
        : { customerId: userId };

    const ledgerScope: any =
      role === "ADMIN"
        ? {}
        : role === "USER"
        ? { managerId: userId, type: "RENTAL" }
        : { customerId: userId };

    const [rawPayments, revenueSummary, totalDeals, rawLedgerItems, totalLedger] = await Promise.all([
      prisma.payment.findMany({
        where: paymentScope,
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
          manager: { select: { id: true, name: true, email: true } },
          booking: { select: { id: true, status: true, totalPrice: true } },
          receipt: { select: { id: true, receiptNo: true } },
          transaction: { select: { id: true, txnNo: true, type: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      role === "ADMIN" || role === "USER"
        ? prisma.payment.aggregate({
            where: role === "USER" ? { managerId: userId, status: "PAID" } : { status: "PAID" },
            _sum: { amount: true },
            _count: { id: true },
          })
        : Promise.resolve(null),
      prisma.transaction.count({
        where: ledgerScope,
      }),
      prisma.transaction.findMany({
        where: ledgerScope,
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
          payments: {
            select: { status: true, paidAt: true, paymentMethod: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.transaction.count({ where: ledgerScope }),
    ]);

    const serializePayment = (p: any) => ({
      ...p,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      paidAt: p.paidAt ? new Date(p.paidAt).toISOString() : null,
    });

    const serializeLedger = (tx: any) => ({
      ...tx,
      createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : null,
      updatedAt: tx.updatedAt ? new Date(tx.updatedAt).toISOString() : null,
      rentalRequest: tx.rentalRequest
        ? {
            ...tx.rentalRequest,
            startDate: tx.rentalRequest.startDate ? new Date(tx.rentalRequest.startDate).toISOString() : null,
            endDate: tx.rentalRequest.endDate ? new Date(tx.rentalRequest.endDate).toISOString() : null,
          }
        : null,
      payments: tx.payments?.map((pay: any) => ({
        ...pay,
        paidAt: pay.paidAt ? new Date(pay.paidAt).toISOString() : null,
      })),
    });

    const totalRevenue = revenueSummary?._sum?.amount ? Number(revenueSummary._sum.amount) : 0;
    const totalPaidTransactions = revenueSummary?._count?.id ? Number(revenueSummary._count.id) : 0;

    return {
      paymentsData: {
        payments: rawPayments.map(serializePayment),
        totalRevenue,
        totalPaidTransactions,
        totalDeals,
      },
      ledgerData: {
        items: rawLedgerItems.map(serializeLedger),
        total: totalLedger,
        totalPages: Math.ceil(totalLedger / 25) || 1,
        revenue: totalRevenue,
      },
    };
  }, ["transactions", "payments"]);
}

// ─── 3. MANAGER CUSTOMERS DASHBOARD DATA ───────────────────────────
export async function getCustomersDashboardData() {
  return dbCache.getOrSet("dashboard:customers:list", 30, async () => {
    const rawCustomers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
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
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return rawCustomers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      role: c.role,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
      _count: c._count,
    }));
  }, ["users", "customers"]);
}

// ─── 4. MANAGER INQUIRIES DASHBOARD DATA ───────────────────────────
export async function getInquiriesDashboardData(userId?: string, role?: string) {
  const cacheKey = `dashboard:inquiries:${role || "ALL"}:${userId || "ALL"}`;
  return dbCache.getOrSet(cacheKey, 15, async () => {
    const where: any =
      role === "USER" && userId
        ? { managerId: userId }
        : {};

    const rawInquiries = await prisma.inquiry.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            images: { take: 1, select: { url: true } },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return rawInquiries.map((inq) => ({
      id: inq.id,
      name: inq.customer?.name || "Anonymous Client",
      email: inq.customer?.email || "",
      phone: inq.customer?.phone || null,
      message: inq.message,
      status: inq.status,
      response: inq.response,
      createdAt: inq.createdAt.toISOString(),
      property: inq.property,
      customer: inq.customer,
    }));
  }, ["inquiries"]);
}

// ─── 5. ADMIN SETTINGS DASHBOARD DATA ──────────────────────────────
export async function getSettingsDashboardData() {
  return dbCache.getOrSet("dashboard:settings:data", 60, async () => {
    const [dbSettings, methods] = await Promise.all([
      prisma.systemSetting.findMany(),
      getPaymentMethodsConfig(false),
    ]);

    const map: Record<string, string> = {};
    for (const row of dbSettings) {
      map[row.key] = row.value;
    }

    return {
      settings: {
        site_name: map.site_name || "Kiro-Maal Real Estate",
        contact_email: map.contact_email || "support@kiromaal.com",
        currency: map.currency || "USD",
        auto_approve_properties: map.auto_approve_properties === "true",
        enable_ai_chat: map.enable_ai_chat !== "false",
      },
      paymentMethods: methods || [],
    };
  }, ["settings"]);
}

// ─── 6. CUSTOMER RENTALS & PURCHASES DATA ──────────────────────────
export async function getCustomerRentalsData(customerId: string) {
  return dbCache.getOrSet(`customer:rentals:${customerId}`, 15, async () => {
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

    const items = await prisma.rentalRequest.findMany({
      where: { customerId, rentalStatus: { in: ["ACTIVE", "EXPIRED", "COMPLETED", "CANCELLED"] } },
      include,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return items.map((item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
      startDate: item.startDate ? new Date(item.startDate).toISOString() : null,
      endDate: item.endDate ? new Date(item.endDate).toISOString() : null,
      transaction: item.transaction
        ? {
            ...item.transaction,
            payments: item.transaction.payments?.map((p: any) => ({
              ...p,
              paidAt: p.paidAt ? new Date(p.paidAt).toISOString() : null,
            })),
          }
        : null,
    }));
  }, ["rentals"]);
}

export async function getCustomerPurchasesData(customerId: string) {
  return dbCache.getOrSet(`customer:purchases:${customerId}`, 15, async () => {
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

    const items = await prisma.purchaseRequest.findMany({
      where: { customerId },
      include,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return items.map((item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
      transaction: item.transaction
        ? {
            ...item.transaction,
            payments: item.transaction.payments?.map((p: any) => ({
              ...p,
              paidAt: p.paidAt ? new Date(p.paidAt).toISOString() : null,
            })),
          }
        : null,
    }));
  }, ["purchases"]);
}
