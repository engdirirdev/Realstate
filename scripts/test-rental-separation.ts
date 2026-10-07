import { prisma } from "../lib/prisma";
import {
  createRentalRequest,
  reviewRequest,
  createDirectRental,
  syncRentalLifecycle,
} from "../lib/transactions";

async function runTests() {
  console.log("==================================================");
  console.log("STARTING COMPREHENSIVE SEPARATION TEST SUITE");
  console.log("==================================================");

  // 0. Setup test users and properties
  const customer = await prisma.user.findFirst({
    where: { role: "CUSTOMER" },
  });
  const manager = await prisma.user.findFirst({
    where: { role: "USER" },
  });
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!customer || !manager || !admin) {
    throw new Error("Missing customer, manager, or admin user in database.");
  }

  console.log(`Users: Customer=${customer.email}, Manager=${manager.email}, Admin=${admin.email}`);

  // Clean up any previous test property
  await prisma.property.deleteMany({
    where: { title: { in: ["Test Luxury Separation Villa", "Test Direct Tenancy Villa"] } },
  });

  const property = await prisma.property.create({
    data: {
      title: "Test Luxury Separation Villa",
      description: "A test villa to verify booking and rental separation.",
      price: 1500,
      city: "Mogadishu",
      location: "Wadajir",
      listingType: "FOR_RENT",
      type: "VILLA",
      status: "APPROVED",
      availabilityStatus: "AVAILABLE",
      isActive: true,
      managerId: manager.id,
      bedrooms: 3,
      bathrooms: 2,
      area: 250,
    },
  });

  console.log(`Created test property: ${property.id} (${property.title})`);

  // ==================================================
  // TEST 1 — CUSTOMER BOOKING
  // ==================================================
  console.log("\n--- TEST 1: CUSTOMER BOOKING ---");
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 5);
  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 35);

  const bookingResult = await createRentalRequest(
    customer.id,
    property.id,
    checkIn,
    checkOut,
    "Test customer rental booking note",
    "EVC Plus",
    `EVC-TEST-${Date.now()}`
  );

  const initialBooking = await prisma.rentalRequest.findUnique({
    where: { id: bookingResult.id },
    include: { transaction: { include: { payments: true } } },
  });

  if (!initialBooking) throw new Error("Booking record not created");

  console.log("Booking created with requestNo:", initialBooking.requestNo);
  console.log("Booking Status:", initialBooking.bookingStatus);
  console.log("Rental Status:", initialBooking.rentalStatus);
  console.log("Payment Status:", initialBooking.transaction?.payments[0]?.status);

  // Assertions for TEST 1:
  // - Booking = PENDING
  // - Payment = PENDING (PENDING VERIFICATION)
  // - Rental is NOT active (rentalStatus === null)
  // - Property is still AVAILABLE
  if (initialBooking.bookingStatus !== "PENDING") {
    throw new Error(`Test 1 Failed: Expected bookingStatus to be PENDING, got ${initialBooking.bookingStatus}`);
  }
  if (initialBooking.rentalStatus !== null) {
    throw new Error(`Test 1 Failed: Expected rentalStatus to be null before approval, got ${initialBooking.rentalStatus}`);
  }
  if (initialBooking.transaction?.payments[0]?.status !== "PENDING") {
    throw new Error(`Test 1 Failed: Expected payment status to be PENDING, got ${initialBooking.transaction?.payments[0]?.status}`);
  }

  const propAfterBooking = await prisma.property.findUnique({ where: { id: property.id } });
  if (propAfterBooking?.availabilityStatus !== "AVAILABLE" || !propAfterBooking?.isActive) {
    throw new Error("Test 1 Failed: Property should remain AVAILABLE while booking is PENDING");
  }
  console.log("✓ TEST 1 PASSED: Booking is PENDING, Payment is PENDING VERIFICATION, Rental is NOT active, Property remains AVAILABLE.");

  // ==================================================
  // TEST 3 — ADMIN ATTEMPTING API APPROVAL MUST BE REJECTED (Test early before approval)
  // ==================================================
  console.log("\n--- TEST 3: ADMIN PERMISSION ENFORCEMENT ---");
  let adminApprovalBlocked = false;
  try {
    await reviewRequest(
      "rental",
      initialBooking.id,
      admin,
      "approve",
      "Admin trying to approve"
    );
  } catch (err: any) {
    if (err.status === 403) {
      adminApprovalBlocked = true;
      console.log("Admin approval attempt correctly rejected with 403:", err.message);
    } else {
      console.error("Unexpected error on admin approval:", err);
    }
  }

  if (!adminApprovalBlocked) {
    throw new Error("Test 3 Failed: Admin was NOT blocked from approving rental booking!");
  }
  console.log("✓ TEST 3 PASSED: Admin cannot approve rental booking (403 Forbidden enforced in backend).");

  // ==================================================
  // TEST: MANAGER REJECTION (Section 14)
  // ==================================================
  console.log("\n--- TEST: MANAGER REJECTION (Section 14) ---");
  const rejCheckIn = new Date();
  rejCheckIn.setDate(rejCheckIn.getDate() + 45);
  const rejCheckOut = new Date();
  rejCheckOut.setDate(rejCheckOut.getDate() + 75);

  const rejectTestBooking = await createRentalRequest(
    customer.id,
    property.id,
    rejCheckIn,
    rejCheckOut,
    "Second booking to be rejected",
    "Zaad",
    `ZAAD-TEST-${Date.now()}`
  );
  await reviewRequest(
    "rental",
    rejectTestBooking.id,
    manager,
    "reject",
    "Property not suitable for this schedule."
  );
  const rejectedRecord = await prisma.rentalRequest.findUnique({
    where: { id: rejectTestBooking.id },
  });
  console.log("Rejected Booking Status:", rejectedRecord?.bookingStatus);
  console.log("Rejected Rental Status:", rejectedRecord?.rentalStatus);
  if (rejectedRecord?.bookingStatus !== "REJECTED" || rejectedRecord?.rentalStatus !== null) {
    throw new Error("Manager rejection test failed: Expected bookingStatus REJECTED and rentalStatus null");
  }
  const propAfterReject = await prisma.property.findUnique({ where: { id: property.id } });
  if (propAfterReject?.availabilityStatus !== "AVAILABLE") {
    throw new Error("Manager rejection test failed: Property must remain AVAILABLE");
  }
  console.log("✓ MANAGER REJECTION PASSED: Booking is REJECTED, Rental is null, Property remains AVAILABLE.");

  // ==================================================
  // TEST 2 — MANAGER APPROVAL
  // ==================================================
  console.log("\n--- TEST 2: MANAGER APPROVAL ---");
  const approvedReq = await reviewRequest(
    "rental",
    initialBooking.id,
    manager,
    "approve",
    "Verified EVC payment and valid dates. Approved."
  );

  const bookingAfterApproval = await prisma.rentalRequest.findUnique({
    where: { id: initialBooking.id },
    include: { transaction: { include: { payments: true, receipt: true } } },
  });

  console.log("Booking Status after approval:", bookingAfterApproval?.bookingStatus);
  console.log("Rental Status after approval:", bookingAfterApproval?.rentalStatus);
  console.log("Agreement #:", bookingAfterApproval?.agreementNo);
  console.log("Payment Status:", bookingAfterApproval?.transaction?.payments[0]?.status);
  console.log("Official Receipt #:", bookingAfterApproval?.transaction?.receipt?.receiptNo);

  // Assertions for TEST 2:
  // - Booking = APPROVED
  // - Rental = ACTIVE
  // - Property = RENTED
  if (bookingAfterApproval?.bookingStatus !== "APPROVED") {
    throw new Error(`Test 2 Failed: Expected bookingStatus APPROVED, got ${bookingAfterApproval?.bookingStatus}`);
  }
  if (bookingAfterApproval?.rentalStatus !== "ACTIVE") {
    throw new Error(`Test 2 Failed: Expected rentalStatus ACTIVE, got ${bookingAfterApproval?.rentalStatus}`);
  }
  if (!bookingAfterApproval?.agreementNo) {
    throw new Error("Test 2 Failed: Agreement number was not generated");
  }

  const propAfterApproval = await prisma.property.findUnique({ where: { id: property.id } });
  console.log("Property status:", propAfterApproval?.status);
  console.log("Property availabilityStatus:", propAfterApproval?.availabilityStatus);
  console.log("Property isActive:", propAfterApproval?.isActive);

  if (propAfterApproval?.status !== "RENTED" || propAfterApproval?.availabilityStatus !== "RENTED" || propAfterApproval?.isActive !== false) {
    throw new Error("Test 2 Failed: Property status must be RENTED and isActive false after rental activation");
  }
  console.log("✓ TEST 2 PASSED: Booking is APPROVED, Rental is ACTIVE, Property is RENTED.");

  // ==================================================
  // TEST 4 — CUSTOMER SEPARATION
  // ==================================================
  console.log("\n--- TEST 4: CUSTOMER REQUESTS VS MY RENTALS SEPARATION ---");
  // Customer Requests (mode=bookings) query:
  const customerBookings = await prisma.rentalRequest.findMany({
    where: {
      customerId: customer.id,
      bookingStatus: "APPROVED",
    },
  });
  console.log(`Customer Requests contains approved booking: ${customerBookings.some((b) => b.id === initialBooking.id)}`);

  // Customer Rentals (mode=rentals) query:
  const customerRentals = await prisma.rentalRequest.findMany({
    where: {
      customerId: customer.id,
      rentalStatus: "ACTIVE",
    },
  });
  console.log(`Customer My Rentals contains active rental agreement: ${customerRentals.some((r) => r.id === initialBooking.id)}`);

  if (!customerBookings.length || !customerRentals.length) {
    throw new Error("Test 4 Failed: Customer records not properly categorized into requests and rentals");
  }
  console.log("✓ TEST 4 PASSED: Approved booking retained in My Requests history; Active tenancy present in My Rentals.");

  // ==================================================
  // TEST 5 — RENTED PROPERTY VISIBILITY EXCLUSION
  // ==================================================
  console.log("\n--- TEST 5: RENTED PROPERTY EXCLUSION ---");
  const availablePublicProperties = await prisma.property.findMany({
    where: {
      status: { in: ["APPROVED", "PUBLISHED"] },
      availabilityStatus: "AVAILABLE",
      isActive: true,
    },
  });

  const propertyFound = availablePublicProperties.some((p) => p.id === property.id);
  console.log(`Rented property in available customer listings: ${propertyFound}`);
  if (propertyFound) {
    throw new Error("Test 5 Failed: Rented property still appears in customer available listings!");
  }
  console.log("✓ TEST 5 PASSED: Rented property is excluded from browse/search/recommendations.");

  // ==================================================
  // TEST 6 — RENTAL EXPIRATION & PROPERTY RESTORATION
  // ==================================================
  console.log("\n--- TEST 6: RENTAL EXPIRATION ---");
  // Simulate end date passed by setting endDate in the past
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  const pastStartDate = new Date();
  pastStartDate.setDate(pastStartDate.getDate() - 30);

  await prisma.rentalRequest.update({
    where: { id: initialBooking.id },
    data: { startDate: pastStartDate, endDate: pastDate },
  });

  // Run lifecycle sync
  await syncRentalLifecycle(true);

  const expiredBooking = await prisma.rentalRequest.findUnique({
    where: { id: initialBooking.id },
  });
  const propAfterExpiry = await prisma.property.findUnique({
    where: { id: property.id },
  });

  console.log("Rental status after expiration:", expiredBooking?.rentalStatus);
  console.log("Property availabilityStatus after expiration:", propAfterExpiry?.availabilityStatus);
  console.log("Property isActive after expiration:", propAfterExpiry?.isActive);

  if (expiredBooking?.rentalStatus !== "EXPIRED") {
    throw new Error(`Test 6 Failed: Expected rentalStatus EXPIRED, got ${expiredBooking?.rentalStatus}`);
  }
  if (propAfterExpiry?.availabilityStatus !== "AVAILABLE" || !propAfterExpiry?.isActive) {
    throw new Error("Test 6 Failed: Property was not restored to AVAILABLE after rental expired");
  }
  console.log("✓ TEST 6 PASSED: Expired rental marked as EXPIRED; Property restored to AVAILABLE.");

  // ==================================================
  // TEST 7 — MANAGER DIRECT RENTAL
  // ==================================================
  console.log("\n--- TEST 7: MANAGER DIRECT RENTAL ---");
  const directProp = await prisma.property.create({
    data: {
      title: "Test Direct Tenancy Villa",
      description: "A villa for direct tenancy test.",
      price: 2000,
      city: "Hargeisa",
      location: "Sha'ab",
      listingType: "FOR_RENT",
      type: "VILLA",
      status: "APPROVED",
      availabilityStatus: "AVAILABLE",
      isActive: true,
      managerId: manager.id,
      bedrooms: 4,
      bathrooms: 3,
      area: 300,
    },
  });

  const directStart = new Date();
  directStart.setDate(directStart.getDate() + 1);
  const directEnd = new Date();
  directEnd.setDate(directEnd.getDate() + 31);

  const directResult = await createDirectRental(
    manager,
    {
      propertyId: directProp.id,
      customerId: customer.id,
      startDate: directStart.toISOString(),
      endDate: directEnd.toISOString(),
      rentAmount: 2000,
      securityDeposit: 500,
      paymentStatus: "PAID",
      notes: "Direct tenancy created by manager at head office.",
    }
  );

  console.log("Direct Rental Agreement #:", directResult.request.agreementNo);
  console.log("Rental Status:", directResult.request.rentalStatus);
  console.log("Booking Status:", directResult.request.bookingStatus);

  if (directResult.request.rentalStatus !== "ACTIVE") {
    throw new Error(`Test 7 Failed: Expected rentalStatus ACTIVE, got ${directResult.request.rentalStatus}`);
  }
  if (!directResult.request.agreementNo) {
    throw new Error("Test 7 Failed: Expected agreementNo to be generated");
  }

  const directPropUpdated = await prisma.property.findUnique({
    where: { id: directProp.id },
  });
  if (directPropUpdated?.status !== "RENTED" || directPropUpdated?.availabilityStatus !== "RENTED" || directPropUpdated?.isActive !== false) {
    throw new Error("Test 7 Failed: Property must be RENTED after direct rental creation");
  }

  console.log("✓ TEST 7 PASSED: Manager direct rental created ACTIVE rental agreement, set property to RENTED without customer booking approval.");

  // Cleanup test properties
  await prisma.property.deleteMany({
    where: { title: { in: ["Test Luxury Separation Villa", "Test Direct Tenancy Villa"] } },
  });

  console.log("\n==================================================");
  console.log("ALL 7 TESTS COMPLETED SUCCESSFULLY!");
  console.log("==================================================");
}

runTests()
  .catch((e) => {
    console.error("FATAL TEST FAILURE:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
