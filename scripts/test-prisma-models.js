const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const reqs = await prisma.rentalRequest.findMany({ take: 2 });
  console.log('RentalRequests count:', reqs.length);
  const txns = await prisma.transaction.findMany({ take: 2 });
  console.log('Transactions count:', txns.length);
  const payments = await prisma.payment.findMany({ take: 2 });
  console.log('Payments count:', payments.length);
  const inqs = await prisma.inquiry.findMany({ take: 2 });
  console.log('Inquiries count:', inqs.length);
  const settings = await prisma.systemSetting.findMany({ take: 2 });
  console.log('SystemSetting count:', settings.length);
  await prisma.$disconnect();
}
test();

