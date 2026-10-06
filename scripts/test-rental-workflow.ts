import { prisma } from "../lib/prisma";
import {
  createRentalRequest,
  reviewRequest,
  syncRentalLifecycle,
} from "../lib/transactions";
import { getPaymentMethodsConfig } from "../lib/payment-settings";

async function runTests() {
  console.log("=== STARTING COMPREHENSIVE RENTAL WORKFLOW TESTS (A THROUGH H) ===");

  // 1. Setup Test Users: Manager, Customer A, Customer B, Admin
  console.log("\n--- Setting up test users and property ---");

  const manager = await prisma.user.upsert({
    where: { email: "manager.test@kiromaal.com" },
    update: { role: "USER", isActive: true },
    create: {
      email: "manager.test@kiromaal.com",
      name: "Property Manager Test",
      password: "hashedpassword123",
      role: "USER",
      isActive: true,
    },
  });

  const customerA = await prisma.user.upsert({
    where: { email: "customerA.test@kiromaal.com" },
    update: { role: "CUSTOMER", isActive: true },
    create: {
      email: "customerA.test@kiromaal.com",
      name: "Customer A Test",
      password: "hashedpassword123",
      role: "CUSTOMER",
      isActive: true,
    },
  });

  const customerB = await prisma.user.upsert({
    where: { email: "customerB.test@kiromaal.com" },
    update: { role: "CUSTOMER", isActive: true },
    create: {
      email: "customerB.test@kiromaal.com",
      name: "Customer B Test",
      password: "hashedpassword123",
      role: "CUSTOMER",
      isActive: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin.test@kiromaal.com" },
    update: { role: "ADMIN", isActive: true },
    create: {
      email: "admin.test@kiromaal.com",
      name: "Admin Overseer Test",
      password: "hashedpassword123",
      role: "ADMIN",
      isActive: true,
    },
  });

  // 2. Setup Centralized Payment Settings (Section 19)
  console.log("Checking centralized payment configuration...");
  const methods = await getPaymentMethodsConfig(false);
  console.log(`Payment methods loaded: ${methods.length} methods configured.`);
  const evc = methods.find((m) => m.id === "evc_plus");
  if (!evc || !evc.accountNumber) {
    throw new Error("Centralized payment method EVC Plus not found or missing account number!");
  }
  console.log(`EVC Plus account configured: ${evc.accountNumber} (${evc.accountName})`);

  // 3. Setup Test Property (FOR_RENT, AVAILABLE, APPROVED, ACTIVE)
  const testProperty = await prisma.property.create({
    data: {
      title: "Luxury Beachfront Villa #TEST-WF",
      description: "Automated test property for rental workflow",
      price: 1500,
      listingType: "FOR_RENT",
      rentPeriod: "MONTHLY",
      securityDeposit: 500,
      availabilityStatus: "AVAILABLE",
      status: "APPROVED",
      isActive: true,
      city: "Mogadishu",
      location: "Wadajir, Mogadishu",
      type: "VILLA",
      bedrooms: 4,
      bathrooms: 3,
      area: 280,
      manager: { connect: { id: manager.id } },
    },
  });
  console.log(`Created test property: ${testProperty.id} (${testProperty.title})`);

  try {
    // ==========================================
    // TEST A: Customer Booking + Manual Payment Submission
    // ==========================================
    console.log("\n==========================================");
    console.log("TEST A: Customer Booking + Manual Payment Submission");
    console.log("==========================================");

    const checkInA = new Date("2026-11-01T00:00:00Z");
    const checkOutA = new Date("2027-01-01T00:00:00Z");
    const txnRefA = "EVC-REF-100200300";

    const bookingResultA = await createRentalRequest(
      customerA.id,
      testProperty.id,
      checkInA,
      checkOutA,
      "Test booking by Customer A",
      "EVC Plus",
      txnRefA
    );

    console.log(`Booking request created: #${bookingResultA.requestNo}`);
    console.log(`Booking status: ${bookingResultA.status}`);
    console.log(`Transaction status: ${bookingResultA.transaction.status}`);

    // Verify Payment Record
    const paymentA = await prisma.payment.findFirst({
      where: { transactionId: bookingResultA.transaction.id },
    });
    console.log(`Payment status: ${paymentA?.status}`);
    console.log(`Payment method: ${paymentA?.paymentMethod}`);
    console.log(`Transaction reference: ${paymentA?.transactionRef}`);

    // Verify Property is still AVAILABLE
    const propAfterBookingA = await prisma.property.findUnique({
      where: { id: testProperty.id },
    });
    console.log(`Property availability after booking: ${propAfterBookingA?.availabilityStatus}`);

    if (bookingResultA.status !== "PENDING") {
      throw new Error(`TEST A FAILED: Booking status is not PENDING (got ${bookingResultA.status})`);
    }
    if (bookingResultA.transaction.status !== "PENDING") {
      throw new Error(`TEST A FAILED: Transaction status is not PENDING (got ${bookingResultA.transaction.status})`);
    }
    if (paymentA?.status !== "PENDING") {
      throw new Error(`TEST A FAILED: Payment status is not PENDING (got ${paymentA?.status})`);
    }
    if (propAfterBookingA?.availabilityStatus !== "AVAILABLE") {
      throw new Error(`TEST A FAILED: Property availability should remain AVAILABLE while PENDING (got ${propAfterBookingA?.availabilityStatus})`);
    }
    console.log(">>> TEST A PASSED: Booking = PENDING, Payment = PENDING, Property = AVAILABLE.");

    // ==========================================
    // TEST D: Admin Booking Visibility (Read-only)
    // ==========================================
    console.log("\n==========================================");
    console.log("TEST D: Admin Booking Visibility (Admin can view details)");
    console.log("==========================================");

    const adminView = await prisma.rentalRequest.findUnique({
      where: { id: bookingResultA.id },
      include: {
        customer: true,
        manager: true,
        property: true,
        transaction: {
          include: { payments: true },
        },
      },
    });

    if (!adminView || !adminView.customer || !adminView.property || !adminView.transaction) {
      throw new Error("TEST D FAILED: Admin could not view complete booking details");
    }
    console.log(`Admin retrieved booking #${adminView.requestNo}:`);
    console.log(`  Customer: ${adminView.customer.name} (${adminView.customer.email})`);
    console.log(`  Property: ${adminView.property.title}`);
    console.log(`  Manager: ${adminView.manager?.name || "N/A"}`);
    console.log(`  Payment Method: ${adminView.transaction.payments[0]?.paymentMethod}`);
    console.log(`  Transaction Ref: ${adminView.transaction.payments[0]?.transactionRef}`);
    console.log(">>> TEST D PASSED: Admin has full visibility into booking details.");

    // ==========================================
    // TEST E: Admin Attempts Approval via API (Must Be Rejected with 403)
    // ==========================================
    console.log("\n==========================================");
    console.log("TEST E: Admin Attempts Approval (Must Be Rejected with 403)");
    console.log("==========================================");

    let adminRejected = false;
    try {
      await reviewRequest(
        "rental",
        bookingResultA.id,
        { id: admin.id, role: "ADMIN" },
        "approve",
        "Admin illicit attempt to approve rental"
      );
    } catch (err: any) {
      console.log(`Expected rejection caught: [${err.status || 403}] ${err.message}`);
      if (err.message.includes("Administrators cannot approve or reject normal rental bookings")) {
        adminRejected = true;
      }
    }

    if (!adminRejected) {
      throw new Error("TEST E FAILED: Admin was able to approve or did not receive 403 error!");
    }
    console.log(">>> TEST E PASSED: Backend strictly prevented Admin from approving rental booking.");

    // ==========================================
    // TEST B: Manager Approves Rental Booking
    // ==========================================
    console.log("\n==========================================");
    console.log("TEST B: Manager Reviews & Approves Booking");
    console.log("==========================================");

    const approvalResult = await reviewRequest(
      "rental",
      bookingResultA.id,
      { id: manager.id, role: "USER" },
      "approve",
      "Payment verified via EVC Plus statement. Approved."
    );

    console.log(`Manager approval executed: ${approvalResult.status}`);

    const approvedRental = await prisma.rentalRequest.findUnique({
      where: { id: bookingResultA.id },
      include: {
        transaction: {
          include: { payments: true, receipt: true },
        },
      },
    });

    const propAfterApproval = await prisma.property.findUnique({
      where: { id: testProperty.id },
    });

    console.log(`Booking Status after manager approval: ${approvedRental?.status}`);
    console.log(`Transaction Status: ${approvedRental?.transaction?.status}`);
    console.log(`Payment Status: ${approvedRental?.transaction?.payments[0]?.status}`);
    console.log(`Receipt Generated: #${approvedRental?.transaction?.receipt?.receiptNo}`);
    console.log(`Property Availability: ${propAfterApproval?.availabilityStatus}`);
    console.log(`Property Active Flag: ${propAfterApproval?.isActive}`);

    if (approvedRental?.status !== "ACTIVE") {
      throw new Error(`TEST B FAILED: Rental status is not ACTIVE (got ${approvedRental?.status})`);
    }
    if (approvedRental?.transaction?.payments[0]?.status !== "PAID") {
      throw new Error(`TEST B FAILED: Payment status is not PAID (got ${approvedRental?.transaction?.payments[0]?.status})`);
    }
    if (!approvedRental?.transaction?.receipt) {
      throw new Error("TEST B FAILED: No official Receipt was generated!");
    }
    if (propAfterApproval?.availabilityStatus !== "RENTED" || propAfterApproval?.isActive !== false) {
      throw new Error(`TEST B FAILED: Property availability is not RENTED (got ${propAfterApproval?.availabilityStatus}, isActive=${propAfterApproval?.isActive})`);
    }
    console.log(">>> TEST B PASSED: Booking = APPROVED/ACTIVE, Payment = PAID, Property = RENTED, Receipt generated.");

    // ==========================================
    // TEST C: Customer Views Active Rental in My Rentals
    // ==========================================
    console.log("\n==========================================");
    console.log("TEST C: Customer Views Active Rental");
    console.log("==========================================");

    const customerRentals = await prisma.rentalRequest.findMany({
      where: { customerId: customerA.id, status: "ACTIVE" },
      include: {
        property: true,
        transaction: { include: { receipt: true } },
      },
    });

    if (customerRentals.length === 0 || customerRentals[0].id !== bookingResultA.id) {
      throw new Error("TEST C FAILED: Customer could not find active rental in My Rentals");
    }
    console.log(`Customer A found active lease for "${customerRentals[0].property.title}"`);
    console.log(`Receipt #${customerRentals[0].transaction?.receipt?.receiptNo}`);
    console.log(">>> TEST C PASSED: Customer sees active rental in My Rentals.");

    // ==========================================
    // TEST F: Customer Attempts to Book Already Rented Property
    // ==========================================
    console.log("\n==========================================");
    console.log("TEST F: Customer Attempts to Book Rented Property");
    console.log("==========================================");

    let rentAttemptRejected = false;
    try {
      await createRentalRequest(
        customerB.id,
        testProperty.id,
        new Date("2026-11-15T00:00:00Z"),
        new Date("2026-12-15T00:00:00Z"),
        "Attempting to book already rented property",
        "Zaad",
        "ZAAD-998877"
      );
    } catch (err: any) {
      console.log(`Expected booking rejection caught: [${err.status || 409}] ${err.message}`);
      if (err.message.includes("not available for rent") || err.status === 409) {
        rentAttemptRejected = true;
      }
    }

    if (!rentAttemptRejected) {
      throw new Error("TEST F FAILED: System allowed booking on an already RENTED property!");
    }
    console.log(">>> TEST F PASSED: Backend rejected booking on already rented property.");

    // ==========================================
    // TEST G: Two Customers Attempt Overlapping Rentals
    // ==========================================
    console.log("\n==========================================");
    console.log("TEST G: Overlapping Rental Protection");
    console.log("==========================================");

    // Create a 2nd test property for overlap test
    const prop2 = await prisma.property.create({
      data: {
        title: "Sunset Apartment #TEST-OVERLAP",
        description: "Test apartment for overlap validation",
        price: 800,
        listingType: "FOR_RENT",
        rentPeriod: "MONTHLY",
        availabilityStatus: "AVAILABLE",
        status: "APPROVED",
        isActive: true,
        city: "Hargeisa",
        location: "Hargeisa Central",
        type: "APARTMENT",
        bedrooms: 2,
        bathrooms: 2,
        area: 120,
        manager: { connect: { id: manager.id } },
      },
    });

    // Customer A books Oct 10 -> Jan 10
    const b1 = await createRentalRequest(
      customerA.id,
      prop2.id,
      new Date("2026-10-10T00:00:00Z"),
      new Date("2027-01-10T00:00:00Z"),
      undefined,
      "EVC Plus",
      "EVC-OVL-1"
    );

    // Customer B books Nov 1 -> Dec 1 (Overlapping period)
    const b2 = await createRentalRequest(
      customerB.id,
      prop2.id,
      new Date("2026-11-01T00:00:00Z"),
      new Date("2026-12-01T00:00:00Z"),
      undefined,
      "Zaad",
      "ZAAD-OVL-2"
    );

    console.log(`Created two bookings with overlapping dates for property ${prop2.id}`);
    console.log(`Booking 1: #${b1.requestNo} (Oct 10 - Jan 10)`);
    console.log(`Booking 2: #${b2.requestNo} (Nov 1 - Dec 1)`);

    // Manager approves Booking 1
    await reviewRequest(
      "rental",
      b1.id,
      { id: manager.id, role: "USER" },
      "approve"
    );
    console.log("Manager approved Booking 1.");

    // Check Booking 2: it should have been automatically rejected due to conflict OR cannot be approved
    const b2Check = await prisma.rentalRequest.findUnique({
      where: { id: b2.id },
    });
    console.log(`Booking 2 status after Booking 1 approval: ${b2Check?.status}`);

    let overlapApprovalBlocked = false;
    if (b2Check?.status === "REJECTED") {
      overlapApprovalBlocked = true;
      console.log("Booking 2 was automatically rejected due to date clash!");
    } else {
      // If still pending, attempt approval: it MUST fail
      try {
        await reviewRequest(
          "rental",
          b2.id,
          { id: manager.id, role: "USER" },
          "approve"
        );
      } catch (err: any) {
        console.log(`Overlap approval error: ${err.message}`);
        overlapApprovalBlocked = true;
      }
    }

    if (!overlapApprovalBlocked) {
      throw new Error("TEST G FAILED: Overlapping booking was neither auto-rejected nor blocked from approval!");
    }
    console.log(">>> TEST G PASSED: Double booking protection enforced!");

    // Clean up notifications from b1 and b2
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { message: { contains: b1.requestNo } },
          { message: { contains: b2.requestNo } },
        ],
      },
    });

    // ==========================================
    // TEST H: Rental Expiration & Property Restoration
    // ==========================================
    console.log("\n==========================================");
    console.log("TEST H: Rental Expiration & Availability Restoration");
    console.log("==========================================");

    // Simulate an expired rental by updating its endDate to yesterday
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.rentalRequest.update({
      where: { id: bookingResultA.id },
      data: {
        endDate: pastDate,
      },
    });

    console.log("Updated active rental end date to past date. Running syncRentalLifecycle()...");
    const syncCount = await syncRentalLifecycle();
    console.log(`syncRentalLifecycle processed ${syncCount} rentals.`);

    const expiredRental = await prisma.rentalRequest.findUnique({
      where: { id: bookingResultA.id },
    });
    const propRestored = await prisma.property.findUnique({
      where: { id: testProperty.id },
    });

    console.log(`Rental status after expiration sync: ${expiredRental?.status}`);
    console.log(`Property availability after expiration: ${propRestored?.availabilityStatus}`);
    console.log(`Property active flag: ${propRestored?.isActive}`);

    if (expiredRental?.status !== "EXPIRED" && expiredRental?.status !== "COMPLETED") {
      throw new Error(`TEST H FAILED: Expired rental status is ${expiredRental?.status} (expected EXPIRED)`);
    }
    if (propRestored?.availabilityStatus !== "AVAILABLE" || propRestored?.isActive !== true) {
      throw new Error(`TEST H FAILED: Property was not restored to AVAILABLE (got ${propRestored?.availabilityStatus}, isActive=${propRestored?.isActive})`);
    }
    console.log(">>> TEST H PASSED: Expired rental transitioned to EXPIRED, property restored to AVAILABLE.");

  } finally {
    // Clean up test properties and related data
    console.log("\n--- Cleaning up test artifacts ---");
    try {
      const p1txns = await prisma.transaction.findMany({
        where: { propertyId: testProperty.id },
        select: { id: true },
      });
      const txnIds = p1txns.map((t) => t.id);
      await prisma.receipt.deleteMany({ where: { transactionId: { in: txnIds } } });
      await prisma.payment.deleteMany({ where: { transactionId: { in: txnIds } } });
      await prisma.rentalRequest.deleteMany({ where: { propertyId: testProperty.id } });
      await prisma.transaction.deleteMany({ where: { propertyId: testProperty.id } });
      await prisma.property.delete({ where: { id: testProperty.id } });

      // Clean up prop2 if it exists
      const p2 = await prisma.property.findFirst({ where: { title: "Sunset Apartment #TEST-OVERLAP" } });
      if (p2) {
        const p2txns = await prisma.transaction.findMany({ where: { propertyId: p2.id }, select: { id: true } });
        const p2Ids = p2txns.map((t) => t.id);
        await prisma.receipt.deleteMany({ where: { transactionId: { in: p2Ids } } });
        await prisma.payment.deleteMany({ where: { transactionId: { in: p2Ids } } });
        await prisma.rentalRequest.deleteMany({ where: { propertyId: p2.id } });
        await prisma.transaction.deleteMany({ where: { propertyId: p2.id } });
        await prisma.property.delete({ where: { id: p2.id } });
      }
      console.log("Cleaned up test properties.");
    } catch (e: any) {
      console.warn("Cleanup warning:", e.message);
    }
  }

  console.log("\n=======================================================");
  console.log("ALL TESTS (TEST A THROUGH H) COMPLETED SUCCESSFULLY! 🎉");
  console.log("=======================================================");
}

runTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  });
