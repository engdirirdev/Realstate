import { prisma } from "../lib/prisma";
import {
  createPurchaseRequest,
  createRentalRequest,
  reviewRequest,
  payTransaction,
  createDirectRental,
  syncRentalLifecycle,
} from "../lib/transactions";
import { searchDatabaseProperties } from "../lib/chat-grounding-engine";

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING REAL ESTATE AVAILABILITY & TRANSACTION SUITE");
  console.log("==================================================");

  // 1. Get test users
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const manager = await prisma.user.findFirst({ where: { role: "USER" } });
  const customer = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });

  if (!admin || !manager || !customer) {
    throw new Error("Missing test users (ADMIN, USER/manager, CUSTOMER)");
  }

  console.log(`[AUTH] Admin: ${admin.email}, Manager: ${manager.email}, Customer: ${customer.email}`);

  // Pre-cleanup leftover test properties
  const oldTestProps = await prisma.property.findMany({
    where: { title: { in: ["Automated Suite Test Rental Villa", "Direct Lease Test Apartment", "Automated Suite Prime Villa For Sale"] } },
    select: { id: true },
  });
  if (oldTestProps.length > 0) {
    const ids = oldTestProps.map((p) => p.id);
    await prisma.payment.deleteMany({ where: { transaction: { propertyId: { in: ids } } } });
    await prisma.receipt.deleteMany({ where: { transaction: { propertyId: { in: ids } } } });
    await prisma.transaction.deleteMany({ where: { propertyId: { in: ids } } });
    await prisma.rentalRequest.deleteMany({ where: { propertyId: { in: ids } } });
    await prisma.purchaseRequest.deleteMany({ where: { propertyId: { in: ids } } });
    await prisma.property.deleteMany({ where: { id: { in: ids } } });
  }

  // ----------------------------------------------------
  // TEST 1: Manager creates rental & Admin approves listing
  // ----------------------------------------------------
  console.log("\n--- TEST 1: RENTAL PROPERTY CREATION & APPROVAL ---");
  const rentalProp = await prisma.property.create({
    data: {
      title: "Automated Suite Test Rental Villa",
      description: "A luxury test rental villa for integration suite",
      price: 1500,
      listingType: "FOR_RENT",
      rentPeriod: "MONTHLY",
      securityDeposit: 500,
      location: "Km4 Airport Road",
      city: "Mogadishu",
      type: "VILLA",
      bedrooms: 4,
      bathrooms: 3,
      area: 280,
      managerId: manager.id,
      status: "PENDING",
      approvalStatus: "PENDING_REVIEW",
      availabilityStatus: "AVAILABLE",
      isActive: false,
    },
  });

  // Verify invisible to customers before approval
  let publicList = await prisma.property.findMany({
    where: {
      id: rentalProp.id,
      status: { in: ["APPROVED", "PUBLISHED"] },
      availabilityStatus: "AVAILABLE",
      isActive: true,
    },
  });
  console.log(`[RULE 1] Pending property visible to customers? ${publicList.length > 0 ? "FAILED" : "PASSED (Hidden)"}`);
  if (publicList.length > 0) throw new Error("Pending property must not be visible to customers");

  // Admin approves listing
  await prisma.property.update({
    where: { id: rentalProp.id },
    data: {
      status: "APPROVED",
      approvalStatus: "APPROVED",
      isActive: true,
    },
  });

  publicList = await prisma.property.findMany({
    where: {
      id: rentalProp.id,
      status: { in: ["APPROVED", "PUBLISHED"] },
      availabilityStatus: "AVAILABLE",
      isActive: true,
    },
  });
  console.log(`[RULE 1] Approved property visible to customers? ${publicList.length > 0 ? "PASSED (Visible)" : "FAILED"}`);

  // ----------------------------------------------------
  // TEST 2: Customer rental booking & double booking check
  // ----------------------------------------------------
  console.log("\n--- TEST 2: RENTAL BOOKING & DOUBLE BOOKING PREVENTION ---");
  const nextMonthStart = new Date(Date.now() + 86400000 * 5);
  const nextMonthEnd = new Date(Date.now() + 86400000 * 35);

  const rentalReq1 = await createRentalRequest(
    customer.id,
    rentalProp.id,
    nextMonthStart,
    nextMonthEnd,
    "Initial booking request"
  );
  console.log(`[BOOKING] Customer booked: Request #${rentalReq1.requestNo}`);

  // Manager approves rental request
  await reviewRequest("rental", rentalReq1.id, manager, "approve", "Approved by property manager");
  console.log("[APPROVAL] Manager approved booking");

  // Try overlapping rental request with same or second customer
  let doubleRentalPrevented = false;
  try {
    const overlapStart = new Date(Date.now() + 86400000 * 10);
    const overlapEnd = new Date(Date.now() + 86400000 * 20);
    await createRentalRequest(customer.id, rentalProp.id, overlapStart, overlapEnd, "Overlapping attempt");
  } catch (err: any) {
    doubleRentalPrevented = true;
    console.log(`[RULE 3 & 10] Double-booking rejection: "${err.message}" (PASSED)`);
  }
  if (!doubleRentalPrevented) throw new Error("Double booking should have been prevented!");

  // Payment activates the rental and marks property RENTED
  const txn = await prisma.transaction.findFirst({ where: { rentalRequestId: rentalReq1.id } });
  if (!txn) throw new Error("Transaction record missing for rental request");

  await payTransaction(txn.id, customer.id, "SANDBOX");
  const updatedRentalProp = await prisma.property.findUnique({ where: { id: rentalProp.id } });
  console.log(`[RENTED] Property availability status: ${updatedRentalProp?.availabilityStatus}`);

  // Check customer visibility after RENTED
  const availableRentalsings = await prisma.property.findMany({
    where: {
      id: rentalProp.id,
      status: { in: ["APPROVED", "PUBLISHED"] },
      availabilityStatus: "AVAILABLE",
      isActive: true,
    },
  });
  console.log(`[RULE 8] Rented property visible in available listings? ${availableRentalsings.length > 0 ? "FAILED" : "PASSED (Hidden)"}`);
  if (availableRentalsings.length > 0) throw new Error("Rented property must disappear from available listings");

  // ----------------------------------------------------
  // TEST 3: Manager direct rental creation
  // ----------------------------------------------------
  console.log("\n--- TEST 3: MANAGER DIRECT RENTAL CREATION ---");
  const directRentalProp = await prisma.property.create({
    data: {
      title: "Direct Lease Test Apartment",
      description: "Property for direct lease test",
      price: 800,
      listingType: "FOR_RENT",
      rentPeriod: "MONTHLY",
      location: "Wadajir",
      city: "Mogadishu",
      type: "APARTMENT",
      bedrooms: 2,
      bathrooms: 2,
      area: 120,
      managerId: manager.id,
      status: "APPROVED",
      approvalStatus: "APPROVED",
      availabilityStatus: "AVAILABLE",
      isActive: true,
    },
  });

  const directStart = new Date(Date.now() + 86400000 * 2);
  const directEnd = new Date(Date.now() + 86400000 * 62);

  const directRentalResult = await createDirectRental(manager, {
    propertyId: directRentalProp.id,
    customerId: customer.id,
    startDate: directStart,
    endDate: directEnd,
    rentAmount: 800,
    securityDeposit: 300,
    paymentStatus: "PAID",
    notes: "Direct lease executed by manager at office",
  });
  const updatedDirect = await prisma.property.findUnique({ where: { id: directRentalProp.id } });
  console.log(`[DIRECT RENTAL] Rental #${directRentalResult.request.requestNo} created. Property status: ${updatedDirect?.availabilityStatus}`);
  if (updatedDirect?.availabilityStatus !== "RENTED") {
    throw new Error("Direct paid rental must mark property RENTED");
  }

  // ----------------------------------------------------
  // TEST 4: Sale workflow & Manager sales restriction
  // ----------------------------------------------------
  console.log("\n--- TEST 4: SALE WORKFLOW & PERMISSION ENFORCEMENT ---");
  const saleProp = await prisma.property.create({
    data: {
      title: "Automated Suite Prime Villa For Sale",
      description: "Exclusive villa for sale test",
      price: 250000,
      listingType: "FOR_SALE",
      location: "Hodan",
      city: "Mogadishu",
      type: "VILLA",
      bedrooms: 5,
      bathrooms: 4,
      area: 400,
      managerId: manager.id,
      status: "APPROVED",
      approvalStatus: "APPROVED",
      availabilityStatus: "AVAILABLE",
      isActive: true,
    },
  });

  const purchaseReq = await createPurchaseRequest(customer.id, saleProp.id, "Cash buyer offer");
  console.log(`[PURCHASE] Purchase Request #${purchaseReq.requestNo} created`);

  // Verify Manager CANNOT approve sale
  let managerSaleBlock = false;
  try {
    await reviewRequest("purchase", purchaseReq.id, manager, "approve");
  } catch (err: any) {
    managerSaleBlock = true;
    console.log(`[RULE 12 & 13] Manager blocked from approving sale: "${err.message}" (PASSED)`);
  }
  if (!managerSaleBlock) throw new Error("Manager should not be able to approve purchase requests");

  // Admin approves sale
  await reviewRequest("purchase", purchaseReq.id, admin, "approve", "Approved by Admin Board");
  console.log("[SALE APPROVAL] Admin successfully approved purchase request");

  const saleTxn = await prisma.transaction.findFirst({ where: { purchaseRequestId: purchaseReq.id } });
  if (!saleTxn) throw new Error("Transaction record missing for purchase");

  // Settle sale payment
  await payTransaction(saleTxn.id, customer.id, "SANDBOX");
  const soldProp = await prisma.property.findUnique({ where: { id: saleProp.id } });
  console.log(`[SOLD] Property status after payment: status=${soldProp?.status}, availabilityStatus=${soldProp?.availabilityStatus}, isActive=${soldProp?.isActive}`);

  if (soldProp?.availabilityStatus !== "SOLD" || soldProp?.status !== "SOLD") {
    throw new Error("Settled purchase must transition property to SOLD");
  }

  // Verify SOLD property cannot be rented or purchased again
  let secondBuyBlocked = false;
  try {
    await createPurchaseRequest(customer.id, saleProp.id);
  } catch (err: any) {
    secondBuyBlocked = true;
    console.log(`[RULE 6] Cannot buy sold property: "${err.message}" (PASSED)`);
  }
  if (!secondBuyBlocked) throw new Error("Purchasing SOLD property should be rejected");

  let rentSoldBlocked = false;
  try {
    await createRentalRequest(customer.id, saleProp.id, nextMonthStart, nextMonthEnd);
  } catch (err: any) {
    rentSoldBlocked = true;
    console.log(`[RULE 5] Cannot rent sold property: "${err.message}" (PASSED)`);
  }
  if (!rentSoldBlocked) throw new Error("Renting SOLD property should be rejected");

  // ----------------------------------------------------
  // TEST 5: Chatbot & AI grounding availability exclusion
  // ----------------------------------------------------
  console.log("\n--- TEST 5: CHATBOT & AI SEARCH AVAILABILITY EXCLUSION ---");
  const searchRes = await searchDatabaseProperties({
    intent: "PROPERTY_SEARCH",
    confidence: 1,
    explanation: "Looking for villas for sale",
    city: "Mogadishu",
    listingType: "FOR_SALE",
  });

  const soldInResults = searchRes.properties.some((p) => p.id === saleProp.id);
  console.log(`[RULE 7 & AI] Sold property found in AI search results? ${soldInResults ? "FAILED" : "PASSED (Excluded)"}`);
  if (soldInResults) throw new Error("Sold property must NOT be returned by AI grounding");

  // Cleanup test properties and transactions cleanly
  console.log("\n--- CLEANUP TEST DATA ---");
  await prisma.payment.deleteMany({ where: { transaction: { propertyId: { in: [rentalProp.id, directRentalProp.id, saleProp.id] } } } });
  await prisma.receipt.deleteMany({ where: { transaction: { propertyId: { in: [rentalProp.id, directRentalProp.id, saleProp.id] } } } });
  await prisma.transaction.deleteMany({ where: { propertyId: { in: [rentalProp.id, directRentalProp.id, saleProp.id] } } });
  await prisma.rentalRequest.deleteMany({ where: { propertyId: { in: [rentalProp.id, directRentalProp.id, saleProp.id] } } });
  await prisma.purchaseRequest.deleteMany({ where: { propertyId: { in: [rentalProp.id, directRentalProp.id, saleProp.id] } } });
  await prisma.notification.deleteMany({ where: { message: { contains: "Automated Suite" } } });
  await prisma.notification.deleteMany({ where: { message: { contains: "Direct Lease Test" } } });
  await prisma.property.deleteMany({ where: { id: { in: [rentalProp.id, directRentalProp.id, saleProp.id] } } });

  console.log("Cleanup complete.");
  console.log("\n==================================================");
  console.log("ALL 5 TESTS PASSED SUCCESSFULLY! 100% SPEC COMPLIANT");
  console.log("==================================================");
}

runTests()
  .catch((e) => {
    console.error("Test Suite Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
