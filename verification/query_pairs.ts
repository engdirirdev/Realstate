import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result: any[] = await prisma.$queryRawUnsafe(
    "SELECT city, type, COUNT(*) as count FROM properties WHERE status = 'APPROVED' GROUP BY city, type ORDER BY city, type;"
  );

  console.log("city\t\ttype\t\tcount");
  console.log("-----------------------------------------");
  let maxCount = 0;
  for (const row of result) {
    const c = Number(row.count);
    if (c > maxCount) maxCount = c;
    console.log(`${row.city.padEnd(14)}\t${row.type.padEnd(14)}\t${c}`);
  }
  console.log("-----------------------------------------");
  console.log(`Total distinct (city, type) pairs: ${result.length}`);
  console.log(`Maximum count in any single pair: ${maxCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
