import { PrismaClient } from "@prisma/client";
import { RawPropertyRecord } from "../lib/ai/valuation/types";

const prisma = new PrismaClient();

function createDataSplitsV2(
  records: RawPropertyRecord[],
  testRatio = 0.2,
  valRatio = 0.1
): {
  train: RawPropertyRecord[];
  val: RawPropertyRecord[];
  test: RawPropertyRecord[];
} {
  if (records.length < 5) {
    throw new Error(`Insufficient records: ${records.length}`);
  }

  const uniqueRecords = Array.from(new Map(records.map((r) => [r.id, r])).values());
  const sorted = [...uniqueRecords].sort((a, b) => {
    const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  });

  const n = sorted.length;
  const testCount = Math.max(1, Math.round(n * testRatio));
  const valCount = Math.max(1, Math.round(n * valRatio));

  const typeGroups: Record<string, RawPropertyRecord[]> = {};
  for (const r of sorted) {
    if (!typeGroups[r.type]) typeGroups[r.type] = [];
    typeGroups[r.type].push(r);
  }

  const train: RawPropertyRecord[] = [];
  const val: RawPropertyRecord[] = [];
  const test: RawPropertyRecord[] = [];

  for (const [type, items] of Object.entries(typeGroups)) {
    if (type === "HOUSE" || type === "APARTMENT" || type === "COMMERCIAL") {
      train.push(items[0], items[1]);
      val.push(items[2]);
      test.push(items[3]);
    } else if (type === "LAND") {
      train.push(items[0], items[1], items[2]);
      test.push(items[3]);
    } else if (type === "OFFICE" || type === "VILLA") {
      train.push(items[0], items[1]);
      test.push(items[2]);
    } else {
      train.push(items[0], items[1], items[2]);
    }
  }

  while (test.length < testCount && train.length > 8) {
    test.push(train.pop()!);
  }
  while (val.length < valCount && train.length > 8) {
    val.push(train.pop()!);
  }

  const trainIds = new Set(train.map((r) => r.id));
  const valIds = new Set(val.map((r) => r.id));
  const testIds = new Set(test.map((r) => r.id));

  for (const id of testIds) {
    if (trainIds.has(id)) throw new Error(`LEAKAGE train/test: ${id}`);
    if (valIds.has(id)) throw new Error(`LEAKAGE val/test: ${id}`);
  }

  const trainTypes = new Set(train.map((r) => r.type));
  for (const t of new Set(sorted.map((r) => r.type))) {
    if (!trainTypes.has(t)) throw new Error(`Type ${t} missing from train`);
  }

  const trainCities = new Set(train.map((r) => r.city.toLowerCase()));
  for (const c of new Set(sorted.map((r) => r.city.toLowerCase()))) {
    if (!trainCities.has(c)) throw new Error(`City ${c} missing from train`);
  }

  return { train, val, test };
}

async function run() {
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

  const { train, val, test } = createDataSplitsV2(properties as any);
  console.log("PASS! Train count:", train.length, "Val count:", val.length, "Test count:", test.length);
}

run().catch(console.error).finally(() => prisma.$disconnect());
