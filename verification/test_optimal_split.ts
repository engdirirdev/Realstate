import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testOptimalSplit() {
  const properties = await prisma.property.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true,
      title: true,
      price: true,
      city: true,
      type: true,
      bedrooms: true,
      bathrooms: true,
      area: true,
      parking: true,
      isFurnished: true,
      yearBuilt: true,
      createdAt: true,
      status: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const sorted = [...properties].sort((a, b) => {
    const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  });

  const typeGroups: Record<string, typeof sorted> = {};
  for (const r of sorted) {
    if (!typeGroups[r.type]) typeGroups[r.type] = [];
    typeGroups[r.type].push(r);
  }

  // Desired allocation:
  // Val gets 1 from HOUSE, 1 from APARTMENT, 1 from COMMERCIAL (3 total)
  // Test gets 1 from HOUSE, 1 from APARTMENT, 1 from COMMERCIAL, 1 from LAND, 1 from OFFICE, 1 from VILLA (6 total)
  // Train gets the rest (19 total)
  const val: typeof sorted = [];
  const test: typeof sorted = [];
  const train: typeof sorted = [];

  for (const [type, items] of Object.entries(typeGroups)) {
    // items are sorted by createdAt, id
    if (type === "HOUSE" || type === "APARTMENT" || type === "COMMERCIAL") {
      // items.length is 4
      train.push(items[0], items[1]);
      val.push(items[2]);
      test.push(items[3]);
    } else if (type === "LAND") {
      // items.length is 4
      train.push(items[0], items[1], items[2]);
      test.push(items[3]);
    } else if (type === "OFFICE" || type === "VILLA") {
      // items.length is 3
      train.push(items[0], items[1]);
      test.push(items[2]);
    } else {
      // TOWNHOUSE, STUDIO (items.length is 3)
      train.push(items[0], items[1], items[2]);
    }
  }

  console.log(`Sizes: Train=${train.length}, Val=${val.length}, Test=${test.length}`);

  const trainTypes = new Set(train.map((r) => r.type));
  const testTypes = new Set(test.map((r) => r.type));
  const valTypes = new Set(val.map((r) => r.type));

  const trainCities = new Set(train.map((r) => r.city));
  const testCities = new Set(test.map((r) => r.city));
  const valCities = new Set(val.map((r) => r.city));

  console.log("Train Types count:", trainTypes.size, Array.from(trainTypes));
  console.log("Test Types count:", testTypes.size, Array.from(testTypes));
  console.log("Val Types count:", valTypes.size, Array.from(valTypes));

  console.log("Train Cities count:", trainCities.size, Array.from(trainCities));
  console.log("Test Cities count:", testCities.size, Array.from(testCities));
  console.log("Val Cities count:", valCities.size, Array.from(valCities));

  console.log("\nType breakdown in Train/Val/Test:");
  for (const t of Object.keys(typeGroups).sort()) {
    console.log(`  ${t.padEnd(12)}: Train=${train.filter((r) => r.type === t).length}, Val=${val.filter((r) => r.type === t).length}, Test=${test.filter((r) => r.type === t).length}`);
  }

  console.log("\nCity breakdown in Train/Val/Test:");
  const allCities = Array.from(new Set(sorted.map((r) => r.city))).sort();
  for (const c of allCities) {
    console.log(`  ${c.padEnd(12)}: Train=${train.filter((r) => r.city === c).length}, Val=${val.filter((r) => r.city === c).length}, Test=${test.filter((r) => r.city === c).length}`);
  }
}

testOptimalSplit().catch(console.error).finally(() => prisma.$disconnect());
