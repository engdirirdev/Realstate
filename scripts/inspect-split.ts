import { prisma } from "../lib/prisma";
import { fetchApprovedPropertyDataset } from "../lib/ai/valuation/trainer";
import { createDataSplits } from "../lib/ai/valuation/preprocessor";

async function main() {
  const rawRecords = await fetchApprovedPropertyDataset();
  const splits = createDataSplits(rawRecords);

  console.log("=== V2 SPLITS MEMBERSHIP ===");
  console.log(`Train count: ${splits.train.length}`);
  console.log(`Val count: ${splits.val.length}`);
  console.log(`Test count: ${splits.test.length}`);

  console.log("\n--- TEST SET MEMBERS (n=6) ---");
  for (const t of splits.test) {
    console.log(`${t.id} | ${t.city} | ${t.type} | $${t.price}`);
  }

  console.log("\n--- VAL SET MEMBERS (n=3) ---");
  for (const v of splits.val) {
    console.log(`${v.id} | ${v.city} | ${v.type} | $${v.price}`);
  }

  console.log("\n--- TRAIN SET (n=19) ---");
  for (const tr of splits.train) {
    console.log(`${tr.id} | ${tr.city} | ${tr.type} | $${tr.price}`);
  }

  // Summary per split
  console.log("\n--- Category Breakdown per split ---");
  const types = ["HOUSE", "APARTMENT", "VILLA", "OFFICE", "LAND", "COMMERCIAL", "TOWNHOUSE", "STUDIO"];
  const cities = ["Mogadishu", "Hargeisa", "Bosaso", "Kismayo", "Garowe", "Baydhabo", "Berbera"];

  console.log("\nProperty Types:");
  for (const ty of types) {
    const trC = splits.train.filter(r => r.type.toUpperCase() === ty).length;
    const valC = splits.val.filter(r => r.type.toUpperCase() === ty).length;
    const testC = splits.test.filter(r => r.type.toUpperCase() === ty).length;
    console.log(`  ${ty.padEnd(12)}: Train=${trC}, Val=${valC}, Test=${testC}, Total=${trC+valC+testC}`);
  }

  console.log("\nCities:");
  for (const c of cities) {
    const trC = splits.train.filter(r => r.city.toLowerCase() === c.toLowerCase()).length;
    const valC = splits.val.filter(r => r.city.toLowerCase() === c.toLowerCase()).length;
    const testC = splits.test.filter(r => r.city.toLowerCase() === c.toLowerCase()).length;
    console.log(`  ${c.padEnd(12)}: Train=${trC}, Val=${valC}, Test=${testC}, Total=${trC+valC+testC}`);
  }

  await prisma.$disconnect();
}
main();
