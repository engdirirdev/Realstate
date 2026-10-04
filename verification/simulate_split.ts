import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testSplit() {
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

  const n = sorted.length;
  const testCount = 6;
  const valCount = 3;
  const trainCount = n - testCount - valCount; // 19

  // Group by property type
  const typeGroups: Record<string, typeof sorted> = {};
  for (const r of sorted) {
    if (!typeGroups[r.type]) typeGroups[r.type] = [];
    typeGroups[r.type].push(r);
  }

  // Desired:
  // Each of the 8 types MUST have at least 1 item in train.
  // There are 8 types and 19 train slots.
  // There are 6 test slots: pick 1 item from 6 distinct types (leaving at least 2 in train for 4-item types, and at least 1 in train for 3-item types).
  // There are 3 val slots: pick 1 item from the other types.

  // Let's sort types by size descending, then name
  const typeKeys = Object.keys(typeGroups).sort((a, b) => {
    const diff = typeGroups[b].length - typeGroups[a].length;
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  });

  const train: typeof sorted = [];
  const val: typeof sorted = [];
  const test: typeof sorted = [];

  // In each type group, reserve at least 1 item for train
  // Types:
  // 4 items: HOUSE, APARTMENT, LAND, COMMERCIAL (4 types * 4 = 16 items)
  // 3 items: TOWNHOUSE, STUDIO, VILLA, OFFICE (4 types * 3 = 12 items)
  // Total = 28 items

  // For 4-item types: 2 train, 1 val/test, 1 test/train
  // For 3-item types: 2 train, 1 test/val
  for (let i = 0; i < typeKeys.length; i++) {
    const t = typeKeys[i];
    const items = typeGroups[t];
    // Always assign item[0] to train
    train.push(items[0]);

    if (items.length >= 4) {
      train.push(items[1]);
      if (val.length < valCount) {
        val.push(items[2]);
      } else if (test.length < testCount) {
        test.push(items[2]);
      } else {
        train.push(items[2]);
      }

      if (test.length < testCount) {
        test.push(items[3]);
      } else {
        train.push(items[3]);
      }
    } else {
      // 3 items
      train.push(items[1]);
      if (test.length < testCount) {
        test.push(items[2]);
      } else if (val.length < valCount) {
        val.push(items[2]);
      } else {
        train.push(items[2]);
      }
    }
  }

  console.log(`Split sizes: Train=${train.length}, Val=${val.length}, Test=${test.length}`);

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

  console.log("\nType breakdown in Train:");
  for (const t of typeKeys) {
    const c = train.filter((r) => r.type === t).length;
    console.log(`  ${t.padEnd(12)}: ${c} in train, ${val.filter((r) => r.type === t).length} in val, ${test.filter((r) => r.type === t).length} in test`);
  }

  console.log("\nCity breakdown in Train:");
  const allCities = Array.from(new Set(sorted.map((r) => r.city))).sort();
  for (const c of allCities) {
    console.log(`  ${c.padEnd(12)}: ${train.filter((r) => r.city === c).length} in train, ${val.filter((r) => r.city === c).length} in val, ${test.filter((r) => r.city === c).length} in test`);
  }
}

testSplit().catch(console.error).finally(() => prisma.$disconnect());
