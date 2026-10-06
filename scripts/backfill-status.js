const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const props = await prisma.property.findMany();
  for (const p of props) {
    let approval = 'APPROVED';
    if (p.status === 'PENDING') approval = 'PENDING_REVIEW';
    else if (p.status === 'DRAFT') approval = 'DRAFT';
    else if (p.status === 'REJECTED') approval = 'REJECTED';

    let availability = 'AVAILABLE';
    if (p.status === 'SOLD') availability = 'SOLD';
    else if (p.status === 'RENTED') availability = 'RENTED';
    else if (p.status === 'PAYMENT_PENDING') availability = 'BOOKING_PENDING';
    else if (p.status === 'REJECTED' || p.status === 'INACTIVE') availability = 'INACTIVE';

    await prisma.property.update({
      where: { id: p.id },
      data: {
        approvalStatus: approval,
        availabilityStatus: availability,
        isActive: approval === 'APPROVED' && availability === 'AVAILABLE',
      },
    });
  }
  console.log(`Successfully synced ${props.length} properties.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
