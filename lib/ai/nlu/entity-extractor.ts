/**
 * Multilingual Entity Extractor for Real Estate Queries
 *
 * Extracts structured parameters from natural language in Somali, English, Arabic, and mixed queries:
 * - City / Location
 * - Property Type (normalized to schema: HOUSE, APARTMENT, VILLA, etc.)
 * - Bedroom count & operators (eq, gte, lte, between)
 * - Bathroom count
 * - Price constraints (maxPrice, minPrice, approxPrice, between)
 * - Parking & Furnished requirements
 * - Soft descriptive preferences (beach, quiet, modern, pool, solar, spacious, etc.)
 */

export interface NumericConstraint {
  operator: "eq" | "gte" | "lte" | "between" | "approx";
  value: number;
  maxValue?: number;
  rawMatchedText?: string;
}

export interface ExtractedEntities {
  city?: string;
  propertyType?: string;
  bedrooms?: NumericConstraint;
  bathrooms?: NumericConstraint;
  price?: {
    minPrice?: number;
    maxPrice?: number;
    approxPrice?: number;
    operator: "lte" | "gte" | "between" | "approx" | "eq";
    rawMatchedText?: string;
  };
  parking?: boolean;
  isFurnished?: boolean;
  purpose?: "SALE" | "RENT";
  amenities: string[];
  softPreferences: string[];
  rawEntities: Record<string, any>;
}

// 1. City Mappings (Standardized to actual database values)
const CITY_DICTIONARY: Record<string, string[]> = {
  Mogadishu: [
    "mogadishu", "muqdisho", "muqdisho ah", "muqdishu", "hamar", "xamar",
    "banaadir", "banadir", "مقديشو", "بندر"
  ],
  Hargeisa: [
    "hargeisa", "hargeysa", "hargaysa", "هرجيسا"
  ],
  Bosaso: [
    "bosaso", "boosaaso", "bosaaso", "بوساسو"
  ],
  Kismayo: [
    "kismayo", "kismaayo", "kismayu", "كسمايو"
  ],
  Garowe: [
    "garowe", "garoowe", "غاروي", "جروي"
  ],
  Baydhabo: [
    "baydhabo", "baidoa", "baydhaba", "بيداوا", "بيدوا"
  ],
  Berbera: [
    "berbera", "barbera", "بربرة"
  ],
};

// 2. Property Type Mappings (Strictly preserving distinct types)
const TYPE_DICTIONARY: Record<string, string[]> = {
  HOUSE: [
    "house", "home", "family home", "single family", "residential house",
    "guri", "guriga", "guryo",
    "منزل", "بيت", "دار"
  ],
  APARTMENT: [
    "apartment", "flat", "condo", "condominium",
    "dabaq", "apartment-ka", "qolal",
    "شقة", "شقق"
  ],
  VILLA: [
    "villa", "villas", "mansion", "compound",
    "fiilo", "villa-da",
    "فيلا", "فلل", "قصر"
  ],
  OFFICE: [
    "office", "offices", "workplace", "desk",
    "xafiis", "xafiiska",
    "مكتب", "مكاتب"
  ],
  LAND: [
    "land", "plot", "lot", "parcel", "ground",
    "dhul", "boos", "dhul banaan",
    "أرض", "قطعة أرض", "أراضي"
  ],
  COMMERCIAL: [
    "commercial", "shop", "store", "retail", "warehouse",
    "dukaan", "ganacsi", "goob ganacsi",
    "تجاري", "محل", "متجر", "مستودع"
  ],
  TOWNHOUSE: [
    "townhouse", "town home", "row house",
    "tawnhawz"
  ],
  STUDIO: [
    "studio", "bedsitter", "single room apartment",
    "istuudiyow", "استوديو"
  ],
};

// 3. Number word maps
const NUMBER_WORDS: Record<string, number> = {
  // English
  "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
  "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
  // Somali
  "hal": 1, "kow": 1, "laba": 2, "labo": 2, "saddex": 3, "seddex": 3,
  "afar": 4, "shan": 5, "lix": 6, "toddoba": 7, "sideed": 8, "sagaal": 9, "toban": 10,
  // Arabic
  "واحد": 1, "واحدة": 1, "غرفة واحدة": 1,
  "اثنين": 2, "اثنان": 2, "غرفتين": 2, "حمامين": 2,
  "ثلاث": 3, "ثلاثة": 3,
  "اربع": 4, "اربعة": 4, "أربع": 4, "أربعة": 4,
  "خمس": 5, "خمسة": 5,
  "ست": 6, "ستة": 6,
  "سبع": 7, "سبعة": 7,
  "ثمان": 8, "ثمانية": 8,
  "تسع": 9, "تسعة": 9,
  "عشر": 10, "عشرة": 10,
};

/**
 * Parses numeric price expressions across languages (handles 'k', 'kun', 'ألف', 'million', etc.)
 */
function parsePriceValue(rawNum: string, multiplierUnit?: string): number {
  let cleaned = rawNum.replace(/,/g, "").trim();
  let baseVal = parseFloat(cleaned);
  if (isNaN(baseVal)) return 0;

  if (multiplierUnit) {
    const unit = multiplierUnit.toLowerCase().trim();
    if (unit === "k" || unit === "kun" || unit === "ألف" || unit === "الف") {
      baseVal *= 1000;
    } else if (unit === "m" || unit === "million" || unit === "malyan" || unit === "milyan" || unit === "مليون") {
      baseVal *= 1000000;
    }
  }

  return Math.round(baseVal);
}

export function extractEntities(query: string): ExtractedEntities {
  const result: ExtractedEntities = {
    amenities: [],
    softPreferences: [],
    rawEntities: {},
  };

  if (!query || query.trim().length === 0) {
    return result;
  }

  const text = query.trim();

  // -------------------------------------------------------------
  // A. CITY EXTRACTION
  // -------------------------------------------------------------
  for (const [canonicalCity, aliases] of Object.entries(CITY_DICTIONARY)) {
    for (const alias of aliases) {
      const isArabic = /[\u0600-\u06FF]/.test(alias);
      const matchFound = isArabic
        ? text.includes(alias)
        : new RegExp(`\\b${alias}\\b`, "i").test(text);

      if (matchFound) {
        result.city = canonicalCity;
        result.rawEntities.city = alias;
        break;
      }
    }
    if (result.city) break;
  }

  // -------------------------------------------------------------
  // B. PROPERTY TYPE EXTRACTION
  // -------------------------------------------------------------
  for (const [canonicalType, aliases] of Object.entries(TYPE_DICTIONARY)) {
    for (const alias of aliases) {
      const isArabic = /[\u0600-\u06FF]/.test(alias);
      const matchFound = isArabic
        ? text.includes(alias)
        : new RegExp(`\\b${alias}\\b`, "i").test(text);

      if (matchFound) {
        result.propertyType = canonicalType;
        result.rawEntities.propertyType = alias;
        break;
      }
    }
    if (result.propertyType) break;
  }

  // -------------------------------------------------------------
  // C. BEDROOM EXTRACTION
  // -------------------------------------------------------------
  // 1. Digits: "3 bedroom", "3-bedroom", "3BR", "3 beds", "3 qol", "3 غرف"
  const bedDigitRegex = /(\d+)\s*(?:-|–|\s+)?\s*(?:bedrooms?|beds?|bed|bds?|br|qol|qolal|غرف نوم|غرف|غرفة)\b/iu;
  // 2. English / Somali words (with optional hyphen for "three-bedroom")
  const bedWordRegex = /(?:([a-zA-Z]+)\s*(?:-|–|\s+)\s*(?:bedrooms?|beds?|qol|qolal)|(?:qol|qolal)\s+([a-zA-Z]+))/iu;
  // 3. Arabic word forms
  const bedArabicRegex = /(ثلاث|ثلاثة|أربع|اربع|أربعة|اربعة|خمس|خمسة|ست|ستة|غرفتين|غرفة واحدة)\s*(?:غرف نوم|غرف|غرفة)?/u;

  let bedMatch = text.match(bedDigitRegex);
  let bedValue: number | undefined;
  let rawBedText = "";

  if (bedMatch) {
    bedValue = parseInt(bedMatch[1], 10);
    rawBedText = bedMatch[0];
  } else {
    // English/Somali word match
    const wordMatch = text.match(bedWordRegex);
    if (wordMatch) {
      const candidateWord = (wordMatch[1] || wordMatch[2] || "").toLowerCase().trim();
      if (NUMBER_WORDS[candidateWord]) {
        bedValue = NUMBER_WORDS[candidateWord];
        rawBedText = wordMatch[0];
      }
    }

    // Arabic word match
    if (!bedValue) {
      const arMatch = text.match(bedArabicRegex);
      if (arMatch) {
        const arWord = arMatch[1].trim();
        if (NUMBER_WORDS[arWord]) {
          bedValue = NUMBER_WORDS[arWord];
          rawBedText = arMatch[0];
        }
      }
    }
  }

  if (bedValue !== undefined && !isNaN(bedValue)) {
    let operator: "eq" | "gte" | "lte" = "eq";
    if (
      /\b(at least|minimum|min|ugu yaraan|iyo ka badan)\b/i.test(text) ||
      /(على الأقل|أكثر من)/u.test(text)
    ) {
      operator = "gte";
    } else if (
      /\b(up to|maximum|max|ugu badnaan|ama ka yar)\b/i.test(text) ||
      /(بحد أقصى|أقل من)/u.test(text)
    ) {
      operator = "lte";
    }

    result.bedrooms = {
      operator,
      value: bedValue,
      rawMatchedText: rawBedText || `${bedValue} bedrooms`,
    };
    result.rawEntities.bedrooms = result.bedrooms;
  }

  // -------------------------------------------------------------
  // D. BATHROOM EXTRACTION
  // -------------------------------------------------------------
  const bathDigitRegex = /(\d+)\s*(?:-|–|\s+)?\s*(?:bathrooms?|baths?|musqul|musqulo|suuli|حمامات|حمام)\b/iu;
  const bathMatch = text.match(bathDigitRegex);

  if (bathMatch) {
    const val = parseInt(bathMatch[1], 10);
    if (!isNaN(val)) {
      result.bathrooms = {
        operator: "gte",
        value: val,
        rawMatchedText: bathMatch[0],
      };
      result.rawEntities.bathrooms = result.bathrooms;
    }
  } else if (/حمامين/u.test(text)) {
    result.bathrooms = {
      operator: "gte",
      value: 2,
      rawMatchedText: "حمامين",
    };
    result.rawEntities.bathrooms = result.bathrooms;
  }

  // -------------------------------------------------------------
  // E. PRICE & FINANCIAL EXTRACTION
  // -------------------------------------------------------------
  // 1. Between range
  const betweenRangeRegex = /(?:between|ilaa|بين)\s*\$?(\d+(?:,\d+)?)\s*(k|kun|ألف|الف|m|million|malyan|مليون)?\s*(?:and|iyo|ilaa|و|-)\s*\$?(\d+(?:,\d+)?)\s*(k|kun|ألف|الف|m|million|malyan|مليون)?/iu;
  const betweenMatch = text.match(betweenRangeRegex);

  if (betweenMatch) {
    const minVal = parsePriceValue(betweenMatch[1], betweenMatch[2]);
    const maxVal = parsePriceValue(betweenMatch[3], betweenMatch[4]);
    if (minVal > 0 && maxVal > 0) {
      result.price = {
        operator: "between",
        minPrice: Math.min(minVal, maxVal),
        maxPrice: Math.max(minVal, maxVal),
        rawMatchedText: betweenMatch[0],
      };
      result.rawEntities.price = result.price;
    }
  }

  // 2. Around / Approximate
  if (!result.price) {
    const approxRegex = /(?:around|about|approx|approximate|qiyaastii|ku dhowaad|حوالي|تقريباً)\s*\$?(\d+(?:,\d+)?)\s*(k|kun|ألف|الف|m|million|malyan|مليون)?/iu;
    const approxMatch = text.match(approxRegex);
    if (approxMatch) {
      const targetVal = parsePriceValue(approxMatch[1], approxMatch[2]);
      if (targetVal > 0) {
        result.price = {
          operator: "approx",
          approxPrice: targetVal,
          minPrice: Math.round(targetVal * 0.85),
          maxPrice: Math.round(targetVal * 1.15),
          rawMatchedText: approxMatch[0],
        };
        result.rawEntities.price = result.price;
      }
    }
  }

  // 3. Less than / Under / Maximum
  if (!result.price) {
    const ltePrefixRegex = /(?:under|below|less than|max|up to|cheaper than|أقل من|دون|تحت|حتى)\s*\$?(\d+(?:,\d+)?)\s*(k|kun|ألف|الف|m|million|malyan|مليون)?/iu;
    const lteSuffixRegex = /\$?(\d+(?:,\d+)?)\s*(k|kun|ألف|الف|m|million|malyan|مليون)?\s*(?:oo\s+(?:dollar|doolar)\s+)?(?:ka yar|aan ka badnayn|ugu badnaan)/iu;

    const prefixMatch = text.match(ltePrefixRegex);
    const suffixMatch = text.match(lteSuffixRegex);

    if (prefixMatch) {
      const val = parsePriceValue(prefixMatch[1], prefixMatch[2]);
      if (val > 0) {
        result.price = {
          operator: "lte",
          maxPrice: val,
          rawMatchedText: prefixMatch[0],
        };
        result.rawEntities.price = result.price;
      }
    } else if (suffixMatch) {
      const val = parsePriceValue(suffixMatch[1], suffixMatch[2]);
      if (val > 0) {
        result.price = {
          operator: "lte",
          maxPrice: val,
          rawMatchedText: suffixMatch[0],
        };
        result.rawEntities.price = result.price;
      }
    }
  }

  // 4. Greater than / Above / Minimum
  if (!result.price) {
    const gtePrefixRegex = /(?:above|over|more than|min|at least|higher than|أكثر من|أعلى من|فوق)\s*\$?(\d+(?:,\d+)?)\s*(k|kun|ألف|الف|m|million|malyan|مليون)?/iu;
    const gteSuffixRegex = /\$?(\d+(?:,\d+)?)\s*(k|kun|ألف|الف|m|million|malyan|مليون)?\s*(?:oo\s+(?:dollar|doolar)\s+)?(?:ka badan|ka sarreeya|ugu yaraan)/iu;

    const prefixMatch = text.match(gtePrefixRegex);
    const suffixMatch = text.match(gteSuffixRegex);

    if (prefixMatch) {
      const val = parsePriceValue(prefixMatch[1], prefixMatch[2]);
      if (val > 0) {
        result.price = {
          operator: "gte",
          minPrice: val,
          rawMatchedText: prefixMatch[0],
        };
        result.rawEntities.price = result.price;
      }
    } else if (suffixMatch) {
      const val = parsePriceValue(suffixMatch[1], suffixMatch[2]);
      if (val > 0) {
        result.price = {
          operator: "gte",
          minPrice: val,
          rawMatchedText: suffixMatch[0],
        };
        result.rawEntities.price = result.price;
      }
    }
  }

  // 5. Standalone price fallback if accompanied by currency or 'k'
  if (!result.price) {
    const budgetPattern = /(?:budget|qiimo|سعر)?\s*(?:\$|usd)\s*(\d+(?:,\d+)?)\s*(k|kun|ألف|الف|m|million)?/iu;
    const budgetMatch = text.match(budgetPattern);
    if (budgetMatch) {
      const val = parsePriceValue(budgetMatch[1], budgetMatch[2]);
      if (val > 0) {
        result.price = {
          operator: "lte",
          maxPrice: val,
          rawMatchedText: budgetMatch[0],
        };
        result.rawEntities.price = result.price;
      }
    }
  }

  // -------------------------------------------------------------
  // F. PARKING EXTRACTION
  // -------------------------------------------------------------
  if (
    /\b(parking|garage|car park|baarkin|baabuur)\b/i.test(text) ||
    /(موقف|موقف سيارات|كراج)/u.test(text)
  ) {
    result.parking = true;
    result.rawEntities.parking = true;
  }

  // -------------------------------------------------------------
  // G. FURNISHED EXTRACTION
  // -------------------------------------------------------------
  if (
    /\b(furnished|fully furnished|alaab leh|qalabaysan)\b/i.test(text) ||
    /(مفروش|مؤثث)/u.test(text)
  ) {
    result.isFurnished = true;
    result.rawEntities.isFurnished = true;
  }

  // -------------------------------------------------------------
  // H. PURPOSE EXTRACTION (Sale vs Rent)
  // -------------------------------------------------------------
  if (
    /\b(for sale|buy|purchase|iib|iib ah|gadasho)\b/i.test(text) ||
    /(للبيع|شراء)/u.test(text)
  ) {
    result.purpose = "SALE";
    result.rawEntities.purpose = "SALE";
  } else if (
    /\b(for rent|rent|lease|kiro|kiree|kireysto)\b/i.test(text) ||
    /(للإيجار|للايجار|استئجار)/u.test(text)
  ) {
    result.purpose = "RENT";
    result.rawEntities.purpose = "RENT";
  }

  // -------------------------------------------------------------
  // I. SOFT PREFERENCES & DESCRIPTIVE QUALITIES
  // -------------------------------------------------------------
  // 1. Beach / Ocean / Coast
  if (
    /\b(beach|ocean|sea|coastal|waterfront|liido|lido)\b/i.test(text) ||
    /\b(xeeb|xeebta|badda)\b/i.test(text) ||
    /(شاطئ|بحر|ساحل)/u.test(text)
  ) {
    result.softPreferences.push("near the beach");
  }

  // 2. Quiet / Peaceful
  if (
    /\b(quiet|peaceful|calm|degan)\b/i.test(text) ||
    /\b(meel degan|xaafad degan)\b/i.test(text) ||
    /(هادئ|حي هادئ|مكان هادئ)/u.test(text)
  ) {
    result.softPreferences.push("quiet neighborhood");
  }

  // 3. Modern / Luxury
  if (
    /\b(modern|luxury|contemporary|newly built|new|cusub|casri|raaxo)\b/i.test(text) ||
    /(حديث|فاخر|راقي|عصري)/u.test(text)
  ) {
    result.softPreferences.push("modern luxury");
  }

  // 4. Spacious / Large
  if (
    /\b(spacious|large|huge|weyn|balaaran)\b/i.test(text) ||
    /(واسع|كبير)/u.test(text)
  ) {
    result.softPreferences.push("spacious layout");
  }

  // 5. Family-friendly
  if (
    /\b(family|family-friendly|qoys|reer)\b/i.test(text) ||
    /(عائلي|مناسب للعائلات)/u.test(text)
  ) {
    result.softPreferences.push("family-friendly");
  }

  // 6. Solar / Green Energy
  if (
    /\b(solar|green energy|shamsi|koronto shamsi)\b/i.test(text) ||
    /(طاقة شمسية)/u.test(text)
  ) {
    result.amenities.push("solar");
    result.softPreferences.push("solar energy");
  }

  // 7. Swimming Pool
  if (
    /\b(pool|swimming pool|dabaal|barkad)\b/i.test(text) ||
    /(مسبح|حمام سباحة)/u.test(text)
  ) {
    result.amenities.push("pool");
    result.softPreferences.push("swimming pool");
  }

  // 8. Garden
  if (
    /\b(garden|yard|beero|beer)\b/i.test(text) ||
    /(حديقة|فناء)/u.test(text)
  ) {
    result.amenities.push("garden");
    result.softPreferences.push("garden yard");
  }

  // 9. Security
  if (
    /\b(security|secure|guarded|ilaalo|ilaalsan)\b/i.test(text) ||
    /(أمن|حراسة|مؤمن)/u.test(text)
  ) {
    result.amenities.push("security");
    result.softPreferences.push("24/7 security");
  }

  return result;
}
