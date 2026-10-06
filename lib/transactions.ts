// ================================================================
// TRANSACTION SERVICE
// Purchase requests, rental requests, central transactions,
// sandbox payments, receipts, notifications, rental lifecycle.
//
// Every mutation runs inside a Prisma $transaction and takes a
// row-level lock (SELECT ... FOR UPDATE) on the property so two
// customers can never both buy it or rent overlapping periods.
// All prices are read from the database — never from the client.
// ================================================================

import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeRental } from "@/lib/rental-pricing";

export class TxnError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type Tx = Prisma.TransactionClient;
export type Actor = { id: string; role: string; name?: string | null };

/** Property statuses that are publicly browsable / transactable. */
export const AVAILABLE_STATUSES = ["APPROVED", "PUBLISHED"] as const;
const OPEN_REQUEST_STATUSES = ["PENDING", "UNDER_REVIEW", "APPROVED", "PAYMENT_PENDING"] as const;
const BLOCKING_RENTAL_STATUSES = ["APPROVED", "PAYMENT_PENDING", "ACTIVE"] as const;

const NO_LONGER_AVAILABLE = "Sorry, this property is no longer available.";
const PERIOD_UNAVAILABLE = "The selected rental period is unavailable.";

function genNo(prefix: string) {
  const d = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `${prefix}-${d}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

async function lockProperty(tx: Tx, propertyId: string) {
  await tx.$queryRaw`SELECT id FROM properties WHERE id = ${propertyId} FOR UPDATE`;
  const property = await tx.property.findUnique({ where: { id: propertyId } });
  if (!property) throw new TxnError("Property not found.", 404);
  return property;
}

async function notifyUser(
  tx: Tx,
  userId: string | null | undefined,
  title: string,
  message: string,
  linkUrl: string,
  type: "TRANSACTION" | "PAYMENT" = "TRANSACTION"
) {
  if (!userId) return;
  await tx.notification.create({ data: { userId, type, title, message, linkUrl } });
}

/** Notify the property's manager, or every admin when it has no manager. */
async function notifyStaff(
  tx: Tx,
  managerId: string | null | undefined,
  title: string,
  message: string,
  managerLink: string,
  adminLink: string,
  type: "TRANSACTION" | "PAYMENT" = "TRANSACTION"
) {
  if (managerId) {
    const manager = await tx.user.findUnique({ where: { id: managerId }, select: { role: true } });
    await notifyUser(tx, managerId, title, message, manager?.role === "ADMIN" ? adminLink : managerLink, type);
  } else {
    const admins = await tx.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
    for (const a of admins) await notifyUser(tx, a.id, title, message, adminLink, type);
  }
}

async function audit(tx: Tx, userId: string, action: string, entity: string, entityId: string, details?: string) {
  try {
    await tx.auditLog.create({
      data: { userId, action, details: `${entity}:${entityId}${details ? ` — ${details}` : ""}` },
    });
  } catch {
    /* audit logging must never break a transaction */
  }
}

// ----------------------------------------------------------------
// RENTAL PRICING
// ----------------------------------------------------------------

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}


async function hasRentalOverlap(tx: Tx, propertyId: string, start: Date, end: Date, excludeId?: string) {
  const count = await tx.rentalRequest.count({
    where: {
      propertyId,
      status: { in: [...BLOCKING_RENTAL_STATUSES] },
      startDate: { lt: end },
      endDate: { gt: start },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  return count > 0;
}

// ----------------------------------------------------------------
// CREATE REQUESTS
// ----------------------------------------------------------------

export async function createPurchaseRequest(customerId: string, propertyId: string, notes?: string) {
  return prisma.$transaction(async (tx) => {
    const property = await lockProperty(tx, propertyId);

    if ((property.listingType || "FOR_SALE") !== "FOR_SALE") {
      throw new TxnError("This property is not listed for sale.");
    }
    if (
      !(AVAILABLE_STATUSES as readonly string[]).includes(property.status) ||
      (property.availabilityStatus && property.availabilityStatus !== "AVAILABLE")
    ) {
      throw new TxnError(NO_LONGER_AVAILABLE, 409);
    }
    if (property.managerId === customerId) {
      throw new TxnError("You cannot purchase your own listing.", 403);
    }
    const open = await tx.purchaseRequest.findFirst({
      where: { customerId, propertyId, status: { in: [...OPEN_REQUEST_STATUSES] } },
    });
    if (open) throw new TxnError("You already have an open purchase request for this property.", 409);

    const request = await tx.purchaseRequest.create({
      data: {
        requestNo: genNo("PUR"),
        customerId,
        propertyId,
        managerId: property.managerId,
        salePrice: property.price,
        currency: property.currency,
        notes: notes?.trim() || null,
      },
    });

    await notifyUser(
      tx,
      customerId,
      "Purchase Request Submitted",
      `Your request ${request.requestNo} for "${property.title}" was submitted and is awaiting review.`,
      "/customer/transactions"
    );
    await notifyStaff(
      tx,
      property.managerId,
      "New Purchase Request",
      `New purchase request ${request.requestNo} for "${property.title}".`,
      "/dashboard/requests",
      "/admin/requests"
    );
    await audit(tx, customerId, "PURCHASE_REQUEST_CREATED", "PurchaseRequest", request.id, property.title);
    return request;
  });
}

export async function createRentalRequest(
  customerId: string,
  propertyId: string,
  startInput: string | Date,
  endInput: string | Date,
  notes?: string,
  paymentMethod?: string,
  transactionRef?: string
) {
  const start = startOfDay(new Date(startInput));
  const end = startOfDay(new Date(endInput));
  if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new TxnError("Please choose valid rental dates.");
  if (start < startOfDay(new Date())) throw new TxnError("The start date cannot be in the past.");
  if (end <= start) throw new TxnError("The end date must be after the start date.");

  return prisma.$transaction(async (tx) => {
    const property = await lockProperty(tx, propertyId);

    if (property.listingType !== "FOR_RENT") throw new TxnError("This property is not listed for rent.");
    if (
      !(AVAILABLE_STATUSES as readonly string[]).includes(property.status) ||
      (property.availabilityStatus && property.availabilityStatus !== "AVAILABLE")
    ) {
      throw new TxnError(NO_LONGER_AVAILABLE, 409);
    }
    if (property.managerId === customerId) throw new TxnError("You cannot rent your own listing.", 403);
    if (await hasRentalOverlap(tx, propertyId, start, end)) throw new TxnError(PERIOD_UNAVAILABLE, 409);

    const open = await tx.rentalRequest.findFirst({
      where: {
        customerId,
        propertyId,
        status: { in: ["PENDING", "UNDER_REVIEW"] },
        startDate: { lt: end },
        endDate: { gt: start },
      },
    });
    if (open) throw new TxnError("You already have a pending rental request for these dates.", 409);

    const calc = computeRental(property.price, property.rentPeriod, property.securityDeposit, start, end);
    const request = await tx.rentalRequest.create({
      data: {
        requestNo: genNo("RNT"),
        customerId,
        propertyId,
        managerId: property.managerId,
        startDate: start,
        endDate: end,
        rentalPeriod: calc.period,
        periods: calc.periods,
        rentAmount: calc.rentAmount,
        securityDeposit: calc.securityDeposit,
        totalAmount: calc.totalAmount,
        currency: property.currency,
        notes: notes?.trim() || null,
        status: "PENDING",
        bookingStatus: "PENDING",
        rentalStatus: null,
        agreementNo: null,
      },
    });

    // Create central Transaction (status: PENDING)
    const transaction = await tx.transaction.create({
      data: {
        txnNo: genNo("TXN"),
        type: "RENTAL",
        customerId,
        managerId: property.managerId,
        propertyId: property.id,
        amount: calc.totalAmount,
        currency: property.currency,
        status: "PENDING",
        rentalRequestId: request.id,
      },
    });

    // Create Payment (status: PENDING - pending verification)
    const payment = await tx.payment.create({
      data: {
        transactionId: transaction.id,
        propertyId: property.id,
        customerId,
        managerId: property.managerId,
        amount: calc.totalAmount,
        currency: property.currency,
        paymentMethod: paymentMethod || "EVC Plus",
        status: "PENDING",
        transactionRef: transactionRef && transactionRef.trim() ? transactionRef.trim() : genNo("PAY"),
        paidAt: null,
      },
    });

    // Notification 1 to Customer
    await notifyUser(
      tx,
      customerId,
      "Rental Booking Submitted",
      "Your rental booking has been submitted.",
      "/customer/requests",
      "TRANSACTION"
    );

    // Notification 2 to Customer
    await notifyUser(
      tx,
      customerId,
      "Payment Submitted",
      "Your payment has been submitted for verification.",
      "/customer/requests",
      "PAYMENT"
    );

    // Notification to Manager
    await notifyStaff(
      tx,
      property.managerId,
      "New Rental Booking",
      "New rental booking requires your review.",
      "/dashboard/bookings?tab=rentals",
      "/admin/bookings?tab=rentals",
      "TRANSACTION"
    );

    await audit(tx, customerId, "RENTAL_REQUEST_CREATED", "RentalRequest", request.id, property.title);
    return { ...request, transaction, payment };
  });
}

// ----------------------------------------------------------------
// REVIEW (approve / reject / under review / cancel)
// ----------------------------------------------------------------

export type RequestKind = "purchase" | "rental";
export type ReviewAction = "approve" | "reject" | "review" | "cancel";

export async function reviewRequest(
  kind: RequestKind,
  requestId: string,
  actor: Actor,
  action: ReviewAction,
  notes?: string
) {
  return prisma.$transaction(async (tx) => {
    const req: any =
      kind === "purchase"
        ? await tx.purchaseRequest.findUnique({ where: { id: requestId }, include: { property: true, customer: true } })
        : await tx.rentalRequest.findUnique({
            where: { id: requestId },
            include: {
              property: true,
              customer: true,
              transaction: { include: { payments: { take: 1, orderBy: { createdAt: "desc" } } } },
            },
          });
    if (!req) throw new TxnError("Request not found.", 404);

    const isAdmin = actor.role === "ADMIN";
    const isOwnerManager = req.property.managerId === actor.id || req.managerId === actor.id;
    const isCustomer = req.customerId === actor.id;

    if (action === "cancel") {
      if (!isCustomer && !isAdmin && !isOwnerManager) throw new TxnError("Forbidden.", 403);
    } else {
      if (kind === "purchase" && !isAdmin) {
        throw new TxnError("Only administrators can approve or reject purchase requests.", 403);
      }
      if (kind === "rental") {
        if (isAdmin) {
          throw new TxnError(
            "Administrators cannot approve or reject normal rental bookings. Rental approval belongs solely to the Property Manager.",
            403
          );
        }
        if (actor.role !== "USER") {
          throw new TxnError("Only property managers can review rental bookings.", 403);
        }
        if (req.property.managerId && req.property.managerId !== actor.id && req.managerId !== actor.id) {
          throw new TxnError("Only the assigned property manager can review this rental booking.", 403);
        }
      }
    }

    const property = await lockProperty(tx, req.propertyId);
    const model: any = kind === "purchase" ? tx.purchaseRequest : tx.rentalRequest;
    const txnType = kind === "purchase" ? "SALE" : "RENTAL";
    const txnLink = kind === "purchase" ? { purchaseRequestId: req.id } : { rentalRequestId: req.id };
    const reviewData = { reviewNotes: notes?.trim() || null, reviewedById: actor.id, reviewedAt: new Date() };

    // ---- under review ----
    if (action === "review") {
      if (req.status !== "PENDING") throw new TxnError("Only pending requests can be moved under review.");
      return model.update({ where: { id: req.id }, data: { status: "UNDER_REVIEW", ...reviewData } });
    }

    // ---- approve ----
    if (action === "approve") {
      if (!["PENDING", "UNDER_REVIEW"].includes(req.status)) {
        throw new TxnError("This request has already been processed.", 409);
      }
      if (
        !(AVAILABLE_STATUSES as readonly string[]).includes(property.status) ||
        (property.availabilityStatus && property.availabilityStatus !== "AVAILABLE")
      ) {
        throw new TxnError(NO_LONGER_AVAILABLE, 409);
      }

      if (kind === "purchase") {
        if ((property.listingType || "FOR_SALE") !== "FOR_SALE") throw new TxnError("Property is not for sale.");
        await tx.property.update({
          where: { id: property.id },
          data: { status: "PAYMENT_PENDING", availabilityStatus: "BOOKING_PENDING" },
        });
        // Reject every other open purchase request – the property is now reserved for this buyer.
        const others = await tx.purchaseRequest.findMany({
          where: { propertyId: property.id, id: { not: req.id }, status: { in: ["PENDING", "UNDER_REVIEW"] } },
        });
        for (const o of others) {
          await tx.purchaseRequest.update({
            where: { id: o.id },
            data: { status: "REJECTED", reviewNotes: "Property was reserved by another buyer.", reviewedAt: new Date() },
          });
          await notifyUser(tx, o.customerId, "Purchase Request Rejected", `"${property.title}" was reserved by another buyer.`, "/customer/transactions");
        }

        const updated = await model.update({ where: { id: req.id }, data: { status: "PAYMENT_PENDING", ...reviewData } });
        await tx.transaction.create({
          data: {
            txnNo: genNo("TXN"),
            type: txnType,
            customerId: req.customerId,
            managerId: property.managerId,
            propertyId: property.id,
            amount: property.price,
            currency: property.currency,
            status: "PAYMENT_PENDING",
            ...txnLink,
          },
        });
        await notifyUser(
          tx,
          req.customerId,
          "Purchase Approved",
          `Your request ${req.requestNo} for "${property.title}" was approved. Please complete payment.`,
          "/customer/transactions"
        );
        await audit(tx, actor.id, "PURCHASE_APPROVED", "Request", req.id);
        return updated;
      } else {
        // RENTAL APPROVAL WORKFLOW
        if (await hasRentalOverlap(tx, property.id, req.startDate, req.endDate, req.id)) {
          throw new TxnError("This property is no longer available for the selected rental period.", 409);
        }

        // Reject clashing pending rental requests
        const clashing = await tx.rentalRequest.findMany({
          where: {
            propertyId: property.id,
            id: { not: req.id },
            status: { in: ["PENDING", "UNDER_REVIEW"] },
            startDate: { lt: req.endDate },
            endDate: { gt: req.startDate },
          },
        });
        for (const o of clashing) {
          await tx.rentalRequest.update({
            where: { id: o.id },
            data: {
              status: "REJECTED",
              reviewNotes: "This property is no longer available for the selected rental period.",
              reviewedAt: new Date(),
            },
          });
          await notifyUser(
            tx,
            o.customerId,
            "Rental Booking Rejected",
            `The requested dates for "${property.title}" are no longer available.`,
            "/customer/requests"
          );
        }

        const now = new Date();
        const agreementNo = req.agreementNo || genNo("AGR");
        // 1. Update RentalRequest: Booking = APPROVED, Rental = ACTIVE
        const updated = await model.update({
          where: { id: req.id },
          data: {
            status: "ACTIVE",
            bookingStatus: "APPROVED",
            rentalStatus: "ACTIVE",
            agreementNo,
            approvedAt: now,
            ...reviewData,
          },
        });

        // 2. Find or create linked transaction
        let txn = await tx.transaction.findFirst({ where: { rentalRequestId: req.id } });
        if (!txn) {
          txn = await tx.transaction.create({
            data: {
              txnNo: genNo("TXN"),
              type: "RENTAL",
              customerId: req.customerId,
              managerId: property.managerId,
              propertyId: property.id,
              amount: req.totalAmount,
              currency: property.currency,
              status: "ACTIVE",
              rentalRequestId: req.id,
              completedAt: now,
            },
          });
        } else {
          txn = await tx.transaction.update({
            where: { id: txn.id },
            data: { status: "ACTIVE", completedAt: now },
          });
        }

        // 3. Find or create linked payment -> PAID
        let payment = await tx.payment.findFirst({ where: { transactionId: txn.id } });
        if (payment) {
          payment = await tx.payment.update({
            where: { id: payment.id },
            data: { status: "PAID", paidAt: now },
          });
        } else {
          payment = await tx.payment.create({
            data: {
              transactionId: txn.id,
              propertyId: property.id,
              customerId: req.customerId,
              managerId: property.managerId,
              amount: req.totalAmount,
              currency: property.currency,
              paymentMethod: "EVC Plus",
              status: "PAID",
              transactionRef: genNo("PAY"),
              paidAt: now,
            },
          });
        }

        // 4. Create official Receipt
        const existingReceipt = await tx.receipt.findFirst({ where: { transactionId: txn.id } });
        if (!existingReceipt) {
          await tx.receipt.create({
            data: {
              receiptNo: genNo("RCP"),
              transactionId: txn.id,
              paymentId: payment.id,
              details: JSON.stringify({
                txnNo: txn.txnNo,
                type: "RENTAL",
                customerName: req.customer?.name || "Customer",
                customerEmail: req.customer?.email || "",
                propertyId: property.id,
                propertyTitle: property.title,
                propertyCity: property.city,
                amount: payment.amount,
                currency: payment.currency,
                paymentMethod: payment.paymentMethod,
                paymentRef: payment.transactionRef,
                paymentStatus: "PAID",
                paidAt: now.toISOString(),
                startDate: req.startDate.toISOString(),
                endDate: req.endDate.toISOString(),
                rentalPeriod: req.rentalPeriod,
                periods: req.periods,
                rentAmount: req.rentAmount,
                securityDeposit: req.securityDeposit,
              }),
            },
          });
        }

        // 5. Update Property -> status: RENTED, availabilityStatus: RENTED, isActive: false
        await tx.property.update({
          where: { id: property.id },
          data: { status: "RENTED", availabilityStatus: "RENTED", isActive: false },
        });

        // 6. Notify Customer
        await notifyUser(
          tx,
          req.customerId,
          "Rental Booking Approved",
          "Your rental booking has been approved.",
          "/customer/rentals",
          "TRANSACTION"
        );

        await audit(tx, actor.id, "RENTAL_APPROVED", "RentalRequest", req.id, property.title);
        return updated;
      }
    }

    // ---- reject / cancel ----
    if (!["PENDING", "UNDER_REVIEW", "PAYMENT_PENDING", "APPROVED"].includes(req.status)) {
      throw new TxnError("This request can no longer be changed.", 409);
    }
    const newStatus = action === "reject" ? "REJECTED" : "CANCELLED";
    const updated = await model.update({
      where: { id: req.id },
      data: {
        status: newStatus,
        bookingStatus: newStatus,
        rentalStatus: null,
        ...reviewData,
      },
    });

    await tx.transaction.updateMany({
      where: { ...txnLink, status: { in: ["PENDING", "UNDER_REVIEW", "APPROVED", "PAYMENT_PENDING"] } },
      data: { status: newStatus },
    });

    const txn = await tx.transaction.findFirst({ where: { ...txnLink } });
    if (txn) {
      await tx.payment.updateMany({
        where: { transactionId: txn.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
    }

    // Release the property if this request was holding it.
    if (kind === "purchase" && req.status === "PAYMENT_PENDING" && property.status === "PAYMENT_PENDING") {
      await tx.property.update({
        where: { id: property.id },
        data: { status: "APPROVED", availabilityStatus: "AVAILABLE" },
      });
    }

    const label = action === "reject" ? "Rejected" : "Cancelled";
    if (actor.id !== req.customerId) {
      await notifyUser(
        tx,
        req.customerId,
        kind === "purchase" ? `Purchase Request ${label}` : `Rental Booking ${label}`,
        kind === "purchase"
          ? `Your request ${req.requestNo} for "${property.title}" was ${label.toLowerCase()}.${notes ? ` Reason: ${notes}` : ""}`
          : `Your rental booking has been rejected.${notes ? ` Reason: ${notes}` : ""}`,
        "/customer/requests"
      );
    } else {
      await notifyStaff(
        tx,
        property.managerId,
        `Request Cancelled`,
        `Customer cancelled request ${req.requestNo} for "${property.title}".`,
        "/dashboard/bookings?tab=rentals",
        "/admin/bookings?tab=rentals"
      );
    }
    await audit(tx, actor.id, `${kind.toUpperCase()}_${newStatus}`, "Request", req.id);
    return updated;
  });
}

// ----------------------------------------------------------------
// PAYMENT  (sandbox gateway – no real card is charged)
// ----------------------------------------------------------------

export async function payTransaction(transactionId: string, customerId: string, paymentMethod?: string) {
  return prisma.$transaction(async (tx) => {
    const preview = await tx.transaction.findUnique({ where: { id: transactionId }, select: { propertyId: true } });
    if (!preview) throw new TxnError("Transaction not found.", 404);
    const property = await lockProperty(tx, preview.propertyId);

    const txn = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { purchaseRequest: true, rentalRequest: true, customer: { select: { name: true, email: true } } },
    });
    if (!txn) throw new TxnError("Transaction not found.", 404);
    if (txn.customerId !== customerId) throw new TxnError("Transaction not found.", 404);
    if (txn.status !== "PAYMENT_PENDING") {
      throw new TxnError(
        txn.status === "COMPLETED" || txn.status === "ACTIVE" ? "This transaction has already been paid." : "This transaction is not awaiting payment.",
        409
      );
    }
    const alreadyPaid = await tx.payment.count({ where: { transactionId, status: "PAID" } });
    if (alreadyPaid) throw new TxnError("This transaction has already been paid.", 409);

    const now = new Date();
    let nextTxnStatus: "COMPLETED" | "ACTIVE";

    if (txn.type === "SALE") {
      const req = txn.purchaseRequest;
      if (!req || req.status !== "PAYMENT_PENDING") throw new TxnError("This purchase is no longer payable.", 409);
      // Atomic guard: only flip to SOLD if the property is still reserved for this sale.
      const flipped = await tx.property.updateMany({
        where: { id: property.id, status: "PAYMENT_PENDING" },
        data: { status: "SOLD", availabilityStatus: "SOLD", isActive: false },
      });
      if (flipped.count !== 1) throw new TxnError(NO_LONGER_AVAILABLE, 409);
      await tx.purchaseRequest.update({ where: { id: req.id }, data: { status: "COMPLETED", completedAt: now } });
      nextTxnStatus = "COMPLETED";
    } else {
      const req = txn.rentalRequest;
      if (!req || req.status !== "PAYMENT_PENDING") throw new TxnError("This rental is no longer payable.", 409);
      if (await hasRentalOverlap(tx, property.id, req.startDate, req.endDate, req.id)) {
        throw new TxnError(PERIOD_UNAVAILABLE, 409);
      }
      await tx.rentalRequest.update({ where: { id: req.id }, data: { status: "ACTIVE" } });
      await tx.property.update({
        where: { id: property.id },
        data: { status: "RENTED", availabilityStatus: "RENTED", isActive: false },
      });
      nextTxnStatus = "ACTIVE";
    }

    const payment = await tx.payment.create({
      data: {
        transactionId,
        propertyId: property.id,
        customerId,
        managerId: txn.managerId,
        amount: txn.amount, // always the server-side amount
        currency: txn.currency,
        paymentMethod: paymentMethod || "SANDBOX",
        status: "PAID",
        transactionRef: genNo("PAY"),
        paidAt: now,
      },
    });

    const rr = txn.rentalRequest;
    const receipt = await tx.receipt.create({
      data: {
        receiptNo: genNo("RCP"),
        transactionId,
        paymentId: payment.id,
        details: JSON.stringify({
          txnNo: txn.txnNo,
          type: txn.type,
          customerName: txn.customer.name,
          customerEmail: txn.customer.email,
          propertyId: property.id,
          propertyTitle: property.title,
          propertyCity: property.city,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          paymentRef: payment.transactionRef,
          paymentStatus: payment.status,
          paidAt: now.toISOString(),
          ...(rr
            ? {
                startDate: rr.startDate.toISOString(),
                endDate: rr.endDate.toISOString(),
                rentalPeriod: rr.rentalPeriod,
                periods: rr.periods,
                rentAmount: rr.rentAmount,
                securityDeposit: rr.securityDeposit,
              }
            : {}),
        }),
      },
    });

    await tx.transaction.update({
      where: { id: transactionId },
      data: { status: nextTxnStatus, completedAt: txn.type === "SALE" ? now : null },
    });

    const verb = txn.type === "SALE" ? "purchase" : "rental";
    await notifyUser(
      tx,
      customerId,
      "Payment Successful",
      `Payment of ${payment.currency} ${payment.amount.toLocaleString()} for "${property.title}" received. Receipt ${receipt.receiptNo}.`,
      `/receipt/${receipt.id}`,
      "PAYMENT"
    );
    await notifyStaff(
      tx,
      txn.managerId,
      "Payment Completed",
      `Payment received for ${verb} ${txn.txnNo} ("${property.title}").`,
      "/dashboard/requests",
      "/admin/requests",
      "PAYMENT"
    );
    await audit(tx, customerId, txn.type === "SALE" ? "PROPERTY_SOLD" : "PROPERTY_RENTED", "Transaction", transactionId, property.title);

    return { payment, receipt, transactionStatus: nextTxnStatus };
  });
}

// ----------------------------------------------------------------
// RENTAL LIFECYCLE (lazy – runs on read paths, throttled)
// ----------------------------------------------------------------

let lastSync = 0;

export async function syncRentalLifecycle(force = false) {
  const now = new Date();
  if (!force && now.getTime() - lastSync < 60_000) return;
  lastSync = now.getTime();
  try {
    // 1. Expire finished rentals and free the property.
    const expired = await prisma.rentalRequest.findMany({
      where: { status: "ACTIVE", endDate: { lte: now } },
      select: { id: true, propertyId: true, customerId: true, requestNo: true },
    });
    for (const r of expired) {
      await prisma.$transaction(async (tx) => {
        await tx.rentalRequest.update({
          where: { id: r.id },
          data: { status: "EXPIRED", rentalStatus: "EXPIRED" },
        });
        await tx.transaction.updateMany({ where: { rentalRequestId: r.id }, data: { status: "EXPIRED" } });
        const stillActive = await tx.rentalRequest.count({
          where: { propertyId: r.propertyId, status: "ACTIVE", startDate: { lte: now }, endDate: { gt: now } },
        });
        if (!stillActive) {
          await tx.property.updateMany({
            where: { id: r.propertyId, status: "RENTED" },
            data: { status: "APPROVED", availabilityStatus: "AVAILABLE", isActive: true },
          });
        }
        await notifyUser(tx, r.customerId, "Rental Expired", `Your rental ${r.requestNo} has ended.`, "/customer/transactions");
      });
    }
    // 2. Activate paid rentals whose start date has arrived.
    const starting = await prisma.rentalRequest.findMany({
      where: { status: "ACTIVE", startDate: { lte: now }, endDate: { gt: now } },
      select: { propertyId: true },
    });
    for (const r of starting) {
      await prisma.property.updateMany({
        where: { id: r.propertyId, status: { in: ["APPROVED", "PUBLISHED"] } },
        data: { status: "RENTED", availabilityStatus: "RENTED", isActive: false },
      });
    }
  } catch (e) {
    console.error("[syncRentalLifecycle]", e);
  }
}

// ----------------------------------------------------------------
// MANAGER DIRECT RENTAL CREATION
// ----------------------------------------------------------------

export async function createDirectRental(
  actor: Actor,
  params: {
    propertyId: string;
    customerId: string;
    startDate: string | Date;
    endDate: string | Date;
    rentAmount?: number;
    securityDeposit?: number;
    paymentStatus?: "PAID" | "PENDING";
    notes?: string;
  }
) {
  const isAdmin = actor.role === "ADMIN";
  const isManager = actor.role === "USER" || isAdmin;
  if (!isManager) {
    throw new TxnError("Only property managers and administrators can create direct rentals.", 403);
  }

  const start = startOfDay(new Date(params.startDate));
  const end = startOfDay(new Date(params.endDate));
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new TxnError("Please choose valid rental dates.");
  }
  if (end <= start) {
    throw new TxnError("The end date must be after the check-in date.");
  }

  const now = new Date();
  const paymentStatus = params.paymentStatus === "PAID" ? "PAID" : "PENDING";

  return prisma.$transaction(async (tx) => {
    const property = await lockProperty(tx, params.propertyId);

    if (!isAdmin && property.managerId !== actor.id) {
      throw new TxnError("You can only create direct rentals for your own listings.", 403);
    }
    if (property.listingType !== "FOR_RENT") {
      throw new TxnError("This property is not listed for rent.");
    }
    if (property.status === "SOLD" || property.availabilityStatus === "SOLD") {
      throw new TxnError("This property has already been sold.", 409);
    }
    if (property.status === "REJECTED" || property.status === "DRAFT") {
      throw new TxnError("Only approved properties can be rented.", 400);
    }

    // Verify Customer exists
    const customer = await tx.user.findUnique({
      where: { id: params.customerId },
      select: { id: true, name: true, email: true },
    });
    if (!customer) {
      throw new TxnError("Customer account not found.", 404);
    }

    // Prevent double / overlapping rental
    if (await hasRentalOverlap(tx, property.id, start, end)) {
      throw new TxnError(PERIOD_UNAVAILABLE, 409);
    }

    const calc = computeRental(
      property.price,
      property.rentPeriod,
      property.securityDeposit,
      start,
      end
    );

    const rentAmount = Number(params.rentAmount) > 0 ? Number(params.rentAmount) : calc.rentAmount;
    const securityDeposit =
      params.securityDeposit !== undefined && params.securityDeposit !== null && Number(params.securityDeposit) >= 0
        ? Number(params.securityDeposit)
        : calc.securityDeposit;
    const totalAmount = rentAmount * calc.periods + securityDeposit;

    const agreementNo = genNo("AGR");
    const request = await tx.rentalRequest.create({
      data: {
        requestNo: genNo("RNT"),
        agreementNo,
        customerId: customer.id,
        propertyId: property.id,
        managerId: property.managerId || actor.id,
        startDate: start,
        endDate: end,
        rentalPeriod: calc.period,
        periods: calc.periods,
        rentAmount,
        securityDeposit,
        totalAmount,
        currency: property.currency,
        status: "ACTIVE",
        bookingStatus: "APPROVED",
        rentalStatus: "ACTIVE",
        approvedAt: now,
        notes: params.notes?.trim() || null,
        reviewNotes: "Direct rental agreement created by manager.",
        reviewedById: actor.id,
        reviewedAt: now,
      },
    });

    const txnStatus = paymentStatus === "PAID" ? "ACTIVE" : "PAYMENT_PENDING";
    const transaction = await tx.transaction.create({
      data: {
        txnNo: genNo("TXN"),
        type: "RENTAL",
        customerId: customer.id,
        managerId: property.managerId || actor.id,
        propertyId: property.id,
        amount: totalAmount,
        currency: property.currency,
        status: txnStatus,
        rentalRequestId: request.id,
        completedAt: paymentStatus === "PAID" ? now : null,
      },
    });

    let paymentRecord: any = null;
    let receiptRecord: any = null;

    if (paymentStatus === "PAID") {
      paymentRecord = await tx.payment.create({
        data: {
          transactionId: transaction.id,
          propertyId: property.id,
          customerId: customer.id,
          managerId: property.managerId || actor.id,
          amount: totalAmount,
          currency: property.currency,
          paymentMethod: "DIRECT / CASH",
          status: "PAID",
          transactionRef: genNo("PAY"),
          paidAt: now,
        },
      });

      receiptRecord = await tx.receipt.create({
        data: {
          receiptNo: genNo("RCP"),
          transactionId: transaction.id,
          paymentId: paymentRecord.id,
          details: JSON.stringify({
            txnNo: transaction.txnNo,
            type: "RENTAL",
            customerName: customer.name,
            customerEmail: customer.email,
            propertyId: property.id,
            propertyTitle: property.title,
            propertyCity: property.city,
            amount: totalAmount,
            currency: property.currency,
            paymentMethod: "DIRECT / CASH",
            paymentRef: paymentRecord.transactionRef,
            paymentStatus: "PAID",
            paidAt: now.toISOString(),
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            rentalPeriod: calc.period,
            periods: calc.periods,
            rentAmount,
            securityDeposit,
          }),
        },
      });

      // Update property availability to RENTED
      if (start <= now && end > now) {
        await tx.property.update({
          where: { id: property.id },
          data: { status: "RENTED", availabilityStatus: "RENTED", isActive: false },
        });
      } else {
        await tx.property.update({
          where: { id: property.id },
          data: { status: "RENTED", availabilityStatus: "RENTED", isActive: false },
        });
      }
    } else {
      // Pending payment
      await tx.property.update({
        where: { id: property.id },
        data: { status: "PAYMENT_PENDING", availabilityStatus: "BOOKING_PENDING" },
      });
    }

    await notifyUser(
      tx,
      customer.id,
      "New Rental Agreement Created 🏠",
      `Your manager created a rental agreement (${request.requestNo}) for "${property.title}".`,
      "/customer/rentals"
    );

    await audit(tx, actor.id, "MANAGER_DIRECT_RENTAL_CREATED", "RentalRequest", request.id, property.title);

    return { request, transaction, payment: paymentRecord, receipt: receiptRecord };
  });
}
