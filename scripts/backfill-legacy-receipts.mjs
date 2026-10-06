import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function backfill() {
  const payments = await prisma.payment.findMany({
    where: { status: "PAID" },
    include: {
      property: true,
      customer: true,
      manager: true,
      receipt: true,
      transaction: true,
    },
  });

  console.log(`Found ${payments.length} paid payments`);

  for (const p of payments) {
    let txnId = p.transactionId;

    if (!txnId && !p.transaction) {
      // Check if a transaction with same txnNo already exists
      let txn = await prisma.transaction.findFirst({
        where: {
          OR: [
            { txnNo: p.transactionRef },
            { propertyId: p.propertyId, customerId: p.customerId }
          ]
        }
      });

      if (!txn) {
        console.log(`Creating Transaction for payment ${p.transactionRef}...`);
        txn = await prisma.transaction.create({
          data: {
            txnNo: p.transactionRef.startsWith("TXN-") ? p.transactionRef : `TXN-${p.transactionRef}`,
            type: "SALE",
            customerId: p.customerId,
            managerId: p.managerId,
            propertyId: p.propertyId,
            amount: p.amount,
            currency: p.currency || "USD",
            status: "COMPLETED",
            completedAt: p.createdAt,
            createdAt: p.createdAt,
          },
        });
      }

      txnId = txn.id;
      await prisma.payment.update({
        where: { id: p.id },
        data: { transactionId: txnId },
      });
      console.log(`Linked payment ${p.id} to transaction ${txnId}`);
    }

    // Now check if receipt exists
    let receipt = await prisma.receipt.findUnique({
      where: { paymentId: p.id },
    });

    if (!receipt && txnId) {
      const receiptNo = `RCP-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
      console.log(`Creating Receipt ${receiptNo} for payment ${p.transactionRef}...`);
      
      const details = {
        receiptNo,
        transactionRef: p.transactionRef,
        amount: p.amount,
        currency: p.currency || "USD",
        paidAt: p.paidAt || p.createdAt,
        paymentMethod: p.paymentMethod || "DEMO / SANDBOX",
        customer: {
          name: p.customer?.name || "Customer",
          email: p.customer?.email || "",
          phone: p.customer?.phone || "",
        },
        manager: {
          name: p.manager?.name || "Kiro-Maal Concierge",
          email: p.manager?.email || "",
        },
        property: {
          title: p.property?.title || "Property Asset",
          city: p.property?.city || "",
          address: p.property?.address || "",
        },
      };

      await prisma.receipt.create({
        data: {
          receiptNo,
          transactionId: txnId,
          paymentId: p.id,
          details: JSON.stringify(details),
          issuedAt: p.paidAt || p.createdAt,
        },
      });
      console.log(`Receipt created successfully for ${p.id}`);
    }
  }

  console.log("Backfill complete!");
}

backfill()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
