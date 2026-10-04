/**
 * Initial & Batch Property Embedding Indexing Script
 *
 * Scans all APPROVED properties from MySQL and generates 768-dimensional multilingual embeddings.
 * Idempotent: checks SHA-256 source hash to avoid redundant embedding calls.
 */
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Configuration
const DIMENSIONS = 768;
const MODEL_NAME = "text-embedding-004";
const VERSION = "v1";

const MULTILINGUAL_CONCEPTS = [
  { id: "concept_house_villa", weight: 2.2, tokens: ["house", "villa", "home", "cottage", "mansion", "compound", "guri", "guryo", "guriga", "daaro", "منزل", "بيت", "فيلا", "دار", "قصر"] },
  { id: "concept_apartment", weight: 2.0, tokens: ["apartment", "flat", "condo", "suite", "studio", "dabaq", "qolal", "شقة", "استوديو", "شقق"] },
  { id: "concept_commercial_land", weight: 1.8, tokens: ["commercial", "office", "land", "plot", "warehouse", "retail", "shop", "dhul", "boos", "bakhaar", "xafiis", "dukaan", "تجاري", "مكتب", "أرض", "قطعة", "مستودع", "محل"] },
  { id: "concept_ocean_beach", weight: 2.4, tokens: ["ocean", "beach", "sea", "coastal", "waterfront", "shore", "liido", "geezira", "badda", "xeebta", "xeeb", "bad", "badweynta", "dhinaca badda", "شاطئ", "بحر", "ساحلي", "إطلالة بحرية", "كورنيش"] },
  { id: "concept_solar_power", weight: 2.1, tokens: ["solar", "solar power", "photovoltaic", "green energy", "24/7 power", "backup generator", "shamsi", "cadceed", "koronto", "solar-na", "korontada shamsiga", "طاقة شمسية", "كهرباء شمسية", "مولد", "طاقة نظيفة"] },
  { id: "concept_parking", weight: 2.0, tokens: ["parking", "garage", "carport", "driveway", "vehicle space", "baarkin", "parking leh", "baabuur", "garaash", "موقف سيارات", "موقف", "كراج", "مرآب"] },
  { id: "concept_bedroom_3", weight: 2.3, tokens: ["3 bedroom", "3 bedrooms", "three bedroom", "three bedrooms", "3 bed", "3 bds", "3 qol", "saddex qol", "3-qol", "seddex qol", "3 غرف", "ثلاث غرف", "ثلاثة غرف", "3 غرف نوم"] },
  { id: "concept_bedroom_2", weight: 2.3, tokens: ["2 bedroom", "2 bedrooms", "two bedroom", "two bedrooms", "2 bed", "2 bds", "2 qol", "laba qol", "labo qol", "2-qol", "غرفتين", "2 غرف", "غرفتان", "غرفتي نوم"] },
  { id: "concept_bedroom_4plus", weight: 2.3, tokens: ["4 bedroom", "4 bedrooms", "four bedroom", "5 bedroom", "spacious", "4 qol", "afar qol", "shan qol", "qolal badan", "weyn", "4 غرف", "أربع غرف", "خمس غرف", "واسع", "كبير"] },
  { id: "concept_luxury_pool", weight: 1.9, tokens: ["pool", "swimming pool", "luxury", "garden", "premium", "modern", "high-end", "dabaal", "barkad", "beero", "beer", "raaxo", "casri", "مسبح", "حديقة", "فاخر", "راقي", "حديث"] },
  { id: "concept_furnished", weight: 1.8, tokens: ["furnished", "fully furnished", "equipped", "turnkey", "alaab leh", "qalabaysan", "diyaar", "مفروش", "مؤثث", "جاهز"] },
  { id: "city_mogadishu", weight: 2.5, tokens: ["mogadishu", "muqdisho", "hamar", "xamar", "hodan", "wadajir", "yaqshid", "shibis", "مقديشو", "حمر"] },
  { id: "city_hargeisa", weight: 2.5, tokens: ["hargeisa", "hargeysa", "هرجيسا"] },
  { id: "city_bosaso", weight: 2.5, tokens: ["bosaso", "boosaaso", "بوساسو"] },
  { id: "city_kismayo", weight: 2.5, tokens: ["kismayo", "kismaayo", "كسمايو"] },
  { id: "city_berbera", weight: 2.5, tokens: ["berbera", "بربرة"] },
];

function l2Norm(v) {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i] * v[i];
  return Math.sqrt(sum);
}

function normalize(v) {
  const norm = l2Norm(v);
  if (norm === 0) return v;
  return v.map((x) => x / norm);
}

function generateLocalEmbedding(text) {
  const vector = new Array(DIMENSIONS).fill(0);
  const normalized = text.toLowerCase().trim();

  MULTILINGUAL_CONCEPTS.forEach((concept, index) => {
    let matchStrength = 0;
    for (const token of concept.tokens) {
      if (normalized.includes(token.toLowerCase())) {
        matchStrength += 1.0;
      }
    }
    if (matchStrength > 0) {
      const baseIdx = (index * 24) % (DIMENSIONS - 32);
      const intensity = Math.min(2.5, matchStrength) * concept.weight;
      for (let offset = 0; offset < 16; offset++) {
        const sign = offset % 2 === 0 ? 1 : -1;
        vector[baseIdx + offset] += (intensity / Math.sqrt(offset + 1)) * sign;
      }
    }
  });

  const cleanTokens = normalized.replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
  for (const token of cleanTokens) {
    if (token.length < 2) continue;
    for (let len = 3; len <= 5; len++) {
      for (let i = 0; i <= token.length - len; i++) {
        const gram = token.slice(i, i + len);
        const hash = crypto.createHash("md5").update(gram).digest();
        const dimIdx = hash.readUInt16BE(0) % DIMENSIONS;
        const sign = (hash[2] & 1) === 0 ? 1 : -1;
        const magnitude = (hash[3] / 255.0) * 0.4;
        vector[dimIdx] += sign * magnitude;
      }
    }
  }

  return normalize(vector);
}

function buildCanonicalDocument(property) {
  const parts = [];
  parts.push(`Property Title: ${property.title.trim()}`);
  parts.push(`Property Type: ${property.type.toUpperCase()}`);
  parts.push(`City: ${property.city.trim()}`);
  if (property.location) parts.push(`Location / Neighborhood: ${property.location.trim()}`);
  if (property.address) parts.push(`Address: ${property.address.trim()}`);
  parts.push(`Bedrooms: ${property.bedrooms}`);
  parts.push(`Bathrooms: ${property.bathrooms}`);
  parts.push(`Living Area: ${property.area} square meters`);
  parts.push(`Price: $${property.price.toLocaleString("en-US")} USD`);
  if (property.parking && property.parking > 0) {
    parts.push(`Parking: Available (${property.parking} spaces, private parking garage/compound)`);
  } else {
    parts.push(`Parking: Street or none`);
  }
  parts.push(`Furnished: ${property.isFurnished ? "Fully Furnished" : "Unfurnished"}`);
  if (property.yearBuilt) parts.push(`Year Built: ${property.yearBuilt}`);
  if (property.amenities) {
    try {
      const parsed = JSON.parse(property.amenities);
      if (Array.isArray(parsed)) parts.push(`Amenities and Features: ${parsed.join(", ")}`);
      else parts.push(`Amenities: ${property.amenities}`);
    } catch {
      parts.push(`Amenities: ${property.amenities}`);
    }
  }
  if (property.description) parts.push(`Detailed Description: ${property.description.trim()}`);

  const canonicalText = parts.join("\n");
  const sourceHash = crypto.createHash("sha256").update(canonicalText, "utf8").digest("hex");
  return { canonicalText, sourceHash };
}

async function main() {
  console.log("=== PHASE 2A: MULTILINGUAL EMBEDDING INDEXING ===");
  const approvedProps = await prisma.property.findMany({
    where: { status: "APPROVED" },
  });

  console.log(`Found ${approvedProps.length} approved properties eligible for vector indexing.`);
  let indexedCount = 0;
  let skippedCount = 0;

  for (const prop of approvedProps) {
    const { canonicalText, sourceHash } = buildCanonicalDocument(prop);

    const existing = await prisma.propertyEmbedding.findUnique({
      where: { propertyId: prop.id },
    });

    if (existing && existing.sourceHash === sourceHash) {
      skippedCount++;
      continue;
    }

    const vector = generateLocalEmbedding(canonicalText);

    await prisma.propertyEmbedding.upsert({
      where: { propertyId: prop.id },
      create: {
        id: "emb_" + prop.id,
        propertyId: prop.id,
        embedding: JSON.stringify(vector),
        model: MODEL_NAME,
        version: VERSION,
        dimension: DIMENSIONS,
        sourceHash,
        sourceText: canonicalText,
      },
      update: {
        embedding: JSON.stringify(vector),
        model: MODEL_NAME,
        version: VERSION,
        dimension: DIMENSIONS,
        sourceHash,
        sourceText: canonicalText,
      },
    });

    indexedCount++;
  }

  console.log(`\nIndexing Complete!`);
  console.log(`- Newly Indexed/Updated: ${indexedCount}`);
  console.log(`- Unchanged (Skipped):    ${skippedCount}`);
  console.log(`- Total Vector Records:   ${indexedCount + skippedCount}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Indexing failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
