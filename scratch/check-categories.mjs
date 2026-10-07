import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const categories = await prisma.category.findMany();
  console.log("REGISTERED CATEGORIES:", JSON.stringify(categories, null, 2));

  const locations = await prisma.location.findMany();
  console.log("REGISTERED LOCATIONS:", JSON.stringify(locations, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
