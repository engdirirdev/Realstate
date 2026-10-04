import fs from "fs";
import path from "path";

const API_BASE = "http://localhost:3000";

async function main() {
  const outDir = path.join(process.cwd(), "verification");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const logLines: string[] = [];
  function log(title: string, obj: any) {
    logLines.push(`\n=== ${title} ===`);
    logLines.push(typeof obj === "string" ? obj : JSON.stringify(obj, null, 2));
  }

  // 1. Covered property: Mogadishu HOUSE
  const coveredBody = {
    city: "Mogadishu",
    type: "HOUSE",
    bedrooms: 3,
    bathrooms: 2,
    area: 160,
    parking: 1,
    isFurnished: false,
    askingPrice: 75000,
  };

  const res1Covered = await fetch(`${API_BASE}/api/price-prediction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(coveredBody),
  }).then((r) => r.json());
  log("POST /api/price-prediction (Covered: Mogadishu HOUSE)", res1Covered);

  const res2Covered = await fetch(`${API_BASE}/api/ai/price-estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      features: {
        city: coveredBody.city,
        propertyType: coveredBody.type,
        bedrooms: coveredBody.bedrooms,
        bathrooms: coveredBody.bathrooms,
        area: coveredBody.area,
        parking: coveredBody.parking,
        isFurnished: coveredBody.isFurnished,
      },
      askingPrice: coveredBody.askingPrice,
    }),
  }).then((r) => r.json());
  log("POST /api/ai/price-estimate (Covered: Mogadishu HOUSE)", res2Covered);

  // 2. Unseen Individually: Burao HOUSE (City absent from training)
  const unseenCityBody = {
    city: "Burao",
    type: "HOUSE",
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    parking: 1,
    isFurnished: false,
  };
  const res1Unseen = await fetch(`${API_BASE}/api/price-prediction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(unseenCityBody),
  }).then((r) => r.json());
  log("POST /api/price-prediction (Unseen Individually: Burao HOUSE)", res1Unseen);

  const res2Unseen = await fetch(`${API_BASE}/api/ai/price-estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      features: {
        city: unseenCityBody.city,
        propertyType: unseenCityBody.type,
        bedrooms: unseenCityBody.bedrooms,
        bathrooms: unseenCityBody.bathrooms,
        area: unseenCityBody.area,
        parking: unseenCityBody.parking,
        isFurnished: unseenCityBody.isFurnished,
      },
    }),
  }).then((r) => r.json());
  log("POST /api/ai/price-estimate (Unseen Individually: Burao HOUSE)", res2Unseen);

  // 3. Unseen Pair: Berbera VILLA (Level 2 soft warning, extrapolation)
  const unseenPairBody = {
    city: "Berbera",
    type: "VILLA",
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    parking: 1,
    isFurnished: false,
    askingPrice: 160000,
  };
  const res1Pair = await fetch(`${API_BASE}/api/price-prediction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(unseenPairBody),
  }).then((r) => r.json());
  log("POST /api/price-prediction (Unseen Pair: Berbera VILLA)", res1Pair);

  const res2Pair = await fetch(`${API_BASE}/api/ai/price-estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      features: {
        city: unseenPairBody.city,
        propertyType: unseenPairBody.type,
        bedrooms: unseenPairBody.bedrooms,
        bathrooms: unseenPairBody.bathrooms,
        area: unseenPairBody.area,
        parking: unseenPairBody.parking,
        isFurnished: unseenPairBody.isFurnished,
      },
      askingPrice: unseenPairBody.askingPrice,
    }),
  }).then((r) => r.json());
  log("POST /api/ai/price-estimate (Unseen Pair: Berbera VILLA)", res2Pair);

  const outPath = path.join(outDir, "endpoints_remediation_output.txt");
  fs.writeFileSync(outPath, logLines.join("\n"), "utf8");
  console.log(`Saved remediation endpoint outputs to ${outPath}`);
}

main().catch(console.error);
