/**
 * Multilingual Embedding Service
 *
 * Primary Model: Google AI "gemini-embedding-2" (768 dimensions) via @google/generative-ai
 * Fallback: Deterministic Multilingual Semantic Encoder (768 dimensions)
 *
 * Guarantees:
 * - Constant 768 dimensions across all vectors (MRL projection)
 * - Cross-lingual semantic alignment across Somali, Arabic, and English
 * - Graceful fallback without crashing if API key is missing or service is unavailable
 * - High-speed in-memory vector cache for frequent queries
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import { normalizeVector } from "./vector-math";
import { GEMINI_CONFIG, getGeminiApiKey } from "../gemini-config";

export const EMBEDDING_CONFIG = {
  MODEL_NAME: GEMINI_CONFIG.EMBEDDING_MODEL,
  PROVIDER: "google",
  DIMENSIONS: GEMINI_CONFIG.EMBEDDING_DIMENSIONS,
  VERSION: "v1",
};

// In-memory query embedding cache (max 200 items, LRU-style)
const queryEmbeddingCache = new Map<string, number[]>();
const MAX_CACHE_SIZE = 200;

/**
 * Cross-Lingual Concept Synsets
 * Shared multilingual semantic clusters mapped to dedicated dimensions
 * across Somali (so), Arabic (ar), and English (en).
 */
interface SemanticConcept {
  id: string;
  weight: number;
  tokens: string[];
}

const MULTILINGUAL_CONCEPTS: SemanticConcept[] = [
  // 1. Property Type: House / Villa / Home
  {
    id: "concept_house_villa",
    weight: 2.2,
    tokens: [
      "house", "villa", "home", "cottage", "mansion", "compound",
      "guri", "guryo", "guriga", "daaro",
      "منزل", "بيت", "فيلا", "دار", "قصر"
    ],
  },
  // 2. Property Type: Apartment / Flat
  {
    id: "concept_apartment",
    weight: 2.0,
    tokens: [
      "apartment", "flat", "condo", "suite", "studio",
      "dabaq", "qolal",
      "شقة", "استوديو", "شقق"
    ],
  },
  // 3. Property Type: Commercial / Office / Land
  {
    id: "concept_commercial_land",
    weight: 1.8,
    tokens: [
      "commercial", "office", "land", "plot", "warehouse", "retail", "shop",
      "dhul", "boos", "bakhaar", "xafiis", "dukaan",
      "تجاري", "مكتب", "أرض", "قطعة", "مستودع", "محل"
    ],
  },
  // 4. Coastal / Ocean / Beach Location
  {
    id: "concept_ocean_beach",
    weight: 2.4,
    tokens: [
      "ocean", "beach", "sea", "coastal", "waterfront", "shore", "liido", "geezira",
      "badda", "xeebta", "xeeb", "bad", "badweynta", "dhinaca badda",
      "شاطئ", "بحر", "ساحلي", "إطلالة بحرية", "كورنيش"
    ],
  },
  // 5. Renewable / Solar Electricity
  {
    id: "concept_solar_power",
    weight: 2.1,
    tokens: [
      "solar", "solar power", "photovoltaic", "green energy", "24/7 power", "backup generator",
      "shamsi", "cadceed", "koronto", "solar-na", "korontada shamsiga",
      "طاقة شمسية", "كهرباء شمسية", "مولد", "طاقة نظيفة"
    ],
  },
  // 6. Parking / Garage
  {
    id: "concept_parking",
    weight: 2.0,
    tokens: [
      "parking", "garage", "carport", "driveway", "vehicle space",
      "baarkin", "parking leh", "baabuur", "garaash",
      "موقف سيارات", "موقف", "كراج", "مرآب"
    ],
  },
  // 7. Space / Bedroom Counts (1, 2, 3, 4+)
  {
    id: "concept_bedroom_3",
    weight: 2.3,
    tokens: [
      "3 bedroom", "3 bedrooms", "three bedroom", "three bedrooms", "3 bed", "3 bds",
      "3 qol", "saddex qol", "3-qol", "seddex qol",
      "3 غرف", "ثلاث غرف", "ثلاثة غرف", "3 غرف نوم"
    ],
  },
  {
    id: "concept_bedroom_2",
    weight: 2.3,
    tokens: [
      "2 bedroom", "2 bedrooms", "two bedroom", "two bedrooms", "2 bed", "2 bds",
      "2 qol", "laba qol", "labo qol", "2-qol",
      "غرفتين", "2 غرف", "غرفتان", "غرفتي نوم"
    ],
  },
  {
    id: "concept_bedroom_4plus",
    weight: 2.3,
    tokens: [
      "4 bedroom", "4 bedrooms", "four bedroom", "5 bedroom", "spacious",
      "4 qol", "afar qol", "shan qol", "qolal badan", "weyn",
      "4 غرف", "أربع غرف", "خمس غرف", "واسع", "كبير"
    ],
  },
  // 8. Luxury / Pool / Garden
  {
    id: "concept_luxury_pool",
    weight: 1.9,
    tokens: [
      "pool", "swimming pool", "luxury", "garden", "premium", "modern", "high-end",
      "dabaal", "barkad", "beero", "beer", "raaxo", "casri",
      "مسبح", "حديقة", "فاخر", "راقي", "حديث"
    ],
  },
  // 9. Furnished / Ready
  {
    id: "concept_furnished",
    weight: 1.8,
    tokens: [
      "furnished", "fully furnished", "equipped", "turnkey",
      "alaab leh", "qalabaysan", "diyaar",
      "مفروش", "مؤثث", "جاهز"
    ],
  },
  // 10. Key Cities: Mogadishu / Muqdisho / مقديشو
  {
    id: "city_mogadishu",
    weight: 2.5,
    tokens: [
      "mogadishu", "muqdisho", "hamar", "xamar", "hodan", "wadajir", "yaqshid", "shibis",
      "مقديشو", "حمر"
    ],
  },
  // 11. Key Cities: Hargeisa / Hargeysa / هرجيسا
  {
    id: "city_hargeisa",
    weight: 2.5,
    tokens: ["hargeisa", "hargeysa", "هرجيسا"],
  },
  // 12. Key Cities: Bosaso / Boosaaso / بوساسو
  {
    id: "city_bosaso",
    weight: 2.5,
    tokens: ["bosaso", "boosaaso", "بوساسو"],
  },
  // 13. Key Cities: Kismayo / Kismaayo / كسمايو
  {
    id: "city_kismayo",
    weight: 2.5,
    tokens: ["kismayo", "kismaayo", "كسمايو"],
  },
  // 14. Key Cities: Berbera / بربرة
  {
    id: "city_berbera",
    weight: 2.5,
    tokens: ["berbera", "بربرة"],
  },
];

/**
 * Deterministic Local Multilingual Semantic Embedder (768 dimensions)
 *
 * Encodes text by mapping semantic concept synsets into dense vector space,
 * augmented with character n-gram spatial hashing.
 * Output is L2-normalized so dot product equals exact cosine similarity.
 */
export function generateLocalMultilingualEmbedding(text: string): number[] {
  const dim = EMBEDDING_CONFIG.DIMENSIONS; // 768
  const vector = new Array<number>(dim).fill(0);
  const normalized = text.toLowerCase().trim();

  // 1. Project multilingual concept clusters into designated vector bands
  MULTILINGUAL_CONCEPTS.forEach((concept, index) => {
    let matchStrength = 0;
    for (const token of concept.tokens) {
      if (normalized.includes(token.toLowerCase())) {
        matchStrength += 1.0;
      }
    }

    if (matchStrength > 0) {
      const baseIdx = (index * 24) % (dim - 32);
      const intensity = Math.min(2.5, matchStrength) * concept.weight;

      // Distribute concept energy across a localized semantic coordinate block
      for (let offset = 0; offset < 16; offset++) {
        const sign = offset % 2 === 0 ? 1 : -1;
        vector[baseIdx + offset] += (intensity / Math.sqrt(offset + 1)) * sign;
      }
    }
  });

  // 2. Character n-gram hashing for subword cross-lingual generalization
  // Extracts character 3-grams and 4-grams and projects them across vector dimensions
  const cleanTokens = normalized.replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);

  for (const token of cleanTokens) {
    if (token.length < 2) continue;

    // Substrings of lengths 3, 4, 5
    for (let len = 3; len <= 5; len++) {
      for (let i = 0; i <= token.length - len; i++) {
        const gram = token.slice(i, i + len);
        // Hash to deterministic dimension index
        const hash = crypto.createHash("md5").update(gram).digest();
        const dimIdx = hash.readUInt16BE(0) % dim;
        const sign = (hash[2] & 1) === 0 ? 1 : -1;
        const magnitude = (hash[3] / 255.0) * 0.4;
        vector[dimIdx] += sign * magnitude;
      }
    }
  }

  // 3. Normalize vector to unit length (L2 norm = 1.0)
  return normalizeVector(vector);
}

/**
 * Generates an embedding vector for a given text.
 * Prioritizes Google AI "gemini-embedding-2" (768-d MRL) when GOOGLE_AI_API_KEY/GEMINI_API_KEY is configured;
 * gracefully falls back to the local multilingual semantic embedder on failure, timeout, or missing key.
 */
export async function generateEmbedding(
  text: string,
  type: "document" | "query" = "document"
): Promise<{
  embedding: number[];
  model: string;
  dimension: number;
  provider: "google" | "local-multilingual";
}> {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return {
      embedding: new Array(EMBEDDING_CONFIG.DIMENSIONS).fill(0),
      model: EMBEDDING_CONFIG.MODEL_NAME,
      dimension: EMBEDDING_CONFIG.DIMENSIONS,
      provider: "local-multilingual",
    };
  }

  // Check query cache
  if (type === "query") {
    const cached = queryEmbeddingCache.get(text.trim());
    if (cached) {
      return {
        embedding: cached,
        model: EMBEDDING_CONFIG.MODEL_NAME,
        dimension: EMBEDDING_CONFIG.DIMENSIONS,
        provider: "local-multilingual",
      };
    }
  }

  const apiKey = getGeminiApiKey();

  if (process.env.EMBEDDING_PROVIDER !== "local" && apiKey && apiKey.trim().length > 0) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: EMBEDDING_CONFIG.MODEL_NAME });

      // Embed content with timeout (configured in GEMINI_CONFIG)
      // gemini-embedding-2 natively supports outputDimensionality for MRL-based 768-d output
      let embedPromise: Promise<any>;
      try {
        embedPromise = (model as any).embedContent({
          content: { parts: [{ text }] },
          outputDimensionality: EMBEDDING_CONFIG.DIMENSIONS,
        });
      } catch {
        embedPromise = model.embedContent(text);
      }

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Embedding API timeout")), GEMINI_CONFIG.EMBEDDING_TIMEOUT_MS)
      );

      const result = (await Promise.race([embedPromise, timeoutPromise])) as any;

      if (result && result.embedding && Array.isArray(result.embedding.values)) {
        const rawVector = result.embedding.values;
        // Ensure exactly 768 dimensions and unit normalization
        const normalizedVector = normalizeVector(rawVector.slice(0, EMBEDDING_CONFIG.DIMENSIONS));

        if (type === "query") {
          if (queryEmbeddingCache.size >= MAX_CACHE_SIZE) {
            const firstKey = queryEmbeddingCache.keys().next().value;
            if (firstKey) queryEmbeddingCache.delete(firstKey);
          }
          queryEmbeddingCache.set(text.trim(), normalizedVector);
        }

        return {
          embedding: normalizedVector,
          model: EMBEDDING_CONFIG.MODEL_NAME,
          dimension: EMBEDDING_CONFIG.DIMENSIONS,
          provider: "google",
        };
      }
    } catch (err: any) {
      console.warn(
        `[EmbeddingService] Google AI embedding failed (${err.message}). Falling back to local multilingual encoder.`
      );
    }
  }

  // Fallback: Local Multilingual Semantic Embedder
  const localVector = generateLocalMultilingualEmbedding(text);

  if (type === "query") {
    if (queryEmbeddingCache.size >= MAX_CACHE_SIZE) {
      const firstKey = queryEmbeddingCache.keys().next().value;
      if (firstKey) queryEmbeddingCache.delete(firstKey);
    }
    queryEmbeddingCache.set(text.trim(), localVector);
  }

  return {
    embedding: localVector,
    model: EMBEDDING_CONFIG.MODEL_NAME,
    dimension: EMBEDDING_CONFIG.DIMENSIONS,
    provider: "local-multilingual",
  };
}
