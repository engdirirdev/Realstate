/**
 * Multilingual Semantic Search Validation Script
 * Tests Somali, English, Arabic, and Mixed Queries across shared semantic vector space
 */
import { PrismaClient } from "@prisma/client";
import { detectQueryLanguage } from "../lib/ai/language/detector.ts";
import { executeSemanticSearch } from "../lib/ai/semantic-search/semantic-search-service.ts";

const prisma = new PrismaClient();

async function run() {
  console.log("=== MULTILINGUAL SEMANTIC SEARCH VALIDATION ===\n");

  const queries = [
    {
      lang: "Somali",
      text: "Waxaan rabaa guri 3 qol ah oo xeebta u dhow, parking leh, solar-na leh",
    },
    {
      lang: "English",
      text: "Modern 3-bedroom house near the ocean with parking and solar power",
    },
    {
      lang: "Arabic",
      text: "أريد منزلاً من ثلاث غرف نوم بالقرب من البحر مع موقف سيارات وطاقة شمسية",
    },
    {
      lang: "Mixed",
      text: "Waxaan rabaa 3 bedroom house oo parking leh Muqdisho",
    },
  ];

  for (const q of queries) {
    console.log(`--------------------------------------------------`);
    console.log(`[QUERY - ${q.lang}]: "${q.text}"`);

    const langDetect = detectQueryLanguage(q.text);
    console.log(`Detected Language: ${langDetect.language} (Confidence: ${langDetect.confidence.toFixed(2)}, Script: ${langDetect.script})`);

    const searchRes = await executeSemanticSearch({
      query: q.text,
      limit: 3,
      threshold: 0.2,
      authContext: { role: "PUBLIC" },
    });

    console.log(`Results Found: ${searchRes.totalMatches} (Model: ${searchRes.model}, Provider: ${searchRes.provider})`);
    searchRes.results.forEach((r, idx) => {
      console.log(`  ${idx + 1}. [Similarity: ${r.similarity.toFixed(4)}] ${r.property.title} (${r.property.city}, ${r.property.bedrooms} beds, $${r.property.price})`);
    });
  }

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error("Test error:", err);
  prisma.$disconnect();
  process.exit(1);
});
